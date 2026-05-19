"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import { initQuantumField, initTypewriter, initWaveCanvas } from "./quantumAnimClient";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CAMS    = ["Wide Shot", "Medium Shot", "Close-Up", "POV", "Low Angle", "Aerial"];
const VOICES  = [["neutral","НЕЙТРАЛЬНО"],["dramatic","ДРАМАТИЧНО"],["kids","ДЕТСКИЙ"],["doc","ДОК"]];
const MOODS   = [["light","СВЕТЛЫЙ"],["dark","ТЁМНЫЙ"],["epic","ЭПИК"],["cute","МИЛЫЙ"],["mystery","ТАЙНА"]];
const PALETTES = [["AUTO","АВТО"],["COOL","ХОЛОДНАЯ"],["WARM","ТЁПЛАЯ"],["MONO","МОНО"],["VIVID","ЯРКАЯ"]];
const LANGS   = [["ru","RU · Рус"],["en","EN · Eng"],["ua","UA · Укр"]];
const MODS    = [
  ["glow","свечение"],["scar","шрам"],["cape","плащ"],["glasses","очки"],
  ["mask","маска"],["tiny","маленький"],["fluffy","пушистый"],["robotic","робот"],
  ["battle","боевые следы"],["wet","мокрый"],["dirt","грязный"],["glitter","блёстки"],
];

// Character Override — глобальные модификаторы (как в storyboard)
const CHAR_MODS = [
  ["beard","Щетина"],["scar","Шрам"],["dirt","Грязь"],["bruises","Синяки"],
  ["sweat","Пот"],["exhaustion","Истощение"],["pale","Бледность"],["blood","Кровь (сдержанно)"],
];
const CHAR_MOD_LABELS = {
  beard:"beard/stubble", scar:"visible scar tissue", dirt:"mud and dirt on skin and clothing",
  bruises:"visible bruising", sweat:"sweat-soaked skin and fabric",
  exhaustion:"extreme exhaustion — hollow eyes, slack posture",
  pale:"abnormal pallor — pale skin, dark under-eyes",
  blood:"restrained blood traces (safe framing)",
};
const FORMATS = [
  { f:"shorts",  a:"9:16",  d:60,  ket:"|shorts⟩", name:"SHORTS · REELS", spec:"9:16 · до 90с" },
  { f:"tiktok",  a:"9:16",  d:45,  ket:"|tiktok⟩", name:"TIKTOK",         spec:"9:16 · до 60с" },
  { f:"youtube", a:"16:9",  d:300, ket:"|youtube⟩", name:"YOUTUBE",        spec:"16:9 · до 10мин" },
  { f:"custom",  a:"1:1",   d:120, ket:"|ψ⟩",      name:"СВОЙ ФОРМАТ",    spec:"любой ratio" },
];
const STYLE_PRESETS = [
  { id:"pixar3d",        label:"3D Pixar",        icon:"🧸", dna:"premium 3D family cartoon, soft rounded forms, fluffy materials, expressive eyes, warm studio lighting" },
  { id:"cinematic",      label:"Кинематограф",    icon:"🎬", dna:"cinematic animated film look, dramatic key light, realistic atmosphere, high production value" },
  { id:"storybook_anime",label:"Studio Ghibli",   icon:"🌿", dna:"hand-drawn fairytale anime mood, watercolor backgrounds, gentle nature details, magical atmosphere" },
  { id:"watercolor",     label:"Акварель",        icon:"🦩", dna:"soft watercolor cartoon, paper texture, pastel washes, gentle outlines" },
  { id:"comic",          label:"Комикс",          icon:"🐶", dna:"comic book cartoon, bold ink outlines, halftone texture, dynamic panels" },
  { id:"kids_book",      label:"Детская книжка",  icon:"📖", dna:"children picture book illustration, cozy soft colors, simple friendly shapes" },
  { id:"flat_design",    label:"Flat-дизайн",     icon:"🦉", dna:"flat vector cartoon design, clean geometric forms, bold simple colors" },
  { id:"clay",           label:"Пластилин",       icon:"🧫", dna:"claymation cartoon, handmade plasticine texture, rounded sculpted characters" },
  { id:"cyberpunk",      label:"Киберпанк",       icon:"🕶️", dna:"cyberpunk animated look, neon cyan magenta lights, glowing tech details" },
  { id:"dark_fantasy",   label:"Тёмное фэнтези",  icon:"🧝", dna:"dark fantasy animation, moody fog, mystical glow, dramatic shadows" },
  { id:"anime_manga",    label:"Аниме / Манга",   icon:"⚡", dna:"anime manga cartoon, sharp expressive eyes, cel shading, clean line art" },
  { id:"custom",         label:"Свой стиль",      icon:"⚛️", dna:"custom cartoon style supplied by user" },
];
const STYLE_DNA = Object.fromEntries(STYLE_PRESETS.map((x) => [x.id, x.dna]));

const MOOD_SFX = {
  light:"playful cartoon ambience, soft musical notes",
  dark:"mysterious cartoon tension, low moody drone",
  epic:"epic cartoon fanfare, dramatic percussion",
  cute:"cheerful cartoon sounds, soft bells and chimes",
  mystery:"eerie cartoon atmosphere, subtle whisper ambience",
};

const CHAIN_MODES = [["styleDNA","STYLE DNA"],["worldHero","WORLD + HERO"]];
const STRICT_LEVELS = [["hard","HARD"],["soft","SOFT"],["maximum","MAXIMUM"]];
const REF_MODES = [["heroAndPrevious","ANCHOR + PART"],["heroOnly","ТОЛЬКО ANCHOR"],["previousOnly","ТОЛЬКО PART"]];
const APP_MODES = [["full","FULL"],["compact","COMPACT"],["minimal","MINIMAL"]];
const CONSISTENCY = [["ultra","ULTRA"],["high","HIGH"],["normal","NORMAL"]];
const PART_SIZES  = [2,3,4,6];

const DEMO = {
  ru:"Однажды маленький дракон проснулся и понял, что умеет летать. Он поднялся выше облаков и увидел целый мир. Внизу его ждали друзья. Дракон решил вернуться и показать им небо. Вместе они полетели навстречу горизонту.",
  en:"One day a tiny dragon woke up and discovered it could fly. It rose above the clouds and saw the whole world. Below, friends were waiting. The dragon decided to return and share the sky. Together they soared toward the horizon.",
  ua:"Одного дня маленький дракон прокинувся і зрозумів, що вміє літати. Він піднявся вище хмар і побачив увесь світ.",
};

// ─── CLIENT-SIDE PROMPT BUILDERS ─────────────────────────────────────────────

function stylePrompt(s) {
  return s.style === "custom" ? (s.custom || "custom cartoon style") : (STYLE_DNA[s.style] || STYLE_DNA.pixar3d);
}

function buildCartoonImagePromptClient(scene, s) {
  const char0 = s.heroes[0];
  const charRef = char0
    ? `Character: ${char0.name}. ${char0.description || ""}. Face Lock: preserve face, silhouette, outfit, color DNA.`
    : "";
  const sceneDesc = String(scene.voice_line || "").split(/(?<=[.!?])/)[0] || scene.voice_line || "";
  return `SCENE PRIMARY FOCUS: ${[
    sceneDesc,
    `STYLE: ${stylePrompt(s)}. Mood: ${s.mood}. Palette: ${s.palette}.`,
    charRef,
    `Camera: ${scene.camera || "Medium Shot"}.`,
    `Format: ${s.aspect} cartoon frame. Clean composition, strong focal point, no text, no watermark.`,
  ].filter(Boolean).join(" ")}`;
}

function buildCartoonVideoPromptClient(scene, s, duration) {
  const char0 = s.heroes[0];
  const charLock = char0
    ? `${char0.name}: preserve face, silhouette, outfit, proportions, color DNA.`
    : "";
  const action = String(scene.voice_line || "subtle expressive cartoon motion")
    .split(/(?<=[.!?])/)[0].trim() || "subtle expressive cartoon motion";
  const sfx    = MOOD_SFX[s.mood] || MOOD_SFX.light;
  const voLine = s.voToggle && scene.voice_line ? `VO: ${scene.voice_line}.` : "";
  const contLine = s.videoConsistency === "ultra"
    ? "Ultra continuity: same face, outfit, color DNA, style across all scenes."
    : "Keep visual continuity.";
  return `ANIMATE CURRENT FRAME: ${[
    `STYLE: ${stylePrompt(s)}. Mood: ${s.mood}. Palette: ${s.palette}.`,
    charLock,
    `Action: ${action}.`,
    `Camera: ${scene.camera || "Medium Shot"}.`,
    `SFX: ${sfx}.`,
    voLine,
    contLine,
    "No subtitles, no UI, no watermark.",
    `${duration}s smooth cartoon motion.`,
  ].filter(Boolean).join(" ")}`;
}

// ─── AUTO-CHAIN PROMPT BUILDER (client-side) ──────────────────────────────────

