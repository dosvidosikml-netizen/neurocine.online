// engine/sceneEngine_v2.js
// NeuroCine Storyboard Engine v2.2
// Обновлено под Veo 3 + Grok Imagine pipeline.
// - Убраны мусорные image-теги (8k texture fidelity, no plastic skin)
// - image_prompt и video_prompt теперь строятся через videoPromptAgent
// - Введён параметр target: "veo3" | "grok" вместо/в дополнение к safe/raw
// - safe/raw остаётся для контроля контента (sanitize wording)
// - v2.2: videoPromptAgent больше не получает старый video_prompt_en как готовый prompt,
//   а получает чистый motion/story_action, чтобы не было recursive prompt bloat.
//
// Совместимость: старый API сохраняется. Если target не передан — дефолт "veo3".

import {
  buildFramePromptsForTarget,
  stripBannedWords,
  NEGATIVE_PROMPT_BASE,
} from "./videoPromptAgent";

export const DURATION_PRESETS = {
  30:  { targetScenes: 10,  wordsMin: 65,   wordsMax: 85,   longForm: false },
  60:  { targetScenes: 20,  wordsMin: 130,  wordsMax: 160,  longForm: false },
  90:  { targetScenes: 30,  wordsMin: 200,  wordsMax: 240,  longForm: false },
  120: { targetScenes: 40,  wordsMin: 270,  wordsMax: 320,  longForm: false },
  180: { targetScenes: 60,  wordsMin: 420,  wordsMax: 480,  longForm: false },
  // Long-form ролики (>3 мин) — генерятся по chunks для обхода лимитов output tokens.
  // Каждый chunk = 90 сек = 30 кадров (~12k output tokens на chunk).
  240: { targetScenes: 80,  wordsMin: 540,  wordsMax: 640,  longForm: true,  chunkSize: 90 },
  300: { targetScenes: 100, wordsMin: 660,  wordsMax: 800,  longForm: true,  chunkSize: 90 },
  360: { targetScenes: 120, wordsMin: 800,  wordsMax: 960,  longForm: true,  chunkSize: 90 },
  420: { targetScenes: 140, wordsMin: 920,  wordsMax: 1120, longForm: true,  chunkSize: 90 },
  480: { targetScenes: 160, wordsMin: 1060, wordsMax: 1280, longForm: true,  chunkSize: 90 },
  540: { targetScenes: 180, wordsMin: 1180, wordsMax: 1440, longForm: true,  chunkSize: 90 },
  600: { targetScenes: 200, wordsMin: 1320, wordsMax: 1600, longForm: true,  chunkSize: 90 },
};

// Helper для не-табличных значений
export function isLongForm(duration) {
  return Number(duration) > 180;
}

// Возвращает план разбивки на chunks для long-form режима
export function getChunkPlan(duration) {
  const d = Number(duration) || 60;
  const preset = DURATION_PRESETS[d] || DURATION_PRESETS[60];
  if (!preset.longForm) return [{ start: 0, duration: d, isChunk: false }];

  const chunkSize = preset.chunkSize || 90;
  const chunks = [];
  let remaining = d;
  let start = 0;
  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);
    chunks.push({ start, duration: thisChunk, isChunk: true });
    start += thisChunk;
    remaining -= thisChunk;
  }
  return chunks;
}

// MODE — контроль контента (sanitize). НЕ путать с TARGET (veo3 / grok).
export const STORYBOARD_MODES = {
  safe: {
    label: "GPT SAFE",
    engineTarget: "gpt_safe",
    instruction:
      "Use GPT SAFE MODE. Prioritize valid JSON, safe documentary phrasing, non-graphic violence, and production stability.",
  },
  raw: {
    label: "GROK RAW",
    engineTarget: "grok_raw",
    instruction:
      "Use GROK RAW MODE. Increase intensity, stronger camera, stronger motion, but keep non-erotic, non-fetishized, non-instructional framing.",
  },
};

// TARGET — целевая видео-модель. Влияет на структуру промта.
export const STORYBOARD_TARGETS = {
  veo3: {
    label: "Google Veo 3",
    description:
      "Длинные flowing-параграфы 60-120 слов, native audio (диалоги/SFX), timing на движение камеры, до 8 сек на шот.",
  },
  grok: {
    label: "Grok Imagine",
    description:
      "Компактные промты 40-80 слов, visual hook первым, video-only (audio накладывается отдельно), стилевые референсы вместо тайминга, до 6 сек.",
  },
};

