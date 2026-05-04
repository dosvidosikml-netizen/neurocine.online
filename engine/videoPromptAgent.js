// engine/videoPromptAgent.js
// NeuroCine Video Prompt Agent v1
// Генератор image и video промтов под Veo 3 и Grok Imagine.
// Работает с frame из sceneEngine_v2 + character_lock.
//
// ВАЖНО: модели читают первые токены сильнее. Поэтому image_prompt и video_prompt
// строятся по жёсткой структуре — visual hook первым, character lock дословно,
// технические теги в конце.


function ensurePromptPrefix(text = "", prefix) {
  let out = String(text || "").trim();
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function ensureSfxLine(text = "", sfx = "") {
  const finalSfx = String(sfx || "subtle realistic ambience").trim();
  let out = String(text || "").trim();
  if (!/\bSFX\s*:/i.test(out)) out = `${out} SFX: ${finalSfx}.`;
  return out.replace(/\s+/g, " ").trim();
}

// ────────────────────────────────────────────────────────────────────────────
// REALISM ANCHORS — то, что убирает "AI-мыло" и пластик-кожу.
// Эти теги ЯВНО прописываются в каждый промт. Без них — выходит soap opera.
// ────────────────────────────────────────────────────────────────────────────
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
  "subtle 35mm film grain (Kodak Vision3 500T)",
  "natural lens vignette",
  "lens chromatic aberration on high-contrast edges",
  "real bokeh from f/1.8",
  "ISO 1600 luminance grain in shadows",
];

// ────────────────────────────────────────────────────────────────────────────
// BANNED WORDS — слова, которые делают промт хуже, не лучше.
// Используются для валидации output. Если найдены — промт переписывается.
// ────────────────────────────────────────────────────────────────────────────
export const BANNED_WORDS = [
  "cinematic", // слишком общее, заменяется конкретикой (ARRI Alexa, anamorphic)
  "epic",
  "stunning",
  "beautiful",
  "masterpiece",
  "high quality",
  "8K",
  "8k",
  "ultra HD",
  "4K", // resolution tags не помогают video models в 2026
  "perfect",
  "flawless",
  "breathtaking",
  "hyperrealistic",
  "AI generated",
  "rendered",
  "CGI",
  "octane render",
  "trending on artstation",
];

// ────────────────────────────────────────────────────────────────────────────
// NEGATIVE PROMPT — анти-AI-look, обязательный для каждого кадра.
// ────────────────────────────────────────────────────────────────────────────
export const NEGATIVE_PROMPT_BASE =
  "plastic skin, waxy texture, beauty filter, skin smoothing, oversaturated colors, " +
  "soap opera effect, motion interpolation, morphing features, extra fingers, " +
  "dead eyes, frozen face, lifeless gaze, AI artifacts, fake bokeh, " +
  "smooth airbrushed skin, HDR tonemapping, oversharpened edges, " +
  "subtitles, watermark, logo, UI text on screen";

// ────────────────────────────────────────────────────────────────────────────
// CHARACTER LOCK — строит verbatim-блок персонажа из character_lock.
// Это критично для face consistency между кадрами.
// ────────────────────────────────────────────────────────────────────────────
export function roleDescriptorFromCharacter(c = {}) {
  const rawName = String(c.name || "").toLowerCase();
  const age = Number(c.age || 0);
  if (/judge|судья/.test(rawName)) return "the judge";
  if (/father|priest|свящ|monk|abbot/.test(rawName)) return "the priest";
  if (/mother|мать/.test(rawName)) return "the mother";
  if (/executioner|палач/.test(rawName)) return "the executioner";
  if (age && age < 14) return "the child";
  if (age && age < 18) return "the teenager";
  return "the person";
}

