// engine/sceneEngine_v2.js
// NeuroCine Storyboard Engine v2.4
// Normalizes every storyboard scene after AI generation and applies world/audio/reference guards.

import {
  buildFramePromptsForTarget,
  stripBannedWords,
  NEGATIVE_PROMPT_BASE,
} from "./videoPromptAgent";
import { applyWorldBrainToFrame, buildWorldAudioBlock } from "./storyboardWorldBrain";

export const DURATION_PRESETS = {
  30:  { targetScenes: 10,  wordsMin: 65,   wordsMax: 85,   longForm: false },
  60:  { targetScenes: 20,  wordsMin: 130,  wordsMax: 160,  longForm: false },
  90:  { targetScenes: 30,  wordsMin: 200,  wordsMax: 240,  longForm: false },
  120: { targetScenes: 40,  wordsMin: 270,  wordsMax: 320,  longForm: false },
  180: { targetScenes: 60,  wordsMin: 420,  wordsMax: 480,  longForm: false },
  240: { targetScenes: 80,  wordsMin: 540,  wordsMax: 640,  longForm: true,  chunkSize: 90 },
  300: { targetScenes: 100, wordsMin: 660,  wordsMax: 800,  longForm: true,  chunkSize: 90 },
  360: { targetScenes: 120, wordsMin: 800,  wordsMax: 960,  longForm: true,  chunkSize: 90 },
  420: { targetScenes: 140, wordsMin: 920,  wordsMax: 1120, longForm: true,  chunkSize: 90 },
  480: { targetScenes: 160, wordsMin: 1060, wordsMax: 1280, longForm: true,  chunkSize: 90 },
  540: { targetScenes: 180, wordsMin: 1180, wordsMax: 1440, longForm: true,  chunkSize: 90 },
  600: { targetScenes: 200, wordsMin: 1320, wordsMax: 1600, longForm: true,  chunkSize: 90 },
};

export const STORYBOARD_MODES = {
  safe: {
    label: "GPT SAFE",
    engineTarget: "gpt_safe",
    instruction: "Use safe documentary phrasing, no explicit gore, no erotic or fetishized framing, valid JSON only.",
  },
  raw: {
    label: "GROK RAW",
    engineTarget: "grok_raw",
    instruction: "Increase camera intensity and atmosphere while keeping non-erotic, non-fetishized, non-instructional framing.",
  },
};

export const STORYBOARD_TARGETS = {
  veo3: {
    label: "Google Veo 3",
    description: "60-120 words, audio/SFX block, timing-aware camera motion.",
  },
  grok: {
    label: "Grok Imagine",
    description: "40-80 words, visual hook first, no audio block, single action only.",
  },
};

const EXACT_CONTINUITY = "Maintain EXACT same character appearance, face, clothing, and condition as previous frame.";
const DEFAULT_VIDEO_LOCK = "grounded physical realism, realistic inertia, organic handheld camera drift, visible environmental reaction, fabric responding to motion, audio must be physically possible for the script era, location and visible objects";
const DEFAULT_STYLE_LOCK = "RAW unretouched photograph, NOT CGI, NOT rendered, shot on ARRI Alexa 35, Zeiss Master Prime, natural available light, Kodak Portra 400, 35mm film grain, no subtitles, no UI, no watermark";

export function getDurationPreset(duration = 60) {
  const d = Number(duration);
  return DURATION_PRESETS[d] || DURATION_PRESETS[60];
}

export function isLongForm(duration) {
  return Number(duration) > 180;
}

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

export function normalizeMode(mode = "safe") {
  return mode === "raw" || mode === "grok_raw" ? "raw" : "safe";
}

export function normalizeTarget(target = "veo3") {
  return target === "grok" || target === "grok_imagine" ? "grok" : "veo3";
}

const GENERATOR_SAFE_MAP = [
  { from: /blood stains?/gi, to: "dark weathered marks on fabric" },
  { from: /bloodstains?/gi, to: "dark weathered marks on fabric" },
  { from: /blood on (skin|body|face|clothing)/gi, to: "dark traces on $1" },
  { from: /bleeding/gi, to: "physical distress visible through clothing" },
  { from: /\bblood\b/gi, to: "dark crimson traces on cloth" },
  { from: /\bgore\b/gi, to: "visceral procedural detail" },
  { from: /impact marks?/gi, to: "procedural wear marks" },
  { from: /laceration/gi, to: "fabric disruption" },
  { from: /\bwound(ed|s)?\b/gi, to: "physically marked" },
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
  { from: /\bdying\b/gi, to: "in final physical decline" },
  { from: /\bdead\b/gi, to: "motionless" },
  { from: /\bcorpse\b/gi, to: "still figure" },
];

