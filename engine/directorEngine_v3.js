// NeuroCine Director Engine v3 — main production brain
// Pure helpers shared by UI and API. No old storyboard dependency.

export const DIRECTOR_VERSION = "neurocine_director_core_v3";

export const DEFAULT_STYLE_LOCK = [
  "cinematic documentary realism",
  "historical accuracy when relevant",
  "vertical 9:16 safe framing",
  "35mm anamorphic language",
  "organic handheld camera behavior",
  "natural motivated lighting",
  "realistic materials and textures",
  "Kodak Vision3 500T grain",
  "no subtitles",
  "no UI",
  "no watermark"
].join(", ");

export const GLOBAL_VIDEO_LOCK = [
  "grounded physical realism",
  "no floaty motion",
  "realistic inertia and weight",
  "contact with surfaces",
  "cloth reacting to wind and pressure",
  "environmental particles moving with motion",
  "organic handheld operator drift",
  "slight focus breathing",
  "natural exposure shifts",
  "documentary authenticity"
].join(", ");

export const ALLOWED_VARIATION_AXES = [
  "camera angle",
  "camera height",
  "lens feeling",
  "framing",
  "composition",
  "camera distance",
  "depth of field",
  "camera movement intensity"
];

export const FORBIDDEN_SCENARIO_CHANGES = [
  "character identity",
  "wardrobe",
  "location",
  "era",
  "time of day",
  "story action",
  "emotional meaning",
  "timeline order",
  "voiceover meaning",
  "SFX meaning",
  "new story props",
  "new characters not present in the scenario"
];

export function normalizeMode(mode = "safe") {
  return String(mode).toLowerCase() === "raw" ? "raw" : "safe";
}

export function padFrame(index) {
  return `frame_${String(index + 1).padStart(2, "0")}`;
}

export function clampDuration(value) {
  const n = Number(value || 3);
  if (n <= 2) return 2;
  if (n >= 4) return 4;
  return 3;
}