export function buildCharacterBlock(characterLock = [], { includeNames = false } = {}) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return "";
  return characterLock
    .map((c) => {
      const role = includeNames && c.name ? c.name : roleDescriptorFromCharacter(c);
      const parts = [
        role,
        c.age ? `${c.age}y old` : null,
        c.face_features || c.description,
        c.hair,
        c.clothing,
        c.physical_condition,
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join(" | ");
}

export function isFirstStoryboardFrame(frame = {}) {
  const id = String(frame.id || "").toLowerCase();
  if (/frame[_-]?0?1$/.test(id) || /^f0?1$/.test(id)) return true;
  const start = Number(frame.start);
  return Number.isFinite(start) && start <= 0;
}

export function removeCharacterNames(text = "", storyboard = {}) {
  let out = String(text || "");
  const locks = Array.isArray(storyboard?.character_lock) ? storyboard.character_lock : [];
  for (const c of locks) {
    const name = String(c?.name || "").trim();
    if (!name) continue;
    const replacement = roleDescriptorFromCharacter(c);
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "gi"), replacement);
  }
  return out;
}

export function cleanVideoPromptText(text = "", { storyboard = {}, includeVo = false } = {}) {
  let out = String(text || "");
  out = removeCharacterNames(out, storyboard);
  out = out
    .replace(/\bNo\s+SFX\s*:/gi, "SFX:")
    .replace(/No\s+No\s+dialogue/gi, "No dialogue")
    .replace(/no\s+No\s+dialogue/gi, "no dialogue")
    .replace(/No dialogue,\s*no\s+No dialogue,\s*no voiceover/gi, "No dialogue, no voiceover")
    .replace(/No dialogue,\s*no dialogue,\s*no voiceover/gi, "No dialogue, no voiceover")
    .replace(/No voiceover,\s*no voiceover/gi, "No voiceover")
    .replace(/\s+/g, " ")
    .trim();

  if (!includeVo) {
    out = out
      .replace(/Voiceover[^.]*\./gi, "")
      .replace(/VO meaning[^.]*\./gi, "")
      .replace(/narrator[^.]*\./gi, "")
      .replace(/spoken line[^.]*\./gi, "")
      .replace(/character speech[^.]*\./gi, "")
      .replace(/dialogue allowed[^.]*\./gi, "")
      .replace(/\s+/g, " ")
      .trim();
    out = out.replace(/(?:No dialogue,\s*no voiceover;?\s*ambient sound and SFX only\.?\s*)+/gi, "").trim();
    out = `${out} No dialogue, no voiceover; ambient sound and SFX only.`;
  }
  return out.replace(/\s+/g, " ").trim();
}

export function buildContinuityLine(frame = {}, consistency = "normal") {
  const base = isFirstStoryboardFrame(frame)
    ? "Maintain EXACT character appearance, face, clothing, and condition from the uploaded final 2K frame."
    : "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";
  if (consistency !== "ultra") return base;
  return `${base} Ultra consistency: do not change face structure, age, clothing, dirt level, injuries, lighting style, color grade, or historical period; do not clone the previous composition.`;
}

