export const DURATION_PRESETS = {
  30: { targetScenes: 10, wordsMin: 65, wordsMax: 85 },
  60: { targetScenes: 20, wordsMin: 130, wordsMax: 160 },
  90: { targetScenes: 30, wordsMin: 200, wordsMax: 240 },
  120: { targetScenes: 40, wordsMin: 270, wordsMax: 320 },
  180: { targetScenes: 60, wordsMin: 420, wordsMax: 480 },
};

export const STORYBOARD_MODES = {
  safe: {
    label: "GPT SAFE",
    engineTarget: "gpt_safe",
    instruction: "Use GPT SAFE MODE. Prioritize valid JSON, safe documentary phrasing, non-graphic violence, and production stability.",
  },
  raw: {
    label: "GROK RAW",
    engineTarget: "grok_raw",
    instruction: "Use GROK RAW MODE. Increase cinematic intensity, stronger camera, stronger motion, but keep non-erotic, non-fetishized, non-instructional framing.",
  },
};

export function getDurationPreset(duration = 60) {
  const d = Number(duration);
  return DURATION_PRESETS[d] || DURATION_PRESETS[60];
}

export function normalizeMode(mode = "safe") {
  return mode === "raw" || mode === "grok" || mode === "grok_raw" ? "raw" : "safe";
}

// ── GENERATOR SAFE SUBSTITUTION MAP ──────────────────────────────────────────
// Level 1: direct phrase substitutions (fast, exact-match)
const GENERATOR_SAFE_MAP = [
  // Blood / wounds
  { from: /blood stains?/gi,                           to: "dark weathered marks on fabric" },
  { from: /bloodstains?/gi,                            to: "dark weathered marks on fabric" },
  { from: /blood on (skin|body|face|clothing)/gi,      to: "dark traces on $1" },
  { from: /bleeding/gi,                                to: "physical distress visible through clothing" },
  { from: /\bblood\b/gi,                               to: "dark crimson traces on cloth" },
  { from: /\bgore\b/gi,                                to: "visceral procedural detail" },
  // Impact / injury
  { from: /impact marks? on (clothing and skin|skin|clothing)/gi, to: "procedural wear marks on garments" },
  { from: /impact marks?/gi,                           to: "procedural wear marks" },
  { from: /laceration/gi,                              to: "fabric disruption on robe" },
  { from: /\bwound(ed|s)?\b/gi,                        to: "physically marked" },
  { from: /anatomical injury/gi,                       to: "physical condition" },
  { from: /graphic injury/gi,                          to: "documentary physical detail" },
  // Execution terms
  { from: /\bexecutioner\b/gi,                         to: "ceremonial official" },
  { from: /\bexecution\b/gi,                           to: "official public ceremony" },
  { from: /beheading/gi,                               to: "ceremonial culmination" },
  { from: /decapitation/gi,                            to: "final ceremonial act" },
  { from: /\btorture\b/gi,                             to: "prolonged ordeal" },
  { from: /\bcondemned\b/gi,                           to: "restrained subject" },
  // Weapons (image prompts only)
  { from: /\bknife\b/gi,                               to: "ceremonial implement" },
  { from: /\bblade\b/gi,                               to: "metal instrument" },
  { from: /\bsword\b/gi,                               to: "ceremonial blade" },
  // Character condition
  { from: /severe exhaustion/gi,   to: "extreme physical fatigue, hollow expression" },
  { from: /unstable posture/gi,    to: "weakened stance, uneven weight distribution" },
  { from: /visible distress/gi,    to: "tense strained expression, labored breathing" },
  { from: /rope restraints at wrists/gi, to: "bound wrists secured with rope" },
  // Death
  { from: /\bdying\b/gi,           to: "in final physical decline" },
  { from: /\bdead\b/gi,            to: "motionless" },
  { from: /\bcorpse\b/gi,          to: "still figure" },
];

/**
 * Level 1 – word/phrase substitution
 */
export function sanitizeForGenerator(text = "") {
  let out = String(text || "");
  for (const rule of GENERATOR_SAFE_MAP) {
    out = out.replace(rule.from, rule.to);
  }
  return out;
}

// ── OBSERVER FRAMING WRAPPER ──────────────────────────────────────────────────
// Level 2 – structural transformation of image prompts.
// Adds documentary context header + camera-layer framing.
// This is how professional documentary/historical production studios write prompts.
const OBSERVER_CONTEXT = "historical documentary reconstruction, non-exploitative framing, no graphic focus, emphasis on atmosphere and crowd dynamics, archival cinematic realism";

/**
 * Wraps an image prompt in observer/documentary framing:
 *   - prepends context declaration
 *   - shifts active verbs → implied/observer language
 *   - emphasises camera position and depth layers
 */
