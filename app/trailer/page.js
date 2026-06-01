"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { STYLE_PRESETS, getStyleProfile } from "../../engine/directorEngine_v4";
import { splitScenesIntoParts, buildFlowCompactPartPrompt } from "../../engine/autoChainEngine";
import { exactTextLine, promptListEnglish, toPromptEnglish } from "../../engine/promptLanguage";

const DEFAULT_SCRIPT = `В каждом здании есть этаж, которого не должно существовать.
Ночью, когда офис пустеет...
и последний лифт почему-то стоит открытым...
лучше не заходить внутрь.
Трое сотрудников задержались после работы.
На панели лифта появилась кнопка: -1.
Лифт начал ехать вниз слишком долго.
На дисплее появилась надпись: Не смотрите в угол.
Но они посмотрели.
В углу лифта стоял человек.
Когда двери открылись, перед ними оказался тот же офис.
Но что-то было неправильно.
Коридоры становились длиннее.
На старой фотографии были они сами.
Подпись гласила: Пропали без вести. 2006 год.
Вдалеке снова появился тот человек.
Лифт забирает только тех, кто уже должен был исчезнуть.
Когда двери лифта наконец открылись, внутри не было кабины.
Только чёрная пустота.
Внутри стояла его копия.
Она улыбнулась и сказала: Ты уже нажимал эту кнопку.
Лифт на минус первый.
Следующий этаж... твой.`;

const MIN_TOTAL_DURATION = 2;
const MAX_TOTAL_DURATION = 600;
const MIN_FRAME_SECONDS = 2;
const MAX_FRAME_SECONDS = 10;

const QUICK_PRESETS = [
  { seconds: 60, label: "60с" },
  { seconds: 87, label: "87с" },
  { seconds: 120, label: "2м" },
  { seconds: 180, label: "3м" },
  { seconds: 300, label: "5м" },
  { seconds: 600, label: "10м" },
];

const TRAILER_DRAFT_KEY = "neurocine.trailerStoryboardDraft.v1";
const LOCAL_WORKER_URLS = {
  comfyui: "http://127.0.0.1:8188",
  automatic1111: "http://127.0.0.1:7860",
  "neurocine-worker": "http://127.0.0.1:8787",
};
const DEFAULT_LOCAL_RENDER_PROVIDER = "comfyui";
const DEFAULT_LOCAL_WORKER_URL = LOCAL_WORKER_URLS[DEFAULT_LOCAL_RENDER_PROVIDER];
const LOCAL_IMAGE_WIDTH = 936;
const LOCAL_IMAGE_HEIGHT = 1664;
const LOCAL_IMAGE_NEGATIVE = [
  "text",
  "subtitles",
  "captions",
  "watermark",
  "UI",
  "logo",
  "frame labels",
  "F01",
  "F02",
  "F03",
  "F04",
  "numbers",
  "contact sheet",
  "gallery cards",
  "nested grid",
  "comic",
  "illustration",
  "painting",
  "cartoon",
  "anime",
  "CGI",
  "render",
  "plastic skin",
].join(", ");
const LOCAL_MODEL_PRESETS = {
  sdxlProduction: {
    label: "SDXL production реализм",
    family: "sdxl",
    checkpoint: "sd_xl_base_1.0.safetensors",
    width: 936,
    height: 1664,
    steps: 28,
    cfg: 6,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Рабочий режим для RTX 3060 12GB: стабильный, LoRA-ready, хороший для трейлерных PART-сеток.",
  },
  sdxlCinema: {
    label: "SDXL cinematic checkpoint",
    family: "sdxl",
    checkpoint: "juggernautXL_v9Rundiffusionphoto2.safetensors",
    width: 936,
    height: 1664,
    steps: 30,
    cfg: 5.5,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Поставь реальное имя cinematic/photoreal checkpoint из папки ComfyUI/models/checkpoints.",
  },
  sdxlFastDraft: {
    label: "SDXL быстрый черновик",
    family: "sdxl",
    checkpoint: "sd_xl_base_1.0.safetensors",
    width: 768,
    height: 1360,
    steps: 18,
    cfg: 5,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Быстро проверить логику кадров перед дорогим качеством.",
  },
  fluxQuality: {
    label: "FLUX quality workflow",
    family: "flux",
    checkpoint: "flux1-dev-fp8.safetensors",
    width: 768,
    height: 1360,
    steps: 22,
    cfg: 1,
    sampler: "euler",
    a1111Sampler: "Euler",
    scheduler: "simple",
    note: "Топ-понимание промпта, но нужен ComfyUI workflow template с плейсхолдерами.",
  },
  fluxFast: {
    label: "FLUX fast workflow",
    family: "flux",
    checkpoint: "flux1-schnell-fp8.safetensors",
    width: 768,
    height: 1360,
    steps: 8,
    cfg: 1,
    sampler: "euler",
    a1111Sampler: "Euler",
    scheduler: "simple",
    note: "Быстрые пробы FLUX, тоже через workflow template.",
  },
  custom: {
    label: "Свой checkpoint / workflow",
    family: "sdxl",
    checkpoint: "",
    width: 936,
    height: 1664,
    steps: 24,
    cfg: 6,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Ручной режим: укажи checkpoint, LoRA и параметры сам.",
  },
};
const DEFAULT_LOCAL_MODEL_PRESET = "sdxlProduction";

const STYLE_LABELS_RU = {
  cinematic: "Кино-документальный",
  dark: "Мрачный исторический триллер",
  truecrime: "True crime / расследование",
  war: "Военная документалистика",
  neonNoir: "Неоновый нуар",
  synthwave80s: "Синтвейв 80-х",
  cyberpunk: "Киберпанк-мегаполис",
  vhsRetro: "VHS / Super 8",
  analogFilm: "Аналоговая плёнка Kodak",
  mysticHorror: "Мистический хоррор",
  ghostSupernatural: "Призраки / сверхъестественное",
  foundFootage: "Found footage / найденная запись",
  psychologicalDread: "Психологический ужас",
  folkHorror: "Фолк-хоррор",
  grimeSlasher: "Грязный слэшер",
  liminalUncanny: "Лиминальный ужас",
  scifiAtmospheric: "Атмосферная фантастика",
  fantasyEpic: "Эпическое фэнтези",
  westernGritty: "Жёсткий вестерн",
  apocalyptic: "Постапокалипсис",
  filmNoir: "Чёрно-белый нуар",
  brutalistMinimal: "Бруталистский минимализм",
  hyperreal8k: "Гиперреализм 8K",
  animation2d: "2D-анимация",
  animation25d: "2.5D-анимация",
  animation3d: "Премиальная 3D-анимация",
  stopmotion: "Стоп-моушн",
  cutoutPaper: "Бумажная аппликация",
  animeDark: "Тёмное аниме",
  animeShonenAction: "Сёнэн-экшен",
  animeSliceOfLife: "Аниме slice-of-life",
  ghibliInspired: "В духе Ghibli",
  graphicNovel: "Графический роман",
  comicHalftone: "Комикс / halftone",
  musicVideo: "Музыкальный клип",
};

function styleLabelRu(key, fallback) {
  return STYLE_LABELS_RU[key] || fallback || key;
}

function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function splitScriptBeats(script = "") {
  return String(script || "")
    .split(/\n+|(?<=[.!?…])\s+/)
    .map(cleanText)
    .filter(Boolean);
}

function lineMatches(line = "", patterns = []) {
  const value = cleanText(line).toLowerCase();
  return patterns.some((pattern) => pattern.test(value));
}

function findBeatIndex(lines = [], patterns = [], used = new Set(), start = 0) {
  for (let i = Math.max(0, start); i < lines.length; i += 1) {
    if (!used.has(i) && lineMatches(lines[i], patterns)) return i;
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (!used.has(i) && lineMatches(lines[i], patterns)) return i;
  }
  return -1;
}

function findNextUnusedIndex(lines = [], used = new Set(), start = 0) {
  for (let i = Math.max(0, start); i < lines.length; i += 1) if (!used.has(i)) return i;
  for (let i = 0; i < lines.length; i += 1) if (!used.has(i)) return i;
  return -1;
}

function buildTrailerBeatPlan(lines = [], totalFrames = 1) {
  const cleanLines = lines.map(cleanText).filter(Boolean);
  if (!cleanLines.length) return ["Trailer beat"];

  const used = new Set();
  const plan = [];
  const max = Math.max(1, Math.round(Number(totalFrames) || 1));
  const characterPatterns = [/трое\s+сотрудник/, /сотрудник/, /геро/, /девушк/, /парень/];
  const anomalyPatterns = [/-1/, /минус\s+перв/, /кнопк/, /панел/, /диспле/, /надпись/, /не\s+смотрите/];
  const dangerPatterns = [/еха|едет|спуск|вниз|слишком\s+долго/, /стоп/, /красн/, /посмотрел/, /углу/, /человек/];
  const openElevatorPatterns = [/лифт.*открыт/, /стоит\s+открыт/, /заходить\s+внутр/];

  function pushSource(source, indices = []) {
    if (!source || plan.length >= max) return;
    plan.push(source);
    indices.forEach((i) => used.add(i));
  }

  const castIndex = findBeatIndex(cleanLines, characterPatterns, used);
  const searchUntil = castIndex >= 0 ? castIndex : cleanLines.length;
  let hookEnd = -1;
  for (let i = 0; i < searchUntil; i += 1) {
    if (lineMatches(cleanLines[i], openElevatorPatterns)) hookEnd = i;
  }
  if (hookEnd < 0) hookEnd = Math.min(searchUntil - 1, 0);
  if (hookEnd < 0) hookEnd = 0;
  const hookStart = 0;
  const hookIndices = [];
  for (let i = hookStart; i <= hookEnd; i += 1) hookIndices.push(i);
  pushSource(hookIndices.map((i) => cleanLines[i]).join(" / "), hookIndices);

  if (max >= 2) {
    const idx = castIndex >= 0 && !used.has(castIndex) ? castIndex : findNextUnusedIndex(cleanLines, used, hookEnd + 1);
    if (idx >= 0) pushSource(cleanLines[idx], [idx]);
  }

  if (max >= 3) {
    const idx = findBeatIndex(cleanLines, anomalyPatterns, used, Math.max(0, castIndex + 1));
    const fallback = idx >= 0 ? idx : findNextUnusedIndex(cleanLines, used, castIndex + 1);
    if (fallback >= 0) pushSource(cleanLines[fallback], [fallback]);
  }

  if (max >= 4) {
    const idx = findBeatIndex(cleanLines, dangerPatterns, used, 0);
    const fallback = idx >= 0 ? idx : findNextUnusedIndex(cleanLines, used, 0);
    if (fallback >= 0) pushSource(cleanLines[fallback], [fallback]);
  }

  for (let i = 0; i < cleanLines.length && plan.length < max; i += 1) {
    if (!used.has(i)) pushSource(cleanLines[i], [i]);
  }

  while (plan.length < max) {
    const idx = Math.min(cleanLines.length - 1, Math.floor((plan.length / max) * cleanLines.length));
    plan.push(cleanLines[idx] || cleanLines[cleanLines.length - 1] || "Trailer beat");
  }

  return plan.slice(0, max);
}

function estimateAutoFrameCount(script, duration, frameSeconds) {
  const safeDuration = clampNumber(duration, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 60);
  const safeFrameSeconds = clampNumber(frameSeconds, MIN_FRAME_SECONDS, MAX_FRAME_SECONDS, 3);
  const beatCount = splitScriptBeats(script).length;
  const preferredFrames = Math.max(1, Math.round(safeDuration / safeFrameSeconds));
  const minFrames = Math.max(1, Math.ceil(safeDuration / MAX_FRAME_SECONDS));
  const maxFrames = Math.max(minFrames, Math.floor(safeDuration / MIN_FRAME_SECONDS));
  const scriptAware = beatCount > 0 ? Math.min(beatCount, preferredFrames) : preferredFrames;
  return clampNumber(scriptAware, minFrames, maxFrames, preferredFrames);
}

function distributeDurations(totalDuration, totalFrames, preferredSeconds) {
  const frames = Math.max(1, Math.round(Number(totalFrames) || 1));
  const preferred = clampNumber(preferredSeconds, MIN_FRAME_SECONDS, MAX_FRAME_SECONDS, 3);
  const minTotal = frames * MIN_FRAME_SECONDS;
  const maxTotal = frames * MAX_FRAME_SECONDS;
  const target = clampNumber(totalDuration, minTotal, maxTotal, frames * preferred);
  const durations = Array.from({ length: frames }, () => preferred);
  let sum = durations.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum !== target && guard < 5000) {
    guard += 1;
    if (sum < target) {
      const idx = durations.findIndex((x) => x < MAX_FRAME_SECONDS);
      if (idx === -1) break;
      durations[idx] += 1;
      sum += 1;
    } else {
      const idx = durations.findIndex((x) => x > MIN_FRAME_SECONDS);
      if (idx === -1) break;
      durations[idx] -= 1;
      sum -= 1;
    }
  }
  return durations;
}

