// engine/videoPromptAgent.js
// NeuroCine Video Prompt Agent v1
// Генератор image и video промтов под Veo 3 и Grok Imagine.
// Работает с frame из sceneEngine_v2 + character_lock.
//
// ВАЖНО: модели читают первые токены сильнее. Поэтому image_prompt и video_prompt
// строятся по жёсткой структуре — visual hook первым, character lock дословно,
// технические теги в конце.

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
export function buildCharacterBlock(characterLock = []) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return "";
  return characterLock
    .map((c) => {
      const parts = [
        c.name,
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
} = {}) {
  const characterBlock = buildCharacterBlock(storyboard.character_lock);
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
    // Visual hook - первое полное предложение, не slice по символам
    const sentences = action.split(/(?<=[.!?])\s+/);
    const hook = sentences[0] || action.slice(0, 100).replace(/\s+\S*$/, "");
    const rest = sentences.slice(1).join(" ");

    return [
      hook,
      characterBlock ? `Subject: ${characterBlock}` : "",
      rest,
      `Camera: ${camera}, organic handheld micro-drift, natural focus breathing`,
      "Lighting: natural available light, real bokeh from f/1.8, Kodak Portra 400 color response",
      `Texture: ${anchors}`,
      "Physics: realistic inertia, weight in body motion, fabric reacting to movement, environmental particles",
      `Style: shot like a Roger Deakins documentary fragment. ${aspectRatio}, 24fps, ${duration}s`,
      "Maintain EXACT same character appearance, face, clothing, and condition as previous frame",
    ].filter(Boolean).join(". ").replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim();
  }

  // ───── VEO 3 ────────────────────────────────────────────────────────────
  const audioBlock = voRu
    ? `Audio: ${sfx}. Voiceover (Russian narrator, documentary tone, external to scene): "${voRu}"`
    : `Audio: ${sfx}. No dialogue, ambient only`;

  return [
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
    "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.",
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
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
export function buildFramePromptsForTarget({ frame, storyboard, target = "veo3" }) {
  const imagePrompt = stripBannedWords(buildImagePrompt({ frame, storyboard, target }));
  const videoPrompt = stripBannedWords(buildVideoPromptFor({ frame, storyboard, target }));

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

  // Character lock инжекция
  const charBlock = buildCharacterBlock(storyboard.character_lock);
  if (charBlock && storyboard.character_lock?.length > 0) {
    const firstName = storyboard.character_lock[0]?.name;
    if (firstName && !text.toLowerCase().includes(firstName.toLowerCase())) {
      errors.push(`character lock missing: "${firstName}" not found in prompts`);
    }
  }

  // Target-specific
  if (target === "veo3") {
    if (!frame.video_prompt_en?.toLowerCase().includes("audio:")) {
      errors.push("Veo 3 video prompt missing Audio block");
    }
  }

  if (target === "grok") {
    const wordCount = (frame.video_prompt_en || "").split(/\s+/).length;
    if (wordCount > 110) errors.push(`Grok video prompt too long: ${wordCount} words (max ~80-100)`);
  }

  return { ok: errors.length === 0, errors };
}