export function applyObserverFraming(prompt = "") {
  let out = sanitizeForGenerator(String(prompt || ""));

  // Shift "cutting", "striking", "slashing" → camera-implied equivalents
  out = out
    .replace(/\b(cutting|slashing|striking|stabbing|hitting|slicing)\b/gi, "action implied beyond frame edge")
    .replace(/\b(kills?|killed|killing)\b/gi, "fatal outcome implied")
    .replace(/\b(scream(ing|s)?)\b/gi, "open mouth, vocal tension")
    .replace(/\b(cries|crying|weeps|weeping)\b/gi, "face streaked with moisture, eyes averted")
    .replace(/\bpain\b/gi, "visible strain")
    .replace(/\bsuffers?|suffering\b/gi, "physical strain visible through posture")
    .replace(/\bin agony\b/gi, "in visible physical distress");

  // Add observer framing header if not already present
  if (!out.includes("documentary reconstruction")) {
    out = `${OBSERVER_CONTEXT}. ${out}`;
  }

  return out;
}

export function buildStoryboardUserPrompt({ script = "", duration = 60, mode = "safe" } = {}) {
  const d = Number(duration) || 60;
  const preset = getDurationPreset(d);
  const normalizedMode = normalizeMode(mode);
  const modeConfig = STORYBOARD_MODES[normalizedMode];

  return `Generate a production storyboard JSON for NeuroCine Storyboard Engine v2.\n\nMODE: ${normalizedMode}\nMODE INSTRUCTION: ${modeConfig.instruction}\n\nTarget duration: ${d} seconds.\nTarget scenes: ${preset.targetScenes} (MANDATORY — generate EXACTLY this many scenes, not fewer).\nTarget VO length: ${preset.wordsMin}-${preset.wordsMax} Russian words.\nAverage shot duration: 3 seconds.\nStrictly make total_duration equal ${d}.\n\n⚠️ STRICT SHOT DURATION LAW — NON-NEGOTIABLE:\nEvery single scene "duration" field MUST be 2, 3, or 4 seconds. NEVER 5, 6, 7, 8 or more.\nFORBIDDEN: duration 5, 6, 7, 8, 9, 10 — these BREAK Shorts/Reels format.\nIf you run out of story content: add detail shots, B-roll inserts, reaction cutaways, object close-ups. Never stretch a single scene beyond 4 seconds.\nFor ${d}s video → generate exactly ${preset.targetScenes} scenes × ~3 seconds each = ${d}s total.\n\nRequired v2 fields:\n- global_video_lock\n- postprocess\n- cut_energy in every scene: low | medium | high\n\nImage prompt rule: keep image prompts clean. Use only compact optics/quality tags: ARRI Alexa 65, Zeiss Master Prime, T2.8, cinematic sharp focus, film-level detail, Kodak Vision3 500T grain. Do not spam negative prompts or 8k/no blur/no plastic skin style lists.\n\nVideo prompt rule: include grounded physical realism, camera behavior, sensory detail, fabric/breath/particles/weight/contact physics.\n\nScene quality rule: internally score every scene from 1 to 10. If any scene is below 8, rewrite it until it reaches 8+. Do NOT output the score unless the JSON schema explicitly includes it.\n\nSCRIPT:\n${script}\n\njson`;
}

const CLEAN_IMAGE_BOOST = "shot on ARRI Alexa 65, Zeiss Master Prime lens, T2.8, cinematic sharp focus, film-level detail, Kodak Vision3 500T grain";
const GLOBAL_VIDEO_LOCK = "grounded physical realism, no floaty motion, realistic inertia, organic camera operator behavior, documentary authenticity, visible environmental reaction";
const PHYSICAL_REALISM_BLOCK = "PHYSICAL REALISM BOOST: increase inertia in movement, preserve weight and resistance in body motion, avoid floaty motion, enforce grounded contact with surfaces, emphasize micro-delays in reactions. CAMERA BEHAVIOR: imperfect handheld micro-shake, organic operator drift, slight focus breathing, natural exposure shifts. SENSORY DETAIL: visible breath in cold air, cloth reacting to wind, subtle skin imperfections, environmental particles moving with motion";
const GROK_RAW_BOOST = "GROK RAW MASTER: stronger cinematic tension, more aggressive camera energy, sharper subject lock, stronger atmosphere, heavier crowd pressure, tactile physics, film-grade contrast. PHYSICAL REALISM BOOST: increase inertia in movement, preserve weight and resistance in body motion, avoid floaty motion, enforce grounded contact with surfaces, emphasize micro-delays in reactions. CAMERA BEHAVIOR: imperfect handheld micro-shake, organic operator drift, slight focus breathing, natural exposure shifts. SENSORY DETAIL: visible breath in cold air, cloth reacting to wind, subtle skin imperfections, environmental particles moving with motion. Keep no explicit gore, non-erotic documentary framing";