function clean(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceSplit(script = "") {
  const text = String(script || "").trim();
  if (!text) return [];
  return text.split(/(?<=[.!?。！？])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
}

export function targetSceneCount(duration = 60) {
  return Math.max(4, Math.min(60, Math.round(Number(duration || 60) / 3)));
}

export function normalizeScene(scene = {}, index = 0, styleLock = DEFAULT_STYLE_LOCK) {
  const description = clean(scene.description_ru || scene.visual_ru || scene.description || scene.vo_ru || `Кадр ${index + 1}`);
  const sfx = clean(scene.sfx || "scenario-appropriate realistic sound design");
  let image = clean(scene.image_prompt_en || scene.image_prompt || "");
  if (!image) image = `SCENE PRIMARY FOCUS: ${description}. Production-ready cinematic composition, clear subject, foreground / midground / background layers, ${styleLock}.`;
  if (!image.startsWith("SCENE PRIMARY FOCUS:")) image = `SCENE PRIMARY FOCUS: ${image}`;

  let video = clean(scene.video_prompt_en || scene.video_prompt || "");
  if (!video) video = `ANIMATE CURRENT LOCKED FRAME: ${description}. Maintain EXACT same character appearance, face, clothing, and condition as previous frame. Camera uses controlled handheld motion. Physical realism block: inertia, weight, contact with surfaces, cloth response, environmental particles, organic handheld operator drift, slight focus breathing, natural exposure shifts. SFX: ${sfx}.`;
  if (!video.includes("Maintain EXACT same character appearance, face, clothing, and condition as previous frame.")) {
    video += " Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";
  }
  if (!/Physical realism block:/i.test(video)) {
    video += " Physical realism block: inertia, weight, contact with surfaces, cloth response, environmental particles, organic handheld operator drift, slight focus breathing, natural exposure shifts.";
  }
  if (!/SFX:/i.test(video)) video += ` SFX: ${sfx}.`;

  return {
    id: clean(scene.id || padFrame(index)),
    start: Number.isFinite(Number(scene.start)) ? Number(scene.start) : index * 3,
    duration: clampDuration(scene.duration),
    beat_type: clean(scene.beat_type || "story"),
    description_ru: description,
    image_prompt_en: image,
    video_prompt_en: video,
    vo_ru: clean(scene.vo_ru || description),
    sfx,
    camera: clean(scene.camera || "controlled handheld cinematic framing"),
    transition: clean(scene.transition || (index === 0 ? "hard cut" : "straight cut")),
    cut_energy: ["low", "medium", "high"].includes(scene.cut_energy) ? scene.cut_energy : "medium",
    continuity_note: clean(scene.continuity_note || "Scenario, character, location, action, emotion and timeline are locked."),
    safety_note: clean(scene.safety_note || "No subtitles, no UI, no watermark.")
  };
}

export function buildProject({ script = "", duration = 60, mode = "safe", styleLock = DEFAULT_STYLE_LOCK, scenes = [], character_lock = [], project_name = "NeuroCine Director Storyboard", model = "unknown" } = {}) {
  return {
    project_name,
    language: "ru",
    format: "shorts_reels_tiktok",
    aspect_ratio: "9:16",
    total_duration: Number(duration || scenes.length * 3),
    engine_name: "NeuroCine Director Core",
    director_version: DIRECTOR_VERSION,
    scenario_lock: {
      status: "locked",
      forbidden_changes: FORBIDDEN_SCENARIO_CHANGES,
      allowed_variation_axes: ALLOWED_VARIATION_AXES,
      rule: "Scenario is law. Variations may change cinematography only."
    },
    global_style_lock: styleLock || DEFAULT_STYLE_LOCK,
    global_video_lock: GLOBAL_VIDEO_LOCK,
    character_lock,
    postprocess: { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    scenes,
    export_meta: {
      engine_target: mode === "raw" ? "grok_raw" : "gpt_safe",
      mode,
      version: DIRECTOR_VERSION,
      model,
      source: "director_engine_v3",
      script_excerpt: clean(script).slice(0, 500)
    }
  };
}

export function buildFallbackStoryboard({ script = "", duration = 60, mode = "safe", styleLock = DEFAULT_STYLE_LOCK } = {}) {
  const count = targetSceneCount(duration);
  const parts = sentenceSplit(script);
  const fallback = parts.length ? parts : ["Сильный визуальный крючок из сценария."];
  const scenes = Array.from({ length: count }, (_, index) => {
    const line = clean(fallback[index % fallback.length]);
    return normalizeScene({
      id: padFrame(index), start: index * 3, duration: 3,
      beat_type: index === 0 ? "hook" : index === count - 1 ? "finale" : "story",
      description_ru: line,
      image_prompt_en: `SCENE PRIMARY FOCUS: ${line}. Single clear subject focus, production-ready cinematic composition, foreground / midground / background depth, ${styleLock}.`,
      video_prompt_en: `ANIMATE CURRENT LOCKED FRAME: ${line}. Maintain EXACT same character appearance, face, clothing, and condition as previous frame. Camera uses controlled handheld motion. Motion stays inside the locked story action. Physical realism block: inertia, weight, surface contact, cloth response, atmospheric particles, organic operator drift, slight focus breathing, natural exposure shifts. SFX: scenario-appropriate realistic sound design.`,
      vo_ru: line,
      sfx: "scenario-appropriate realistic sound design",
      camera: "controlled handheld cinematic framing",
      transition: index === 0 ? "hard cut" : "straight cut",
      cut_energy: index === 0 || index === count - 1 ? "high" : "medium",
      continuity_note: "Generated by local Director fallback; preserve scenario order.",
      safety_note: mode === "safe" ? "Non-graphic, observer-framed." : "Production framing, non-erotic, non-instructional."
    }, index, styleLock);
  });
  return buildProject({ script, duration: count * 3, mode, styleLock, scenes, model: "local-fallback" });
}

export function normalizeStoryboard(input = {}, duration = 60, mode = "safe", model = "unknown", styleLock = DEFAULT_STYLE_LOCK, script = "") {
  const rawScenes = Array.isArray(input?.scenes) ? input.scenes : Array.isArray(input) ? input : [];
  const count = targetSceneCount(duration);
  let scenes = rawScenes.map((scene, index) => normalizeScene(scene, index, styleLock));

  if (scenes.length === 0) return buildFallbackStoryboard({ script, duration, mode, styleLock });

  while (scenes.length < count) {
    const base = scenes[scenes.length % Math.max(1, scenes.length)] || {};
    scenes.push(normalizeScene({
      ...base,
      id: padFrame(scenes.length),
      description_ru: `${base.description_ru || "Продолжение сценария"} — деталь / реакция / атмосфера.`,
      beat_type: "detail"
    }, scenes.length, styleLock));
  }
  scenes = scenes.slice(0, count).map((scene, index) => ({ ...scene, id: padFrame(index), start: index * 3, duration: 3 }));

  return buildProject({
    script,
    duration: count * 3,
    mode,
    styleLock: input.global_style_lock || styleLock,
    scenes,
    character_lock: Array.isArray(input.character_lock) ? input.character_lock : [],
    project_name: input.project_name || "NeuroCine Director Storyboard",
    model
  });
}

export function validateDirectorStoryboard(storyboard = {}) {
  const errors = [];
  const scenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : [];
  if (!scenes.length) errors.push("No scenes generated");
  scenes.forEach((scene, index) => {
    const id = scene.id || padFrame(index);
    if (!scene.description_ru) errors.push(`${id}: missing description_ru`);
    if (!String(scene.image_prompt_en || "").startsWith("SCENE PRIMARY FOCUS:")) errors.push(`${id}: image prompt must start with SCENE PRIMARY FOCUS:`);
    if (!String(scene.video_prompt_en || "").includes("Maintain EXACT same character appearance, face, clothing, and condition as previous frame.")) errors.push(`${id}: missing continuity sentence`);
    if (!/Physical realism block:/i.test(String(scene.video_prompt_en || ""))) errors.push(`${id}: missing physical realism block`);
    if (!/SFX:/i.test(String(scene.video_prompt_en || ""))) errors.push(`${id}: SFX missing inside video prompt`);
    if (!scene.vo_ru) errors.push(`${id}: missing vo_ru`);
    if (!scene.sfx) errors.push(`${id}: missing sfx`);
    if (![2, 3, 4].includes(Number(scene.duration))) errors.push(`${id}: invalid duration`);
  });
  return { ok: errors.length === 0, mode: storyboard?.export_meta?.mode || "safe", errors };
}

export function buildDirectorStoryboardUserPrompt({ script, duration = 60, mode = "safe", styleLock = DEFAULT_STYLE_LOCK, projectType = "film", stylePreset = "cinematic_realism" } = {}) {
  const count = targetSceneCount(duration);
  return `Create a NeuroCine Director Storyboard JSON for a vertical Shorts/Reels/TikTok video.

SCRIPT RU:
${script}

PROJECT TYPE: ${projectType}
STYLE PRESET: ${stylePreset}
STYLE LOCK:
${styleLock}

DURATION: ${duration} seconds
SCENE COUNT: exactly ${count} scenes
SCENE DURATION: exactly 3 seconds each
MODE: ${normalizeMode(mode)}

DIRECTOR RULES:
- Scenario is law. Do not invent new plot events outside the provided script.
- You may expand each sentence into visual beats, reaction cuts, environment details and object details, but never change the meaning.
- Every frame must preserve chronology, characters, locations, emotional logic, VO meaning and SFX meaning.
- Variation-ready output: each frame must support later Explore 2x2 where ONLY camera angle, lens, framing, composition and camera distance can change.
- No subtitles, no UI, no watermark, no on-screen text.

IMAGE PROMPT RULES:
- Every image_prompt_en starts exactly with: SCENE PRIMARY FOCUS:
- Use observer framing, one clear subject, foreground / midground / background layers.
- Include style lock.

VIDEO PROMPT RULES:
- Every video_prompt_en starts with ANIMATE CURRENT LOCKED FRAME or clearly animates the current locked frame.
- Include exactly this sentence: Maintain EXACT same character appearance, face, clothing, and condition as previous frame.
- Include: Physical realism block: inertia, weight, contact with surfaces, cloth response, environmental particles, organic handheld operator drift, slight focus breathing, natural exposure shifts.
- Include SFX inside the prompt as: SFX: ...

Return ONLY valid JSON with this schema:
{
  "project_name": "",
  "language": "ru",
  "format": "shorts_reels_tiktok",
  "aspect_ratio": "9:16",
  "total_duration": ${count * 3},
  "global_style_lock": "",
  "global_video_lock": "",
  "character_lock": [],
  "scenes": [
    {
      "id": "frame_01",
      "start": 0,
      "duration": 3,
      "beat_type": "hook|story|detail|escalation|pause|finale",
      "description_ru": "",
      "image_prompt_en": "",
      "video_prompt_en": "",
      "vo_ru": "",
      "sfx": "",
      "camera": "",
      "transition": "",
      "cut_energy": "low|medium|high",
      "continuity_note": "",
      "safety_note": ""
    }
  ],
  "export_meta": { "engine_target": "${mode === "raw" ? "grok_raw" : "gpt_safe"}", "mode": "${normalizeMode(mode)}", "version": "${DIRECTOR_VERSION}" }
}`;
}

export function buildExploreFramePrompt({ scene, styleLock = DEFAULT_STYLE_LOCK } = {}) {
  return `ULTRA CINEMATIC VARIATION GRID — PRODUCTION SPEC

TASK:
Create a 2x2 grid of four shot variations of the EXACT SAME MOMENT.

BASE SCENE:
${scene?.image_prompt_en || scene?.description_ru || ""}

SCENARIO LOCK — NON-NEGOTIABLE:
${FORBIDDEN_SCENARIO_CHANGES.map((x) => `- do not change ${x}`).join("\n")}

ALLOWED VARIATION AXES ONLY:
${ALLOWED_VARIATION_AXES.map((x) => `- ${x}`).join("\n")}

A — EXTREME CLOSE-UP: emotional face focus, shallow DOF.
B — LOW GROUND ANGLE: strong foreground texture, subject rising into frame.
C — WIDE ENVIRONMENTAL: full body and location readable, isolation emphasized.
D — OVER-SHOULDER / OBSTRUCTED: foreground obstruction, layered depth, observer feeling.

STYLE LOCK:
${styleLock}

OUTPUT: single 2x2 grid image, no text, no UI, no subtitles, no watermark.`;
}

export function buildLockedVideoPrompt({ scene, styleLock = DEFAULT_STYLE_LOCK, cameraMode = "cinematic" } = {}) {
  const modeText = {
    calm: "slow restrained handheld drift, minimal motion, observational documentary tone",
    cinematic: "controlled handheld push-in, organic focus breathing, tactile atmosphere",
    aggressive: "urgent handheld compression, stronger camera pressure, faster micro-drift, stronger tension"
  }[cameraMode] || cameraMode;
  return `ANIMATE CURRENT LOCKED FRAME:

FRAME ID: ${scene?.id || "frame_01"}
LOCKED STORY ACTION: ${scene?.description_ru || ""}
LOCKED VISUAL: ${scene?.image_prompt_en || ""}
VOICEOVER LOCK: ${scene?.vo_ru || ""}

Camera mode: ${modeText}.
Motion: realistic micro-movement only; stay inside the locked story action.
Physical realism block: inertia, weight, contact with surfaces, cloth response, environmental particles, organic handheld operator drift, slight focus breathing, natural exposure shifts.

FORBIDDEN CHANGES:
${FORBIDDEN_SCENARIO_CHANGES.map((x) => `- do not change ${x}`).join("\n")}

STYLE LOCK:
${styleLock}

SFX: ${scene?.sfx || "scenario-appropriate realistic sound design"}`;
}
