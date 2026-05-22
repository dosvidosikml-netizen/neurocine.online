// engine/videoPromptAgent.js
// NeuroCine Video Prompt Agent v3.2 — dominant SFX planner + final de-duplicator
// Purpose: build clean image/video prompts with no recursive prompt bloat,
// one Action block, one Audio block, one SFX block, and scene-logical primary sound cues.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensurePromptPrefix(text = "", prefix) {
  let out = cleanText(text);
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function limitWords(text = "", max = 80) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  if (words.length <= max) return cleanText(text);
  return words.slice(0, max).join(" ").replace(/[,:;—-]+$/, "") + ".";
}

function isFirstFrame(frame = {}) {
  const id = String(frame?.id || "");
  const n = Number(id.match(/\d+/)?.[0] || frame?.index || 0);
  return n === 1 || id === "frame_01" || id === "F01";
}

function collectContext(frame = {}, storyboard = {}) {
  return cleanText([
    frame.id,
    frame.description_ru,
    frame.description_en,
    frame.image_prompt_en,
    frame.video_prompt_en,
    frame.vo_ru,
    frame.sfx,
    storyboard?.topic,
    storyboard?.script,
    ...(Array.isArray(storyboard?.character_lock)
      ? storyboard.character_lock.map((c) => [c.name, c.age, c.description, c.face_features, c.clothing, c.physical_condition].filter(Boolean).join(" "))
      : []),
  ].filter(Boolean).join(" "));
}

export function hasMinorContext(frame = {}, storyboard = {}) {
  const text = collectContext(frame, storyboard).toLowerCase();
  return /(\bchild\b|\bboy\b|\bgirl\b|\bkid\b|\bminor\b|\bteen\b|\bteenager\b|\b9\s*y|\b10\s*y|\b11\s*y|\b12\s*y|\b13\s*y|\b14\s*y|\b15\s*y|\b16\s*y|\b17\s*y|реб[её]нок|мальчик|девочк|несовершеннолет|дитина|хлопчик|дівчин)/i.test(text);
}