function buildCartoonAutoChainPartClient({
  s, scenes, partScenes, partIndex, partSize,
  heroAnchorUploaded = false,
}) {
  if (!partScenes.length) return "";
  const cols   = Math.min(2, partScenes.length);
  const rows   = Math.ceil(partScenes.length / cols);
  const labels = partScenes.map((_, i) => `F${String(partIndex * partSize + i + 1).padStart(2, "0")}`);
  const totalScenes = scenes.length;
  const isFirst = partIndex === 0;
  const charBlock = s.heroes.map((c) => {
    const mods = c.modifiers?.length ? ` Modifiers: ${c.modifiers.join(", ")}.` : "";
    const fld  = c.charFaceLock ? ` Face ref: ${c.charFaceLock}.` : "";
    return `${c.name} (${c.role || "main"}): ${c.description || "cartoon character"}.${mods}${fld} FACE LOCK ON.`;
  }).join("\n") || "No locked characters.";

  const refText = isFirst
    ? (heroAnchorUploaded
        ? "PART 1: Use uploaded HERO ANCHOR as face/style reference. Do not copy composition."
        : "PART 1: No previous PART. Establish cartoon style from Style Lock.")
    : ({ heroAndPrevious:"Use uploaded HERO ANCHOR for face lock and PREVIOUS PART for world/style. Do not copy compositions.", heroOnly:"Use uploaded HERO ANCHOR for face/identity lock only.", previousOnly:"Use uploaded PREVIOUS PART for world/style continuity only." }[s.referenceMode] || "Use references for continuity.");

  const strictText = { hard:"HARD — follow scene descriptions; cinematic cartoon composition allowed.", soft:"SOFT — cartoon polish ok; never contradict scenes.", maximum:"MAXIMUM — literal only." }[s.strictLevel] || "HARD";
  const chainText  = s.chainMode === "styleDNA"
    ? "STYLE DNA — every frame shares same cartoon visual universe and style lock."
    : "WORLD + HERO — world and recurring character identity stay locked.";

  const frameBlocks = partScenes.map((sc, i) => {
    const contLink = i === 0
      ? "CONTINUITY LINK: establish first visual state. Maintain style lock from previous parts."
      : `CONTINUITY LINK: continue from ${labels[i-1]}. Preserve world, style, characters. Change only camera and composition.`;
    const sceneText = s.appearanceMode === "minimal"
      ? sc.voice_line || ""
      : (sc.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "") || sc.voice_line || "";
    return `${labels[i]} [${sc.act || "BUILD"}]:\n${contLink}\nSCENE: ${sceneText}\nCamera: ${sc.camera || "Medium Shot"}.`;
  }).join("\n\n");

  return `CARTOON STORYBOARD GRID — PART ${partIndex + 1}
Frames: ${labels.join(", ")} of ${totalScenes} total

REFERENCE INPUT:
${refText}

FORMAT:
${cols} columns × ${rows} rows — exactly ${partScenes.length} cartoon cells.
Each cell: ${s.aspect} portrait cartoon frame.
Thin black separators. Frame labels only in small white text (top-left corner).
NO other text, no subtitles, no UI, no watermark.

CARTOON STYLE LOCK — MUST APPEAR IN EVERY FRAME:
${stylePrompt(s)}
Mood: ${s.mood}. Palette: ${s.palette}.
All frames share the SAME cartoon style, color family and visual language.
NO realistic photography. NO live-action realism.

CHAIN MODE: ${chainText}
STRICTNESS: ${strictText}

CHARACTER LOCK:
${charBlock}

FRAMES:
${frameBlocks}

FINAL CHECK: Exactly ${partScenes.length} frames. Labels: ${labels.join(", ")}.
Same cartoon style across ALL cells. Character identity stable. No new plot events.`;
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function split(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((x) => x.trim()).filter((x) => x.length > 3).slice(0, 18);
}

function act(i, n) {
  const p = i / Math.max(1, n);
  if (p < .12) return "HOOK";
  if (p < .55) return "BUILD";
  if (p < .86) return "CLIMAX";
  return "OUTRO";
}

function uniq(list) { return [...new Set(list.map((x) => String(x || "").trim()).filter(Boolean))]; }

function inferHeroNames(script, lang) {
  const text  = String(script || "");
  const quoted = [...text.matchAll(/[«"]([^«»".]{2,32})[»"]/g)].map((m) => m[1]);
  const ru = ["робот","кот","кошка","пёс","дракон","лиса","волк","принцесса","маг","птица","монстр","заяц","зайчик","мальчик","девочка"];
  const en = ["robot","cat","dog","dragon","fox","wolf","princess","wizard","bird","monster","bunny","rabbit","boy","girl"];
  const dict = lang === "en" ? en : ru;
  const found = dict.filter((w) => new RegExp(`(^|\\s)${w}[а-яa-zё]*`,"i").test(text));
  return uniq([...quoted, ...found]).slice(0, 3);
}

function heroDescription(name, s) {
  const style = STYLE_PRESETS.find((x) => x.id === s.style)?.label || s.style;
  return `${name}: главный мульт-персонаж. Стиль: ${style}. Mood: ${s.mood}. Palette: ${s.palette}. Сохранять лицо, силуэт, пропорции, цветовое ДНК во всех кадрах.`;
}

function referencePrompt(hero, s) {
  return `CHARACTER REFERENCE SHEET: ${hero.name}. ${hero.description || heroDescription(hero.name, s)} Full body front view, side view, 3/4 view, facial expressions, outfit lock, color palette lock. STYLE DNA: ${stylePrompt(s)}. Clean cartoon model sheet, white background, no text, no watermark.`;
}

function inferHeroes(s) {
  const names = inferHeroNames(s.script, s.lang);
  const fallback = names.length ? names : [s.lang === "en" ? "main hero" : "главный герой"];
  return fallback.slice(0, 3).map((name, i) => ({
    id: `char_${i+1}`,
    name: name[0]?.toUpperCase() + name.slice(1),
    role: i === 0 ? "main" : "support",
    description: heroDescription(name, s, i),
    face_lock: true,
    charFaceLock: "",
    modifiers: [],
    reference_prompt: "",
  }));
}

function getAutoSuggestedMods(s) {
  const ctx = (s.style + " " + s.mood + " " + (s.title || "")).toLowerCase();
  const mods = [];
  if (/dark|mystery|dark_fantasy/.test(ctx))  mods.push("scar","mask");
  if (/battle|epic|fight/.test(ctx))           mods.push("scar","battle");
  if (/magic|wizard|fantasy|ghibli/.test(ctx)) mods.push("glow","cape");
  if (/cute|kids|chibi|kids_book/.test(ctx))   mods.push("fluffy","tiny");
  if (/robot|cyber|mech|cyberpunk/.test(ctx))  mods.push("robotic","glitter");
  if (/water|ocean|sea/.test(ctx))             mods.push("wet");
  if (/clay|mud/.test(ctx))                    mods.push("dirt");
  return [...new Set(mods)];
}

function buildScenes(s, forcedScript) {
  const script = forcedScript ?? s.script;
  const parts  = split(script);
  const heroes = s.heroes.length ? s.heroes : inferHeroes({ ...s, script });
  const dur    = Math.max(2, Math.round(Number(s.duration || 60) / Math.max(1, parts.length)));
  return parts.map((line, i) => {
    const camera   = CAMS[i % CAMS.length];
    const chars    = heroes.slice(0, 2).map((h) => h.name).filter(Boolean);
    const sceneObj = { voice_line: line, camera, act: act(i, parts.length), characters_in_scene: chars };
    return {
      id: `scene_${String(i+1).padStart(2,"0")}`,
      order: i+1,
      act: act(i, parts.length),
      voice_line: line,
      duration_sec: dur,
      camera,
      characters_in_scene: chars,
      image_prompt_en: buildCartoonImagePromptClient(sceneObj, { ...s, heroes }),
      video_prompt_en: buildCartoonVideoPromptClient(sceneObj, { ...s, heroes }, dur),
      continuity_note: "Preserve Style Lock, Hero Anchor, Face Lock and world continuity.",
    };
  });
}

function splitIntoParts(scenes, partSize) {
  const size  = Math.max(1, Number(partSize) || 4);
  const parts = [];
  for (let i = 0; i < scenes.length; i += size) parts.push(scenes.slice(i, i + size));
  return parts;
}

// ─── VALIDATE SCRIPT ──────────────────────────────────────────────────────────

function validateScript(script) {
  if (!script.trim()) return { ok: false, msg: "Сценарий пуст" };
  const words = script.trim().split(/\s+/).length;
  if (words < 8) return { ok: false, msg: `Слишком короткий (${words} слов, нужно ≥8)` };
  if (words > 6000) return { ok: false, msg: `Слишком длинный (${words} слов)` };
  const sents = script.split(/(?<=[.!?…])\s+|\n+/).filter((s) => s.trim().length > 3);
  return { ok: true, words, sentences: sents.length, msg: `${words} слов · ~${sents.length} сцен` };
}

// Context-aware character modifier suggestions (adapted from storyboard)
function suggestedCharMods(s) {
  const t = (s.style + " " + s.mood + " " + s.title + " " + (s.script || "")).toLowerCase();
  const out = [];
  if (/war|войн|battle|солдат|combat/.test(t))          out.push("dirt","scar","bruises");
  if (/prison|тюрьм|jail|заключ/.test(t))               out.push("pale","bruises","exhaustion");
  if (/surviv|выживан|wild|jungle|дикий/.test(t))       out.push("dirt","sweat","scar");
  if (/dark_fantasy|horror|ужас|monster/.test(t))        out.push("scar","pale","blood");
  if (/epic|hero|battle|fight|fight/.test(t))           out.push("sweat","exhaustion");
  if (/space|космос|sci.fi|фантаст/.test(t))            out.push("pale","exhaustion");
  if (/medieval|средневеков|slave|раб/.test(t))         out.push("dirt","exhaustion","beard");
  return [...new Set(out)];
}

// Build character override block string for prompts
function buildCharOverrideBlock(s) {
  if (!s.charOverrideEnabled) return "";
  const mods = Object.entries(s.charModifiers).filter(([,v]) => v).map(([k]) => CHAR_MOD_LABELS[k] || k);
  const lines = [];
  if (s.charFaceLock.trim()) lines.push(`FACE IDENTITY LOCK (from hero anchor — do NOT change): ${s.charFaceLock.trim()}`);
  if (mods.length) lines.push(`CHARACTER APPEARANCE MODIFIERS (apply to all frames): ${mods.join(", ")}`);
  return lines.join("\n");
}

function stripPreview(sc) { if (!sc) return sc; const { frame_preview, ...rest } = sc; return frame_preview ? { ...rest, frame_reference: "uploaded_frame_attached_in_ui" } : rest; }

function projectPayload(s, forcedScript) {
  return {
    concept: { title: s.title, format: s.format, aspect_ratio: s.aspect, duration_sec: Number(s.duration), language: s.lang },
    style: { preset: s.style, label: STYLE_PRESETS.find((x) => x.id === s.style)?.label || s.style, custom_prompt: s.custom || null, mood: s.mood, palette: s.palette, dna: stylePrompt(s) },
    chain: { mode: s.chainMode, strictLevel: s.strictLevel, referenceMode: s.referenceMode, appearanceMode: s.appearanceMode, partSize: s.partSize },
    settings: { voToggle: s.voToggle, videoConsistency: s.videoConsistency },
    characters: s.heroes.map((h) => ({ ...h, reference_prompt: h.reference_prompt || referencePrompt(h, s) })),
    script: { full_text: forcedScript ?? s.script, voice_style: s.voice, language: s.lang },
    storyboard: { scenes: (s.scenes || []).map(stripPreview) },
  };
}

function makeJson(s) {
  const scenes = (s.scenes.length ? s.scenes : buildScenes(s)).map(stripPreview);
  return s.serverProject || {
    project: {
      id: `cartoon_${Date.now()}`, title: s.title || "Untitled Cartoon",
      created_at: new Date().toISOString(), format: s.format,
      duration_sec: Number(s.duration), aspect_ratio: s.aspect, language: s.lang,
      style: { preset: s.style, label: STYLE_PRESETS.find((x) => x.id === s.style)?.label || s.style, mood: s.mood, palette: s.palette, dna: stylePrompt(s) },
      chain: { mode: s.chainMode, strictLevel: s.strictLevel, referenceMode: s.referenceMode, appearanceMode: s.appearanceMode, partSize: s.partSize },
    },
    characters: s.heroes.map((h) => ({ ...h, reference_prompt: h.reference_prompt || referencePrompt(h, s) })),
    script: { full_text: s.script, voice_style: s.voice, word_count: s.script.trim() ? s.script.trim().split(/\s+/).length : 0, language: s.lang },
    storyboard: {
      total_scenes: scenes.length,
      total_duration_sec: scenes.reduce((a, x) => a + Number(x.duration_sec || 0), 0),
      part_size: s.partSize, scenes,
    },
    settings: { voToggle: s.voToggle, videoConsistency: s.videoConsistency },
    generation: { target: "veo3", mode: "safe", model_script: "gpt-5.4", model_storyboard: "gpt-5.4", pipeline: "cartoon_creator_v2" },
  };
}

// ─── CROP GRID FRAME ─────────────────────────────────────────────────────────

function cropGridFrame(dataUrl, frameIndex, totalFrames, cols = 2) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const rows  = Math.ceil(totalFrames / cols);
      const w     = Math.floor(img.width  / cols);
      const h     = Math.floor(img.height / rows);
      const col   = frameIndex % cols;
      const row   = Math.floor(frameIndex / cols);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, col * w, row * h, w, h, 0, 0, w, h);
      res(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => rej(new Error("crop failed"));
    img.src = dataUrl;
  });
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────

function downloadText(text, filename, mime = "text/plain;charset=utf-8") {
  const a  = document.createElement("a");
  a.href   = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
}

function safeName(str = "cartoon") {
  return String(str || "cartoon").toLowerCase().replace(/[^a-zа-яё0-9]/gi, "-").replace(/-+/g, "-").slice(0, 40);
}

function buildExportTxt(s, json) {
  const { project, characters = [], script = {}, storyboard = {} } = json;
  const scenes = storyboard.scenes || [];
  return [
    `NEUROCINE CARTOON — ${project?.title || "Untitled"}`,
    `Format: ${project?.format} | ${project?.aspect_ratio} | ${project?.duration_sec}s`,
    `Style: ${project?.style?.preset} | Mood: ${project?.style?.mood} | Palette: ${project?.style?.palette}`,
    `Language: ${project?.language || s.lang}`,
    "",
    "═══ СЦЕНАРИЙ ═══",
    script.full_text || "",
    "",
    "═══ ПЕРСОНАЖИ ═══",
    ...characters.map((c) => `[${c.name}] ${c.role} | Face Lock: ${c.face_lock ? "ON" : "OFF"}\n${c.description || ""}`),
    "",
    "═══ STORYBOARD ═══",
    `Total scenes: ${scenes.length} | Duration: ${storyboard.total_duration_sec || 0}s`,
    "",
    ...scenes.flatMap((sc) => [
      `[${sc.id}] ${sc.act} | ${sc.duration_sec}s | Camera: ${sc.camera}`,
      `VO: ${sc.voice_line || ""}`,
      `IMAGE: ${sc.image_prompt_en || ""}`,
      `VIDEO: ${sc.video_prompt_en || ""}`,
      "",
    ]),
  ].join("\n");
}

function buildExportFlow(s, json) {
  const { project, characters = [], script = {}, storyboard = {} } = json;
  const scenes = storyboard.scenes || [];
  return [
    `# NEUROCINE CARTOON FLOW — ${project?.title || "Untitled"}`,
    `# ${project?.format} | ${project?.aspect_ratio} | ${project?.duration_sec}s | ${project?.style?.preset}`,
    "",
    `GLOBAL STYLE LOCK: ${stylePrompt(s)}. Mood: ${s.mood}. Palette: ${s.palette}.`,
    "",
    "CHARACTER DNA:",
    ...characters.map((c) => `- ${c.name}: ${c.description || "cartoon character"}. Face Lock: ${c.face_lock ? "ON" : "OFF"}.`),
    "",
    "VO SCRIPT:",
    script.full_text || "",
    "",
    "---",
    "",
    ...scenes.flatMap((sc, i) => [
      `## SCENE ${i+1} — ${sc.act} [${sc.duration_sec}s]`,
      `VO: ${sc.voice_line || ""}`,
      "",
      "IMAGE PROMPT:",
      sc.image_prompt_en || "",
      "",
      "VIDEO PROMPT (VEO3):",
      sc.video_prompt_en || "",
      "",
      "---",
      "",
    ]),
  ].join("\n");
}

// ─── REDUCER ──────────────────────────────────────────────────────────────────

const initial = {
  step: 1,
  title: "", format: "shorts", aspect: "9:16", duration: 60, lang: "ru",
  style: "pixar3d", mood: "light", palette: "AUTO", custom: "",
  chainMode: "styleDNA", strictLevel: "hard", referenceMode: "heroAndPrevious",
  appearanceMode: "full", voToggle: true, videoConsistency: "ultra",
  partSize: 4, partIndex: 0,
  script: "", voice: "neutral",
  heroes: [], scenes: [], selected: 0,
  heroAnchor: null, prevPartAnchor: null,
  busy: false, status: "ГОТОВО",
  serverProject: null, snapshotStatus: "", scriptError: "",
  charOverrideEnabled: false, charFaceLock: "", charModifiers: { beard:false, scar:false, dirt:false, bruises:false, sweat:false, exhaustion:false, pale:false, blood:false },
  gridColsOverride: null, gridManualFrames: null, scriptValidation: null,
};

function reducer(s, a) {
  if (a.type === "set")     return { ...s, [a.key]: a.value, serverProject: null, scenes: ["style","mood","palette","custom","voToggle","videoConsistency"].includes(a.key) ? [] : s.scenes };
  if (a.type === "chain")   return { ...s, [a.key]: a.value, serverProject: null };
  if (a.type === "v2")      return { ...s, v2: { ...s.v2, [a.key]: a.value }, serverProject: null };
  if (a.type === "format")  return { ...s, format: a.f, aspect: a.a, duration: a.d, serverProject: null };
  if (a.type === "step")    return { ...s, step: Math.min(6, Math.max(1, a.step)), scenes: a.step >= 5 && !s.scenes.length ? buildScenes(s) : s.scenes };
  if (a.type === "script")  return { ...s, script: a.value, scenes: [], serverProject: null };
  if (a.type === "aiScript") return { ...s, title: a.script?.title || s.title, voice: a.script?.voice_style || s.voice, script: a.script?.full_text || s.script, heroes: [], scenes: [], serverProject: null, busy: false, status: a.status || "СЦЕНАРИЙ AI ГОТОВ" };
  if (a.type === "extractHeroes") return { ...s, heroes: inferHeroes(s), scenes: [], serverProject: null, status: "ГЕРОИ НАЙДЕНЫ" };
  if (a.type === "addHero") return s.heroes.length >= 3 ? s : { ...s, heroes: [...s.heroes, { id:`char_${s.heroes.length+1}`, name:`Герой ${s.heroes.length+1}`, role:"main", description:"", face_lock:true, charFaceLock:"", modifiers:[], reference_prompt:"" }], serverProject: null };
  if (a.type === "hero")    return { ...s, heroes: s.heroes.map((h,i) => i === a.i ? { ...h, [a.key]: a.value } : h), serverProject: null, scenes: [] };
  if (a.type === "heroMod") return { ...s, heroes: s.heroes.map((h,i) => i === a.i ? { ...h, modifiers: h.modifiers.includes(a.mod) ? h.modifiers.filter((x) => x !== a.mod) : [...h.modifiers, a.mod] } : h), serverProject: null, scenes: [] };
  if (a.type === "deleteHero") return { ...s, heroes: s.heroes.filter((_, i) => i !== a.i), serverProject: null, scenes: [] };
  if (a.type === "localStoryboard") {
    const nextScenes = Array.isArray(a.scenes) ? a.scenes : buildScenes(s, a.script);
    return {
      ...s,
      script: a.script ?? s.script,
      heroes: s.heroes.length ? s.heroes : inferHeroes({ ...s, script: a.script ?? s.script }),
      scenes: nextScenes,
      selected: Array.isArray(a.scenes) ? s.selected : 0,
      serverProject: null,
      busy: false,
      status: a.status || "STORYBOARD ЛОКАЛЬНО",
    };
  }
  if (a.type === "aiProject") return { ...s, serverProject: a.project, scenes: a.project?.storyboard?.scenes || s.scenes, selected: 0, busy: false, status: a.status || "STORYBOARD AI ГОТОВ" };
  if (a.type === "select")  return { ...s, selected: a.i };
  if (a.type === "partIndex") return { ...s, partIndex: a.i };
  if (a.type === "busy")    return { ...s, busy: a.value, status: a.status ?? s.status };
  if (a.type === "status")  return { ...s, status: a.status };
  if (a.type === "charOverride") return { ...s, charOverrideEnabled: a.value, serverProject: null };
  if (a.type === "charMod")      return { ...s, charModifiers: { ...s.charModifiers, [a.key]: !s.charModifiers[a.key] }, serverProject: null, scenes: [] };
  if (a.type === "charFaceLock") return { ...s, charFaceLock: a.value, serverProject: null };
  if (a.type === "scriptValidation") return { ...s, scriptValidation: a.value };
  if (a.type === "scriptError")      return { ...s, scriptError: a.value, busy: false };
  if (a.type === "heroAnchor")   return { ...s, heroAnchor: a.value, status: "HERO ANCHOR ЗАГРУЖЕН" };
  if (a.type === "prevAnchor")   return { ...s, prevPartAnchor: a.value, status: "PREVIOUS PART ЗАГРУЖЕН" };
  if (a.type === "snapshotStatus") return { ...s, snapshotStatus: a.value };
  if (a.type === "frame") {
    const base = s.scenes.length ? s.scenes : buildScenes(s);
    return { ...s, scenes: base.map((sc,i) => i === a.i ? { ...sc, frame_preview: a.preview, frame_file_name: a.name, frame_reference: "uploaded_frame_attached_in_ui" } : sc), selected: a.i, serverProject: null, status: "FRAME ЗАГРУЖЕН" };
  }
  if (a.type === "applySnapshot") {
    const d = a.data;
    return {
      ...s,
      title: d.title || s.title,
      format: d.format || s.format,
      aspect: d.aspect_ratio || d.aspect || s.aspect,
      duration: d.duration_sec || d.duration || s.duration,
      lang: d.language || d.lang || s.lang,
      style: d.style?.preset || d.style || s.style,
      mood: d.style?.mood || d.mood || s.mood,
      palette: d.style?.palette || d.palette || s.palette,
      custom: d.style?.custom_prompt || d.custom || s.custom,
      chainMode: d.chain?.mode || d.chainMode || s.chainMode,
      strictLevel: d.chain?.strictLevel || d.strictLevel || s.strictLevel,
      referenceMode: d.chain?.referenceMode || d.referenceMode || s.referenceMode,
      appearanceMode: d.chain?.appearanceMode || d.appearanceMode || s.appearanceMode,
      partSize: d.chain?.partSize || d.partSize || s.partSize,
      voToggle: d.settings?.voToggle ?? d.voToggle ?? s.voToggle,
      videoConsistency: d.settings?.videoConsistency || d.videoConsistency || s.videoConsistency,
      script: d.script?.full_text || d.script || s.script,
      voice: d.script?.voice_style || d.voice || s.voice,
      heroes: Array.isArray(d.characters) ? d.characters.map((c) => ({ ...c, charFaceLock: c.face_lock_description || c.charFaceLock || "" })) : s.heroes,
      scenes: d.storyboard?.scenes || d.scenes || [],
      serverProject: null,
      snapshotStatus: "✓ Проект загружен",
    };
  }
  return s;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function QuantumCartoonCreatorV2() {
  const [s, dispatch] = useReducer(reducer, initial);
  const fieldRef = useRef(null), waveRef = useRef(null), tagRef = useRef(null);
  const waveRefApi = useRef(null), snapInputRef = useRef(null);
  const json     = useMemo(() => makeJson(s), [s]);
  const jsonText = useMemo(() => JSON.stringify(json, null, 2), [json]);
  const scenes   = s.scenes.length ? s.scenes : buildScenes(s);
  const parts    = useMemo(() => splitIntoParts(scenes, s.partSize), [scenes, s.partSize]);
  const currentPartScenes = parts[s.partIndex] || [];

  useEffect(() => {
    document.body.classList.add("route-cartoon");
    const stopField = initQuantumField(fieldRef.current);
    const wave      = initWaveCanvas(waveRef.current);
    const stopType  = initTypewriter(tagRef.current);
    waveRefApi.current = wave;
    wave.setDuration(s.duration);
    return () => { document.body.classList.remove("route-cartoon"); stopField(); wave.destroy(); stopType(); };
  }, []);
  useEffect(() => { waveRefApi.current?.setDuration(s.duration); }, [s.duration]);

  function go(step) { dispatch({ type:"step", step }); if (typeof window !== "undefined") window.scrollTo({ top:0, behavior:"smooth" }); }
  async function postJson(url, payload) {
    const res  = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { data, status: res.status });
    return data;
  }

  // — Script generation
  function runScriptValidation(text) {
    const v = validateScript(text);
    dispatch({ type:"scriptValidation", value: v });
    return v;
  }

  async function generateScript() {
    dispatch({ type:"busy", value:true, status:"AI ДУМАЕТ · СЦЕНАРИЙ" });
    try {
      const data = await postJson("/api/cartoon/script", projectPayload(s));
      dispatch({ type:"aiScript", script: data.script, status:`СЦЕНАРИЙ AI ГОТОВ · ${data.model_used || "model"}` });
      dispatch({ type:"scriptError", value: "" });
    } catch (e) {
      const msg = e.status === 403 ? "AI закрыт — подключи API ключ в настройках" : e.status === 401 ? "Авторизация failed — войди в аккаунт" : (e.message || "AI недоступен — попробуй ещё раз");
      dispatch({ type:"scriptError", value: msg });
    }
  }

  // — Storyboard generation
  async function createStoryboardV2(nextStep = 5) {
    const scriptForStoryboard = s.script.trim();
    if (!scriptForStoryboard) { dispatch({ type:"status", status:"⚠ СНАЧАЛА НАПИШИ ИЛИ СГЕНЕРИРУЙ СЦЕНАРИЙ" }); return; }
    const heroes = s.heroes.length ? s.heroes : inferHeroes({ ...s, script: scriptForStoryboard });
    const state  = { ...s, script: scriptForStoryboard, heroes };
    dispatch({ type:"busy", value:true, status:"СОЗДАЮ STORYBOARD" });
    try {
      const data = await postJson("/api/cartoon/storyboard", projectPayload(state, scriptForStoryboard));
      dispatch({ type:"aiProject", project: data.project, status:`STORYBOARD ГОТОВ · ${data.model_used || "AI"}` });
      go(nextStep);
    } catch (e) {
      dispatch({ type:"localStoryboard", script: scriptForStoryboard, status: e.status === 403 ? "STORYBOARD ЛОКАЛЬНО · AI ЗАКРЫТ" : "STORYBOARD ЛОКАЛЬНО" });
      go(nextStep);
    }
  }

  // — Frame image analysis → image prompt (Explore)
  async function doExplore(frameDataUrl, sceneIndex) {
    if (!frameDataUrl) return;
    dispatch({ type:"status", status:"AI АНАЛИЗИРУЕТ КАДР..." });
    try {
      const res  = await fetch("/api/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ image: frameDataUrl, task: "cartoon_explore", scene: scenes[sceneIndex], style: stylePrompt(s), mood: s.mood }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.prompt) {
        const updated = (s.scenes.length ? s.scenes : buildScenes(s)).map((sc, i) =>
          i === sceneIndex ? { ...sc, image_prompt_en: data.prompt } : sc
        );
        dispatch({ type:"localStoryboard", status:"IMAGE PROMPT ОБНОВЛЁН", scenes: updated });
      } else {
        dispatch({ type:"status", status:"⚠ Analyze API не вернул промпт" });
      }
    } catch (e) {
      dispatch({ type:"status", status:`⚠ Explore ошибка: ${e.message}` });
    }
  }

  // — Frame image → video prompt
  async function doVideoPrompt(frameDataUrl, sceneIndex) {
    if (!frameDataUrl) return;
    dispatch({ type:"status", status:"AI ГЕНЕРИРУЕТ VIDEO PROMPT..." });
    try {
      const res  = await fetch("/api/video", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          frame: scenes[sceneIndex], storyboard: json, target:"veo3",
          image: frameDataUrl, includeVo: s.voToggle, promptMode:"pro", consistency: s.videoConsistency,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.video_prompt_en || data.video_prompt) {
        const vp = data.video_prompt_en || data.video_prompt;
        const updated = (s.scenes.length ? s.scenes : buildScenes(s)).map((sc, i) =>
          i === sceneIndex ? { ...sc, video_prompt_en: vp } : sc
        );
        dispatch({ type:"localStoryboard", status:"VIDEO PROMPT ОБНОВЛЁН", scenes: updated });
      } else {
        dispatch({ type:"status", status:"⚠ Video API не вернул промпт" });
      }
    } catch (e) {
      dispatch({ type:"status", status:`⚠ VideoPrompt ошибка: ${e.message}` });
    }
  }

  // — Crop grid frame
  async function doCropGrid(gridDataUrl, frameLocalIndex, cols = 2) {
    try {
      const effectiveCols = s.gridColsOverride || cols;
      const effectiveFrames = s.gridManualFrames || currentPartScenes.length;
      const globalIndex = s.partIndex * s.partSize + frameLocalIndex;
      const cropped = await cropGridFrame(gridDataUrl, frameLocalIndex, effectiveFrames, effectiveCols);
      dispatch({ type:"frame", i: globalIndex, preview: cropped, name: `crop_f${globalIndex+1}.jpg` });
    } catch (e) {
      dispatch({ type:"status", status:`⚠ Crop ошибка: ${e.message}` });
    }
  }

  function uploadFrame(index, files) {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => dispatch({ type:"frame", i: index, preview: e.target?.result, name: file.name });
    reader.readAsDataURL(file);
  }

  function uploadHeroAnchor(files) {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => dispatch({ type:"heroAnchor", value: e.target?.result });
    reader.readAsDataURL(file);
  }

  function uploadPrevAnchor(files) {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => dispatch({ type:"prevAnchor", value: e.target?.result });
    reader.readAsDataURL(file);
  }

  // — Copy helpers
  function copyText(text, label = "СКОПИРОВАНО") { navigator.clipboard?.writeText(String(text || "")); dispatch({ type:"status", status: label }); }

  // — AutoChain part prompt
  function copyPartPrompt() {
    const prompt = buildCartoonAutoChainPartClient({
      s, scenes, partScenes: currentPartScenes, partIndex: s.partIndex, partSize: s.partSize,
      heroAnchorUploaded: !!s.heroAnchor,
    });
    copyText(prompt, `PART ${s.partIndex+1} PROMPT СКОПИРОВАН`);
  }

  // — Exports
  function exportJson()   { downloadText(jsonText, `${safeName(s.title)}.cartoon.json`, "application/json"); dispatch({ type:"status", status:"JSON СКАЧАН" }); }
  function exportTxt()    { downloadText(buildExportTxt(s, json), `${safeName(s.title)}.cartoon.txt`); dispatch({ type:"status", status:"TXT СКАЧАН" }); }
  function exportFlow()   { downloadText(buildExportFlow(s, json), `${safeName(s.title)}.cartoon-flow.txt`); dispatch({ type:"status", status:"FLOW СКАЧАН" }); }
  function exportAutoChainJson() {
    const partsPrompts = parts.map((partScenes, i) => ({
      part: i + 1,
      frames: partScenes.map((sc) => sc.id),
      prompt: buildCartoonAutoChainPartClient({ s, scenes, partScenes, partIndex: i, partSize: s.partSize, heroAnchorUploaded: !!s.heroAnchor }),
    }));
    downloadText(JSON.stringify({ title: s.title, chain_mode: s.chainMode, strict_level: s.strictLevel, reference_mode: s.referenceMode, total_parts: partsPrompts.length, parts: partsPrompts }, null, 2), `${safeName(s.title)}-autochain.json`, "application/json");
    dispatch({ type:"status", status:"AUTO-CHAIN JSON СКАЧАН" });
  }

  function exportAutoChainTxt() {
    const txt = parts.map((partScenes, i) => {
      const prompt = buildCartoonAutoChainPartClient({ s, scenes, partScenes, partIndex: i, partSize: s.partSize, heroAnchorUploaded: !!s.heroAnchor });
      return `===== AUTO-CHAIN PART ${i+1} =====\n\n${prompt}`;
    }).join("\n\n");
    downloadText(txt, `${safeName(s.title)}-autochain.txt`);
    dispatch({ type:"status", status:"AUTO-CHAIN TXT СКАЧАН" });
  }

  function saveSnapshot() {
    const snap = { neurocine_cartoon_snapshot:true, version:"cartoon_creator_v2", saved_at:new Date().toISOString(), ...json, settings:{ voToggle:s.voToggle, videoConsistency:s.videoConsistency }, chain:{ mode:s.chainMode, strictLevel:s.strictLevel, referenceMode:s.referenceMode, appearanceMode:s.appearanceMode, partSize:s.partSize } };
    downloadText(JSON.stringify(snap, null, 2), `${safeName(s.title)}.neurocine.json`, "application/json");
    dispatch({ type:"snapshotStatus", value:"✓ Snapshot сохранён" });
  }
  function loadSnapshot(files) {
    const file = files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (!data.neurocine_cartoon_snapshot && !data.storyboard && !data.script) throw new Error("Не NeuroCine snapshot");
        dispatch({ type:"applySnapshot", data: { ...data, ...(data.project || {}) } });
      } catch (e) {
        dispatch({ type:"snapshotStatus", value:`✗ Ошибка: ${e.message}` });
      } finally {
        if (snapInputRef.current) snapInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function next() {
    if (s.busy) return;
    if (s.step === 3) { if (!s.heroes.length) dispatch({ type:"extractHeroes" }); return go(4); }
    if (s.step === 4) return createStoryboardV2(5);
    if (s.step === 5) return go(6);
    if (s.step === 6) return window.qPulse?.(window.innerWidth/2, window.innerHeight/2, "#8b00ff");
    go(s.step + 1);
  }

  const curScene = scenes[s.selected] || scenes[0];

  return (
    <div className="qcc-root">
      <canvas id="qc" ref={fieldRef} />
      <div className="hex-grid" /><div className="vignette" />
      <div className="wrap">
        <header className="q-header">
          <div className="q-logo"><div className="q-logo-icon"><div className="orb" /></div><div className="q-logo-text">NEUROCINE</div></div>
          <div className="q-sub">Quantum Cartoon Intelligence · v2</div>
          <div className="q-tagline" ref={tagRef} />
        </header>
        <ProductionStatusBar s={s} scenes={scenes} />
        <div className="q-status-line">{s.busy ? "⚡ " : "◈ "}{s.status}</div>
        <StepBar step={s.step} go={go} />
        {s.step === 1 && <Step1 s={s} dispatch={dispatch} waveRef={waveRef} />}
        {s.step === 2 && <Step2 s={s} dispatch={dispatch} />}
        {s.step === 3 && <StepScript s={s} dispatch={dispatch} onAi={generateScript} onDemo={() => dispatch({ type:"script", value: DEMO[s.lang] || DEMO.ru })} />}
        {s.step === 4 && <StepHeroes s={s} dispatch={dispatch} copyText={copyText} />}
        {s.step === 5 && (
          <StepStoryboard
            s={s} dispatch={dispatch} scenes={scenes} parts={parts}
            currentPartScenes={currentPartScenes} curScene={curScene}
            onStoryboard={() => createStoryboardV2(5)}
            onCopyPart={copyPartPrompt}
            uploadFrame={uploadFrame} uploadHeroAnchor={uploadHeroAnchor} uploadPrevAnchor={uploadPrevAnchor}
            doCropGrid={doCropGrid} doExplore={doExplore} doVideoPrompt={doVideoPrompt}
            copyText={copyText}
          />
        )}
        {s.step === 6 && (
          <StepExport
            s={s} jsonText={jsonText} snapInputRef={snapInputRef}
            onExportJson={exportJson} onExportTxt={exportTxt} onExportFlow={exportFlow}
            onExportAutoChainJson={exportAutoChainJson} onExportAutoChainTxt={exportAutoChainTxt}
            onSaveSnapshot={saveSnapshot} onLoadSnapshot={loadSnapshot}
            copyJson={() => copyText(jsonText, "JSON СКОПИРОВАН")}
          />
        )}
      </div>
      <div className="nav">
        {s.step > 1 && <button className="nav-back" disabled={s.busy} onClick={() => go(s.step - 1)}>← НАЗАД</button>}
        <button className={`nav-next${s.step === 6 ? " launch" : ""}`} disabled={s.busy} onClick={next}>
          {s.busy ? "ДУМАЮ..." : s.step === 5 ? "ЭКСПОРТ →" : s.step === 6 ? "⚡ ЗАПУСК" : "ДАЛЕЕ →"}
        </button>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// ─── UPLOAD ZONE ─────────────────────────────────────────────────────────────

function UploadZone({ label, hint, onFile, accept = "image/*", compact = false }) {
  return (
    <label style={{ display:"flex", flexDirection: compact ? "row" : "column", alignItems:"center", gap: compact ? 8 : 6, padding: compact ? "6px 12px" : "12px 16px", border:"1px dashed #444", borderRadius:8, cursor:"pointer", background:"#0d0416", minWidth: compact ? "auto" : 120, textAlign:"center" }}>
      <input type="file" accept={accept} style={{ display:"none" }} onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) { const reader = new FileReader(); reader.onload = (ev) => { onFile(ev.target?.result); }; reader.readAsDataURL(f); e.target.value = ""; }
      }} />
      <span style={{ fontSize: compact ? "1em" : "1.5em" }}>📎</span>
      <span style={{ fontSize:"0.78em", color:"#c084fc", fontWeight:700 }}>{label}</span>
      {hint && !compact && <span style={{ fontSize:"0.68em", color:"#555" }}>{hint}</span>}
    </label>
  );
}

function ProductionStatusBar({ s, scenes }) {
  const cells = [
    { label:"SCRIPT",     ok: !!s.script.trim(),    val: s.script.trim() ? `${s.script.trim().split(/\s+/).length}w` : "—" },
    { label:"STORYBOARD", ok: scenes.length > 0,    val: scenes.length > 0 ? `${scenes.length} сцен` : "—" },
    { label:"PART",       ok: scenes.length > 0,    val: scenes.length > 0 ? `#${s.partIndex+1}/${Math.ceil(scenes.length/s.partSize)}` : "—" },
    { label:"HEROES",     ok: s.heroes.length > 0,  val: s.heroes.length > 0 ? `${s.heroes.length} locked` : "—" },
    { label:"ANCHOR",     ok: !!s.heroAnchor,        val: s.heroAnchor ? "READY" : "—" },
    { label:"SNAPSHOT",   ok: !!s.snapshotStatus.startsWith("✓"), val: s.snapshotStatus || "—" },
  ];
  return (
    <div className="studio-status-bar-v33" style={{ display:"flex", gap:"6px", flexWrap:"wrap", margin:"8px 0" }}>
      {cells.map((c) => (
        <div key={c.label} className={`status-cell${c.ok ? " ok" : ""}`} style={{ padding:"4px 10px", border:`1px solid ${c.ok?"#8b00ff":"#333"}`, borderRadius:"4px", fontSize:"0.72em", color: c.ok?"#c084fc":"#666", letterSpacing:"0.05em" }}>
          <span style={{ color:"#888" }}>{c.label}</span> <span style={{ color: c.ok?"#e879f9":"#555" }}>{c.val}</span>
        </div>
      ))}
    </div>
  );
}

function StepBar({ step, go }) {
  return (
    <div className="q-stepbar">
      {[1,2,3,4,5,6].map((i) => (
        <div className="qb-node" key={i}>
          <button className={`qb-qubit${i < step ? " done" : i === step ? " active" : ""}`} onClick={() => go(i)}>
            <span className="ring" /><span className="sphere">{i < step ? "✓" : String(i).padStart(2,"0")}</span>
          </button>
          {i < 6 && <div className={`qb-wire${i < step ? " done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function Head({ eyebrow, a, b, body }) {
  return (
    <>
      <div className="q-eyebrow">{eyebrow}</div>
      <h1 className="q-title"><span className="t-line t-glow">{a}</span><span className="t-line t-dim">{b}</span></h1>
      <p className="q-body">{body}</p>
    </>
  );
}

function Field({ label, children }) {
  return <div className="q-field"><label className="q-label">{label}</label>{children}</div>;
}

function Step1({ s, dispatch, waveRef }) {
  return (
    <section className="step-panel on">
      <Head eyebrow="Запуск · Шаг 01" a="Настрой" b="проект" body="Задай параметры мультфильма." />
      <Field label="Название мультфильма">
        <input className="q-inp" value={s.title} placeholder="Например: Кот, который нашёл портал" onChange={(e) => dispatch({ type:"set", key:"title", value:e.target.value })} />
      </Field>
      <Field label="Формат">
        <div className="fmt-grid">
          {FORMATS.map((f) => (
            <button key={f.f} className={`fmt-card${s.format === f.f ? " on" : ""}`} onClick={() => dispatch({ type:"format", ...f })}>
              <span className="collapse-wave" /><span className="fmt-ket">{f.ket}</span>
              <strong className="fmt-name">{f.name}</strong><span className="fmt-spec">{f.spec}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Язык проекта">
        <div className="lang-row">
          {LANGS.map(([value,label]) => <button key={value} className={`lang-b${s.lang === value ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"lang", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="Длительность">
        <div className="dur-panel">
          <div className="dur-display">
            <div><span className="dur-num">{s.duration}</span><span className="dur-s">с</span></div>
            <div className="dur-sc">≈ {Math.max(1, Math.round(s.duration / 7))} сцен</div>
          </div>
          <canvas ref={waveRef} className="wave-canvas" />
          <input type="range" min="15" max="600" step="5" value={s.duration} onChange={(e) => dispatch({ type:"set", key:"duration", value: Number(e.target.value) })} />
        </div>
      </Field>
    </section>
  );
}

function Step2({ s, dispatch }) {
  return (
    <section className="step-panel on">
      <Head eyebrow="Визуальный стиль · Шаг 02" a="Стиль" b="мультфильма" body="Выбери визуальный стиль. Он попадёт в Style DNA для image/video prompts." />
      <Field label="Стиль">
        <div className="qstyle-rail">
          {STYLE_PRESETS.map((style) => (
            <button key={style.id} data-style={style.id} className={`qstyle-card${s.style === style.id ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"style", value:style.id })}>
              <span className="qstyle-preview"><i>{style.icon}</i></span><strong>{style.label}</strong>
            </button>
          ))}
        </div>
      </Field>
      {s.style === "custom" && (
        <Field label="Свой style prompt">
          <textarea className="q-inp" value={s.custom} onChange={(e) => dispatch({ type:"set", key:"custom", value:e.target.value })} />
        </Field>
      )}
      <Field label="Настроение">
        <div className="mood-row">
          {MOODS.map(([value,label]) => <button key={value} className={`mood-chip${s.mood === value ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"mood", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="Палитра">
        <div className="mood-row">
          {PALETTES.map(([value,label]) => <button key={value} className={`mood-chip${s.palette === value ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"palette", value })}>{label}</button>)}
        </div>
      </Field>
      <div className="qv2-divider" />
      <Field label="Chain Mode — связность между PARTами">
        <div className="mood-row">
          {CHAIN_MODES.map(([value,label]) => <button key={value} className={`mood-chip${s.chainMode === value ? " on" : ""}`} onClick={() => dispatch({ type:"chain", key:"chainMode", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="Строгость AutoChain">
        <div className="mood-row">
          {STRICT_LEVELS.map(([value,label]) => <button key={value} className={`mood-chip${s.strictLevel === value ? " on" : ""}`} onClick={() => dispatch({ type:"chain", key:"strictLevel", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="PART Size (кадров в одном PART)">
        <div className="mood-row">
          {PART_SIZES.map((n) => <button key={n} className={`mood-chip${s.partSize === n ? " on" : ""}`} onClick={() => dispatch({ type:"chain", key:"partSize", value:n })}>{n} кадра</button>)}
        </div>
      </Field>
      <div className="qv2-divider" />
      <Field label="VO в видео промпте">
        <div className="entangle-row">
          <div><strong>Включать голосовой текст</strong><span>VO строка попадает в video prompt для VEO3</span></div>
          <button className={`ent-toggle${s.voToggle ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"voToggle", value:!s.voToggle })}><i /></button>
        </div>
      </Field>
      <Field label="Video Consistency">
        <div className="mood-row">
          {CONSISTENCY.map(([value,label]) => <button key={value} className={`mood-chip${s.videoConsistency === value ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"videoConsistency", value })}>{label}</button>)}
        </div>
      </Field>
    </section>
  );
}

function StepScript({ s, dispatch, onAi, onDemo }) { // s.scriptError shown inline
  const segments = split(s.script);
  return (
    <section className="step-panel on">
      <Head eyebrow="Сценарий · Шаг 03" a="Текст" b="диктора" body="Сначала создаём историю. NeuroCine сам найдёт героев и соберёт Face Lock." />
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
        <button className="mind-btn" disabled={s.busy} onClick={onAi}>{s.busy ? "⚡ AI ДУМАЕТ..." : "✦ Сгенерировать сценарий"}</button>
        <button className="mind-btn" disabled={s.busy} onClick={onDemo} style={{ opacity:0.6, fontSize:"0.85em" }}>📝 Вставить пример</button>
      </div>
      {s.scriptError && (
        <div style={{ marginTop:8, padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.4)", color:"#fca5a5", fontSize:"0.82em", lineHeight:1.4 }}>
          ⚠ {s.scriptError}
        </div>
      )}
      <Field label="Голос">
        <div className="v-row">
          {VOICES.map(([value,label]) => <button key={value} className={`v-b${s.voice === value ? " on" : ""}`} onClick={() => dispatch({ type:"set", key:"voice", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="Текст сценария">
        <textarea className="q-inp" rows={8} value={s.script}
          placeholder="Вставь сценарий или нажми генерацию. На следующем шаге AI сам вытащит героев."
          onChange={(e) => dispatch({ type:"script", value:e.target.value })} />
      </Field>
      <div className="meta-strip">
        <div className="q-meta">СЛОВА: <span>{s.script.trim() ? s.script.trim().split(/\s+/).length : 0}</span></div>
        <div className="q-meta">СЦЕН: <span>{segments.length}</span></div>
        {s.script.trim() && (
          <button className="q-meta" style={{ cursor:"pointer", background:"none", border:"none", color:"#8b00ff", fontSize:"inherit" }}
            onClick={() => { const v = validateScript(s.script); dispatch({ type:"scriptValidation", value: v }); }}>
            ↺ Проверить
          </button>
        )}
      </div>
      {s.scriptValidation && (
        <div style={{ padding:"6px 12px", borderRadius:6, marginTop:6, fontSize:"0.78em", background: s.scriptValidation.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border:`1px solid ${s.scriptValidation.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: s.scriptValidation.ok ? "#4ade80" : "#f87171" }}>
          {s.scriptValidation.ok ? "✓" : "✗"} {s.scriptValidation.msg}
        </div>
      )}
    </section>
  );
}

function StepHeroes({ s, dispatch, copyText }) {
  const suggestedMods = getAutoSuggestedMods(s);
  return (
    <section className="step-panel on">
      <Head eyebrow="Герои · Шаг 04" a="Reference" b="Face Lock" body="AI берёт сценарий, находит персонажей и создаёт reference pack: Hero Anchor, Face Lock, outfit lock, color DNA." />

      {/* Reference / Appearance / VO settings */}
      <div className="qv2-divider" />
      <Field label="Reference Mode (для AutoChain PARTs)">
        <div className="mood-row">
          {REF_MODES.map(([value,label]) => <button key={value} className={`mood-chip${s.referenceMode === value ? " on" : ""}`} onClick={() => dispatch({ type:"chain", key:"referenceMode", value })}>{label}</button>)}
        </div>
      </Field>
      <Field label="Appearance Mode">
        <div className="mood-row">
          {APP_MODES.map(([value,label]) => <button key={value} className={`mood-chip${s.appearanceMode === value ? " on" : ""}`} onClick={() => dispatch({ type:"chain", key:"appearanceMode", value })}>{label}</button>)}
        </div>
      </Field>
      <div className="qv2-divider" />

      <div className="qv2-actions">
        <button className="qv2-primary" onClick={() => dispatch({ type:"extractHeroes" })}>⚛ Авто-найти героев из сценария</button>
        <button className="add-neural" onClick={() => dispatch({ type:"addHero" })}>⊕ Добавить героя вручную</button>
      </div>
      {suggestedMods.length > 0 && (
        <div className="qv2-hint" style={{ padding:"6px 12px", background:"#1a0a2e", borderRadius:"6px", fontSize:"0.8em", color:"#a78bfa", marginBottom:"8px" }}>
          💡 Авто-предложение для стиля «{s.style}» + mood «{s.mood}»: <b>{suggestedMods.join(", ")}</b>
        </div>
      )}
      {/* ─ Global Character Override (из storyboard) ─ */}
      <div className="qv2-divider" />
      <div style={{ padding:"10px 14px", background:"#0a0020", border:"1px solid #333", borderRadius:8, marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: s.charOverrideEnabled ? 12 : 0 }}>
          <div>
            <div style={{ fontSize:"0.82em", fontWeight:700, color:"#c084fc", letterSpacing:"0.05em" }}>CHARACTER OVERRIDE</div>
            <div style={{ fontSize:"0.72em", color:"#555", marginTop:2 }}>Глобальные модификаторы и Face Lock для всех сцен</div>
          </div>
          <button className={`ent-toggle${s.charOverrideEnabled ? " on" : ""}`} onClick={() => dispatch({ type:"charOverride", value:!s.charOverrideEnabled })}><i /></button>
        </div>
        {s.charOverrideEnabled && (<>
          <Field label="Face Identity Lock — описание лица для всех кадров">
            <textarea className="q-inp" rows={2} value={s.charFaceLock} placeholder="Опиши черты лица из reference: форма лица, глаза, нос, причёска, характерные детали..." onChange={(e) => dispatch({ type:"charFaceLock", value:e.target.value })} />
          </Field>
          <Field label="Appearance Modifiers — применятся ко всем кадрам">
            {(() => {
              const suggested = suggestedCharMods(s);
              return (<>
                {suggested.length > 0 && <div style={{ fontSize:"0.72em", color:"#7c3aed", marginBottom:6 }}>💡 Предложение по контексту: <b>{suggested.join(", ")}</b></div>}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {CHAR_MODS.map(([key, label]) => (
                    <button key={key} onClick={() => dispatch({ type:"charMod", key })}
                      style={{ padding:"4px 10px", borderRadius:4, fontSize:"0.76em", cursor:"pointer", border:`1px solid ${s.charModifiers[key] ? "#8b00ff" : suggested.includes(key) ? "#7c3aed" : "#333"}`, background: s.charModifiers[key] ? "rgba(139,0,255,0.2)" : suggested.includes(key) ? "rgba(124,58,237,0.08)" : "transparent", color: s.charModifiers[key] ? "#c084fc" : suggested.includes(key) ? "#a78bfa" : "#666" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </>);
            })()}
          </Field>
          {buildCharOverrideBlock(s) && (
            <div style={{ marginTop:8, padding:"8px 10px", background:"#0d0416", border:"1px solid #2d1050", borderRadius:6, fontSize:"0.72em", color:"#a78bfa", whiteSpace:"pre-wrap", fontFamily:"monospace" }}>
              {buildCharOverrideBlock(s)}
            </div>
          )}
        </>)}
      </div>

      {!s.heroes.length && (
        <div className="qv2-empty"><b>Герои появятся здесь</b><span>Нажми авто-поиск или ДАЛЕЕ — NeuroCine сам создаст героев из сценария.</span></div>
      )}
      <div className="neural-list">
        {s.heroes.map((h, i) => (
          <div className="neural-card on" key={h.id}>
            <div className="nc-head">
              <div className="nc-orb">{String(i+1).padStart(2,"0")}</div>
              <div className="nc-title"><strong>{h.name}</strong><span>{h.role} · {h.face_lock ? "FACE LOCK" : "FREE"}</span></div>
            </div>
            <div className="nc-body">
              <Field label="Имя героя">
                <input className="q-inp" value={h.name} onChange={(e) => dispatch({ type:"hero", i, key:"name", value:e.target.value })} />
              </Field>
              <Field label="Описание / visual DNA">
                <textarea className="q-inp" value={h.description} placeholder="лицо, силуэт, одежда, цвет, материал, характер..." onChange={(e) => dispatch({ type:"hero", i, key:"description", value:e.target.value })} />
              </Field>
              <Field label="Face Lock — описание лица для AutoChain">
                <textarea className="q-inp" rows={2} value={h.charFaceLock || ""} placeholder="Доп. описание черт лица для Face Lock (форма лица, глаза, причёска, характерные детали)..." onChange={(e) => dispatch({ type:"hero", i, key:"charFaceLock", value:e.target.value })} />
              </Field>
              <div className="entangle-row">
                <div><strong>Фиксация лица</strong><span>сохранять лицо / силуэт / одежду</span></div>
                <button className={`ent-toggle${h.face_lock ? " on" : ""}`} onClick={() => dispatch({ type:"hero", i, key:"face_lock", value:!h.face_lock })}><i /></button>
              </div>
              <Field label="Модификаторы">
                <div className="q-mods">
                  {MODS.map(([value,label]) => (
                    <button key={value} className={`q-mod${h.modifiers.includes(value) ? " on" : ""}${suggestedMods.includes(value) ? " suggested" : ""}`} onClick={() => dispatch({ type:"heroMod", i, mod:value })}>{label}</button>
                  ))}
                </div>
              </Field>
              <div className="qprompt">
                <div className="qprompt-title">
                  <span>REFERENCE SHEET PROMPT</span>
                  <button onClick={() => copyText(referencePrompt(h, s), "REFERENCE PROMPT СКОПИРОВАН")}>COPY</button>
                </div>
                <pre>{referencePrompt(h, s)}</pre>
              </div>
              <button className="q-del" onClick={() => dispatch({ type:"deleteHero", i })}>Удалить героя</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepStoryboard({ s, dispatch, scenes, parts, currentPartScenes, curScene, onStoryboard, onCopyPart, uploadFrame, uploadHeroAnchor, uploadPrevAnchor, doCropGrid, doExplore, doVideoPrompt, copyText }) {
  const [gridUpload, setGridUpload] = useState(null);
  const [gridCols, setGridCols]     = useState(2);

  return (
    <section className="step-panel on">
      <Head eyebrow="Storyboard · Шаг 05" a="PART Grid" b="+ AutoChain" body="Сценарий → герои → storyboard → PART grid → Frame anchor → image prompt → video prompt (VEO3)." />

      {/* — Primary actions */}
      <div className="qv2-actions">
        <button className="qv2-primary" disabled={s.busy} onClick={onStoryboard}>↻ Пересобрать AI storyboard</button>
        <button className="qv2-primary" onClick={onCopyPart} style={{ background:"#1a0a2e", border:"1px solid #8b00ff" }}>
          📋 Скопировать PART {s.partIndex+1} промпт
        </button>
      </div>

      {/* — Hero Anchor + Prev Part uploads */}
      <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginBottom:"12px" }}>
        <UploadZone label={s.heroAnchor ? "✓ HERO ANCHOR" : "⬆ Hero Anchor"} hint="reference лица" onFile={(url) => dispatch({ type:"heroAnchor", value:url })} />
        {s.partIndex > 0 && (
          <UploadZone label={s.prevPartAnchor ? "✓ PREV PART" : `⬆ PART ${s.partIndex}`} hint="continuity anchor" onFile={(url) => dispatch({ type:"prevAnchor", value:url })} />
        )}
        {s.heroAnchor && <img src={s.heroAnchor} alt="hero anchor" style={{ width:60, height:80, objectFit:"cover", borderRadius:4, border:"1px solid #8b00ff" }} />}
        {s.prevPartAnchor && <img src={s.prevPartAnchor} alt="prev part" style={{ width:60, height:80, objectFit:"cover", borderRadius:4, border:"1px solid #444" }} />}
      </div>

      {/* — Grid columns + manual frames control */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ fontSize:"0.75em", color:"#666" }}>GRID COLUMNS:</div>
        {[1,2,3,4].map((n) => (
          <button key={n} onClick={() => dispatch({ type:"chain", key:"gridColsOverride", value: s.gridColsOverride === n ? null : n })}
            style={{ padding:"3px 10px", borderRadius:4, fontSize:"0.76em", cursor:"pointer", border:`1px solid ${s.gridColsOverride === n ? "#8b00ff" : "#333"}`, background: s.gridColsOverride === n ? "rgba(139,0,255,0.2)" : "transparent", color: s.gridColsOverride === n ? "#c084fc" : "#666" }}>
            {n}×
          </button>
        ))}
        <div style={{ fontSize:"0.75em", color:"#666", marginLeft:8 }}>FRAMES:</div>
        {[2,3,4,6,8].map((n) => (
          <button key={n} onClick={() => dispatch({ type:"chain", key:"gridManualFrames", value: s.gridManualFrames === n ? null : n })}
            style={{ padding:"3px 10px", borderRadius:4, fontSize:"0.76em", cursor:"pointer", border:`1px solid ${s.gridManualFrames === n ? "#8b00ff" : "#333"}`, background: s.gridManualFrames === n ? "rgba(139,0,255,0.2)" : "transparent", color: s.gridManualFrames === n ? "#c084fc" : "#666" }}>
            {n}
          </button>
        ))}
      </div>

      {/* — Grid crop upload */}
      <div style={{ background:"#0d0416", border:"1px solid #333", borderRadius:"8px", padding:"12px", marginBottom:"12px" }}>
        <div style={{ fontSize:"0.8em", color:"#888", marginBottom:"8px" }}>CROP GRID FRAME — загрузи grid-изображение и вырежи нужный кадр</div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <label style={{ cursor:"pointer", background:"#1a0a2e", border:"1px solid #555", borderRadius:"4px", padding:"6px 12px", fontSize:"0.8em", color:"#aaa" }}>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>setGridUpload(ev.target?.result); r.readAsDataURL(f); } }} />
            {gridUpload ? "✓ Grid загружен" : "⬆ Grid Image"}
          </label>
          <select value={gridCols} onChange={(e) => setGridCols(Number(e.target.value))} style={{ background:"#1a0a2e", color:"#aaa", border:"1px solid #444", borderRadius:"4px", padding:"4px 8px", fontSize:"0.8em" }}>
            <option value={2}>2 cols</option><option value={3}>3 cols</option><option value={4}>4 cols</option>
          </select>
          {gridUpload && currentPartScenes.map((_, i) => (
            <button key={i} onClick={() => doCropGrid(gridUpload, i, gridCols)} style={{ background:"#1a0a2e", border:"1px solid #8b00ff", color:"#c084fc", borderRadius:"4px", padding:"4px 10px", fontSize:"0.78em", cursor:"pointer" }}>
              Вырезать F{String(s.partIndex*s.partSize+i+1).padStart(2,"0")}
            </button>
          ))}
        </div>
        {gridUpload && <img src={gridUpload} alt="grid" style={{ marginTop:8, maxWidth:"100%", maxHeight:200, objectFit:"contain", borderRadius:4, opacity:0.7 }} />}
      </div>

      {/* — PART tabs */}
      <div className="qpart-tabs">
        {parts.map((_, i) => (
          <button key={i} className={`qpart-tab${i === s.partIndex ? " on" : ""}`} onClick={() => dispatch({ type:"partIndex", i })}>
            PART {String(i+1).padStart(2,"0")}
          </button>
        ))}
      </div>

      {/* — PART grid */}
      <div className="qpart-grid">
        {currentPartScenes.map((sc, localIdx) => {
          const globalIdx = s.partIndex * s.partSize + localIdx;
          return (
            <button key={sc.id} className={`qframe${s.selected === globalIdx ? " sel" : ""}`} onClick={() => dispatch({ type:"select", i:globalIdx })}>
              <div className="qframe-shot">
                {sc.frame_preview
                  ? <img className="qframe-img" src={sc.frame_preview} alt="frame" />
                  : <><span className="qframe-orbit" /><span className="qframe-pulse" /></>}
                <span className="qframe-id">F{String(globalIdx+1).padStart(2,"0")}</span>
                <span className="qframe-act">{sc.act}</span>
              </div>
              <div className="qframe-info">
                <strong>{sc.voice_line.slice(0,48)}</strong>
                <p>{(sc.image_prompt_en || "").slice(0,80)}</p>
                <small>{sc.camera} · {sc.duration_sec}s</small>
              </div>
            </button>
          );
        })}
        {!scenes.length && <div className="qframe empty"><span>NO DATA</span><em>создай storyboard</em></div>}
      </div>

      {/* — Scene inspector */}
      {curScene && (
        <div className="qframe-inspector">
          <div className="qins-head">
            <strong>{curScene.id}</strong>
            <span>{curScene.camera} · {curScene.duration_sec}s</span>
          </div>
          <div className="qins-voice">{curScene.voice_line}</div>

          {/* Per-scene frame upload + AI actions */}
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"8px" }}>
            <label className="qframe-upload qframe-upload-top">
              <input type="file" accept="image/*" onChange={(e) => uploadFrame(s.selected, e.target.files)} />
              <b>⬆ Загрузить Frame</b><span>прикрепить кадр</span>
            </label>
            {curScene.frame_preview && (
              <>
                <button onClick={() => doExplore(curScene.frame_preview, s.selected)} disabled={s.busy} style={{ background:"#0d0416", border:"1px solid #8b00ff", color:"#a78bfa", borderRadius:"4px", padding:"6px 10px", fontSize:"0.78em", cursor:"pointer" }}>
                  🔍 Explore → Image Prompt
                </button>
                <button onClick={() => doVideoPrompt(curScene.frame_preview, s.selected)} disabled={s.busy} style={{ background:"#0d0416", border:"1px solid #444", color:"#888", borderRadius:"4px", padding:"6px 10px", fontSize:"0.78em", cursor:"pointer" }}>
                  🎬 → Video Prompt AI
                </button>
              </>
            )}
          </div>

          <div className="qprompt">
            <div className="qprompt-title"><span>IMAGE PROMPT EN</span><button onClick={() => copyText(curScene.image_prompt_en, "IMAGE PROMPT СКОПИРОВАН")}>COPY</button></div>
            <pre>{curScene.image_prompt_en}</pre>
          </div>
          <div className="qprompt">
            <div className="qprompt-title"><span>VIDEO PROMPT EN (VEO3)</span><button onClick={() => copyText(curScene.video_prompt_en, "VIDEO PROMPT СКОПИРОВАН")}>COPY</button></div>
            <pre>{curScene.video_prompt_en}</pre>
          </div>
        </div>
      )}
    </section>
  );
}

function StepExport({ s, jsonText, snapInputRef, onExportJson, onExportTxt, onExportFlow, onExportAutoChainJson, onExportAutoChainTxt, onSaveSnapshot, onLoadSnapshot, copyJson }) {
  return (
    <section className="step-panel on">
      <Head eyebrow="Экспорт · Шаг 06" a="JSON" b="+ TXT + Flow + Snapshot" body="Финальный пакет: проект, стиль, герои, reference prompts, storyboard, image/video prompts." />
      <div className="qv2-actions" style={{ flexWrap:"wrap" }}>
        <button className="qv2-primary" onClick={copyJson}>📋 Скопировать JSON</button>
        <button className="qv2-primary" onClick={onExportJson} style={{ background:"#0d0416", border:"1px solid #8b00ff" }}>💾 JSON файл</button>
        <button className="qv2-primary" onClick={onExportTxt}  style={{ background:"#0d0416", border:"1px solid #555" }}>📄 TXT экспорт</button>
        <button className="qv2-primary" onClick={onExportFlow} style={{ background:"#0d0416", border:"1px solid #555" }}>🎬 Flow VEO3</button>
        <button className="qv2-primary" onClick={onExportAutoChainJson} style={{ background:"#0d0416", border:"1px solid #7c3aed" }}>⛓ AutoChain JSON</button>
        <button className="qv2-primary" onClick={onExportAutoChainTxt} style={{ background:"#0d0416", border:"1px solid #7c3aed" }}>⛓ AutoChain TXT</button>
      </div>
      <div style={{ marginTop:"12px", padding:"12px", background:"#0a0020", border:"1px solid #333", borderRadius:"8px" }}>
        <div style={{ fontSize:"0.78em", color:"#888", marginBottom:"8px", letterSpacing:"0.08em" }}>PROJECT SNAPSHOT — сохрани / загрузи весь проект</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={onSaveSnapshot} style={{ background:"#1a0a2e", border:"1px solid #8b00ff", color:"#c084fc", borderRadius:"4px", padding:"6px 14px", fontSize:"0.8em", cursor:"pointer" }}>
            💾 Сохранить .neurocine.json
          </button>
          <label style={{ cursor:"pointer", background:"#1a0a2e", border:"1px solid #555", color:"#888", borderRadius:"4px", padding:"6px 14px", fontSize:"0.8em" }}>
            <input ref={snapInputRef} type="file" accept=".json" style={{ display:"none" }} onChange={(e) => onLoadSnapshot(e.target.files)} />
            ⬆ Загрузить Snapshot
          </label>
          {s.snapshotStatus && <span style={{ fontSize:"0.78em", color: s.snapshotStatus.startsWith("✓") ? "#a78bfa" : "#ef4444" }}>{s.snapshotStatus}</span>}
        </div>
      </div>
      <div className="qprompt" style={{ marginTop:"12px" }}>
        <div className="qprompt-title"><span>PROJECT JSON</span></div>
        <pre>{jsonText}</pre>
      </div>
    </section>
  );
}
