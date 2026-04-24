// app/api/pipeline/route.js
// NeuroCine Pipeline — fully self-contained, no external imports

const DEFAULT_NEGATIVE_PROMPT = [
  "blur", "bad anatomy", "extra fingers", "duplicate people",
  "deformed face", "plastic skin", "low detail", "watermark",
  "text artifacts", "flat lighting", "oversaturated CGI",
  "inconsistent face", "changed outfit", "identity drift"
].join(", ");

function normalizeText(value = "", max = 260) {
  const s = String(value || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

function buildIdentityLock({ characterDNA = {}, seed = "777777", referenceImage = "" } = {}) {
  const dna = {
    name:     characterDNA.name     || "",
    gender:   characterDNA.gender   || "",
    age:      characterDNA.age      || "",
    face:     characterDNA.face     || characterDNA.dna || "",
    hair:     characterDNA.hair     || "",
    outfit:   characterDNA.outfit   || "",
    style:    characterDNA.style    || "cinematic realism",
    lighting: characterDNA.lighting || "high contrast shadows",
    camera:   characterDNA.camera   || "35mm",
  };

  const parts = [
    dna.name, dna.gender,
    dna.age ? `${dna.age} years old` : "",
    dna.face, dna.hair,
    dna.outfit ? `wearing ${dna.outfit}` : "",
    dna.style, dna.lighting, dna.camera,
  ].filter(Boolean);

  return {
    dna, seed, referenceImage,
    identity: parts.join(", "),
    lockPhrase: "same character, consistent face, same hairstyle, same outfit, same lighting style, no identity drift",
  };
}

function sceneRequiresCharacter(frame = {}, scene = "") {
  if (Array.isArray(frame.characters_in_frame) && frame.characters_in_frame.length > 0) return true;
  const text = `${scene} ${frame.visual || ""} ${frame.vo || frame.voice || ""}`.toLowerCase();
  return /\b(agent|officer|detective|witness|soldier|general|president|scientist|man|woman|person|bureaucrat|harold|vance)\b|агент|офицер|детектив|свидетел|солдат|генерал|президент|уч[её]н|мужчин|женщин|человек|бюрократ/.test(text);
}

function buildSceneFirstImagePrompt({ frame = {}, identityLock, style = "", continuity = "", refNote = "", seedNote = "" } = {}) {
  const scene = normalizeText(frame.image_prompt || frame.imgPrompt_EN || frame.visual || frame.scene || "", 760);
  const hasIdentity = Boolean(identityLock?.identity && identityLock.identity.length > 4);
  const needsCharacter = hasIdentity && sceneRequiresCharacter(frame, scene);
  const characterBlock = needsCharacter
    ? `CHARACTER LOCK ONLY IF VISIBLE: ${identityLock.identity}. ${identityLock.lockPhrase || "no identity drift"}`
    : "NO VISIBLE MAIN CHARACTER: do not default to portrait, do not center identity character";

  return normalizeText([
    `SCENE PRIMARY FOCUS: ${scene || "specific visual evidence from the current script frame"}`,
    characterBlock,
    `CONTINUITY: ${continuity}`,
    `STYLE LOCK: ${style}`,
    refNote,
    seedNote,
    "RULES: follow this exact frame from the current VO; scene/event/evidence comes before character; do not invent unrelated visuals; no subtitles, no UI, no watermark; text only if it is a deliberate document/evidence detail from the scene"
  ].filter(Boolean).join(". "), 1200);
}

function buildSceneFirstVideoPrompt({ frame = {}, identityLock, style = "", continuity = "", refNote = "", seedNote = "" } = {}) {
  const scene = normalizeText(frame.video_prompt || frame.vidPrompt_EN || frame.visual || frame.scene || "", 620);
  const hasIdentity = Boolean(identityLock?.identity && identityLock.identity.length > 4);
  const needsCharacter = hasIdentity && sceneRequiresCharacter(frame, scene);

  return normalizeText([
    `ANIMATE CURRENT FRAME: ${scene || "cinematic motion based strictly on this frame"}`,
    needsCharacter ? "preserve same face and outfit for visible character only" : "no character continuity required; focus on evidence, environment, objects, light, dust, camera tension",
    "smooth camera motion, subject/object motion, environment motion",
    continuity, style, refNote, seedNote,
    "do not change topic, do not add unrelated dialogue or unrelated characters"
  ].filter(Boolean).join(", "), 1000);
}

function enrichFrames({ frames = [], identityLock, styleLock = "" } = {}) {
  const style = styleLock || "cinematic, high contrast, consistent color grading, trailer-like continuity";

  return frames.map((frame, index) => {
    const continuity = index === 0
      ? "opening shot, establish the exact script evidence/event"
      : "continue previous scene logic, preserve lighting continuity, follow current VO beat";

    const refNote  = identityLock.referenceImage ? "use reference image as identity anchor only when the character is visible" : "";
    const seedNote = identityLock.seed && identityLock.seed !== "777777" ? `seed ${identityLock.seed}` : "";
    const hasIdentity = identityLock.identity && identityLock.identity.length > 4;

    const image_prompt = buildSceneFirstImagePrompt({ frame, identityLock, style, continuity, refNote, seedNote });
    const video_prompt = buildSceneFirstVideoPrompt({ frame, identityLock, style, continuity, refNote, seedNote });

    return {
      ...frame,
      id: frame.id || `frame_${String(index + 1).padStart(2, "0") }`,
      time: frame.time || frame.timecode || `${index * 3}-${index * 3 + 3}s`,
      image_prompt,
      video_prompt,
      negative_prompt: frame.negative_prompt || DEFAULT_NEGATIVE_PROMPT,
      seed: identityLock.seed,
      reference_image: identityLock.referenceImage,
      continuity_note: continuity,
      identity_lock_applied: hasIdentity,
      character_visible_in_prompt: hasIdentity && sceneRequiresCharacter(frame, image_prompt),
      duration: frame.duration || 3,
      image: { type: "image", url: "", prompt: image_prompt, note: "Connect real image API here" },
      video: { type: "video", url: "", prompt: video_prompt, note: "Connect real video API here" },
    };
  });
}

function buildTimeline(frames = []) {
  let cursor = 0;
  return frames.map((frame, index) => {
    const duration = Number(frame.duration || 3);
    const item = {
      id: frame.id || `clip_${index + 1}`,
      start: cursor, duration,
      video: frame.video,
      image: frame.image,
      vo:  frame.vo || frame.voice || "",
      sfx: frame.sfx || "",
      transition:
        index === 0     ? "cold_open" :
        index % 4 === 0 ? "pattern_interrupt" :
        index % 3 === 0 ? "reveal_cut" : "hard_cut",
      continuity_note: frame.continuity_note || "",
    };
    cursor += duration;
    return item;
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const scriptPackage = body.scriptPackage || body;

    if (!scriptPackage?.frames?.length) {
      return Response.json({ error: "scriptPackage.frames is required" }, { status: 400 });
    }

    const identityLock = buildIdentityLock({
      characterDNA: body.characterDNA || scriptPackage.character_dna_used || {},
      seed: body.seed || "777777",
      referenceImage: body.referenceImage || "",
    });

    const preparedFrames = enrichFrames({
      frames: scriptPackage.frames,
      identityLock,
      styleLock: body.styleLock || "cinematic, high contrast, same color grading, trailer-like continuity",
    });

    const timeline = buildTimeline(preparedFrames);

    return Response.json({
      status: "timeline_ready",
      videoUrl: "",
      identityLock,
      frames: preparedFrames,
      timeline,
      scriptPackage,
      note: "Timeline ready. Connect real Grok/Veo providers to generate actual video.",
    });

  } catch (error) {
    return Response.json(
      { error: error?.message || "Pipeline error" },
      { status: 500 }
    );
  }
}