function cleanAudioCue(text = "") {
  return cleanText(text)
    .replace(/crowd murmur/gi, "distant non-verbal crowd ambience")
    .replace(/human voices/gi, "non-verbal human ambience")
    .replace(/\bvoices\b/gi, "non-verbal ambience")
    .replace(/\bdialogue\b/gi, "no dialogue")
    .replace(/\bspeech\b/gi, "no speech")
    .replace(/\bnarration\b/gi, "no narration")
    .replace(/\bvoiceover\b/gi, "no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(text = "", label = "Audio") {
  const re = new RegExp(`\\b${label}\\s*:\\s*([\\s\\S]*?)(?=\\bAudio\\s*:|\\bSFX\\s*:|\\bShot progression\\s*:|\\bCamera behavior\\s*:|\\bLighting\\s*:|\\bColor grade\\s*:|\\bPhysics\\s*:|\\bMaintain\\b|\\bUltra consistency\\b|$)`, "i");
  return cleanText(String(text || "").match(re)?.[1] || "");
}

function splitCues(text = "") {
  return cleanText(text)
    .replace(/\.+/g, ".")
    .split(/[,;|/]|\band\b|\+|\.\s+/i)
    .map((x) => cleanAudioCue(x).replace(/^SFX\s*:/i, "").replace(/^Audio\s*:/i, "").trim())
    .filter((x) => x && x.length > 2);
}

function dedupeList(list = []) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const value = cleanText(item).replace(/\.+$/, "");
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function hasAny(text = "", words = []) {
  const lower = String(text || "").toLowerCase();
  return words.some((w) => lower.includes(w));
}

function buildAudioPlan({ frame = {}, storyboard = {}, action = "" } = {}) {
  const frameAudioContext = cleanText([
    frame.sfx,
    frame.audio,
    frame.sound,
    extractSection(frame.video_prompt_en, "Audio"),
    extractSection(frame.video_prompt_en, "SFX"),
  ].filter(Boolean).join(" "));

  const context = cleanText([
    frameAudioContext,
    frame.description_ru,
    frame.description_en,
    frame.image_prompt_en,
    frame.video_prompt_en,
    action,
  ].filter(Boolean).join(" "));

  const extracted = [
    frame.sfx,
    frame.audio,
    frame.sound,
  ].flatMap(splitCues);

  const cues = [];

  if (hasAny(frameAudioContext, ["alarm", "siren", "alert", "warning", "beacon", "red alarm", "тревог", "сирен", "маяк"])) {
    cues.push("loud rotating alarm siren synchronized with the flashing red beacon");
  }
  if (hasAny(context, ["ventilation", "ventilator", "air duct", "вентиляц", "вытяж"])) {
    cues.push("ventilation hum");
  }
  if (hasAny(context, ["electrical hum", "electric hum", "monitor", "console", "control panel", "электр", "гул", "монитор", "пульт"])) {
    cues.push("low electrical hum from monitors and control panels");
  }
  if (hasAny(context, ["cable", "hanging cables", "кабел", "провод"])) {
    cues.push("faint cable vibration");
  }
  if (hasAny(context, ["dust", "smoke", "пыль", "дым"])) {
    cues.push("soft dust movement in stale air");
  }

  const finalCues = dedupeList([...extracted, ...cues]);
  if (!finalCues.length) finalCues.push("subtle realistic ambience");

  const primary = finalCues.find((x) => /alarm|siren|alert|warning|тревог|сирен/i.test(x)) || finalCues[0];
  const background = finalCues.filter((x) => x !== primary).slice(0, 4);

  return {
    primary,
    background,
    sfxLine: dedupeList([primary, ...background]).join(", "),
    hasDominantAlarm: /alarm|siren|alert|warning|тревог|сирен/i.test(primary),
  };
}

function stripGeneratedPromptSections(text = "") {
  let out = String(text || "");
  out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "");
  out = out.replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "");
  out = out.replace(/\bASPECT RATIO\s*:\s*[\d:]+\.?[\s\S]*$/i, "");
  out = out.replace(/\bSubject\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bREFERENCE VISIBILITY RULE\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bWORLD OBJECT RULE\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bShot progression\s*:[\s\S]*?(?=\bCamera behavior\s*:|\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bCamera behavior\s*:[\s\S]*?(?=\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bLighting\s*:[\s\S]*?(?=\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bColor grade\s*:[\s\S]*?(?=\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bPhysics\s*:[\s\S]*?(?=\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bAudio\s*:[\s\S]*?(?=\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bSFX\s*:[\s\S]*$/gi, "");
  out = out.replace(/\bMaintain exact[^.]*\./gi, "");
  out = out.replace(/\bMaintain EXACT[^.]*\./gi, "");
  out = out.replace(/\bUltra consistency[^.]*\./gi, "");
  out = out.replace(/\bNo Maintain\b/gi, "");
  out = out.replace(/\bAction\s*:\s*Action\s*:/gi, "Action:");
  out = out.replace(/^Action\s*:/i, "");
  return cleanText(out);
}

function removeGeneratedNames(text = "", storyboard = {}) {
  let out = String(text || "");
  const names = new Set([
    "Mikhail", "Tomas", "Thomas", "John", "Peter", "Aldric", "Marta", "Luc", "Matthieu", "Etienne",
  ]);
  for (const name of names) {
    const safe = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${safe}\\b`, "g"), "the character");
  }
  return cleanText(out);
}

function sanitizeSensitiveMinorTerms(text = "", minorSafe = false) {
  let out = String(text || "");
  if (!minorSafe) return cleanText(out);
  const replacements = [
    [/\bchild execution\b/gi, "tense medieval court scene"],
    [/\bexecution\b/gi, "public sentence context"],
    [/\bhanging\b/gi, "wooden gallows structure"],
    [/\bhanged\b/gi, "sentenced"],
    [/\bnoose\b/gi, "rope above the platform"],
    [/\bkill(?:ed|ing)?\b/gi, "condemn"],
    [/\bdeath\b/gi, "grave consequence"],
    [/\bpunishment of a child\b/gi, "historical court consequence"],
    [/казн[ьиь]/gi, "суровый приговор"],
    [/повешен/gi, "приговорён"],
    [/петл[яюи]/gi, "верёвка над помостом"],
  ];
  for (const [re, repl] of replacements) out = out.replace(re, repl);
  return cleanText(out);
}

function stripNoVoiceGarbage(text = "", includeVo = false) {
  let out = cleanText(text)
    .replace(/No dialogue, no No dialogue, no voiceover;?/gi, "No dialogue, no voiceover;")
    .replace(/No dialogue, no no dialogue, no voiceover;?/gi, "No dialogue, no voiceover;")
    .replace(/No dialogue, No voiceover/gi, "No dialogue, no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no")
    .replace(/\bNo Maintain\b/gi, "Maintain");

  if (!includeVo) {
    out = out
      .replace(/\bVoice\/no dialogue allowed by user only if needed\.?/gi, "")
      .replace(/\bVoice\/dialogue allowed by user only if needed\.?/gi, "")
      .replace(/\bvoiceover\b(?!; ambient sound)[^.]*\./gi, "")
      .replace(/\bVO\b[^.]*\./gi, "")
      .replace(/\bnarration\b[^.]*\./gi, "")
      .replace(/\bspoken line\b[^.]*\./gi, "")
      .replace(/\bspeech\b[^.]*\./gi, "");
  }

  return cleanText(out);
}

function keepOneSection(text = "", label = "Audio") {
  const src = String(text || "");
  const re = new RegExp(`\\b${label}\\s*:[\\s\\S]*?(?=\\bShot progression\\s*:|\\bCamera behavior\\s*:|\\bLighting\\s*:|\\bColor grade\\s*:|\\bPhysics\\s*:|\\bAudio\\s*:|\\bSFX\\s*:|\\bMaintain\\b|\\bUltra consistency\\b|\\bFormat\\s*:|$)`, "gi");
  const matches = src.match(re) || [];
  if (matches.length <= 1) return cleanText(src);
  let first = true;
  return cleanText(src.replace(re, (m) => {
    if (first) {
      first = false;
      return m;
    }
    return "";
  }));
}

function dedupeFinalPrompt(text = "") {
  let out = cleanText(text)
    .replace(/\bAction\s*:\s*Action\s*:/gi, "Action:")
    .replace(/\.\./g, ".")
    .replace(/\s+\./g, ".")
    .replace(/\bNo Maintain\b/gi, "Maintain");

  out = keepOneSection(out, "Shot progression");
  out = keepOneSection(out, "Camera behavior");
  out = keepOneSection(out, "Lighting");
  out = keepOneSection(out, "Color grade");
  out = keepOneSection(out, "Physics");
  out = keepOneSection(out, "Audio");
  out = keepOneSection(out, "SFX");

  const maintainFirst = out.match(/Maintain exact character appearance, clothing and condition from the uploaded frame\.?/i)?.[0]
    || out.match(/Maintain exact character appearance, clothing, lighting and condition from the uploaded frame\.?/i)?.[0]
    || out.match(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/i)?.[0];

  out = out
    .replace(/Maintain exact character appearance, clothing and condition from the uploaded frame\.?/gi, "")
    .replace(/Maintain exact character appearance, clothing, lighting and condition from the uploaded frame\.?/gi, "")
    .replace(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/gi, "");
  if (maintainFirst) out = `${out} ${maintainFirst.replace(/\.?$/, ".")}`;

  return cleanText(out)
    .replace(/No dialogue,\s*No voiceover/gi, "No dialogue, no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/\.\s*\./g, ".");
}

export const REALISM_ANCHORS_SKIN = [
  "visible skin pores on nose bridge and cheeks",
  "natural skin texture with micro-imperfections",
  "subsurface scattering on skin",
  "fine facial asymmetry",
  "peach fuzz catching light",
  "subtle under-eye shadows",
  "subsurface flush on cheekbones",
];

export const REALISM_ANCHORS_HAIR_FABRIC = [
  "individual hair strands visible",
  "fabric weave detail in focus zone",
  "tension wrinkles from stress points",
  "fabric gravity drape",
];

export const REALISM_ANCHORS_OPTICS = [
  "subtle 35mm film grain",
  "natural lens vignette",
  "lens chromatic aberration on high-contrast edges",
  "real optical bokeh",
  "luminance grain in shadows",
];

export const BANNED_WORDS = [
  "epic", "stunning", "beautiful", "masterpiece", "high quality", "8K", "8k", "ultra HD", "4K",
  "perfect", "flawless", "breathtaking", "hyperrealistic", "AI generated", "rendered", "CGI",
  "octane render", "trending on artstation",
];

export const NEGATIVE_PROMPT_BASE =
  "plastic skin, waxy texture, beauty filter, skin smoothing, oversaturated colors, soap opera effect, motion interpolation, morphing features, extra fingers, dead eyes, frozen face, lifeless gaze, AI artifacts, fake bokeh, smooth airbrushed skin, HDR tonemapping, oversharpened edges, subtitles, watermark, logo, UI text on screen";

export function buildCharacterBlock(characterLock = [], { compact = false, omitNames = false } = {}) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return "";
  const take = compact ? characterLock.slice(0, 1) : characterLock;
  return take.map((c, i) => {
    const label = omitNames ? (Number(c.age) < 18 ? "the child" : `the character ${i + 1}`) : (c.name || `Character ${i + 1}`);
    const parts = [
      label,
      c.age ? `${c.age}y old` : null,
      c.face_features || c.description,
      c.hair,
      c.clothing,
      c.physical_condition,
    ].filter(Boolean);
    return parts.join(", ");
  }).join(" | ");
}

function getRelevantCharacterLock(characterLock = [], frame = {}) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return [];
  const haystack = cleanText([
    frame.description_ru,
    frame.description_en,
    stripGeneratedPromptSections(frame.image_prompt_en),
    stripGeneratedPromptSections(frame.video_prompt_en),
    frame.vo_ru,
  ].filter(Boolean).join(" ")).toLowerCase();
  const relevant = characterLock.filter((c) => {
    const name = cleanText(c.name || "").toLowerCase();
    return name.length >= 3 && haystack.includes(name);
  });
  return relevant.length ? relevant : characterLock.slice(0, 1);
}

function getFrameAction(frame = {}) {
  const preferred = [
    frame.story_action_en,
    frame.action_en,
    frame.motion,
    frame.action,
    frame.description_en,
    frame.image_prompt_en,
    frame.description_ru,
  ];
  for (const value of preferred) {
    const cleaned = stripGeneratedPromptSections(value || "");
    if (cleaned && cleaned.length > 12) return cleaned;
  }
  return "";
}

export function buildImagePrompt({ frame = {}, storyboard = {}, target = "veo3" } = {}) {
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const relevantCharacters = getRelevantCharacterLock(storyboard.character_lock, frame);
  const characterBlock = buildCharacterBlock(relevantCharacters, { compact: target === "grok", omitNames: target === "grok" });
  const sceneVisual = cleanText(stripGeneratedPromptSections(frame.image_prompt_en || frame.description_en || frame.description_ru || ""));
  const camera = cleanText(frame.camera || "static documentary frame, natural lens perspective");
  const anchors = [REALISM_ANCHORS_SKIN[0], REALISM_ANCHORS_HAIR_FABRIC[0], REALISM_ANCHORS_OPTICS[0]].join(", ");

  if (target === "grok") {
    return cleanText([
      sceneVisual,
      characterBlock ? `Subject: ${characterBlock}` : "",
      `Camera: ${camera}`,
      "natural overcast light, documentary realism, damp historical texture",
      anchors,
      `${aspectRatio}, live-action photographic frame`,
    ].filter(Boolean).join(". "));
  }

  return cleanText([
    sceneVisual,
    characterBlock ? `Subject: ${characterBlock}` : "",
    `Camera: ${camera}`,
    "Lighting: natural available light, soft ground bounce fill, realistic shadow penumbra",
    "Color grade: desaturated shadows, lifted blacks, natural skin tones",
    `Realism anchors: ${anchors}`,
    `Format: ${aspectRatio}, live-action photographic frame`,
  ].filter(Boolean).join(". "));
}

function getShotProgression(frame = {}) {
  const id = String(frame?.id || "");
  const n = Number(id.match(/\d+/)?.[0] || frame?.index || 1);
  const phase = n <= 3 ? "HOOK" : n <= 8 ? "BUILD" : n <= 15 ? "ESCALATION" : "PAYOFF";
  const rhythm = {
    HOOK: "immediate visual hook, minimal motion, suspended dread",
    BUILD: "slow reveal, camera discovers one new clue, tension grows without rushing",
    ESCALATION: "stronger motion cues, pressure rises, environmental movement becomes more noticeable",
    PAYOFF: "controlled final emphasis, hold the question, do not over-animate"
  }[phase];
  return { n, phase, rhythm };
}

function buildGrokCheapPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  const action = sanitizeSensitiveMinorTerms(removeGeneratedNames(getFrameAction(frame), storyboard), minorSafe) || "the subject holds position with subtle movement";
  const firstSentence = action.split(/(?<=[.!?])\s+/)[0] || action;
  const audio = buildAudioPlan({ frame, storyboard, action });
  const noVoice = includeVo ? "" : "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
  const continuity = isFirstFrame(frame)
    ? "Maintain the exact appearance from the uploaded frame."
    : "Maintain exact character appearance, clothing, lighting and historical setting; do not clone previous composition.";
  const ultra = consistency === "ultra"
    ? "Do not change face, age, clothing, dirt level, lighting, or period."
    : "Keep visual continuity.";

  return limitWords(dedupeFinalPrompt([
    noVoice,
    "Animate only the uploaded frame. Do not recompose, add characters, change framing, add subtitles, UI or watermark.",
    "6-second subtle image-to-video shot:",
    firstSentence,
    audio.hasDominantAlarm ? "Audio priority: make the alarm siren clearly audible and dominant from the first frame." : "",
    "Use only micro-motion: handheld drift, breathing, fabric movement, smoke or wind if visible.",
    `SFX: ${audio.sfxLine}.`,
    continuity,
    ultra,
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" ")), 105);
}

function buildGrokProPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  let action = removeGeneratedNames(getFrameAction(frame), storyboard);
  action = sanitizeSensitiveMinorTerms(action, minorSafe) || "the visible scene holds tension with subtle physical motion";
  const camera = cleanText(frame.camera || "subtle handheld documentary camera movement");
  const audio = buildAudioPlan({ frame, storyboard, action });
  const noVoice = includeVo ? "" : "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
  const shot = getShotProgression(frame);
  const continuity = isFirstFrame(frame)
    ? "Maintain exact appearance from the uploaded frame."
    : "Maintain exact character appearance, face, clothing and condition as previous frame without copying composition.";
  const ultra = consistency === "ultra"
    ? "Ultra consistency: keep face structure, age, clothing, dirt level, lighting style, color grade and historical period stable."
    : "Keep continuity stable.";

  return limitWords(dedupeFinalPrompt([
    noVoice,
    "ANIMATE ONLY THE UPLOADED FRAME. Do not recompose or add characters.",
    `${camera}.`,
    action,
    `Shot progression: ${shot.phase} — ${shot.rhythm}.`,
    audio.hasDominantAlarm ? "Audio priority: loud alarm siren must dominate over background room tone." : "",
    "Natural overcast light, damp historical realism, subtle 35mm grain, real weight and inertia.",
    `SFX: ${audio.sfxLine}.`,
    continuity,
    ultra,
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" ")), 135);
}

export function buildVideoPromptFor({
  frame = {},
  storyboard = {},
  target = "veo3",
  includeVo = false,
  promptMode = "pro",
  consistency = "ultra",
} = {}) {
  const normalizedTarget = String(target || "veo3").toLowerCase();

  if (normalizedTarget === "grok") {
    const prompt = promptMode === "cheap"
      ? buildGrokCheapPrompt({ frame, storyboard, includeVo, consistency })
      : buildGrokProPrompt({ frame, storyboard, includeVo, consistency });
    return cleanText(prompt.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, ""));
  }

  const minorSafe = hasMinorContext(frame, storyboard);
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const duration = Number(frame.duration || 3);
  const shot = getShotProgression(frame);
  const action = sanitizeSensitiveMinorTerms(removeGeneratedNames(getFrameAction(frame), storyboard), minorSafe) || "subtle movement only";
  const camera = cleanText(frame.camera || "static documentary shot with subtle handheld drift");
  const audio = buildAudioPlan({ frame, storyboard, action });
  const relevantCharacters = getRelevantCharacterLock(storyboard.character_lock, frame);
  const characterBlock = buildCharacterBlock(relevantCharacters, { compact: false, omitNames: false });
  const audioBlock = includeVo && frame.vo_ru
    ? `Audio: primary ${audio.primary}; background ${audio.background.join(", ") || "subtle realistic ambience"}. Voice/dialogue allowed by user only if needed.`
    : `Audio: PRIMARY SFX — ${audio.primary}. Background: ${audio.background.join(", ") || "subtle realistic ambience"}. No dialogue, no voiceover; ambient sound and SFX only.`;
  const continuity = isFirstFrame(frame)
    ? "Maintain exact character appearance, clothing and condition from the uploaded frame."
    : "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";

  const pro = dedupeFinalPrompt([
    `${camera}, ${duration}-second shot.`,
    characterBlock ? `Subject: ${characterBlock}.` : "",
    `Action: ${action}.`,
    `Shot progression: ${shot.phase} — ${shot.rhythm}.`,
    "Camera behavior: organic handheld micro-shake, slight focus breathing, natural exposure shifts; motion must support the current story beat, not decorate it.",
    "Lighting: natural available light, soft bounce fill, realistic shadow penumbra.",
    "Color grade: lifted blacks, desaturated shadows, natural skin tones, subtle 35mm film grain.",
    "Physics: realistic inertia, grounded contact with surfaces, fabric reacting to movement.",
    audioBlock,
    `SFX: ${audio.sfxLine}.`,
    `Format: ${aspectRatio}, 24fps, live-action photographic realism.`,
    continuity,
    consistency === "ultra" ? "Ultra consistency: do not change face structure, age, clothing, dirt level, lighting style, color grade, or historical period; do not clone the previous composition. Maintain story rhythm from previous frame while varying the camera angle naturally." : "",
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" "));

  if (promptMode === "cheap") return limitWords(pro, 105);
  return pro;
}

const BANNED_REPLACEMENTS = {
  epic: "intense",
  stunning: "vivid",
  beautiful: "striking",
  masterpiece: "production-grade",
  "high quality": "production-grade",
  "8K": "high resolution",
  "8k": "high resolution",
  "ultra HD": "high resolution",
  "4K": "high resolution",
  perfect: "precise",
  flawless: "controlled",
  breathtaking: "arresting",
  hyperrealistic: "photorealistic",
  "AI generated": "photographed",
  rendered: "photographed",
  CGI: "photographed",
  "octane render": "natural light photograph",
  "trending on artstation": "documentary realism",
};

export function stripBannedWords(text = "") {
  let out = String(text || "");
  for (const [banned, replacement] of Object.entries(BANNED_REPLACEMENTS)) {
    const re = new RegExp(`\\b${banned.replace(/\s+/g, "\\s+")}\\b`, "gi");
    out = out.replace(re, replacement);
  }
  return cleanText(out).replace(/,\s*,+/g, ",");
}

export function finalizePromptCleaners(text = "", { frame = {}, storyboard = {}, includeVo = false, target = "veo3" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  let out = stripBannedWords(text);
  out = stripNoVoiceGarbage(out, includeVo);
  out = sanitizeSensitiveMinorTerms(out, minorSafe);
  out = dedupeFinalPrompt(out);

  if (!includeVo) {
    const hardNoVoice = "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
    if (String(target).toLowerCase() === "grok" && !out.startsWith("NO SPEECH")) out = `${hardNoVoice} ${out}`;
    if (!/No dialogue, no voiceover/i.test(out) && String(target).toLowerCase() !== "grok") {
      out = `${out} No dialogue, no voiceover; ambient sound and SFX only.`;
    }
  }
  return dedupeFinalPrompt(out);
}

function ensureSfxLine(text = "", frame = {}, storyboard = {}) {
  let out = dedupeFinalPrompt(text).replace(/\bNo\s+SFX\s*:/gi, "SFX:");
  if (!/\bSFX\s*:/i.test(out)) {
    const action = getFrameAction(frame);
    const audio = buildAudioPlan({ frame, storyboard, action });
    out = `${out} SFX: ${audio.sfxLine}.`;
  }
  return dedupeFinalPrompt(out);
}

export function buildFramePromptsForTarget({ frame, storyboard, target = "veo3", includeVo = false, promptMode = "pro", consistency = "ultra" }) {
  const imagePrompt = ensurePromptPrefix(
    stripBannedWords(buildImagePrompt({ frame, storyboard, target })),
    "SCENE PRIMARY FOCUS:"
  );
  const rawVideo = buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency });
  const cleanedVideo = ensureSfxLine(finalizePromptCleaners(rawVideo, { frame, storyboard, includeVo, target }), frame, storyboard);
  const videoPrompt = ensurePromptPrefix(cleanedVideo, "ANIMATE CURRENT FRAME:");

  return {
    image_prompt_en: imagePrompt,
    video_prompt_en: videoPrompt,
    negative_prompt: NEGATIVE_PROMPT_BASE,
    target,
  };
}

export function validateFramePrompts({ frame, storyboard, target = "veo3" }) {
  const errors = [];
  const text = `${frame.image_prompt_en || ""} ${frame.video_prompt_en || ""}`;
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) errors.push(`banned word: "${word}"`);
  }
  if (frame.image_prompt_en && !/^SCENE PRIMARY FOCUS:/i.test(frame.image_prompt_en)) errors.push("image prompt missing SCENE PRIMARY FOCUS prefix");
  if (frame.video_prompt_en && !/^ANIMATE CURRENT FRAME:/i.test(frame.video_prompt_en)) errors.push("video prompt missing ANIMATE CURRENT FRAME prefix");
  if (frame.video_prompt_en && !/\bSFX\s*:/i.test(frame.video_prompt_en)) errors.push("video prompt missing embedded SFX block");
  if (/Action:\s*Action:|No Maintain|Shot progression:[\s\S]*Shot progression:|Audio:[\s\S]*Audio:|SFX:[\s\S]*SFX:/i.test(frame.video_prompt_en || "")) {
    errors.push("video prompt contains duplicated generated sections");
  }
  if (/alarm|siren|alert|warning/i.test(`${frame.sfx || ""} ${frame.video_prompt_en || ""}`) && !/PRIMARY SFX\s*—\s*[^.]*alarm|PRIMARY SFX\s*—\s*[^.]*siren|Audio priority/i.test(frame.video_prompt_en || "")) {
    errors.push("alarm/siren cue is not promoted as primary audio event");
  }
  if (target === "grok") {
    const wordCount = cleanText(frame.video_prompt_en || "").split(/\s+/).length;
    if (wordCount > 150) errors.push(`Grok video prompt too long: ${wordCount} words (max ~150)`);
    if (/human voices|voiceover|dialogue|narration/i.test(frame.video_prompt_en || "")) {
      if (!/^ANIMATE CURRENT FRAME:\s*NO SPEECH/i.test(frame.video_prompt_en || "")) errors.push("Grok prompt may allow voices/dialogue");
    }
  }
  return { ok: errors.length === 0, errors };
}
