// engine/sceneEngine_v2.js
// NeuroCine Storyboard Engine v2.4
// Normalizes every storyboard scene after AI generation and applies world/audio/reference guards.

import {
  buildFramePromptsForTarget,
  stripBannedWords,
  NEGATIVE_PROMPT_BASE,
} from "./videoPromptAgent";
import { applyWorldBrainToFrame, buildWorldAudioBlock } from "./storyboardWorldBrain";
import { toPromptEnglish } from "./promptLanguage";

export const DURATION_PRESETS = {
  30:  { targetScenes: 10,  wordsMin: 65,   wordsMax: 85,   longForm: false },
  45:  { targetScenes: 15,  wordsMin: 95,   wordsMax: 120,  longForm: false },
  60:  { targetScenes: 20,  wordsMin: 130,  wordsMax: 160,  longForm: false },
  87:  { targetScenes: 29,  wordsMin: 190,  wordsMax: 230,  longForm: false },
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
  script_strict: {
    label: "СТРОГО ПО СЦЕНАРИЮ",
    engineTarget: "gpt_safe",
    instruction: "STRICT SCRIPT MODE: Each scene visual description MUST directly and literally illustrate the exact voiceover line assigned to that scene. Do NOT invent settings, characters, objects, or actions not explicitly mentioned in that scene's script line. If the script says 'шахтёр поднимает фонарь' — show exactly that, nothing else. Visual imagination is forbidden; literal translation of text to image only.",
  },
  short_film: {
    label: "SHORT FILM / DIALOGUE",
    engineTarget: "short_film_dialogue",
    instruction: "SCREENPLAY MODE: Treat the input as a short film script, not a voiceover article. Preserve dialogue, on-screen text, blocking, reveals, reaction shots and continuity. Dialogue is allowed ONLY when explicitly written in the script; never invent lines.",
  },
  trailer: {
    label: "TRAILER STORYBOARD",
    engineTarget: "trailer_storyboard",
    instruction: "TRAILER MODE: Build a complete film trailer frame plan first, then lock cast, location, style, grid continuity and dialogue/VO metadata. Every frame is part of the same production; do not redesign characters or locations between grid parts.",
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
const GROK_VIDEO_WORD_LIMIT = 80;
const DEFAULT_VIDEO_LOCK = "grounded physical realism, realistic inertia, organic handheld camera drift, visible environmental reaction, fabric responding to motion, audio must be physically possible for the script era, location and visible objects";
const DEFAULT_STYLE_LOCK = "RAW unretouched photograph, NOT CGI, NOT rendered, shot on ARRI Alexa 35, Zeiss Master Prime, natural available light, Kodak Portra 400, 35mm film grain, no subtitles, no UI, no watermark";

export function getDurationPreset(duration = 60, forcedTargetScenes = null) {
  const d = Number(duration);
  const forcedScenes = Number(forcedTargetScenes);
  if (Number.isFinite(forcedScenes) && forcedScenes > 0) {
    const targetScenes = Math.max(1, Math.round(forcedScenes));
    const wordsMin = Math.round(d * 2.2 * 0.9);
    const wordsMax = Math.round(d * 2.5 * 1.05);
    const longForm = d > 180;
    return { targetScenes, wordsMin, wordsMax, longForm, ...(longForm ? { chunkSize: 90 } : {}) };
  }
  if (DURATION_PRESETS[d]) return DURATION_PRESETS[d];
  // Интерполяция для нестандартных длительностей (45с, 75с, 150с и т.д.)
  // Базовая логика: 1 кадр на каждые 3 секунды, ~2.2 слова/с
  const targetScenes = Math.max(3, Math.round(d / 3));
  const wordsMin = Math.round(d * 2.2 * 0.9);
  const wordsMax = Math.round(d * 2.5 * 1.05);
  const longForm = d > 180;
  return { targetScenes, wordsMin, wordsMax, longForm, ...(longForm ? { chunkSize: 90 } : {}) };
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
  const value = String(mode || "safe").toLowerCase();
  if (value === "raw" || value === "grok_raw") return "raw";
  if (value === "script_strict" || value === "strict" || value === "source_of_truth") return "script_strict";
  if (value === "short_film" || value === "dialogue" || value === "film_dialogue" || value === "screenplay") return "short_film";
  if (value === "trailer" || value === "trailer_storyboard" || value === "film_trailer" || value === "teaser") return "trailer";
  return "safe";
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

function cleanSfxCue(value = "") {
  const cleaned = sanitizeForGenerator(String(value || ""))
    .replace(/\broom tone\b/gi, "near-silence")
    .replace(/\b(background|ambient|electrical|ventilation|low)?\s*hum\b/gi, "isolated material tick")
    .replace(/\bdrone bed\b|\bdrone\b/gi, "sparse silence")
    .replace(/\b(subtle|generic|environmental)?\s*ambience\b/gi, "clean physical SFX")
    .replace(/\bambient sound\b/gi, "clean physical SFX")
    .replace(/фонов(ый|ого|ому|ым)?\s+гул/gi, "точный близкий физический звук")
    .replace(/\bгул\b/gi, "короткий физический щелчок")
    .replace(/\s+/g, " ")
    .trim();
  return toPromptEnglish(cleaned, { fallback: "clean close physical SFX, silence between cues" });
}

function ensureImagePrompt(image = "", aspectRatio = "9:16", preserveRussian = []) {
  let out = cleanPrompt(toPromptEnglish(image, {
    fallback: "documentary physical scene, one clear subject focus, natural light, film grain",
    preserveRussian,
  }));
  if (!out) out = "documentary physical scene, one clear subject focus, natural light, film grain";
  if (!out.startsWith("SCENE PRIMARY FOCUS:")) out = `SCENE PRIMARY FOCUS: ${out}`;
  if (!/ASPECT RATIO:/i.test(out)) out += ` ASPECT RATIO: ${aspectRatio}`;
  return out;
}

function getSceneVisual(scene = {}) {
  return toPromptEnglish(cleanPrompt(
    scene.visual_beat_en ||
    scene.visual_beat_ru ||
    scene.shot_visual_en ||
    scene.shot_visual_ru ||
    scene.visual_scene_en ||
    scene.visual_scene_ru ||
    scene.allowed_visual ||
    scene.image_prompt_en ||
    scene.image_prompt ||
    scene.description_en ||
    scene.description_ru ||
    scene.visual ||
    scene.vo_ru ||
    "documentary scene"
  ).replace(/^SCENE PRIMARY FOCUS:\s*/i, "").replace(/ASPECT RATIO:.*$/i, "").trim(), { fallback: "documentary scene", preserveRussian: normalizeTextList(scene.on_screen_text || []) });
}

function getScriptLine(scene = {}) {
  return toPromptEnglish(cleanPrompt(scene.script_line_ru || scene.script_line || scene.vo_ru || ""), { fallback: "current scripted beat", preserveRussian: normalizeTextList(scene.on_screen_text || []) });
}

function voiceLockKey(value = "") {
  return cleanPrompt(value).toLowerCase();
}

function makeVoiceId(index = 0) {
  return `voice_${String(index + 1).padStart(2, "0")}`;
}

function collectDialogueSpeakers(scenes = []) {
  const speakers = [];
  for (const scene of Array.isArray(scenes) ? scenes : []) {
    const dialogue = scene?.dialogue || scene?.dialogues || scene?.lines || [];
    const lines = Array.isArray(dialogue) ? dialogue : [dialogue];
    for (const line of lines) {
      if (!line || typeof line !== "object") continue;
      const speaker = cleanPrompt(line.speaker || line.character || line.name || "");
      if (speaker && !speakers.some((x) => voiceLockKey(x) === voiceLockKey(speaker))) speakers.push(speaker);
    }
  }
  return speakers;
}

function normalizeVoiceLock(value = [], scenes = []) {
  const rawItems = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  const items = [];
  const seen = new Set();

  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const character = cleanPrompt(item.character || item.name || item.speaker || "");
    if (!character) continue;
    const key = voiceLockKey(character);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      character,
      voice_id: cleanPrompt(item.voice_id || item.voiceId || item.id || "") || makeVoiceId(items.length),
      voice_profile: cleanPrompt(item.voice_profile || item.profile || item.description || ""),
      delivery_arc: cleanPrompt(item.delivery_arc || item.delivery || item.arc || ""),
    });
  }

  for (const speaker of collectDialogueSpeakers(scenes)) {
    const key = voiceLockKey(speaker);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      character: speaker,
      voice_id: makeVoiceId(items.length),
      voice_profile: "",
      delivery_arc: "",
    });
  }

  return items;
}