export function sanitizeForGenerator(text = "") {
  let out = String(text || "");
  for (const rule of GENERATOR_SAFE_MAP) out = out.replace(rule.from, rule.to);
  return out;
}

export function detectObserverMode(script = "") {
  const text = String(script || "");
  const youMatches = text.match(/(?<![а-яёА-ЯЁ])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?![а-яёА-ЯЁ])/gi) || [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (!wordCount) return false;
  return youMatches.length >= 3 && youMatches.length / wordCount >= 0.02;
}

function wordCount(text = "") {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function trimWords(text = "", max = 118) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return words.length > max ? words.slice(0, max).join(" ") : words.join(" ");
}

function cleanPrompt(value = "") {
  return stripBannedWords(sanitizeForGenerator(String(value || "").replace(/\s+/g, " ").trim()));
}

function ensureImagePrompt(image = "", aspectRatio = "9:16") {
  let out = cleanPrompt(image);
  if (!out) out = "documentary physical scene, one clear subject focus, natural light, film grain";
  if (!out.startsWith("SCENE PRIMARY FOCUS:")) out = `SCENE PRIMARY FOCUS: ${out}`;
  if (!/ASPECT RATIO:/i.test(out)) out += ` ASPECT RATIO: ${aspectRatio}`;
  return out;
}

function getSceneVisual(scene = {}) {
  return cleanPrompt(
    scene.image_prompt_en ||
    scene.image_prompt ||
    scene.description_en ||
    scene.description_ru ||
    scene.visual ||
    scene.vo_ru ||
    "documentary scene"
  ).replace(/^SCENE PRIMARY FOCUS:\s*/i, "").replace(/ASPECT RATIO:.*$/i, "").trim();
}

function getMotion(scene = {}) {
  return cleanPrompt(
    scene.story_action_en ||
    scene.action_en ||
    scene.motion ||
    scene.camera_movement ||
    scene.camera ||
    scene.description_en ||
    scene.description_ru ||
    "subtle physical reaction and environmental motion"
  );
}

const CONTINUITY_WORD_COUNT = EXACT_CONTINUITY.trim().split(/\s+/).filter(Boolean).length;

function appendContinuity(body = "", maxTotalWords = 118) {
  let trimmed = String(body || "").replace(/\s+/g, " ").trim();
  trimmed = trimmed.replace(/\s*Maintain EXACT[\s\S]*$/i, "").trim();
  const bodyBudget = Math.max(20, maxTotalWords - CONTINUITY_WORD_COUNT - 1);
  trimmed = trimWords(trimmed, bodyBudget);
  return `${trimmed} ${EXACT_CONTINUITY}`.replace(/\s+/g, " ").trim();
}

function compactGrokVideo(scene = {}, baseVideo = "") {
  const visual = getSceneVisual(scene);
  const motion = getMotion(scene);
  const camera = trimWords(cleanPrompt(scene.camera || "handheld documentary fragment"), 14);
  const body = `ANIMATE CURRENT FRAME: ${trimWords(visual, 18)}. Single action only: ${trimWords(motion, 18)}. Shot like a grounded documentary fragment; ${camera}; tactile atmosphere, real inertia, fabric and particles react naturally.`;
  return appendContinuity(body, 118);
}

function extractAudioBlock(text = "") {
  const re = /\bAudio:[\s\S]*?(?=\bMaintain EXACT|$)/i;
  const match = String(text || "").match(re);
  if (!match) return { body: text, audio: "" };
  return {
    body: text.replace(re, "").replace(/\s+/g, " ").trim(),
    audio: match[0].replace(/\s+/g, " ").trim(),
  };
}