function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  if (value < 60) return `${value}с`;
  const m = Math.floor(value / 60);
  const s = value % 60;
  return s ? `${m}м ${s}с` : `${m}м`;
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanSfxText(value = "") {
  const cleaned = cleanText(value)
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

function frameId(n) {
  return `frame_${String(n).padStart(2, "0")}`;
}

function frameLabel(scene, index = 0) {
  const n = Number(String(scene?.id || "").match(/\d+/)?.[0] || index + 1);
  return `F${String(n).padStart(2, "0")}`;
}

function gridLayoutFor(count = 4) {
  const safe = Math.max(1, Math.round(Number(count) || 1));
  const cols = safe <= 2 ? safe : 2;
  return { cols, rows: Math.ceil(safe / cols) };
}

function cellPositionName(index = 0, cols = 2) {
  const col = index % Math.max(1, cols);
  const row = Math.floor(index / Math.max(1, cols));
  const vertical = row === 0 ? "upper" : row === 1 ? "lower" : `row ${row + 1}`;
  const horizontal = col === 0 ? "left" : col === 1 ? "right" : `column ${col + 1}`;
  return `${vertical}-${horizontal} cell`;
}

function cellOrderText(count = 0, cols = 2) {
  return Array.from({ length: count }, (_, i) => cellPositionName(i, cols)).join(" -> ");
}

function formatDialogueLine(line) {
  if (typeof line === "string") return line;
  if (!line || typeof line !== "object") return "";
  const speaker = line.speaker || line.character ? toPromptEnglish(line.speaker || line.character, { fallback: "Speaker" }) : "";
  const voice = line.voice_id ? ` [${line.voice_id}]` : "";
  const text = line.text || line.line || line.dialogue || "";
  const delivery = line.delivery ? ` (${toPromptEnglish(line.delivery, { fallback: "scripted delivery" })})` : "";
  return [speaker ? `${speaker}${voice}` : "", text ? `${text}${delivery}` : ""].filter(Boolean).join(": ");
}

function lockLine(item, fallback = "Lock") {
  if (!item || typeof item !== "object") return "";
  const id = toPromptEnglish(item.id || item.role || item.character || item.name || fallback, { fallback });
  return [
    id,
    item.visual_identity || item.must_appear_as || item.description || item.voice_profile,
    item.wardrobe || item.delivery_arc,
    item.forbidden_changes ? `forbidden: ${item.forbidden_changes}` : "",
  ].filter(Boolean).map((x) => toPromptEnglish(x, { fallback: "same locked production detail" })).join(" — ");
}

function locationLockLine(lock = {}) {
  if (!lock || typeof lock !== "object") return toPromptEnglish(lock || "", { fallback: "" });
  return Object.entries(lock).map(([key, value]) => value ? `${key}: ${toPromptEnglish(value, { fallback: "same locked location detail" })}` : "").filter(Boolean).join("; ");
}

function promptList(value = "") {
  return promptListEnglish(value, "");
}

function trimWords(text = "", max = 30) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  return words.length > max ? `${words.slice(0, max).join(" ")}...` : words.join(" ");
}

