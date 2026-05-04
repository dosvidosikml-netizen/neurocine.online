// engine/videoPromptAgent.js
// NeuroCine Video Prompt Agent v2.8 — Grok/Flow Minor-Safe I2V Lock
// Purpose: build clean image/video prompts with separate compact Grok mode,
// no VO by default, no "No No" garbage, and safer wording for minor-related scenes.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensurePromptPrefix(text = "", prefix) {
  let out = cleanText(text);
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function ensureSfxLine(text = "", sfx = "") {
  const finalSfx = cleanAudioText(sfx || "subtle realistic ambience");
  let out = cleanText(text);
  out = out.replace(/\bNo\s+SFX\s*:/gi, "SFX:");
  if (!/\bSFX\s*:/i.test(out)) out = `${out} SFX: ${finalSfx}.`;
  return cleanText(out);
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
    ...(Array.isArray(storyboard?.character_lock) ? storyboard.character_lock.map((c) => [c.name, c.age, c.description, c.face_features, c.clothing, c.physical_condition].filter(Boolean).join(" ")) : []),
  ].filter(Boolean).join(" "));
}

export function hasMinorContext(frame = {}, storyboard = {}) {
  const text = collectContext(frame, storyboard).toLowerCase();
  return /(\bchild\b|\bboy\b|\bgirl\b|\bkid\b|\bminor\b|\bteen\b|\bteenager\b|\b9\s*y|\b10\s*y|\b11\s*y|\b12\s*y|\b13\s*y|\b14\s*y|\b15\s*y|\b16\s*y|\b17\s*y|реб[её]нок|мальчик|девочк|несовершеннолет|дитина|хлопчик|дівчин)/i.test(text);
}

function cleanAudioText(text = "") {
  return cleanText(text)
    .replace(/crowd murmur/gi, "distant non-verbal crowd ambience")
    .replace(/human voices/gi, "non-verbal human ambience")
    .replace(/voices/gi, "non-verbal ambience")
    .replace(/dialogue/gi, "no dialogue")
    .replace(/speech/gi, "no speech")
    .replace(/narration/gi, "no narration")
    .replace(/voiceover/gi, "no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no")
    .replace(/\s+/g, " ")
    .trim();
}

function removeGeneratedNames(text = "", storyboard = {}) {
  let out = String(text || "");
  const names = new Set([
    "Mikhail", "Tomas", "Thomas", "John", "Peter", "Aldric", "Marta", "Luc", "Matthieu", "Etienne",
    ...(Array.isArray(storyboard?.character_lock) ? storyboard.character_lock.map((c) => c.name).filter(Boolean) : []),
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
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no");

  if (!includeVo) {
    out = out
      .replace(/\bvoiceover\b[^.]*\./gi, "")
      .replace(/\bVO\b[^.]*\./gi, "")
      .replace(/\bnarration\b[^.]*\./gi, "")
      .replace(/\bdialogue\b[^.]*\./gi, "")
      .replace(/\bspoken line\b[^.]*\./gi, "")
      .replace(/\bspeech\b[^.]*\./gi, "");
  }

  return cleanText(out);
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

function getFrameAction(frame = {}) {
  return cleanText(String(frame.video_prompt_en || frame.image_prompt_en || frame.description_en || frame.description_ru || "")
    .replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "")
    .replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "")
    .replace(/\s*SFX\s*:.*$/is, "")
    .replace(/\s*Maintain EXACT same character appearance[^.]*\./gi, "")
    .replace(/\s*Ultra consistency[^.]*\./gi, "")
    .trim());
}

export function buildImagePrompt({ frame = {}, storyboard = {}, target = "veo3" } = {}) {
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const characterBlock = buildCharacterBlock(storyboard.character_lock, { compact: target === "grok", omitNames: target === "grok" });
  const sceneVisual = cleanText(String(frame.image_prompt_en || frame.description_en || frame.description_ru || "")
    .replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, ""));
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

function buildGrokCheapPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  const sfx = cleanAudioText(frame.sfx || "mud, fabric, wind, distant non-verbal ambience");
  let action = getFrameAction(frame) || "the subject holds position with subtle movement";
  action = removeGeneratedNames(action, storyboard);
  action = sanitizeSensitiveMinorTerms(action, minorSafe);

  // Keep only the first strong sentence for Grok Cheap.
  const firstSentence = action.split(/(?<=[.!?])\s+/)[0] || action;
  const noVoice = includeVo
    ? ""
    : "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
  const continuity = isFirstFrame(frame)
    ? "Maintain the exact appearance from the uploaded frame."
    : "Maintain exact character appearance, clothing, lighting and historical setting; do not clone previous composition.";
  const ultra = consistency === "ultra"
    ? "Do not change face, age, clothing, dirt level, lighting, or period."
    : "Keep visual continuity.";

  return limitWords(cleanText([
    noVoice,
    "Animate only the uploaded frame. Do not recompose, add characters, change framing, add subtitles, UI or watermark.",
    "6-second subtle image-to-video shot:",
    firstSentence,
    "Use only micro-motion: handheld drift, breathing, fabric movement, smoke or wind if visible.",
    `SFX: ${sfx}.`,
    continuity,
    ultra,
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" ")), 95);
}

function buildGrokProPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  const sfx = cleanAudioText(frame.sfx || "subtle realistic ambience");
  let action = removeGeneratedNames(getFrameAction(frame), storyboard);
  action = sanitizeSensitiveMinorTerms(action, minorSafe);
  const camera = cleanText(frame.camera || "subtle handheld documentary camera movement");
  const noVoice = includeVo ? "" : "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
  const continuity = isFirstFrame(frame)
    ? "Maintain exact appearance from the uploaded frame."
    : "Maintain exact character appearance, face, clothing and condition as previous frame without copying composition.";
  const ultra = consistency === "ultra"
    ? "Ultra consistency: keep face structure, age, clothing, dirt level, lighting style, color grade and historical period stable."
    : "Keep continuity stable.";

  return limitWords(cleanText([
    noVoice,
    "ANIMATE ONLY THE UPLOADED FRAME. Do not recompose or add characters.",
    `${camera}.`,
    action,
    "Natural overcast light, damp historical realism, subtle 35mm grain, real weight and inertia.",
    `SFX: ${sfx}.`,
    continuity,
    ultra,
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" ")), 125);
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
  const action = sanitizeSensitiveMinorTerms(removeGeneratedNames(getFrameAction(frame), storyboard), minorSafe) || "subtle movement only";
  const camera = cleanText(frame.camera || "static documentary shot with subtle handheld drift");
  const sfx = cleanAudioText(frame.sfx || "subtle realistic ambience");
  const characterBlock = buildCharacterBlock(storyboard.character_lock, { compact: false, omitNames: true });
  const audioBlock = includeVo && frame.vo_ru
    ? `Audio: ${sfx}. Voice/dialogue allowed by user only if needed.`
    : `Audio: ${sfx}. No dialogue, no voiceover; ambient sound and SFX only.`;
  const continuity = isFirstFrame(frame)
    ? "Maintain exact character appearance, clothing and condition from the uploaded frame."
    : "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";

  const pro = cleanText([
    `${camera}, ${duration}-second shot.`,
    characterBlock ? `Subject: ${characterBlock}.` : "",
    `Action: ${action}.`,
    "Camera behavior: organic handheld micro-shake, slight focus breathing, natural exposure shifts.",
    "Lighting: natural available light, soft bounce fill, realistic shadow penumbra.",
    "Color grade: lifted blacks, desaturated shadows, natural skin tones, subtle 35mm film grain.",
    "Physics: realistic inertia, grounded contact with surfaces, fabric reacting to movement.",
    audioBlock,
    `Format: ${aspectRatio}, 24fps, live-action photographic realism.`,
    continuity,
    consistency === "ultra" ? "Ultra consistency: do not change face structure, age, clothing, dirt level, lighting style, color grade, or historical period; do not clone the previous composition." : "",
    minorSafe ? "No violence shown, no injury shown, no graphic content." : "",
  ].filter(Boolean).join(" "));

  if (promptMode === "cheap") return limitWords(pro, 95);
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
  out = cleanAudioText(out);
  out = sanitizeSensitiveMinorTerms(out, minorSafe);
  out = out.replace(/\bNo\s+No\b/gi, "No").replace(/no no/gi, "no");
  if (!includeVo) {
    const hardNoVoice = "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
    if (String(target).toLowerCase() === "grok" && !out.startsWith("NO SPEECH")) out = `${hardNoVoice} ${out}`;
    if (!/No dialogue, no voiceover/i.test(out) && String(target).toLowerCase() !== "grok") {
      out = `${out} No dialogue, no voiceover; ambient sound and SFX only.`;
    }
  }
  return cleanText(out);
}

export function buildFramePromptsForTarget({ frame, storyboard, target = "veo3", includeVo = false, promptMode = "pro", consistency = "ultra" }) {
  const imagePrompt = ensurePromptPrefix(
    stripBannedWords(buildImagePrompt({ frame, storyboard, target })),
    "SCENE PRIMARY FOCUS:"
  );
  const videoPrompt = ensurePromptPrefix(
    ensureSfxLine(finalizePromptCleaners(buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency }), { frame, storyboard, includeVo, target }), frame?.sfx),
    "ANIMATE CURRENT FRAME:"
  );

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
  if (target === "grok") {
    const wordCount = cleanText(frame.video_prompt_en || "").split(/\s+/).length;
    if (wordCount > 130) errors.push(`Grok video prompt too long: ${wordCount} words (max ~130)`);
    if (/human voices|voiceover|dialogue|narration/i.test(frame.video_prompt_en || "")) {
      // Only flag if no hard prohibition exists.
      if (!/^ANIMATE CURRENT FRAME:\s*NO SPEECH/i.test(frame.video_prompt_en || "")) errors.push("Grok prompt may allow voices/dialogue");
    }
  }
  return { ok: errors.length === 0, errors };
}
