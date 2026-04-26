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

export function buildStoryboardUserPrompt({ script = "", duration = 60, mode = "safe" } = {}) {
  const d = Number(duration) || 60;
  const preset = getDurationPreset(d);
  const normalizedMode = normalizeMode(mode);
  const modeConfig = STORYBOARD_MODES[normalizedMode];

  return `Generate a production storyboard JSON for NeuroCine.\n\nMODE: ${normalizedMode}\nMODE INSTRUCTION: ${modeConfig.instruction}\n\nTarget duration: ${d} seconds.\nTarget scenes: ${preset.targetScenes}.\nTarget VO length: ${preset.wordsMin}-${preset.wordsMax} Russian words.\nAverage shot duration: 3 seconds.\nStrictly make total_duration equal ${d}.\n\nScene quality rule: internally score every scene from 1 to 10. If any scene is below 8, rewrite it until it reaches 8+. Do NOT output the score unless the JSON schema explicitly includes it.\n\nSCRIPT:\n${script}\n\njson`;
}

function padFrame(n) {
  return `frame_${String(n).padStart(2, "0")}`;
}

function clampDuration(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(4, Math.max(2, Math.round(n)));
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
  const sceneCount = Math.max(1, inputScenes.length);

  let durations = inputScenes.map((s) => clampDuration(s.duration || 3));
  let sum = durations.reduce((a, b) => a + b, 0);

  // Adjust durations gently to hit target exactly while staying in the 2-4s cinematic range.
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
  const scenes = inputScenes.map((s, i) => {
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
      continuity_note: s.continuity_note || "",
      safety_note: s.safety_note || (mode === "safe"
        ? "GPT SAFE: documentary framing, non-erotic, non-fetishized, non-graphic wording"
        : "GROK RAW: cinematic intensity, non-erotic, non-fetishized, non-instructional"),
    });
    start += duration;
    return normalized;
  });

  return {
    project_name: raw.project_name || "NeuroCine Storyboard",
    language: raw.language || "ru",
    format: raw.format || "shorts_reels_tiktok",
    aspect_ratio: raw.aspect_ratio || "9:16",
    total_duration: start,
    global_style_lock: raw.global_style_lock || "cinematic documentary realism, historical accuracy, 35mm anamorphic, handheld, natural overcast light, realistic textures, Kodak Vision3 500T grain, no subtitles/UI/watermarks",
    character_lock: raw.character_lock || [],
    scenes,
    export_meta: {
      ...(raw.export_meta || {}),
      engine_target: engineTarget,
      mode,
      model: modelUsed,
      version: "neurocine_vFinal_plus_site",
    },
  };
}

export function validateStoryboard(data = {}, requestedMode = "safe") {
  const errors = [];
  const mode = normalizeMode(data?.export_meta?.mode || requestedMode);
  if (!data || typeof data !== "object") errors.push("Storyboard is not an object");
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) errors.push("scenes[] is empty");
  if (Array.isArray(data.scenes)) {
    let total = 0;
    data.scenes.forEach((s, i) => {
      const expectedId = padFrame(i + 1);
      if (s.id !== expectedId) errors.push(`scene ${i + 1}: id must be ${expectedId}`);
      if (!String(s.image_prompt_en || "").startsWith("SCENE PRIMARY FOCUS:")) errors.push(`${expectedId}: image_prompt_en must start with SCENE PRIMARY FOCUS:`);
      if (!String(s.video_prompt_en || "").includes("Maintain EXACT same character appearance")) errors.push(`${expectedId}: video prompt missing exact character continuity line`);
      if (!String(s.video_prompt_en || "").toLowerCase().includes("sfx")) errors.push(`${expectedId}: video_prompt_en must include SFX`);
      if (!s.vo_ru) errors.push(`${expectedId}: vo_ru is empty`);
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