function compactStyleLine(style = "") {
  return trimWords(
    cleanText(style)
      .replace(/STYLE FORMULA:[\s\S]*$/i, "")
      .replace(/\bRAW photograph[^.]*\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
    34
  ) || "same locked cinematic realism, same lighting and color grade";
}

function buildFlowGrokContinuityFixPrompt({ storyboard, styleProfile, partScenes, partIndex, gridLayout }) {
  if (!storyboard || !partScenes?.length) return "";
  const orderText = cellOrderText(partScenes.length, gridLayout.cols);
  const castLock = (storyboard.cast_lock || []).map((item, i) => lockLine(item, `Cast ${i + 1}`)).filter(Boolean).join("\n");
  const characterLock = (storyboard.character_lock || []).map((item, i) => lockLine(item, `Character ${i + 1}`)).filter(Boolean).join("\n");
  const locationLock = locationLockLine(storyboard.location_lock || {});
  const style = toPromptEnglish(storyboard.style_bible || storyboard.global_style_lock || styleProfile?.style_lock || "", { fallback: "" });
  const previousRule = partIndex > 0
    ? "If a previous PART grid/reference is uploaded, use it only as visual DNA for cast identity, wardrobe, lighting family, lens language, color grade and production design. Do not copy the same compositions."
    : "This is PART 1. Establish the locked film identity clearly so later PARTS can continue it.";

  return `FLOW / GROK CONTINUITY FIX — PUT THIS BEFORE THE PART PROMPT

This is PART ${partIndex + 1} of the same trailer / short film, not a new concept and not a new storyboard.
Continue the exact same film world from previous frames.

CONTINUITY PRIORITY:
1. Same cast identity, faces, body types, wardrobe and emotional condition.
2. Same office/elevator/corridor location design and spatial logic.
3. Same lighting family, lens language, color grade, realism and horror tone.
4. Source of truth = the frame descriptions in the PART prompt.
5. Visual beats are stricter than style text: if Visual beat says no people, the cell must be empty.

LANGUAGE LOCK:
Use English for all technical instructions, cast/location/style locks, visual beats, allowed/forbidden lists and SFX. Russian may appear only as exact dialogue or exact visible on-screen text.

CAST LOCK:
${castLock || characterLock || "Use the same recurring characters from the storyboard. Do not replace actors."}

LOCATION LOCK:
${locationLock || "Use the same locked location from the storyboard. Do not redesign the place."}

STYLE LOCK:
${style || "same camera-photographed live-action style, same lighting family, same color grade"}

FLOW/GROK RULES:
- ${previousRule}
- Do not invent a new style, new actors, new costumes, new rooms, new props, new time period or new supernatural rules.
- Style is only lens/color/lighting/mood. Style cannot add objects that are not in the script.
- Do not introduce characters before their first scripted appearance. Empty office/elevator beats must stay empty.
- For repeated variants of this PART, keep the same story content and change only composition, lens, distance, angle or foreground layer.
- Generate ONE single vertical 9:16 output image, not multiple gallery cards and not a contact sheet.
- Arrange exactly ${partScenes.length} scenes inside that one canvas as a strict ${gridLayout.cols}×${gridLayout.rows} collage.
- If this is 4 frames, divide the one 9:16 image into exactly four equal 2×2 quadrants: two scenes on top, two scenes below.
- Cell order for reading only: ${orderText}. Do not draw any cell names or identifiers.
- Use thin black separators only. No nested grids inside cells, no horizontal thumbnail strips, no app-gallery cards, no rounded cards, no black outer background.
- No visible numbering, no captions, no title bars, no UI, no watermark, no non-story text.

Now follow the PART prompt exactly.`;
}

function buildLockedFrameVideoPrompt({ scene, storyboard, styleProfile, frameLabelText, hasCrop }) {
  if (!scene) return "";
  const scriptLine = toPromptEnglish(scene.script_line_ru || scene.vo_ru || scene.description_ru || "", { fallback: "current scripted beat" });
  const visualBeat = toPromptEnglish(scene.visual_beat_en || scene.visual_beat_ru || scene.description_ru || "", { fallback: "literal shot from the selected storyboard frame" });
  const style = toPromptEnglish(storyboard?.style_bible || storyboard?.global_style_lock || styleProfile?.style_lock || "", { fallback: "" });
  const allowedCharacters = promptList(scene.allowed_characters);
  const allowedObjects = promptList(scene.allowed_objects);
  const allowedLocation = promptList(scene.allowed_location) || promptList(storyboard?.location_lock?.main || "");
  const forbidden = toPromptEnglish(scene.forbidden_visuals || "", { fallback: "" });
  const dialogue = Array.isArray(scene.dialogue) && scene.dialogue.length
    ? scene.dialogue.map(formatDialogueLine).filter(Boolean).join(" / ")
    : "";
  const hasCharacters = Boolean(allowedCharacters);
  const characterLine = hasCharacters
    ? `${allowedCharacters}. Preserve exact identity/wardrobe from the cropped frame or hero anchor; no actor replacement.`
    : "none in this frame. Keep the frame empty of people.";
  const sourceLine = hasCrop
    ? "Use the uploaded 9:16 crop as the visual source."
    : "Use the selected storyboard frame/crop as the visual source when available.";
  const exactVisibleText = exactTextLine(scene.on_screen_text || []);

  return `LOCKED FRAME VIDEO PROMPT — ${frameLabelText}

VISUAL SOURCE:
${sourceLine} Preserve composition, lighting direction, camera angle, location and object layout.

SOURCE LINE:
${scriptLine}

VISUAL BEAT:
${visualBeat}
${exactVisibleText ? `\n${exactVisibleText}` : ""}

CHARACTERS:
${characterLine}

ALLOWED OBJECTS:
${allowedObjects || "only objects visible in the crop and directly supported by the source line"}

LOCATION:
${allowedLocation || "same locked location from the crop"}

ACTION:
Animate only this visual beat. ${hasCharacters ? "Keep listed characters identical." : "Do not add a person, face, silhouette, hand, reflection or passerby."}

${dialogue ? `DIALOGUE:\n${dialogue}\nNo extra speech.\n` : ""}STYLE:
${compactStyleLine(style)}

CAMERA:
${cleanText(scene.camera || "restrained handheld micro-drift")}. No scene change, no cutaway to another location.

SOUND LOCK:
Clean close-mic diegetic ASMR only. Use silence plus exact visible physical SFX. No background hum, drone, room tone, music bed or generic ambience.

SFX:
${cleanSfxText(scene.sfx || "physical sounds already visible or implied by the frame")}.

FORBIDDEN:
${forbidden || "No new actors, props, rooms, costumes, era, weather or story events."} No subtitles, UI, watermark, captions, frame numbers, borders, black gutters or unrelated objects.`;
}

function extractOnScreenText(source = "") {
  const text = cleanText(source);
  const direct = text.match(/(?:надпись|подпись|дисплее?|экран|название|кнопка)[:—-]?\s*(.+)$/i)?.[1];
  if (direct) return cleanText(direct);
  if (/-1|минус перв/i.test(text)) return "-1";
  if (/не смотрите в угол/i.test(text)) return "НЕ СМОТРИТЕ В УГОЛ";
  if (/пропали без вести|2006/i.test(text)) return "Пропали без вести. 2006 год.";
  if (/лифт на минус первый/i.test(text)) return "ЛИФТ НА МИНУС ПЕРВЫЙ";
  return "";
}

function buildTrailerVisualBeat(source = "", previousState = {}) {
  const text = cleanText(source);
  const l = text.toLowerCase();
  const introducesEmployees = /трое сотрудников|сотрудник|геро[иия]|девушка|парень|они\b|один из/.test(l);
  const introducesCornerMan = /углу лифта стоял человек|тот человек|вдалеке.*человек|снова появился.*человек/.test(l);
  const introducesDuplicate = /копи[яию]|самого себя/.test(l);
  const state = {
    employees: previousState.employees || introducesEmployees,
    cornerMan: previousState.cornerMan || introducesCornerMan,
    duplicate: previousState.duplicate || introducesDuplicate,
  };

  const hasEmployees = state.employees && /трое|сотрудник|геро|они\b|один|девушка|парень|посмотрели|бежали|кнопк|кричали|родились|исчезли|остался/.test(l);
  const hasCornerMan = state.cornerMan && /человек|углу|вдалеке|исчез|ближе/.test(l);
  const hasDuplicate = state.duplicate && /копи|самого себя|улыбнулась|нажимал/.test(l);
  const hasScriptedOfficePeople = /люди|работник|лицом к стене|повернули головы/.test(l);
  const noPeople = !hasEmployees && !hasCornerMan && !hasDuplicate && !hasScriptedOfficePeople;
  const screenText = extractOnScreenText(text);

  let visualRu = `Кадр по строке сценария: ${text}.`;
  let visualEn = `Literal storyboard shot from the script line: ${text}.`;
  let allowedLocation = "locked old empty night office / elevator / fluorescent corridor only";
  let allowedObjects = "only scripted office/elevator elements visible in this beat";
  let shotRole = "trailer_beat";
  let camera = "restrained handheld medium shot";
  let sfx = "single fluorescent tick, dry elevator relay click, silence between close physical cues";
  let blocking = "Use only the characters currently introduced by the script; keep locked office/elevator geography.";

  if ((/этаж.*не должно существовать/.test(l) && /лифт.*открыт|стоит открытым|заходить внутр/.test(l)) || /последний лифт.*открыт|лифт.*стоит открытым/.test(l)) {
    visualRu = "Хук: пустой ночной офисный коридор ведёт к открытому старому лифту, будто он ждёт; людей нет, опасность уже понятна.";
    visualEn = "Hook shot: an empty night office corridor leads to an open old elevator waiting at the end; no people, the danger premise is immediately clear.";
    allowedObjects = "office corridor, open elevator doors, empty elevator cabin, flickering fluorescent lights";
    shotRole = "hook";
    camera = "tense wide hook shot with elevator as focal point";
  } else if (/этаж.*не должно существовать/.test(l)) {
    visualRu = "Пустой ночной офисный коридор с закрытыми дверями кабинетов и старым лифтом в глубине; тревожный намёк на несуществующий этаж, людей нет.";
    visualEn = "Empty night office corridor with closed office doors and the old elevator deep in the frame; a subtle impossible-floor mood, no people.";
    allowedObjects = "office corridor, old elevator doors, flickering fluorescent lights";
    shotRole = "establishing";
    camera = "wide establishing shot";
  } else if (/ночью|офис пустеет/.test(l)) {
    visualRu = "Пустой офис после работы: выключенные мониторы, длинный коридор, редкие мигающие люминесцентные лампы; людей нет.";
    visualEn = "Empty office after hours: switched-off monitors, long corridor, sparse flickering fluorescent lights; no people.";
    allowedObjects = "office desks, switched-off computers, corridor, fluorescent lights";
    shotRole = "establishing";
    camera = "slow wide office establishing shot";
    sfx = "ceiling ballast single click, distant door latch settling";
  } else if (/лифт.*открыт|стоит открытым|заходить внутрь/.test(l)) {
    visualRu = "Открытый старый лифт в конце ночного офисного коридора; пустая кабина видна издалека, людей нет.";
    visualEn = "Open old elevator at the end of the night office corridor; empty cabin visible from distance, no people.";
    allowedObjects = "open elevator doors, empty elevator cabin, corridor lights";
    shotRole = "reveal";
    camera = "locked-off corridor perspective";
  } else if (/трое сотрудников/.test(l)) {
    visualRu = "Те же трое офисных сотрудников после работы собирают вещи в почти пустом офисе; обычная усталость, без новых людей.";
    visualEn = "The same three office employees after work gather their belongings in the nearly empty office; tired ordinary presence, no new people.";
    allowedObjects = "three locked employees, desks, computers, bags, office chairs";
    shotRole = "character_introduction";
    camera = "handheld medium group shot";
    blocking = "All three employees are introduced together and become the locked recurring cast.";
  } else if (/панел|кнопк|минус первый|-1/.test(l)) {
    visualRu = "Крупный план старой панели лифта: среди обычных кнопок горит странная кнопка -1; только рука уже представленного сотрудника при необходимости.";
    visualEn = "Close-up of the old elevator panel: among ordinary buttons the strange -1 button glows; only the hand of an already introduced employee if needed.";
    allowedLocation = "inside the same locked old elevator";
    allowedObjects = "elevator panel, old buttons, exact -1 button";
    shotRole = "insert";
    camera = "macro insert close-up";
    sfx = "button plastic tick, fingertip scrape on worn plastic, dry relay click under panel";
  } else if (/ехал|ехать вниз|слишком долго|слишком глубоко/.test(l)) {
    visualRu = "Те же трое сотрудников внутри старой кабины лифта ощущают слишком долгий спуск; стены и свет той же кабины, без новых пассажиров.";
    visualEn = "The same three employees inside the old elevator cabin feel the descent lasting too long; same cabin walls and lights, no new passengers.";
    allowedLocation = "inside the same locked old elevator cabin";
    allowedObjects = "three locked employees, elevator walls, control panel, ceiling light";
    shotRole = "tension";
    camera = "tight handheld elevator interior";
    sfx = "short elevator cable creak, cabin seam tick, held breath and fabric rustle";
  } else if (/не смотрите в угол|диспле/.test(l)) {
    visualRu = "Крупный план дисплея лифта с точной надписью «НЕ СМОТРИТЕ В УГОЛ»; вокруг тот же металл кабины.";
    visualEn = "Close-up of the elevator display showing the exact text 'НЕ СМОТРИТЕ В УГОЛ'; same cabin metal around it.";
    allowedLocation = "inside the same locked old elevator cabin";
    allowedObjects = "elevator display, exact warning text, scratched metal panel";
    shotRole = "insert";
    camera = "display insert close-up";
    sfx = "display relay click, fluorescent flicker snap";
  } else if (/посмотрели/.test(l)) {
    visualRu = "Те же трое сотрудников медленно поворачивают головы внутри кабины лифта к одному углу; человек в углу ещё не показан полностью.";
    visualEn = "The same three employees slowly turn their heads inside the elevator cabin toward one corner; the corner figure is not fully revealed yet.";
    allowedLocation = "inside the same locked old elevator cabin";
    allowedObjects = "three locked employees, elevator corner, red dim cabin light";
    shotRole = "reaction";
    camera = "tight reaction shot";
    sfx = "held breath in cabin, one fluorescent snap, clothing rustle as heads turn";
  } else if (/углу лифта стоял человек/.test(l)) {
    visualRu = "В углу той же кабины лифта неподвижно стоит тот же тёмный человек; трое сотрудников видят, что он был там всё время.";
    visualEn = "In the corner of the same elevator cabin the same dark silent man stands motionless; the three employees realize he was there all along.";
    allowedLocation = "inside the same locked old elevator cabin";
    allowedObjects = "corner man, three locked employees, elevator corner, red cabin light";
    shotRole = "reveal";
    camera = "wide claustrophobic elevator reveal";
    sfx = "elevator light stutter, cloth brush from a frozen body";
  } else if (/двери открылись|тот же офис|что-то было неправильно|столы|часы|люди за стеклом|повернули головы/.test(l)) {
    visualRu = "Двери лифта открываются в тот же офис, но планировка неправильная: столы смещены, стеклянные перегородки, неподвижные люди за стеклом.";
    visualEn = "Elevator doors open into the same office, but the layout is wrong: shifted desks, glass partitions, motionless people behind glass.";
    allowedLocation = "same locked office, altered but still recognizably the same office";
    allowedObjects = "elevator doors, office desks, glass partitions, motionless office people if the line implies them";
    shotRole = "world_reveal";
    camera = "wide reveal from elevator threshold";
    sfx = "elevator doors scrape open, distant fluorescent tubes click";
  } else if (/коридор.*длин|становились длиннее/.test(l)) {
    visualRu = "Тот же офисный коридор визуально растягивается в глубину; линии потолка и стен уходят дальше, чем должны.";
    visualEn = "The same office corridor visually stretches into depth; ceiling and wall lines extend farther than possible.";
    allowedLocation = "same locked office corridor";
    allowedObjects = "corridor walls, ceiling lights, office doors";
    shotRole = "distortion";
    camera = "long lens corridor compression shot";
    sfx = "fluorescent sections shutting off, distant structural creak";
  } else if (/фотограф|пропали без вести|2006/.test(l)) {
    visualRu = "Крупный план старой пожелтевшей фотографии на офисной стене: на фото те же трое сотрудников, рядом точная подпись из сценария.";
    visualEn = "Close-up of an old yellowed photo on the office wall: the same three employees are in the photo, with the exact scripted caption.";
    allowedLocation = "same locked office photo wall";
    allowedObjects = "old yellowed photo, photo frame, exact caption text";
    shotRole = "evidence_insert";
    camera = "static close-up insert";
    sfx = "paper frame creak, fingertip sliding on dusty glass";
  } else if (/вдалеке.*человек|снова появился.*человек|исчез|ближе/.test(l)) {
    visualRu = "Тот же неподвижный человек из угла лифта появляется в конце того же офисного коридора; при мигании света он становится ближе.";
    visualEn = "The same motionless man from the elevator corner appears at the end of the same office corridor; with the light flicker he is closer.";
    allowedLocation = "same locked office corridor";
    allowedObjects = "same corner man, corridor lights, office doors";
    shotRole = "threat_reveal";
    camera = "telephoto corridor shot";
    sfx = "light section pop, shoes faint scrape on floor";
  } else if (/лифт забирает/.test(l)) {
    visualRu = "Тёмный пустой коридор и закрытые двери того же лифта как визуальная опора для шёпота правила; без новых персонажей.";
    visualEn = "Dark empty corridor and closed doors of the same elevator as the visual anchor for the whispered rule; no new characters.";
    allowedObjects = "closed elevator doors, dark corridor, flickering lights";
    shotRole = "rule_whisper";
    camera = "still ominous elevator doors";
    sfx = "close dry whisper, elevator metal tick, silence around the voice";
  } else if (/бежали|били по кнопкам|кричали|выход/.test(l)) {
    visualRu = "Те же сотрудники бегут обратно к лифту и бьют по кнопкам внутри той же офисной зоны; паника без новых людей.";
    visualEn = "The same employees run back to the elevator and hit the buttons inside the same office zone; panic without new people.";
    allowedLocation = "same locked office/elevator area";
    allowedObjects = "three locked employees, elevator buttons, corridor, glass partitions";
    shotRole = "chase";
    camera = "urgent handheld action shot";
    sfx = "rapid button hits, breath, shoes scraping floor";
  } else if (/кровь|лампы взрывал|лицом к стене|самого себя/.test(l)) {
    visualRu = "Нереальность того же офиса: тёмная красная жидкость поднимается вверх по стене, лампы лопаются, люди стоят лицом к стене, за стеклом видна копия сотрудника только если строка это описывает.";
    visualEn = "The same office breaks reality: dark red liquid rises up the wall, lights burst, people face the wall, and an employee's double appears behind glass only when described.";
    allowedLocation = "same locked office with glass partitions";
    allowedObjects = "wall, dark red liquid, fluorescent lights, motionless office people, duplicate only if script line says so";
    shotRole = "escalation";
    camera = "fragmented horror insert";
    sfx = "fluorescent tube crack, liquid sliding upward, glass edge tick";
  } else if (/не было кабины|ч[её]рная пустота|исчезли|остался только он/.test(l)) {
    visualRu = "Открытые двери того же лифта без кабины: внутри только чёрная пустота; персонажи исчезают один за другим или остаётся один парень согласно строке.";
    visualEn = "The same elevator doors open with no cabin inside: only black void; characters vanish one by one or one man remains according to the source line.";
    allowedLocation = "same locked elevator threshold";
    allowedObjects = "open elevator doors, black void, remaining locked employees only as scripted";
    shotRole = "climax";
    camera = "centered elevator void shot";
    sfx = "empty shaft low air pull, elevator door motor strain";
  } else if (/копи|ты уже нажимал/.test(l)) {
    visualRu = "Внутри той же кабины стоит копия оставшегося парня, с тем же лицом и одеждой; она улыбается и произносит точную реплику.";
    visualEn = "Inside the same elevator cabin stands the remaining man's duplicate, same face and wardrobe; the duplicate smiles and says the exact line.";
    allowedLocation = "inside the same locked elevator cabin";
    allowedObjects = "duplicate of the remaining man, elevator panel, elevator doors";
    shotRole = "final_reveal";
    camera = "frontal close medium shot";
    sfx = "elevator door seal, dry breath, low metal click";
  } else if (/лифт на минус первый|следующий этаж/.test(l)) {
    visualRu = "Чёрный экран или закрывающиеся двери того же лифта с точным финальным текстом из сценария; без новых изображений и персонажей.";
    visualEn = "Black screen or the same elevator doors closing with the exact final scripted title/text; no new imagery and no new characters.";
    allowedLocation = "black screen or same locked elevator doors";
    allowedObjects = "final title text only if scripted, elevator doors";
    shotRole = "final_sting";
    camera = "static final title / closing doors";
    sfx = "elevator doors closing, final whisper";
  }

  const allowedCharacters = [
    hasEmployees ? "same three locked late-night office employees only when this line refers to them" : "",
    hasCornerMan ? "same silent corner man only when this line reveals/continues him" : "",
    hasDuplicate ? "same remaining man's duplicate only when the script line names the duplicate/self" : "",
    hasScriptedOfficePeople ? "scripted motionless office people behind glass / facing wall only as described" : "",
  ].filter(Boolean);

  const forbidden = [
    noPeople ? "no people in this frame" : "",
    "no random worker, no new woman/man, no toolbox, no cage elevator, no basement, no daylight lobby, no different era",
    "no objects or locations not named or directly implied by this source line",
  ].filter(Boolean).join("; ");

  return {
    state,
    visual_ru: visualRu,
    visual_en: visualEn,
    allowed_characters: allowedCharacters,
    allowed_objects: allowedObjects,
    allowed_location: allowedLocation,
    forbidden_visuals: forbidden,
    on_screen_text: screenText ? [screenText] : [],
    shot_role: shotRole,
    camera,
    sfx,
    blocking,
  };
}

function buildFullScenarioPrompt({ projectName, script, aspectRatio, stylePreset, target, expectedFrames, effectiveDuration, frameSeconds, timingMode, partSize, styleProfile }) {
  const style = styleProfile?.style_lock || STYLE_PRESETS[stylePreset]?.lock || "locked cinematic realism";
  return `NEUROCINE TRAILER STORYBOARD MASTER PROMPT

TASK:
Scan the entire script and create one complete trailer / short-film storyboard JSON.
This is the source storyboard for all later PART grids.

PROJECT:
- title: ${projectName || "Untitled trailer"}
- target video model: ${target}
- aspect ratio: ${aspectRatio}
- total duration: ${effectiveDuration}s
- exact frame count: ${expectedFrames}
- timing mode: ${timingMode}
- preferred seconds per frame: ${frameSeconds}s
- PART grid size after storyboard: ${partSize} frames per PART

GLOBAL RULES:
- SOURCE OF TRUTH = script line.
- Use only characters, locations, objects, actions and dialogue present in the script.
- Do not invent new actors, new locations, new props, new costumes or new supernatural rules.
- Keep the same cast, wardrobe, office/elevator geography, lighting family and style from first frame to last.
- Style cannot override the script: do not add candles, oil lamps, stone, moss, medieval props, new rooms, new eras, new costumes or weather unless the script explicitly says so.
- If a script line is abstract, convert it into a minimal visual beat from the already established locked location. Do NOT add a person just to make the frame interesting.
- Do not introduce characters before the script introduces them. Before "Трое сотрудников..." the frame must be empty office/elevator geography only.
- Dialogue must be copied exactly from the script into scene.dialogue with stable voice_id.
- Visible signs, captions, displays and title cards must go into scene.on_screen_text.
- Narrator/trailer VO belongs in scene.vo_ru.
- Final PART can contain any remaining frame count. Never add filler frames just to make a perfect grid.
- Audio/SFX must be clean close-mic diegetic ASMR: exact visible physical sounds, sparse silence and suspense. No background hum, drone bed, room tone filler, music bed, white noise or vague ambience.
- For 4-frame PART grids in 9:16, create one single vertical 9:16 canvas with a strict 2×2 collage inside it. Use thin black separators only. No visible numbering, cell names, captions, title bars, UI, watermark or non-story text.

SCRIPT BREAKDOWN PASS:
Before writing scenes, scan the full script and produce the internal breakdown:
1. recurring cast and first frame where each character is introduced;
2. recurring locations and allowed office/elevator geography;
3. props/signs/displays/captions that are explicitly named;
4. dialogue lines and stable voice_id per speaker;
5. ordered visual beats from beginning to end.
Every scene must be based on this breakdown, not on free invention.

ROOT JSON FIELDS REQUIRED:
project_name, language, format, aspect_ratio, total_duration, global_style_lock, global_video_lock,
character_lock, voice_lock, cast_lock, location_lock, style_bible, grid_continuity, scenes, export_meta.

SCENE FIELDS REQUIRED FOR EVERY FRAME:
id, start, duration, description_ru, script_line_ru, image_prompt_en, video_prompt_en, vo_ru,
dialogue, on_screen_text, blocking, shot_role, sfx, camera, transition, cut_energy,
continuity_note, safety_note, visual_beat_ru, visual_beat_en, allowed_characters, allowed_objects,
allowed_location, forbidden_visuals.

LANGUAGE LOCK:
All generator-facing technical fields must be English: image_prompt_en, video_prompt_en, sfx, camera, blocking, shot_role, cast_lock, location_lock, style_bible, grid_continuity, visual_beat_en, allowed_characters, allowed_objects, allowed_location and forbidden_visuals. Russian is allowed only in description_ru, vo_ru, script_line_ru, exact dialogue.text and exact on_screen_text that must appear in the image.

FRAME COUNT CONTROL:
Return exactly ${expectedFrames} scenes.
Scene durations may be 2-10 seconds, but total_duration must equal ${effectiveDuration}s.
If timing mode is auto, split the script into meaningful trailer beats: hook image, human stake, inciting anomaly, first danger, inserts, reactions, reveals, chase/action beats, climax and final sting.
If a script beat needs multiple frames, continue the same beat visually without adding new story content.

TRAILER HOOK PACING:
- The first PART must sell the premise immediately. Do not spend the first 4 frames only on empty establishing shots or abstract narration.
- Compress abstract opening narration into ONE concrete hook frame.
- A scene.script_line_ru may combine 2-3 exact adjacent source lines with " / " when needed to form a strong trailer beat. Do not invent or paraphrase new story.
- If recurring protagonists are introduced in the first act, they must appear by frame 2.
- If the script contains an inciting anomaly/prop/sign/button/display/discovery, it must appear by frame 3.
- Frame 4 must show the first consequence, choice, trap, threat, or irreversible movement into danger if such a beat exists.
- For a 4-frame PART, use this mini-arc: 1) HOOK IMAGE, 2) HUMAN STAKE, 3) INCITING DETAIL, 4) FIRST DANGER.
- After the first PART, continue covering the remaining scenario beats in story order.

VISUAL BEAT RULES:
- visual_beat_ru / visual_beat_en are the concrete shot descriptions used by PART grids.
- image_prompt_en must start from visual_beat_en, not from abstract narration.
- allowed_characters must name only characters allowed in that frame. Empty means no character should appear.
- allowed_objects must name only props/objects supported by the source line.
- forbidden_visuals must explicitly block common hallucinations for that beat.
- If the user asks for multiple variants of the same PART, keep the same visual beats and only vary camera angle, focal length, distance, foreground layer and composition.

STYLE BIBLE:
${style}

STYLE COMPATIBILITY:
Use the style only for lens, camera behavior, color, contrast, grain, texture and lighting quality. If any style token conflicts with the script location/object list, ignore that style token and keep the scripted office/elevator world.

OUTPUT:
Return valid JSON only. No markdown. No explanation.

SCRIPT:
${script}`;
}

function buildLocalTrailerStoryboard({ script, duration, aspectRatio, stylePreset, target, targetFrames, frameSeconds, timingMode }) {
  const lines = splitScriptBeats(script);
  const totalFrames = Math.max(1, Math.round(Number(targetFrames) || estimateAutoFrameCount(script, duration, frameSeconds)));
  const plannedLines = buildTrailerBeatPlan(lines, totalFrames);
  const frameDurations = distributeDurations(duration, totalFrames, frameSeconds);
  const style = getStyleProfile("film", stylePreset)?.style_lock || STYLE_PRESETS[stylePreset]?.lock || STYLE_PRESETS.cinematic.lock;
  let runningStart = 0;
  let entityState = { employees: false, cornerMan: false, duplicate: false };
  const scenes = Array.from({ length: totalFrames }, (_, i) => {
    const source = plannedLines[i] || lines[Math.min(lines.length - 1, Math.floor((i / totalFrames) * Math.max(1, lines.length)))] || "Trailer beat";
    const visual = buildTrailerVisualBeat(source, entityState);
    entityState = visual.state;
    const isDialogue = /сказал|сказала|ш[её]пот|говорит|крик|крич/i.test(source);
    const dialogueText = source.match(/(?:сказал(?:а)?|говорит|ш[её]пот[^:]*|крик[^:]*)[:—-]\s*(.+)$/i)?.[1] || "";
    const sceneDuration = frameDurations[i] || frameSeconds || 3;
    const sceneStart = runningStart;
    const safeSfx = cleanSfxText(visual.sfx);
    const sourceEn = toPromptEnglish(source, { fallback: "current scripted beat" });
    const exactVisibleText = exactTextLine(visual.on_screen_text || []);
    const imageExactText = exactVisibleText ? ` ${exactVisibleText}.` : "";
    const videoExactText = exactVisibleText ? ` ${exactVisibleText}.` : "";
    runningStart += sceneDuration;
    return {
      id: frameId(i + 1),
      start: sceneStart,
      duration: sceneDuration,
      description_ru: visual.visual_ru,
      script_line_ru: source,
      source_of_truth: "script_line",
      visual_beat_ru: visual.visual_ru,
      visual_beat_en: visual.visual_en,
      allowed_characters: visual.allowed_characters,
      allowed_objects: visual.allowed_objects,
      allowed_location: visual.allowed_location,
      forbidden_visuals: visual.forbidden_visuals,
      image_prompt_en: `SCENE PRIMARY FOCUS: ${visual.visual_en}. Source line in English: "${sourceEn}".${imageExactText} Allowed characters: ${visual.allowed_characters.length ? visual.allowed_characters.join("; ") : "none unless explicitly visible in this beat"}. Allowed objects/location: ${visual.allowed_objects}; ${visual.allowed_location}. Style formula affects only lens, light, color, grain and texture; no new story content. ASPECT RATIO: ${aspectRatio}`,
      video_prompt_en: `ANIMATE CURRENT FRAME: SOURCE OF TRUTH: script line. Script in English: "${sourceEn}".${videoExactText} Preserve uploaded frame. Animate only this visual beat: ${visual.visual_en}. No new characters, locations or objects. Camera: ${visual.camera}. Sound: clean close-mic ASMR SFX only; no background hum, drone, room tone, music or generic ambience. SFX: ${safeSfx}. Photorealistic 24fps. ${sceneDuration}s --motion 4`,
      vo_ru: source,
      dialogue: isDialogue && dialogueText ? [{ speaker: "Offscreen voice", voice_id: "voice_04", text: dialogueText, delivery: "low supernatural whisper" }] : [],
      on_screen_text: visual.on_screen_text,
      blocking: visual.blocking,
      shot_role: visual.shot_role,
      sfx: safeSfx,
      camera: visual.camera,
      transition: "cut",
      cut_energy: i < 4 || i > totalFrames * 0.7 ? "high" : "medium",
      continuity_note: "Keep same film cast, wardrobe, location, lighting and production design. Style never adds unscripted objects or people.",
      safety_note: "Trailer mode safe visual framing",
      target,
    };
  });

  return {
    project_name: "Trailer Storyboard Local Preview",
    language: "ru",
    format: "trailer_storyboard",
    aspect_ratio: aspectRatio,
    total_duration: frameDurations.reduce((a, b) => a + b, 0),
    global_style_lock: style,
    global_video_lock: "same film trailer continuity, locked cast, locked elevator-office geography, no redesign between PART grids",
    character_lock: [
      { name: "Employee group", description: "same three office employees throughout the trailer, tired late-night office look, no actor redesign" },
      { name: "Corner man", description: "same silent man from elevator corner, motionless presence, no redesign" },
    ],
    voice_lock: [
      { character: "Narrator", voice_id: "voice_01", voice_profile: "low tense trailer narration", delivery_arc: "controlled dread to final whisper" },
      { character: "Offscreen voice", voice_id: "voice_04", voice_profile: "near-whisper supernatural voice", delivery_arc: "appears only for curse/rule lines" },
    ],
    cast_lock: [
      { id: "CHAR_01", role: "three employees", visual_identity: "same three late-night office employees from first appearance to disappearance", wardrobe: "office clothes, tired after-work look", forbidden_changes: "no new actors, no age drift, no costume redesign" },
      { id: "CHAR_02", role: "corner man", visual_identity: "same silent man in elevator corner and corridor distance", wardrobe: "dark indistinct office-era clothing", forbidden_changes: "no monster redesign, no different face/body each PART" },
    ],
    location_lock: {
      main: "old empty office, impossible elevator, long fluorescent corridors",
      materials: "dirty metal elevator, glass partitions, green-grey office walls, worn floors",
      lighting: "night office fluorescent light, red elevator light, sections going dark",
      spatial_rules: "elevator, corridor, glass office and photo wall remain one connected impossible office geography",
      forbidden: "no luxury building, no daylight modern lobby, no new unrelated location",
    },
    style_bible: style,
    grid_continuity: "PART 1 must work as a trailer hook mini-arc: hook image, human stake, inciting anomaly, first danger. PART 2+ continues the same film using cast_lock, location_lock, style_bible, visual_beat fields and previous PART visual DNA. Any final PART size is valid; never add filler frames just to make a perfect grid.",
    scenes,
    export_meta: { mode: "trailer", target, trailer_mode: true, local_preview: true, target_scene_count: totalFrames, frame_seconds: frameSeconds, timing_mode: timingMode },
  };
}

async function getAuthToken() {
  if (!isSupabaseConfigured || !supabase?.auth?.getSession) return "";
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  } catch {
    return "";
  }
}