function normalizeCastLock(value = [], characterLock = []) {
  const rawItems = Array.isArray(value) && value.length
    ? value
    : Array.isArray(characterLock)
      ? characterLock.map((char, i) => ({
          id: char.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
          role: char.role || char.name || `Character ${i + 1}`,
          visual_identity: [char.description, char.face_features, char.hair, char.physical_condition].filter(Boolean).join("; "),
          wardrobe: char.clothing || "",
          forbidden_changes: "no different actor, no different face, no different age, no wardrobe drift unless explicitly scripted",
        }))
      : [];

  return rawItems
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const role = toPromptEnglish(cleanPrompt(item.role || item.name || item.character || item.id || `Character ${i + 1}`), { fallback: `Character ${i + 1}` });
      if (!role) return null;
      return {
        id: cleanPrompt(item.id || `CHAR_${String(i + 1).padStart(2, "0")}`),
        role,
        visual_identity: toPromptEnglish(cleanPrompt(item.visual_identity || item.must_appear_as || item.description || ""), { fallback: "same actor identity, face, body type and emotional condition from first appearance" }),
        wardrobe: toPromptEnglish(cleanPrompt(item.wardrobe || item.clothing || ""), { fallback: "same wardrobe from first appearance" }),
        forbidden_changes: toPromptEnglish(cleanPrompt(item.forbidden_changes || item.forbidden || "no actor redesign, no wardrobe drift, no age drift"), { fallback: "no actor redesign, no wardrobe drift, no age drift" }),
      };
    })
    .filter(Boolean);
}

function normalizeLocationLock(value = {}) {
  if (!value || typeof value !== "object") {
    const text = toPromptEnglish(cleanPrompt(value || ""), { fallback: "" });
    return text ? { main: text } : {};
  }
  return {
    main: toPromptEnglish(cleanPrompt(value.main || value.main_location || value.location || ""), { fallback: "same locked location" }),
    materials: toPromptEnglish(cleanPrompt(value.materials || ""), { fallback: "" }),
    lighting: toPromptEnglish(cleanPrompt(value.lighting || ""), { fallback: "" }),
    spatial_rules: toPromptEnglish(cleanPrompt(value.spatial_rules || value.spatialRules || ""), { fallback: "" }),
    forbidden: toPromptEnglish(cleanPrompt(value.forbidden || ""), { fallback: "" }),
  };
}