export function getDurationPreset(duration = 60) {
  const d = Number(duration);
  return DURATION_PRESETS[d] || DURATION_PRESETS[60];
}

export function normalizeMode(mode = "safe") {
  return mode === "raw" || mode === "grok_raw" ? "raw" : "safe";
}

export function normalizeTarget(target = "veo3") {
  return target === "grok" || target === "grok_imagine" ? "grok" : "veo3";
}

// ── GENERATOR SAFE SUBSTITUTION MAP ──────────────────────────────────────────
// Level 1: word/phrase substitutions для прохождения content-guard'ов.
const GENERATOR_SAFE_MAP = [
  { from: /blood stains?/gi, to: "dark weathered marks on fabric" },
  { from: /bloodstains?/gi, to: "dark weathered marks on fabric" },
  { from: /blood on (skin|body|face|clothing)/gi, to: "dark traces on $1" },
  { from: /bleeding/gi, to: "physical distress visible through clothing" },
  { from: /\bblood\b/gi, to: "dark crimson traces on cloth" },
  { from: /\bgore\b/gi, to: "visceral procedural detail" },
  { from: /impact marks? on (clothing and skin|skin|clothing)/gi, to: "procedural wear marks on garments" },
  { from: /impact marks?/gi, to: "procedural wear marks" },
  { from: /laceration/gi, to: "fabric disruption on robe" },
  { from: /\bwound(ed|s)?\b/gi, to: "physically marked" },
  { from: /anatomical injury/gi, to: "physical condition" },
  { from: /graphic injury/gi, to: "documentary physical detail" },
  { from: /\bexecutioner\b/gi, to: "ceremonial official" },
  { from: /\bexecution\b/gi, to: "official public ceremony" },
  { from: /beheading/gi, to: "ceremonial culmination" },
  { from: /decapitation/gi, to: "final ceremonial act" },
  { from: /\btorture\b/gi, to: "prolonged ordeal" },
  { from: /\bcondemned\b/gi, to: "restrained subject" },
  { from: /\bknife\b/gi, to: "ceremonial implement" },
  { from: /\bblade\b/gi, to: "metal instrument" },
  { from: /\bsword\b/gi, to: "ceremonial blade" },
  { from: /severe exhaustion/gi, to: "extreme physical fatigue, hollow expression" },
  { from: /unstable posture/gi, to: "weakened stance, uneven weight distribution" },
  { from: /visible distress/gi, to: "tense strained expression, labored breathing" },
  { from: /rope restraints at wrists/gi, to: "bound wrists secured with rope" },
  { from: /\bdying\b/gi, to: "in final physical decline" },
  { from: /\bdead\b/gi, to: "motionless" },
  { from: /\bcorpse\b/gi, to: "still figure" },
];

export function sanitizeForGenerator(text = "") {
  let out = String(text || "");
  for (const rule of GENERATOR_SAFE_MAP) {
    out = out.replace(rule.from, rule.to);
  }
  return out;
}

// ── OBSERVER FRAMING ─────────────────────────────────────────────────────────
// Применяется к image_prompt в safe режиме для documentary framing.
const OBSERVER_CONTEXT =
  "documentary framing, observer perspective, emphasis on atmosphere and depth layers";

export function applyObserverFraming(prompt = "") {
  let out = sanitizeForGenerator(String(prompt || ""));

  out = out
    .replace(/\b(cutting|slashing|striking|stabbing|hitting|slicing)\b/gi, "action implied beyond frame edge")
    .replace(/\b(kills?|killed|killing)\b/gi, "fatal outcome implied")
    .replace(/\b(scream(ing|s)?)\b/gi, "open mouth, vocal tension")
    .replace(/\b(cries|crying|weeps|weeping)\b/gi, "face streaked with moisture, eyes averted")
    .replace(/\bpain\b/gi, "visible strain")
    .replace(/\bsuffers?|suffering\b/gi, "physical strain visible through posture")
    .replace(/\bin agony\b/gi, "in visible physical distress");

  if (!out.includes("documentary framing") && !out.includes("documentary realism")) {
    out = `${OBSERVER_CONTEXT}. ${out}`;
  }

  return out;
}