function parseSseBlock(block) {
  const event = block.match(/^event:\s*(\S+)/m)?.[1] || "message";
  const dataRaw = block.match(/^data:\s*(.+)$/m)?.[1] || "{}";
  try {
    return { event, data: JSON.parse(dataRaw) };
  } catch {
    return { event, data: {} };
  }
}

function renderGridCrop({ upload, frameIndex, frameCount, inset = 0, onDone }) {
  if (!upload || !frameCount || typeof window === "undefined") return () => {};
  let cancelled = false;
  const img = new Image();
  img.onload = () => {
    if (cancelled) return;
    const { cols, rows } = gridLayoutFor(frameCount);
    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);
    const cellW = Math.floor(img.naturalWidth / cols);
    const cellH = Math.floor(img.naturalHeight / rows);
    const insetRatio = Math.max(0, Math.min(12, Number(inset) || 0)) / 100;
    const insetX = Math.floor(cellW * insetRatio);
    const insetY = Math.floor(cellH * insetRatio);
    const sourceX = col * cellW + insetX;
    const sourceY = row * cellH + insetY;
    const sourceW = Math.max(1, cellW - insetX * 2);
    const sourceH = Math.max(1, cellH - insetY * 2);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const targetAspect = canvas.width / canvas.height;
    const sourceAspect = sourceW / sourceH;
    let drawW = sourceW;
    let drawH = sourceH;
    let drawX = sourceX;
    let drawY = sourceY;
    if (sourceAspect > targetAspect) {
      drawW = Math.floor(sourceH * targetAspect);
      drawX = sourceX + Math.floor((sourceW - drawW) / 2);
    } else {
      drawH = Math.floor(sourceW / targetAspect);
      drawY = sourceY + Math.floor((sourceH - drawH) / 2);
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH, 0, 0, canvas.width, canvas.height);
    if (!cancelled) onDone?.(canvas.toDataURL("image/png"));
  };
  img.src = upload;
  return () => { cancelled = true; };
}