function ensureVeoVideo(scene = {}, baseVideo = "") {
  let out = cleanPrompt(baseVideo || "");
  if (!out) out = `ANIMATE CURRENT FRAME: slow 3-second push-in on ${getSceneVisual(scene)}. Physical motion stays restrained, realistic, and grounded.`;
  if (!out.startsWith("ANIMATE CURRENT FRAME:")) out = `ANIMATE CURRENT FRAME: ${out}`;

  let { body, audio } = extractAudioBlock(out);
  if (!audio) {
    audio = `Audio: restrained documentary ambience. SFX: ${scene.sfx || "low room tone, subtle environmental texture"}. No dialogue, no voiceover.`;
  }
  const audioWords = audio.trim().split(/\s+/).filter(Boolean).length;
  if (audioWords > 25) audio = trimWords(audio, 25);

  const reservedTail = ` ${audio} ${EXACT_CONTINUITY}`;
  const reservedWords = reservedTail.trim().split(/\s+/).filter(Boolean).length;
  const bodyBudget = Math.max(25, 125 - reservedWords);
  const trimmedBody = trimWords(body, bodyBudget);
  return `${trimmedBody} ${audio} ${EXACT_CONTINUITY}`.replace(/\s+/g, " ").trim();
}

function enforceVideoPrompt(scene = {}, baseVideo = "", target = "veo3") {
  if (target === "grok") return compactGrokVideo(scene, baseVideo);
  return ensureVeoVideo(scene, baseVideo);
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
  const result = [];
  for (const s of scenes) {
    const dur = Number(s.duration || 3);
    if (dur <= 4) result.push(s);
    else {
      const chunks = Math.ceil(dur / 3);
      for (let i = 0; i < chunks; i++) result.push({ ...s, duration: clampDuration(dur / chunks) });
    }
  }
  return result;
}

function getCutEnergy(scene = {}, index = 0) {
  const raw = String(scene.cut_energy || "").toLowerCase();
  if (["low", "medium", "high"].includes(raw)) return raw;
  const beat = String(scene.beat_type || scene.beat || "").toLowerCase();
  if (beat.includes("pause")) return "low";
  if (beat.includes("climax") || beat.includes("escalation")) return "high";
  return index % 3 === 2 ? "low" : "medium";
}

export function buildStoryboardUserPrompt({ script = "", duration = 60, mode = "safe", target = "veo3", aspectRatio = "9:16" } = {}) {
  const d = Number(duration) || 60;
  const preset = getDurationPreset(d);
  const normalizedMode = normalizeMode(mode);
  const normalizedTarget = normalizeTarget(target);
  const isObserverMode = detectObserverMode(script);

  return `Generate production storyboard JSON for NeuroCine.
Output ONLY valid JSON. No markdown.

CONTENT MODE: ${normalizedMode}. ${STORYBOARD_MODES[normalizedMode].instruction}
VIDEO TARGET: ${normalizedTarget}. ${STORYBOARD_TARGETS[normalizedTarget].description}
DURATION: ${d}s. Generate EXACTLY ${preset.targetScenes} scenes. Every scene duration must be 2, 3, or 4 seconds. total_duration must equal ${d}.
ASPECT RATIO: ${aspectRatio}.

WORLD / ERA / AUDIO LOGIC — MANDATORY:
Before writing scenes, infer the physical world, era, location, technology level and allowed sound sources from the script.
Audio must come from objects, bodies, weather, animals, water, fire, rooms or machines that physically exist in that world and in the visible frame.
Do NOT add modern sirens, alarms, ambulance, police, cars, engines, phones, radio, electronic warning tones or city noise unless the user script explicitly contains them or the visible scene physically contains them.
A dramatic flood, disaster, danger, fear or tension does NOT automatically allow a siren.
For historical / ancient / medieval scenes, use only era-plausible natural sound and physical ambience.

REFERENCE VISIBILITY LOGIC — MANDATORY:
If a character reference/anchor is used and the face is visible, preserve exact face identity.
If the shot is legs/back/silhouette, preserve identity through body type, hair, clothing, posture and continuity; do not invent a new face.
If the uploaded reference has modern clothing/background but the script is historical, use the reference for face identity only and replace wardrobe/world according to the script era.

${isObserverMode ? `OBSERVER MODE: The script speaks to the viewer as "you". Do NOT invent a named recurring hero. character_lock should be [] or only unnamed background figures. Use POV framing where useful.` : `STANDARD MODE: If a recurring protagonist exists, create character_lock and reuse the same identity in prompts.`}

MANDATORY scene fields:
id, start, duration, description_ru, image_prompt_en, video_prompt_en, vo_ru, sfx, camera, transition, cut_energy, continuity_note, safety_note.

IMAGE PROMPT:
- starts with "SCENE PRIMARY FOCUS:"
- one clear visual focus
- concrete physical details, natural light, film grain
- ends with "ASPECT RATIO: ${aspectRatio}"

VIDEO PROMPT:
- starts with "ANIMATE CURRENT FRAME:"
- ${normalizedTarget === "grok" ? "40-80 words, compact, visual hook first, no Audio block" : "60-120 words, includes Audio and SFX block"}
- audio/SFX must obey WORLD / ERA / AUDIO LOGIC above
- MUST include this exact sentence at the end or near end:
"${EXACT_CONTINUITY}"

REQUIRED root fields:
project_name, language, format, aspect_ratio, total_duration, global_style_lock, global_video_lock, character_lock, postprocess, scenes, export_meta.

SCRIPT:
${script}

Return JSON only.`;
}