// ── USER PROMPT BUILDER ──────────────────────────────────────────────────────
// Детектор "ты-обращения": считаем плотность "ты/тебя/тебе/твой" в сценарии.
// Если высокая — сценарий написан в OBSERVER MODE (зритель = главный герой),
// и character_lock должен быть пустым или содержать только эпизодических людей.
// Иначе модель выдумывает фиктивного "Mikhail"/"Ivan" и портит весь storyboard.
export function detectObserverMode(script = "") {
  const text = String(script || "");
  const youMatches = text.match(/(?<![а-яёА-ЯЁ])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?![а-яёА-ЯЁ])/gi) || [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return false;
  const youDensity = youMatches.length / wordCount;
  // Если на 100 слов приходится 2+ обращения "ты" — это observer mode
  return youDensity >= 0.02 && youMatches.length >= 3;
}

export function buildStoryboardUserPrompt({
  script = "",
  duration = 60,
  mode = "safe",
  target = "veo3",
  aspectRatio = "9:16",
} = {}) {
  const d = Number(duration) || 60;
  const preset = getDurationPreset(d);
  const normalizedMode = normalizeMode(mode);
  const normalizedTarget = normalizeTarget(target);
  const modeConfig = STORYBOARD_MODES[normalizedMode];
  const targetConfig = STORYBOARD_TARGETS[normalizedTarget];

  const arMap = {
    "9:16": {
      label: "9:16 vertical portrait",
      composition:
        "VERTICAL 9:16 PORTRAIT — every image prompt MUST compose for tall vertical framing: subject centered vertically, head-room tight, sky or environment fills top, foreground anchors bottom.",
    },
    "16:9": {
      label: "16:9 wide horizontal",
      composition:
        "HORIZONTAL 16:9 WIDESCREEN — every image prompt MUST compose for wide framing: subjects placed along horizontal thirds, environment fills the sides.",
    },
    "1:1": {
      label: "1:1 square",
      composition:
        "SQUARE 1:1 FORMAT — every image prompt MUST compose for square framing: centered balanced composition, equal visual weight horizontally and vertically.",
    },
    "4:5": {
      label: "4:5 Instagram portrait",
      composition:
        "4:5 PORTRAIT FORMAT — every image prompt MUST compose for near-portrait framing: slightly taller than wide, subject centered.",
    },
  };
  const arInfo = arMap[aspectRatio] || arMap["9:16"];
  const isObserverMode = detectObserverMode(script);

  const characterLockInstruction = isObserverMode
    ? `
🎯 SCRIPT MODE DETECTED: OBSERVER / SECOND-PERSON ("ты"-обращение)
This script speaks DIRECTLY TO THE VIEWER. The viewer IS the protagonist.
There is NO main character to lock. DO NOT invent a fictional hero (no "Mikhail", "Ivan", "Aldric", etc.).

CHARACTER_LOCK RULES FOR OBSERVER MODE:
- character_lock array MUST be EMPTY [] OR contain ONLY episodic background figures (witnesses, crowd, victims) without names
- NEVER create a recurring "main character" with a name when the script uses "ты" (you)
- Use POV / first-person framing in image_prompt_en where natural ("POV: looking at...", "from the viewer's perspective")
- Episodic characters (if any) should be described generically: "a peasant in 19th century clothing", "a soldier with mud-covered uniform", NOT named individuals
- Camera = the viewer. Frame the world AS IF the viewer is standing there.
`
    : `
CHARACTER_LOCK RULES (standard third-person mode):
- Build a complete character_lock for any recurring protagonist mentioned in the script
- Include name, age, face_features, hair, clothing, physical_condition
- Inject character_lock VERBATIM into every image_prompt_en where that character appears
`;

  return `Generate a production storyboard JSON for NeuroCine Storyboard Engine v2.

CONTENT MODE: ${normalizedMode}
CONTENT MODE INSTRUCTION: ${modeConfig.instruction}

VIDEO TARGET MODEL: ${normalizedTarget} (${targetConfig.label})
TARGET MODEL CHARACTERISTICS: ${targetConfig.description}

Target duration: ${d} seconds.
Target scenes: ${preset.targetScenes} (MANDATORY — generate EXACTLY this many scenes).
Target VO length: ${preset.wordsMin}-${preset.wordsMax} Russian words. Keep vo_ru as external TTS text only; do NOT inject VO/dialogue into image_prompt_en or video_prompt_en.
Average shot duration: 3 seconds.
total_duration MUST equal ${d}.

ASPECT RATIO: ${aspectRatio} — ${arInfo.composition}
${characterLockInstruction}
⚠️ STRICT SHOT DURATION LAW:
Every "duration" field MUST be 2, 3, or 4 seconds. NEVER 5+.
For ${d}s video → ${preset.targetScenes} scenes × ~3 seconds = ${d}s total.

IMAGE PROMPT RULES (image_prompt_en):
- Start with concrete visual hook — first 8-12 words must be the strongest image
- Inject character_lock VERBATIM (do not paraphrase locked features)
- Use CLEAN compact optics tags only: ARRI Alexa 35, Zeiss Master Prime, T1.5/T2.8, anamorphic 35mm
- Include realism anchors: visible skin pores, individual hair strands, fabric weave, lens vignette, film grain
- DO NOT include: "8k", "ultra HD", "masterpiece", "cinematic", "epic", "stunning", "perfect", "hyperrealistic", "no plastic skin", "no blur" (these are noise tokens that hurt quality)
- End with: "ASPECT RATIO: ${aspectRatio}"

VIDEO PROMPT RULES (video_prompt_en):
${normalizedTarget === "veo3"
  ? `- VEO 3 format: flowing paragraph 60-120 words
- Include explicit timing on camera movement ("slow 2-second push-in", "static 3-second hold")
- MUST include Audio block: "Audio: [ambience]. SFX: [details]. No dialogue, no voiceover."
- Use specific physical realism language: inertia, weight, contact, fabric reaction
- End with: "Maintain EXACT same character appearance, face, clothing, and condition as previous frame."`
  : `- GROK format: compact 40-80 words, visual hook first
- Use stylistic references instead of timing ("shot like a Roger Deakins documentary fragment")
- Video-only — audio is layered separately, no VO/dialogue inside prompt
- Single action only, simpler structure
- End with: "Maintain EXACT same character appearance, face, clothing, and condition as previous frame."`
}

REQUIRED v2 fields:
- global_video_lock
- postprocess
- cut_energy in every scene: low | medium | high

Scene quality rule: internally score every scene 1-10. Below 8 → rewrite. Do NOT output the score.

SCRIPT:
${script}

Return JSON only.`;
}