export function compactVideoPrompt(text = "", { maxWords = 95, preserveContinuity = false } = {}) {
  let source = String(text || "").replace(/\s+/g, " ").trim();
  let preserved = "";
  if (preserveContinuity) {
    const match = source.match(/Maintain EXACT[^.]*\.(?: Ultra consistency:[^.]*\.)?/i);
    if (match) {
      preserved = match[0].trim();
      source = source.replace(match[0], "").replace(/\s+/g, " ").trim();
    }
  }
  const words = source.split(/\s+/).filter(Boolean);
  let keep = words.length <= maxWords ? source : words.slice(0, maxWords).join(" ");
  keep = keep.replace(/[,;:]?\s*$/, ".").trim();
  return [keep, preserved].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ────────────────────────────────────────────────────────────────────────────
// IMAGE PROMPT — для генерации starting frame (image-to-video pipeline)
// Структура: [HOOK] → [CHARACTER VERBATIM] → [ENV] → [CAMERA/LENS] →
// [LIGHTING/GRADE] → [REALISM ANCHORS] → [FORMAT/RATIO]
// Длина: 60-120 слов. Без banned words.
// ────────────────────────────────────────────────────────────────────────────
export function buildImagePrompt({
  frame = {},
  storyboard = {},
  target = "veo3",  // "veo3" | "grok"
} = {}) {
  const characterBlock = buildCharacterBlock(storyboard.character_lock);
  const aspectRatio = storyboard.aspect_ratio || "9:16";

  // Извлекаем visual описание сцены, очищенное от старых префиксов
  const sceneVisual = String(frame.image_prompt_en || frame.description_ru || "")
    .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
    .replace(/^historical documentary reconstruction[^.]*\.\s*/i, "")
    .trim();

  const camera = String(frame.camera || "static medium shot, 35mm lens").trim();

  // Realism anchors — выбираем 4 разных типа для плотности без повторений
  const anchors = [
    REALISM_ANCHORS_SKIN[0],
    REALISM_ANCHORS_SKIN[3],
    REALISM_ANCHORS_HAIR_FABRIC[0],
    REALISM_ANCHORS_OPTICS[0],
  ].join(", ");

  // GROK любит короче и плотнее с visual hook первым
  if (target === "grok") {
    // Берём первое полное предложение или укорачиваем на границе слова
    const sentences = sceneVisual.split(/(?<=[.!?])\s+/);
    const hookFirst = sentences[0] || sceneVisual.slice(0, 100).replace(/\s+\S*$/, "");
    const rest = sentences.slice(1).join(" ");
    return [
      hookFirst,
      characterBlock ? `Subject: ${characterBlock}` : "",
      rest,
      `Camera: ${camera}`,
      "Natural available light, Kodak Portra 400 color response, lifted blacks, warm skin tones",
      anchors,
      `Shot like a Roger Deakins documentary portrait. ${aspectRatio}, 35mm film aesthetic`,
    ].filter(Boolean).join(". ").replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim();
  }

  // VEO 3 — flowing paragraph, более длинный
  return [
    sceneVisual,
    characterBlock ? `Subject: ${characterBlock}` : "",
    `Camera: ${camera}`,
    "Lighting: single natural key light with defined angle, soft ground bounce fill, realistic shadow penumbra",
    "Color grade: Kodak Portra 400 response, warm highlights, desaturated shadows, lifted blacks",
    `Realism anchors: ${anchors}`,
    `Format: ${aspectRatio}, shot on ARRI Alexa 35 with Zeiss Master Prime, anamorphic 35mm aesthetic`,
  ].filter(Boolean).join(". ").replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim();
}

// ────────────────────────────────────────────────────────────────────────────
// VIDEO PROMPT — для image-to-video или text-to-video.
// VEO 3: длинный flowing paragraph (60-120 слов), audio block обязателен,
//        timing на движение камеры ("slow 2-second push-in").
// GROK:  компактный (40-80 слов), visual hook первым, video-only,
//        стилевой референс вместо тайминга.
// ────────────────────────────────────────────────────────────────────────────
export function buildVideoPromptFor({
  frame = {},
  storyboard = {},
  target = "veo3",  // "veo3" | "grok"
  includeVo = false,
  promptMode = "pro", // "cheap" | "pro"
  consistency = "normal", // "normal" | "ultra"
} = {}) {
  const characterBlock = buildCharacterBlock(storyboard.character_lock, { includeNames: false });
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const duration = Number(frame.duration || 3);

  // Извлекаем чистое описание action из существующего video_prompt_en или description
  let action = String(frame.video_prompt_en || frame.description_ru || "")
    .replace(/^ANIMATE CURRENT FRAME:\s*/i, "")
    .replace(/\s*SFX:.*$/is, "")
    .replace(/\s*PHYSICAL REALISM BOOST:.*$/is, "")
    .replace(/\s*Maintain EXACT same character appearance[^.]*\./i, "")
    .replace(/\s*GROK RAW MASTER:.*$/is, "")
    .trim();

  if (!action) action = frame.description_ru || "subject holds position, micro-movements only";

  const camera = String(frame.camera || "static medium shot with imperceptible handheld drift").trim();
  const sfx = String(frame.sfx || "subtle realistic ambience matching the scene").trim();
  const voRu = frame.vo_ru ? String(frame.vo_ru).trim() : "";

  const anchors = [
    REALISM_ANCHORS_SKIN[0],
    REALISM_ANCHORS_SKIN[2],
    REALISM_ANCHORS_HAIR_FABRIC[0],
    REALISM_ANCHORS_OPTICS[0],
    REALISM_ANCHORS_OPTICS[1],
  ].join(", ");

  // ───── GROK Imagine ─────────────────────────────────────────────────────
  if (target === "grok") {
    const cleanAction = action
      .replace(/Maintain EXACT[^.]*\./gi, "")
      .replace(/Audio:[^.]*\./gi, "")
      .replace(/SFX:[^.]*\./gi, "")
      .trim();
    const firstSentence = cleanAction.split(/(?<=[.!?])\s+/)[0] || cleanAction;
    const visualHook = firstSentence.slice(0, 180).replace(/\s+\S*$/, "");
    const continuity = buildContinuityLine(frame, consistency);
    const role = characterBlock ? `Subject: ${characterBlock}.` : "";
    const base = [
      visualHook,
      role,
      `Camera: ${camera}`,
      "Natural light, documentary realism, handheld motion",
      `SFX: ${sfx}`,
      "No dialogue, no voiceover",
    ].filter(Boolean).join(". ").replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim();
    const compact = compactVideoPrompt(base, { maxWords: consistency === "ultra" ? 58 : 70 });
    return `${compact} ${continuity}`.replace(/\s+/g, " ").trim();
  }

  if (promptMode === "cheap") {
    return cleanVideoPromptText([
      `${camera}, ${duration}-second shot`,
      characterBlock ? `Subject: ${characterBlock}` : "",
      `Action: ${action}`,
      "Natural available light, documentary realism, subtle 35mm grain, grounded physical motion",
      `Audio: ${sfx}`,
      `SFX: ${sfx}`,
      buildContinuityLine(frame, consistency),
    ].filter(Boolean).join(". "), { storyboard, includeVo });
  }

  // ───── VEO 3 ────────────────────────────────────────────────────────────
  const audioBlock = includeVo && voRu
    ? `Audio: ${sfx}. Voiceover/dialogue allowed by user: "${voRu}"`
    : `Audio: ${sfx}. No dialogue, no voiceover, ambient only`;

  return cleanVideoPromptText([
    `${camera}, ${duration}-second shot.`,
    characterBlock ? `Subject: ${characterBlock}.` : "",
    `Action: ${action}.`,
    "Camera behavior: organic handheld micro-shake, slight focus breathing, natural exposure shifts.",
    "Lighting: natural available light, single defined key, soft bounce fill, realistic shadow penumbra.",
    "Color grade: Kodak Portra 400 response, lifted blacks, desaturated shadows, warm skin tones.",
    `Realism anchors: ${anchors}.`,
    "Physics: realistic inertia, weight and resistance in body motion, grounded contact with surfaces, micro-delays in reactions, fabric reacting to movement, environmental particles moving with motion.",
    audioBlock + ".",
    `Format: ${aspectRatio}, 24fps, shot on ARRI Alexa 35 with Zeiss Master Prime anamorphic.`,
    buildContinuityLine(frame, consistency),
  ].filter(Boolean).join(" "), { storyboard, includeVo });
}

// ────────────────────────────────────────────────────────────────────────────
// Очистка промта от banned words. Заменяет их на нейтральные эквиваленты.
// ────────────────────────────────────────────────────────────────────────────
const BANNED_REPLACEMENTS = {
  cinematic: "documentary",
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
  return out.replace(/\s+/g, " ").replace(/,\s*,+/g, ",").trim();
}

// ────────────────────────────────────────────────────────────────────────────
// Финальная сборка для одного кадра — image + video + negative.
// Используется в normalizeStoryboard.
// ────────────────────────────────────────────────────────────────────────────
export function buildFramePromptsForTarget({ frame, storyboard, target = "veo3", includeVo = false, promptMode = "pro", consistency = "normal" }) {
  const imagePrompt = ensurePromptPrefix(
    stripBannedWords(buildImagePrompt({ frame, storyboard, target })),
    "SCENE PRIMARY FOCUS:"
  );

  let rawVideo = stripBannedWords(buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency }));
  rawVideo = ensureSfxLine(rawVideo, frame.sfx);
  rawVideo = cleanVideoPromptText(rawVideo, { storyboard, includeVo });

  if (target === "grok") {
    const continuity = buildContinuityLine(frame, consistency);
    rawVideo = rawVideo
      .replace(/Maintain EXACT character appearance, face, clothing, and condition from the uploaded final 2K frame\.?/gi, "")
      .replace(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/gi, "")
      .replace(/Ultra consistency:[^.]*\./gi, "")
      .trim();
    rawVideo = compactVideoPrompt(rawVideo, { maxWords: consistency === "ultra" ? 58 : 70 });
    rawVideo = `${rawVideo} ${continuity}`.replace(/\s+/g, " ").trim();
  }

  const videoPrompt = ensurePromptPrefix(rawVideo, "ANIMATE CURRENT FRAME:");

  return {
    image_prompt_en: imagePrompt,
    video_prompt_en: videoPrompt,
    negative_prompt: NEGATIVE_PROMPT_BASE,
    target,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION — проверяет что промт чистый, character lock на месте, нет
// banned words. Возвращает { ok, errors }.
// ────────────────────────────────────────────────────────────────────────────
export function validateFramePrompts({ frame, storyboard, target = "veo3" }) {
  const errors = [];
  const text = `${frame.image_prompt_en || ""} ${frame.video_prompt_en || ""}`;

  // Banned words
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) errors.push(`banned word: "${word}"`);
  }

  // Character lock injection is descriptive in V2.7: names are intentionally removed from video prompts.
  const charBlock = buildCharacterBlock(storyboard.character_lock, { includeNames: false });
  if (charBlock && storyboard.character_lock?.length > 0) {
    const firstDescriptor = charBlock.split(",")[0]?.toLowerCase();
    if (firstDescriptor && !text.toLowerCase().includes(firstDescriptor)) {
      errors.push(`character lock descriptor missing: "${firstDescriptor}" not found in prompts`);
    }
  }

  if (frame.image_prompt_en && !/^SCENE PRIMARY FOCUS:/i.test(frame.image_prompt_en)) {
    errors.push("image prompt missing SCENE PRIMARY FOCUS prefix");
  }

  if (frame.video_prompt_en && !/^ANIMATE CURRENT FRAME:/i.test(frame.video_prompt_en)) {
    errors.push("video prompt missing ANIMATE CURRENT FRAME prefix");
  }

  if (frame.video_prompt_en && !/\bSFX\s*:/i.test(frame.video_prompt_en)) {
    errors.push("video prompt missing embedded SFX block");
  }

  // Target-specific
  if (target === "veo3") {
    if (!frame.video_prompt_en?.toLowerCase().includes("audio:")) {
      errors.push("Veo 3 video prompt missing Audio block");
    }
  }

  if (target === "grok") {
    const wordCount = (frame.video_prompt_en || "").split(/\s+/).length;
    if (wordCount > 120) errors.push(`Grok video prompt too long: ${wordCount} words (max ~120)`);
  }

  return { ok: errors.length === 0, errors };
}
