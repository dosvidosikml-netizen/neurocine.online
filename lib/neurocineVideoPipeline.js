// lib/neurocineVideoPipeline.js
// NeuroCine Final Video Pipeline
// script JSON -> locked prompts -> image anchors -> video clips -> timeline package

export const DEFAULT_NEGATIVE_PROMPT = [
  "blur",
  "bad anatomy",
  "extra fingers",
  "duplicate people",
  "deformed face",
  "plastic skin",
  "low detail",
  "watermark",
  "text artifacts",
  "flat lighting",
  "oversaturated CGI",
  "inconsistent face",
  "changed outfit",
  "identity drift"
].join(", ");

export function normalizeText(value = "", max = 220) {
  const s = String(value || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

export function buildIdentityLock({ characterDNA = {}, seed = "777777", referenceImage = "" } = {}) {
  const dna = {
    name: characterDNA.name || "Alex",
    gender: characterDNA.gender || "male",
    age: characterDNA.age || "28",
    face: characterDNA.face || "sharp jawline, expressive eyes",
    hair: characterDNA.hair || "short dark hair",
    outfit: characterDNA.outfit || "black hoodie",
    style: characterDNA.style || "modern cinematic",
    lighting: characterDNA.lighting || "high contrast shadows",
    camera: characterDNA.camera || "35mm close-up",
  };

  const identity = [
    dna.name,
    dna.gender,
    `${dna.age} years old`,
    dna.face,
    dna.hair,
    `wearing ${dna.outfit}`,
    dna.style,
    dna.lighting,
    dna.camera,
  ].join(", ");

  return {
    dna,
    seed,
    referenceImage,
    identity,
    lockPhrase:
      "same character, consistent face, same hairstyle, same outfit, same lighting style, no identity drift",
  };
}

function sceneRequiresCharacter(frame = {}, scene = "") {
  if (Array.isArray(frame.characters_in_frame) && frame.characters_in_frame.length > 0) return true;
  const text = `${scene} ${frame.visual || ""} ${frame.vo || frame.voice || ""}`.toLowerCase();
  return /\b(agent|officer|detective|witness|soldier|general|president|scientist|man|woman|person|bureaucrat|harold|vance)\b|агент|офицер|детектив|свидетел|солдат|генерал|президент|уч[её]н|мужчин|женщин|человек|бюрократ/.test(text);
}

function buildSceneFirstImagePrompt({ frame = {}, identityLock, style = "", continuity = "", ref = "", seed = "" } = {}) {
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
    ref,
    seed,
    "RULES: follow this exact frame from the current VO; scene/event/evidence comes before character; do not invent unrelated visuals; no subtitles, no UI, no watermark; text only if it is a deliberate document/evidence detail from the scene"
  ].filter(Boolean).join(". "), 1200);
}

function buildSceneFirstVideoPrompt({ frame = {}, identityLock, style = "", continuity = "", ref = "", seed = "" } = {}) {
  const scene = normalizeText(frame.video_prompt || frame.vidPrompt_EN || frame.visual || frame.scene || "", 620);
  const hasIdentity = Boolean(identityLock?.identity && identityLock.identity.length > 4);
  const needsCharacter = hasIdentity && sceneRequiresCharacter(frame, scene);

  return normalizeText([
    `ANIMATE CURRENT FRAME: ${scene || "cinematic motion based strictly on this frame"}`,
    needsCharacter ? "preserve same face and outfit for visible character only" : "no character continuity required; focus on evidence, environment, objects, light, dust, camera tension",
    "smooth image-to-video animation",
    "camera motion + subject/object motion + environment motion",
    continuity,
    style,
    ref,
    seed,
    "do not change topic, do not add unrelated dialogue or unrelated characters"
  ].filter(Boolean).join(", "), 1000);
}

export function enrichFramesForVideo({ frames = [], identityLock, styleLock = "" } = {}) {
  const style = styleLock || "cinematic, high contrast, consistent color grading, same mood, trailer-like continuity";

  return frames.map((frame, index) => {
    const continuity =
      index === 0
        ? "opening shot, establish the exact script evidence/event"
        : "continue previous scene logic, preserve lighting continuity, follow current VO beat";

    const ref = identityLock.referenceImage
      ? "use reference image as identity anchor only when the character is visible"
      : "";

    const seed = identityLock.seed ? `seed ${identityLock.seed}` : "";

    const image_prompt = buildSceneFirstImagePrompt({ frame, identityLock, style, continuity, ref, seed });
    const video_prompt = buildSceneFirstVideoPrompt({ frame, identityLock, style, continuity, ref, seed });

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
      identity_lock_applied: Boolean(identityLock?.identity && identityLock.identity.length > 4),
      character_visible_in_prompt: sceneRequiresCharacter(frame, image_prompt),
      duration: frame.duration || 3,
    };
  });
}