function formatProductionBibleLock(productionBible = null) {
  if (!productionBible || typeof productionBible !== "object" || productionBible.enabled === false) return "";
  const characters = Array.isArray(productionBible.characters)
    ? productionBible.characters.filter((item) => item && typeof item === "object" && cleanPrompt(item.name || item.role || item.identity || item.referenceName))
    : [];
  const locations = Array.isArray(productionBible.locations)
    ? productionBible.locations.filter((item) => item && typeof item === "object" && cleanPrompt(item.name || item.description || item.referenceName))
    : [];
  const style = productionBible.style && typeof productionBible.style === "object" ? productionBible.style : {};
  const charLines = characters.length
    ? characters.map((item, i) => {
      const id = cleanPrompt(item.id || `CHAR_${String(i + 1).padStart(2, "0")}`);
      return `${id}: name=${cleanPrompt(item.name || "") || "script character"}; role=${cleanPrompt(item.role || "") || "scripted role"}; identity=${cleanPrompt(item.identity || "") || "infer from script/reference"}; wardrobe=${cleanPrompt(item.wardrobe || "") || "scripted wardrobe only"}; reference=${item.referenceName ? cleanPrompt(item.referenceName) : "none"}; forbidden=${cleanPrompt(item.negative || item.forbidden_changes || "") || "no redesign"}`;
    }).join("\n")
    : "No manual cast references. Extract cast from script and lock stable identity.";
  const locLines = locations.length
    ? locations.map((item, i) => {
      const id = cleanPrompt(item.id || `LOC_${String(i + 1).padStart(2, "0")}`);
      return `${id}: name=${cleanPrompt(item.name || "") || "scripted location"}; description=${cleanPrompt(item.description || "") || "infer from script"}; materials=${cleanPrompt(item.materials || "") || "script-supported materials only"}; lighting=${cleanPrompt(item.lighting || "") || "physically plausible practical light"}; reference=${item.referenceName ? cleanPrompt(item.referenceName) : "none"}; forbidden=${cleanPrompt(item.negative || "") || "no redesign"}`;
    }).join("\n")
    : "No manual location references. Extract locations from script and lock recurring geography.";
  return `
PRODUCTION BIBLE LOCK — USE BEFORE STORYBOARD:
This bible is the continuity source before scene generation. Use it to create root cast_lock, location_lock, style_bible and scene-level allowed/forbidden fields.
Reference uploads are anchors only; they must not introduce unscripted objects, locations, actions, costumes, eras or threats.

CAST INPUT:
${charLines}

LOCATION INPUT:
${locLines}

STYLE INPUT:
Selected style: ${cleanPrompt(style.label || style.preset || "") || "selected UI style"}
Style lock: ${cleanPrompt(style.lock || "") || "use selected style preset"}
Style reference: ${style.referenceName ? cleanPrompt(style.referenceName) : "none"}
Style forbidden: ${cleanPrompt(style.negative || "") || "no style drift"}

PRODUCTION BIBLE RULES:
- Cast lock is identity continuity, not a command to put every character in every frame.
- Characters may appear only after the current script line introduces or directly implies them.
- Location/style references preserve look and geography only; they cannot add new plot content.
- If model creativity conflicts with this bible or with script_line_ru, script_line_ru wins first, this bible wins second, style text wins last.
`;
}

function findVoiceIdForSpeaker(speaker = "", voiceLock = []) {
  const key = voiceLockKey(speaker);
  if (!key) return "";
  const match = (Array.isArray(voiceLock) ? voiceLock : []).find((item) => voiceLockKey(item.character || item.name || item.speaker || "") === key);
  return cleanPrompt(match?.voice_id || "");
}

function normalizeDialogue(value, voiceLock = []) {
  if (Array.isArray(value)) {
    return value
      .map((line) => {
        if (typeof line === "string") return cleanPrompt(line);
        if (!line || typeof line !== "object") return "";
        const speaker = cleanPrompt(line.speaker || line.character || "");
        const text = cleanPrompt(line.text || line.line || line.dialogue || "");
        const voiceId = cleanPrompt(line.voice_id || line.voiceId || line.voice || "") || findVoiceIdForSpeaker(speaker, voiceLock);
        const delivery = cleanPrompt(line.delivery || line.tone || line.performance || "");
        return text ? { ...(speaker ? { speaker } : {}), ...(voiceId ? { voice_id: voiceId } : {}), text, ...(delivery ? { delivery } : {}) } : "";
      })
      .filter(Boolean);
  }
  if (value && typeof value === "object") return normalizeDialogue([value], voiceLock);
  const text = cleanPrompt(value || "");
  return text ? [text] : [];
}

function dialogueToText(value) {
  return normalizeDialogue(value)
    .map((line) => typeof line === "string" ? line : [`${line.speaker || ""}${line.voice_id ? ` [${line.voice_id}]` : ""}`.trim(), line.text].filter(Boolean).join(": "))
    .join(" / ");
}

function normalizeTextList(value) {
  if (Array.isArray(value)) return value.map((x) => cleanPrompt(typeof x === "string" ? x : x?.text || "")).filter(Boolean);
  if (value && typeof value === "object") return normalizeTextList(value.text || value.value || "");
  const text = cleanPrompt(value || "");
  return text ? [text] : [];
}

