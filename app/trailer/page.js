"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { STYLE_PRESETS, getStyleProfile } from "../../engine/directorEngine_v4";
import { splitScenesIntoParts, buildFlowCompactPartPrompt } from "../../engine/autoChainEngine";
import { exactTextLine, hasCyrillic, promptListEnglish, toPromptEnglish } from "../../engine/promptLanguage";

const DEFAULT_SCRIPT = "";

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
const TRAILER_AGENT_TOKEN_KEY = "neurocine.trailerLocalAgentToken.v1";
const MAX_CHARACTER_REFS = 5;
const MAX_LOCATION_REFS = 3;
const REF_JOB_BASE = -1000;
const REF_JOB_KIND_OFFSETS = { character: 0, location: 100, style: 200 };
const LOCAL_WORKER_URLS = {
  comfyui: "http://127.0.0.1:8188",
  automatic1111: "http://127.0.0.1:7860",
  "neurocine-worker": "http://127.0.0.1:8787",
};
const DEFAULT_LOCAL_RENDER_PROVIDER = "comfyui";
const DEFAULT_LOCAL_WORKER_URL = LOCAL_WORKER_URLS[DEFAULT_LOCAL_RENDER_PROVIDER];
const PC_COMMANDS = [
  { id: "status", label: "Проверить ПК", hint: "агент и ComfyUI" },
  { id: "production_check", label: "Проверить production", hint: "модели и ноды" },
  { id: "install_production", label: "Установить production", hint: "скачать модели/nodes" },
  { id: "start_comfyui", label: "Запустить ComfyUI", hint: "если API упал" },
  { id: "restart_comfyui", label: "Перезапустить ComfyUI", hint: "остановить и поднять" },
  { id: "restart_agent", label: "Перезапустить агента", hint: "новый процесс агента" },
  { id: "sleep_pc", label: "Сон ПК", hint: "усыпить Windows" },
  { id: "reboot_pc", label: "Перезагрузить ПК", hint: "Windows reboot" },
];
const LOCAL_IMAGE_WIDTH = 936;
const LOCAL_IMAGE_HEIGHT = 1664;
const LOCAL_IMAGE_NEGATIVE = [
  "bad hands",
  "bad anatomy",
  "deformed hands",
  "deformed fingers",
  "extra fingers",
  "missing fingers",
  "bad face",
  "face asymmetry",
  "eyes asymmetry",
  "deformed eyes",
  "deformed mouth",
  "open mouth",
  "ugly",
  "deformed",
  "low quality",
  "normal quality",
  "lowres",
  "low detail",
  "blurry",
  "soft focus",
  "mushy texture",
  "smeared skin",
  "washed out",
  "flat contrast",
  "jpeg artifacts",
  "overprocessed",
  "oversmoothed skin",
  "airbrushed skin",
  "beauty retouching",
  "fashion editorial",
  "glossy glamour lighting",
  "duplicate people",
  "extra characters",
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
  "random hooded robe",
  "random cloak",
  "cult robe",
  "anonymous hooded figure",
  "doctors",
  "nurses",
  "hospital",
  "laboratory",
  "medical corridor",
  "surgical mask",
  "hazmat suit",
  "random window",
  "cars",
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
const SCRIPT_LITERAL_GATE = [
  "SCRIPT-LITERAL OBJECT GATE:",
  "Render only people, objects, wardrobe, locations and physical effects named by the current source line, current visual beat or allowed lists.",
  "Do not add doctors, nurses, medical staff, hospital rooms, clinics, laboratories, hazmat suits, surgical masks, medical gloves, random windows, cars, extra men, extra women or unrelated rooms unless the current source line explicitly names them.",
  "Do not add hooded strangers, cult robes, anonymous masked people, extra killers or genre costumes unless the current source line explicitly names them.",
  "If a style reference, location reference or character reference contains an unscripted object, ignore that object for this frame.",
  "Earlier and later script events are forbidden in the current frame."
].join(" ");
const LOCAL_MODEL_PRESETS = {
  sdxlProductionSlow: {
    label: "RealVisXL slow production максимум",
    family: "sdxl",
    checkpoint: "RealVisXL_V5.0_fp16.safetensors",
    workflowMode: "sdxl_hires",
    productionQuality: "slow_production",
    lockDimensions: true,
    lockQuality: true,
    referenceMode: "ipadapter",
    ipadapterModel: "ip-adapter-plus-face_sdxl_vit-h.safetensors",
    clipVisionModel: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
    ipadapterWeight: 0.78,
    ipadapterStartAt: 0,
    ipadapterEndAt: 0.9,
    ipadapterWeightType: "linear",
    ipadapterEmbedsScaling: "K+V",
    pixelUpscale: true,
    upscaleModel: "RealESRGAN_x4plus.pth",
    gridOutputFormat: "jpeg",
    gridJpegQuality: 97,
    width: 1080,
    height: 1920,
    baseWidth: 1024,
    baseHeight: 1824,
    steps: 52,
    hiresSteps: 26,
    hiresDenoise: 0.18,
    cfg: 4.2,
    sampler: "dpmpp_sde",
    a1111Sampler: "DPM++ SDE Karras",
    scheduler: "karras",
    hiresSampler: "dpmpp_sde",
    hiresScheduler: "karras",
    latentUpscaleMethod: "bislerp",
    finalDownscaleMethod: "lanczos",
    note: "Максимальный production режим для RTX 3060 12GB: высокий base-render 1024×1824, больше steps, низкий hires denoise, IPAdapter refs и RealESRGAN. Медленно, но меньше мыла и дрейфа.",
  },
  sdxlProduction: {
    label: "RealVisXL production hires реализм",
    family: "sdxl",
    checkpoint: "RealVisXL_V5.0_fp16.safetensors",
    workflowMode: "sdxl_hires",
    lockDimensions: true,
    lockQuality: true,
    referenceMode: "ipadapter",
    ipadapterModel: "ip-adapter-plus-face_sdxl_vit-h.safetensors",
    clipVisionModel: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
    ipadapterWeight: 0.72,
    ipadapterEndAt: 0.82,
    pixelUpscale: true,
    upscaleModel: "RealESRGAN_x4plus.pth",
    gridOutputFormat: "jpeg",
    gridJpegQuality: 96,
    width: 1080,
    height: 1920,
    baseWidth: 960,
    baseHeight: 1704,
    steps: 42,
    hiresSteps: 20,
    hiresDenoise: 0.22,
    cfg: 4.6,
    sampler: "dpmpp_sde",
    a1111Sampler: "DPM++ SDE Karras",
    scheduler: "karras",
    note: "Production photoreal: RealVisXL + SDXL hires + IPAdapter refs + RealESRGAN финальный upscale/downsample. Медленнее, но это уже не простой txt2img.",
  },
  sdxlCinema: {
    label: "Juggernaut XL cinema realism",
    family: "sdxl",
    checkpoint: "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors",
    workflowMode: "sdxl_hires",
    lockDimensions: true,
    lockQuality: true,
    referenceMode: "ipadapter",
    ipadapterModel: "ip-adapter-plus-face_sdxl_vit-h.safetensors",
    clipVisionModel: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
    ipadapterWeight: 0.68,
    ipadapterEndAt: 0.78,
    pixelUpscale: true,
    upscaleModel: "RealESRGAN_x4plus.pth",
    gridOutputFormat: "jpeg",
    gridJpegQuality: 96,
    width: 1080,
    height: 1920,
    baseWidth: 896,
    baseHeight: 1592,
    steps: 36,
    hiresSteps: 16,
    hiresDenoise: 0.28,
    cfg: 4.8,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Cinematic photoreal pipeline с IPAdapter refs и RealESRGAN, если Juggernaut XL установлен в checkpoints.",
  },
  sdxlBaseDebug: {
    label: "SDXL base debug, не realism",
    family: "sdxl",
    checkpoint: "sd_xl_base_1.0.safetensors",
    width: 936,
    height: 1664,
    steps: 24,
    cfg: 6,
    sampler: "dpmpp_2m",
    a1111Sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    note: "Только технический тест. Для реализма и постоянных персонажей не использовать.",
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
    note: "Быстро проверить логику кадров перед дорогим качеством. Не подходит для финального реализма.",
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
const DEFAULT_LOCAL_MODEL_PRESET = "sdxlProductionSlow";

function emptyProductionCharacter(i = 0) {
  return {
    id: `CHAR_${String(i + 1).padStart(2, "0")}`,
    name: "",
    role: "",
    identity: "",
    wardrobe: "",
    negative: "no different actor, no face drift, no age drift, no wardrobe drift unless the script explicitly changes it",
    reference: "",
    referenceName: "",
    referencePrompt: "",
    sourceContext: "",
  };
}

function emptyProductionLocation(i = 0) {
  return {
    id: `LOC_${String(i + 1).padStart(2, "0")}`,
    name: "",
    description: "",
    materials: "",
    lighting: "",
    negative: "no unrelated location, no new room, no new era, no redesign unless the script explicitly changes it",
    reference: "",
    referenceName: "",
    referencePrompt: "",
    sourceContext: "",
  };
}

function createDefaultProductionBible() {
  return {
    enabled: true,
    autoGenerated: false,
    scriptFingerprint: "",
    characters: Array.from({ length: MAX_CHARACTER_REFS }, (_, i) => emptyProductionCharacter(i)),
    locations: Array.from({ length: MAX_LOCATION_REFS }, (_, i) => emptyProductionLocation(i)),
    style: {
      lock: "",
      negative: "no genre drift, no palette drift, no glamour lighting, no plastic skin, no CGI, no illustration, no unrelated props from style text",
      reference: "",
      referenceName: "",
    },
  };
}

function productionScriptFingerprint(script = "") {
  const normalized = normalizeTextKey(script)
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? String(stableSeedFromText(normalized)) : "";
}

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

function buildTrailerBeatPlan(lines = [], totalFrames = 1) {
  const cleanLines = lines.map(cleanText).filter(Boolean);
  if (!cleanLines.length) return ["Trailer beat"];

  const plan = [];
  const max = Math.max(1, Math.round(Number(totalFrames) || 1));

  const openingCount = Math.min(max, 4, cleanLines.length);
  for (let i = 0; i < openingCount; i += 1) plan.push(cleanLines[i]);

  const remainingSlots = max - plan.length;
  const remainingLines = cleanLines.slice(openingCount);
  if (remainingSlots > 0 && remainingLines.length > 0) {
    if (remainingSlots >= remainingLines.length) {
      plan.push(...remainingLines);
    } else {
      const picked = new Set();
      for (let slot = 0; slot < remainingSlots; slot += 1) {
        const idx = remainingSlots === 1
          ? remainingLines.length - 1
          : Math.round((slot / (remainingSlots - 1)) * (remainingLines.length - 1));
        if (!picked.has(idx)) {
          plan.push(remainingLines[idx]);
          picked.add(idx);
        }
      }
      for (let i = 0; plan.length < max && i < remainingLines.length; i += 1) {
        if (!picked.has(i)) plan.push(remainingLines[i]);
      }
    }
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
  const preferredFrames = Math.max(1, Math.round(safeDuration / safeFrameSeconds));
  const minFrames = Math.max(1, Math.ceil(safeDuration / MAX_FRAME_SECONDS));
  const maxFrames = Math.max(minFrames, Math.floor(safeDuration / MIN_FRAME_SECONDS));
  return clampNumber(preferredFrames, minFrames, maxFrames, preferredFrames);
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

const RU_TRAILER_VO_WORDS_PER_SECOND = 1.85;

function countScriptWords(text = "") {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function voiceWordTarget(durationSec = 90) {
  const duration = clampNumber(durationSec, 30, MAX_TOTAL_DURATION, 90);
  const target = Math.round(duration * RU_TRAILER_VO_WORDS_PER_SECOND);
  return {
    min: Math.max(40, Math.round(target * 0.88)),
    target,
    max: Math.round(target * 1.08),
  };
}

function scriptVoiceTimingInfo(script = "", durationSec = 90) {
  const words = countScriptWords(script);
  const target = voiceWordTarget(durationSec);
  const estimatedSeconds = words ? Math.round(words / RU_TRAILER_VO_WORDS_PER_SECOND) : 0;
  const status = !words
    ? "empty"
    : words < target.min
      ? "short"
      : words > target.max
        ? "long"
        : "ok";
  return { words, target, estimatedSeconds, status };
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function referenceLabelFromFile(name = "", fallback = "reference") {
  const base = String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base || fallback;
}

function normalizeTextKey(value = "") {
  return cleanText(value).toLowerCase().replace(/ё/g, "е");
}

function promptEnglishSafe(value = "", fallback = "scripted detail") {
  const raw = cleanText(value);
  if (!raw) return fallback;
  const converted = toPromptEnglish(raw, { fallback, residualFallback: "scripted detail" });
  const weakTokens = converted.match(/\b(scripted detail|literal scripted event|current scripted beat)\b/gi) || [];
  if (hasCyrillic(raw) && (weakTokens.length > 2 || converted.length < 12)) return fallback;
  return converted || fallback;
}

function roughScriptBeatEnglish(value = "", bible = null, fallback = "literal scripted event") {
  const raw = cleanText(value);
  if (!raw) return fallback;
  const source = normalizeTextKey(raw);
  const details = [];
  const add = (phrase) => {
    const clean = cleanText(phrase);
    if (clean && !details.includes(clean)) details.push(clean);
  };

  const normalizedBible = bible ? normalizeProductionBible(bible) : null;
  filledProductionCharacters(normalizedBible || {}).forEach((item) => {
    const name = normalizeTextKey(item.name || "");
    if (name && source.includes(name)) {
      add(`${item.id || "CHAR"} ${promptEnglishSafe(item.role || "recurring scripted character", "recurring scripted character")}`);
    }
  });
  filledProductionLocations(normalizedBible || {}).forEach((item) => {
    const name = normalizeTextKey(item.name || "");
    if (name && source.includes(name)) add(`${item.id || "LOC"} ${promptEnglishSafe(item.description || item.name || "scripted location", "scripted location")}`);
  });

  const phraseMap = [
    [/подъезд/, "dim apartment stairwell"],
    [/метель|снег|сугроб/, "snowstorm and snowdrift exactly as scripted"],
    [/лесн(ая|ую)\s+дорог/, "empty forest road at night"],
    [/волчонок|волчонк/, "small gray wolf cub"],
    [/ветеринар|лада/, "young rural veterinarian Lada"],
    [/сельск.*клиник|ветклиник|клиник/, "small rural veterinary clinic"],
    [/металлическ.*стол/, "metal veterinary treatment table"],
    [/полотенц/, "warm towels"],
    [/кислород/, "oxygen support"],
    [/игл/, "needle"],
    [/монитор/, "medical monitor"],
    [/забор/, "fence outside the clinic"],
    [/волки|стая/, "adult wolves outside the fence only when scripted"],
    [/коммуналк/, "communal apartment"],
    [/коридор/, "narrow corridor"],
    [/ванн/, "old bathroom"],
    [/общ(ая|ей)\s+кухн|кухн/, "shared kitchen"],
    [/двор/, "inner courtyard"],
    [/бойн/, "abandoned slaughterhouse"],
    [/цех/, "old industrial processing hall"],
    [/холодильн/, "cold storage room"],
    [/лифт/, "elevator"],
    [/офис/, "office"],
    [/пикап|фара/, "pickup truck headlight"],
    [/вывеск/, "rusty sign"],
    [/калитк|ворот/, "rusty gate"],
    [/двер/, "doorway"],
    [/ступеньк|лестниц/, "stairs"],
    [/мигающ|дрожит|ламп/, "flickering practical lamp"],
    [/женщин.*разрезан|разрезан.*женщин/, "woman lying on the stairs with a severe neck wound"],
    [/кров/, "blood on the floor or wall exactly as scripted"],
    [/молок/, "milk bag"],
    [/ботинок|коврик/, "shoe and doormat"],
    [/ч[её]рн(ый|ого)\s+меш/, "black plastic bag"],
    [/мокр(ый|ого)\s+след/, "wet trail"],
    [/нож/, "knife"],
    [/молот/, "hammer"],
    [/пил|бензопил/, "saw or chainsaw only if this source line names it"],
    [/провод.*шею|шею.*провод/, "electric cord pulled around the old man's neck"],
    [/стул/, "overturned chair"],
    [/чашк/, "broken cup"],
    [/радио/, "small radio"],
    [/ключ|очки/, "keys and eyeglasses on the wall"],
    [/полиэтилен|тазик/, "plastic sheeting and basins"],
    [/кипяток|пар/, "boiling water steam"],
    [/обожж/, "burned face"],
    [/маск/, "leather mask only if named by this source line"],
    [/крюк|рельс|цеп/, "hooks, rails and chains"],
    [/фонар/, "flashlight beam"],
    [/инструмент/, "butcher tools"],
    [/сапог|след/, "fresh boot prints"],
  ];
  phraseMap.forEach(([re, phrase]) => {
    if (re.test(source)) add(phrase);
  });

  if (/говорит|сказал|сказала|шепчет|«|"/i.test(raw)) add("dialogue beat, keep exact Russian dialogue only if spoken or visible");
  if (/перешагивает/i.test(source)) add("calmly steps over the body");
  if (/вытирает/i.test(source)) add("wipes shoe on the mat");
  if (/тащит/i.test(source)) add("drags the object named by the source line");
  if (/режет/i.test(source)) add("cuts on the board exactly as scripted");
  if (/пятится/i.test(source)) add("backs away in fear");
  if (/открывает/i.test(source)) add("opens the scripted door");
  if (/бросает/i.test(source)) add("throws the scripted object");
  if (/врывается|д[её]ргает/i.test(source)) add("runs to the locked entrance door");
  if (/опускается/i.test(source)) add("weapon lowers into frame only as scripted");

  if (!details.length) return promptEnglishSafe(raw, fallback);
  return `Literal scripted shot only: ${details.join(", ")}. Do not add story events, costumes, props, rooms or characters not present in this source line.`;
}

function scriptBeatPromptEnglish(value = "", bible = null, fallback = "literal scripted event") {
  const converted = promptEnglishSafe(value, fallback);
  if (!hasCyrillic(value)) return converted;
  if (!/\b(scripted detail|literal scripted event|current scripted beat)\b/i.test(converted)) return converted;
  return roughScriptBeatEnglish(value, bible, fallback);
}

function isWeakPromptText(value = "") {
  return /\b(scripted detail|literal scripted event|current scripted beat|literal storyboard shot)\b/i.test(cleanText(value));
}

function anchorSearchText(scene = {}) {
  return normalizeTextKey([
    scene.script_line_ru,
    scene.vo_ru,
    scene.description_ru,
    scene.visual_beat_ru,
    scene.visual_beat_en,
    scene.image_prompt_en,
    scene.allowed_characters,
    scene.allowed_location,
  ].filter(Boolean).join(" "));
}

function itemMentionScore(item = {}, haystack = "") {
  const source = normalizeTextKey(haystack);
  if (!source) return 0;
  const itemText = normalizeTextKey(`${item.name || ""} ${item.role || ""} ${item.identity || ""}`);
  if (/женщина на лестнице|первая жертва|stairwell victim|opening stairwell victim/.test(itemText) && /женщин|ступень|лестниц|горл|кров/.test(source)) return 8;
  if (/старик|elderly|old male/.test(itemText) && /старик|пожил|телефон|провод|шею/.test(source)) return 8;
  if (/геннадий|gennady/.test(itemText) && /геннадий|сосед|молок|мешок|молоток/.test(source)) return 8;
  if (/лена|lena/.test(itemText) && /лена|соседка|кружк|кипяток|босые|дверь/.test(source)) return 8;
  if (/лада|lada|ветеринар|veterinarian/.test(itemText) && /лада|ветеринар|клиник|полотенц|улыба|дверь|прижимает/.test(source)) return 8;
  if (/волчонок|волчонк|wolf cub/.test(itemText) && /волчон|серый комок|шерст|дыхание|сердце|голову|сугроб/.test(source)) return 8;
  if (/мясник|butcher|человек в маске|masked/.test(itemText) && scriptLineAllowsThreat(source) && /мясник|человек в маске|маск|фартук|бензопил/.test(source)) return 8;
  const candidates = [
    [item.id, 6],
    [item.name, 8],
    [item.role, 3],
    [item.description, 2],
  ];
  return candidates.reduce((score, [value, weight]) => {
    const key = normalizeTextKey(value || "");
    if (!key || key.length < 3) return score;
    return source.includes(key) ? Math.max(score, weight) : score;
  }, 0);
}

function characterAllowedInFrame(item = {}, allowedCharactersText = "", frameText = "") {
  const allowed = normalizeTextKey(allowedCharactersText);
  if (!allowed) return false;
  const itemText = normalizeTextKey(`${item.id || ""} ${item.name || ""} ${item.role || ""} ${item.identity || ""}`);
  const directKeys = [item.id, item.name, item.role]
    .map((value) => normalizeTextKey(value || ""))
    .filter((value) => value.length >= 3);
  if (directKeys.some((key) => allowed.includes(key))) return true;
  if (/сотрудник|employee/.test(allowed) && /сотрудник|employee/.test(itemText)) return true;
  if (/сосед|neighbor/.test(allowed) && /сосед|neighbor|геннадий|лена|старик/.test(itemText)) return true;
  if (/жертва|victim|женщина/.test(allowed) && /жертва|victim|женщина/.test(itemText)) return true;
  if (/мясник|butcher|masked|маск|антагонист/.test(allowed) && /мясник|butcher|masked|маск|антагонист/.test(itemText)) return true;
  return itemMentionScore(item, `${allowed} ${frameText}`) > 0 && itemMentionScore(item, allowed) > 0;
}

function referenceAnchorsForFrame(scene = {}, bible = {}) {
  const normalized = normalizeProductionBible(bible);
  const text = anchorSearchText(scene);
  const allowedCharactersText = deriveFrameCharactersFromScript([
    scene.script_line_ru,
    scene.visual_beat_ru,
    scene.visual_beat_en,
    scene.description_ru,
  ].filter(Boolean).join(" "), promptList(scene.allowed_characters), normalized);
  const characters = filledProductionCharacters(normalized)
    .filter((item) => item.reference)
    .filter((item) => characterAllowedInFrame(item, allowedCharactersText, text))
    .map((item) => ({ item, score: itemMentionScore(item, text) }))
    .filter((entry) => entry.score > 0 || promptList(allowedCharactersText))
    .sort((a, b) => b.score - a.score);
  const locations = filledProductionLocations(normalized)
    .filter((item) => item.reference)
    .map((item) => ({ item, score: itemMentionScore(item, text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  const styleAnchor = normalized.style?.reference ? {
    kind: "style",
    id: "STYLE",
    name: normalized.style?.label || normalized.style?.preset || "style reference",
    reference_name: normalized.style?.referenceName || "",
    image_data: normalized.style.reference,
    denoise: 0.58,
    ipadapter_weight: 0.26,
    ipadapter_end_at: 0.52,
    ipadapter_start_at: 0,
  } : null;

  const anchors = [];
  if (styleAnchor) anchors.push(styleAnchor);
  if (locations.length) {
    const item = locations[0].item;
    anchors.push({
      kind: "location",
      id: item.id,
      name: item.name || item.id,
      reference_name: item.referenceName || "",
      image_data: item.reference,
      denoise: characters.length ? 0.62 : 0.58,
      ipadapter_weight: characters.length ? 0.46 : 0.58,
      ipadapter_end_at: characters.length ? 0.66 : 0.78,
      ipadapter_start_at: 0,
    });
  }
  characters.slice(0, 2).forEach(({ item }, index) => {
    anchors.push({
      kind: "character",
      id: item.id,
      name: item.name || item.role || item.id,
      reference_name: item.referenceName || "",
      image_data: item.reference,
      denoise: 0.74,
      ipadapter_weight: index === 0 ? 0.86 : 0.68,
      ipadapter_end_at: index === 0 ? 0.92 : 0.82,
      ipadapter_start_at: 0,
    });
  });
  return anchors.slice(0, 3);
}

function referenceAnchorForFrame(scene = {}, bible = {}) {
  const anchors = referenceAnchorsForFrame(scene, bible);
  return anchors.find((item) => item.kind === "character")
    || anchors.find((item) => item.kind === "location")
    || anchors[0]
    || null;
}

function referenceAnchorPromptLine(anchor = null) {
  const anchors = Array.isArray(anchor) ? anchor.filter(Boolean) : (anchor ? [anchor] : []);
  if (!anchors.length) {
    return "No visual reference image is supplied for this frame; obey the production bible and the exact source line.";
  }
  const labels = anchors.map((item) => [item.kind, item.id, promptEnglishSafe(item.name || item.reference_name || item.kind, "locked visual reference")].filter(Boolean).join(" / "));
  return `Visual references are supplied to ComfyUI IPAdapter in layered order: ${labels.join("; ")}. Use character references only for scripted characters in this frame, location references only for compatible spatial design, and style references only for lens/color/texture. Source line and allowed lists still win.`;
}

function referenceJobIndex(kind = "character", index = 0) {
  return REF_JOB_BASE - (REF_JOB_KIND_OFFSETS[kind] || 0) - Math.max(0, Number(index) || 0);
}

function decodeReferenceJobIndex(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw > REF_JOB_BASE) return null;
  const n = Math.abs(raw - REF_JOB_BASE);
  if (n >= REF_JOB_KIND_OFFSETS.style) return { kind: "style", index: 0 };
  if (n >= REF_JOB_KIND_OFFSETS.location) return { kind: "location", index: n - REF_JOB_KIND_OFFSETS.location };
  return { kind: "character", index: n };
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

function formatCastLock(storyboard = {}) {
  const sourceCast = Array.isArray(storyboard?.cast_lock) && storyboard.cast_lock.length
    ? storyboard.cast_lock
    : Array.isArray(storyboard?.character_lock)
      ? storyboard.character_lock.map((character, i) => ({
          id: character.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
          role: character.role || character.name || character.character || `Character ${i + 1}`,
          visual_identity: [character.description, character.face_features, character.hair, character.physical_condition].filter(Boolean).join("; "),
          wardrobe: character.wardrobe || character.clothing || "",
          forbidden_changes: character.forbidden_changes || "no different actor, no age drift, no face drift, no wardrobe drift unless the script explicitly changes it",
        }))
      : [];
  return sourceCast.map((item, i) => {
    if (!item || typeof item !== "object") return "";
    const id = cleanText(item.id || `CHAR_${String(i + 1).padStart(2, "0")}`);
    const role = toPromptEnglish(item.role || item.name || item.character || `Character ${i + 1}`, { fallback: `Character ${i + 1}` });
    const identity = toPromptEnglish(item.visual_identity || item.must_appear_as || item.description || "", { fallback: "same actor identity, face, body type and emotional condition from first appearance" });
    const wardrobe = toPromptEnglish(item.wardrobe || item.clothing || "", { fallback: "same wardrobe from first appearance" });
    const forbidden = toPromptEnglish(item.forbidden_changes || "no actor redesign, no wardrobe drift, no age drift", { fallback: "no actor redesign, no wardrobe drift, no age drift" });
    return `${id} / ${role}: ${[identity, wardrobe ? `wardrobe: ${wardrobe}` : "", `forbidden: ${forbidden}`].filter(Boolean).join("; ")}`;
  }).filter(Boolean).join("\n");
}

function formatLocationLock(storyboard = {}) {
  const location = storyboard?.location_lock;
  if (!location || typeof location !== "object") {
    return toPromptEnglish(storyboard?.world_lock || "same locked film location, materials, lighting and spatial logic", { fallback: "same locked film location, materials, lighting and spatial logic" });
  }
  return [
    toPromptEnglish(location.main || location.main_location || location.location || "", { fallback: "same locked location" }),
    location.materials ? `materials: ${toPromptEnglish(location.materials, { fallback: "same materials" })}` : "",
    location.lighting ? `lighting: ${toPromptEnglish(location.lighting, { fallback: "same lighting" })}` : "",
    location.spatial_rules ? `spatial rules: ${toPromptEnglish(location.spatial_rules, { fallback: "same spatial logic" })}` : "",
    location.forbidden ? `forbidden: ${toPromptEnglish(location.forbidden, { fallback: "no unrelated location redesign" })}` : "",
  ].filter(Boolean).map(cleanText).join("; ");
}

function promptList(value = "") {
  return promptListEnglish(value, "");
}

function normalizeForMatch(value = "") {
  return cleanText(value).toLowerCase().replace(/ё/g, "е");
}

function filledProductionCharacters(bible = {}) {
  const chars = Array.isArray(bible?.characters) ? bible.characters : [];
  return chars
    .map((item, i) => ({
      ...emptyProductionCharacter(i),
      ...(item && typeof item === "object" ? item : {}),
      id: item?.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
    }))
    .filter((item) => cleanText(item.name || item.role || item.identity || item.referenceName));
}

function filledProductionLocations(bible = {}) {
  const locations = Array.isArray(bible?.locations) ? bible.locations : [];
  return locations
    .map((item, i) => ({
      ...emptyProductionLocation(i),
      ...(item && typeof item === "object" ? item : {}),
      id: item?.id || `LOC_${String(i + 1).padStart(2, "0")}`,
    }))
    .filter((item) => cleanText(item.name || item.description || item.referenceName));
}

function productionReferenceReadiness(bible = {}) {
  const normalized = normalizeProductionBible(bible);
  const characters = filledProductionCharacters(normalized);
  const locations = filledProductionLocations(normalized);
  const characterReady = characters.filter((item) => item.reference).length;
  const locationReady = locations.filter((item) => item.reference).length;
  const missingCharacters = characters
    .filter((item) => !item.reference)
    .map((item) => cleanText(item.name || item.role || item.id || "CHAR"));
  const missingLocations = locations
    .filter((item) => !item.reference)
    .map((item) => cleanText(item.name || item.description || item.id || "LOC"));
  const styleReady = Boolean(normalized.style?.reference);
  const requiredTotal = characters.length + locations.length;
  const readyTotal = characterReady + locationReady;
  const missingLabels = [
    ...missingCharacters.map((name) => `персонаж: ${name}`),
    ...missingLocations.map((name) => `локация: ${name}`),
  ];
  return {
    requiredTotal,
    readyTotal,
    missingTotal: missingLabels.length,
    charactersTotal: characters.length,
    characterReady,
    locationsTotal: locations.length,
    locationReady,
    styleReady,
    missingLabels,
    ready: requiredTotal === 0 || missingLabels.length === 0,
  };
}

function referenceWaitMessage(readiness = {}) {
  const required = Number(readiness.requiredTotal || 0);
  const ready = Number(readiness.readyTotal || 0);
  if (!required) return "";
  const missing = Array.isArray(readiness.missingLabels) ? readiness.missingLabels : [];
  const visible = missing.slice(0, 5).join(", ");
  const tail = missing.length > 5 ? ` и ещё ${missing.length - 5}` : "";
  return `Сначала дождись refs: готово ${ready} из ${required}${visible ? `. Не хватает: ${visible}${tail}` : ""}.`;
}

function normalizeProductionBible(bible = {}, { stylePreset = "", styleProfile = null } = {}) {
  const base = createDefaultProductionBible();
  const source = bible && typeof bible === "object" ? bible : {};
  const characters = Array.from({ length: MAX_CHARACTER_REFS }, (_, i) => ({
    ...emptyProductionCharacter(i),
    ...(Array.isArray(source.characters) && source.characters[i] && typeof source.characters[i] === "object" ? source.characters[i] : {}),
    id: source.characters?.[i]?.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
  }));
  const locations = Array.from({ length: MAX_LOCATION_REFS }, (_, i) => ({
    ...emptyProductionLocation(i),
    ...(Array.isArray(source.locations) && source.locations[i] && typeof source.locations[i] === "object" ? source.locations[i] : {}),
    id: source.locations?.[i]?.id || `LOC_${String(i + 1).padStart(2, "0")}`,
  }));
  const styleLock = cleanText(source.style?.lock || "");
  const presetLock = cleanText(styleProfile?.style_lock || STYLE_PRESETS[stylePreset]?.lock || "");
  return {
    ...base,
    ...source,
    enabled: source.enabled !== false,
    characters,
    locations,
    style: {
      ...base.style,
      ...(source.style && typeof source.style === "object" ? source.style : {}),
      preset: stylePreset,
      label: styleLabelRu(stylePreset, styleProfile?.label || STYLE_PRESETS[stylePreset]?.label || stylePreset),
      lock: styleLock || presetLock,
    },
  };
}

function stripProductionBibleImages(bible = {}) {
  const normalized = normalizeProductionBible(bible);
  return {
    ...normalized,
    characters: normalized.characters.map((item) => ({ ...item, reference: "" })),
    locations: normalized.locations.map((item) => ({ ...item, reference: "" })),
    style: { ...normalized.style, reference: "" },
  };
}

function mergeProductionBibleReferences(nextBible = {}, previousBible = {}, { stylePreset = "", styleProfile = null } = {}) {
  const next = normalizeProductionBible(nextBible, { stylePreset, styleProfile });
  const previous = normalizeProductionBible(previousBible, { stylePreset, styleProfile });
  const sameScript = Boolean(next.scriptFingerprint && previous.scriptFingerprint && next.scriptFingerprint === previous.scriptFingerprint);
  if (!sameScript) return next;

  const findPreviousCharacter = (item = {}) => {
    const key = normalizeTextKey(item.name || "");
    return previous.characters.find((prev) => key && normalizeTextKey(prev.name || "") === key)
      || previous.characters.find((prev) => prev.id && item.id && prev.id === item.id);
  };
  const findPreviousLocation = (item = {}) => {
    const key = normalizeTextKey(item.name || "");
    return previous.locations.find((prev) => key && normalizeTextKey(prev.name || "") === key)
      || previous.locations.find((prev) => prev.id && item.id && prev.id === item.id);
  };

  return {
    ...next,
    characters: next.characters.map((item) => {
      const prev = findPreviousCharacter(item) || {};
      return prev.reference ? { ...item, reference: prev.reference, referenceName: prev.referenceName } : item;
    }),
    locations: next.locations.map((item) => {
      const prev = findPreviousLocation(item) || {};
      return prev.reference ? { ...item, reference: prev.reference, referenceName: prev.referenceName } : item;
    }),
    style: previous.style?.reference
      ? { ...next.style, reference: previous.style.reference, referenceName: previous.style.referenceName }
      : next.style,
  };
}

function productionBibleToLocks(bible = {}) {
  const normalized = normalizeProductionBible(bible);
  const characters = filledProductionCharacters(normalized);
  const locations = filledProductionLocations(normalized);
  const cast_lock = characters.map((item, i) => ({
    id: item.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
    role: cleanText([item.name, item.role].filter(Boolean).join(" — ")) || `Character ${i + 1}`,
    visual_identity: cleanText(item.identity || "same actor identity from locked reference / first appearance"),
    wardrobe: cleanText(item.wardrobe || "same wardrobe from first appearance unless script explicitly changes it"),
    forbidden_changes: cleanText(item.negative || "no different actor, no face drift, no age drift, no wardrobe drift"),
  }));
  const primaryLocation = locations[0] || {};
  const location_lock = {
    main: cleanText(primaryLocation.name || "only scripted locations"),
    materials: cleanText(locations.map((item) => [item.name, item.description, item.materials].filter(Boolean).join(": ")).filter(Boolean).join("; ") || "only scripted materials and production design"),
    lighting: cleanText(locations.map((item) => [item.name, item.lighting].filter(Boolean).join(": ")).filter(Boolean).join("; ") || "only practical lighting physically supported by the scripted location"),
    spatial_rules: "Use only locations introduced by the script or locked in this bible; preserve geography across storyboard frames and PART grids.",
    forbidden: cleanText(locations.map((item) => item.negative).filter(Boolean).join("; ") || "no unrelated location, no new room, no era drift"),
  };
  const style_bible = cleanText([
    `Selected style: ${normalized.style?.label || normalized.style?.preset || "locked style"}`,
    normalized.style?.lock || "",
    normalized.style?.referenceName ? `Style reference uploaded: ${normalized.style.referenceName}` : "",
    normalized.style?.negative ? `Style forbidden: ${normalized.style.negative}` : "",
  ].filter(Boolean).join(". "));
  return { cast_lock, location_lock, style_bible };
}

function formatProductionBibleForPrompt(bible = {}, { includeReferences = true } = {}) {
  const normalized = normalizeProductionBible(bible);
  if (normalized.enabled === false) return "";
  const characters = filledProductionCharacters(normalized);
  const locations = filledProductionLocations(normalized);
  const charLines = characters.length
    ? characters.map((item, i) => {
      const ref = includeReferences && item.referenceName ? ` reference uploaded: ${item.referenceName};` : "";
      const identity = promptEnglishSafe(item.identity || (item.referenceName
        ? "use uploaded reference as the actor face/body identity anchor; infer only missing details from the script"
        : "infer only from script and first generated appearance"), "stable actor identity inferred from script and reference");
      const wardrobe = promptEnglishSafe(item.wardrobe || (item.referenceName
        ? "use reference wardrobe only when the script does not specify wardrobe; script wardrobe always wins"
        : "scripted wardrobe only"), "script-supported wardrobe only");
      const role = promptEnglishSafe(item.role || `Character ${i + 1}`, `Character ${i + 1}`);
      const negative = promptEnglishSafe(item.negative || "no redesign", "no redesign, no actor drift, no wardrobe drift");
      return `${item.id || `CHAR_${String(i + 1).padStart(2, "0")}`} ${role}: identity=${identity}; wardrobe=${wardrobe};${ref} forbidden=${negative}`;
    }).join("\n")
    : "No manual character references. Extract cast from the script and create stable cast_lock.";
  const locLines = locations.length
    ? locations.map((item, i) => {
      const ref = includeReferences && item.referenceName ? ` reference uploaded: ${item.referenceName};` : "";
      const description = promptEnglishSafe(item.description || (item.referenceName
        ? "use uploaded reference as location design anchor; script geography and source line always win"
        : "scripted location only"), "script-supported location design only");
      const materials = promptEnglishSafe(item.materials || (item.referenceName
        ? "use visible reference materials only if compatible with the script"
        : "scripted materials only"), "script-supported materials only");
      const lighting = promptEnglishSafe(item.lighting || (item.referenceName
        ? "use reference lighting family only if compatible with the selected style and script"
        : "physically plausible practical light only"), "physically plausible practical light only");
      const name = promptEnglishSafe(item.name || `Location ${i + 1}`, `Location ${i + 1}`);
      const negative = promptEnglishSafe(item.negative || "no redesign", "no location redesign, no new room, no era drift");
      return `${item.id || `LOC_${String(i + 1).padStart(2, "0")}`} ${name}: description=${description}; materials=${materials}; lighting=${lighting};${ref} forbidden=${negative}`;
    }).join("\n")
    : "No manual location references. Extract recurring locations from the script and lock them.";
  return `PRODUCTION BIBLE LOCK:
This is the project source of truth before storyboard generation.
Use these locks to create root cast_lock, location_lock, style_bible and every scene's allowed/forbidden fields.
Reference uploads are identity/style/location anchors only; they must not introduce unscripted story content.

CHARACTER REFERENCES / CAST LOCK INPUT:
${charLines}

LOCATION REFERENCES / LOCATION LOCK INPUT:
${locLines}

STYLE LOCK INPUT:
Selected preset: ${normalized.style?.label || normalized.style?.preset || "locked style"}
Style lock: ${normalized.style?.lock || "use selected style preset only"}
Style reference: ${includeReferences && normalized.style?.referenceName ? normalized.style.referenceName : "none"}
Style forbidden: ${normalized.style?.negative || "no style drift"}

PRODUCTION BIBLE RULES:
- Characters may appear only after the script introduces or directly implies them.
- Manual references lock identity; they are not a command to place that character in every frame.
- Location/style references lock continuity; they cannot add props, rooms, eras, costumes or threats not present in the source line.
- If storyboard output conflicts with this bible, this bible wins unless the script explicitly says otherwise.`;
}

function productionBibleSeedText(bible = {}) {
  const normalized = normalizeProductionBible(bible);
  return JSON.stringify({
    characters: filledProductionCharacters(normalized).map((item) => [item.name, item.role, item.identity, item.wardrobe]),
    locations: filledProductionLocations(normalized).map((item) => [item.name, item.description, item.materials, item.lighting]),
    style: [normalized.style?.label, normalized.style?.lock, normalized.style?.negative],
  });
}

function sourceSentences(script = "") {
  return String(script || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(cleanText)
    .filter(Boolean);
}

function contextForPattern(sentences = [], pattern = null, fallback = "") {
  if (!pattern) return fallback;
  return sentences.filter((line) => pattern.test(line)).slice(0, 3).join(" / ") || fallback;
}

function styleLineForReference(normalized = {}) {
  return cleanText([
    normalized.style?.lock || "",
    normalized.style?.negative ? `Avoid: ${normalized.style.negative}` : "",
  ].filter(Boolean).join(". "));
}

function isAnimalProductionCharacter(item = {}) {
  const key = normalizeTextKey(`${item.kind || ""} ${item.name || ""} ${item.role || ""} ${item.identity || ""} ${item.sourceContext || ""}`);
  return /animal|dog|puppy|wolf|cub|moose|calf|deer|bear|horse|пес|пёс|собак|щен|волч|лос|лосенок|лосёнок|лосиха|олен|медвед|конь|лошад|животн/.test(key);
}

function characterReferenceEmotionSet(item = {}) {
  const key = normalizeTextKey(`${item.name || ""} ${item.role || ""} ${item.identity || ""} ${item.sourceContext || ""}`);
  if (/волчон|wolf cub|cub/.test(key)) {
    return "eyes closed from cold, weak breathing, confused first eye opening, fragile recovery, alert farewell glance";
  }
  if (isAnimalProductionCharacter(item)) {
    return "panic, exhaustion, trembling fear, alert eye contact, pain response only if scripted, recovery relief only if scripted";
  }
  if (/геннадий|gennady|антагонист/.test(key)) {
    return "neutral flat stare, polite domestic calm, cold suspicion, controlled irritation, pain reaction only if later scripted injury exists";
  }
  if (/лада|lada|ветеринар|veterinarian/.test(key)) {
    return "focused emergency care, exhausted tenderness, fear under control, relieved smile, quiet farewell sadness";
  }
  if (/лена|lena|героиня|свидетель|девушк/.test(key)) {
    return "neutral tired state, fear, shock, silent suspicion, panic under restraint, exhausted survival focus";
  }
  if (/старик|elderly|жертва/.test(key)) {
    return "neutral elderly fatigue, worry, fear, pain only in scripted victim beat";
  }
  if (/мясник|butcher|маске|masked/.test(key)) {
    return "silent neutral threat, slow intent, restrained anger, pain reaction only if scripted, no monster redesign";
  }
  return "neutral, fear, shock, suspicion, pain only if scripted, exhausted focus";
}

function characterReferencePoseSet(item = {}) {
  const key = normalizeTextKey(`${item.name || ""} ${item.role || ""} ${item.identity || ""} ${item.wardrobe || ""} ${item.sourceContext || ""}`);
  if (/волчон|wolf cub|cub/.test(key)) {
    return "curled in snow, wrapped in towels on a metal clinic table, oxygen care pose, lifting head weakly, stepping into snow";
  }
  if (isAnimalProductionCharacter(item)) {
    return "front standing pose, three-quarter pose, side profile, back profile, scripted action pose, vulnerable/resting pose, head close-up";
  }
  if (/лада|lada|ветеринар|veterinarian/.test(key)) {
    return "running with rescued animal against coat, leaning over clinic table, holding tiny chest gently, smiling through exhaustion, opening clinic door";
  }
  if (/геннадий|gennady/.test(key)) {
    return "standing in doorway, calmly stepping forward, carrying a milk bag, dragging a black bag, holding a hammer only as a prop detail";
  }
  if (/лена|lena/.test(key)) {
    return "peeking from kitchen doorway, clutching a mug, backing away, throwing boiling water, pulling a locked door chain";
  }
  if (/мясник|butcher|маске|masked/.test(key)) {
    return "front stance, three-quarter stance, side stance, walking forward, chainsaw held low only if scripted";
  }
  if (/старик|elderly/.test(key)) {
    return "standing near shared kitchen, reaching toward a phone, tense seated posture, frail side profile";
  }
  if (/женщина на лестнице|первая жертва/.test(key)) {
    return "ordinary resident standing reference, stairwell victim body layout only as a small scripted continuity thumbnail";
  }
  return "front stance, three-quarter stance, side stance, looking over shoulder, walking, tense close-up";
}

function characterReferenceDetailSet(item = {}) {
  const key = normalizeTextKey(`${item.name || ""} ${item.role || ""} ${item.identity || ""} ${item.wardrobe || ""} ${item.sourceContext || ""}`);
  if (/волчон|wolf cub|cub/.test(key)) {
    return "gray fur clumps, frost on whiskers, closed eyelids, tiny paws, damp nose, weak chest movement, recovered alert eyes";
  }
  if (isAnimalProductionCharacter(item)) {
    return "fur pattern, muzzle shape, eyes, ears, paws or visible limb condition, body size, mud/water/grass/snow contact only if scripted, silhouette and color palette";
  }
  if (/лада|lada|ветеринар|veterinarian/.test(key)) {
    return "tired eyes, winter coat fabric, gloved hands, clinic sleeves, practical hair, gentle hand pressure, exhausted smile";
  }
  if (/мясник|butcher|маске|masked/.test(key)) {
    return "mask seams, apron stains, glove texture, heavy boots, tool grip, body silhouette";
  }
  if (/геннадий|gennady/.test(key)) {
    return "flat stare, sleeveless undershirt, slippers, milk bag, worn hands, ordinary domestic silhouette";
  }
  if (/лена|lena/.test(key)) {
    return "anxious eyes, tense hands around mug, hair silhouette, home clothes, bare feet only as scripted detail";
  }
  return "face close-up, eyes, hands, wardrobe fabric, shoes, silhouette, color palette from first appearance";
}

function characterReferenceNegativePrompt() {
  const allowedSheetConflicts = new Set([
    "duplicate people",
    "contact sheet",
    "gallery cards",
    "nested grid",
  ]);
  return [
    ...LOCAL_IMAGE_NEGATIVE.split(", ").filter((item) => !allowedSheetConflicts.has(cleanText(item))),
    "different actors in the same reference sheet",
    "face drift between views",
    "wardrobe drift between views",
    "unreadable face",
    "tiny face only",
    "random costume",
    "random genre mask",
  ].join(", ");
}

function buildCharacterReferencePrompt(item = {}, normalized = {}) {
  const key = normalizeTextKey(`${item.name || ""} ${item.role || ""} ${item.identity || ""} ${item.sourceContext || ""}`);
  const context = scriptBeatPromptEnglish(item.sourceContext || "", normalized, "recurring scripted character from this trailer");
  const identity = promptEnglishSafe(item.identity || "", "stable actor face, body type, hair, age impression and emotional condition inferred from the script");
  const wardrobe = promptEnglishSafe(item.wardrobe || "", "script-supported wardrobe only; no costume drift");
  const role = promptEnglishSafe(item.role || "script character", "script character");
  const style = promptEnglishSafe(styleLineForReference(normalized), "real camera photoreal cinematic realism, practical lighting, natural skin texture, fabric detail");
  const emotions = promptEnglishSafe(characterReferenceEmotionSet(item), "neutral, fear, shock, suspicion, exhaustion");
  const poses = promptEnglishSafe(characterReferencePoseSet(item), "front stance, three-quarter stance, side stance, close-up, action pose only if scripted");
  const details = promptEnglishSafe(characterReferenceDetailSet(item), "face, eyes, hands, wardrobe fabric, shoes and silhouette");
  if (isAnimalProductionCharacter(item)) {
    return cleanText(`Create one wide 16:9 photoreal production character bible sheet for the same trailer, not a story frame. The sheet is an identity anchor for ComfyUI/IPAdapter. Use one single animal only, repeated across controlled reference panels with the same species, age impression, body size, fur/skin pattern, muzzle shape, eye color, ear shape, limb/body condition and silhouette in every panel. Required visual sections arranged like a professional reference board, but without readable labels: top row turnarounds: front view, 3/4 view, side profile, back view; middle row emotion/state heads: ${emotions}; lower row scenario poses: ${poses}; bottom detail strip: ${details}; small color/material swatches from the animal and scripted environment. Character slot: ${item.id || "CHAR"}. Role: ${role}. Script context: ${context}. Identity lock: ${identity}. Style: ${style}. ${SCRIPT_LITERAL_GATE} Reference sheet may contain multiple views of the same animal, but never multiple different animals. Do not change the species, age, body condition or injury/disability. No human child replacement, no fantasy creature, no collar/harness unless scripted, no readable text, no captions, no labels, no UI, no watermark, no unrelated props, no new location.`);
  }
  return cleanText(`Create one wide 16:9 photoreal production character bible sheet for the same trailer, not a story frame. The sheet is an identity anchor for ComfyUI/IPAdapter. Use one single actor only, repeated across controlled reference panels with the same face, skull shape, hair, age impression, body type, skin texture, hands, wardrobe, shoes, silhouette and color palette in every panel. Required visual sections arranged like a professional reference board, but without readable labels: top row turnarounds: front view, 3/4 view, side profile, back view; middle row emotion heads: ${emotions}; lower row scenario poses: ${poses}; bottom detail strip: ${details}; small wardrobe/color swatches from first appearance. Character slot: ${item.id || "CHAR"}. Role: ${role}. Script context: ${context}. Identity lock: ${identity}. Wardrobe lock: ${wardrobe}. Style: ${style}. ${SCRIPT_LITERAL_GATE} Reference sheet may contain multiple views of the same actor, but never multiple different people. Do not turn this character into a doctor, nurse, hazmat worker, surgical-mask figure, hooded stranger, cult figure or unrelated masked person unless this exact character role or script context explicitly says so. No readable text, no captions, no labels, no UI, no watermark, no unrelated props, no new location.`);
}

function buildLocationReferencePrompt(item = {}, normalized = {}) {
  const context = scriptBeatPromptEnglish(item.sourceContext || "", normalized, "scripted recurring location from this trailer");
  const description = promptEnglishSafe(item.description || "", "script-supported production design and geography only");
  const materials = promptEnglishSafe(item.materials || "", "script-supported materials only");
  const lighting = promptEnglishSafe(item.lighting || "", "physically plausible practical light only");
  const name = promptEnglishSafe(item.name || item.id || "script location", "script location");
  const style = promptEnglishSafe(styleLineForReference(normalized), "real camera photoreal cinematic realism, practical lighting, tactile surfaces");
  return cleanText(`Create one wide 16:9 photoreal production design bible board for the same film location, not a story frame. Use controlled panels without readable labels: establishing wide view, threshold/entry view, primary action lane, material close-ups, practical light state, key scripted props only if they belong to this location, and a small color/material swatch strip. No actors, no animals, no monster, no extra props beyond the script. Location slot: ${item.id || "LOC"}. Location type: ${name}. Script context: ${context}. Geography/design: ${description}. Materials: ${materials}. Lighting: ${lighting}. Style: ${style}. ${SCRIPT_LITERAL_GATE} Do not add hospital, clinic, laboratory, medical corridor, doctors, random windows, cars or unrelated rooms unless the script context explicitly says so. No captions, no labels, no UI, no watermark, no readable text unless the script explicitly says a sign/text is visible.`);
}

function buildStyleReferencePrompt(normalized = {}, script = "") {
  const context = scriptBeatPromptEnglish(sourceSentences(script).slice(0, 5).join(" / "), normalized, "same trailer world");
  const style = promptEnglishSafe(styleLineForReference(normalized), "real camera cinematic photorealism, practical lighting, realistic skin/fabric/surface texture");
  return cleanText(`Create one clean 9:16 photoreal style reference frame for this trailer. It must demonstrate only the film look: lens, lighting, color, grain, contrast, tactile realism and atmosphere. Script context: ${context}. Style: ${style}. ${SCRIPT_LITERAL_GATE} Do not introduce new characters, new monsters, new locations, new props, new era, captions, labels, UI, watermark or collage.`);
}

function contextContains(source = "", patterns = []) {
  return patterns.some((pattern) => pattern.test(source));
}

function inferCharacterIdentityLock(name = "", role = "", sourceContext = "", fullScript = "") {
  const key = normalizeTextKey(`${name} ${role} ${sourceContext}`);
  const text = normalizeTextKey(`${sourceContext} ${fullScript}`);
  if (/лада|lada|ветеринар|veterinarian/.test(key)) {
    return "Lada: young rural veterinarian, same tired kind face, practical emergency focus, gentle but urgent body language, same identity from rescue to release";
  }
  if (/волчон|wolf cub|cub/.test(key)) {
    return "Wolf cub: same small gray wolf cub, fragile juvenile body, gray winter fur pattern, damp nose, small ears, vulnerable recovery state from snow rescue to final release";
  }
  if (/геннадий|gennady/.test(key)) {
    return "Gennady: ordinary middle-aged male communal-apartment neighbor, calm domestic body language, unsettling flat stare, same face and build from first appearance to final frame";
  }
  if (/лена|lena/.test(key)) {
    return "Lena: young female neighbor and witness, anxious face, tense hands, same face, hair, body type and frightened physical condition from first appearance to final frame";
  }
  if (/старик/.test(key)) {
    return "Elderly male neighbor, frail older body, domestic appearance, same age and face only in his scripted victim frames";
  }
  if (/женщина на лестнице|первая жертва/.test(key)) {
    return "Opening stairwell victim: adult woman from the first scene only, ordinary resident appearance, same body and clothing only when the source line includes her";
  }
  if (/мясник|butcher|человек в маске|маске/.test(key)) {
    return "Masked butcher antagonist: very tall broad-shouldered adult male, same crude leather mask, heavy physical presence and silent posture from first reveal onward";
  }
  if (/девушк|girl|woman/.test(key) && /бойн|slaughter|цех|крюк|бензопил|маск/.test(text)) {
    return "Female lead in the slaughterhouse story, slim tired young woman, same face, hair, body type and fear response across all scripted frames";
  }
  if (/брат|арт[её]м|artem|artyom/.test(key)) {
    return "Young male companion, anxious face, same actor identity, hair, build and panic condition across all scripted frames";
  }
  return `${name || role || "Script character"}: stable actor identity extracted from script; preserve same face, body type, hair, age impression and emotional condition across all frames where this character is explicitly present`;
}

function inferCharacterWardrobeLock(name = "", role = "", sourceContext = "", fullScript = "") {
  const key = normalizeTextKey(`${name} ${role} ${sourceContext}`);
  const text = normalizeTextKey(`${sourceContext} ${fullScript}`);
  if (/лада|lada|ветеринар|veterinarian/.test(key)) {
    return "winter veterinarian clothing: practical coat or clinic sleeves, gloves when outdoors, tired emergency-care look; no glamour styling, no hospital uniform redesign unless the script line is inside the clinic";
  }
  if (/волчон|wolf cub|cub/.test(key)) {
    return "no clothing; same natural gray fur, frost or towels only when the current source line names snow, clinic table or warm towels";
  }
  if (/геннадий|gennady/.test(key)) {
    return contextContains(text, [/майк/, /тапк/])
      ? "plain sleeveless undershirt, house slippers and ordinary worn home trousers from first appearance; milk bag, black bag, wire or hammer appear only when the current source line names them"
      : "ordinary neighbor home clothes from first appearance; no costume redesign";
  }
  if (/лена|lena/.test(key)) {
    return "plain communal-apartment home clothes from first appearance; mug, bare feet or boiling water appear only when the current source line names them";
  }
  if (/старик/.test(key)) {
    return "ordinary elderly neighbor home clothes; telephone appears only when the current source line names it";
  }
  if (/женщина на лестнице|первая жертва/.test(key)) {
    return "ordinary resident clothing from the opening stairwell victim beat only; no new costume, no glamor styling";
  }
  if (/мясник|butcher|человек в маске|маске/.test(key)) {
    return "heavy butcher apron over dark work clothes, same crude leather mask, gloves and heavy boots; chainsaw only when the current source line names it";
  }
  if (/девушк|girl|woman/.test(key) && /бойн|slaughter|цех|крюк|бензопил|маск/.test(text)) {
    return "dust-covered practical clothes, worn boots, script-supported flashlight only when named; no fashion styling";
  }
  if (/брат|арт[её]м|artem|artyom/.test(key)) {
    return "ordinary practical clothes from first appearance; flashlight or injury appears only when the current source line names it";
  }
  return "use only wardrobe described by script or first generated reference; no costume drift, no genre redesign";
}

function extractProductionBibleFromScript(script = "", currentBible = {}, { stylePreset = "", styleProfile = null } = {}) {
  const normalized = normalizeProductionBible(currentBible, { stylePreset, styleProfile });
  const text = cleanText(script);
  const scriptFingerprint = productionScriptFingerprint(text);
  const preserveExistingReferences = Boolean(scriptFingerprint && normalized.scriptFingerprint === scriptFingerprint);
  const sentences = sourceSentences(script);
  const stop = new Set([
    "Фара", "Тусклый", "Узкий", "Молодая", "Старый", "Старая", "На", "Внутри", "Из", "За", "Она", "Они", "Он", "Когда", "Белый", "Свет", "Дверь", "Лампа", "Лампочка", "Здесь", "Беги", "Не", "Ты", "Лифт", "Следующий", "Молоток", "Стул", "Чашка", "Радио", "Сзади", "Во",
  ]);
  const candidates = [];
  function mentionPattern(name = "") {
    return new RegExp(cleanText(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
  function addCandidate(name, role, pattern, priority = 50) {
    const cleanName = cleanText(name);
    if (!cleanName) return;
    const key = normalizeTextKey(cleanName);
    const existing = candidates.find((item) => normalizeTextKey(item.name) === key);
    if (existing) {
      existing.priority = Math.max(existing.priority || 0, priority);
      if (role && (!existing.role || cleanText(role).length > cleanText(existing.role).length)) existing.role = cleanText(role);
      return;
    }
    candidates.push({ name: cleanName, role: cleanText(role), pattern: pattern || mentionPattern(cleanName), priority });
  }
  function addContextNames(re, role, priority = 70) {
    for (const match of text.matchAll(re)) {
      const name = cleanText(match[1] || "");
      if (name && !stop.has(name)) addCandidate(name, role, mentionPattern(name), priority);
    }
  }
  const properNameCounts = new Map();
  for (const match of text.matchAll(/\b[А-ЯЁ][а-яё]{2,}\b/g)) {
    const name = cleanText(match[0]);
    if (!name || stop.has(name)) continue;
    properNameCounts.set(name, (properNameCounts.get(name) || 0) + 1);
  }
  addContextNames(/\bсосед\s+([А-ЯЁ][а-яё]{2,})\b/g, "сосед / возможный антагонист", 90);
  addContextNames(/\bсоседка\s+([А-ЯЁ][а-яё]{2,})\b/g, "соседка / свидетель", 90);
  addContextNames(/\bмолодая\s+соседка\s+([А-ЯЁ][а-яё]{2,})\b/g, "молодая соседка / свидетель", 95);
  addContextNames(/\b(?:девушка|женщина|мужчина|парень|мясник|охранник|сотрудник|ветеринар|врач)\s+([А-ЯЁ][а-яё]{2,})\b/g, "персонаж из сценария", 82);
  addContextNames(/\b([А-ЯЁ][а-яё]{2,})\s+(?:тащит|проходит|режет|открывает|пятится|бросает|врывается|сползает|молчит|выглядывает|сжимает|поднимает|перешагивает|вытирает|тянется|набрасывает|набросывает|говорит|шепчет|ревёт|ревет|идёт|идет|светит|толкает|хватает|бежит|дёргает|дергает|прижимает|улыбается)\b/g, "персонаж из действия", 80);
  if (/лада|ветеринар/i.test(text)) addCandidate("Лада", "молодой ветеринар / главная героиня", /лада|ветеринар/i, 102);
  if (/волчонок|волчонк|wolf cub/i.test(text)) addCandidate("Волчонок", "спасённый волчонок / второй главный герой", /волчонок|волчонк|wolf cub/i, 101);
  if (/геннадий/i.test(text)) addCandidate("Геннадий", /провод.{0,60}шею|молоток|ч[её]рный мешок|разрезанн|полиэтилен|пил[аы]/i.test(text) ? "сосед-антагонист" : "сосед", /геннадий/i, 100);
  if (/лена/i.test(text)) addCandidate("Лена", "главная героиня / свидетель", /лена/i, 98);
  if (/арт[её]м/i.test(text)) addCandidate("Артём", "второй герой", /арт[её]м/i, 96);
  if (/старик[-\s]+сосед/i.test(text)) addCandidate("Старик-сосед", "пожилой сосед / жертва", /старик[-\s]+сосед/i, 76);
  if (/женщин[аы].{0,120}разрезанн|разрезанн.{0,120}женщин/i.test(text)) addCandidate("Женщина на лестнице", "первая жертва из открывающего кадра", /женщин[аы]|разрезанн/i, 68);
  for (const [name, count] of properNameCounts.entries()) {
    if (count >= 2) addCandidate(name, "повторяющийся персонаж сценария", mentionPattern(name), 84 + count);
  }
  if (/девушк/i.test(text)) addCandidate("Девушка", "женский герой", /девушк/i, 78);
  if (/брат/i.test(text)) addCandidate("Брат", "мужской герой / брат", /брат/i, 78);
  if (/трое\s+сотрудник|сотрудник/i.test(text)) {
    addCandidate("Сотрудник 1", "офисный сотрудник", /сотрудник|трое/i, 86);
    addCandidate("Сотрудник 2", "офисный сотрудник", /сотрудник|трое/i, 85);
    addCandidate("Сотрудник 3", "офисный сотрудник", /сотрудник|трое/i, 84);
  }
  if (/мясник|человек в маске|высокий человек|бензопил|фартук/i.test(text)) addCandidate("Мясник", "антагонист в маске", /мясник|человек в маске|высокий человек|бензопил|фартук/i, 92);
  if (/копи[яию]|двойник/i.test(text)) addCandidate("Двойник", "двойник / сверхъестественная копия", /копи[яию]|двойник/i, 72);
  if (!candidates.length && text.length > 30) addCandidate("Главный персонаж", "главный персонаж, извлечённый из сценария", /./, 10);
  const uniqueCandidates = candidates
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)
      || (properNameCounts.get(b.name) || 0) - (properNameCounts.get(a.name) || 0)
      || a.name.localeCompare(b.name, "ru"))
    .slice(0, MAX_CHARACTER_REFS);
  const characters = Array.from({ length: MAX_CHARACTER_REFS }, (_, i) => {
    const existing = normalized.characters[i] || emptyProductionCharacter(i);
    const candidate = uniqueCandidates[i] || {};
    const name = candidate.name || existing.name || "";
    const role = candidate.role || (name ? "script character" : existing.role);
    const hasCandidate = Boolean(candidate.name);
    const keepExistingReference = preserveExistingReferences && (!hasCandidate
      || !existing.reference
      || !existing.name
      || normalizeTextKey(existing.name) === normalizeTextKey(candidate.name));
    const sourceContext = hasCandidate
      ? contextForPattern(sentences, candidate.pattern, name ? text.slice(0, 260) : "")
      : (existing.sourceContext || contextForPattern(sentences, candidate.pattern, name ? text.slice(0, 260) : ""));
    const inferredIdentity = name ? inferCharacterIdentityLock(name, role, sourceContext, text) : "";
    const inferredWardrobe = name ? inferCharacterWardrobeLock(name, role, sourceContext, text) : "";
    const next = {
      ...existing,
      name,
      reference: keepExistingReference ? existing.reference : "",
      referenceName: keepExistingReference ? existing.referenceName : "",
      role: hasCandidate ? role : (existing.role || role),
      identity: hasCandidate
        ? inferredIdentity
        : (existing.identity || inferredIdentity),
      wardrobe: existing.wardrobe || inferredWardrobe,
      negative: existing.negative || "no different actor, no face drift, no age drift, no wardrobe drift, no genre redesign, no unscripted mask or uniform",
      sourceContext,
    };
    return {
      ...next,
      referencePrompt: hasCandidate
        ? buildCharacterReferencePrompt(next, normalized)
        : (existing.referencePrompt || (name ? buildCharacterReferencePrompt(next, normalized) : "")),
    };
  });
  const locationHints = [
    [/лесн(ая|ую)\s+дорог|метель|сугроб|снег/i, "заснеженная лесная дорога", "empty forest road at night in a snowstorm, blue headlights, snowdrift, rural isolation"],
    [/сельск.*клиник|ветклиник|клиник|металлическом стол|кислород|монитор/i, "сельская ветклиника", "small rural veterinary clinic, metal treatment table, warm towels, oxygen, needle, monitor, yellow practical light"],
    [/подъезд/i, "тусклый подъезд", "dim apartment stairwell, flickering bulb, rusty grate, locked entrance door"],
    [/коммуналк|коридор коммуналк/i, "коридор коммуналки", "narrow communal apartment corridor, linoleum floor, kitchen and rooms connected by one hallway"],
    [/ванн/i, "старая ванная", "old communal bathroom, enamel bathtub, red water, chlorine smell"],
    [/кухн/i, "общая кухня", "shared communal kitchen, cutting board, old table, radio, domestic Soviet-era details"],
    [/двор|бельев/i, "двор коммуналки", "inner courtyard with clothesline and stained shirt"],
    [/бойн/i, "старая бойня", "rusty slaughterhouse exterior, gate, industrial meat-processing building"],
    [/цех/i, "старый цех", "old processing hall, stained tile, butcher tables, hanging rail system"],
    [/холодильн/i, "холодильная камера", "cold storage room, blue dead light, white vapor"],
    [/коридор/i, "коридор рельс", "long corridor of meat rails and hooks"],
    [/ворот|калитк/i, "ворота / калитка", "rusty entrance gate and exterior threshold"],
    [/офис/i, "ночной офис", "late-night office floor"],
    [/лифт/i, "лифт", "elevator lobby and cabin"],
  ];
  const foundLocations = [];
  for (const [re, name, description] of locationHints) {
    if (re.test(text) && !foundLocations.some((item) => item.name === name)) foundLocations.push({ name, description, pattern: re });
  }
  if (!foundLocations.length && text.length > 30) {
    foundLocations.push({
      name: "Основная локация",
      description: "primary scripted location inferred from the scenario; preserve only geography and props described by source lines",
      pattern: /./,
    });
  }
  const locations = Array.from({ length: MAX_LOCATION_REFS }, (_, i) => {
    const existing = normalized.locations[i] || emptyProductionLocation(i);
    const found = foundLocations[i] || {};
    const hasFound = Boolean(found.name);
    const keepExistingReference = preserveExistingReferences && (!hasFound
      || !existing.reference
      || !existing.name
      || normalizeTextKey(existing.name) === normalizeTextKey(found.name));
    const sourceContext = hasFound
      ? contextForPattern(sentences, found.pattern, found.name ? text.slice(0, 300) : "")
      : (existing.sourceContext || contextForPattern(sentences, found.pattern, found.name ? text.slice(0, 300) : ""));
    const next = {
      ...existing,
      name: hasFound ? found.name : (existing.name || ""),
      reference: keepExistingReference ? existing.reference : "",
      referenceName: keepExistingReference ? existing.referenceName : "",
      description: hasFound ? found.description : (existing.description || ""),
      materials: existing.materials || (found.name ? "use only script-supported surfaces, grime, metal, tile, wood, plastic, fabric and practical props" : ""),
      lighting: existing.lighting || (found.name ? "practical light from script and physically plausible fixtures; no random stylized glow" : ""),
      sourceContext,
    };
    return {
      ...next,
      referencePrompt: hasFound
        ? buildLocationReferencePrompt(next, normalized)
        : (existing.referencePrompt || (next.name ? buildLocationReferencePrompt(next, normalized) : "")),
    };
  });
  const styleNext = {
    ...normalized.style,
    lock: normalized.style.lock || styleProfile?.style_lock || STYLE_PRESETS[stylePreset]?.lock || "",
  };
  return {
    ...normalized,
    autoGenerated: true,
    scriptFingerprint,
    characters,
    locations,
    style: { ...styleNext, referencePrompt: buildStyleReferencePrompt({ ...normalized, style: styleNext }, script) },
  };
}

function scriptLineHasAny(source = "", patterns = []) {
  const text = cleanText(source).toLowerCase();
  return patterns.some((pattern) => pattern.test(text));
}

function isElevatorTrailerLine(source = "") {
  return scriptLineHasAny(source, [
    /лифт/, /офис/, /сотрудник/, /этаж/, /минус/, /не смотрите в угол/, /пропали без вести/, /диспле/, /кнопк/,
  ]);
}

function scriptLineAllowsThreat(source = "") {
  return scriptLineHasAny(source, [
    /человек в маске/, /высокий человек/, /из шторы выходит/, /фартуке/, /бензопил/, /пила /, /пилой/, /маске уже рядом/, /новой кожи/,
    /corner man/, /masked man/, /killer/, /butcher/,
  ]);
}

function scriptLineIsEmptyMaskBeat(source = "") {
  return scriptLineHasAny(source, [/пустая кожаная маска/, /маска.*крюк/, /hook.*mask/, /empty.*mask/]) && !scriptLineAllowsThreat(source);
}

const SCRIPT_OBJECT_SCOPE = [
  [/метель|snowstorm/, "snowstorm"],
  [/снег|сугроб|snowdrift|snow/, "snowdrift and snow"],
  [/волчонок|волчонк|wolf cub/, "same small gray wolf cub"],
  [/шерст|fur/, "frost on gray fur"],
  [/фар[аы]|пикап|headlight|pickup/, "pickup headlight"],
  [/ветеринар|лада|veterinarian|lada/, "young veterinarian Lada only when this line names her"],
  [/клиник|ветклиник|clinic/, "rural veterinary clinic details"],
  [/металлическ.*стол|metal table/, "metal veterinary treatment table"],
  [/полотенц|towels?/, "warm towels"],
  [/кислород|oxygen/, "oxygen support"],
  [/игл|needle/, "needle"],
  [/монитор|monitor/, "medical monitor"],
  [/забор|fence/, "clinic fence"],
  [/волки|стая|wolf pack|adult wolves/, "adult wolves as distant dark silhouettes only when scripted"],
  [/вывеск|sign/, "rusted slaughterhouse sign"],
  [/бойн|slaughterhouse/, "slaughterhouse exterior details only when visible"],
  [/калитк|ворот|gate/, "rusted gate"],
  [/кожаная маск|пустая.*маск|маск.*крюк|empty.*mask|leather mask/, "empty leather mask on a hook"],
  [/фонар|flashlight/, "flashlight beam"],
  [/рельс|тушн|hook rail|meat rail/, "overhead meat rails"],
  [/крюк|hook/, "metal hooks"],
  [/цеп[ьи]|chain/, "chains"],
  [/плитк|tile/, "dark stained tile"],
  [/ламп|bulb|lamp/, "flickering practical lamp"],
  [/инструмент|tools?/, "butcher tools"],
  [/нож|knife/, "knife"],
  [/молот|hammer/, "hammer"],
  [/шило|awl/, "awl"],
  [/бензопил|chainsaw/, "chainsaw"],
  [/след.*сапог|сапог.*след|boot print/, "fresh boot prints"],
  [/стен[аы].*маск|маски.*стен|stitched masks/, "stitched leather masks on the wall"],
  [/пластиков.*штор|plastic curtain/, "plastic curtain"],
  [/зуб|tooth/, "tooth on the floor"],
  [/стол|table/, "scripted table surface"],
  [/искр|sparks?/, "metal sparks"],
  [/холодильн|cold storage/, "cold storage door"],
  [/пар|vapor|steam/, "cold vapor or steam exactly as scripted"],
  [/син(ий|ее).*свет|blue light/, "dead blue practical light"],
  [/зубц|reflection|отражени/, "reflection on a chainsaw tooth"],
  [/подъезд|stairwell/, "apartment stairwell"],
  [/ступеньк|stairs?/, "stair steps"],
  [/женщин.*горл|горл.*женщин|woman lying|severe neck wound/, "woman body on the stairs only in the opening victim beat"],
  [/кров|blood|бур(ый|ых)/, "blood exactly where the source line places it"],
  [/ржав.*реш[её]тк|rusty grate/, "rusty grate"],
  [/домофон|intercom/, "intercom camera"],
  [/молок|milk/, "milk bag"],
  [/ботинок|shoe/, "shoe"],
  [/коврик|doormat/, "doormat"],
  [/ч[её]рн(ый|ого)\s+меш|black bag/, "black bag"],
  [/мокр.*след|wet trail/, "wet trail"],
  [/ванн|bathtub/, "old enamel bathtub"],
  [/красн.*вод|red water/, "red water"],
  [/кружк|mug/, "mug"],
  [/рубашк|shirt/, "stained shirt"],
  [/бельев|clothesline/, "clothesline"],
  [/мясо|meat/, "meat on the cutting board"],
  [/доск|cutting board/, "cutting board"],
  [/телефон|phone/, "telephone"],
  [/провод|wire|cord/, "electric cord"],
  [/стул|chair/, "chair"],
  [/чашк|cup/, "cup"],
  [/радио|radio/, "radio"],
  [/линолеум|linoleum/, "linoleum floor"],
  [/полиэтилен|plastic sheeting/, "plastic sheeting"],
  [/тазик|basin/, "basins"],
  [/пил[аы]|saws?/, "saws only when the source line names them"],
  [/ключ|keys?/, "keys on the wall"],
  [/очк|eyeglasses/, "eyeglasses on the wall"],
  [/кипяток|boiling water/, "boiling water"],
  [/цепочк|door chain/, "locked door chain"],
  [/обожж|burned/, "burned face only when scripted"],
  [/лифт|elevator/, "elevator cabin or doors"],
  [/кнопк|-1|минус/, "exact elevator button or -1 sign"],
  [/диспле|display/, "elevator display"],
  [/фотограф|photo/, "old photograph"],
  [/подпись|caption/, "scripted caption only"],
  [/пустот|void/, "black void only when scripted"],
];

const SCRIPT_LOCATION_SCOPE = [
  [/лесн(ая|ую)\s+дорог|метель|сугроб|снег/, "empty snowy forest road"],
  [/сельск.*клиник|ветклиник|клиник|металлическом стол|кислород|монитор/, "small rural veterinary clinic"],
  [/забор|волки|стая/, "clinic fence at the forest edge"],
  [/подъезд|ступеньк|лестниц/, "dim apartment stairwell"],
  [/коммуналк|коридор коммуналк/, "narrow communal apartment corridor"],
  [/ванн/, "old communal bathroom"],
  [/общ(ая|ей)\s+кухн|кухн/, "shared communal kitchen"],
  [/двор|бельев/, "inner courtyard"],
  [/бойн|вывеск|пикап|калитк|ворот/, "abandoned slaughterhouse exterior threshold"],
  [/цех|тушн|рельс|крюк|разделочн|штор/, "old slaughterhouse processing hall"],
  [/холодильн/, "cold storage room"],
  [/офис|компьютер|стол.*офис/, "late-night office floor"],
  [/лифт|диспле|кнопк|кабин/, "same scripted elevator area"],
];

function detectScriptTerms(source = "", entries = []) {
  const text = normalizeTextKey(source);
  const terms = [];
  entries.forEach(([pattern, label]) => {
    if (pattern.test(text) && !terms.includes(label)) terms.push(label);
  });
  return terms;
}

function baseScopeIsGeneric(value = "") {
  return !cleanText(value)
    || /\bonly objects\b|directly named|directly implied|source line|scripted location slice|same locked scripted location|exact scripted location slice/i.test(cleanText(value));
}

function deriveFrameAllowedObjectsFromScript({ source = "", visualBeat = "", baseAllowed = "" } = {}) {
  const terms = detectScriptTerms(`${source} ${visualBeat}`, SCRIPT_OBJECT_SCOPE);
  if (terms.length) return `Scripted visible objects and physical effects only: ${terms.join(", ")}. No other props.`;
  if (!baseScopeIsGeneric(baseAllowed)) return promptEnglishSafe(baseAllowed, "only scripted objects visible in this source line");
  return "Only objects physically named or directly visible in this exact source line; no decorative props.";
}

function deriveFrameAllowedLocationFromScript({ source = "", visualBeat = "", baseLocation = "" } = {}) {
  const terms = detectScriptTerms(`${source} ${visualBeat}`, SCRIPT_LOCATION_SCOPE);
  if (terms.length) return `Scripted location slice only: ${terms.slice(0, 2).join(" / ")}. Do not move to another room or exterior unless this line says so.`;
  if (!baseScopeIsGeneric(baseLocation)) return promptEnglishSafe(baseLocation, "same scripted location slice");
  return "The exact scripted location slice from this source line only.";
}

function deriveFrameSpecificForbiddenVisuals(source = "", visualBeat = "", allowedCharacters = "") {
  const text = `${source} ${visualBeat}`;
  const forbidden = [
    "doctors, nurses, hospital, laboratory, medical corridor, surgical mask, medical gloves, hazmat suit",
    "modern cars, police, ambulance, sirens, exterior city, unrelated windows",
    "new signage, readable text, captions or symbols not named by the current source line",
  ];
  if (allowedCharacters) forbidden.push("extra people beyond the allowed character list, crowd, passersby, random bystanders");
  if (!scriptLineHasAny(text, [/клиник/, /ветеринар/, /clinic/, /veterinarian/])) forbidden.push("clinic, medical room or veterinary room not named by this source line");
  if (!scriptLineHasAny(text, [/кров/, /blood/, /бур(ый|ых)/])) forbidden.push("blood, gore, wounds or red liquid not named by this source line");
  if (!scriptLineHasAny(text, [/нож/, /молот/, /пил/, /бензопил/, /шило/, /цеп/, /оруж/, /knife/, /hammer/, /saw/, /chainsaw/, /weapon/])) {
    forbidden.push("knife, hammer, saw, chainsaw, gun or weapon close-up not named by this source line");
  }
  if (!scriptLineHasAny(text, [/машин/, /пикап/, /car/, /pickup/, /vehicle/])) forbidden.push("vehicle body, road, parking lot, street scene");
  if (!scriptLineHasAny(text, [/окн/, /window/])) forbidden.push("large random windows or daylight exterior view");
  if (scriptLineIsEmptyMaskBeat(text)) forbidden.push("person wearing the leather mask, body attached to the mask, masked attacker in this frame");
  return forbidden.join("; ");
}

function deriveFrameCharactersFromScript(source = "", fallback = "", bible = null) {
  const text = normalizeForMatch(source);
  const names = [];
  const bibleCharacters = filledProductionCharacters(bible || {});
  function lockedName(pattern, fallbackName) {
    const found = bibleCharacters.find((item) => pattern.test(normalizeForMatch(`${item.name || ""} ${item.role || ""} ${item.identity || ""}`)));
    return found?.name || fallbackName;
  }
  bibleCharacters.forEach((item) => {
    const name = normalizeForMatch(item.name);
    if (name && text.includes(name)) names.push(item.name);
    const role = normalizeForMatch(item.role || "");
    if (role && role.length > 4 && text.includes(role)) names.push(item.name || item.role);
  });
  if (/лена|lena|молодая\s+соседка/.test(text)) names.push(lockedName(/лена|lena|соседка/, "Лена"));
  if (/арт[её]м|артем|artem|artyom/.test(text)) names.push(lockedName(/артем|артём|artem|artyom/, "Артём"));
  if (/геннадий|gennady|gennadiy/.test(text)) names.push(lockedName(/геннадий|gennady|gennadiy/, "Геннадий"));
  if (/старик[-\s]+сосед|old male neighbor|elderly neighbor/.test(text)) names.push(lockedName(/старик|elderly|old male/, "Старик-сосед"));
  if (/женщин[аы].{0,120}(разрезанн|горл|кров)|victim woman|woman lying/.test(text)) names.push(lockedName(/женщина на лестнице|первая жертва|victim woman/, "Женщина на лестнице"));
  if (/лада|lada|ветеринар|veterinarian/.test(text)) names.push(lockedName(/лада|lada|ветеринар|veterinarian/, "Лада"));
  if (/волчонок|волчонк|wolf cub/.test(text)) names.push(lockedName(/волчонок|волчонк|wolf cub/, "Волчонок"));
  if (/взрослые волки|волки|стая|adult wolves|wolf pack/.test(text)) names.push(lockedName(/стая взрослых волков|взрослые волки|wolf pack/, "стая взрослых волков"));
  if (/лада|lada/.test(text)) names.push(lockedName(/лада|lada/, "Лада"));
  if (/илья|ilya|ilia/.test(text)) names.push(lockedName(/илья|ilya|ilia/, "Илья"));
  if (/марина|marina/.test(text)) names.push(lockedName(/марина|marina/, "Марина"));
  if (/анна|anna/.test(text)) names.push(lockedName(/анна|anna/, "Анна"));
  if (/сергей|sergey|sergei/.test(text)) names.push(lockedName(/сергей|sergey|sergei/, "Сергей"));
  if (scriptLineAllowsThreat(text)) names.push(lockedName(/мясник|butcher|маске|masked/, "Мясник"));
  if (names.length) return [...new Set(names)].join("; ");
  if (/они|их|им|она |он |they|them|she |he /.test(text)) return fallback;
  return "";
}

function deriveFrameForbiddenVisuals({ source = "", visualBeat = "", allowedCharacters = "", baseForbidden = "" }) {
  const combined = `${source} ${visualBeat}`;
  const forbidden = [baseForbidden, deriveFrameSpecificForbiddenVisuals(source, visualBeat, allowedCharacters)].filter(Boolean);
  if (!allowedCharacters) {
    forbidden.push("people, faces, bodies, hands, silhouettes, reflections of people, passersby");
  }
  if (!scriptLineAllowsThreat(combined)) {
    forbidden.push("masked man, hooded man, killer, butcher, apron man, chainsaw, person wearing a mask, threat reveal, later-story antagonist");
  }
  if (scriptLineIsEmptyMaskBeat(combined)) {
    forbidden.push("person wearing the mask, face behind the mask, body attached to the mask");
  }
  forbidden.push("story events from later script lines, new rooms, new props, new costumes, new era");
  return [...new Set(forbidden.join("; ").split(";").map((x) => cleanText(x)).filter(Boolean))].join("; ");
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
  const productionBibleLock = formatProductionBibleForPrompt(storyboard.production_bible || {}, { includeReferences: false });
  const previousRule = partIndex > 0
    ? "If a previous PART grid/reference is uploaded, use it only as visual DNA for cast identity, wardrobe, lighting family, lens language, color grade and production design. Do not copy the same compositions."
    : "This is PART 1. Establish the locked film identity clearly so later PARTS can continue it.";

  return `FLOW / GROK CONTINUITY FIX — PUT THIS BEFORE THE PART PROMPT

This is PART ${partIndex + 1} of the same trailer / short film, not a new concept and not a new storyboard.
Continue the exact same film world from previous frames.

CONTINUITY PRIORITY:
1. Same cast identity, faces, body types, wardrobe and emotional condition.
2. Same scripted location design, materials and spatial logic.
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

${productionBibleLock}

AI BIBLE ROUTING RULE:
The production bible is a reference library only. It is not a subject list.
Each cell may render only the cast explicitly allowed by that cell in the PART prompt.
If a cell has no allowed characters, it must contain no people, no animals, no bodies, no faces, no hands, no silhouettes, no shadows and no reflections.
Location references are production design anchors only; they must not move the cell to a different room/place unless the source line says so.

FLOW/GROK RULES:
- ${previousRule}
- Do not invent a new style, new actors, new costumes, new rooms, new props, new time period or new supernatural rules.
- Style is only lens/color/lighting/mood. Style cannot add objects that are not in the script.
- Do not introduce characters before their first scripted appearance. Empty location/object beats must stay empty.
- Cast lock is an identity reference only, not a subject list. Render a locked character only when the current cell explicitly allows that character.
- Do not advance to later story beats inside an earlier PART cell. If the antagonist, weapon or reveal appears later in the script, keep it forbidden until that exact source line.
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

function buildTrailerVisualBeat(source = "", previousState = {}, productionBible = {}) {
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

  if (!isElevatorTrailerLine(text)) {
    const genericAllowedCharactersText = deriveFrameCharactersFromScript(text, "", productionBible);
    const genericAllowedCharacters = genericAllowedCharactersText
      ? genericAllowedCharactersText.split(";").map((x) => cleanText(x)).filter(Boolean)
      : [];
    const sourceEn = scriptBeatPromptEnglish(text, productionBible, "literal scripted event");
    const genericVisualEn = `Literal camera-visible shot from this source line only: ${sourceEn}.`;
    const genericNoPeople = genericAllowedCharacters.length === 0;
    const genericForbidden = deriveFrameForbiddenVisuals({
      source: text,
      visualBeat: genericVisualEn,
      allowedCharacters: genericAllowedCharactersText,
      baseForbidden: genericNoPeople ? "no people in this frame" : "no extra people or unrelated cast members",
    });
    const genericShotRole = /шепчет|говорит|сказал|сказала|крик|диалог/i.test(text)
      ? "dialogue_or_reaction"
      : /след|инструмент|нож|молот|шило|цеп|маск|зуб|отражение|вывеск|крюк/i.test(text)
        ? "insert_or_clue"
        : /беги|несутся|режет|срывается|тянет|захлопывает|выходит|появляется|вспыхивает/i.test(text)
          ? "action_or_reveal"
          : "trailer_beat";
    const genericCamera = genericShotRole === "insert_or_clue"
      ? "tight documentary insert, tactile close focus"
      : genericShotRole === "action_or_reveal"
        ? "urgent handheld cinematic coverage"
        : "restrained cinematic establishing shot";
    return {
      state,
      visual_ru: `Кадр строго по строке сценария: ${text}.`,
      visual_en: genericVisualEn,
      allowed_characters: genericAllowedCharacters,
      allowed_objects: deriveFrameAllowedObjectsFromScript({ source: text, visualBeat: genericVisualEn }),
      allowed_location: deriveFrameAllowedLocationFromScript({ source: text, visualBeat: genericVisualEn }),
      forbidden_visuals: genericForbidden,
      on_screen_text: screenText ? [screenText] : [],
      shot_role: genericShotRole,
      camera: genericCamera,
      sfx: "clean close-mic physical SFX from visible or directly implied objects only; sparse silence; no background hum, drone, room tone or music",
      blocking: "Use only characters introduced by this exact source line or already required by its pronouns; never reveal a later antagonist early.",
    };
  }

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

function buildFullScenarioPrompt({ projectName, script, aspectRatio, stylePreset, target, expectedFrames, effectiveDuration, frameSeconds, timingMode, partSize, styleProfile, productionBible }) {
  const style = styleProfile?.style_lock || STYLE_PRESETS[stylePreset]?.lock || "locked cinematic realism";
  const biblePrompt = formatProductionBibleForPrompt(productionBible, { includeReferences: true });
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

${biblePrompt}

AI BIBLE ROUTING CONTRACT:
- Treat PRODUCTION BIBLE LOCK as the character/location library for this project.
- For each scene, allowed_characters must contain ONLY the characters/animals that are visible or directly required by that exact script line.
- Do not copy the whole cast into every scene. Empty allowed_characters means the frame must contain no people or animals.
- When a character/animal from the bible appears, use its exact id/name/role/identity/wardrobe/body-condition from the bible.
- Animals are characters too. Keep each animal identity, species, age, body condition and scale stable from first appearance to last.
- Location references are production design anchors only; they cannot add people, props, weather, rooms or eras not in the current source line.
- Scene image_prompt_en and video_prompt_en must include a compact character/location routing line: "visible allowed cast: ... / locked location: ... / forbidden cast: all others".

GLOBAL RULES:
- SOURCE OF TRUTH = script line.
- Use only characters, locations, objects, actions and dialogue present in the script.
- Do not invent new actors, new locations, new props, new costumes or new supernatural rules.
- Keep the same cast, wardrobe, scripted location geography, lighting family and style from first frame to last.
- Style cannot override the script: do not add candles, oil lamps, stone, moss, medieval props, new rooms, new eras, new costumes or weather unless the script explicitly says so.
- If a script line is abstract, convert it into a minimal visual beat from the already established locked location. Do NOT add a person just to make the frame interesting.
- Do not introduce characters before the script introduces them. Before a person is named or directly implied, the frame must stay an empty scripted location/object/clue beat.
- Do not reveal an antagonist, weapon, monster, double, masked person or supernatural effect before the exact source line introduces it.
- Dialogue must be copied exactly from the script into scene.dialogue with stable voice_id.
- Visible signs, captions, displays and title cards must go into scene.on_screen_text.
- Narrator/trailer VO belongs in scene.vo_ru.
- Final PART can contain any remaining frame count. Never add filler frames just to make a perfect grid.
- Audio/SFX must be clean close-mic diegetic ASMR: exact visible physical sounds, sparse silence and suspense. No background hum, drone bed, room tone filler, music bed, white noise or vague ambience.
- For 4-frame PART grids in 9:16, create one single vertical 9:16 canvas with a strict 2×2 collage inside it. Use thin black separators only. No visible numbering, cell names, captions, title bars, UI, watermark or non-story text.

SCRIPT BREAKDOWN PASS:
Before writing scenes, scan the full script and produce the internal breakdown:
1. recurring cast and first frame where each character is introduced;
2. recurring locations and allowed scripted spatial geography;
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
If timing mode is auto, split the script into meaningful trailer beats in source order: opening hook, first concrete location/object beats, first character actions, inciting anomaly, inserts, reactions, reveals, chase/action beats, climax and final sting.
If a script beat needs multiple frames, continue the same beat visually without adding new story content.

TRAILER OPENING SOURCE-ORDER LAW:
- The first PART must sell the premise while preserving script order.
- Frames 1-4 must cover the earliest meaningful source beats in order.
- Compress adjacent abstract opening narration only when it has no direct visible subject/action.
- A scene.script_line_ru may combine 2-3 exact adjacent source lines with " / " when needed to form a strong trailer beat. Do not invent or paraphrase new story.
- Do not jump forward to a later antagonist, weapon, chase, trap, threat, injury, supernatural reveal, double, monster or climax to make the hook more exciting.
- If the first source beats are concrete, such as a sign, gate, mask on hook, named character action, room, prop insert, vehicle light, door, corridor or display, use those beats literally.
- Human stake, anomaly and danger may appear early only when their exact source lines occur early.
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
Use the style only for lens, camera behavior, color, contrast, grain, texture and lighting quality. If any style token conflicts with the script location/object list, ignore that style token and keep the scripted world/location.

OUTPUT:
Return valid JSON only. No markdown. No explanation.

SCRIPT:
${script}`;
}

function buildLocalTrailerStoryboard({ script, duration, aspectRatio, stylePreset, target, targetFrames, frameSeconds, timingMode, productionBible }) {
  const lines = splitScriptBeats(script);
  const totalFrames = Math.max(1, Math.round(Number(targetFrames) || estimateAutoFrameCount(script, duration, frameSeconds)));
  const plannedLines = buildTrailerBeatPlan(lines, totalFrames);
  const frameDurations = distributeDurations(duration, totalFrames, frameSeconds);
  const style = getStyleProfile("film", stylePreset)?.style_lock || STYLE_PRESETS[stylePreset]?.lock || STYLE_PRESETS.cinematic.lock;
  const normalizedBible = normalizeProductionBible(productionBible, { stylePreset, styleProfile: getStyleProfile("film", stylePreset) });
  const bibleLocks = productionBibleToLocks(normalizedBible);
  let runningStart = 0;
  let entityState = { employees: false, cornerMan: false, duplicate: false };
  const scenes = Array.from({ length: totalFrames }, (_, i) => {
    const source = plannedLines[i] || lines[Math.min(lines.length - 1, Math.floor((i / totalFrames) * Math.max(1, lines.length)))] || "Trailer beat";
    const visual = buildTrailerVisualBeat(source, entityState, normalizedBible);
    entityState = visual.state;
    const isDialogue = /сказал|сказала|ш[её]пот|говорит|крик|крич/i.test(source);
    const dialogueText = source.match(/(?:сказал(?:а)?|говорит|ш[её]пот[^:]*|крик[^:]*)[:—-]\s*(.+)$/i)?.[1] || "";
    const sceneDuration = frameDurations[i] || frameSeconds || 3;
    const sceneStart = runningStart;
    const safeSfx = cleanSfxText(visual.sfx);
    const sourceEn = scriptBeatPromptEnglish(source, normalizedBible, "current scripted beat");
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
    production_bible: stripProductionBibleImages(normalizedBible),
    global_video_lock: "same film trailer continuity, locked scripted cast when introduced, locked scripted geography, no redesign between PART grids",
    character_lock: bibleLocks.cast_lock.map((item) => ({ name: item.role, description: item.visual_identity, wardrobe: item.wardrobe })),
    voice_lock: [
      { character: "Narrator", voice_id: "voice_01", voice_profile: "low tense trailer narration", delivery_arc: "controlled dread to final whisper" },
      { character: "Offscreen voice", voice_id: "voice_04", voice_profile: "near-whisper supernatural voice", delivery_arc: "appears only for curse/rule lines" },
    ],
    cast_lock: bibleLocks.cast_lock,
    location_lock: bibleLocks.location_lock,
    style_bible: cleanText([bibleLocks.style_bible, style].filter(Boolean).join(". ")),
    grid_continuity: "PART 1 follows the first meaningful source beats in script order and must not jump ahead to a later antagonist, weapon, threat, reveal or climax. PART 2+ continues the same film using cast_lock, location_lock, style_bible, visual_beat fields and previous PART visual DNA. Any final PART size is valid; never add filler frames just to make a perfect grid.",
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

function makeProjectSessionId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `trailer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getPersistentLocalAgentToken(fallback = "") {
  if (typeof window === "undefined") return String(fallback || "").trim() || "PASTE_AGENT_TOKEN";
  const saved = String(window.localStorage.getItem(TRAILER_AGENT_TOKEN_KEY) || "").trim();
  const next = saved || String(fallback || "").trim() || makeLocalAgentToken();
  window.localStorage.setItem(TRAILER_AGENT_TOKEN_KEY, next);
  return next;
}

function savePersistentLocalAgentToken(value = "") {
  const token = String(value || "").trim();
  if (!token || typeof window === "undefined") return token;
  window.localStorage.setItem(TRAILER_AGENT_TOKEN_KEY, token);
  return token;
}

function normalizeLocalImageData(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/png;base64,${raw}`;
}

function dataUrlImageExtension(value = "") {
  const mime = String(value || "").match(/^data:image\/([^;]+);base64,/i)?.[1]?.toLowerCase() || "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

function stableSeedFromText(value = "") {
  const text = String(value || "neurocine-trailer");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 999999999;
}

function migrateSavedCheckpoint(presetKey, checkpoint) {
  const raw = String(checkpoint ?? "").trim();
  if (["sdxlProduction", "sdxlProductionSlow"].includes(presetKey) && (!raw || raw === "sd_xl_base_1.0.safetensors")) {
    return LOCAL_MODEL_PRESETS[presetKey]?.checkpoint || LOCAL_MODEL_PRESETS[DEFAULT_LOCAL_MODEL_PRESET].checkpoint;
  }
  return checkpoint;
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
  const outputWidth = preset.lockDimensions === true
    ? clampNumber(preset.width, 512, 1536, LOCAL_IMAGE_WIDTH)
    : clampNumber(width, 512, 1536, preset.width || LOCAL_IMAGE_WIDTH);
  const outputHeight = preset.lockDimensions === true
    ? clampNumber(preset.height, 768, 2048, LOCAL_IMAGE_HEIGHT)
    : clampNumber(height, 768, 2048, preset.height || LOCAL_IMAGE_HEIGHT);
  const requestedSteps = clampNumber(steps, 4, 60, preset.steps || 24);
  const outputSteps = preset.lockQuality === true
    ? Math.max(clampNumber(preset.steps, 4, 60, requestedSteps), requestedSteps)
    : requestedSteps;
  const requestedCfg = clampNumber(cfg, 1, 12, preset.cfg || 6);
  const outputCfg = preset.lockQuality === true
    ? Number(preset.cfg || requestedCfg)
    : requestedCfg;
  const payload = {
    prompt,
    negative_prompt: LOCAL_IMAGE_NEGATIVE,
    model_preset: modelPreset,
    model_family: preset.family || "sdxl",
    workflow_mode: preset.workflowMode || "sdxl",
    reference_mode: preset.referenceMode || "none",
    ipadapter_model: preset.ipadapterModel || undefined,
    clip_vision_model: preset.clipVisionModel || undefined,
    ipadapter_weight: preset.ipadapterWeight || undefined,
    ipadapter_start_at: preset.ipadapterStartAt || undefined,
    ipadapter_end_at: preset.ipadapterEndAt || undefined,
    ipadapter_weight_type: preset.ipadapterWeightType || undefined,
    ipadapter_embeds_scaling: preset.ipadapterEmbedsScaling || undefined,
    production_quality: preset.productionQuality || "",
    pixel_upscale: preset.pixelUpscale === true,
    upscale_model: preset.upscaleModel || undefined,
    grid_output_format: preset.gridOutputFormat || "jpeg",
    grid_jpeg_quality: preset.gridJpegQuality || 97,
    required_models: {
      checkpoint: String(checkpoint || preset.checkpoint || "").trim(),
      ipadapter_model: preset.ipadapterModel || "",
      clip_vision_model: preset.clipVisionModel || "",
      upscale_model: preset.upscaleModel || "",
      production_quality: preset.productionQuality || "",
    },
    checkpoint: String(checkpoint || preset.checkpoint || "").trim(),
    width: outputWidth,
    height: outputHeight,
    base_width: preset.baseWidth || undefined,
    base_height: preset.baseHeight || undefined,
    steps: outputSteps,
    hires_steps: preset.hiresSteps || 0,
    hires_denoise: preset.hiresDenoise || 0,
    hires_sampler_name: preset.hiresSampler || undefined,
    hires_scheduler: preset.hiresScheduler || undefined,
    latent_upscale_method: preset.latentUpscaleMethod || undefined,
    final_downscale_method: preset.finalDownscaleMethod || undefined,
    cfg_scale: outputCfg,
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
  } catch (e) {
    if (controller.signal.aborted || e?.name === "AbortError" || String(e?.message || "").toLowerCase().includes("aborted")) {
      throw new Error(`таймаут ответа API: ${Math.round(timeoutMs / 1000)} сек. Повтори действие или обнови страницу.`);
    }
    throw e;
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

function timeMs(value = "") {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

function formatElapsedTime(ms = 0) {
  const seconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBytes(value = 0) {
  const bytes = Math.max(0, Number(value || 0) || 0);
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} МБ`;
}

function relativeTimeLabel(value = "", nowMs = Date.now()) {
  const ms = timeMs(value);
  if (!ms) return "нет данных";
  const seconds = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (seconds < 6) return "только что";
  if (seconds < 60) return `${seconds}с назад`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}м назад`;
  return `${Math.floor(minutes / 60)}ч назад`;
}

function queueVisualStatus(job = {}, queueJob = {}, hasGrid = false) {
  if (job.status === "done" || queueJob.status === "done" || hasGrid) return "done";
  if (job.status === "error" || queueJob.status === "failed") return "error";
  if (job.status === "rendering" || queueJob.status === "running") return "rendering";
  if (job.status === "queued" || queueJob.status === "queued" || queueJob.status === "pending") return "queued";
  return "";
}

function queueProgressInfo({ job = {}, queueJob = {}, hasGrid = false, nowMs = Date.now(), fallbackMessage = "" }) {
  const status = queueVisualStatus(job, queueJob, hasGrid);
  const created = timeMs(queueJob.created_at);
  const started = timeMs(queueJob.started_at) || (queueJob.status === "running" ? timeMs(queueJob.updated_at) : 0);
  const completed = timeMs(queueJob.completed_at) || (status === "done" || status === "error" ? timeMs(queueJob.updated_at) : 0);
  const base = started || created || timeMs(queueJob.updated_at);
  const end = completed || nowMs;
  const elapsed = base ? end - base : 0;
  const realProgress = Number(queueJob.progress ?? job.progress);
  const hasRealProgress = Number.isFinite(realProgress) && realProgress >= 0;
  let stage = "ждёт";
  let progress = hasGrid ? 100 : (hasRealProgress ? clampNumber(realProgress, 0, 100, 0) : 0);
  let showTrack = hasGrid || hasRealProgress;

  if (status === "queued") {
    stage = "ждёт агента";
    progress = hasRealProgress ? progress : 0;
    showTrack = hasRealProgress;
  } else if (status === "rendering") {
    stage = queueJob.progress_stage ? cleanText(queueJob.progress_stage) : "агент рендерит";
    progress = hasRealProgress ? Math.min(99, Math.max(1, progress)) : 0;
    showTrack = hasRealProgress;
  } else if (status === "done") {
    stage = "готово";
    progress = 100;
    showTrack = true;
  } else if (status === "error") {
    stage = "ошибка";
    progress = 0;
    showTrack = false;
  }

  return {
    status,
    stage,
    progress,
    showTrack,
    elapsed: base ? formatElapsedTime(elapsed) : "0:00",
    updated: relativeTimeLabel(queueJob.updated_at || queueJob.created_at, nowMs),
    output: formatBytes(queueJob.output_meta?.bytes || job.output_meta?.bytes || 0),
    message: queueJob.progress_message || job.message || (queueJob.status ? `очередь: ${queueJob.status}` : fallbackMessage),
  };
}

function referenceProgressInfo({ bible = {}, localRenderJobs = {}, localQueueJobs = {}, nowMs = Date.now() } = {}) {
  const normalized = normalizeProductionBible(bible);
  const items = [];
  const pushItem = (kind, item, index) => {
    if (!cleanText(item?.name || item?.role || item?.description || item?.identity || item?.referenceName || item?.referencePrompt)) return;
    const jobKey = referenceJobIndex(kind, index);
    const job = localRenderJobs[jobKey] || {};
    const queueJob = localQueueJobs[jobKey] || {};
    const hasReference = Boolean(item.reference || item.referenceName);
    const name = cleanText(item.name || item.role || item.description || item.id || (kind === "character" ? "Character" : "Location"));
    const label = `${kind === "character" ? "CHAR" : "LOC"}_${String(index + 1).padStart(2, "0")} · ${name}`;
    const progress = queueProgressInfo({
      job,
      queueJob,
      hasGrid: hasReference,
      nowMs,
      fallbackMessage: hasReference ? "референс загружен" : "ожидает постановки в очередь",
    });
    let status = progress.status || (item.referencePrompt ? "prompt" : "empty");
    if (hasReference) status = "done";
    const stage = status === "prompt"
      ? "промпт готов"
      : status === "empty"
        ? "не в очереди"
        : progress.stage;
    items.push({
      kind,
      index,
      label,
      status,
      stage,
      progress,
      queueJob,
      job,
      updated: progress.updated,
      elapsed: progress.elapsed,
      message: progress.message,
    });
  };
  (Array.isArray(normalized.characters) ? normalized.characters : []).forEach((item, index) => pushItem("character", item, index));
  (Array.isArray(normalized.locations) ? normalized.locations : []).forEach((item, index) => pushItem("location", item, index));

  const requiredTotal = items.length;
  const done = items.filter((item) => item.status === "done").length;
  const rendering = items.filter((item) => item.status === "rendering").length;
  const queued = items.filter((item) => item.status === "queued").length;
  const failed = items.filter((item) => item.status === "error").length;
  const waiting = items.filter((item) => item.status === "prompt" || item.status === "empty").length;
  const active = rendering > 0 || queued > 0;
  const current = items.find((item) => item.status === "rendering")
    || items.find((item) => item.status === "queued")
    || items.find((item) => item.status === "error")
    || items.find((item) => item.status === "prompt")
    || null;
  const readyPercent = requiredTotal ? Math.round((done / requiredTotal) * 100) : 0;
  const status = failed ? "error" : rendering ? "rendering" : queued ? "queued" : done === requiredTotal && requiredTotal ? "done" : waiting ? "warn" : "idle";

  return {
    items,
    requiredTotal,
    done,
    rendering,
    queued,
    failed,
    waiting,
    active,
    current,
    readyPercent,
    status,
  };
}

function pcCommandProgressInfo(job = {}, nowMs = Date.now()) {
  const status = job.status === "failed" ? "error" : job.status === "running" ? "rendering" : job.status === "queued" ? "queued" : job.status === "done" ? "done" : "";
  const label = job.command_label || job.part_label || job.command || "Команда ПК";
  const message = job.completion_message || job.progress_message || job.error || (status === "queued" ? "ждёт агента" : status === "rendering" ? "агент выполняет" : status === "done" ? "готово" : "ожидает статуса");
  return {
    status,
    label,
    message,
    updated: relativeTimeLabel(job.updated_at || job.created_at, nowMs),
  };
}

function agentHealthInfo(agent = null, nowMs = Date.now()) {
  const lastSeen = agent?.last_seen_at || agent?.updated_at || "";
  const lastMs = timeMs(lastSeen);
  const ageMs = lastMs ? Math.max(0, nowMs - lastMs) : Infinity;
  const online = Boolean(agent?.online === true && lastMs && ageMs < 45000);
  const provider = agent?.provider === "automatic1111"
    ? "Forge/A1111"
    : agent?.provider === "neurocine-worker"
      ? "NeuroCine worker"
      : "ComfyUI";

  if (!online) {
    return {
      status: "offline",
      title: "ПК агент: нет связи",
      detail: lastMs
        ? `Последняя связь: ${relativeTimeLabel(lastSeen, nowMs)}. Если ПК выключен или агент остановлен, рендер не идёт.`
        : "Сайт ещё не видел Local Agent с этим token. Нажми “Скопировать команду агента” и запусти её на ПК для этого token.",
    };
  }

  if (agent?.worker_ok === true) {
    return {
      status: "online",
      title: "ПК агент онлайн",
      detail: `${provider} отвечает. Последняя связь: ${relativeTimeLabel(lastSeen, nowMs)}.`,
    };
  }

  return {
    status: "warn",
    title: "ПК агент онлайн, генератор не отвечает",
    detail: `${provider}: ${agent?.worker_error || "нет ответа"}. Последняя связь: ${relativeTimeLabel(lastSeen, nowMs)}.`,
  };
}

function agentQueueInfo(agent = null, nowMs = Date.now()) {
  const queue = agent?.worker_queue && typeof agent.worker_queue === "object" ? agent.worker_queue : null;
  if (!queue) return null;
  const current = queue.current && typeof queue.current === "object" ? queue.current : {};
  const queueUpdatedAt = queue.updated_at || agent?.last_seen_at || agent?.updated_at;
  const updated = relativeTimeLabel(queueUpdatedAt, nowMs);
  const queueAgeMs = timeMs(queueUpdatedAt) ? Math.max(0, nowMs - timeMs(queueUpdatedAt)) : Infinity;
  const queueFresh = agent?.online === true && queue.stale !== true && queueAgeMs < 30000;
  const running = Number(queue.running_count || 0) || 0;
  const pending = Number(queue.pending_count || 0) || 0;
  const meta = [
    current.checkpoint ? `модель: ${current.checkpoint}` : "",
    current.size ? `размер: ${current.size}` : "",
    current.steps ? `steps: ${current.steps}` : "",
    current.sampler ? `sampler: ${current.sampler}${current.scheduler ? ` / ${current.scheduler}` : ""}` : "",
  ].filter(Boolean);

  if (queue.error) {
    return {
      status: "warn",
      title: "Очередь ComfyUI: ошибка",
      detail: `${queue.error}. Обновлено: ${updated}.`,
      meta,
    };
  }

  if (!queueFresh || queue.status === "stale" || queue.status === "offline") {
    return {
      status: "warn",
      title: agent?.online === true ? "ComfyUI: статус устарел" : "ComfyUI: нет связи",
      detail: `Последний статус очереди: ${updated}. Не считаю это текущим рендером без свежего heartbeat.`,
      meta,
    };
  }

  if (running > 0) {
    return {
      status: "rendering",
      title: `ComfyUI рендерит${current.label ? `: ${current.label}` : ""}`,
      detail: `${current.visual_beat || current.filename_prefix || "KSampler в работе"}. Обновлено: ${updated}.`,
      meta,
    };
  }

  if (pending > 0) {
    return {
      status: "queued",
      title: `ComfyUI очередь: ${pending} ждёт`,
      detail: `Сейчас не рендерит, но в очереди ComfyUI есть задания. Обновлено: ${updated}.`,
      meta,
    };
  }

  return {
    status: "online",
    title: "ComfyUI свободен",
    detail: `Очередь пуста. Обновлено: ${updated}.`,
    meta,
  };
}

function productionReadinessInfo(agent = null, nowMs = Date.now()) {
  const queue = agent?.worker_queue && typeof agent.worker_queue === "object" ? agent.worker_queue : null;
  const readiness = agent?.production_readiness || queue?.production_readiness;
  if (!readiness || typeof readiness !== "object") return null;
  const missing = Array.isArray(readiness.missing) ? readiness.missing.filter(Boolean) : [];
  const warnings = Array.isArray(readiness.warnings) ? readiness.warnings.filter(Boolean) : [];
  const models = Array.isArray(readiness.models) ? readiness.models : [];
  const nodes = Array.isArray(readiness.nodes) ? readiness.nodes : [];
  const updated = relativeTimeLabel(readiness.checked_at || queue?.updated_at || agent?.last_seen_at || agent?.updated_at, nowMs);
  const readyCount = [...models, ...nodes].filter((item) => item?.ok).length;
  const totalCount = [...models, ...nodes].filter((item) => item?.required !== false).length;

  if (readiness.ready === true) {
    return {
      status: "online",
      title: "Production pipeline готов",
      detail: `Checkpoint/IPAdapter/upscale проверены. Готово: ${readyCount}/${Math.max(readyCount, totalCount)}. Проверено: ${updated}.`,
      meta: warnings.slice(0, 4).map((item) => `optional: ${item}`),
    };
  }

  return {
    status: "warn",
    title: "Production pipeline не готов",
    detail: missing.length
      ? `Не хватает: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "..." : ""}. Проверено: ${updated}.`
      : `Агент ещё не прислал полный production-check. Проверено: ${updated}.`,
    meta: warnings.slice(0, 3).map((item) => `optional: ${item}`),
  };
}

export default function TrailerStoryboardPage() {
  const [projectName, setProjectName] = useState("");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [duration, setDuration] = useState(87);
  const [frameSeconds, setFrameSeconds] = useState(3);
  const [autoTiming, setAutoTiming] = useState(true);
  const [customFrameCount, setCustomFrameCount] = useState(27);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [target, setTarget] = useState("grok");
  const [stylePreset, setStylePreset] = useState("psychologicalDread");
  const [productionBible, setProductionBible] = useState(() => createDefaultProductionBible());
  const [partSize, setPartSize] = useState(4);
  const [activePart, setActivePart] = useState(0);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [gridUploads, setGridUploads] = useState({});
  const [croppedFrame, setCroppedFrame] = useState("");
  const [cropInset, setCropInset] = useState(0);
  const [storyboard, setStoryboard] = useState(null);
  const [status, setStatus] = useState("");
  const [bibleAction, setBibleAction] = useState("");
  const [bibleNotice, setBibleNotice] = useState({ type: "idle", message: "Нажми “Собрать из сценария”: система заполнит героев, локации и ref-prompts автоматически." });
  const [busy, setBusy] = useState(false);
  const [scriptBusy, setScriptBusy] = useState(false);
  const [scriptNotice, setScriptNotice] = useState({ type: "idle", message: "" });
  const [queueClock, setQueueClock] = useState(Date.now());
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showMasterPrompt, setShowMasterPrompt] = useState(false);
  const [localWorkerUrl, setLocalWorkerUrl] = useState(DEFAULT_LOCAL_WORKER_URL);
  const [localRenderProvider, setLocalRenderProvider] = useState(DEFAULT_LOCAL_RENDER_PROVIDER);
  const [localRenderBusy, setLocalRenderBusy] = useState(false);
  const [localRenderAction, setLocalRenderAction] = useState("");
  const [localRenderNotice, setLocalRenderNotice] = useState({ type: "idle", message: "С телефона жми розовые кнопки очереди. После нажатия статус появится здесь." });
  const [localRenderJobs, setLocalRenderJobs] = useState({});
  const [localAgentToken, setLocalAgentToken] = useState("");
  const [localQueueJobs, setLocalQueueJobs] = useState({});
  const [localHistoryJobs, setLocalHistoryJobs] = useState([]);
  const [pcCommandInput, setPcCommandInput] = useState("");
  const [pcCommandJobs, setPcCommandJobs] = useState([]);
  const [localAgentStatus, setLocalAgentStatus] = useState(null);
  const [projectSessionId, setProjectSessionId] = useState("");
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
  const lockedProductionBible = useMemo(
    () => normalizeProductionBible(productionBible, { stylePreset, styleProfile }),
    [productionBible, stylePreset, styleProfile]
  );
  const bibleScanActive = bibleAction === "working";
  const bibleForReadiness = useMemo(
    () => (bibleScanActive ? createDefaultProductionBible() : lockedProductionBible),
    [bibleScanActive, lockedProductionBible]
  );
  const referenceReadiness = useMemo(() => productionReferenceReadiness(bibleForReadiness), [bibleForReadiness]);
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
  const voiceTiming = useMemo(() => scriptVoiceTimingInfo(script, effectiveDuration), [script, effectiveDuration]);
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
    productionBible: lockedProductionBible,
  }), [projectName, script, aspectRatio, stylePreset, target, expectedFrames, effectiveDuration, frameSeconds, timingMode, partSize, styleProfile, lockedProductionBible]);
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
  const effectiveLocalImageWidth = activeLocalModelPreset.lockDimensions === true ? activeLocalModelPreset.width : localImageWidth;
  const effectiveLocalImageHeight = activeLocalModelPreset.lockDimensions === true ? activeLocalModelPreset.height : localImageHeight;
  const effectiveLocalSteps = activeLocalModelPreset.lockQuality === true ? Math.max(activeLocalModelPreset.steps || 24, localSteps || 24) : localSteps;
  const effectiveLocalCfg = activeLocalModelPreset.lockQuality === true ? (activeLocalModelPreset.cfg || localCfg) : localCfg;
  const localAgentHealth = useMemo(() => agentHealthInfo(localAgentStatus, queueClock), [localAgentStatus, queueClock]);
  const localAgentQueue = useMemo(() => agentQueueInfo(localAgentStatus, queueClock), [localAgentStatus, queueClock]);
  const localProductionReadiness = useMemo(() => productionReadinessInfo(localAgentStatus, queueClock), [localAgentStatus, queueClock]);
  const refsProgress = useMemo(() => referenceProgressInfo({
    bible: bibleForReadiness,
    localRenderJobs,
    localQueueJobs,
    nowMs: queueClock,
  }), [bibleForReadiness, localRenderJobs, localQueueJobs, queueClock]);
  const usesBaseCheckpoint = /(^|[\\/])sd_xl_base_1\.0\.safetensors$/i.test(String(localCheckpoint || "").trim()) || /^sd_xl_base_1\.0\.safetensors$/i.test(String(localCheckpoint || "").trim());

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

  function buildLocalFramePrompt(scene, partIndex, localIndex, partLength, referenceAnchor = null) {
    if (!scene) return "";
    const frameBible = storyboard?.production_bible || productionBible;
    const sourceRaw = scene.script_line_ru || scene.vo_ru || scene.description_ru || "";
    const visualRaw = scene.visual_beat_en || scene.image_prompt_en || scene.visual_beat_ru || scene.description_ru || "";
    let scriptLine = scriptBeatPromptEnglish(sourceRaw, frameBible, "current scripted beat");
    const visualBeat = scriptBeatPromptEnglish(visualRaw, frameBible, "literal storyboard shot");
    if (isWeakPromptText(scriptLine) && !isWeakPromptText(visualBeat)) scriptLine = visualBeat;
    const storyboardAllowedCharacters = promptList(scene.allowed_characters);
    const allowedCharacters = deriveFrameCharactersFromScript(`${sourceRaw} ${visualRaw}`, storyboardAllowedCharacters, frameBible);
    const storyboardAllowedObjects = promptList(scene.allowed_objects);
    const storyboardAllowedLocation = promptList(scene.allowed_location) || promptList(storyboard?.location_lock?.main || "");
    const allowedObjects = deriveFrameAllowedObjectsFromScript({
      source: sourceRaw,
      visualBeat: visualRaw,
      baseAllowed: storyboardAllowedObjects,
    });
    const allowedLocation = deriveFrameAllowedLocationFromScript({
      source: sourceRaw,
      visualBeat: visualRaw,
      baseLocation: storyboardAllowedLocation,
    });
    const forbidden = toPromptEnglish(deriveFrameForbiddenVisuals({
      source: sourceRaw,
      visualBeat: visualRaw,
      allowedCharacters,
      baseForbidden: scene.forbidden_visuals || "",
    }), { fallback: "" });
    const exactVisibleText = exactTextLine(scene.on_screen_text || []);
    const style = compactStyleLine(storyboard?.style_bible || storyboard?.global_style_lock || styleProfile?.style_lock || "");
    const locationLock = toPromptEnglish(formatLocationLock(storyboard), { fallback: "" });
    const noPeopleRule = allowedCharacters
      ? `Allowed characters in this frame only: ${allowedCharacters}. Preserve exact actor identity and wardrobe if visible. Do not render any other cast-lock character.`
      : "Allowed characters in this frame: none. Keep this frame empty of people, faces, silhouettes, hands, reflections and passersby.";

    return `Generate ONE standalone vertical 9:16 cinematic frame, not a collage and not a storyboard sheet.
This is PART ${partIndex + 1}, frame ${localIndex + 1} of ${partLength}. The app will assemble the grid later.

SOURCE OF TRUTH:
${scriptLine}

VISUAL BEAT:
${visualBeat}
${exactVisibleText ? `\n${exactVisibleText}` : ""}

FRAME RULES:
Render only the current source line. Do not advance to later story beats.
${noPeopleRule}
Current-frame object scope: ${allowedObjects}.
Current-frame location scope: ${allowedLocation}.
Forbidden: ${forbidden || "no extra actors, no new props, no new rooms, no new era, no captions, no UI, no watermark"}.
${SCRIPT_LITERAL_GATE}
Production bible: ${formatProductionBibleForPrompt(frameBible, { includeReferences: false }) || "use storyboard locks only"}.

VISUAL REFERENCE ANCHOR:
${referenceAnchorPromptLine(referenceAnchor)}
If the anchor conflicts with the source line, the source line wins. Never turn a scripted ordinary person into a hooded robe, cult figure, anonymous masked stranger or different genre costume unless the exact source line says so.

CONTINUITY:
Same trailer / short film as all other frames. Preserve cast identity only when this frame explicitly includes that character. Preserve scripted geography, lighting family, color grade and realism.
Cast lock is an identity reference only, not a subject list. Never add a recurring character just because they exist elsewhere in the storyboard.
${locationLock ? `Location lock reference: ${locationLock}` : ""}

STYLE:
${style || "photoreal cinematic documentary horror, real camera still, practical location light, realistic skin and fabric, restrained grain"}.

QUALITY LOCK:
Full-resolution sharp production still. Keep the main subject, props, hands, readable surfaces and scripted evidence tack-sharp with visible skin pores, fabric fibers, metal scratches, dust, wet surfaces and micro-contrast. No soft focus over the whole image, no smeared faces, no low-detail background, no waxy plastic skin, no AI blur, no compression-looking artifacts.

FINAL CHECK:
One clean unlabeled 9:16 live-action frame. No grid, no labels, no F01/F02/F03/F04, no captions, no border, no title bar.`;
  }

  function updateLocalRenderJob(partIndex, patch) {
    setLocalRenderJobs((prev) => ({
      ...prev,
      [partIndex]: { ...(prev[partIndex] || {}), ...patch },
    }));
  }

  function applyReferenceJobImage(job = {}) {
    const ref = decodeReferenceJobIndex(job.part_index);
    if (!ref || !job.image_data) return false;
    const referenceName = `${job.part_label || "AUTO REF"}.${dataUrlImageExtension(job.image_data)}`;
    setProductionBible((prev) => {
      const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
      if (ref.kind === "character") {
        next.characters = next.characters.map((item, i) => i === ref.index ? { ...item, reference: job.image_data, referenceName } : item);
      } else if (ref.kind === "location") {
        next.locations = next.locations.map((item, i) => i === ref.index ? { ...item, reference: job.image_data, referenceName } : item);
      } else if (ref.kind === "style") {
        next.style = { ...next.style, reference: job.image_data, referenceName };
      }
      return next;
    });
    updateLocalRenderJob(job.part_index, { status: "done", message: "auto ref загружен" });
    return true;
  }

  function buildReferenceLocalPayload(prompt, meta = {}) {
    const isCharacterRef = meta.kind === "character";
    const isLocationRef = meta.kind === "location";
    const productionRefPrompt = cleanText(`${prompt}

REFERENCE PRODUCTION QUALITY LOCK:
Generate this as a high-resolution production reference board for later IPAdapter use, not a draft preview. Every panel must be sharp enough to reuse as an identity/location anchor. Preserve micro-detail, clear silhouettes, readable material texture, stable proportions and clean separation between reference panels. Avoid muddy haze, low-detail faces, smeared fur, soft full-frame blur, compression artifacts and tiny unreadable thumbnails.`);
    const payload = buildLocalRenderPayload({
      prompt: productionRefPrompt,
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
    payload.render_mode = "reference";
    payload.reference_kind = meta.kind;
    payload.reference_index = meta.index;
    payload.reference_id = meta.id || "";
    payload.production_bible = stripProductionBibleImages(meta.bible || lockedProductionBible);
    payload.seed = stableSeedFromText(`${projectName || "trailer"}|${script}|auto-reference|${meta.kind}|${meta.index}|${productionRefPrompt}`);
    payload.filename_prefix = `neurocine_${meta.kind || "ref"}_${meta.index || 0}`;
    if (isCharacterRef || isLocationRef) {
      payload.production_quality = "production_reference_hires";
      payload.workflow_mode = "sdxl_hires";
      payload.reference_mode = "none";
      payload.pixel_upscale = true;
      payload.upscale_model = payload.upscale_model || "RealESRGAN_x4plus.pth";
      payload.final_downscale_method = payload.final_downscale_method || "lanczos";
      payload.required_models = {
        ...(payload.required_models || {}),
        checkpoint: payload.checkpoint,
        upscale_model: payload.upscale_model,
        production_quality: "production_reference_hires",
      };
      payload.width = 1792;
      payload.height = 1008;
      payload.base_width = 1536;
      payload.base_height = 864;
      payload.steps = Math.max(44, Number(payload.steps || 0));
      payload.hires_steps = Math.max(22, Number(payload.hires_steps || 0));
      payload.hires_sampler_name = payload.hires_sampler_name || "dpmpp_sde";
      payload.hires_scheduler = payload.hires_scheduler || "karras";
      payload.sampler_name = payload.sampler_name || "dpmpp_sde";
      payload.scheduler = payload.scheduler || "karras";
      payload.cfg_scale = Number(payload.cfg_scale || payload.cfg || 4.4);
      payload.reference_output_format = "png";
      payload.reference_lossless = true;
    }
    if (isCharacterRef) {
      payload.render_mode = "character_reference_sheet";
      payload.hires_denoise = Math.min(0.2, Number(payload.hires_denoise || 0.2));
      payload.negative_prompt = characterReferenceNegativePrompt();
    }
    if (isLocationRef) {
      payload.render_mode = "location_reference_board";
      payload.hires_denoise = Math.min(0.18, Number(payload.hires_denoise || 0.18));
      payload.negative_prompt = characterReferenceNegativePrompt();
    }
    return payload;
  }

  function buildReferenceJobs(bibleOverride = null, options = {}) {
    const includeStyle = options.includeStyle === true;
    const normalized = normalizeProductionBible(bibleOverride || lockedProductionBible, { stylePreset, styleProfile });
    const jobs = [];
    (Array.isArray(normalized.characters) ? normalized.characters : []).forEach((item, index) => {
      if (!cleanText(item?.name || item?.role || item?.identity || item?.referenceName || item?.referencePrompt)) return;
      const prompt = item.referencePrompt || buildCharacterReferencePrompt(item, normalized);
      if (!prompt || item.reference) return;
      const payload = buildReferenceLocalPayload(prompt, { kind: "character", index, id: item.id, bible: normalized });
      jobs.push({
        part_index: referenceJobIndex("character", index),
        part_label: `REF CHAR ${index + 1}`,
        provider: localRenderProvider,
        prompt,
        negative_prompt: payload.negative_prompt,
        payload,
      });
    });
    (Array.isArray(normalized.locations) ? normalized.locations : []).forEach((item, index) => {
      if (!cleanText(item?.name || item?.description || item?.referenceName || item?.referencePrompt)) return;
      const prompt = item.referencePrompt || buildLocationReferencePrompt(item, normalized);
      if (!prompt || item.reference) return;
      const payload = buildReferenceLocalPayload(prompt, { kind: "location", index, id: item.id, bible: normalized });
      jobs.push({
        part_index: referenceJobIndex("location", index),
        part_label: `REF LOC ${index + 1}`,
        provider: localRenderProvider,
        prompt,
        negative_prompt: payload.negative_prompt,
        payload,
      });
    });
    const stylePrompt = includeStyle ? (normalized.style?.referencePrompt || buildStyleReferencePrompt(normalized, script)) : "";
    if (includeStyle && stylePrompt && !normalized.style?.reference) {
      const payload = buildReferenceLocalPayload(stylePrompt, { kind: "style", index: 0, id: "STYLE", bible: normalized });
      jobs.push({
        part_index: referenceJobIndex("style", 0),
        part_label: "REF STYLE",
        provider: localRenderProvider,
        prompt: stylePrompt,
        negative_prompt: payload.negative_prompt,
        payload,
      });
    }
    return jobs;
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

  function buildCurrentLocalPayload(prompt, partIndex = safePart) {
    const part = parts[partIndex] || [];
    const layout = gridLayoutFor(part.length || partSize);
    const payload = buildLocalRenderPayload({
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
    payload.production_bible = stripProductionBibleImages(lockedProductionBible);
    payload.project_session_id = projectSessionId;
    payload.reference_readiness = {
      required_total: referenceReadiness.requiredTotal,
      ready_total: referenceReadiness.readyTotal,
      missing_total: referenceReadiness.missingTotal,
      missing: referenceReadiness.missingLabels,
    };
    payload.reference_assets = {
      characters: filledProductionCharacters(lockedProductionBible).map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        reference_name: item.referenceName || "",
        has_reference: Boolean(item.reference),
      })),
      locations: filledProductionLocations(lockedProductionBible).map((item) => ({
        id: item.id,
        name: item.name,
        reference_name: item.referenceName || "",
        has_reference: Boolean(item.reference),
      })),
      style: {
        reference_name: lockedProductionBible.style?.referenceName || "",
        has_reference: Boolean(lockedProductionBible.style?.reference),
      },
    };
    payload.identity_seed = stableSeedFromText(`${projectName || storyboard?.project_name || "trailer"}|${script}|${storyboard?.character_lock ? JSON.stringify(storyboard.character_lock) : ""}|${productionBibleSeedText(lockedProductionBible)}`);
    payload.seed = payload.identity_seed;
    if (part.length) {
      payload.render_mode = "frames_grid";
      payload.grid_cols = layout.cols;
      payload.grid_rows = layout.rows;
      payload.part_size = part.length;
      const referenceBank = {};
      const bankAnchor = (anchor = null) => {
        if (!anchor?.image_data) return anchor;
        const key = `${anchor.kind || "ref"}:${anchor.id || anchor.reference_name || anchor.name || Object.keys(referenceBank).length}`;
        if (!referenceBank[key]) referenceBank[key] = { ...anchor };
        return { ...anchor, image_data: "", bank_key: key };
      };
      payload.frames = part.map((scene, localIndex) => {
        const referenceAnchors = referenceAnchorsForFrame(scene, lockedProductionBible).map(bankAnchor).filter(Boolean);
        const referenceAnchor = referenceAnchors.find((item) => item.kind === "character")
          || referenceAnchors.find((item) => item.kind === "location")
          || referenceAnchors[0]
          || null;
        return {
          id: scene.id || frameId(partIndex * partSize + localIndex + 1),
          label: frameLabel(scene, partIndex * partSize + localIndex),
          prompt: buildLocalFramePrompt(scene, partIndex, localIndex, part.length, referenceAnchors),
          source_line: scene.script_line_ru || scene.vo_ru || scene.description_ru || "",
          visual_beat: scene.visual_beat_en || scene.visual_beat_ru || scene.description_ru || "",
          reference_anchor: referenceAnchor,
          reference_anchors: referenceAnchors,
        };
      });
      payload.reference_bank = referenceBank;
    }
    return payload;
  }

  function ensureProductionReferencesReadyForRender(partIndexes = []) {
    if (referenceReadiness.ready) return true;
    const missing = referenceReadiness.missingLabels.slice(0, 6).join(", ");
    const extra = referenceReadiness.missingLabels.length > 6 ? ` и ещё ${referenceReadiness.missingLabels.length - 6}` : "";
    const message = `PART не запущен: refs не готовы (${referenceReadiness.readyTotal}/${referenceReadiness.requiredTotal}). Не хватает: ${missing}${extra}. Сначала нажми “В очередь refs” и дождись загрузки ref.`;
    setError(message);
    setStatus("Сначала нужны refs для персонажей и локаций.");
    setLocalRenderNotice({ type: "error", message });
    (Array.isArray(partIndexes) ? partIndexes : [partIndexes]).forEach((partIndex) => {
      if (Number.isFinite(Number(partIndex))) updateLocalRenderJob(Number(partIndex), { status: "error", message: "refs не готовы" });
    });
    return false;
  }

  async function copyLocalAgentCommand() {
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    const command = localAgentCommand
      .replace(localAgentToken || "PASTE_AGENT_TOKEN", token)
      .replace("PASTE_AGENT_TOKEN", token);
    try {
      await navigator.clipboard.writeText(command);
      setStatus("Команда локального агента скопирована");
      setLocalRenderNotice({ type: "success", message: `Команда агента скопирована. Token сайта: ${token.slice(0, 8)}...${token.slice(-6)}.` });
    } catch (e) {
      setStatus("Команду агента можно скопировать вручную из блока ниже");
      setLocalRenderNotice({ type: "warn", message: "Браузер не дал скопировать команду. Скопируй строку из блока команды вручную." });
    }
  }

  function changeLocalAgentToken(value) {
    setLocalAgentToken(savePersistentLocalAgentToken(value));
  }

  async function refreshLocalQueueJobs(quiet = false) {
    const entries = Object.values(localQueueJobs || {}).filter((job) => job?.id);
    if (!localAgentToken) return;
    if (!quiet) setLocalRenderAction("refresh");
    if (!quiet) setLocalRenderNotice({ type: "working", message: "Обновляю очередь агента..." });
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          agent_token: localAgentToken,
          project_session_id: projectSessionId,
          ids: entries.map((job) => job.id),
        }),
      }, 30000);
      if (data.agent !== undefined) setLocalAgentStatus(data.agent || null);
      const nextJobs = {};
      for (const job of data.jobs || []) {
        if (projectSessionId && job.project_session_id !== projectSessionId) continue;
        nextJobs[job.part_index] = job;
        if (job.status === "done" && job.image_data && applyReferenceJobImage(job)) {
          // Reference image was applied to production bible.
        } else if (job.status === "done" && job.image_data) {
          setGridUploads((prev) => ({ ...prev, [job.part_index]: job.image_data }));
          updateLocalRenderJob(job.part_index, { status: "done", message: "агент вернул сетку" });
        } else if (job.status === "failed") {
          updateLocalRenderJob(job.part_index, { status: "error", message: job.error || "ошибка агента" });
        } else {
          updateLocalRenderJob(job.part_index, {
            status: job.status === "running" ? "rendering" : "queued",
            message: job.status === "running" ? "агент рендерит..." : "в очереди",
          });
        }
      }
      setLocalQueueJobs(nextJobs);
      setQueueClock(Date.now());
      if (!quiet) setStatus(`Очередь обновлена: ${Object.keys(nextJobs).length} заданий`);
      if (!quiet) setLocalRenderNotice({ type: "success", message: `Очередь обновлена: ${Object.keys(nextJobs).length} заданий.` });
      return data;
    } catch (e) {
      if (!quiet) setError(`Не удалось обновить очередь: ${e.message}`);
      if (!quiet) setLocalRenderNotice({ type: "error", message: `Не удалось обновить очередь: ${e.message}` });
      return null;
    } finally {
      if (!quiet) setLocalRenderAction("");
    }
  }

  async function refreshLocalAgentStatusNow(tokenOverride = "") {
    const explicitToken = String(tokenOverride || "").trim();
    const token = explicitToken ? savePersistentLocalAgentToken(explicitToken) : getPersistentLocalAgentToken(localAgentToken);
    if (!token) return null;
    if (localAgentToken !== token) setLocalAgentToken(token);
    const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        agent_token: token,
        project_session_id: projectSessionId,
        ids: [],
      }),
    }, 30000);
    if (data.agent !== undefined) setLocalAgentStatus(data.agent || null);
    if (Array.isArray(data.jobs)) {
      const nextJobs = {};
      for (const job of data.jobs) {
        if (projectSessionId && job.project_session_id !== projectSessionId) continue;
        nextJobs[job.part_index] = job;
        if (job.status === "done" && job.image_data && applyReferenceJobImage(job)) {
          updateLocalRenderJob(job.part_index, { status: "done", message: "ref загружен в библиотеку" });
        } else if (job.status === "done" && job.image_data) {
          setGridUploads((prev) => ({ ...prev, [job.part_index]: job.image_data }));
          updateLocalRenderJob(job.part_index, { status: "done", message: "агент вернул сетку" });
        } else if (job.status === "failed") {
          updateLocalRenderJob(job.part_index, { status: "error", message: job.error || "ошибка агента" });
        } else if (job.status === "running") {
          updateLocalRenderJob(job.part_index, { status: "rendering", message: job.progress_message || "агент рендерит..." });
        } else if (job.status === "queued") {
          updateLocalRenderJob(job.part_index, { status: "queued", message: "в очереди" });
        }
      }
      setLocalQueueJobs(nextJobs);
    }
    setQueueClock(Date.now());
    return data.agent || null;
  }

  async function discoverOnlineLocalAgent() {
    const currentAgent = await refreshLocalAgentStatusNow().catch(() => null);
    const currentHealth = agentHealthInfo(currentAgent || localAgentStatus, Date.now());
    if (currentHealth.status === "online") return currentAgent;

    const authToken = await getAuthToken();
    if (!authToken) return currentAgent;
    const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ action: "discover_agents" }),
    }, 30000);
    const agents = Array.isArray(data.agents) ? data.agents : [];
    const match = agents.find((item) => item?.agent?.worker_ok === true) || agents.find((item) => item?.agent?.online === true);
    const token = String(match?.token || "").trim();
    if (!token) return currentAgent;
    savePersistentLocalAgentToken(token);
    setLocalAgentToken(token);
    setLocalRenderNotice({ type: "working", message: `Найден активный ПК-агент: ${token.slice(0, 8)}...${token.slice(-6)}. Подключаю телефон к нему...` });
    return refreshLocalAgentStatusNow(token);
  }

  async function loadLocalRenderHistory() {
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    setLocalRenderAction("history");
    setLocalRenderNotice({ type: "working", message: "Загружаю историю готовых PART..." });
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "history",
          agent_token: token,
          limit: 8,
        }),
      }, 30000);
      const jobs = Array.isArray(data.jobs)
        ? data.jobs.filter((job) => job.image_data && Number(job.part_index || 0) >= 0)
        : [];
      setLocalHistoryJobs(jobs);
      setLocalRenderNotice({
        type: jobs.length ? "success" : "warn",
        message: jobs.length ? `История загружена: ${jobs.length} готовых сеток.` : "История пуста для этого token.",
      });
    } catch (e) {
      setLocalRenderNotice({ type: "error", message: `История не загружена: ${e.message}` });
    } finally {
      setLocalRenderAction("");
    }
  }

  function parsePcCommandText(value = "") {
    const text = cleanText(value).toLowerCase();
    if (!text) return "";
    if ((text.includes("включ") || text.includes("разбуд")) && (text.includes("пк") || text.includes("комп"))) return "wake_pc";
    if (text.includes("сон") || text.includes("спать") || text.includes("усып") || text.includes("sleep")) return "sleep_pc";
    if (text.includes("перезагруз") && (text.includes("пк") || text.includes("комп") || text.includes("windows"))) return "reboot_pc";
    if ((text.includes("перезап") || text.includes("рестарт")) && text.includes("агент")) return "restart_agent";
    if ((text.includes("перезап") || text.includes("рестарт")) && (text.includes("comfy") || text.includes("комфи") || text.includes("генератор"))) return "restart_comfyui";
    if ((text.includes("запуст") || text.includes("старт")) && (text.includes("comfy") || text.includes("комфи") || text.includes("генератор"))) return "start_comfyui";
    if ((text.includes("установ") || text.includes("скач") || text.includes("докач")) && (text.includes("production") || text.includes("продак") || text.includes("модел") || text.includes("ноды") || text.includes("nodes") || text.includes("ipadapter") || text.includes("upscale"))) return "install_production";
    if (text.includes("production") || text.includes("продак") || text.includes("модел") || text.includes("ноды") || text.includes("nodes") || text.includes("ipadapter") || text.includes("upscale")) return "production_check";
    if (text.includes("пров") || text.includes("статус") || text.includes("связ")) return "status";
    return "";
  }

  async function refreshPcCommandHistory(quiet = false) {
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (!token) return;
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "command_history",
          agent_token: token,
          limit: 3,
        }),
      }, 30000);
      setPcCommandJobs(Array.isArray(data.commands) ? data.commands : []);
      setQueueClock(Date.now());
    } catch (e) {
      if (!quiet) setLocalRenderNotice({ type: "error", message: `Команды ПК не обновились: ${e.message}` });
    }
  }

  async function clearPcCommandHistory() {
    const token = getPersistentLocalAgentToken(localAgentToken);
    const authToken = await getAuthToken();
    if (!authToken) {
      setLocalRenderNotice({ type: "error", message: "Для очистки истории команд нужно войти через Google." });
      return;
    }
    setLocalRenderAction("pc-clear-history");
    setLocalRenderNotice({ type: "working", message: "Очищаю историю команд ПК..." });
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "clear_command_history",
          agent_token: token,
        }),
      }, 30000);
      setPcCommandJobs([]);
      const cleared = Number(data.cleared_count || 0);
      setLocalRenderNotice({ type: "success", message: cleared ? `История команд очищена: ${cleared} записей.` : "История команд уже пустая." });
    } catch (e) {
      setLocalRenderNotice({ type: "error", message: `История команд не очищена: ${e.message}` });
    } finally {
      setLocalRenderAction("");
    }
  }

  async function sendPcCommand(commandId, label = "") {
    const command = String(commandId || "").trim();
    if (!command) return;
    if (command === "wake_pc") {
      setLocalRenderNotice({ type: "warn", message: "Включить полностью выключенный ПК сайт не может. Для этого нужен Wake-on-LAN, BIOS/роутер/VPN или умная розетка." });
      return;
    }
    if (command === "sleep_pc" && typeof window !== "undefined" && !window.confirm("Отправить ПК в сон через 5 секунд? Активная генерация может прерваться.")) {
      return;
    }
    if (command === "reboot_pc" && typeof window !== "undefined" && !window.confirm("Перезагрузить ПК через 15 секунд? Активная генерация прервётся.")) {
      return;
    }
    if (command === "install_production" && typeof window !== "undefined" && !window.confirm("Установить production-компоненты на ПК? Это может скачать несколько больших файлов и занять время.")) {
      return;
    }
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    const authToken = await getAuthToken();
    if (!authToken) {
      setLocalRenderNotice({ type: "error", message: "Для команды ПК нужно войти через Google." });
      return;
    }
    const actionName = `pc-${command}`;
    setLocalRenderAction(actionName);
    setLocalRenderNotice({ type: "working", message: `${label || "Команда ПК"} отправляется агенту...` });
    try {
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "create_command",
          agent_token: token,
          command,
          project_session_id: projectSessionId,
        }),
      }, 30000);
      const next = data.command ? [data.command, ...pcCommandJobs.filter((job) => job.id !== data.command.id)].slice(0, 3) : pcCommandJobs;
      setPcCommandJobs(next);
      setLocalRenderNotice({ type: "success", message: `Команда создана: ${data.command?.command_label || label || command}. Агент заберёт её при следующем опросе.` });
      setPcCommandInput("");
    } catch (e) {
      setLocalRenderNotice({ type: "error", message: `Команда ПК не создана: ${e.message}` });
    } finally {
      setLocalRenderAction("");
    }
  }

  async function sendPcCommandFromText() {
    const command = parsePcCommandText(pcCommandInput);
    if (!command) {
      setLocalRenderNotice({ type: "warn", message: "Не понял команду. Напиши: проверь ПК, проверь production, запусти ComfyUI, перезапусти ComfyUI, перезапусти агента или перезагрузи ПК." });
      return;
    }
    const item = PC_COMMANDS.find((x) => x.id === command);
    await sendPcCommand(command, item?.label || pcCommandInput);
  }

  function insertHistoryJob(job = {}) {
    if (!job.image_data) return;
    const partIndex = Math.max(0, Number(job.part_index || 0));
    setGridUploads((prev) => ({ ...prev, [partIndex]: job.image_data }));
    setActivePart(partIndex);
    setSelectedFrameIndex(0);
    setCroppedFrame("");
    setLocalRenderNotice({ type: "success", message: `${job.part_label || `PART ${partIndex + 1}`} вставлен из истории.` });
  }

  function resetGeneratedLayer(nextSessionId = makeProjectSessionId()) {
    setProjectSessionId(nextSessionId);
    setStoryboard(null);
    setGridUploads({});
    setCroppedFrame("");
    setActivePart(0);
    setSelectedFrameIndex(0);
    setLocalRenderJobs({});
    setLocalQueueJobs({});
    setLocalHistoryJobs([]);
  }

  function handleScriptChange(value) {
    setScript(value);
    resetGeneratedLayer();
    setProductionBible(createDefaultProductionBible());
    setScriptNotice({ type: "idle", message: value.trim() ? "Сценарий изменён вручную." : "" });
    setBibleAction("");
    setBibleNotice({ type: "idle", message: "Сценарий изменён. Старая библия/refs очищены. Собери новую библию/JSON." });
    setLocalRenderNotice({ type: "idle", message: "Сценарий изменён: старая очередь скрыта для этого проекта, refs нужно собрать заново." });
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TRAILER_DRAFT_KEY);
      if (!raw) {
        setLocalAgentToken(getPersistentLocalAgentToken());
        setProjectSessionId(makeProjectSessionId());
        setDraftReady(true);
        return;
      }
      const draft = JSON.parse(raw);
      setProjectSessionId(draft.projectSessionId || makeProjectSessionId());
      if (draft.projectName !== undefined) setProjectName(draft.projectName);
      if (draft.script !== undefined) setScript(draft.script);
      if (draft.duration) setDuration(Number(draft.duration));
      if (draft.frameSeconds) setFrameSeconds(Number(draft.frameSeconds));
      if (typeof draft.autoTiming === "boolean") setAutoTiming(draft.autoTiming);
      if (draft.customFrameCount) setCustomFrameCount(Number(draft.customFrameCount));
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.target) setTarget(draft.target);
      if (draft.stylePreset) setStylePreset(draft.stylePreset);
      if (draft.productionBible) setProductionBible(normalizeProductionBible(draft.productionBible, { stylePreset: draft.stylePreset || "" }));
      if (draft.partSize) setPartSize(Number(draft.partSize));
      if (draft.storyboard?.scenes) setStoryboard(draft.storyboard);
      if (draft.gridUploads && typeof draft.gridUploads === "object") setGridUploads(draft.gridUploads);
      if (Number.isFinite(Number(draft.activePart))) setActivePart(Number(draft.activePart));
      if (Number.isFinite(Number(draft.selectedFrameIndex))) setSelectedFrameIndex(Number(draft.selectedFrameIndex));
      if (Number.isFinite(Number(draft.cropInset))) setCropInset(Number(draft.cropInset));
      if (draft.localWorkerUrl) setLocalWorkerUrl(draft.localWorkerUrl);
      if (draft.localRenderProvider) setLocalRenderProvider(draft.localRenderProvider);
      const savedPreset = draft.localModelPreset || DEFAULT_LOCAL_MODEL_PRESET;
      if (draft.localModelPreset) setLocalModelPreset(savedPreset);
      if (draft.localCheckpoint !== undefined) setLocalCheckpoint(migrateSavedCheckpoint(savedPreset, draft.localCheckpoint));
      if (draft.localLoras !== undefined) setLocalLoras(draft.localLoras);
      if (draft.localWorkflowTemplate !== undefined) setLocalWorkflowTemplate(draft.localWorkflowTemplate);
      if (Number.isFinite(Number(draft.localImageWidth))) setLocalImageWidth(Number(draft.localImageWidth));
      if (Number.isFinite(Number(draft.localImageHeight))) setLocalImageHeight(Number(draft.localImageHeight));
      if (Number.isFinite(Number(draft.localSteps))) setLocalSteps(Number(draft.localSteps));
      if (Number.isFinite(Number(draft.localCfg))) setLocalCfg(Number(draft.localCfg));
      setLocalAgentToken(getPersistentLocalAgentToken(draft.localAgentToken));
      if (draft.localQueueJobs && typeof draft.localQueueJobs === "object") {
        const sessionId = draft.projectSessionId || "";
        const scopedJobs = Object.fromEntries(Object.entries(draft.localQueueJobs).filter(([, job]) => !sessionId || job?.project_session_id === sessionId));
        setLocalQueueJobs(scopedJobs);
      }
      if (draft.lastSavedAt) setLastSavedAt(draft.lastSavedAt);
    } catch {}
    setLocalAgentToken((prev) => getPersistentLocalAgentToken(prev));
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const savedAt = new Date().toISOString();
    const payload = {
      projectName, script, duration, frameSeconds, autoTiming, customFrameCount,
      aspectRatio, target, stylePreset, productionBible: lockedProductionBible, partSize, cropInset, storyboard, activePart,
      selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset,
      localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight,
      localSteps, localCfg, localAgentToken, localQueueJobs, lastSavedAt: savedAt,
      projectSessionId,
    };
    try {
      savePersistentLocalAgentToken(localAgentToken);
      window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
    } catch {
      try {
        window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify({ ...payload, gridUploads: {}, croppedFrame: "", productionBible: stripProductionBibleImages(lockedProductionBible) }));
        setLastSavedAt(savedAt);
      } catch {}
    }
  }, [draftReady, projectName, script, duration, frameSeconds, autoTiming, customFrameCount, aspectRatio, target, stylePreset, lockedProductionBible, partSize, cropInset, storyboard, activePart, selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset, localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight, localSteps, localCfg, localAgentToken, localQueueJobs, projectSessionId]);

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
    const active = Object.values(localQueueJobs || {}).some((job) => job?.status === "queued" || job?.status === "pending" || job?.status === "running");
    const activeCommands = pcCommandJobs.some((job) => job?.status === "queued" || job?.status === "running");
    if (!localAgentToken) return undefined;
    const timer = window.setInterval(() => {
      refreshLocalQueueJobs(true);
      refreshPcCommandHistory(true);
    }, active || activeCommands ? 4000 : 8000);
    refreshLocalQueueJobs(true);
    refreshPcCommandHistory(true);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQueueJobs, pcCommandJobs, localAgentToken, projectSessionId]);

  useEffect(() => {
    const active = Object.values(localQueueJobs || {}).some((job) => job?.status === "queued" || job?.status === "pending" || job?.status === "running");
    const activeCommands = pcCommandJobs.some((job) => job?.status === "queued" || job?.status === "running");
    const hasAgentStatus = Boolean(localAgentStatus?.last_seen_at || localAgentStatus?.updated_at);
    if (!active && !activeCommands && !hasAgentStatus) return undefined;
    const timer = window.setInterval(() => setQueueClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [localQueueJobs, pcCommandJobs, localAgentStatus]);

  function restoreSavedDraft() {
    try {
      const raw = window.localStorage.getItem(TRAILER_DRAFT_KEY);
      if (!raw) {
        setStatus("Сохранённая раскадровка не найдена");
        return;
      }
      const draft = JSON.parse(raw);
      const restoredSessionId = draft.projectSessionId || makeProjectSessionId();
      setProjectSessionId(restoredSessionId);
      if (draft.projectName !== undefined) setProjectName(draft.projectName);
      if (draft.script !== undefined) setScript(draft.script);
      if (draft.duration) setDuration(Number(draft.duration));
      if (draft.frameSeconds) setFrameSeconds(Number(draft.frameSeconds));
      if (typeof draft.autoTiming === "boolean") setAutoTiming(draft.autoTiming);
      if (draft.customFrameCount) setCustomFrameCount(Number(draft.customFrameCount));
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.target) setTarget(draft.target);
      if (draft.stylePreset) setStylePreset(draft.stylePreset);
      if (draft.productionBible) setProductionBible(normalizeProductionBible(draft.productionBible, { stylePreset: draft.stylePreset || stylePreset, styleProfile }));
      if (draft.partSize) setPartSize(Number(draft.partSize));
      if (draft.localWorkerUrl) setLocalWorkerUrl(draft.localWorkerUrl);
      if (draft.localRenderProvider) setLocalRenderProvider(draft.localRenderProvider);
      const savedPreset = draft.localModelPreset || DEFAULT_LOCAL_MODEL_PRESET;
      if (draft.localModelPreset) setLocalModelPreset(savedPreset);
      if (draft.localCheckpoint !== undefined) setLocalCheckpoint(migrateSavedCheckpoint(savedPreset, draft.localCheckpoint));
      if (draft.localLoras !== undefined) setLocalLoras(draft.localLoras);
      if (draft.localWorkflowTemplate !== undefined) setLocalWorkflowTemplate(draft.localWorkflowTemplate);
      if (Number.isFinite(Number(draft.localImageWidth))) setLocalImageWidth(Number(draft.localImageWidth));
      if (Number.isFinite(Number(draft.localImageHeight))) setLocalImageHeight(Number(draft.localImageHeight));
      if (Number.isFinite(Number(draft.localSteps))) setLocalSteps(Number(draft.localSteps));
      if (Number.isFinite(Number(draft.localCfg))) setLocalCfg(Number(draft.localCfg));
      setLocalAgentToken(getPersistentLocalAgentToken(draft.localAgentToken));
      if (draft.localQueueJobs && typeof draft.localQueueJobs === "object") {
        const scopedJobs = Object.fromEntries(Object.entries(draft.localQueueJobs).filter(([, job]) => !restoredSessionId || job?.project_session_id === restoredSessionId));
        setLocalQueueJobs(scopedJobs);
      } else {
        setLocalQueueJobs({});
      }
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
      aspectRatio, target, stylePreset, productionBible: lockedProductionBible, partSize, cropInset, storyboard, activePart,
      selectedFrameIndex, gridUploads, localWorkerUrl, localRenderProvider, localModelPreset,
      localCheckpoint, localLoras, localWorkflowTemplate, localImageWidth, localImageHeight,
      localSteps, localCfg, localAgentToken, localQueueJobs, lastSavedAt: savedAt,
      projectSessionId,
    };
    try {
      window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
      setStatus(storyboard?.scenes ? `Сохранено локально: ${storyboard.scenes.length} кадров` : "Настройки сохранены локально");
    } catch {
      try {
        window.localStorage.setItem(TRAILER_DRAFT_KEY, JSON.stringify({ ...payload, gridUploads: {}, productionBible: stripProductionBibleImages(lockedProductionBible) }));
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

  async function requestClearLocalQueue({ token, sessionId, all = false, skipWithoutAuth = false } = {}) {
    const agentToken = getPersistentLocalAgentToken(token || localAgentToken);
    const authToken = await getAuthToken();
    if (!authToken) {
      if (skipWithoutAuth) return { ok: false, skipped: true, cleared_count: 0 };
      throw new Error("Для очистки облачной очереди нужно войти через Google.");
    }
    return fetchJsonWithTimeout("/api/trailer/local-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "clear",
        agent_token: agentToken,
        project_session_id: sessionId || projectSessionId,
        all,
      }),
    }, 30000);
  }

  async function clearLocalAgentQueue({ all = true, quiet = false } = {}) {
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    if (!quiet) {
      setLocalRenderAction("clear-queue");
      setLocalRenderNotice({ type: "working", message: all ? "Отменяю все активные задания ПК..." : "Отменяю задания текущего проекта..." });
    }
    try {
      const data = await requestClearLocalQueue({ token, sessionId: projectSessionId, all });
      setLocalQueueJobs({});
      setLocalRenderJobs({});
      if (!quiet) {
        const cleared = Number(data.cleared_count || 0);
        setStatus(cleared ? `Очередь ПК очищена: отменено ${cleared} заданий.` : "Активных заданий ПК нет.");
        setLocalRenderNotice({ type: "success", message: cleared ? `Очередь ПК очищена: ${cleared} заданий отменено.` : "Активных заданий ПК нет." });
      }
      return data;
    } catch (e) {
      if (!quiet) {
        setError(`Очередь ПК не очищена: ${e.message}`);
        setLocalRenderNotice({ type: "error", message: `Очередь ПК не очищена: ${e.message}` });
      }
      return null;
    } finally {
      if (!quiet) setLocalRenderAction("");
    }
  }

  async function resetAll() {
    const oldToken = getPersistentLocalAgentToken(localAgentToken);
    const oldSessionId = projectSessionId;
    window.localStorage.removeItem(TRAILER_DRAFT_KEY);
    setProjectName("");
    setScript("");
    setProjectSessionId(makeProjectSessionId());
    setDuration(87);
    setFrameSeconds(3);
    setAutoTiming(true);
    setCustomFrameCount(27);
    setAspectRatio("9:16");
    setTarget("grok");
    setStylePreset("psychologicalDread");
    setProductionBible(createDefaultProductionBible());
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
    setLocalRenderAction("");
    setLocalRenderNotice({ type: "idle", message: "Проект очищен. Создай storyboard JSON, потом ставь PART в очередь." });
    setLocalRenderJobs({});
    setLocalAgentToken(getPersistentLocalAgentToken(localAgentToken));
    setLocalQueueJobs({});
    setLocalAgentStatus(null);
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
    setScriptNotice({ type: "idle", message: "" });
    setBibleAction("");
    setBibleNotice({ type: "idle", message: "Проект очищен. Вставь сценарий и нажми “Собрать из сценария”." });
    setStatus("Всё очищено: сценарий, раскадровка, PART-сетки, кроп и локальное сохранение");
    requestClearLocalQueue({ token: oldToken, sessionId: oldSessionId, all: true, skipWithoutAuth: true }).catch(() => {});
  }

  async function buildProductionBibleFromAi(source, baseBible = productionBible, options = {}) {
    const cleanSource = cleanText(source);
    try {
      const token = await getAuthToken();
      const data = await fetchJsonWithTimeout("/api/trailer/bible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: projectName,
          project_name: projectName,
          script: cleanSource,
          duration: effectiveDuration,
          frame_count: expectedFrames,
          frame_seconds: frameSeconds,
          target,
          style: stylePreset,
          style_label: styleLabelRu(stylePreset, styleProfile?.label || stylePreset),
          style_lock: styleProfile?.style_lock || STYLE_PRESETS[stylePreset]?.lock || "",
          current_bible: stripProductionBibleImages(baseBible),
        }),
      }, 120000);
      if (!data.ok || !data.bible) throw new Error(data.error || "AI не вернул production bible");
      const aiBible = {
        ...data.bible,
        scriptFingerprint: productionScriptFingerprint(cleanSource),
        autoGenerated: true,
        extractionMode: "ai",
      };
      const merged = mergeProductionBibleReferences(aiBible, baseBible, { stylePreset, styleProfile });
      const charCount = filledProductionCharacters(merged).length;
      const locCount = filledProductionLocations(merged).length;
      if (!charCount && !locCount) throw new Error("AI не нашёл героев/локации в сценарии");
      return {
        bible: merged,
        mode: "ai",
        modelUsed: data.model_used || "",
        charCount,
        locCount,
        notes: data.analysis_notes || [],
      };
    } catch (e) {
      const rawMessage = e.message || "AI-разбор production bible недоступен";
      const authHint = /сессия|session|auth|unauthorized|войд/i.test(rawMessage)
        ? " Сессия истекла: войди заново и повтори AI-разбор."
        : "";
      throw new Error(`AI-разбор production bible не выполнен.${authHint} Причина: ${rawMessage}`);
    }
  }

  async function autoBuildProductionBible() {
    const source = cleanText(script || projectName);
    if (source.length < 3) {
      setBibleAction("empty");
      setBibleNotice({ type: "error", message: "Сначала вставь сценарий или тему. Сейчас системе нечего разбирать." });
      setStatus("Сначала вставь сценарий или тему");
      return;
    }
    setBibleAction("working");
    setBibleNotice({ type: "working", message: "AI сканирует сценарий: персонажи, животные, локации, props и ref-prompts..." });
    setStatus("AI сканирует сценарий для production bible...");
    let result;
    try {
      result = await buildProductionBibleFromAi(source, productionBible);
    } catch (e) {
      setProductionBible(createDefaultProductionBible());
      setStoryboard(null);
      setGridUploads({});
      setCroppedFrame("");
      setBibleAction("error");
      const message = `${e.message}. Запасной режим отключён: мусорные refs не созданы.`;
      setBibleNotice({ type: "error", message });
      setStatus("AI bible не создана. Войди заново или повтори разбор.");
      return;
    }
    const next = result.bible;
    const charCount = result.charCount;
    const locCount = result.locCount;
    setProductionBible(next);
    setStoryboard(null);
    setGridUploads({});
    setCroppedFrame("");
    if (!charCount && !locCount) {
      setBibleAction("empty");
      setBibleNotice({ type: "error", message: "Авто-разбор сработал, но герои/локации не найдены. Проверь, что в поле сценария есть полный текст, а не только название." });
      setStatus("Авто-разбор не нашёл героев/локации");
      return;
    }
    setBibleAction("done");
    setBibleNotice({ type: "success", message: `AI собрал: ${charCount} персонаж./животн., ${locCount} локац. Можно жать “В очередь refs” или “Авто всё”.${result.modelUsed ? ` Модель: ${result.modelUsed}` : ""}` });
    setStatus(`AI-библия проекта готова: ${charCount} персонаж./животн., ${locCount} локац. Ручные поля необязательны.`);
  }

  async function autoBuildAndGenerate() {
    const source = cleanText(script || projectName);
    if (source.length < 10) {
      setBibleAction("empty");
      setBibleNotice({ type: "error", message: "Для “Авто всё” нужен сценарий, не только пустая тема." });
      setStatus("Для “Авто всё” нужен сценарий");
      return;
    }
    setBibleAction("working");
    setBibleNotice({ type: "working", message: "AI собирает production bible, затем refs/storyboard..." });
    setStatus("AI собирает production bible...");
    let result;
    try {
      result = await buildProductionBibleFromAi(source, productionBible);
    } catch (e) {
      setProductionBible(createDefaultProductionBible());
      setStoryboard(null);
      setGridUploads({});
      setCroppedFrame("");
      setBibleAction("error");
      const message = `${e.message}. Авто всё остановлено: запасной режим отключён.`;
      setBibleNotice({ type: "error", message });
      setStatus("Авто всё остановлено: AI bible не создана.");
      return;
    }
    const next = result.bible;
    const charCount = result.charCount;
    const locCount = result.locCount;
    setProductionBible(next);
    setStoryboard(null);
    setGridUploads({});
    setCroppedFrame("");
    setBibleAction("done");
    setBibleNotice({ type: "success", message: `AI собрало: ${charCount} персонаж./животн., ${locCount} локац. Ставлю refs в очередь.` });
    const queued = await queueReferencesForLocalAgent(next, { quiet: false, skipWithoutAuth: false });
    const readiness = productionReferenceReadiness(next);
    if (readiness.requiredTotal && !readiness.ready) {
      const message = queued
        ? `${referenceWaitMessage(readiness)} После готовности нажми “Сгенерировать JSON”.`
        : `${referenceWaitMessage(readiness)} Нажми “В очередь refs” и дождись готовности.`;
      setStatus(message);
      setBibleNotice({ type: "warn", message });
      return;
    }
    await generateTrailer(next);
  }

  function resetProductionBible() {
    setProductionBible(createDefaultProductionBible());
    setStoryboard(null);
    setGridUploads({});
    setCroppedFrame("");
    setBibleAction("");
    setBibleNotice({ type: "idle", message: "Библия очищена. Нажми “Собрать из сценария” для нового проекта." });
    setStatus("Библия проекта очищена");
  }

  function updateProductionCharacter(index, patch) {
    setProductionBible((prev) => {
      const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
      next.characters = next.characters.map((item, i) => i === index ? { ...item, ...patch } : item);
      return next;
    });
  }

  function updateProductionLocation(index, patch) {
    setProductionBible((prev) => {
      const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
      next.locations = next.locations.map((item, i) => i === index ? { ...item, ...patch } : item);
      return next;
    });
  }

  function updateProductionStyle(patch) {
    setProductionBible((prev) => {
      const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
      next.style = { ...next.style, ...patch };
      return next;
    });
  }

  function uploadProductionReference(kind, index, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const reference = String(reader.result || "");
      const referenceName = file.name || "reference image";
      const label = referenceLabelFromFile(referenceName);
      if (kind === "character") {
        setProductionBible((prev) => {
          const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
          const current = next.characters[index] || emptyProductionCharacter(index);
          next.characters = next.characters.map((item, i) => i === index ? {
            ...item,
            reference,
            referenceName,
            name: item.name || label,
            role: item.role || "script character",
          } : item);
          if (!next.characters[index]) next.characters[index] = { ...current, reference, referenceName, name: current.name || label, role: current.role || "script character" };
          return next;
        });
      }
      if (kind === "location") {
        setProductionBible((prev) => {
          const next = normalizeProductionBible(prev, { stylePreset, styleProfile });
          const current = next.locations[index] || emptyProductionLocation(index);
          next.locations = next.locations.map((item, i) => i === index ? {
            ...item,
            reference,
            referenceName,
            name: item.name || label,
          } : item);
          if (!next.locations[index]) next.locations[index] = { ...current, reference, referenceName, name: current.name || label };
          return next;
        });
      }
      if (kind === "style") updateProductionStyle({ reference, referenceName });
      setBibleNotice({ type: "success", message: `Референс загружен: ${referenceName}. Текстовые поля можно не заполнять.` });
      setStatus(`Референс загружен: ${referenceName}. Текстовые поля можно не заполнять.`);
    };
    reader.readAsDataURL(file);
  }

  function clearProductionReference(kind, index = 0) {
    if (kind === "character") updateProductionCharacter(index, { reference: "", referenceName: "" });
    if (kind === "location") updateProductionLocation(index, { reference: "", referenceName: "" });
    if (kind === "style") updateProductionStyle({ reference: "", referenceName: "" });
    setStatus("Референс очищен");
  }

  async function generateScriptFromTopic() {
    const topic = projectName.trim();
    if (topic.length < 3) {
      setError("Сначала введи тему или название проекта.");
      return;
    }

    setScriptBusy(true);
    setError("");
    setScriptNotice({ type: "working", message: "Генерирую сценарий..." });
    setStatus("Генерирую сценарий из темы...");
    resetGeneratedLayer();

    try {
      const token = await getAuthToken();
      const data = await fetchJsonWithTimeout("/api/trailer/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic,
          project_name: topic,
          duration: effectiveDuration,
          frame_seconds: frameSeconds,
          frame_count: expectedFrames,
          style: styleLabelRu(stylePreset, styleProfile?.label || stylePreset),
          target,
        }),
      }, 90000);

      if (!data.text) throw new Error(data.error || "API не вернул сценарий");
      const nextScript = data.text.trim();
      setScript(nextScript);
      setProductionBible(createDefaultProductionBible());
      setBibleAction("");
      const nextVoice = scriptVoiceTimingInfo(nextScript, effectiveDuration);
      const voiceNote = data.word_count
        ? ` Слов: ${data.word_count}, оценка VO: ~${formatDuration(data.estimated_voice_seconds || nextVoice.estimatedSeconds)}.`
        : ` Слов: ${nextVoice.words}, оценка VO: ~${formatDuration(nextVoice.estimatedSeconds)}.`;
      setBibleNotice({
        type: "idle",
        message: "Сценарий готов. Теперь нажми “Собрать из сценария”, чтобы AI отдельно создал персонажей, локации и ref-prompts.",
      });
      setScriptNotice({ type: "success", message: `Сценарий готов: ${nextVoice.words} слов. Текст вставлен в поле сценария.` });
      setStatus(`Сценарий готов под ${formatDuration(effectiveDuration)}.${voiceNote} Жми “Собрать из сценария”.${data.model_used ? ` Модель сценария: ${data.model_used}` : ""}`);
    } catch (e) {
      const message = e.message || "Генерация сценария не удалась";
      setError(message);
      setScriptNotice({ type: "error", message: `Сценарий не создан: ${message}` });
      setStatus("");
      setBibleAction("");
    } finally {
      setScriptBusy(false);
    }
  }

  async function generateTrailer(productionBibleOverride = null) {
    setBusy(true);
    setError("");
    setStatus("Готовлю запрос на трейлерную раскадровку...");
    setActivePart(0);
    setSelectedFrameIndex(0);
    setCroppedFrame("");

    try {
      const baseBible = productionBibleOverride || lockedProductionBible;
      let requestBible = baseBible;
      if (!filledProductionCharacters(baseBible).length && !filledProductionLocations(baseBible).length) {
        setStatus("AI собирает production bible перед JSON...");
        let bibleResult;
        try {
          bibleResult = await buildProductionBibleFromAi(script || projectName, baseBible);
        } catch (bibleError) {
          const message = `${bibleError.message}. JSON не запущен: сначала нужен настоящий AI-разбор bible.`;
          setBibleAction("error");
          setBibleNotice({ type: "error", message });
          setLocalRenderNotice({ type: "error", message });
          throw new Error(message);
        }
        requestBible = bibleResult.bible;
        setProductionBible(requestBible);
        setBibleAction("done");
        setBibleNotice({
          type: "success",
          message: `AI bible перед JSON: ${bibleResult.charCount} персонаж./животн., ${bibleResult.locCount} локац.`,
        });
      } else if (requestBible !== lockedProductionBible) {
        setProductionBible(requestBible);
      }

      const readiness = productionReferenceReadiness(requestBible);
      if (readiness.requiredTotal && !readiness.ready) {
        const message = `${referenceWaitMessage(readiness)} Сначала нажми “В очередь refs” и дождись готовности, потом запускай JSON.`;
        setStatus(message);
        setBibleNotice({ type: "warn", message });
        setLocalRenderNotice({ type: "warn", message });
        return;
      }

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
          production_bible: stripProductionBibleImages(requestBible),
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
        const finalStoryboard = { ...payload.storyboard, production_bible: stripProductionBibleImages(requestBible) };
        setStoryboard(finalStoryboard);
        setStatus(`Готово: ${finalStoryboard.scenes?.length || 0} кадров. Сохранено локально.`);
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
            const finalStoryboard = { ...data.storyboard, production_bible: stripProductionBibleImages(requestBible) };
            setStoryboard(finalStoryboard);
            setStatus(`Готово: ${finalStoryboard.scenes?.length || 0} кадров. Сохранено локально.`);
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
    const requestBible = filledProductionCharacters(lockedProductionBible).length || filledProductionLocations(lockedProductionBible).length
      ? lockedProductionBible
      : extractProductionBibleFromScript(script, lockedProductionBible, { stylePreset, styleProfile });
    if (requestBible !== lockedProductionBible) setProductionBible(requestBible);
    const sb = buildLocalTrailerStoryboard({ script, duration: effectiveDuration, aspectRatio, stylePreset, target, targetFrames: expectedFrames, frameSeconds, timingMode, productionBible: requestBible });
    setStoryboard(sb);
    setStatus(`Локальный тест: ${sb.scenes.length} кадров, ${splitScenesIntoParts(sb.scenes, partSize).length} PART. Сохранено локально.`);
  }

  async function checkLocalRenderWorker() {
    setError("");
    setLocalRenderBusy(true);
    setLocalRenderAction("check");
    setStatus("Проверяю локальный генератор на ПК...");
    setLocalRenderNotice({ type: "working", message: "Проверяю доступность локального генератора..." });
    try {
      const result = await requestLocalWorkerHealth({ workerUrl: localWorkerUrl, provider: localRenderProvider });
      setStatus(`Локальный ПК доступен (${result.mode === "direct" ? "напрямую из браузера" : "через локальный proxy"}).`);
      setLocalRenderNotice({ type: "success", message: `ПК доступен: ${result.mode === "direct" ? "напрямую из браузера" : "через proxy"}.` });
    } catch (e) {
      setError(`Локальный генератор не отвечает: ${e.message}. Запусти WebUI/Forge с --api или NeuroCine worker на этом адресе.`);
      setLocalRenderNotice({ type: "error", message: `ПК не отвечает: ${e.message}` });
    } finally {
      setLocalRenderBusy(false);
      setLocalRenderAction("");
    }
  }

  async function generatePartGridOnLocalPc(partIndex, keepQueueBusy = false) {
    const part = parts[partIndex] || [];
    const prompt = buildPartPromptForIndex(partIndex, true);
    if (!storyboard || !part.length || !prompt) {
      setError("Сначала создай storyboard JSON и выбери PART.");
      setLocalRenderNotice({ type: "error", message: "Сначала создай storyboard JSON и выбери PART." });
      return false;
    }
    if (!ensureProductionReferencesReadyForRender([partIndex])) return false;
    if (!keepQueueBusy) {
      setLocalRenderBusy(true);
      setLocalRenderAction("direct-current");
    }
    setError("");
    setActivePart(partIndex);
    setSelectedFrameIndex(0);
    setCroppedFrame("");
    updateLocalRenderJob(partIndex, { status: "rendering", message: "генерация на ПК..." });
    setStatus(`PART ${partIndex + 1}: отправляю промт на локальный ПК...`);
    setLocalRenderNotice({ type: "working", message: `PART ${partIndex + 1}: отправляю промт на локальный ПК...` });
    try {
      const payload = buildCurrentLocalPayload(prompt, partIndex);
      const result = await requestLocalPartImage({
        workerUrl: localWorkerUrl,
        provider: localRenderProvider,
        payload,
        partIndex,
      });
      setGridUploads((prev) => ({ ...prev, [partIndex]: result.image }));
      updateLocalRenderJob(partIndex, { status: "done", message: result.mode === "direct" ? "готово напрямую" : "готово через proxy" });
      setStatus(`PART ${partIndex + 1}: сетка с локального ПК вставлена в блок.`);
      setLocalRenderNotice({ type: "success", message: `PART ${partIndex + 1}: сетка готова и вставлена в блок.` });
      return true;
    } catch (e) {
      updateLocalRenderJob(partIndex, { status: "error", message: e.message || "ошибка" });
      setError(`PART ${partIndex + 1}: ${e.message || "локальная генерация не удалась"}`);
      setLocalRenderNotice({ type: "error", message: `PART ${partIndex + 1}: ${e.message || "локальная генерация не удалась"}` });
      return false;
    } finally {
      if (!keepQueueBusy) {
        setLocalRenderBusy(false);
        setLocalRenderAction("");
      }
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
    setLocalRenderAction("direct-all");
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
      setLocalRenderAction("");
    }
  }

  async function queuePartsForLocalAgent(partIndexes = []) {
    const actionName = partIndexes.length === 1 ? "queue-current" : "queue-all";
    setLocalRenderAction(actionName);
    setLocalRenderNotice({ type: "working", message: actionName === "queue-current" ? "Нажатие принято: ставлю текущий PART в очередь..." : "Нажатие принято: ставлю все PART в очередь..." });
    if (!parts.length || !storyboard) {
      setLocalRenderAction("");
      setError("Сначала создай storyboard JSON.");
      setLocalRenderNotice({ type: "error", message: "Сначала создай storyboard JSON, потом ставь PART в очередь." });
      return;
    }
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    const indexes = partIndexes.length ? partIndexes : parts.map((_, i) => i);
    if (!ensureProductionReferencesReadyForRender(indexes)) {
      setLocalRenderAction("");
      return;
    }
    let jobs = [];
    try {
      jobs = indexes.map((partIndex) => {
        const part = parts[partIndex] || [];
        const prompt = buildPartPromptForIndex(partIndex, true);
        const payload = buildCurrentLocalPayload(prompt, partIndex);
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
      setLocalRenderAction("");
      setError(`Ошибка настроек модели/workflow: ${e.message}`);
      setLocalRenderNotice({ type: "error", message: `Ошибка настроек модели/workflow: ${e.message}` });
      return;
    }
    if (!jobs.length) {
      setLocalRenderAction("");
      setError("Не удалось собрать PART-промты для очереди.");
      setLocalRenderNotice({ type: "error", message: "Не удалось собрать PART-промты для очереди." });
      return;
    }

    setLocalRenderBusy(true);
    setError("");
    setStatus(`Создаю очередь для локального агента: ${jobs.length} PART...`);
    indexes.forEach((partIndex) => {
      updateLocalRenderJob(partIndex, { status: "queued", message: "ставлю в очередь..." });
    });
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
          project_session_id: projectSessionId,
          project_name: projectName || storyboard.project_name || "NeuroCine Trailer",
          provider: localRenderProvider,
          jobs,
        }),
      }, 120000);
      const nextJobs = {};
      for (const job of data.jobs || []) {
        nextJobs[job.part_index] = job;
        updateLocalRenderJob(job.part_index, { status: "queued", message: "в очереди агента" });
      }
      setLocalQueueJobs((prev) => ({ ...prev, ...nextJobs }));
      const inserted = Number.isFinite(Number(data.inserted_count)) ? Number(data.inserted_count) : Object.keys(nextJobs).length;
      const skipped = Math.max(0, Number(data.skipped_duplicate_count || 0));
      const duplicateNote = skipped ? ` Уже в работе: ${skipped} PART, дубль не создан.` : "";
      setStatus(`Очередь создана: ${inserted} новых PART.${duplicateNote} Local Agent на ПК должен забрать задания.`);
      setLocalRenderNotice({ type: "success", message: `Очередь создана: ${inserted} новых PART.${duplicateNote}` });
    } catch (e) {
      indexes.forEach((partIndex) => {
        updateLocalRenderJob(partIndex, { status: "error", message: "очередь не создана" });
      });
      setError(`Очередь не создана: ${e.message}`);
      setLocalRenderNotice({ type: "error", message: `Очередь не создана: ${e.message}` });
    } finally {
      setLocalRenderBusy(false);
      setLocalRenderAction("");
    }
  }

  async function queueReferencesForLocalAgent(bibleOverride = null, options = {}) {
    const quiet = Boolean(options.quiet);
    const skipWithoutAuth = Boolean(options.skipWithoutAuth);
    let sourceBible = bibleOverride || lockedProductionBible;
    if (!bibleOverride && !filledProductionCharacters(sourceBible).length && !filledProductionLocations(sourceBible).length) {
      if (!quiet) {
        setBibleAction("working");
        setBibleNotice({ type: "working", message: "Перед refs AI собирает production bible..." });
      }
      let bibleResult;
      try {
        bibleResult = await buildProductionBibleFromAi(script || projectName, sourceBible);
      } catch (bibleError) {
        const message = `${bibleError.message}. Refs не поставлены: сначала нужен настоящий AI-разбор bible.`;
        if (!quiet) {
          setBibleAction("error");
          setBibleNotice({ type: "error", message });
          setLocalRenderNotice({ type: "error", message });
          setStatus("Refs не поставлены: AI bible не создана.");
        }
        throw new Error(message);
      }
      sourceBible = bibleResult.bible;
      if (!quiet) {
        setBibleAction("done");
        setBibleNotice({
          type: "success",
          message: `AI bible перед refs: ${bibleResult.charCount} персонаж./животн., ${bibleResult.locCount} локац.`,
        });
      }
    }
    const normalized = normalizeProductionBible(sourceBible, { stylePreset, styleProfile });
    setProductionBible(normalized);
    const jobs = buildReferenceJobs(normalized, { includeStyle: options.includeStyle === true });
    if (!jobs.length) {
      if (!quiet) {
        setStatus("Референсы персонажей/локаций уже готовы или сценарий не дал героев/локаций.");
        setBibleNotice({ type: "success", message: "Референсы персонажей/локаций уже готовы или нечего ставить в очередь." });
        setLocalRenderNotice({ type: "success", message: "Референсы персонажей/локаций уже готовы или нечего ставить в очередь." });
      }
      return false;
    }
    const token = getPersistentLocalAgentToken(localAgentToken);
    if (localAgentToken !== token) setLocalAgentToken(token);
    if (!quiet) {
      setLocalRenderAction("queue-refs");
      setBibleNotice({ type: "working", message: `Ставлю референсы персонажей/локаций в очередь: ${jobs.length} заданий...` });
      setLocalRenderNotice({ type: "working", message: `Ставлю референсы персонажей/локаций в очередь: ${jobs.length} заданий...` });
    }
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        if (skipWithoutAuth) return false;
        throw new Error("Для облачной очереди refs нужно войти через Google.");
      }
      const data = await fetchJsonWithTimeout("/api/trailer/local-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "create",
          agent_token: token,
          project_session_id: projectSessionId,
          project_name: projectName || "NeuroCine Trailer",
          provider: localRenderProvider,
          jobs,
        }),
      }, 120000);
      const nextJobs = {};
      for (const job of data.jobs || []) {
        nextJobs[job.part_index] = job;
        updateLocalRenderJob(job.part_index, { status: "queued", message: "auto ref в очереди" });
      }
      setLocalQueueJobs((prev) => ({ ...prev, ...nextJobs }));
      const inserted = Number.isFinite(Number(data.inserted_count)) ? Number(data.inserted_count) : Object.keys(nextJobs).length;
      const skipped = Math.max(0, Number(data.skipped_duplicate_count || 0));
      const duplicateNote = skipped ? ` Уже есть в очереди/рендере: ${skipped} ref-заданий, дубли не созданы.` : "";
      if (!quiet) {
        setStatus(`Референсы персонажей/локаций в очереди: ${inserted} новых.${duplicateNote}`);
        setBibleNotice({ type: "success", message: `Референсы персонажей/локаций в очереди: ${inserted} новых.${duplicateNote}` });
        setLocalRenderNotice({ type: "success", message: `Референсы персонажей/локаций в очереди: ${inserted} новых.${duplicateNote}` });
      }
      return true;
    } catch (e) {
      if (!quiet) {
        setError(`Авто-референсы не поставлены в очередь: ${e.message}`);
        setBibleNotice({ type: "error", message: `Авто-референсы не поставлены в очередь: ${e.message}` });
        setLocalRenderNotice({ type: "error", message: `Авто-референсы не поставлены в очередь: ${e.message}` });
      }
      refreshLocalQueueJobs(true);
      return false;
    } finally {
      if (!quiet) setLocalRenderAction("");
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
  const bibleBuildLabel = bibleAction === "working"
    ? "AI сканирует..."
    : bibleAction === "done"
      ? "Собрано"
      : bibleAction === "empty"
        ? "Не найдено"
        : "Собрать из сценария";
  function referenceStatusLabel(kind, index, item = {}) {
    const job = localRenderJobs[referenceJobIndex(kind, index)] || localQueueJobs[referenceJobIndex(kind, index)] || {};
    const status = String(job.status || "").toLowerCase();
    const jobMessage = cleanText(job.message || job.error || "");
    if (item.referenceName || item.reference) return item.referenceName ? `готово: ${item.referenceName}` : "готово";
    if (status === "done") return "готово, обнови очередь";
    if (status === "failed" || status === "error") return jobMessage ? `ошибка: ${jobMessage}` : "ошибка ref";
    if (status === "running" || status === "rendering") return "генерируется";
    if (status === "queued" || status === "pending") return "в очереди";
    if (jobMessage) return jobMessage;
    if (item.referencePrompt) return "prompt готов, ref не создан";
    if (cleanText(item.name || item.role || item.description || item.identity)) return "lock готов, ref не создан";
    return "референс не загружен";
  }
  function referenceStatusTone(kind, index, item = {}) {
    const job = localRenderJobs[referenceJobIndex(kind, index)] || localQueueJobs[referenceJobIndex(kind, index)] || {};
    const status = String(job.status || "").toLowerCase();
    if (item.referenceName || item.reference || status === "done") return "done";
    if (status === "failed" || status === "error") return "error";
    if (status === "running" || status === "rendering") return "working";
    if (status === "queued" || status === "pending") return "queued";
    if (item.referencePrompt) return "prompt";
    if (cleanText(item.name || item.role || item.description || item.identity)) return "warn";
    return "empty";
  }
  function characterMetaLabel(character = {}) {
    const name = cleanText(character.name || character.id || "Пустой слот");
    const role = cleanText(character.role || character.sourceContext || (character.referencePrompt ? "auto ref prompt готов" : "загрузи ref или собери из сценария"));
    return { name, role };
  }
  function locationMetaLabel(location = {}) {
    const name = cleanText(location.name || location.id || "Пустой слот");
    const role = cleanText(location.description || location.sourceContext || (location.referencePrompt ? "auto location prompt готов" : "загрузи ref или собери из сценария"));
    return { name, role };
  }
  const agentTokenLabel = localAgentToken
    ? `${localAgentToken.slice(0, 8)}...${localAgentToken.slice(-6)}`
    : "создаётся";
  const agentNeedsCommand = localAgentHealth.status !== "online";
  const partRefsReady = referenceReadiness.ready;
  const jsonRefsBlocked = Boolean(referenceReadiness.requiredTotal && !referenceReadiness.ready);
  const jsonRefsMessage = jsonRefsBlocked
    ? `${referenceWaitMessage(referenceReadiness)} После готовности refs можно генерировать JSON.`
    : "";
  const productionPipelineBlocked = Boolean(localProductionReadiness && localProductionReadiness.status !== "online");
  const localPrimaryLabel = agentNeedsCommand
    ? "Скопировать команду агента"
    : localRenderAction === "queue-current"
      ? "Ставлю PART..."
      : !storyboard || !partScenes.length
        ? "Сначала JSON"
        : !partRefsReady
          ? "Сначала refs"
          : productionPipelineBlocked
            ? "Сначала production"
            : "В очередь текущий PART";
  const localPrimaryDisabled = localRenderBusy || (!agentNeedsCommand && (!storyboard || !partScenes.length || productionPipelineBlocked));
  async function handleLocalPrimaryAction() {
    if (agentNeedsCommand) {
      const freshAgent = await discoverOnlineLocalAgent().catch(() => null);
      const freshHealth = agentHealthInfo(freshAgent || localAgentStatus, Date.now());
      if (freshHealth.status !== "online") {
        await copyLocalAgentCommand();
        return;
      }
    }
    if (!partRefsReady) {
      try {
        await queueReferencesForLocalAgent();
      } catch (e) {
        setError(e.message || "Refs не поставлены в очередь");
      }
      return;
    }
    await queueCurrentPartForLocalAgent();
  }

  async function handleQueueReferencesClick() {
    const freshAgent = await discoverOnlineLocalAgent().catch(() => null);
    const freshHealth = agentHealthInfo(freshAgent || localAgentStatus, Date.now());
    if (freshHealth.status !== "online") {
      await copyLocalAgentCommand();
      const message = "Refs не поставлены: backend не нашёл активный ПК-агент. Команда агента скопирована, запусти её на ПК и нажми refs снова.";
      setBibleNotice({ type: "warn", message });
      setLocalRenderNotice({ type: "warn", message });
      setStatus("Сначала свяжи ПК-агент с этим токеном.");
      return;
    }
    try {
      await queueReferencesForLocalAgent();
    } catch (e) {
      setError(e.message || "Refs не поставлены в очередь");
    }
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
        button.action-queue{background:#e3344f;color:#fff;border:1px solid rgba(255,179,189,.35);box-shadow:0 0 0 1px rgba(227,52,79,.18)}
        button.action-check,button.action-refresh{background:#173a31;color:#b7ffe3;border:1px solid rgba(158,232,201,.32)}
        button.action-direct{background:#4a3211;color:#ffdca6;border:1px solid rgba(255,196,112,.32)}
        button.action-service{background:#191f2b;color:#d8def0;border:1px solid rgba(255,255,255,.12)}
        button.is-working{filter:saturate(1.25);box-shadow:0 0 0 2px rgba(255,255,255,.14),0 0 24px rgba(227,52,79,.28)}
        button:disabled{opacity:.55;cursor:not-allowed}
        .pills{display:flex;gap:8px;flex-wrap:wrap}
        .pill{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.04);padding:8px 10px;border-radius:999px;font-size:12px}
        .pill.active{border-color:#e3344f;background:rgba(227,52,79,.18);color:#ffd6dc}
        .metricbox{border:1px solid rgba(255,255,255,.12);background:#10131b;border-radius:6px;padding:11px;display:grid;gap:4px;min-height:46px}
        .metricbox strong{font-size:20px;color:#fff;letter-spacing:0}
        .metricbox span{font-size:11px;color:rgba(247,243,234,.58);text-transform:none;letter-spacing:0;font-weight:700}
        .metricbox.voice-ok{border-color:rgba(158,232,201,.42);background:rgba(23,58,49,.22)}
        .metricbox.voice-short,.metricbox.voice-long{border-color:rgba(255,196,112,.42);background:rgba(74,50,17,.18)}
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
        .local-main{display:grid;gap:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);border-radius:8px;padding:10px}
        .local-main-actions{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}
        .local-primary{min-height:48px;font-size:14px}
        .agent-token{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.10);background:#10131b;border-radius:6px;padding:9px 10px}
        .agent-token span{font-size:11px;color:rgba(247,243,234,.55);text-transform:uppercase;font-weight:900;letter-spacing:.06em}
        .agent-token b{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:#b7ffe3}
        .agent-command{border:1px solid rgba(255,196,112,.30);background:rgba(74,50,17,.18);border-radius:6px;padding:9px 10px;display:grid;gap:6px}
        .agent-command strong{font-size:12px;color:#ffdca6}
        .agent-command code{white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:1.45;color:#f7f3ea}
        .local-advanced{border:1px solid rgba(255,255,255,.10);border-radius:6px;padding:9px 10px;background:rgba(255,255,255,.025)}
        .local-advanced summary{cursor:pointer;color:#d8def0;font-size:12px;font-weight:900;list-style:none}
        .local-advanced summary::-webkit-details-marker{display:none}
        .local-advanced[open]{display:grid;gap:10px}
        .hint{font-size:12px;line-height:1.45;color:rgba(247,243,234,.62)}
        .param-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .compact-area{min-height:86px}
        .local-notice{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:6px;padding:10px 12px;font-size:13px;font-weight:800;color:rgba(247,243,234,.82)}
        .local-notice.working{border-color:rgba(255,196,112,.45);background:rgba(74,50,17,.20);color:#ffdca6}
        .local-notice.success{border-color:rgba(158,232,201,.45);background:rgba(23,58,49,.30);color:#b7ffe3}
        .local-notice.warn{border-color:rgba(255,196,112,.48);background:rgba(74,50,17,.24);color:#ffdca6}
        .local-notice.error{border-color:rgba(255,154,168,.55);background:rgba(58,18,27,.32);color:#ffb3bd}
        .bible-notice{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:6px;padding:10px 12px;font-size:13px;font-weight:800;color:rgba(247,243,234,.82)}
        .bible-notice.working{border-color:rgba(255,196,112,.45);background:rgba(74,50,17,.20);color:#ffdca6}
        .bible-notice.success{border-color:rgba(158,232,201,.45);background:rgba(23,58,49,.30);color:#b7ffe3}
        .bible-notice.warn{border-color:rgba(255,196,112,.48);background:rgba(74,50,17,.24);color:#ffdca6}
        .bible-notice.error{border-color:rgba(255,154,168,.55);background:rgba(58,18,27,.32);color:#ffb3bd}
        .agent-health{border:1px solid rgba(255,255,255,.12);background:#10131b;border-radius:6px;padding:10px 12px;display:grid;gap:4px}
        .agent-health strong{font-size:13px}
        .agent-health span{font-size:12px;line-height:1.45;color:rgba(247,243,234,.64)}
        .agent-health.online{border-color:rgba(158,232,201,.45);background:rgba(23,58,49,.22)}
        .agent-health.online strong{color:#b7ffe3}
        .agent-health.warn{border-color:rgba(255,196,112,.48);background:rgba(74,50,17,.24)}
        .agent-health.warn strong{color:#ffdca6}
        .agent-health.offline{border-color:rgba(255,154,168,.45);background:rgba(58,18,27,.22)}
        .agent-health.offline strong{color:#ffb3bd}
        .agent-queue{border:1px solid rgba(255,255,255,.12);background:#10131b;border-radius:6px;padding:10px 12px;display:grid;gap:7px}
        .agent-queue strong{font-size:13px}
        .agent-queue span{font-size:12px;line-height:1.45;color:rgba(247,243,234,.66)}
        .agent-queue.online{border-color:rgba(158,232,201,.38);background:rgba(23,58,49,.18)}
        .agent-queue.online strong{color:#b7ffe3}
        .agent-queue.queued{border-color:rgba(255,196,112,.42);background:rgba(74,50,17,.20)}
        .agent-queue.queued strong{color:#ffdca6}
        .agent-queue.rendering{border-color:rgba(235,45,82,.58);background:rgba(235,45,82,.12)}
        .agent-queue.rendering strong{color:#ffb3bd}
        .agent-queue.warn{border-color:rgba(255,196,112,.48);background:rgba(74,50,17,.24)}
        .agent-queue.warn strong{color:#ffdca6}
        .agent-queue-meta{display:flex;flex-wrap:wrap;gap:6px}
        .agent-queue-meta em{font-style:normal;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:5px 8px;font-size:10px;color:rgba(247,243,234,.70);background:rgba(255,255,255,.04)}
        .pc-command-center{border:1px solid rgba(255,255,255,.10);background:rgba(9,11,16,.34);border-radius:8px;padding:10px;display:grid;gap:10px}
        .pc-command-center h3{margin:0;font-size:14px}
        .pc-chat{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
        .pc-chat input{min-height:44px}
        .pc-command-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .pc-command-grid button{display:grid;gap:3px;text-align:left;min-height:52px}
        .pc-command-grid button span{font-size:12px;font-weight:900}
        .pc-command-grid button small{font-size:10px;color:rgba(247,243,234,.54)}
        .pc-command-note{border:1px solid rgba(255,196,112,.22);background:rgba(74,50,17,.13);border-radius:6px;padding:9px 10px;font-size:12px;line-height:1.45;color:#ffdca6}
        .command-history-wrap{border:1px solid rgba(255,255,255,.10);border-radius:6px;background:#10131b;overflow:hidden}
        .command-history-wrap summary{cursor:pointer;padding:10px;font-size:12px;font-weight:900;color:#f7f3ea;list-style:none}
        .command-history-wrap summary::-webkit-details-marker{display:none}
        .command-history-wrap summary:after{content:"показать";float:right;color:rgba(247,243,234,.52);font-weight:700}
        .command-history-wrap[open] summary:after{content:"скрыть"}
        .command-history{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .command-history-wrap .command-history{padding:0 10px 10px}
        .joblist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .job{border:1px solid rgba(255,255,255,.10);background:#10131b;border-radius:6px;padding:9px 10px;font-size:12px;color:rgba(247,243,234,.70);display:grid;gap:6px}
        .job-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .job-top strong{color:#f7f3ea}
        .job-top em{font-style:normal;font-size:11px;color:rgba(247,243,234,.58)}
        .job-message{line-height:1.35}
        .job-meta{font-size:11px;color:rgba(247,243,234,.48)}
        .job-wait{font-size:11px;color:rgba(247,243,234,.42)}
        .job-track{height:5px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
        .job-track span{display:block;height:100%;width:0%;border-radius:inherit;background:rgba(247,243,234,.30);transition:width .35s ease}
        .job.queued{border-color:rgba(255,196,112,.45);color:#ffdca6;background:rgba(74,50,17,.18)}
        .job.queued .job-track span{background:#ffc470}
        .job.done{border-color:rgba(158,232,201,.40);color:#9ee8c9}
        .job.done .job-track span{background:#9ee8c9}
        .job.rendering{border-color:rgba(227,52,79,.45);color:#ffd6dc}
        .job.rendering .job-track span{background:#e3344f}
        .job.error{border-color:rgba(255,154,168,.50);color:#ff9aa8}
        .job.error .job-track span{background:#ff9aa8}
        .history-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
        .history-card{padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:#10131b;display:grid;text-align:left}
        .history-card img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block;background:#070a10}
        .history-card span{font-size:11px;line-height:1.25;padding:7px 8px 2px;color:#f7f3ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .history-card small{font-size:10px;line-height:1.25;padding:0 8px 8px;color:rgba(247,243,234,.50)}
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
        @keyframes refPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,196,112,.0)}50%{box-shadow:0 0 0 3px rgba(255,196,112,.16)}}
        @keyframes refRenderGlow{0%,100%{box-shadow:0 0 0 0 rgba(227,52,79,.0)}50%{box-shadow:0 0 0 3px rgba(227,52,79,.22),0 0 24px rgba(227,52,79,.20)}}
        @keyframes refShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        .production-bible{border:1px solid rgba(158,232,201,.22);background:rgba(23,58,49,.13);border-radius:8px;padding:12px;display:grid;gap:12px}
        .production-bible h3{margin:0;font-size:13px;color:#b7ffe3}
        .refs-progress{border:1px solid rgba(255,255,255,.12);background:rgba(9,11,16,.55);border-radius:8px;padding:11px;display:grid;gap:10px}
        .refs-progress.rendering{border-color:rgba(227,52,79,.45);background:rgba(58,18,27,.20)}
        .refs-progress.queued,.refs-progress.warn{border-color:rgba(255,196,112,.42);background:rgba(74,50,17,.18)}
        .refs-progress.done{border-color:rgba(158,232,201,.45);background:rgba(23,58,49,.26)}
        .refs-progress.error{border-color:rgba(255,154,168,.55);background:rgba(58,18,27,.32)}
        .refs-progress-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
        .refs-progress-top div{display:grid;gap:3px}
        .refs-progress-top b{font-size:13px;color:#f7f3ea}
        .refs-progress-top span{font-size:12px;color:rgba(247,243,234,.66);line-height:1.35}
        .refs-progress-top strong{font-size:20px;color:#b7ffe3;white-space:nowrap}
        .refs-track{height:9px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;position:relative}
        .refs-track > span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#e3344f,#ffdca6,#9ee8c9);transition:width .35s ease}
        .refs-track.active:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:refShimmer 1.4s linear infinite}
        .refs-stats,.refs-health{display:flex;flex-wrap:wrap;gap:6px}
        .refs-stats span,.refs-health span{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);border-radius:999px;padding:6px 8px;font-size:11px;color:rgba(247,243,234,.76)}
        .refs-stats .done{border-color:rgba(158,232,201,.36);color:#b7ffe3}
        .refs-stats .rendering{border-color:rgba(227,52,79,.45);color:#ffb3bd}
        .refs-stats .queued,.refs-stats .waiting{border-color:rgba(255,196,112,.38);color:#ffdca6}
        .refs-stats .error{border-color:rgba(255,154,168,.45);color:#ffb3bd}
        .refs-current{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);border-radius:6px;padding:9px 10px;display:grid;gap:4px}
        .refs-current b{font-size:12px;color:#f7f3ea}
        .refs-current span{font-size:12px;color:rgba(247,243,234,.70);line-height:1.35}
        .refs-current small{font-size:11px;color:rgba(247,243,234,.52)}
        .refs-health .online{border-color:rgba(158,232,201,.38);color:#b7ffe3}
        .refs-health .rendering{border-color:rgba(227,52,79,.45);color:#ffb3bd}
        .refs-health .queued,.refs-health .warn{border-color:rgba(255,196,112,.38);color:#ffdca6}
        .refs-health .offline,.refs-health .error{border-color:rgba(255,154,168,.45);color:#ffb3bd}
        .ref-grid{display:grid;grid-template-columns:1fr;gap:10px}
        .ref-card{border:1px solid rgba(255,255,255,.10);background:rgba(9,11,16,.45);border-radius:6px;padding:10px;display:grid;gap:8px}
        .ref-card.queued{border-color:rgba(255,196,112,.38);animation:refPulse 1.8s ease-in-out infinite}
        .ref-card.working{border-color:rgba(227,52,79,.52);animation:refRenderGlow 1.4s ease-in-out infinite}
        .ref-card.done{border-color:rgba(158,232,201,.42);background:rgba(23,58,49,.18)}
        .ref-card.error{border-color:rgba(255,154,168,.55);background:rgba(58,18,27,.22)}
        .ref-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .ref-card-head strong{font-size:12px;color:#f7f3ea}
        .ref-card-head span{font-size:11px;color:rgba(247,243,234,.52)}
        .ref-status{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 8px;max-width:60%;text-align:right;line-height:1.25}
        .ref-status.done{border-color:rgba(158,232,201,.42);background:rgba(23,58,49,.30);color:#b7ffe3}
        .ref-status.queued,.ref-status.working{border-color:rgba(255,196,112,.45);background:rgba(74,50,17,.22);color:#ffdca6}
        .ref-status.error{border-color:rgba(255,154,168,.52);background:rgba(58,18,27,.32);color:#ffb3bd}
        .ref-status.prompt,.ref-status.warn{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:rgba(247,243,234,.72)}
        .ref-status.empty{border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.03);color:rgba(247,243,234,.48)}
        .ref-meta{display:grid;gap:3px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:6px;padding:8px 10px}
        .ref-meta b{font-size:13px;color:#f7f3ea}
        .ref-meta span{font-size:12px;line-height:1.35;color:rgba(247,243,234,.66)}
        .mini-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ref-preview{display:grid;grid-template-columns:1fr;gap:8px;align-items:start}
        .ref-preview img{width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:#070a10;display:block}
        .ref-preview input[type="file"]{width:100%;min-width:0}
        .ref-preview button{justify-self:start}
        .ref-preview span{font-size:11px;color:rgba(247,243,234,.58);text-transform:none;letter-spacing:0;line-height:1.35;word-break:break-word}
        .ref-details{border-top:1px solid rgba(255,255,255,.08);padding-top:8px;display:grid;gap:8px}
        .ref-details summary{cursor:pointer;color:#b7ffe3;font-size:12px;font-weight:900;list-style:none}
        .ref-details summary::-webkit-details-marker{display:none}
        .ref-details summary:before{content:"+";display:inline-grid;place-items:center;width:18px;height:18px;margin-right:7px;border-radius:999px;background:rgba(158,232,201,.13);color:#b7ffe3}
        .ref-details[open] summary:before{content:"-"}
        .ref-details[open]{gap:10px}
        .lockbox div,.frame{font-size:13px;color:rgba(247,243,234,.76);line-height:1.45}
        .frames{display:grid;gap:8px}.frame{border-left:3px solid #e3344f;background:rgba(255,255,255,.04);padding:10px;border-radius:6px}
        .mono{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.45;max-height:420px;overflow:auto}
        .mono.master{max-height:360px;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:10px;background:#0b0f17}
        @media(max-width:900px){.grid{grid-template-columns:1fr}.row,.locks,.crop-grid,.joblist,.command-history,.param-grid,.mini-row,.local-main-actions,.pc-chat,.pc-command-grid{grid-template-columns:1fr}.history-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.trailer-page{padding:10px}textarea{min-height:260px}.compact-area{min-height:110px}.frame-select{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
              <div className={`metricbox voice-${voiceTiming.status}`}>
                <span>Озвучка</span>
                <strong>{voiceTiming.words ? `${voiceTiming.words} слов` : `${voiceTiming.target.target} слов`}</strong>
                <span>{voiceTiming.words ? `~${formatDuration(voiceTiming.estimatedSeconds)} / цель ${voiceTiming.target.min}-${voiceTiming.target.max} слов` : `цель ${voiceTiming.target.min}-${voiceTiming.target.max} слов под ${formatDuration(effectiveDuration)}`}</span>
              </div>
            </div>
            <label>Сценарий<textarea value={script} onChange={(e) => handleScriptChange(e.target.value)} placeholder="Вставь готовый сценарий или сначала введи тему выше и нажми “Сгенерировать сценарий”." /></label>
            <div className="buttons">
              <button className="primary" type="button" disabled={busy || scriptBusy || projectName.trim().length < 3} onClick={generateScriptFromTopic}>
                {scriptBusy ? "Генерирую сценарий..." : "Сгенерировать сценарий"}
              </button>
              <span className="hint">Сначала выбери длительность и секунд/кадр. Если есть только тема, жми эту кнопку. Потом — “Сгенерировать JSON”.</span>
            </div>
            {scriptNotice.message ? <div className={`local-notice ${scriptNotice.type}`}>{scriptNotice.message}</div> : null}
            {script.trim() ? (
              <div className="local-notice success">
                <b>Текущий сценарий загружен в поле выше.</b>
                <span>{script.trim().slice(0, 260)}{script.trim().length > 260 ? "..." : ""}</span>
              </div>
            ) : null}
            <div className="row">
              <label>Формат<select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option></select></label>
              <label>Модель<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="grok">Grok</option><option value="veo3">Veo 3</option></select></label>
            </div>
            <div className="row">
              <label>Размер PART<select value={partSize} onChange={(e) => { setPartSize(Number(e.target.value)); setActivePart(0); }}><option value={4}>4 кадра</option><option value={6}>6 кадров</option><option value={8}>8 кадров</option></select></label>
              <label>Стиль<select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}>{Object.entries(STYLE_PRESETS).map(([key, val]) => <option key={key} value={key}>{styleLabelRu(key, val.label)}</option>)}</select></label>
            </div>

            <div className="production-bible">
              <div className="prompt-head">
                <h2>02 · Библия проекта / референсы</h2>
                <div className="buttons">
                  <button type="button" className={`${bibleAction === "working" ? "action-direct is-working" : bibleAction === "done" ? "action-check" : bibleAction === "empty" ? "danger" : ""}`} onClick={autoBuildProductionBible} disabled={busy || scriptBusy || bibleAction === "working" || (script.trim().length < 3 && projectName.trim().length < 3)}>{bibleBuildLabel}</button>
                  <button type="button" className="primary" onClick={autoBuildAndGenerate} disabled={busy || scriptBusy || bibleAction === "working" || script.trim().length < 10}>Авто всё</button>
                  <button type="button" className={`action-queue${localRenderAction === "queue-refs" ? " is-working" : ""}`} onClick={handleQueueReferencesClick} disabled={busy || scriptBusy || bibleAction === "working" || localRenderAction === "queue-refs" || script.trim().length < 10}>{agentNeedsCommand ? "Сначала агент" : "В очередь refs"}</button>
                  <button type="button" className="danger" onClick={resetProductionBible} disabled={busy || scriptBusy}>Очистить библию</button>
                </div>
              </div>
              <div className="pills">
                {bibleScanActive ? <span className="pill active">AI сканирует</span> : null}
                <span className={`pill ${!bibleScanActive ? "active" : ""}`}>{bibleScanActive ? "персонажи: ждём AI" : `${filledProductionCharacters(lockedProductionBible).length} персонаж.`}</span>
                <span className="pill">{bibleScanActive ? "локации: ждём AI" : `${filledProductionLocations(lockedProductionBible).length} локац.`}</span>
                <span className={`pill ${!bibleScanActive && referenceReadiness.ready ? "active" : ""}`}>{bibleScanActive ? "refs: после AI" : `refs ${referenceReadiness.readyTotal}/${referenceReadiness.requiredTotal}`}</span>
                <span className="pill">{lockedProductionBible.style?.referenceName ? "style ref" : "style text"}</span>
                <span className="pill">до 5 героев</span>
                <span className="pill">поля необязательны</span>
              </div>
              <div className={`bible-notice ${bibleNotice.type || "idle"}`}>{bibleNotice.message}</div>
              {bibleScanActive ? (
                <div className="refs-progress queued">
                  <div className="refs-progress-top">
                    <div>
                      <b>AI анализирует сценарий</b>
                      <span>Сейчас система заново ищет персонажей, животных, локации, props и ref-prompts. Старые refs не используются.</span>
                    </div>
                    <strong>AI</strong>
                  </div>
                  <div className="refs-track active">
                    <span style={{ width: "45%" }} />
                  </div>
                  <div className="refs-stats">
                    <span className="queued">сканирование</span>
                    <span className="waiting">refs появятся после AI</span>
                  </div>
                  <div className="refs-current">
                    <b>Сейчас: production bible</b>
                    <span>Дожидаемся результата AI. Количество refs пока неизвестно.</span>
                  </div>
                </div>
              ) : refsProgress.requiredTotal ? (
                <div className={`refs-progress ${refsProgress.status}`}>
                  <div className="refs-progress-top">
                    <div>
                      <b>Прогресс референсов</b>
                      <span>
                        {refsProgress.done === refsProgress.requiredTotal
                          ? "Все референсы персонажей/локаций готовы. JSON можно генерировать."
                          : refsProgress.rendering
                            ? "ПК-агент рендерит референс через ComfyUI."
                            : refsProgress.queued
                              ? localAgentQueue?.status === "rendering"
                                ? "Референсы стоят в очереди сайта; ComfyUI уже занят реальным рендером ниже."
                                : "Референсы стоят в очереди. Страница обновляет статус автоматически."
                              : "Референсы ещё не готовы. Сначала поставь их в очередь."}
                      </span>
                    </div>
                    <strong>{refsProgress.done}/{refsProgress.requiredTotal}</strong>
                  </div>
                  <div className={`refs-track ${refsProgress.active ? "active" : ""}`}>
                    <span style={{ width: `${refsProgress.readyPercent}%` }} />
                  </div>
                  <div className="refs-stats">
                    <span className="done">готово {refsProgress.done}</span>
                    <span className="rendering">генерируется {refsProgress.rendering}</span>
                    <span className="queued">в очереди {refsProgress.queued}</span>
                    <span className="waiting">ожидает {refsProgress.waiting}</span>
                    {refsProgress.failed ? <span className="error">ошибки {refsProgress.failed}</span> : null}
                  </div>
                  {refsProgress.current ? (
                    <div className="refs-current">
                      <b>Сейчас: {refsProgress.current.label}</b>
                      <span>{refsProgress.current.stage} · {refsProgress.current.message}</span>
                      <small>время: {refsProgress.current.elapsed} · обновлено: {refsProgress.current.updated}{refsProgress.current.progress.output ? ` · файл: ${refsProgress.current.progress.output}` : ""}</small>
                    </div>
                  ) : null}
                  {localAgentQueue?.status === "rendering" ? (
                    <div className="refs-current">
                      <b>{localAgentQueue.title}</b>
                      <span>{localAgentQueue.detail}</span>
                      {localAgentQueue.meta?.length ? <small>{localAgentQueue.meta.join(" · ")}</small> : null}
                    </div>
                  ) : null}
                  <div className="refs-health">
                    <span className={localAgentHealth.status}>{localAgentHealth.title}</span>
                    {localAgentQueue ? <span className={localAgentQueue.status}>{localAgentQueue.title}</span> : <span className="warn">Очередь ComfyUI: нет данных</span>}
                  </div>
                </div>
              ) : null}
              <div className="hint">Production режим: “Собрать из сценария” запускает AI-анализ и вытягивает людей, животных, локации и ref-prompts. Если AI-разбор не прошёл, refs и JSON не запускаются.</div>

              {bibleScanActive ? (
                <div className="local-notice warn">
                  Старая библиотека скрыта на время анализа. После завершения AI здесь появятся новые персонажи, локации и ref-prompts именно для текущего сценария.
                </div>
              ) : (
                <>
              <h3>Персонажи</h3>
              <div className="ref-grid">
                {lockedProductionBible.characters.map((character, i) => (
                  <div className={`ref-card ${referenceStatusTone("character", i, character)}`} key={character.id || i}>
                    <div className="ref-card-head">
                      <strong>{character.id || `CHAR_${i + 1}`}</strong>
                      <span className={`ref-status ${referenceStatusTone("character", i, character)}`}>{referenceStatusLabel("character", i, character)}</span>
                    </div>
                    <div className="ref-meta">
                      <b>{characterMetaLabel(character).name}</b>
                      <span>{characterMetaLabel(character).role}</span>
                    </div>
                    <div className="ref-preview">
                      {character.reference ? <img src={character.reference} alt={`Референс ${character.name || character.id}`} /> : null}
                      <input type="file" accept="image/*" onChange={(e) => uploadProductionReference("character", i, e.target.files?.[0])} />
                      <button type="button" disabled={!character.reference} onClick={() => clearProductionReference("character", i)}>Убрать ref</button>
                    </div>
                    <details className="ref-details">
                      <summary>Тонкая настройка</summary>
                      <div className="mini-row">
                        <label>Имя<input value={character.name || ""} onChange={(e) => updateProductionCharacter(i, { name: e.target.value })} placeholder="Лена" /></label>
                        <label>Роль<input value={character.role || ""} onChange={(e) => updateProductionCharacter(i, { role: e.target.value })} placeholder="главная героиня" /></label>
                      </div>
                      <label>Внешность / identity lock<textarea className="compact-area" value={character.identity || ""} onChange={(e) => updateProductionCharacter(i, { identity: e.target.value })} placeholder="необязательно: лицо, возраст, волосы, телосложение" /></label>
                      <label>Одежда / wardrobe lock<textarea className="compact-area" value={character.wardrobe || ""} onChange={(e) => updateProductionCharacter(i, { wardrobe: e.target.value })} placeholder="необязательно: если сценарий не задаёт одежду" /></label>
                      <label>Запреты<textarea className="compact-area" value={character.negative || ""} onChange={(e) => updateProductionCharacter(i, { negative: e.target.value })} /></label>
                    </details>
                  </div>
                ))}
              </div>

              <h3>Локации</h3>
              <div className="ref-grid">
                {lockedProductionBible.locations.map((location, i) => (
                  <div className={`ref-card ${referenceStatusTone("location", i, location)}`} key={location.id || i}>
                    <div className="ref-card-head">
                      <strong>{location.id || `LOC_${i + 1}`}</strong>
                      <span className={`ref-status ${referenceStatusTone("location", i, location)}`}>{referenceStatusLabel("location", i, location)}</span>
                    </div>
                    <div className="ref-meta">
                      <b>{locationMetaLabel(location).name}</b>
                      <span>{locationMetaLabel(location).role}</span>
                    </div>
                    <div className="ref-preview">
                      {location.reference ? <img src={location.reference} alt={`Референс ${location.name || location.id}`} /> : null}
                      <input type="file" accept="image/*" onChange={(e) => uploadProductionReference("location", i, e.target.files?.[0])} />
                      <button type="button" disabled={!location.reference} onClick={() => clearProductionReference("location", i)}>Убрать ref</button>
                    </div>
                    <details className="ref-details">
                      <summary>Тонкая настройка</summary>
                      <div className="mini-row">
                        <label>Название<input value={location.name || ""} onChange={(e) => updateProductionLocation(i, { name: e.target.value })} placeholder="старая бойня" /></label>
                        <label>Свет<input value={location.lighting || ""} onChange={(e) => updateProductionLocation(i, { lighting: e.target.value })} placeholder="тёплая мигающая лампа" /></label>
                      </div>
                      <label>Описание<textarea className="compact-area" value={location.description || ""} onChange={(e) => updateProductionLocation(i, { description: e.target.value })} placeholder="необязательно: география, что где находится" /></label>
                      <label>Материалы<textarea className="compact-area" value={location.materials || ""} onChange={(e) => updateProductionLocation(i, { materials: e.target.value })} placeholder="необязательно: ржавый металл, плитка, крюки" /></label>
                      <label>Запреты<textarea className="compact-area" value={location.negative || ""} onChange={(e) => updateProductionLocation(i, { negative: e.target.value })} /></label>
                    </details>
                  </div>
                ))}
              </div>

              <h3>Стиль</h3>
              <div className="ref-card">
                <div className="ref-preview">
                  {lockedProductionBible.style?.reference ? <img src={lockedProductionBible.style.reference} alt="Референс стиля" /> : null}
                  <input type="file" accept="image/*" onChange={(e) => uploadProductionReference("style", 0, e.target.files?.[0])} />
                  <button type="button" disabled={!lockedProductionBible.style?.reference} onClick={() => clearProductionReference("style")}>Убрать style ref</button>
                  <span>{lockedProductionBible.style?.referenceName || localRenderJobs[referenceJobIndex("style", 0)]?.message || "style ref не загружен"}</span>
                </div>
                <details className="ref-details">
                  <summary>Тонкая настройка</summary>
                  <label>Style lock<textarea className="compact-area" value={lockedProductionBible.style?.lock || ""} onChange={(e) => updateProductionStyle({ lock: e.target.value })} placeholder="необязательно: камера, свет, цвет, фактура, реализм" /></label>
                  <label>Style negative<textarea className="compact-area" value={lockedProductionBible.style?.negative || ""} onChange={(e) => updateProductionStyle({ negative: e.target.value })} placeholder="что стилю запрещено добавлять" /></label>
                </details>
              </div>
                </>
              )}
            </div>

            <div className="buttons">
              <button className="primary" disabled={busy || scriptBusy || script.trim().length < 10 || jsonRefsBlocked} onClick={() => generateTrailer()}>{busy ? "Генерация..." : jsonRefsBlocked ? "Сначала refs" : "Сгенерировать JSON"}</button>
              <button disabled={busy || scriptBusy || script.trim().length < 10} onClick={buildLocalPreview}>Локальный тест</button>
              <button disabled={!storyboard} onClick={downloadJson}>Скачать JSON</button>
              <button disabled={busy || scriptBusy} onClick={saveDraftNow}>Сохранить</button>
              <button disabled={busy || scriptBusy} onClick={restoreSavedDraft}>Загрузить</button>
              <button className="danger" disabled={busy || scriptBusy} onClick={resetAll}>Очистить всё</button>
              <button className="danger" disabled={busy || scriptBusy} onClick={clearSavedDraft}>Удалить сохранённое</button>
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
            {jsonRefsBlocked ? <div className="error">{jsonRefsMessage}</div> : null}
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
            <h2>03 · Структура трейлера</h2>
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
                  <h2>04 · PART-сетки</h2>
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
                    <h2>05 · Промт PART-сетки</h2>
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
                    <h2>06 · Авто-генерация на локальном ПК</h2>
                  </div>
                  <div className="local-main">
                    <div className="local-main-actions">
                      <button className={`${agentNeedsCommand ? "action-service" : "action-queue"} local-primary${localRenderAction === "queue-current" ? " is-working" : ""}`} disabled={localPrimaryDisabled} onClick={handleLocalPrimaryAction}>
                        {localPrimaryLabel}
                      </button>
                      <button className={`action-refresh${localRenderAction === "refresh" ? " is-working" : ""}`} disabled={localRenderBusy || !localAgentToken} onClick={() => refreshLocalQueueJobs(false)}>
                        {localRenderAction === "refresh" ? "Обновляю..." : "Обновить"}
                      </button>
                      <button className={`action-refresh${localRenderAction === "history" ? " is-working" : ""}`} disabled={localRenderBusy || !localAgentToken} onClick={loadLocalRenderHistory}>
                        {localRenderAction === "history" ? "Гружу..." : "История"}
                      </button>
                      <button className={`danger${localRenderAction === "clear-queue" ? " is-working" : ""}`} disabled={localRenderBusy || !localAgentToken} onClick={() => clearLocalAgentQueue({ all: true })}>
                        {localRenderAction === "clear-queue" ? "Чищу..." : "Очистить очередь ПК"}
                      </button>
                      <button className={`action-queue${localRenderAction === "queue-all" ? " is-working" : ""}`} disabled={localRenderBusy || !storyboard || !parts.length || agentNeedsCommand || productionPipelineBlocked} onClick={queueAllPartsForLocalAgent}>
                        {localRenderAction === "queue-all" ? "Ставлю всё..." : "В очередь всё"}
                      </button>
                    </div>
                    <div className="agent-token">
                      <span>Token сайта для ПК агента</span>
                      <b>{agentTokenLabel}</b>
                    </div>
                    {agentNeedsCommand ? (
                      <div className="agent-command">
                        <strong>На ПК должен быть запущен агент с этим token. Сайт сам не запускает программы на удалённом ПК.</strong>
                        <code>{localAgentCommand}</code>
                      </div>
                    ) : null}
                  </div>
                  <div className={`local-notice ${localRenderNotice.type || "idle"}`}>
                    {localRenderNotice.message}
                  </div>
                  {referenceReadiness.requiredTotal ? (
                    <div className={`local-notice ${referenceReadiness.ready ? "success" : "warn"}`}>
                      {referenceReadiness.ready
                        ? `Референсы готовы: ${referenceReadiness.readyTotal}/${referenceReadiness.requiredTotal}. PART будет использовать якоря персонажей/локаций.`
                        : referenceWaitMessage(referenceReadiness)}
                    </div>
                  ) : null}
                  {usesBaseCheckpoint ? (
                    <div className="local-notice warn">
                      Сейчас выбран SDXL Base. Это debug-модель, она даёт разные лица и слабый реализм. Для финала выбери RealVisXL/Juggernaut checkpoint.
                    </div>
                  ) : null}
                  <div className={`agent-health ${localAgentHealth.status}`}>
                    <strong>{localAgentHealth.title}</strong>
                    <span>{localAgentHealth.detail}</span>
                  </div>
                  {localProductionReadiness ? (
                    <div className={`agent-queue ${localProductionReadiness.status}`}>
                      <strong>{localProductionReadiness.title}</strong>
                      <span>{localProductionReadiness.detail}</span>
                      {localProductionReadiness.meta?.length ? (
                        <div className="agent-queue-meta">
                          {localProductionReadiness.meta.map((item) => <em key={item}>{item}</em>)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {localAgentQueue ? (
                    <div className={`agent-queue ${localAgentQueue.status}`}>
                      <strong>{localAgentQueue.title}</strong>
                      <span>{localAgentQueue.detail}</span>
                      {localAgentQueue.meta?.length ? (
                        <div className="agent-queue-meta">
                          {localAgentQueue.meta.map((item) => <em key={item}>{item}</em>)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="pc-command-center">
                    <div className="prompt-head">
                      <h3>Командный центр ПК</h3>
                      <div className="buttons">
                        <button className={`action-refresh${localRenderAction === "pc-history" ? " is-working" : ""}`} type="button" disabled={!localAgentToken || localRenderAction === "pc-clear-history"} onClick={() => refreshPcCommandHistory(false)}>
                          Обновить
                        </button>
                        <button className={`danger${localRenderAction === "pc-clear-history" ? " is-working" : ""}`} type="button" disabled={!localAgentToken || localRenderAction === "pc-clear-history" || !pcCommandJobs.length} onClick={clearPcCommandHistory}>
                          Очистить историю
                        </button>
                      </div>
                    </div>
                    <div className="pc-chat">
                      <input value={pcCommandInput} onChange={(e) => setPcCommandInput(e.target.value)} placeholder="Напиши: проверь ПК, проверь production, запусти ComfyUI..." />
                      <button className="action-service" type="button" disabled={!pcCommandInput.trim() || !localAgentToken} onClick={sendPcCommandFromText}>Отправить</button>
                    </div>
                    <div className="pc-command-grid">
                      {PC_COMMANDS.map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`${["reboot_pc", "sleep_pc"].includes(cmd.id) ? "danger" : "action-service"}${localRenderAction === `pc-${cmd.id}` ? " is-working" : ""}`}
                          disabled={!localAgentToken || localRenderAction === `pc-${cmd.id}`}
                          onClick={() => sendPcCommand(cmd.id, cmd.label)}
                        >
                          <span>{cmd.label}</span>
                          <small>{cmd.hint}</small>
                        </button>
                      ))}
                    </div>
                    <div className="pc-command-note">
                      Команды работают только если на ПК уже запущен агент с этим token. Полностью выключенный ПК сайт не включает: для этого нужен Wake-on-LAN или питание через умную розетку.
                    </div>
                    {pcCommandJobs.length ? (
                      <details className="command-history-wrap">
                        <summary>История команд ПК: последние {pcCommandJobs.length}</summary>
                        <div className="command-history">
                          {pcCommandJobs.map((job) => {
                            const item = pcCommandProgressInfo(job, queueClock);
                            return (
                              <span key={job.id} className={`job ${item.status}`}>
                                <span className="job-top">
                                  <strong>{item.label}</strong>
                                  <em>{item.updated}</em>
                                </span>
                                <span className="job-message">{item.message}</span>
                              </span>
                            );
                          })}
                        </div>
                      </details>
                    ) : null}
                  </div>
                  <details className="local-advanced">
                    <summary>Дополнительно: прямой запуск на этом ПК и команда агента</summary>
                    <div className="buttons">
                      <button className={`action-check${localRenderAction === "check" ? " is-working" : ""}`} disabled={localRenderBusy} onClick={checkLocalRenderWorker}>
                        {localRenderAction === "check" ? "Проверяю ПК..." : "Проверить генератор"}
                      </button>
                      <button className={`action-direct${localRenderAction === "direct-current" ? " is-working" : ""}`} disabled={localRenderBusy || !storyboard || !partScenes.length} onClick={generateCurrentPartOnLocalPc}>
                        {localRenderAction === "direct-current" ? "Генерация PART..." : "Только ПК: PART"}
                      </button>
                      <button className={`action-direct${localRenderAction === "direct-all" ? " is-working" : ""}`} disabled={localRenderBusy || !storyboard || !parts.length} onClick={generateAllPartsOnLocalPc}>
                        {localRenderAction === "direct-all" ? "Генерация всех..." : "Только ПК: все PART"}
                      </button>
                      <button className="action-service" disabled={!localAgentCommand} onClick={copyLocalAgentCommand}>Скопировать команду агента</button>
                    </div>
                  </details>
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
                    <label>Ширина<input type="number" min="512" max="1536" disabled={activeLocalModelPreset.lockDimensions === true} value={effectiveLocalImageWidth} onChange={(e) => setLocalImageWidth(clampNumber(e.target.value, 512, 1536, localImageWidth))} /></label>
                    <label>Высота<input type="number" min="768" max="2048" disabled={activeLocalModelPreset.lockDimensions === true} value={effectiveLocalImageHeight} onChange={(e) => setLocalImageHeight(clampNumber(e.target.value, 768, 2048, localImageHeight))} /></label>
                    <label>Steps<input type="number" min="4" max="60" value={effectiveLocalSteps} onChange={(e) => setLocalSteps(clampNumber(e.target.value, 4, 60, localSteps))} /></label>
                    <label>CFG<input type="number" min="1" max="12" step="0.5" disabled={activeLocalModelPreset.lockQuality === true} value={effectiveLocalCfg} onChange={(e) => setLocalCfg(clampNumber(e.target.value, 1, 12, localCfg))} /></label>
                  </div>
                  <label>LoRA, по одной строке<textarea className="compact-area" value={localLoras} onChange={(e) => setLocalLoras(e.target.value)} placeholder={"cinematic_horror_lora.safetensors:0.65\nsame_actor_face_lora.safetensors:0.55"} /></label>
                  <label>ComfyUI workflow template для FLUX/кастомных графов<textarea className="compact-area" value={localWorkflowTemplate} onChange={(e) => setLocalWorkflowTemplate(e.target.value)} placeholder={'Опционально. Вставь workflow JSON и используй плейсхолдеры "__PROMPT__", "__NEGATIVE__", "__WIDTH__", "__HEIGHT__", "__STEPS__", "__CFG__", "__SEED__", "__CHECKPOINT__".'} /></label>
                  <label>Токен локального агента<input value={localAgentToken} onChange={(e) => changeLocalAgentToken(e.target.value)} placeholder="будет создан автоматически" /></label>
                  <div className="pills">
                    <span className="pill active">Кадр: {effectiveLocalImageWidth}×{effectiveLocalImageHeight}</span>
                    <span className="pill active">Steps: {effectiveLocalSteps}</span>
                    <span className="pill">{activeLocalModelPreset.label}</span>
                    <span className="pill">кадры отдельно</span>
                    <span className="pill">сборка сетки кодом</span>
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
                      const hasGrid = Boolean(gridUploads[i]);
                      const progress = queueProgressInfo({
                        job,
                        queueJob,
                        hasGrid,
                        nowMs: queueClock,
                        fallbackMessage: hasGrid ? "сетка загружена" : `${part.length} кадр. ждёт`,
                      });
                      return (
                        <span key={i} className={`job ${progress.status}`}>
                          <span className="job-top">
                            <strong>PART {i + 1}</strong>
                            <em>{progress.stage}</em>
                          </span>
                          <span className="job-message">{progress.message}</span>
                          <span className="job-meta">
                            Время: {progress.elapsed} · обновлено: {progress.updated}{progress.output ? ` · файл: ${progress.output}` : ""}
                          </span>
                          {progress.showTrack ? (
                            <span className="job-track"><span style={{ width: `${progress.progress}%` }} /></span>
                          ) : (
                            <span className="job-wait">Прогресс появится только когда агент пришлёт реальные данные.</span>
                          )}
                        </span>
                      );
                    }) : <span className="job">Сначала создай JSON раскадровки</span>}
                  </div>
                  {localHistoryJobs.length ? (
                    <div className="history-grid">
                      {localHistoryJobs.map((job) => (
                        <button type="button" key={job.id} className="history-card" onClick={() => insertHistoryJob(job)}>
                          <img src={job.image_data} alt={job.part_label || "готовая PART-сетка"} />
                          <span>{job.part_label || `PART ${Number(job.part_index || 0) + 1}`}</span>
                          <small>{relativeTimeLabel(job.completed_at || job.updated_at, queueClock)}{job.output_meta?.bytes ? ` · ${formatBytes(job.output_meta.bytes)}` : ""}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="hint">Розовые кнопки “В очередь” — правильный режим для телефона. Страница сама обновляет очередь каждые 4 секунды, а таймер PART идёт каждую секунду. Токен агента теперь постоянный между проектами; если сайт пишет “нет связи”, запусти команду агента именно с этим токеном.</div>
                </div>

                <div className="uploadbox">
                  <div className="prompt-head">
                    <h2>07 · Загрузка сетки и кроп</h2>
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