export async function generateImageAnchors({ frames, imageProvider, onProgress }) {
  if (typeof imageProvider !== "function") {
    throw new Error("imageProvider function is required");
  }

  const output = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    onProgress?.({
      stage: "image",
      index: i,
      total: frames.length,
      frameId: frame.id,
      message: `Generating image anchor ${i + 1}/${frames.length}`,
    });

    const image = await imageProvider({
      prompt: frame.image_prompt,
      negative_prompt: frame.negative_prompt,
      seed: frame.seed,
      reference_image: frame.reference_image,
      frame,
    });

    output.push({ ...frame, image });
  }

  return output;
}

export async function generateVideoClips({ frames, videoProvider, onProgress }) {
  if (typeof videoProvider !== "function") {
    throw new Error("videoProvider function is required");
  }

  const output = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    onProgress?.({
      stage: "video",
      index: i,
      total: frames.length,
      frameId: frame.id,
      message: `Generating video clip ${i + 1}/${frames.length}`,
    });

    const video = await videoProvider({
      prompt: frame.video_prompt,
      image: frame.image,
      seed: frame.seed,
      reference_image: frame.reference_image,
      frame,
    });

    output.push({ ...frame, video });
  }

  return output;
}

export function buildTimeline(frames = []) {
  let cursor = 0;

  return frames.map((frame, index) => {
    const duration = Number(frame.duration || 3);

    const item = {
      id: frame.id || `clip_${index + 1}`,
      start: cursor,
      duration,
      video: frame.video,
      image: frame.image,
      vo: frame.vo || frame.voice || "",
      sfx: frame.sfx || "",
      transition:
        index === 0
          ? "cold_open"
          : index % 4 === 0
          ? "pattern_interrupt"
          : index % 3 === 0
          ? "reveal_cut"
          : "hard_cut",
      continuity_note: frame.continuity_note || "",
    };

    cursor += duration;
    return item;
  });
}

export async function renderFinalTimeline({ timeline, renderProvider, onProgress }) {
  if (typeof renderProvider !== "function") {
    return {
      status: "timeline_ready",
      videoUrl: "",
      timeline,
      note:
        "No renderProvider was supplied. Timeline package is ready for external editor or renderer.",
    };
  }

  onProgress?.({
    stage: "render",
    index: 0,
    total: 1,
    message: "Rendering final video",
  });

  const videoUrl = await renderProvider({ timeline });

  return {
    status: "rendered",
    videoUrl,
    timeline,
  };
}

export async function runNeuroCineFinalPipeline({
  scriptPackage,
  characterDNA,
  seed = "777777",
  referenceImage = "",
  styleLock = "",
  imageProvider,
  videoProvider,
  renderProvider,
  onProgress,
}) {
  if (!scriptPackage?.frames?.length) {
    throw new Error("scriptPackage.frames is required");
  }

  const identityLock = buildIdentityLock({
    characterDNA: characterDNA || scriptPackage.character_dna_used || {},
    seed,
    referenceImage,
  });

  onProgress?.({
    stage: "prepare",
    index: 0,
    total: scriptPackage.frames.length,
    message: "Preparing locked prompts",
  });

  const preparedFrames = enrichFramesForVideo({
    frames: scriptPackage.frames,
    identityLock,
    styleLock,
  });

  const imageFrames = await generateImageAnchors({
    frames: preparedFrames,
    imageProvider,
    onProgress,
  });

  const videoFrames = await generateVideoClips({
    frames: imageFrames,
    videoProvider,
    onProgress,
  });

  const timeline = buildTimeline(videoFrames);

  const render = await renderFinalTimeline({
    timeline,
    renderProvider,
    onProgress,
  });

  return {
    status: render.status,
    videoUrl: render.videoUrl,
    identityLock,
    frames: videoFrames,
    timeline,
    scriptPackage,
  };
}