function getMotion(scene = {}) {
  return cleanPrompt(
    scene.story_action_en ||
    scene.action_en ||
    scene.motion ||
    scene.visual_beat_en ||
    scene.visual_beat_ru ||
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

function enforceGrokVideoWordLimit(text = "", maxTotalWords = GROK_VIDEO_WORD_LIMIT) {
  let cleaned = cleanPrompt(text);
  const hasContinuity = cleaned.includes(EXACT_CONTINUITY);
  let body = hasContinuity ? cleaned.replace(EXACT_CONTINUITY, "").trim() : cleaned;
  body = body.replace(/\s*Maintain EXACT[\s\S]*$/i, "").trim();
  const continuityBudget = hasContinuity ? wordCount(EXACT_CONTINUITY) + 1 : 0;
  const bodyBudget = Math.max(20, maxTotalWords - continuityBudget);
  return cleanPrompt(`${trimWords(body, bodyBudget)}${hasContinuity ? ` ${EXACT_CONTINUITY}` : ""}`);
}

function compactGrokVideo(scene = {}, baseVideo = "") {
  const scriptLine = getScriptLine(scene);
  const sourceTruth = scriptLine || getSceneVisual(scene);
  const camera = trimWords(cleanPrompt(scene.camera || "handheld"), 8);
  const duration = Math.min(10, Math.max(3, Number(scene.duration || 5)));
  const safeSfx = cleanSfxCue(scene.sfx);
  const sfxShort = safeSfx ? trimWords(String(safeSfx).split(" — ")[0], 7) : "clean close SFX, silence between cues";
  const dialogueText = dialogueToText(scene.dialogue);
  const body = [
    "ANIMATE CURRENT FRAME: SOURCE OF TRUTH: script line.",
    `Script: "${trimWords(sourceTruth, 18)}".`,
    dialogueText ? `Dialogue: "${trimWords(dialogueText, 14)}". Keep voice_id. No extra speech.` : "",
    "Preserve uploaded frame; animate only this described action.",
    "No new objects, locations, characters, or scene change.",
    `Camera: ${camera}.`,
    `SFX: ${sfxShort}; clean ASMR, no hum, drone, room tone or music.`,
    `Photorealistic 24fps. ${duration}s --motion 4`,
  ].join(" ");
  return enforceGrokVideoWordLimit(appendContinuity(body, GROK_VIDEO_WORD_LIMIT), GROK_VIDEO_WORD_LIMIT);
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
  const dialogueText = dialogueToText(scene.dialogue);
  const visibleText = normalizeTextList(scene.on_screen_text || []);
  body = toPromptEnglish(body, { fallback: "ANIMATE CURRENT FRAME: restrained physical motion in the current storyboard frame", preserveRussian: visibleText });
  if (!audio) {
    const cleanSfx = cleanSfxCue(scene.sfx) || "clean close physical SFX, silence between cues";
    audio = dialogueText
      ? `Audio: clean close-mic diegetic ASMR only, silence between cues. Dialogue: exact scripted line only: ${dialogueText}. Keep voice_id and delivery. SFX: ${cleanSfx}. No background hum, drone, room tone, music, extra speech or voiceover.`
      : `Audio: clean close-mic diegetic ASMR only, silence between cues. SFX: ${cleanSfx}. No background hum, drone, room tone, music, dialogue or voiceover.`;
  }
  audio = toPromptEnglish(audio, { fallback: audio, preserveRussian: [dialogueText, ...visibleText].filter(Boolean) });
  const audioWords = audio.trim().split(/\s+/).filter(Boolean).length;
  if (audioWords > (dialogueText ? 55 : 40)) audio = trimWords(audio, dialogueText ? 55 : 40);

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

function clampDuration(value, maxDuration = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  const max = Math.max(4, Math.min(10, Math.round(Number(maxDuration) || 4)));
  return Math.min(max, Math.max(2, Math.round(n)));
}

function splitLongScenes(scenes = [], maxDuration = 4) {
  const result = [];
  const max = Math.max(4, Math.min(10, Math.round(Number(maxDuration) || 4)));
  for (const s of scenes) {
    const dur = Number(s.duration || 3);
    if (dur <= max) result.push(s);
    else {
      const chunks = Math.ceil(dur / max);
      for (let i = 0; i < chunks; i++) result.push({ ...s, duration: clampDuration(dur / chunks, max) });
    }
  }
  return result;
}

function fitSceneCount(scenes = [], targetScenes = null) {
  const target = Number(targetScenes);
  if (!Number.isFinite(target) || target <= 0) return scenes;
  const wanted = Math.max(1, Math.round(target));
  const source = Array.isArray(scenes) && scenes.length ? scenes : [{ description_ru: "Документальная сцена", vo_ru: "", duration: 3 }];
  if (source.length === wanted) return source;
  if (source.length > wanted) return source.slice(0, wanted);
  const result = [...source];
  while (result.length < wanted) {
    const prev = result[result.length - 1] || source[0];
    result.push({
      ...prev,
      id: padFrame(result.length + 1),
      description_ru: prev.description_ru || prev.vo_ru || "Продолжение текущего scripted beat",
      continuity_note: [prev.continuity_note, "Additional timing frame created to preserve requested exact frame count."].filter(Boolean).join(" "),
    });
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

export function buildStoryboardUserPrompt({ script = "", duration = 60, mode = "safe", target = "veo3", aspectRatio = "9:16", targetScenes = null, frameSeconds = 3, timingMode = "fixed", productionBible = null } = {}) {
  const d = Number(duration) || 60;
  const normalizedMode = normalizeMode(mode);
  const normalizedTarget = normalizeTarget(target);
  const requestedTargetScenes = Number(targetScenes);
  const hasForcedScenes = Number.isFinite(requestedTargetScenes) && requestedTargetScenes > 0;
  const safeFrameSeconds = Math.max(2, Math.min(10, Number(frameSeconds) || 3));
  const timingLabel = String(timingMode || "fixed").toLowerCase() === "auto" ? "auto_script_scan" : "manual_exact";

  // Детектируем реальную длину скрипта по словам (~2.2 сл/с для русского диктора).
  // Если скрипт длиннее выбранной длительности на >20% — адаптируем количество кадров
  // чтобы не обрезать контент. Итоговая длительность раундится до кратного 3с.
  const scriptWords = script.trim().split(/\s+/).filter(Boolean).length;
  const scriptEstSec = scriptWords > 0 ? Math.round(scriptWords / 2.2) : d;
  const lockSelectedDuration = normalizedMode === "trailer";
  const effectiveDuration = !lockSelectedDuration && scriptEstSec > d * 1.20
    ? Math.max(d, Math.round(scriptEstSec / 3) * 3)
    : d;
  const durationMismatch = effectiveDuration > d;

  const preset = getDurationPreset(effectiveDuration, hasForcedScenes ? requestedTargetScenes : null);
  const isObserverMode = detectObserverMode(script);
  const isScriptStrict = normalizedMode === "script_strict";
  const isShortFilm = normalizedMode === "short_film";
  const isTrailer = normalizedMode === "trailer";
  const isFilmMode = isShortFilm || isTrailer;
  const productionBibleBlock = formatProductionBibleLock(productionBible);

  return `Generate production storyboard JSON for NeuroCine.
Output ONLY valid JSON. No markdown.

CONTENT MODE: ${normalizedMode}. ${STORYBOARD_MODES[normalizedMode].instruction}
VIDEO TARGET: ${normalizedTarget}. ${STORYBOARD_TARGETS[normalizedTarget].description}
DURATION: ${effectiveDuration}s. Generate EXACTLY ${preset.targetScenes} scenes. TIMING MODE: ${timingLabel}. Preferred average: ${safeFrameSeconds}s per frame. Every scene duration must be 2-${isTrailer ? 10 : 4} seconds. total_duration must equal ${effectiveDuration}.${durationMismatch ? `\nNOTE: script word count (~${scriptWords} words ≈ ${scriptEstSec}s) exceeds selected duration (${d}s). Scene count was scaled up to cover the full script.` : ""}
${hasForcedScenes ? `CUSTOM FRAME COUNT IS AUTHORITATIVE: output exactly ${preset.targetScenes} frames/scenes, even if this is 27, 29, 31 or any other non-grid number. Do not round to a 2x2 grid.` : ""}
${timingLabel === "auto_script_scan" ? "AUTO TIMING: scan the script for meaningful beats, dialogue lines, reveals, inserts and reaction shots, then assign those beats across the requested frames without inventing new story content." : ""}
ASPECT RATIO: ${aspectRatio}.
${productionBibleBlock}
${isScriptStrict ? `
STRICT SCRIPT DISTRIBUTION — MANDATORY:
Split the script text into EXACTLY ${preset.targetScenes} sequential segments (one per scene).
Each scene's vo_ru = its assigned script segment verbatim.
Each scene's visual description = a LITERAL camera shot of exactly what that text line describes.
No invented locations, characters, objects or actions beyond what the text explicitly names.
Sequence must cover 100% of the script from first word to last — no skipping, no repeating.
` : ""}
${isFilmMode ? `
SHORT FILM / DIALOGUE MODE — MANDATORY:
Treat SCRIPT as a screenplay for a short film, not as narrator VO.
Break the script into cinematic beats: establishing shot, inserts, OTS, shot/reverse-shot, reaction close-ups, reveal shots, chase/action beats, final sting.
Preserve every written dialogue line exactly in a scene field "dialogue". Dialogue is diegetic character speech, not narrator VO.
Create root "voice_lock" for every speaking character: stable character name, stable voice_id, voice_profile, delivery_arc. Reuse the exact same voice_id in every dialogue line for that speaker.
Preserve every written screen title/sign/display text exactly in "on_screen_text". Do not put subtitles into image_prompt_en unless the script explicitly says text appears on screen.
Each scene must include "script_line_ru" with the exact source beat from the script, "blocking" with actor positions/movement, and "shot_role" such as establishing, insert, dialogue, reaction, reveal, chase, climax, final_sting.
Do NOT invent dialogue lines, extra exposition, new characters, new locations, or new supernatural rules.
For dialogue scenes, use cinematic coverage: who is speaking, who listens, eye-line, reaction, hand movement and spatial position inside the scripted location.
For non-dialogue scenes, dialogue must be [].
` : ""}
${isTrailer ? `
TRAILER STORYBOARD MODE — MANDATORY:
Build the entire ${preset.targetScenes}-frame trailer plan first, then write frames. The plan must remain one film, not separate grid concepts.
Create root "cast_lock" for all recurring characters and root "location_lock" for recurring places. Create root "style_bible" summarizing visual style, lens, palette, lighting, production design and genre rhythm.
Create root "grid_continuity" explaining how PART grids continue: PART 1 establishes cast/location/style; PART 2+ must reuse cast_lock, location_lock, style_bible and previous PART visual DNA.
If the frame count is odd or custom (27, 29, 31, etc.), keep exact frame count and allow the final PART grid to contain any remaining cell count. Do not add or remove frames to make a perfect 2x2 grid.
For long format up to 10 minutes, preserve cast_lock, location_lock, style_bible, voice_lock and frame numbering across all chunks.
Narrator/trailer VO belongs in vo_ru. Character speech belongs only in dialogue[]. Supernatural whispers/offscreen lines may use dialogue with speaker "Offscreen voice" and stable voice_id.
Do NOT create new actors, new scripted-location design, new costumes, or new supernatural rules between frames unless the script explicitly introduces them.
SCRIPT BREAKDOWN PASS: before scenes, infer first appearance of each character, allowed locations, scripted props/signs/displays, dialogue lines and ordered visual beats.
Every trailer scene must include visual_beat_ru, visual_beat_en, allowed_characters, allowed_objects, allowed_location and forbidden_visuals.
If a script line is abstract, make a minimal concrete shot from the already established locked location. Do NOT add people before they are introduced.
For multiple generated variants of the same PART, keep identical story content and vary only camera angle, focal length, distance, foreground layer or composition.

TRAILER HOOK PACING — NON-NEGOTIABLE:
The first PART must sell the movie premise immediately. Do NOT spend the first 4 frames on only empty establishing shots or abstract narration.
Compress abstract opening lines into ONE concrete hook frame. A trailer frame may combine 2-3 exact adjacent source lines in script_line_ru when needed to form one strong beat; never paraphrase them as new story.
If the script introduces recurring protagonists anywhere in the first act, they must appear by frame 2 unless the script explicitly delays all people.
If the script contains an inciting anomaly/prop/sign/button/display/discovery, it must appear by frame 3.
Frame 4 must show the first consequence, choice, trap, threat, or irreversible movement into danger if such a beat exists in the script.
For a 4-frame PART, use this mini-arc:
1. HOOK IMAGE: the core location/anomaly/premise in one concrete shot.
2. HUMAN STAKE: the recurring cast or victim group introduced by the script.
3. INCITING DETAIL: the object/sign/display/action that makes the situation wrong.
4. FIRST DANGER: the choice/trap/descent/reaction that makes escape uncertain.
Opening scenes may jump forward within the script to these key beats, but must preserve story order inside the selected hook beats.
After the hook PART, continue covering the remaining story beats in order without losing the full scenario arc.
` : ""}
VISUAL FIDELITY — MANDATORY FOR ALL MODES:
SOURCE OF TRUTH = each scene's script_line_ru / vo_ru source line.
Image prompts, video prompts, objects, locations, characters, actions, weather and time of day must be derived from that exact source line.
Reference images can lock identity/composition/style, but they MUST NOT introduce story objects, locations, wardrobe, actions or era details absent from the source line.
Every scene's visual description, objects, characters, locations and actions MUST have DIRECT textual support in that scene's source line.
If the script line says "руки дрожат над кружкой" — the scene shows HANDS and a CUP. NOT feet. NOT a corridor. NOT POV walking.
If an object, location or action is NOT in the script line → it MUST NOT appear in the visual description.
Creative cinematic interpretation is FORBIDDEN if it adds elements absent from the script.
Style is a formula only: lens, camera behavior, color grade, contrast, grain, texture and lighting quality. Style cannot introduce new objects, locations, eras, costumes or characters.

WORLD / ERA / AUDIO LOGIC — MANDATORY:
Before writing scenes, infer the physical world, era, location, technology level and allowed sound sources from the script.
Audio must come from objects, bodies, weather, animals, water, fire, rooms or machines that physically exist in that world and in the visible frame.
Do NOT add modern sirens, alarms, ambulance, police, cars, engines, phones, radio, electronic warning tones or city noise unless the user script explicitly contains them or the visible scene physically contains them.
A dramatic flood, disaster, danger, fear or tension does NOT automatically allow a siren.
Never use generic background hum, drone beds, room tone filler, white noise, music beds or vague ambience. Use clean close-mic ASMR-style physical SFX, sparse silence and exact diegetic sounds only.
For historical / ancient / medieval scenes, use only era-plausible clean physical sound.

REFERENCE VISIBILITY LOGIC — MANDATORY:
If a character reference/anchor is used and the face is visible, preserve exact face identity.
If the shot is legs/back/silhouette, preserve identity through body type, hair, clothing, posture and continuity; do not invent a new face.
If the uploaded reference has modern clothing/background but the script is historical, use the reference for face identity only and replace wardrobe/world according to the script era.

${isObserverMode ? `OBSERVER MODE: The script speaks to the viewer as "you". Do NOT invent a named recurring hero. character_lock should be [] or only unnamed background figures. Use POV framing where useful.` : `STANDARD MODE: If a recurring protagonist exists, create character_lock and reuse the same identity in prompts.`}

MANDATORY scene fields:
id, start, duration, description_ru, image_prompt_en, video_prompt_en, vo_ru, sfx, camera, transition, cut_energy, continuity_note, safety_note.
LANGUAGE LOCK: all generator-facing prompt fields and technical locks must be English: image_prompt_en, video_prompt_en, sfx, camera, blocking, shot_role, cast_lock, location_lock, style_bible, grid_continuity, allowed_characters, allowed_objects, allowed_location and forbidden_visuals. Russian is allowed only in description_ru, vo_ru, script_line_ru, exact dialogue.text, and exact on_screen_text that must be visible in the image.
${isFilmMode ? `SHORT FILM extra scene fields:
script_line_ru, dialogue, on_screen_text, blocking, shot_role.
dialogue must be [] unless the script explicitly contains a spoken line for that beat.
dialogue object format: { "speaker": "...", "voice_id": "voice_01", "text": "exact line", "delivery": "short performance note" }.
on_screen_text must be [] unless text visibly appears on screen, a sign, a display, a photo caption, or a title card.
video_prompt_en may include "Dialogue:" only when dialogue[] is non-empty, and must say exact scripted dialogue only / no extra speech.
vo_ru should summarize the beat for production reference; do not turn character dialogue into narrator VO.
${isTrailer ? `Trailer-only strict visual fields:
visual_beat_ru and visual_beat_en = concrete camera-visible shot derived from script_line_ru.
allowed_characters = only characters allowed in that frame. Use [] before the script introduces people.
allowed_objects = only props/signs/displays/locations supported by that source line.
allowed_location = the exact locked location slice for the frame.
forbidden_visuals = hallucinations to block for that frame, including new actors/props/rooms/era/costumes.` : ""}
` : ""}
${normalizedTarget === "grok" ? `
MASTER STYLE DESCRIPTION (add as root field "master_style"):
"Overall visual style: [genre], consistent character design, [color palette], [dominant lighting type], in the style of [2 film references], cinematic color grading, [realism level: photorealistic / stylized]"

IMAGE PROMPT (Grok — строго эту структуру):
"Storyboard panel {frame_number} of ${preset.targetScenes}: SOURCE OF TRUTH: script line. [Subject: only characters/objects named or directly implied by vo_ru], [Action & Emotion: only the action/emotion in vo_ru], [Environment: only location/time/weather supported by vo_ru; otherwise neutral minimal background], [Lighting: plausible for that exact scene], [Camera: shot type + angle + composition], [Style: artistic style + 2 film/art references], no extra objects, no extra locations, highly detailed, sharp focus, cinematic lighting, photorealistic --ar ${aspectRatio === "9:16" ? "9:16" : aspectRatio === "16:9" ? "16:9" : "1:1"} --stylize 350 --v 6"

VIDEO PROMPT (Grok — строго эту структуру, MAX 80 WORDS):
"SOURCE OF TRUTH: script line. Script: [short vo_ru quote]. Preserve uploaded frame. Animate ONLY the action described by this script line. No new objects, locations, characters, weather or scene change. Camera: [one movement]. SFX: [2-3 clean close physical cues; no hum/drone/room tone/music]. Photorealistic 24fps. [duration]s --motion [3-6]"
GROK VIDEO HARD LIMIT: MAXIMUM 80 WORDS including prefix, SFX and continuity. Count every word. No ALLOWED/FORBIDDEN AUDIO blocks. No world_audio_rule. One camera sentence. End with duration and --motion.
` : `
IMAGE PROMPT:
- starts with "SCENE PRIMARY FOCUS:"
- one clear visual focus
- concrete physical details, natural light, film grain
- ends with "ASPECT RATIO: ${aspectRatio}"

VIDEO PROMPT:
- starts with "ANIMATE CURRENT FRAME:"
- 60-120 words, includes Audio and SFX block
- audio/SFX must obey WORLD / ERA / AUDIO LOGIC above
- MUST include this exact sentence at the end or near end:
"${EXACT_CONTINUITY}"
`}

SFX FIELD RULES — ASMR PRECISION:
The sfx field must describe 2-3 SPECIFIC physical sounds visible/implied by this exact scene.
FORBIDDEN in sfx: "ambient hum", "background noise", "subtle ambience", "generic sound", "white noise", "electrical hum", "ventilation hum".
REQUIRED: concrete physical source + physical mechanism + texture.
Examples of CORRECT sfx:
  - "slow labored breathing — each inhale pulls cotton pillowcase with micro-rustle"
  - "individual keycap click — sharp plastic-on-membrane contact between typing bursts"
  - "ceramic mug set on wood table — hollow thud with thermal tick from hot liquid"
  - "condensation droplet tracking down glass — near-silent friction squeak"
  - "floorboard creak at exact pressure point — isolated, not continuous"
  - "mattress spring flex under shifting body weight — low-frequency creak"
WRONG: "ambient room tone", "quiet hum", "soft background noise"

REQUIRED root fields:
project_name, language, format, aspect_ratio, total_duration, global_style_lock, global_video_lock, character_lock${isFilmMode ? ", voice_lock" : ""}${isTrailer ? ", cast_lock, location_lock, style_bible, grid_continuity" : ""}, postprocess, scenes, export_meta${normalizedTarget === "grok" ? ", master_style" : ""}.

SCRIPT:
${script}

Return JSON only.`;
}

export function normalizeStoryboard(raw = {}, requestedDuration = 60, requestedMode = "safe", modelUsed = "openai/gpt-5.4", requestedTarget = "veo3", timing = {}) {
  const mode = normalizeMode(raw?.export_meta?.mode || requestedMode);
  const target = normalizeTarget(raw?.export_meta?.target || requestedTarget);
  const filmMode = mode === "short_film" || mode === "trailer";
  const engineTarget = mode === "raw" ? "grok_raw" : mode === "short_film" ? "short_film_dialogue" : mode === "trailer" ? "trailer_storyboard" : "gpt_safe";
  const targetDuration = Number(requestedDuration) || Number(raw.total_duration) || 60;
  const forcedTargetScenes = Number(timing?.targetScenes || timing?.target_scene_count || 0);
  const hasForcedScenes = Number.isFinite(forcedTargetScenes) && forcedTargetScenes > 0;
  const maxSceneDuration = mode === "trailer" ? Math.max(4, Math.min(10, Number(timing?.frameSeconds || timing?.frame_seconds || 4) || 4)) : 4;
  const inputScenes = Array.isArray(raw.scenes) ? raw.scenes : Array.isArray(raw.shots) ? raw.shots : [];
  const splitScenes = fitSceneCount(
    splitLongScenes(inputScenes.length ? inputScenes : [{ description_ru: "Документальная сцена", vo_ru: "", duration: 3 }], maxSceneDuration),
    hasForcedScenes ? forcedTargetScenes : null
  );

  let durations = splitScenes.map((s) => clampDuration(s.duration || timing?.frameSeconds || 3, maxSceneDuration));
  let sum = durations.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum !== targetDuration && guard < 2000) {
    guard += 1;
    if (sum < targetDuration) {
      const idx = durations.findIndex((d) => d < maxSceneDuration);
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
  const voiceLockSafe = normalizeVoiceLock(raw.voice_lock, inputScenes);
  const castLockSafe = normalizeCastLock(raw.cast_lock, characterLockSafe);
  const locationLockSafe = normalizeLocationLock(raw.location_lock || raw.world_location_lock || raw.location);
  const productionBibleSafe = raw.production_bible || timing?.productionBible || timing?.production_bible || null;

  const storyboardMeta = {
    project_name: raw.project_name || "NeuroCine Storyboard",
    topic: raw.topic || raw.project_topic || "",
    script: raw.script || raw.full_script || "",
    mode,
    export_meta: { mode, target },
    aspect_ratio: raw.aspect_ratio || "9:16",
    global_style_lock: raw.global_style_lock || DEFAULT_STYLE_LOCK,
    character_lock: characterLockSafe,
    voice_lock: voiceLockSafe,
    cast_lock: castLockSafe,
    location_lock: locationLockSafe,
    ...(productionBibleSafe ? { production_bible: productionBibleSafe } : {}),
    style_bible: raw.style_bible || raw.master_style || raw.global_style_lock || DEFAULT_STYLE_LOCK,
    ...(target === "grok" && raw.master_style ? { master_style: raw.master_style } : {}),
  };

  let start = 0;
  const scenes = splitScenes.map((s, i) => {
    const duration = durations[i] || 3;
    const visualBeatRu = sanitizeForGenerator(s.visual_beat_ru || s.visualBeatRu || s.visual_beat || s.shot_visual_ru || s.visual_scene_ru || "");
    const visualBeatEn = sanitizeForGenerator(s.visual_beat_en || s.visualBeatEn || s.shot_visual_en || s.visual_scene_en || "");
    const promptSource = visualBeatEn || visualBeatRu || s.image_prompt_en || s.image_prompt || s.image || s.description_en || s.description_ru || s.vo_ru || "documentary scene";
    const sourceScene = {
      id: padFrame(i + 1),
      start,
      duration,
      beat_type: s.beat_type || s.beat || (i === 0 ? "hook" : i === splitScenes.length - 1 ? "ending" : "escalation"),
      description_ru: sanitizeForGenerator(s.description_ru || s.ru_description || s.description || visualBeatRu || ""),
      description_en: sanitizeForGenerator(s.description_en || visualBeatEn || ""),
      visual_beat_ru: visualBeatRu,
      visual_beat_en: visualBeatEn,
      allowed_characters: normalizeTextList(s.allowed_characters || s.allowedCharacters || []),
      allowed_objects: normalizeTextList(s.allowed_objects || s.allowedObjects || []),
      allowed_location: cleanPrompt(s.allowed_location || s.allowedLocation || ""),
      forbidden_visuals: cleanPrompt(s.forbidden_visuals || s.forbiddenVisuals || s.forbidden || ""),
      story_action_en: sanitizeForGenerator(s.story_action_en || s.action_en || ""),
      action_en: sanitizeForGenerator(s.action_en || ""),
      image_prompt_en: ensureImagePrompt(promptSource, raw.aspect_ratio || "9:16", normalizeTextList(s.on_screen_text || s.text_on_screen || s.screen_text || [])),
      video_prompt_en: cleanPrompt(s.video_prompt_en || s.video_prompt || s.video || ""),
      vo_ru: s.vo_ru || s.voice || s.vo || "",
      dialogue: normalizeDialogue(s.dialogue || s.dialogues || s.lines || [], voiceLockSafe),
      on_screen_text: normalizeTextList(s.on_screen_text || s.text_on_screen || s.screen_text || []),
      blocking: cleanPrompt(s.blocking || s.actor_blocking || ""),
      shot_role: cleanPrompt(s.shot_role || s.scene_role || s.beat_type || s.beat || ""),
      sfx: cleanSfxCue(s.sfx || s.sound || "clean close physical SFX, silence between cues"),
      camera: s.camera || s.camera_movement || "organic handheld",
      transition: s.transition || "cut",
      cut_energy: getCutEnergy(s, i),
      continuity_note: s.continuity_note || EXACT_CONTINUITY,
      safety_note: s.safety_note || (mode === "raw" ? "GROK RAW: intense but safe framing" : "GPT SAFE: documentary framing"),
      source_of_truth: "script_line",
      script_line_ru: s.script_line_ru || s.script_line || s.vo_ru || s.voice || s.vo || s.description_ru || "",
    };

    let imagePrompt = sourceScene.image_prompt_en;
    let videoPrompt = sourceScene.video_prompt_en;
    let negativePrompt = NEGATIVE_PROMPT_BASE;

    try {
      const agentPrompts = buildFramePromptsForTarget({ frame: { ...sourceScene, video_prompt_en: "", motion: getScriptLine(sourceScene) || getMotion(sourceScene) }, storyboard: { ...storyboardMeta, mode }, target, includeVo: filmMode });
      imagePrompt = agentPrompts.image_prompt_en || imagePrompt;
      videoPrompt = agentPrompts.video_prompt_en || videoPrompt;
      negativePrompt = agentPrompts.negative_prompt || negativePrompt;
    } catch {}

    const preWorldScene = {
      ...sourceScene,
      end: start + duration,
      image_prompt_en: ensureImagePrompt(imagePrompt, raw.aspect_ratio || "9:16", sourceScene.on_screen_text || []),
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

    // Жёсткий лимит для Grok — после всех обработчиков сохраняем continuity и держим prompt компактным.
    if (target === "grok" && finalScene.video_prompt_en) {
      finalScene.video_prompt_en = enforceGrokVideoWordLimit(finalScene.video_prompt_en, GROK_VIDEO_WORD_LIMIT);
    }

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
    ...(productionBibleSafe ? { production_bible: productionBibleSafe } : {}),
    character_lock: characterLockSafe,
    voice_lock: filmMode ? voiceLockSafe : (Array.isArray(raw.voice_lock) ? voiceLockSafe : []),
    ...(mode === "trailer" ? {
      cast_lock: castLockSafe,
      location_lock: locationLockSafe,
      style_bible: raw.style_bible || raw.master_style || raw.global_style_lock || DEFAULT_STYLE_LOCK,
      grid_continuity: raw.grid_continuity || "Generate the full frame plan once, then produce PART grids as continuations of the same film using cast_lock, location_lock, style_bible and previous PART visual DNA. Odd frame counts may end with a 2-cell or 3-cell PART.",
    } : {}),
    postprocess: raw.postprocess || { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    scenes,
    export_meta: {
      ...(raw.export_meta || {}),
      engine_target: engineTarget,
      mode,
      target,
      model: modelUsed,
      version: "neurocine_storyboard_v2_4_world_audio_brain",
      auto_safe_to_grok: mode !== "raw",
      dialogue_mode: filmMode,
      voice_lock: filmMode,
      trailer_mode: mode === "trailer",
      world_audio_brain: true,
      postprocess: { upscale: "x2", final_upscale: "x4", model: "real-esrgan", provider: "replicate" },
    },
  };
}

export function validateStoryboard(data = {}, requestedMode = "safe", requestedTarget = "veo3") {
  const errors = [];
  const mode = normalizeMode(data?.export_meta?.mode || requestedMode);
  const target = normalizeTarget(data?.export_meta?.target || requestedTarget);
  const filmMode = mode === "short_film" || mode === "trailer";

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
        if (wc > GROK_VIDEO_WORD_LIMIT) errors.push(`${expectedId}: Grok video prompt too long (${wc} words, max ${GROK_VIDEO_WORD_LIMIT})`);
      }

      if (!s.world_profile && !/WORLD LOGIC|ALLOWED AUDIO|FORBIDDEN AUDIO/i.test(vid)) errors.push(`${expectedId}: world/audio brain metadata missing`);

      if (!["low", "medium", "high"].includes(String(s.cut_energy || "").toLowerCase())) errors.push(`${expectedId}: cut_energy must be low, medium, or high`);

      if (filmMode && Array.isArray(s.dialogue) && s.dialogue.length > 0) {
        if (!Array.isArray(data.voice_lock) || data.voice_lock.length === 0) errors.push(`${expectedId}: voice_lock missing for dialogue mode`);
        s.dialogue.forEach((line, lineIdx) => {
          if (line && typeof line === "object" && line.speaker && !line.voice_id) {
            errors.push(`${expectedId}: dialogue ${lineIdx + 1} missing voice_id`);
          }
        });
      }

      if (mode === "trailer" && (!Array.isArray(data.cast_lock) || data.cast_lock.length === 0) && Array.isArray(data.character_lock) && data.character_lock.length > 0) {
        errors.push("trailer mode: cast_lock missing while character_lock exists");
      }

      if (mode !== "raw") {
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