function cleanLocalWorkerUrl(value) {
  const raw = String(value || DEFAULT_LOCAL_WORKER_URL).trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw || "127.0.0.1:7860"}`;
  return withScheme.replace(/\/+$/, "") || DEFAULT_LOCAL_WORKER_URL;
}

function makeLocalAgentToken() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `agent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeLocalImageData(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/png;base64,${raw}`;
}

function escapeJsonStringContent(value) {
  return JSON.stringify(String(value ?? "")).slice(1, -1);
}

function parseLocalLoras(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\|]/).map((x) => x.trim()).filter(Boolean);
      const colonMatch = parts.length === 1 ? parts[0].match(/^(.+?):([0-9.]+)(?::([0-9.]+))?$/) : null;
      const name = colonMatch ? colonMatch[1].trim() : parts[0];
      const modelStrength = Number(colonMatch ? colonMatch[2] : parts[1]);
      const clipStrength = Number(colonMatch ? (colonMatch[3] || colonMatch[2]) : (parts[2] || parts[1]));
      return {
        name,
        strength_model: Number.isFinite(modelStrength) ? modelStrength : 0.65,
        strength_clip: Number.isFinite(clipStrength) ? clipStrength : Number.isFinite(modelStrength) ? modelStrength : 0.65,
      };
    })
    .filter((x) => x.name);
}

function workflowTemplateToJson(template, payload) {
  const raw = String(template || "").trim();
  if (!raw) return null;
  const filled = raw
    .replaceAll("__PROMPT__", escapeJsonStringContent(payload.prompt || ""))
    .replaceAll("__NEGATIVE__", escapeJsonStringContent(payload.negative_prompt || ""))
    .replaceAll("__WIDTH__", String(payload.width || LOCAL_IMAGE_WIDTH))
    .replaceAll("__HEIGHT__", String(payload.height || LOCAL_IMAGE_HEIGHT))
    .replaceAll("__STEPS__", String(payload.steps || 24))
    .replaceAll("__CFG__", String(payload.cfg_scale || 6))
    .replaceAll("__SEED__", String(Number(payload.seed) >= 0 ? payload.seed : Math.floor(Math.random() * 999999999)))
    .replaceAll("__CHECKPOINT__", escapeJsonStringContent(payload.checkpoint || ""));
  return JSON.parse(filled);
}

function buildLocalRenderPayload({
  prompt,
  provider,
  modelPreset,
  checkpoint,
  loraText,
  workflowTemplate,
  width,
  height,
  steps,
  cfg,
}) {
  const preset = LOCAL_MODEL_PRESETS[modelPreset] || LOCAL_MODEL_PRESETS[DEFAULT_LOCAL_MODEL_PRESET];
  const payload = {
    prompt,
    negative_prompt: LOCAL_IMAGE_NEGATIVE,
    model_preset: modelPreset,
    model_family: preset.family || "sdxl",
    checkpoint: String(checkpoint || preset.checkpoint || "").trim(),
    width: clampNumber(width, 512, 1536, preset.width || LOCAL_IMAGE_WIDTH),
    height: clampNumber(height, 768, 2048, preset.height || LOCAL_IMAGE_HEIGHT),
    steps: clampNumber(steps, 4, 60, preset.steps || 24),
    cfg_scale: clampNumber(cfg, 1, 12, preset.cfg || 6),
    sampler_name: provider === "automatic1111" ? (preset.a1111Sampler || "DPM++ 2M Karras") : (preset.sampler || "dpmpp_2m"),
    scheduler: preset.scheduler || "karras",
    batch_size: 1,
    n_iter: 1,
    seed: -1,
    loras: parseLocalLoras(loraText),
  };
  const workflow = workflowTemplateToJson(workflowTemplate, payload);
  if (workflow) payload.workflow = workflow;
  return payload;
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 600000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.detail || `HTTP ${res.status}`);
    return json;
  } finally {
    window.clearTimeout(timer);
  }
}

async function requestLocalWorkerHealth({ workerUrl, provider }) {
  const url = cleanLocalWorkerUrl(workerUrl);
  const endpoint = provider === "automatic1111"
    ? `${url}/sdapi/v1/sd-models`
    : provider === "comfyui"
      ? `${url}/system_stats`
      : `${url}/health`;
  try {
    const data = await fetchJsonWithTimeout(endpoint, { method: "GET" }, 12000);
    return { ok: true, mode: "direct", data };
  } catch (directError) {
    const data = await fetchJsonWithTimeout("/api/trailer/local-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "health", workerUrl: url, provider, direct_error: directError.message }),
    }, 12000);
    return { ok: true, mode: "proxy", data };
  }
}

async function requestLocalPartImage({ workerUrl, provider, payload, partIndex }) {
  const url = cleanLocalWorkerUrl(workerUrl);
  const finalPayload = payload || {};

  try {
    if (provider === "automatic1111") {
      const data = await fetchJsonWithTimeout(`${url}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });
      const image = normalizeLocalImageData(data.images?.[0]);
      if (!image) throw new Error("Automatic1111 не вернул изображение");
      return { image, mode: "direct", provider };
    }

    if (provider === "comfyui") {
      const data = await fetchJsonWithTimeout("/api/trailer/local-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "render", workerUrl: url, provider, payload: finalPayload, partIndex }),
      });
      const image = normalizeLocalImageData(data.image || data.data_url || data.dataUrl);
      if (!image) throw new Error("ComfyUI не вернул изображение");
      return { image, mode: "proxy", provider };
    }

    const data = await fetchJsonWithTimeout(`${url}/render-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...finalPayload, part_index: partIndex }),
    });
    const image = normalizeLocalImageData(data.image || data.data_url || data.dataUrl || data.images?.[0]);
    if (!image) throw new Error("Локальный worker не вернул изображение");
    return { image, mode: "direct", provider };
  } catch (directError) {
    const data = await fetchJsonWithTimeout("/api/trailer/local-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "render", workerUrl: url, provider, payload: finalPayload, partIndex, direct_error: directError.message }),
    });
    const image = normalizeLocalImageData(data.image || data.data_url || data.dataUrl);
    if (!image) throw new Error(data.error || "Локальный proxy не вернул изображение");
    return { image, mode: "proxy", provider };
  }
}

export default function TrailerStoryboardPage() {
  const [projectName, setProjectName] = useState("Лифт на минус первый");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [duration, setDuration] = useState(87);
  const [frameSeconds, setFrameSeconds] = useState(3);
  const [autoTiming, setAutoTiming] = useState(true);
  const [customFrameCount, setCustomFrameCount] = useState(27);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [target, setTarget] = useState("grok");
  const [stylePreset, setStylePreset] = useState("psychologicalDread");
  const [partSize, setPartSize] = useState(4);
  const [activePart, setActivePart] = useState(0);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [gridUploads, setGridUploads] = useState({});
  const [croppedFrame, setCroppedFrame] = useState("");
  const [cropInset, setCropInset] = useState(0);
  const [storyboard, setStoryboard] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [localWorkerUrl, setLocalWorkerUrl] = useState(DEFAULT_LOCAL_WORKER_URL);
  const [localRenderProvider, setLocalRenderProvider] = useState(DEFAULT_LOCAL_RENDER_PROVIDER);
  const [localRenderBusy, setLocalRenderBusy] = useState(false);
  const [localRenderJobs, setLocalRenderJobs] = useState({});
  const [localAgentToken, setLocalAgentToken] = useState("");
  const [localQueueJobs, setLocalQueueJobs] = useState({});
  const [localModelPreset, setLocalModelPreset] = useState(DEFAULT_LOCAL_MODEL_PRESET);
  const defaultLocalModel = LOCAL_MODEL_PRESETS[DEFAULT_LOCAL_MODEL_PRESET];
  const [localCheckpoint, setLocalCheckpoint] = useState(defaultLocalModel.checkpoint);
  const [localLoras, setLocalLoras] = useState("");
  const [localWorkflowTemplate, setLocalWorkflowTemplate] = useState("");
  const [localImageWidth, setLocalImageWidth] = useState(defaultLocalModel.width);
  const [localImageHeight, setLocalImageHeight] = useState(defaultLocalModel.height);
  const [localSteps, setLocalSteps] = useState(defaultLocalModel.steps);
  const [localCfg, setLocalCfg] = useState(defaultLocalModel.cfg);

  const styleProfile = useMemo(() => getStyleProfile("film", stylePreset), [stylePreset]);
  const scenes = useMemo(() => (Array.isArray(storyboard?.scenes) ? storyboard.scenes : []), [storyboard]);
  const parts = useMemo(() => splitScenesIntoParts(scenes, partSize), [scenes, partSize]);
  const safePart = Math.max(0, Math.min(activePart, Math.max(0, parts.length - 1)));
  const partScenes = useMemo(() => parts[safePart] || [], [parts, safePart]);
  const safeFrameIndex = Math.max(0, Math.min(selectedFrameIndex, Math.max(0, partScenes.length - 1)));
  const selectedScene = partScenes[safeFrameIndex] || null;
  const currentGridUpload = gridUploads[safePart] || "";
  const currentGridLayout = useMemo(() => gridLayoutFor(partScenes.length || partSize), [partScenes.length, partSize]);
  const selectedPrompt = useMemo(() => {
    if (!storyboard || !partScenes.length) return "";
    return buildFlowCompactPartPrompt({
      storyboard,
      styleProfile,
      partScenes,
      partIndex: safePart,
      totalScenes: scenes.length,
      partSize,
      chainMode: "worldHero",
      strictLevel: "maximum",
      referenceMode: safePart === 0 ? "heroOnly" : "heroAndPrevious",
      appearanceMode: "full",
    });
  }, [storyboard, styleProfile, partScenes, safePart, scenes.length, partSize]);
  const flowGrokFixedPrompt = useMemo(() => {
    if (!selectedPrompt) return "";
    const fix = buildFlowGrokContinuityFixPrompt({
      storyboard,
      styleProfile,
      partScenes,
      partIndex: safePart,
      gridLayout: currentGridLayout,
    });
    return `${fix}\n\n${selectedPrompt}`.trim();
  }, [selectedPrompt, storyboard, styleProfile, partScenes, safePart, currentGridLayout]);
  const maxManualFrames = Math.max(1, Math.floor(MAX_TOTAL_DURATION / Math.max(1, Number(frameSeconds) || 3)));
  const manualFrames = clampNumber(customFrameCount, 1, maxManualFrames, 27);
  const autoFrames = estimateAutoFrameCount(script, duration, frameSeconds);
  const expectedFrames = autoTiming ? autoFrames : manualFrames;
  const effectiveDuration = autoTiming
    ? clampNumber(duration, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 87)
    : clampNumber(manualFrames * frameSeconds, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 81);
  const timingMode = autoTiming ? "auto" : "manual";
  const fullScenarioPrompt = useMemo(() => buildFullScenarioPrompt({
    projectName,
    script,
    aspectRatio,
    stylePreset,
    target,
    expectedFrames,
    effectiveDuration,
    frameSeconds,
    timingMode,
    partSize,
    styleProfile,
  }), [projectName, script, aspectRatio, stylePreset, target, expectedFrames, effectiveDuration, frameSeconds, timingMode, partSize, styleProfile]);
  const selectedFrameVideoPrompt = useMemo(() => buildLockedFrameVideoPrompt({
    scene: selectedScene,
    storyboard,
    styleProfile,
    frameLabelText: frameLabel(selectedScene, safeFrameIndex),
    hasCrop: Boolean(croppedFrame),
  }), [selectedScene, storyboard, styleProfile, safeFrameIndex, croppedFrame]);
  const localAgentCommand = useMemo(() => {
    const site = typeof window !== "undefined" ? window.location.origin : "https://www.neurocine.online";
    const token = localAgentToken || "PASTE_AGENT_TOKEN";
    const base = `npm run local-agent -- --site "${site}" --token "${token}" --provider ${localRenderProvider} --worker "${cleanLocalWorkerUrl(localWorkerUrl)}"`;
    return localRenderProvider === "comfyui"
      ? `${base} --checkpoint "${localCheckpoint || defaultLocalModel.checkpoint}"`
      : base;
  }, [localAgentToken, localRenderProvider, localWorkerUrl, localCheckpoint, defaultLocalModel.checkpoint]);
  const activeLocalModelPreset = LOCAL_MODEL_PRESETS[localModelPreset] || LOCAL_MODEL_PRESETS[DEFAULT_LOCAL_MODEL_PRESET];

  function buildPartPromptForIndex(partIndex, includeFix = true) {
    const part = parts[partIndex] || [];
    if (!storyboard || !part.length) return "";
    const layout = gridLayoutFor(part.length || partSize);
    const partPrompt = buildFlowCompactPartPrompt({
      storyboard,
      styleProfile,
      partScenes: part,
      partIndex,
      totalScenes: scenes.length,
      partSize,
      chainMode: "worldHero",
      strictLevel: "maximum",
      referenceMode: partIndex === 0 ? "heroOnly" : "heroAndPrevious",
      appearanceMode: "full",
    });
    if (!includeFix) return partPrompt;
    const fixPrompt = buildFlowGrokContinuityFixPrompt({
      storyboard,
      styleProfile,
      partScenes: part,
      partIndex,
      gridLayout: layout,
    });
    return `${fixPrompt}\n\n${partPrompt}`.trim();
  }

  function updateLocalRenderJob(partIndex, patch) {
    setLocalRenderJobs((prev) => ({
      ...prev,
      [partIndex]: { ...(prev[partIndex] || {}), ...patch },
    }));
  }

  function changeLocalRenderProvider(nextProvider) {
    const next = nextProvider || DEFAULT_LOCAL_RENDER_PROVIDER;
    setLocalRenderProvider(next);
    setLocalWorkerUrl((prev) => {
      const current = cleanLocalWorkerUrl(prev);
      const known = Object.values(LOCAL_WORKER_URLS).map(cleanLocalWorkerUrl);
      return !prev || known.includes(current) ? (LOCAL_WORKER_URLS[next] || DEFAULT_LOCAL_WORKER_URL) : prev;
    });
  }

  function applyLocalModelPreset(nextPreset) {
    const presetKey = nextPreset || DEFAULT_LOCAL_MODEL_PRESET;
    const preset = LOCAL_MODEL_PRESETS[presetKey] || LOCAL_MODEL_PRESETS[DEFAULT_LOCAL_MODEL_PRESET];
    setLocalModelPreset(presetKey);
    if (preset.checkpoint) setLocalCheckpoint(preset.checkpoint);
    setLocalImageWidth(preset.width || LOCAL_IMAGE_WIDTH);
    setLocalImageHeight(preset.height || LOCAL_IMAGE_HEIGHT);
    setLocalSteps(preset.steps || 24);
    setLocalCfg(preset.cfg || 6);
  }

  function buildCurrentLocalPayload(prompt) {
    return buildLocalRenderPayload({
      prompt,
      provider: localRenderProvider,
      modelPreset: localModelPreset,
      checkpoint: localCheckpoint,
      loraText: localLoras,
      workflowTemplate: localWorkflowTemplate,
      width: localImageWidth,
      height: localImageHeight,
      steps: localSteps,
      cfg: localCfg,
    });
  }

  async function copyLocalAgentCommand() {
    const token = localAgentToken || makeLocalAgentToken();
    if (!localAgentToken) setLocalAgentToken(token);
    await navigator.clipboard.writeText(localAgentCommand.replace("PASTE_AGENT_TOKEN", token));
    setStatus("Команда локального агента скопирована");
  }

  async function refreshLocalQueueJobs(quiet = false) {
    const entries = Object.values(localQueueJobs || {}).filter((job) => job?.id);
    if (!entries.length || !localAgentToken) return;
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          agent_token: localAgentToken,
          ids: entries.map((job) => job.id),
        }),
      }, 30000);
      const nextJobs = {};
      for (const job of data.jobs || []) {
        nextJobs[job.part_index] = job;
        if (job.status === "done" && job.image_data) {
          setGridUploads((prev) => ({ ...prev, [job.part_index]: job.image_data }));
          updateLocalRenderJob(job.part_index, { status: "done", message: "агент вернул сетку" });
        } else if (job.status === "failed") {
          updateLocalRenderJob(job.part_index, { status: "error", message: job.error || "ошибка агента" });
        } else {
          updateLocalRenderJob(job.part_index, { status: job.status === "running" ? "rendering" : "", message: job.status === "running" ? "агент рендерит..." : "в очереди" });
        }
      }
      setLocalQueueJobs((prev) => ({ ...prev, ...nextJobs }));
      if (!quiet) setStatus(`Очередь обновлена: ${Object.keys(nextJobs).length} заданий`);
    } catch (e) {
      if (!quiet) setError(`Не удалось обновить очередь: ${e.message}`);
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TRAILER_DRAFT_KEY);
      if (!raw) {
        setDraftReady(true);
        return;
      }
      const draft = JSON.parse(raw);
      if (draft.projectName) setProjectName(draft.projectName);
      if (draft.script) setScript(draft.script);
      if (draft.duration) setDuration(Number(draft.duration));
      if (draft.frameSeconds) setFrameSeconds(Number(draft.frameSeconds));
      if (typeof draft.autoTiming === "boolean") setAutoTiming(draft.autoTiming);
      if (draft.customFrameCount) setCustomFrameCount(Number(draft.customFrameCount));
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.target) setTarget(draft.target);
      if (draft.stylePreset) setStylePreset(draft.stylePreset);
      if (draft.partSize) setPartSize(Number(draft.partSize));
      if (draft.storyboard?.scenes) setStoryboard(draft.storyboard);
      if (draft.gridUploads && typeof draft.gridUploads === "object") setGridUploads(draft.gridUploads);
      if (Number.isFinite(Number(draft.activePart))) setActivePart(Number(draft.activePart));
      if (Number.isFinite(Number(draft.selectedFrameIndex))) setSelectedFrameIndex(Number(draft.selectedFrameIndex));
      if (Number.isFinite(Number(draft.cropInset))) setCropInset(Number(draft.cropInset));
      if (draft.localWorkerUrl) setLocalWorkerUrl(draft.localWorkerUrl);
      if (draft.localRenderProvider) setLocalRenderProvider(draft.localRenderProvider);
      if (draft.localModelPreset) setLocalModelPreset(draft.localModelPreset);
      if (draft.localCheckpoint !== undefined) setLocalCheckpoint(draft.localCheckpoint);
      if (draft.localLoras !== undefined) setLocalLoras(draft.localLoras);
      if (draft.localWorkflowTemplate !== undefined) setLocalWorkflowTemplate(draft.localWorkflowTemplate);
      if (Number.isFinite(Number(draft.localImageWidth))) setLocalImageWidth(Number(draft.localImageWidth));
      if (Number.isFinite(Number(draft.localImageHeight))) setLocalImageHeight(Number(draft.localImageHeight));
      if (Number.isFinite(Number(draft.localSteps))) setLocalSteps(Number(draft.localSteps));
      if (Number.isFinite(Number(draft.localCfg))) setLocalCfg(Number(draft.localCfg));
      setLocalAgentToken(draft.localAgentToken || makeLocalAgentToken());
      if (draft.localQueueJobs && typeof draft.localQueueJobs === "object") setLocalQueueJobs(draft.localQueueJobs);
      if (draft.lastSavedAt) setLastSavedAt(draft.lastSavedAt);
    } catch {}
    setLocalAgentToken((prev) => prev || makeLocalAgentToken());
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const savedAt = new Date().toISOString();
    const payload = {
      projectName, script, duration, frameSeconds, autoTiming, customFrameCount,
      aspectRatio, target, stylePreset, partSize, cropInset, storyboard, activePart,
      selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset,
      localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight,
      localSteps, localCfg, localAgentToken, localQueueJobs, lastSavedAt: savedAt,
    };
    try {
      window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
    } catch {
      try {
        window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify({ ...payload, gridUploads: {}, croppedFrame: "" }));
        setLastSavedAt(savedAt);
      } catch {}
    }
  }, [draftReady, projectName, script, duration, frameSeconds, autoTiming, customFrameCount, aspectRatio, target, stylePreset, partSize, cropInset, storyboard, activePart, selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset, localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight, localSteps, localCfg, localAgentToken, localQueueJobs]);

  useEffect(() => {
    if (!currentGridUpload || !partScenes.length) {
      setCroppedFrame("");
      return undefined;
    }
    return renderGridCrop({
      upload: currentGridUpload,
      frameIndex: safeFrameIndex,
      frameCount: partScenes.length,
      inset: cropInset,
      onDone: setCroppedFrame,
    });
  }, [currentGridUpload, safeFrameIndex, partScenes.length, cropInset]);

  useEffect(() => {
    const active = Object.values(localQueueJobs || {}).some((job) => job?.status === "queued" || job?.status === "running");
    if (!active || !localAgentToken) return undefined;
    const timer = window.setInterval(() => refreshLocalQueueJobs(true), 4000);
    refreshLocalQueueJobs(true);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQueueJobs, localAgentToken]);

  function restoreSavedDraft() {
    try {
      const raw = window.localStorage.getItem(TRAILER_DRAFT_KEY);
      if (!raw) {
        setStatus("Сохранённая раскадровка не найдена");
        return;
      }
      const draft = JSON.parse(raw);
      if (draft.projectName !== undefined) setProjectName(draft.projectName);
      if (draft.script !== undefined) setScript(draft.script);
      if (draft.duration) setDuration(Number(draft.duration));
      if (draft.frameSeconds) setFrameSeconds(Number(draft.frameSeconds));
      if (typeof draft.autoTiming === "boolean") setAutoTiming(draft.autoTiming);
      if (draft.customFrameCount) setCustomFrameCount(Number(draft.customFrameCount));
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.target) setTarget(draft.target);
      if (draft.stylePreset) setStylePreset(draft.stylePreset);
      if (draft.partSize) setPartSize(Number(draft.partSize));
      if (draft.localWorkerUrl) setLocalWorkerUrl(draft.localWorkerUrl);
      if (draft.localRenderProvider) setLocalRenderProvider(draft.localRenderProvider);
      if (draft.localModelPreset) setLocalModelPreset(draft.localModelPreset);
      if (draft.localCheckpoint !== undefined) setLocalCheckpoint(draft.localCheckpoint);
      if (draft.localLoras !== undefined) setLocalLoras(draft.localLoras);
      if (draft.localWorkflowTemplate !== undefined) setLocalWorkflowTemplate(draft.localWorkflowTemplate);
      if (Number.isFinite(Number(draft.localImageWidth))) setLocalImageWidth(Number(draft.localImageWidth));
      if (Number.isFinite(Number(draft.localImageHeight))) setLocalImageHeight(Number(draft.localImageHeight));
      if (Number.isFinite(Number(draft.localSteps))) setLocalSteps(Number(draft.localSteps));
      if (Number.isFinite(Number(draft.localCfg))) setLocalCfg(Number(draft.localCfg));
      setLocalAgentToken(draft.localAgentToken || makeLocalAgentToken());
      setLocalQueueJobs(draft.localQueueJobs && typeof draft.localQueueJobs === "object" ? draft.localQueueJobs : {});
      setStoryboard(draft.storyboard?.scenes ? draft.storyboard : null);
      setGridUploads(draft.gridUploads && typeof draft.gridUploads === "object" ? draft.gridUploads : {});
      setActivePart(Number.isFinite(Number(draft.activePart)) ? Number(draft.activePart) : 0);
      setSelectedFrameIndex(Number.isFinite(Number(draft.selectedFrameIndex)) ? Number(draft.selectedFrameIndex) : 0);
      setCropInset(Number.isFinite(Number(draft.cropInset)) ? Number(draft.cropInset) : 0);
      setCroppedFrame("");
      setError("");
      setLastSavedAt(draft.lastSavedAt || "");
      setStatus(draft.storyboard?.scenes ? `Загружено: ${draft.storyboard.scenes.length} кадров` : "Загружены сохранённые настройки");
    } catch {}
  }

  function saveDraftNow() {
    const savedAt = new Date().toISOString();
    const payload = {
      projectName, script, duration, frameSeconds, autoTiming, customFrameCount,
      aspectRatio, target, stylePreset, partSize, cropInset, storyboard, activePart,
      selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset,
      localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight,
      localSteps, localCfg, localAgentToken, localQueueJobs, lastSavedAt: savedAt,
    };
    try {
      window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
      setStatus(storyboard?.scenes ? `Сохранено локально: ${storyboard.scenes.length} кадров` : "Настройки сохранены локально");
    } catch {
      try {
        window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify({ ...payload, gridUploads: {} }));
        setLastSavedAt(savedAt);
        setStatus("Сохранено без изображений сеток: хранилище браузера заполнено");
      } catch {
        setError("Не удалось сохранить локально: хранилище браузера заполнено");
      }
    }
  }

  function clearSavedDraft() {
    window.localStorage.removeItem(TRAILER_DRAFT_KEY);
    setLastSavedAt("");
    setStatus("Сохранённый черновик удалён из браузера");
  }

  function resetAll() {
    window.localStorage.removeItem(TRAILER_DRAFT_KEY);
    setProjectName("");
    setScript("");
    setDuration(87);
    setFrameSeconds(3);
    setAutoTiming(true);
    setCustomFrameCount(27);
    setAspectRatio("9:16");
    setTarget("grok");
    setStylePreset("psychologicalDread");
    setPartSize(4);
    setActivePart(0);
    setSelectedFrameIndex(0);
    setGridUploads({});
    setCroppedFrame("");
    setCropInset(0);
    setStoryboard(null);
    setLocalWorkerUrl(DEFAULT_LOCAL_WORKER_URL);
    setLocalRenderProvider(DEFAULT_LOCAL_RENDER_PROVIDER);
    setLocalRenderBusy(false);
    setLocalRenderJobs({});
    setLocalAgentToken(makeLocalAgentToken());
    setLocalQueueJobs({});
    setLocalModelPreset(DEFAULT_LOCAL_MODEL_PRESET);
    setLocalCheckpoint(defaultLocalModel.checkpoint);
    setLocalLoras("");
    setLocalWorkflowTemplate("");
    setLocalImageWidth(defaultLocalModel.width);
    setLocalImageHeight(defaultLocalModel.height);
    setLocalSteps(defaultLocalModel.steps);
    setLocalCfg(defaultLocalModel.cfg);
    setError("");
    setLastSavedAt("");
    setShowMasterPrompt(false);
    setStatus("Всё очищено: сценарий, раскадровка, PART-сетки, кроп и локальное сохранение");
  }

  async function generateTrailer() {
    setBusy(true);
    setError("");
    setStatus("Готовлю запрос на трейлерную раскадровку...");
    setActivePart(0);
    setSelectedFrameIndex(0);
    setCroppedFrame("");

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          project_name: projectName,
          script,
          duration: effectiveDuration,
          target_scene_count: expectedFrames,
          frame_seconds: frameSeconds,
          timing_mode: timingMode,
          auto_analyze_script: autoTiming,
          aspect_ratio: aspectRatio,
          style: stylePreset,
          mode: "trailer",
          target,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok && !contentType.includes("text/event-stream")) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Ошибка API раскадровки (${res.status})`);
      }

      if (!res.body || !contentType.includes("text/event-stream")) {
        const payload = await res.json();
        if (!payload.storyboard) throw new Error(payload.error || "API не вернул раскадровку");
        setStoryboard(payload.storyboard);
        setStatus(`Готово: ${payload.storyboard.scenes?.length || 0} кадров. Сохранено локально.`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          if (!block.trim()) continue;
          const { event, data } = parseSseBlock(block);
          if (event === "done" && data.storyboard) {
            setStoryboard(data.storyboard);
            setStatus(`Готово: ${data.storyboard.scenes?.length || 0} кадров. Сохранено локально.`);
          } else if (event === "error" || event === "chunk_failed") {
            throw new Error(data.error || "Генерация трейлерной раскадровки не удалась");
          } else if (data.message) {
            setStatus(data.message);
          } else if (event === "chunk_started") {
            setStatus(`Генерируется часть ${data.chunk_number}/${data.total_chunks}...`);
          } else if (event === "chunk_completed") {
            setStatus(`Часть ${data.chunk_number}/${data.total_chunks} готова`);
          } else {
            setStatus(event);
          }
        }
      }
    } catch (e) {
      setError(e.message || "Генерация трейлерной раскадровки не удалась");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function buildLocalPreview() {
    setError("");
    setBusy(false);
    setActivePart(0);
    setSelectedFrameIndex(0);
    setCroppedFrame("");
    const sb = buildLocalTrailerStoryboard({ script, duration: effectiveDuration, aspectRatio, stylePreset, target, targetFrames: expectedFrames, frameSeconds, timingMode });
    setStoryboard(sb);
    setStatus(`Локальный тест: ${sb.scenes.length} кадров, ${splitScenesIntoParts(sb.scenes, partSize).length} PART. Сохранено локально.`);
  }

  async function checkLocalRenderWorker() {
    setError("");
    setLocalRenderBusy(true);
    setStatus("Проверяю локальный генератор на ПК...");
    try {
      const result = await requestLocalWorkerHealth({ workerUrl: localWorkerUrl, provider: localRenderProvider });
      setStatus(`Локальный ПК доступен (${result.mode === "direct" ? "напрямую из браузера" : "через локальный proxy"}).`);
    } catch (e) {
      setError(`Локальный генератор не отвечает: ${e.message}. Запусти WebUI/Forge с --api или NeuroCine worker на этом адресе.`);
    } finally {
      setLocalRenderBusy(false);
    }
  }

  async function generatePartGridOnLocalPc(partIndex, keepQueueBusy = false) {
    const part = parts[partIndex] || [];
    const prompt = buildPartPromptForIndex(partIndex, true);
    if (!storyboard || !part.length || !prompt) {
      setError("Сначала создай storyboard JSON и выбери PART.");
      return false;
    }
    if (!keepQueueBusy) setLocalRenderBusy(true);
    setError("");
    setActivePart(partIndex);
    setSelectedFrameIndex(0);
    setCroppedFrame("");
    updateLocalRenderJob(partIndex, { status: "rendering", message: "генерация на ПК..." });
    setStatus(`PART ${partIndex + 1}: отправляю промт на локальный ПК...`);
    try {
      const payload = buildCurrentLocalPayload(prompt);
      const result = await requestLocalPartImage({
        workerUrl: localWorkerUrl,
        provider: localRenderProvider,
        payload,
        partIndex,
      });
      setGridUploads((prev) => ({ ...prev, [partIndex]: result.image }));
      updateLocalRenderJob(partIndex, { status: "done", message: result.mode === "direct" ? "готово напрямую" : "готово через proxy" });
      setStatus(`PART ${partIndex + 1}: сетка с локального ПК вставлена в блок.`);
      return true;
    } catch (e) {
      updateLocalRenderJob(partIndex, { status: "error", message: e.message || "ошибка" });
      setError(`PART ${partIndex + 1}: ${e.message || "локальная генерация не удалась"}`);
      return false;
    } finally {
      if (!keepQueueBusy) setLocalRenderBusy(false);
    }
  }

  async function generateCurrentPartOnLocalPc() {
    await generatePartGridOnLocalPc(safePart);
  }

  async function generateAllPartsOnLocalPc() {
    if (!parts.length) {
      setError("Сначала создай storyboard JSON.");
      return;
    }
    setLocalRenderBusy(true);
    setError("");
    let done = 0;
    try {
      for (let i = 0; i < parts.length; i += 1) {
        const ok = await generatePartGridOnLocalPc(i, true);
        if (!ok) break;
        done += 1;
      }
      setStatus(`Локальная очередь завершена: ${done}/${parts.length} PART готово.`);
    } finally {
      setLocalRenderBusy(false);
    }
  }

  async function queuePartsForLocalAgent(partIndexes = []) {
    if (!parts.length || !storyboard) {
      setError("Сначала создай storyboard JSON.");
      return;
    }
    const token = localAgentToken || makeLocalAgentToken();
    if (!localAgentToken) setLocalAgentToken(token);
    const indexes = partIndexes.length ? partIndexes : parts.map((_, i) => i);
    let jobs = [];
    try {
      jobs = indexes.map((partIndex) => {
        const part = parts[partIndex] || [];
        const prompt = buildPartPromptForIndex(partIndex, true);
        const payload = buildCurrentLocalPayload(prompt);
        payload.part_size = part.length;
        return {
          part_index: partIndex,
          part_label: `PART ${partIndex + 1}`,
          provider: localRenderProvider,
          prompt,
          negative_prompt: payload.negative_prompt,
          payload,
        };
      }).filter((job) => job.prompt);
    } catch (e) {
      setError(`Ошибка настроек модели/workflow: ${e.message}`);
      return;
    }
    if (!jobs.length) {
      setError("Не удалось собрать PART-промты для очереди.");
      return;
    }

    setLocalRenderBusy(true);
    setError("");
    setStatus(`Создаю очередь для локального агента: ${jobs.length} PART...`);
    try {
      const authToken = await getAuthToken();
      if (!authToken) throw new Error("Для облачной очереди нужно войти через Google.");
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "create",
          agent_token: token,
          project_name: projectName || storyboard.project_name || "NeuroCine Trailer",
          provider: localRenderProvider,
          jobs,
        }),
      }, 30000);
      const nextJobs = {};
      for (const job of data.jobs || []) {
        nextJobs[job.part_index] = job;
        updateLocalRenderJob(job.part_index, { status: "", message: "в очереди агента" });
      }
      setLocalQueueJobs((prev) => ({ ...prev, ...nextJobs }));
      setStatus(`Очередь создана: ${Object.keys(nextJobs).length} PART. Запусти Local Agent на ПК.`);
    } catch (e) {
      setError(`Очередь не создана: ${e.message}`);
    } finally {
      setLocalRenderBusy(false);
    }
  }

  async function queueCurrentPartForLocalAgent() {
    await queuePartsForLocalAgent([safePart]);
  }

  async function queueAllPartsForLocalAgent() {
    await queuePartsForLocalAgent(parts.map((_, i) => i));
  }

  async function copyPrompt() {
    if (!selectedPrompt) return;
    await navigator.clipboard.writeText(selectedPrompt);
    setStatus(`Промт PART ${safePart + 1} скопирован`);
  }

  async function copyFlowGrokFixedPrompt() {
    if (!flowGrokFixedPrompt) return;
    await navigator.clipboard.writeText(flowGrokFixedPrompt);
    setStatus(`Фикс Flow/Grok для PART ${safePart + 1} скопирован`);
  }

  async function copySelectedVideoPrompt() {
    const text = selectedFrameVideoPrompt || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus(`Видеопромт ${frameLabel(selectedScene, safeFrameIndex)} скопирован`);
  }

  function uploadPartGrid(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGridUploads((prev) => ({ ...prev, [safePart]: String(reader.result || "") }));
      setSelectedFrameIndex(0);
      setCroppedFrame("");
      setStatus(`PART ${safePart + 1}: сетка загружена`);
    };
    reader.readAsDataURL(file);
  }

  function selectGridFrame(index) {
    setSelectedFrameIndex(index);
    setCroppedFrame("");
    setStatus(`${frameLabel(partScenes[index], index)} выбран`);
  }

  function cropSelectedFrame() {
    if (!currentGridUpload || !partScenes.length) return;
    renderGridCrop({
      upload: currentGridUpload,
      frameIndex: safeFrameIndex,
      frameCount: partScenes.length,
      inset: cropInset,
      onDone: (dataUrl) => {
        setCroppedFrame(dataUrl);
        setStatus(`${frameLabel(selectedScene, safeFrameIndex)} обрезан в чистый 9:16`);
      },
    });
  }

  function downloadCroppedFrame() {
    if (!croppedFrame || !selectedScene) return;
    const a = document.createElement("a");
    a.href = croppedFrame;
    a.download = `${projectName || "trailer"}-${frameLabel(selectedScene, safeFrameIndex)}-9x16.png`;
    a.click();
  }

  async function copyFullScenarioPrompt() {
    if (!fullScenarioPrompt) return;
    await navigator.clipboard.writeText(fullScenarioPrompt);
    setStatus("Мастер-промт всего сценария скопирован");
  }

  function downloadJson() {
    if (!storyboard) return;
    const blob = new Blob([JSON.stringify(storyboard, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "trailer-storyboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="trailer-page">
      <style jsx>{`
        .trailer-page{min-height:100vh;background:#090b10;color:#f7f3ea;padding:18px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .wrap{max-width:1280px;margin:0 auto;display:grid;gap:16px}
        .hero{display:grid;gap:12px;padding:18px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(135deg,rgba(180,31,54,.2),rgba(20,24,34,.95));border-radius:10px}
        .kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ffb3bd;font-weight:900}
        h1{margin:0;font-size:clamp(28px,6vw,62px);line-height:.95;letter-spacing:0}
        .hero p{margin:0;max-width:820px;color:rgba(247,243,234,.72);line-height:1.55}
        .hero-links{display:flex;gap:10px;flex-wrap:wrap}
        .hero-links a{border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:10px 12px;color:#f7f3ea;text-decoration:none;font-size:13px;font-weight:900;background:rgba(255,255,255,.055)}
        .grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:16px;align-items:start}
        .panel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);border-radius:8px;padding:14px;display:grid;gap:12px}
        .panel h2{margin:0;font-size:16px}
        label{display:grid;gap:6px;font-size:12px;color:rgba(247,243,234,.66);font-weight:800;text-transform:uppercase;letter-spacing:.06em}
        input,textarea,select{width:100%;box-sizing:border-box;background:#10131b;color:#f7f3ea;border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:11px;font:inherit}
        input[type="range"]{accent-color:#e3344f;padding:0}
        input[type="checkbox"]{width:auto}
        textarea{min-height:320px;resize:vertical;line-height:1.45}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .range-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .range-head strong{color:#fff;font-size:13px;letter-spacing:0;text-transform:none}
        .quick{display:flex;gap:7px;flex-wrap:wrap}
        .quick button{padding:7px 9px;font-size:11px;background:#151a24}
        .check{display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);border-radius:8px;padding:10px;color:#f7f3ea;text-transform:none;letter-spacing:0}
        .buttons{display:flex;gap:10px;flex-wrap:wrap}
        button{border:0;border-radius:6px;padding:11px 13px;background:#242936;color:#f7f3ea;font-weight:900;cursor:pointer}
        button.primary{background:#e3344f;color:white}
        button.danger{background:#3a121b;color:#ffb3bd;border:1px solid rgba(227,52,79,.35)}
        button:disabled{opacity:.55;cursor:not-allowed}
        .pills{display:flex;gap:8px;flex-wrap:wrap}
        .pill{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.04);padding:8px 10px;border-radius:999px;font-size:12px}
        .pill.active{border-color:#e3344f;background:rgba(227,52,79,.18);color:#ffd6dc}
        .metricbox{border:1px solid rgba(255,255,255,.12);background:#10131b;border-radius:6px;padding:11px;display:grid;gap:4px;min-height:46px}
        .metricbox strong{font-size:20px;color:#fff;letter-spacing:0}
        .metricbox span{font-size:11px;color:rgba(247,243,234,.58);text-transform:none;letter-spacing:0;font-weight:700}
        .status{font-size:13px;color:#9ee8c9}.error{font-size:13px;color:#ff9aa8}
        .parts{display:flex;gap:8px;flex-wrap:wrap}.part{border:1px solid rgba(255,255,255,.14);background:#11151f}.part.active{background:#e3344f}
        .locks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .lockbox{border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);border-radius:8px;padding:11px;display:grid;gap:8px}
        .lockbox h3{margin:0;font-size:12px;text-transform:uppercase;color:#ffb3bd}
        .promptbox{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);border-radius:8px;padding:12px;display:grid;gap:10px}
        .prompt-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
        .prompt-head h2{margin:0}
        .uploadbox{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);border-radius:8px;padding:12px;display:grid;gap:10px}
        .local-render{border-color:rgba(158,232,201,.24);background:linear-gradient(135deg,rgba(47,119,95,.12),rgba(0,0,0,.16))}
        .hint{font-size:12px;line-height:1.45;color:rgba(247,243,234,.62)}
        .param-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .compact-area{min-height:86px}
        .joblist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .job{border:1px solid rgba(255,255,255,.10);background:#10131b;border-radius:6px;padding:8px 9px;font-size:12px;color:rgba(247,243,234,.70)}
        .job.done{border-color:rgba(158,232,201,.40);color:#9ee8c9}
        .job.rendering{border-color:rgba(227,52,79,.45);color:#ffd6dc}
        .job.error{border-color:rgba(255,154,168,.50);color:#ff9aa8}
        .uploadbox input[type="file"]{padding:9px;background:#0b0f17}
        .frame-select{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .frame-select button{min-height:42px;padding:8px;font-size:12px;background:#11151f;border:1px solid rgba(255,255,255,.13)}
        .frame-select button.active{background:#e3344f;color:#fff}
        .crop-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
        .crop-preview{min-height:180px;border:1px solid rgba(255,255,255,.10);border-radius:8px;background:#0b0f17;display:grid;place-items:center;overflow:hidden}
        .crop-preview img{width:100%;height:100%;object-fit:contain;display:block}
        .crop-preview span{color:rgba(247,243,234,.48);font-size:12px}
        .grid-picker{width:100%;position:relative;line-height:0;background:#0b0f17;border:1px solid rgba(255,255,255,.10);border-radius:8px;overflow:hidden}
        .grid-picker img{width:100%;height:auto;display:block}
        .grid-overlay{position:absolute;inset:0;display:grid}
        .grid-cell{position:relative;border:0;border-radius:0;background:rgba(0,0,0,0);min-height:0;padding:0;color:#fff}
        .grid-cell:hover{background:rgba(227,52,79,.10)}
        .grid-cell.active{background:rgba(227,52,79,.12)}
        .grid-cell.active:after{content:"";position:absolute;inset:var(--trim);border:3px solid #ff334f;box-shadow:0 0 0 1px rgba(0,0,0,.65),0 0 18px rgba(227,52,79,.35);pointer-events:none}
        .grid-cell .badge{position:absolute;top:8px;left:8px;line-height:1;border-radius:999px;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.18);padding:6px 8px;font-size:11px}
        .grid-cell.active .badge{background:#e3344f;color:#fff}
        .lockbox div,.frame{font-size:13px;color:rgba(247,243,234,.76);line-height:1.45}
        .frames{display:grid;gap:8px}.frame{border-left:3px solid #e3344f;background:rgba(255,255,255,.04);padding:10px;border-radius:6px}
        .mono{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.45;max-height:420px;overflow:auto}
        .mono.master{max-height:360px;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:10px;background:#0b0f17}
        @media(max-width:900px){.grid{grid-template-columns:1fr}.row,.locks,.crop-grid,.joblist,.param-grid{grid-template-columns:1fr}.trailer-page{padding:10px}textarea{min-height:260px}.compact-area{min-height:110px}.frame-select{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>

      <div className="wrap">
        <section className="hero">
          <div className="kicker">NeuroCine трейлерная раскадровка</div>
          <h1>Отдельная трейлерная раскадровка</h1>
          <p>Новая рабочая зона: полный план кадров, фиксация актёров, локаций, стиля, голосов и промты для PART-сеток. Старая раскадровка здесь не используется.</p>
          <div className="pills">
            <span className="pill active">режим: трейлер</span>
            <span className="pill">любое число кадров</span>
            <span className="pill">лонг до 10 минут</span>
            <span className="pill">пакеты Grok/Veo</span>
          </div>
          <div className="hero-links">
            <a href="/studio">Меню студии</a>
            <a href="/storyboard">Обычная раскадровка</a>
          </div>
        </section>

        <section className="grid">
          <div className="panel">
            <h2>01 · Настройка сценария</h2>
            <label>Название проекта<input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
            <label>Сценарий<textarea value={script} onChange={(e) => setScript(e.target.value)} /></label>
            <label className="check">
              <input type="checkbox" checked={autoTiming} onChange={(e) => setAutoTiming(e.target.checked)} />
              Авто: ИИ сканирует сценарий и сам раскладывает его на биты
            </label>
            <label>
              <span className="range-head"><span>Длительность</span><strong>{formatDuration(effectiveDuration)}</strong></span>
              <input type="range" min={MIN_TOTAL_DURATION} max={MAX_TOTAL_DURATION} step="1" value={duration} disabled={!autoTiming} onChange={(e) => setDuration(Number(e.target.value))} />
              <div className="quick">
                {QUICK_PRESETS.map((x) => <button key={x.seconds} type="button" disabled={!autoTiming} onClick={() => setDuration(x.seconds)}>{x.label}</button>)}
              </div>
            </label>
            <label>
              <span className="range-head"><span>Секунд на кадр</span><strong>{frameSeconds}с</strong></span>
              <input type="range" min={MIN_FRAME_SECONDS} max={MAX_FRAME_SECONDS} step="1" value={frameSeconds} onChange={(e) => setFrameSeconds(Number(e.target.value))} />
            </label>
            <div className="row">
              {autoTiming ? (
                <div className="metricbox">
                  <span>Авто-кадры</span>
                  <strong>{autoFrames}</strong>
                  <span>расчёт по длительности и секундам на кадр</span>
                </div>
              ) : (
                <label>Кадров вручную<input type="number" min="1" max={maxManualFrames} value={manualFrames} onChange={(e) => setCustomFrameCount(clampNumber(e.target.value, 1, maxManualFrames, manualFrames))} /></label>
              )}
              <label>Формат<select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option></select></label>
            </div>
            <div className="row">
              <label>Модель<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="grok">Grok</option><option value="veo3">Veo 3</option></select></label>
              <label>Размер PART<select value={partSize} onChange={(e) => { setPartSize(Number(e.target.value)); setActivePart(0); }}><option value={4}>4 кадра</option><option value={6}>6 кадров</option><option value={8}>8 кадров</option></select></label>
            </div>
            <label>Стиль<select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}>{Object.entries(STYLE_PRESETS).map(([key, val]) => <option key={key} value={key}>{styleLabelRu(key, val.label)}</option>)}</select></label>
            <div className="buttons">
              <button className="primary" disabled={busy || script.trim().length < 10} onClick={generateTrailer}>{busy ? "Генерация..." : "Сгенерировать JSON"}</button>
              <button disabled={busy || script.trim().length < 10} onClick={buildLocalPreview}>Локальный тест</button>
              <button disabled={!storyboard} onClick={downloadJson}>Скачать JSON</button>
              <button disabled={busy} onClick={saveDraftNow}>Сохранить</button>
              <button disabled={busy} onClick={restoreSavedDraft}>Загрузить</button>
              <button className="danger" disabled={busy} onClick={resetAll}>Очистить всё</button>
              <button className="danger" disabled={busy} onClick={clearSavedDraft}>Удалить сохранённое</button>
            </div>
            <div className="pills">
              <span className="pill active">{expectedFrames} кадров</span>
              <span className="pill">{formatDuration(effectiveDuration)} всего</span>
              <span className="pill">{autoTiming ? "авто" : "ручной"}</span>
              <span className="pill">{parts.length || 0} PART готово</span>
              <span className="pill">{partSize} в PART</span>
              {lastSavedAt ? <span className="pill">сохранено локально</span> : null}
            </div>
            {status && <div className="status">{status}</div>}
            {error && <div className="error">{error}</div>}
          </div>

          <div className="panel">
            <div className="promptbox">
              <div className="prompt-head">
                <h2>00 · Мастер-промт сценария</h2>
                <div className="buttons">
                  <button type="button" onClick={() => setShowMasterPrompt((value) => !value)}>{showMasterPrompt ? "Скрыть" : "Показать"}</button>
                  <button type="button" onClick={copyFullScenarioPrompt}>Копировать</button>
                </div>
              </div>
              {showMasterPrompt ? (
                <div className="mono master">{fullScenarioPrompt}</div>
              ) : (
                <div className="frame">Мастер-промт скрыт. Он нужен только для копирования полного сценария в генератор JSON, это ещё не готовая раскадровка.</div>
              )}
            </div>
            <h2>02 · Структура трейлера</h2>
            {!storyboard ? (
              <div className="frame">Сгенерируй JSON или запусти локальный тест, чтобы проверить любое число кадров, PART-разбивку и лонг-формат.</div>
            ) : (
              <>
                <div className="pills">
                  <span className="pill active">{storyboard.scenes?.length || 0} кадров</span>
                  <span className="pill">{storyboard.total_duration || 0}с</span>
                  <span className="pill">{storyboard.export_meta?.target || target}</span>
                  <span className="pill">{storyboard.export_meta?.local_preview ? "локальный тест" : "AI-раскадровка"}</span>
                </div>
                <div className="locks">
                  <div className="lockbox"><h3>Фиксация актёров</h3>{(storyboard.cast_lock || []).map((x, i) => <div key={i}>{lockLine(x, `Актёр ${i + 1}`)}</div>)}</div>
                  <div className="lockbox"><h3>Фиксация локации</h3><div>{Object.entries(storyboard.location_lock || {}).map(([k, v]) => v ? `${k}: ${v}` : "").filter(Boolean).join("; ") || "Локация не задана"}</div></div>
                  <div className="lockbox"><h3>Фиксация голосов</h3>{(storyboard.voice_lock || []).map((x, i) => <div key={i}>{lockLine(x, `Голос ${i + 1}`)}</div>)}</div>
                  <div className="lockbox"><h3>Непрерывность PART</h3><div>{storyboard.grid_continuity || "Непрерывность не задана"}</div></div>
                </div>

                <div>
                  <h2>03 · PART-сетки</h2>
                  <div className="parts">
                    {parts.map((part, i) => (
                      <button key={i} className={`part${safePart === i ? " active" : ""}`} onClick={() => { setActivePart(i); setSelectedFrameIndex(0); setCroppedFrame(""); }}>
                        PART {i + 1} · {frameLabel(part[0], 0)}-{frameLabel(part[part.length - 1], 0)} · {part.length} кадр.
                      </button>
                    ))}
                  </div>
                </div>

                <div className="promptbox">
                  <div className="prompt-head">
                    <h2>04 · Промт PART-сетки</h2>
                    <div className="buttons">
                      <button disabled={!selectedPrompt} onClick={copyPrompt}>Копировать PART</button>
                      <button className="primary" disabled={!flowGrokFixedPrompt} onClick={copyFlowGrokFixedPrompt}>Фикс Flow/Grok</button>
                    </div>
                  </div>
                  <div className="pills">
                    <span className="pill active">{currentGridLayout.cols}×{currentGridLayout.rows} сетка</span>
                    <span className="pill">{partScenes.length} кадров в PART</span>
                    <span className="pill">до {partSize} в PART</span>
                    <span className="pill">фикс непрерывности готов</span>
                  </div>
                  <div className="mono">{selectedPrompt || "Сначала создай или выбери PART."}</div>
                </div>

                <div className="uploadbox local-render">
                  <div className="prompt-head">
                    <h2>05 · Авто-генерация на локальном ПК</h2>
                    <div className="buttons">
                      <button disabled={localRenderBusy} onClick={checkLocalRenderWorker}>Проверить ПК</button>
                      <button className="primary" disabled={localRenderBusy || !storyboard || !partScenes.length} onClick={generateCurrentPartOnLocalPc}>
                        {localRenderBusy ? "Генерация..." : "Сгенерировать PART"}
                      </button>
                      <button disabled={localRenderBusy || !storyboard || !parts.length} onClick={generateAllPartsOnLocalPc}>Авто все PART</button>
                      <button disabled={localRenderBusy || !storyboard || !partScenes.length} onClick={queueCurrentPartForLocalAgent}>В очередь PART</button>
                      <button disabled={localRenderBusy || !storyboard || !parts.length} onClick={queueAllPartsForLocalAgent}>В очередь всё</button>
                      <button disabled={!localAgentCommand} onClick={copyLocalAgentCommand}>Команда агента</button>
                    </div>
                  </div>
                  <div className="row">
                    <label>Адрес локального генератора<input value={localWorkerUrl} onChange={(e) => setLocalWorkerUrl(e.target.value)} placeholder={DEFAULT_LOCAL_WORKER_URL} /></label>
                    <label>Движок<select value={localRenderProvider} onChange={(e) => changeLocalRenderProvider(e.target.value)}>
                      <option value="comfyui">ComfyUI API</option>
                      <option value="automatic1111">Automatic1111 / Forge API</option>
                      <option value="neurocine-worker">NeuroCine local worker</option>
                    </select></label>
                  </div>
                  <div className="row">
                    <label>Пресет качества<select value={localModelPreset} onChange={(e) => applyLocalModelPreset(e.target.value)}>
                      {Object.entries(LOCAL_MODEL_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
                    </select></label>
                    <label>Checkpoint / модель<input value={localCheckpoint} onChange={(e) => setLocalCheckpoint(e.target.value)} placeholder="имя файла из ComfyUI/models/checkpoints" /></label>
                  </div>
                  <div className="param-grid">
                    <label>Ширина<input type="number" min="512" max="1536" value={localImageWidth} onChange={(e) => setLocalImageWidth(clampNumber(e.target.value, 512, 1536, localImageWidth))} /></label>
                    <label>Высота<input type="number" min="768" max="2048" value={localImageHeight} onChange={(e) => setLocalImageHeight(clampNumber(e.target.value, 768, 2048, localImageHeight))} /></label>
                    <label>Steps<input type="number" min="4" max="60" value={localSteps} onChange={(e) => setLocalSteps(clampNumber(e.target.value, 4, 60, localSteps))} /></label>
                    <label>CFG<input type="number" min="1" max="12" step="0.5" value={localCfg} onChange={(e) => setLocalCfg(clampNumber(e.target.value, 1, 12, localCfg))} /></label>
                  </div>
                  <label>LoRA, по одной строке<textarea className="compact-area" value={localLoras} onChange={(e) => setLocalLoras(e.target.value)} placeholder={"cinematic_horror_lora.safetensors:0.65\nsame_actor_face_lora.safetensors:0.55"} /></label>
                  <label>ComfyUI workflow template для FLUX/кастомных графов<textarea className="compact-area" value={localWorkflowTemplate} onChange={(e) => setLocalWorkflowTemplate(e.target.value)} placeholder={'Опционально. Вставь workflow JSON и используй плейсхолдеры "__PROMPT__", "__NEGATIVE__", "__WIDTH__", "__HEIGHT__", "__STEPS__", "__CFG__", "__SEED__", "__CHECKPOINT__".'} /></label>
                  <label>Токен локального агента<input value={localAgentToken} onChange={(e) => setLocalAgentToken(e.target.value)} placeholder="будет создан автоматически" /></label>
                  <div className="pills">
                    <span className="pill active">Вывод: {localImageWidth}×{localImageHeight}</span>
                    <span className="pill">{activeLocalModelPreset.label}</span>
                    <span className="pill">1 PART = 1 картинка-сетка</span>
                    <span className="pill">авто-вставка в блок</span>
                    <span className="pill">ComfyUI-ready</span>
                    <span className="pill">анимация следующим слоем</span>
                  </div>
                  <div className="hint">{activeLocalModelPreset.note}</div>
                  <div className="mono master">{localAgentCommand}</div>
                  <div className="joblist">
                    {parts.length ? parts.map((part, i) => {
                      const job = localRenderJobs[i] || {};
                      const queueJob = localQueueJobs[i] || {};
                      return (
                        <span key={i} className={`job ${job.status || queueJob.status || ""}`}>
                          PART {i + 1}: {job.message || (queueJob.status ? `очередь: ${queueJob.status}` : gridUploads[i] ? "сетка загружена" : `${part.length} кадр. ждёт`)}
                        </span>
                      );
                    }) : <span className="job">Сначала создай JSON раскадровки</span>}
                  </div>
                  <div className="hint">Кнопки “Сгенерировать PART/Авто все PART” работают, когда сайт и генератор доступны друг другу напрямую. Кнопки “В очередь” нужны для телефона/удалённого сайта: сайт создаёт задания, а Local Agent на ПК забирает их и возвращает картинки.</div>
                </div>

                <div className="uploadbox">
                  <div className="prompt-head">
                    <h2>06 · Загрузка сетки и кроп</h2>
                    <button disabled={!currentGridUpload || !selectedScene} onClick={cropSelectedFrame}>Обрезать выбранный кадр</button>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => uploadPartGrid(e.target.files?.[0])} />
                  <label>
                    <span className="range-head"><span>Обрезка рамки</span><strong>{cropInset}%</strong></span>
                    <input type="range" min="0" max="12" step="1" value={cropInset} onChange={(e) => setCropInset(Number(e.target.value))} />
                  </label>
                  <div className="pills">
                    <span className="pill active">Вывод: 1080×1920</span>
                    <span className="pill">Чистый 9:16</span>
                    <span className="pill">Заполнение кадра</span>
                  </div>
                  <div className="frame-select">
                    {partScenes.map((scene, i) => (
                      <button key={scene.id || i} className={safeFrameIndex === i ? "active" : ""} onClick={() => selectGridFrame(i)}>
                        {frameLabel(scene, i)}
                      </button>
                    ))}
                  </div>
                  <div className="crop-grid">
                    {currentGridUpload ? (
                      <div className="grid-picker">
                        <img src={currentGridUpload} alt={`PART ${safePart + 1} загруженная сетка`} />
                        <div
                          className="grid-overlay"
                          style={{
                            gridTemplateColumns: `repeat(${currentGridLayout.cols}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${currentGridLayout.rows}, minmax(0, 1fr))`,
                          }}
                        >
                          {partScenes.map((scene, i) => (
                            <button
                              key={scene.id || i}
                              type="button"
                              className={`grid-cell${safeFrameIndex === i ? " active" : ""}`}
                              style={{ "--trim": `${cropInset}%` }}
                              onClick={() => selectGridFrame(i)}
                              aria-label={`Выбрать ${frameLabel(scene, i)}`}
                            >
                              <span className="badge">{frameLabel(scene, i)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="crop-preview"><span>Загрузи сюда сгенерированную PART-сетку</span></div>
                    )}
                    <div className="crop-preview">
                      {croppedFrame ? <img src={croppedFrame} alt={`Кроп ${frameLabel(selectedScene, safeFrameIndex)}`} /> : <span>Здесь появится кроп выбранного кадра</span>}
                    </div>
                  </div>
                  <div className="buttons">
                    <button disabled={!croppedFrame} onClick={downloadCroppedFrame}>Скачать кроп 9:16</button>
                    <button disabled={!selectedFrameVideoPrompt} onClick={copySelectedVideoPrompt}>Копировать видеопромт</button>
                  </div>
                  {selectedScene && <div className="mono">{selectedFrameVideoPrompt || "Для этого кадра нет видеопромта."}</div>}
                </div>

                <div className="frames">
                  {partScenes.map((scene, i) => (
                    <div className="frame" key={scene.id || i}>
                      <strong>{frameLabel(scene, i)} · {scene.shot_role || scene.beat_type || "кадр"}</strong><br />
                      Источник: {scene.script_line_ru || scene.vo_ru || scene.description_ru}<br />
                      Визуал: {scene.visual_beat_ru || scene.description_ru}<br />
                      {Array.isArray(scene.dialogue) && scene.dialogue.length > 0 ? <>Диалог: {scene.dialogue.map(formatDialogueLine).join(" / ")}<br /></> : null}
                      SFX: {scene.sfx || ""}
                    </div>
                  ))}
                </div>

              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