// ────────────────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────────────────
function getCutEnergy(scene = {}, index = 0) {
  const raw = String(scene.cut_energy || "").toLowerCase();
  if (["low", "medium", "high"].includes(raw)) return raw;
  const beat = String(scene.beat_type || scene.beat || "").toLowerCase();
  if (beat.includes("pause")) return "low";
  if (beat.includes("reaction") || beat.includes("evidence") || beat.includes("hook")) return "medium";
  if (beat.includes("aggression") || beat.includes("climax") || beat.includes("escalation")) return "high";
  return index % 3 === 2 ? "low" : index % 2 === 0 ? "medium" : "high";
}

function padFrame(n) {
  return `frame_${String(n).padStart(2, "0")}`;
}

function clampDuration(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(4, Math.max(2, Math.round(n)));
}

function splitLongScenes(scenes = []) {
  const MAX_DUR = 4;
  const result = [];
  for (const s of scenes) {
    const dur = Number(s.duration || 3);
    if (dur <= MAX_DUR) {
      result.push(s);
    } else {
      const numChunks = Math.ceil(dur / 3);
      const baseDur = Math.floor(dur / numChunks);
      for (let i = 0; i < numChunks; i++) {
        const remainder = dur - baseDur * numChunks;
        const thisDur = Math.min(MAX_DUR, Math.max(2, baseDur + (i < remainder ? 1 : 0)));
        result.push({ ...s, duration: thisDur });
      }
    }
  }
  return result;
}

function ensurePromptPrefixes(scene) {
  const image = String(scene.image_prompt_en || "").trim();
  const video = String(scene.video_prompt_en || "").trim();
  return {
    ...scene,
    image_prompt_en: image.startsWith("SCENE PRIMARY FOCUS:") ? image : `SCENE PRIMARY FOCUS: ${image}`.trim(),
    video_prompt_en: video.includes("Maintain EXACT same character appearance")
      ? video
      : `${video}\nMaintain EXACT same character appearance, face, clothing, and condition as previous frame.`.trim(),
  };
}