export function normalizeStoryboard(raw = {}, requestedDuration = 60, requestedMode = "safe", modelUsed = "openai/gpt-5.4", requestedTarget = "veo3") {
  const mode = normalizeMode(raw?.export_meta?.mode || requestedMode);
  const target = normalizeTarget(raw?.export_meta?.target || requestedTarget);
  const engineTarget = mode === "raw" ? "grok_raw" : "gpt_safe";
  const targetDuration = Number(requestedDuration) || Number(raw.total_duration) || 60;
  const inputScenes = Array.isArray(raw.scenes) ? raw.scenes : Array.isArray(raw.shots) ? raw.shots : [];
  const splitScenes = splitLongScenes(inputScenes.length ? inputScenes : [{ description_ru: "Документальная сцена", vo_ru: "", duration: 3 }]);

  let durations = splitScenes.map((s) => clampDuration(s.duration || 3));
  let sum = durations.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum !== targetDuration && guard < 2000) {
    guard += 1;
    if (sum < targetDuration) {
      const idx = durations.findIndex((d) => d < 4);
      if (idx === -1) break;
      durations[idx] += 1; sum += 1;
    } else {
      const idx = durations.findIndex((d) => d > 2);
      if (idx === -1) break;
      durations[idx] -= 1; sum -= 1;
    }
  }

  const characterLockSafe = Array.isArray(raw.character_lock) ? raw.character_lock.map((char) => ({
    ...char,
    clothing: char.clothing ? sanitizeForGenerator(char.clothing) : char.clothing,
    physical_condition: char.physical_condition ? sanitizeForGenerator(char.physical_condition) : char.physical_condition,
  })) : [];

  const storyboardMeta = {
    project_name: raw.project_name || "NeuroCine Storyboard",
    topic: raw.topic || raw.project_topic || "",
    script: raw.script || raw.full_script || "",
    aspect_ratio: raw.aspect_ratio || "9:16",
    global_style_lock: raw.global_style_lock || DEFAULT_STYLE_LOCK,
    character_lock: characterLockSafe,
  };

  let start = 0;
  const scenes = splitScenes.map((s, i) => {
    const duration = durations[i] || 3;
    const sourceScene = {
      id: padFrame(i + 1),
      start,
      duration,
      beat_type: s.beat_type || s.beat || (i === 0 ? "hook" : i === splitScenes.length - 1 ? "ending" : "escalation"),
      description_ru: sanitizeForGenerator(s.description_ru || s.ru_description || s.description || ""),
      description_en: sanitizeForGenerator(s.description_en || ""),
      story_action_en: sanitizeForGenerator(s.story_action_en || s.action_en || ""),
      action_en: sanitizeForGenerator(s.action_en || ""),
      image_prompt_en: ensureImagePrompt(s.image_prompt_en || s.image_prompt || s.image || s.description_en || s.description_ru || s.vo_ru || "documentary scene", raw.aspect_ratio || "9:16"),
      video_prompt_en: cleanPrompt(s.video_prompt_en || s.video_prompt || s.video || ""),
      vo_ru: s.vo_ru || s.voice || s.vo || "",
      sfx: sanitizeForGenerator(s.sfx || s.sound || "scene-matched ambience"),
      camera: s.camera || s.camera_movement || "organic handheld",
      transition: s.transition || "cut",
      cut_energy: getCutEnergy(s, i),
      continuity_note: s.continuity_note || EXACT_CONTINUITY,
      safety_note: s.safety_note || (mode === "safe" ? "GPT SAFE: documentary framing" : "GROK RAW: intense but safe framing"),
    };

    let imagePrompt = sourceScene.image_prompt_en;
    let videoPrompt = sourceScene.video_prompt_en;
    let negativePrompt = NEGATIVE_PROMPT_BASE;

    try {
      const agentPrompts = buildFramePromptsForTarget({ frame: { ...sourceScene, video_prompt_en: "", motion: getMotion(sourceScene) }, storyboard: storyboardMeta, target });
      imagePrompt = agentPrompts.image_prompt_en || imagePrompt;
      videoPrompt = agentPrompts.video_prompt_en || videoPrompt;
      negativePrompt = agentPrompts.negative_prompt || negativePrompt;
    } catch {}

    const preWorldScene = {
      ...sourceScene,
      end: start + duration,
      image_prompt_en: ensureImagePrompt(imagePrompt, raw.aspect_ratio || "9:16"),
      video_prompt_en: enforceVideoPrompt(sourceScene, videoPrompt, target),
      negative_prompt: negativePrompt,
      target,
    };

    const worldScene = applyWorldBrainToFrame(preWorldScene, storyboardMeta);
    const worldAudio = buildWorldAudioBlock(worldScene, storyboardMeta);
    const finalScene = {
      ...worldScene,
      world_profile: worldAudio.profile.id,
      world_audio_rule: worldAudio.profile.rule,
      negative_prompt: [worldScene.negative_prompt, worldAudio.profile.forbiddenAudio, worldAudio.profile.forbiddenObjects].filter(Boolean).join(", "),
    };

    if (target === "grok") {
      finalScene.image_prompt_grok_en = finalScene.image_prompt_en;
      finalScene.video_prompt_grok_en = finalScene.video_prompt_en;
      finalScene.grok_sfx = finalScene.sfx;
      finalScene.grok_camera = finalScene.camera;
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
    global_style_lock: raw.global_style_lock || DEFAULT_STYLE_LOCK,
    global_video_lock: raw.global_video_lock || DEFAULT_VIDEO_LOCK,
    global_negative_prompt: NEGATIVE_PROMPT_BASE,
    world_audio_lock: "Audio and SFX must be physically possible for the script era, location and visible objects. No modern sirens/alarms unless explicitly scripted or visible.",
    character_lock: characterLockSafe,
    postprocess: raw.postprocess || { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    scenes,
    export_meta: {
      ...(raw.export_meta || {}),
      engine_target: engineTarget,
      mode,
      target,
      model: modelUsed,
      version: "neurocine_storyboard_v2_4_world_audio_brain",
      auto_safe_to_grok: mode === "safe",
      world_audio_brain: true,
      postprocess: { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    },
  };
}

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

      const img = String(s.image_prompt_en || "");
      if (!img.startsWith("SCENE PRIMARY FOCUS:") && !img.includes("documentary")) errors.push(`${expectedId}: image_prompt_en lacks proper opening`);

      const vid = String(s.video_prompt_en || "");
      if (!vid.includes(EXACT_CONTINUITY)) errors.push(`${expectedId}: video prompt missing character continuity line`);

      if (target === "veo3" && !vid.toLowerCase().includes("audio:")) errors.push(`${expectedId}: Veo 3 video prompt missing Audio block`);
      if (target === "grok") {
        const wc = wordCount(vid);
        if (wc > 130) errors.push(`${expectedId}: Grok video prompt too long (${wc} words, max ~120)`);
      }

      if (!s.world_profile && !/WORLD LOGIC|ALLOWED AUDIO|FORBIDDEN AUDIO/i.test(vid)) errors.push(`${expectedId}: world/audio brain metadata missing`);

      if (!["low", "medium", "high"].includes(String(s.cut_energy || "").toLowerCase())) errors.push(`${expectedId}: cut_energy must be low, medium, or high`);

      if (mode === "safe") {
        const risky = `${img} ${vid}`.toLowerCase();
        ["naked", "nude", "bare torso", "exposed body", "explicit gore"].forEach((word) => {
          if (risky.includes(word)) errors.push(`${expectedId}: safe mode risky wording: ${word}`);
        });
      }

      total += Number(s.duration || 0);
    });

    if (Number(data.total_duration) !== total) errors.push("total_duration must equal sum of scene durations");
  }

  return { ok: errors.length === 0, mode, target, errors };
}