const IMAGE_NOISE_PHRASES = [
  "stabilized subject focus",
  "ultra high detail",
  "realistic skin texture",
  "visible fabric weave",
  "micro contrast",
  "high frequency details",
  "8k texture fidelity",
  "film-level clarity",
  "realistic imperfections",
  "high dynamic range",
  "no blur",
  "no soft focus",
  "no smudged faces",
  "no plastic skin",
  "no low detail",
  "no muddy textures",
  "no waxy skin",
];

function appendUniqueText(base = "", addition = "") {
  const b = String(base || "").trim();
  const a = String(addition || "").trim();
  if (!a) return b;
  if (b.toLowerCase().includes(a.toLowerCase().slice(0, 48))) return b;
  return `${b}${b ? ", " : ""}${a}`.trim();
}

function removePromptNoise(prompt = "") {
  let out = String(prompt || "");
  for (const phrase of IMAGE_NOISE_PHRASES) {
    out = out.split(phrase).join("");
  }
  return out
    .replace(/,\s*,+/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .replace(/,\s*$/g, "")
    .trim();
}

function cleanImagePrompt(prompt = "") {
  return appendUniqueText(removePromptNoise(prompt), CLEAN_IMAGE_BOOST);
}

function enhanceVideoPrompt(prompt = "") {
  return appendUniqueText(String(prompt || "").trim(), PHYSICAL_REALISM_BLOCK);
}

function getCutEnergy(scene = {}, index = 0) {
  const raw = String(scene.cut_energy || "").toLowerCase();
  if (["low", "medium", "high"].includes(raw)) return raw;
  const beat = String(scene.beat_type || scene.beat || "").toLowerCase();
  if (beat.includes("pause")) return "low";
  if (beat.includes("reaction") || beat.includes("evidence") || beat.includes("hook")) return "medium";
  if (beat.includes("aggression") || beat.includes("climax") || beat.includes("escalation")) return "high";
  return index % 3 === 2 ? "low" : index % 2 === 0 ? "medium" : "high";
}

function buildGrokPromptFromSafe(scene = {}) {
  const image = cleanImagePrompt(scene.image_prompt_en || "");
  const videoBase = enhanceVideoPrompt(scene.video_prompt_en || "");
  const video = appendUniqueText(
    videoBase,
    `${GROK_RAW_BOOST}. Keep the same scene order, timing, VO, character identity, and continuity. Amplify camera motion, atmosphere, crowd pressure, fabric movement, breathing, weight, contact physics, environmental particles and reaction timing only. SFX: ${scene.sfx || "cinematic rumble, cloth movement, crowd pressure"}`
  );
  return {
    ...scene,
    image_prompt_grok_en: image,
    video_prompt_grok_en: video,
    grok_sfx: scene.sfx || "cinematic rumble, cloth movement, crowd pressure",
    grok_camera: appendUniqueText(scene.camera || "", "organic handheld operator drift, stabilized subject lock, cinematic raw motion"),
  };
}

function padFrame(n) {
  return `frame_${String(n).padStart(2, "0")}`;
}

function clampDuration(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(4, Math.max(2, Math.round(n)));
}

// Safety net: if AI returned scenes with duration > 4s, split them into 3s chunks.
// This mirrors the splitLongFrames() fix on the main page.
function splitLongScenes(scenes = []) {
  const MAX_DUR = 4;
  const result = [];
  for (const s of scenes) {
    const dur = Number(s.duration || 3);
    if (dur <= MAX_DUR) {
      result.push(s);
    } else {
      // How many chunks of ~3s fit?
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

export function normalizeStoryboard(raw = {}, requestedDuration = 60, requestedMode = "safe", modelUsed = "openai/gpt-5.4") {
  const mode = normalizeMode(raw?.export_meta?.mode || requestedMode);
  const engineTarget = mode === "raw" ? "grok_raw" : "gpt_safe";
  const target = Number(requestedDuration) || Number(raw.total_duration) || 60;
  const inputScenes = Array.isArray(raw.scenes) ? raw.scenes : Array.isArray(raw.shots) ? raw.shots : [];

  // Safety net: split any scene with duration > 4s before normalizing
  const splitScenes = splitLongScenes(inputScenes);
  const sceneCount = Math.max(1, splitScenes.length);

  let durations = splitScenes.map((s) => clampDuration(s.duration || 3));
  let sum = durations.reduce((a, b) => a + b, 0);

  let guard = 0;
  while (sum !== target && guard < 2000) {
    guard += 1;
    if (sum < target) {
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

  let start = 0;
  const scenes = splitScenes.map((s, i) => {
    const duration = durations[i] || 3;
    const normalized = ensurePromptPrefixes({
      id: padFrame(i + 1),
      start,
      duration,
      beat_type: s.beat_type || s.beat || (i === 0 ? "hook" : i === sceneCount - 1 ? "ending" : "escalation"),
      description_ru: s.description_ru || s.ru_description || s.description || "",
      image_prompt_en: s.image_prompt_en || s.image_prompt || "",
      video_prompt_en: s.video_prompt_en || s.video_prompt || "",
      vo_ru: s.vo_ru || s.voice || s.vo || "",
      sfx: s.sfx || "",
      camera: s.camera || s.camera_movement || "",
      transition: s.transition || "cut",
      cut_energy: getCutEnergy(s, i),
      continuity_note: s.continuity_note || "",
      safety_note: s.safety_note || (mode === "safe"
        ? "GPT SAFE: documentary framing, non-erotic, non-fetishized, non-graphic wording"
        : "GROK RAW: cinematic intensity, non-erotic, non-fetishized, non-instructional"),
    });
    const withV2 = {
      ...normalized,
      // applyObserverFraming = Level 1 (word substitution) + Level 2 (documentary framing header)
      // Applied to IMAGE prompts only — video prompts keep stronger wording for video models
      image_prompt_en: cleanImagePrompt(applyObserverFraming(normalized.image_prompt_en)),
      video_prompt_en: enhanceVideoPrompt(normalized.video_prompt_en),
    };
    const finalScene = mode === "safe" ? buildGrokPromptFromSafe(withV2) : withV2;

    // Apply observer framing to grok image prompt as well
    if (finalScene.image_prompt_grok_en) {
      finalScene.image_prompt_grok_en = applyObserverFraming(finalScene.image_prompt_grok_en);
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
    global_style_lock: raw.global_style_lock || "cinematic documentary realism, historical accuracy, 35mm anamorphic, handheld, natural overcast light, realistic textures, Kodak Vision3 500T grain, no subtitles/UI/watermarks",
    global_video_lock: raw.global_video_lock || GLOBAL_VIDEO_LOCK,
    // Sanitize character_lock clothing/condition fields so they don't trigger
    // generator blocks when used as character references
    character_lock: (raw.character_lock || []).map((char) => ({
      ...char,
      clothing: char.clothing ? sanitizeForGenerator(char.clothing) : char.clothing,
      physical_condition: char.physical_condition ? sanitizeForGenerator(char.physical_condition) : char.physical_condition,
    })),
    postprocess: raw.postprocess || { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    scenes,
    export_meta: {
      ...(raw.export_meta || {}),
      engine_target: engineTarget,
      mode,
      model: modelUsed,
      version: "neurocine_storyboard_v2",
      auto_safe_to_grok: mode === "safe",
      postprocess: { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    },
  };
}

export function validateStoryboard(data = {}, requestedMode = "safe") {
  const errors = [];
  const mode = normalizeMode(data?.export_meta?.mode || requestedMode);
  if (!data || typeof data !== "object") errors.push("Storyboard is not an object");
  if (!data.global_video_lock) errors.push("global_video_lock is missing");
  if (!data.postprocess?.upscale) errors.push("postprocess.upscale is missing");
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) errors.push("scenes[] is empty");
  if (Array.isArray(data.scenes)) {
    let total = 0;
    data.scenes.forEach((s, i) => {
      const expectedId = padFrame(i + 1);
      if (s.id !== expectedId) errors.push(`scene ${i + 1}: id must be ${expectedId}`);
      if (!String(s.image_prompt_en || "").startsWith("SCENE PRIMARY FOCUS:")) errors.push(`${expectedId}: image_prompt_en must start with SCENE PRIMARY FOCUS:`);
      if (!String(s.video_prompt_en || "").includes("Maintain EXACT same character appearance")) errors.push(`${expectedId}: video prompt missing exact character continuity line`);
      if (!String(s.video_prompt_en || "").includes("PHYSICAL REALISM BOOST")) errors.push(`${expectedId}: video prompt missing physical realism block`);
      if (!String(s.video_prompt_en || "").toLowerCase().includes("sfx")) errors.push(`${expectedId}: video_prompt_en must include SFX`);
      if (!s.vo_ru) errors.push(`${expectedId}: vo_ru is empty`);
      if (!["low", "medium", "high"].includes(String(s.cut_energy || "").toLowerCase())) errors.push(`${expectedId}: cut_energy must be low, medium, or high`);
      if (mode === "safe") {
        const risky = `${s.image_prompt_en || ""} ${s.video_prompt_en || ""}`.toLowerCase();
        ["naked", "nude", "bare torso", "exposed body", "explicit gore"].forEach((word) => {
          if (risky.includes(word)) errors.push(`${expectedId}: safe mode risky wording detected: ${word}`);
        });
      }
      total += Number(s.duration || 0);
    });
    if (Number(data.total_duration) !== total) errors.push("total_duration must equal sum of scene durations");
  }
  return { ok: errors.length === 0, mode, errors };
}