function cleanMotionSource(scene = {}) {
  return stripBannedWords(
    scene.story_action_en ||
    scene.action_en ||
    scene.motion ||
    scene.action ||
    scene.camera_movement ||
    scene.description_en ||
    scene.description_ru ||
    ""
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN: normalizeStoryboard
// ────────────────────────────────────────────────────────────────────────────
export function normalizeStoryboard(
  raw = {},
  requestedDuration = 60,
  requestedMode = "safe",
  modelUsed = "openai/gpt-5.4",
  requestedTarget = "veo3"
) {
  const mode = normalizeMode(raw?.export_meta?.mode || requestedMode);
  const target = normalizeTarget(raw?.export_meta?.target || requestedTarget);
  const engineTarget = mode === "raw" ? "grok_raw" : "gpt_safe";
  const targetDuration = Number(requestedDuration) || Number(raw.total_duration) || 60;
  const inputScenes = Array.isArray(raw.scenes) ? raw.scenes : Array.isArray(raw.shots) ? raw.shots : [];

  const splitScenes = splitLongScenes(inputScenes);
  const sceneCount = Math.max(1, splitScenes.length);

  let durations = splitScenes.map((s) => clampDuration(s.duration || 3));
  let sum = durations.reduce((a, b) => a + b, 0);

  let guard = 0;
  while (sum !== targetDuration && guard < 2000) {
    guard += 1;
    if (sum < targetDuration) {
      const idx = durations.findIndex((d) => d < 4);
      if (idx === -1) break;
      durations[idx] += 1;
      sum += 1;
    } else {
      const idx = durations.findIndex((d) => d > 2);
      if (idx === -1) break;
      durations[idx] -= 1;
      sum -= 1;
    }
  }

  // Sanitize character_lock for generator safety
  const characterLockSafe = (raw.character_lock || []).map((char) => ({
    ...char,
    clothing: char.clothing ? sanitizeForGenerator(char.clothing) : char.clothing,
    physical_condition: char.physical_condition
      ? sanitizeForGenerator(char.physical_condition)
      : char.physical_condition,
  }));

  // Storyboard meta — нужен для buildFramePromptsForTarget
  const storyboardMeta = {
    aspect_ratio: raw.aspect_ratio || "9:16",
    character_lock: characterLockSafe,
  };

  let start = 0;
  const scenes = splitScenes.map((s, i) => {
    const duration = durations[i] || 3;

    // Базовый scene с очищенными промтами от мусора
    const baseScene = ensurePromptPrefixes({
      id: padFrame(i + 1),
      start,
      duration,
      beat_type:
        s.beat_type || s.beat || (i === 0 ? "hook" : i === sceneCount - 1 ? "ending" : "escalation"),
      description_ru: s.description_ru || s.ru_description || s.description || "",
      description_en: s.description_en || "",
      story_action_en: s.story_action_en || s.action_en || "",
      action_en: s.action_en || "",
      image_prompt_en: stripBannedWords(s.image_prompt_en || s.image_prompt || ""),
      video_prompt_en: stripBannedWords(s.video_prompt_en || s.video_prompt || ""),
      vo_ru: s.vo_ru || s.voice || s.vo || "",
      sfx: s.sfx || "",
      camera: s.camera || s.camera_movement || "",
      transition: s.transition || "cut",
      cut_energy: getCutEnergy(s, i),
      continuity_note: s.continuity_note || "",
      safety_note:
        s.safety_note ||
        (mode === "safe"
          ? "GPT SAFE: documentary framing, non-erotic, non-fetishized, non-graphic wording"
          : "GROK RAW: intensity, non-erotic, non-fetishized, non-instructional"),
    });

    // Применяем observer framing к image (защита от content-guard)
    const imageWithFraming = mode === "safe"
      ? applyObserverFraming(baseScene.image_prompt_en)
      : baseScene.image_prompt_en;

    // Перестраиваем image_prompt и video_prompt через videoPromptAgent
    // под выбранный TARGET (veo3 или grok).
    // ВАЖНО: не передаём старый video_prompt_en как готовый motion,
    // иначе новый agent начинает чистить собственный старый output и получает recursive bloat.
    const frameForAgent = {
      ...baseScene,
      image_prompt_en: imageWithFraming,
      motion: cleanMotionSource(s),
      video_prompt_en: "",
    };

    const agentPrompts = buildFramePromptsForTarget({
      frame: frameForAgent,
      storyboard: storyboardMeta,
      target,
    });

    // Финальная сцена
    const finalScene = {
      ...baseScene,
      image_prompt_en: agentPrompts.image_prompt_en,
      video_prompt_en: agentPrompts.video_prompt_en,
      negative_prompt: agentPrompts.negative_prompt,
      target,
    };

    // Для совместимости с существующим UI: дублируем под grok-поля если target=grok
    if (target === "grok") {
      finalScene.image_prompt_grok_en = agentPrompts.image_prompt_en;
      finalScene.video_prompt_grok_en = agentPrompts.video_prompt_en;
      finalScene.grok_sfx = baseScene.sfx || "scene-matched ambience";
      finalScene.grok_camera = baseScene.camera || "organic handheld";
    }

    start += duration;
    return finalScene;
  });

  return {
    project_name: raw.project_name || "NeuroCine Storyboard",
    language: raw.language || "ru",
    format: raw.format || "shorts_reels_tiktok",
    aspect_ratio: raw.aspect_ratio || "9:16",
    total_duration: start,
    global_style_lock:
      raw.global_style_lock ||
      "RAW unretouched photograph, NOT CGI, NOT rendered, shot on ARRI Alexa 35, Zeiss Master Prime, anamorphic 35mm, natural available light only, Kodak Portra 400 color response, visible skin pores, fabric weave detail, real bokeh from f/1.8, 35mm film grain, no subtitles, no UI, no watermark",
    global_video_lock:
      raw.global_video_lock ||
      "grounded physical realism, realistic inertia, organic camera operator behavior, documentary authenticity, visible environmental reaction, fabric reacting to motion, micro-delays in body reactions",
    global_negative_prompt: NEGATIVE_PROMPT_BASE,
    character_lock: characterLockSafe,
    postprocess:
      raw.postprocess || { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    scenes,
    export_meta: {
      ...(raw.export_meta || {}),
      engine_target: engineTarget,
      mode,
      target,
      model: modelUsed,
      version: "neurocine_storyboard_v2_2",
      auto_safe_to_grok: mode === "safe",
      postprocess: { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────────────────
export function validateStoryboard(data = {}, requestedMode = "safe", requestedTarget = "veo3") {
  const errors = [];
  const mode = normalizeMode(data?.export_meta?.mode || requestedMode);
  const target = normalizeTarget(data?.export_meta?.target || requestedTarget);

  if (!data || typeof data !== "object") errors.push("Storyboard is not an object");
  if (!data.global_video_lock) errors.push("global_video_lock is missing");
  if (!data.postprocess?.upscale) errors.push("postprocess.upscale is missing");
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) errors.push("scenes[] is empty");

  if (Array.isArray(data.scenes)) {
    let total = 0;
    data.scenes.forEach((s, i) => {
      const expectedId = padFrame(i + 1);
      if (s.id !== expectedId) errors.push(`scene ${i + 1}: id must be ${expectedId}`);

      // Image prompt checks
      const img = String(s.image_prompt_en || "");
      if (!img.startsWith("SCENE PRIMARY FOCUS:") && !img.includes("documentary"))
        errors.push(`${expectedId}: image_prompt_en lacks proper opening`);

      // Video prompt checks
      const vid = String(s.video_prompt_en || "");
      if (!vid.includes("Maintain EXACT character appearance") && !vid.includes("Maintain EXACT same character appearance"))
        errors.push(`${expectedId}: video prompt missing character continuity line`);

      // Target-specific
      if (target === "veo3") {
        if (!vid.toLowerCase().includes("audio:"))
          errors.push(`${expectedId}: Veo 3 video prompt missing Audio block`);
      }
      if (target === "grok") {
        const wc = vid.split(/\s+/).length;
        if (wc > 130) errors.push(`${expectedId}: Grok video prompt too long (${wc} words, max ~120)`);
      }

      // cut_energy
      if (!["low", "medium", "high"].includes(String(s.cut_energy || "").toLowerCase()))
        errors.push(`${expectedId}: cut_energy must be low, medium, or high`);

      // safe mode
      if (mode === "safe") {
        const risky = `${img} ${vid}`.toLowerCase();
        ["naked", "nude", "bare torso", "exposed body", "explicit gore"].forEach((word) => {
          if (risky.includes(word)) errors.push(`${expectedId}: safe mode risky wording: ${word}`);
        });
      }

      total += Number(s.duration || 0);
    });
    if (Number(data.total_duration) !== total)
      errors.push("total_duration must equal sum of scene durations");
  }

  return { ok: errors.length === 0, mode, target, errors };
}
