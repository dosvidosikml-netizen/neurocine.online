"use client";

import { useMemo, useState } from "react";

const UI = {
  ru: {
    logoSub: "Quantum Cartoon Intelligence · v1",
    tag: "нейронный мульт-creator",
    backStudio: "← Studio",
    ru: "RU · Рус",
    en: "EN · Eng",
    next: "ДАЛЕЕ →",
    back: "← НАЗАД",
    launch: "ОТПРАВИТЬ В PIPELINE →",
    copied: "✓ JSON скопирован",
    step: ["INIT", "STYLE", "HERO", "SCRIPT", "BOARD", "EXPORT"],
    s1k: "Quantum Init · Step 01",
    s1a: "Initialize",
    s1b: "your project",
    s1p: "Задай параметры мультфильма. Каждый выбор становится частью JSON-паспорта проекта.",
    title: "Название мультфильма",
    titlePh: "Например: Кот, который нашёл портал",
    format: "Формат",
    duration: "Длительность",
    language: "Язык проекта",
    scenes: "сцен",
    s2k: "Visual Matrix · Step 02",
    s2a: "Mind's eye",
    s2b: "visual field",
    s2p: "Выбери визуальный стиль, настроение и палитру. Это станет style lock для всех сцен.",
    renderStyle: "Стиль рендера",
    mood: "Настроение",
    palette: "Палитра",
    custom: "Custom style prompt",
    customPh: "watercolor, dreamy, soft glow...",
    s3k: "Neural Signatures · Step 03",
    s3a: "Character",
    s3b: "entanglement",
    s3p: "До 3 персонажей. Face Lock сохраняет визуальное ДНК героя во всех кадрах.",
    addHero: "⊕ ДОБАВИТЬ ПЕРСОНАЖА",
    heroName: "Имя",
    heroDesc: "Внешность / характер",
    heroRole: "Роль",
    faceLock: "Face Lock",
    faceSub: "зафиксировать лицо / силуэт",
    s4k: "Consciousness Stream · Step 04",
    s4a: "Narrator",
    s4b: "mind stream",
    s4p: "Вставь или напиши сценарий. Каждое предложение превращается в сцену storyboard.",
    voice: "Стиль голоса",
    script: "Текст сценария",
    scriptPh: "Однажды маленький робот проснулся на Луне. Он увидел светящийся след...",
    buildDemo: "✦ СГЕНЕРИРОВАТЬ ДЕМО-ТЕКСТ",
    words: "слов",
    nodes: "узлов",
    s5k: "Synaptic Map · Step 05",
    s5a: "Storyboard",
    s5b: "neural grid",
    s5p: "Проверь сцены, камеру и characters in scene. Это основа для image/video prompts.",
    rewire: "↺ REWIRE",
    sceneVoice: "Voice line",
    imagePrompt: "Image Prompt Vector",
    camera: "Camera",
    s6k: "Wave Collapse · Step 06",
    s6a: "Quantum",
    s6b: "collapse · export",
    s6p: "Итоговый JSON проекта. Позже он будет отправляться в настоящий cartoonEngine NeuroCine.",
    project: "проект",
    characters: "герои",
    storyboard: "storyboard",
    copy: "⊕ COPY JSON",
    empty: "Пусто",
    sent: "✓ ОТПРАВЛЕНО В PIPELINE",
  },
  en: {
    logoSub: "Quantum Cartoon Intelligence · v1",
    tag: "neural cartoon creator",
    backStudio: "← Studio",
    ru: "RU · Rus",
    en: "EN · Eng",
    next: "NEXT →",
    back: "← BACK",
    launch: "SEND TO PIPELINE →",
    copied: "✓ JSON copied",
    step: ["INIT", "STYLE", "HERO", "SCRIPT", "BOARD", "EXPORT"],
    s1k: "Quantum Init · Step 01",
    s1a: "Initialize",
    s1b: "your project",
    s1p: "Set the cartoon parameters. Every choice becomes part of the project JSON passport.",
    title: "Cartoon title",
    titlePh: "Example: The cat who found a portal",
    format: "Format",
    duration: "Duration",
    language: "Project language",
    scenes: "scenes",
    s2k: "Visual Matrix · Step 02",
    s2a: "Mind's eye",
    s2b: "visual field",
    s2p: "Choose visual style, mood and palette. This becomes the style lock across all scenes.",
    renderStyle: "Render style",
    mood: "Mood",
    palette: "Palette",
    custom: "Custom style prompt",
    customPh: "watercolor, dreamy, soft glow...",
    s3k: "Neural Signatures · Step 03",
    s3a: "Character",
    s3b: "entanglement",
    s3p: "Up to 3 characters. Face Lock keeps visual DNA consistent across frames.",
    addHero: "⊕ ADD CHARACTER NODE",
    heroName: "Name",
    heroDesc: "Appearance / personality",
    heroRole: "Role",
    faceLock: "Face Lock",
    faceSub: "lock face / silhouette",
    s4k: "Consciousness Stream · Step 04",
    s4a: "Narrator",
    s4b: "mind stream",
    s4p: "Paste or write a script. Each sentence becomes a storyboard scene.",
    voice: "Voice style",
    script: "Script text",
    scriptPh: "One day a tiny robot woke up on the Moon. He saw a glowing trail...",
    buildDemo: "✦ GENERATE DEMO TEXT",
    words: "words",
    nodes: "nodes",
    s5k: "Synaptic Map · Step 05",
    s5a: "Storyboard",
    s5b: "neural grid",
    s5p: "Review scenes, camera and characters in scene. This is the base for image/video prompts.",
    rewire: "↺ REWIRE",
    sceneVoice: "Voice line",
    imagePrompt: "Image Prompt Vector",
    camera: "Camera",
    s6k: "Wave Collapse · Step 06",
    s6a: "Quantum",
    s6b: "collapse · export",
    s6p: "Final project JSON. Later it will be sent to the real NeuroCine cartoonEngine.",
    project: "project",
    characters: "characters",
    storyboard: "storyboard",
    copy: "⊕ COPY JSON",
    empty: "Empty",
    sent: "✓ SENT TO PIPELINE",
  },
};

const formats = [
  { id: "shorts", label: "SHORTS · REELS", aspect: "9:16", duration: 60, spec: "≤90s" },
  { id: "tiktok", label: "TIKTOK", aspect: "9:16", duration: 45, spec: "≤60s" },
  { id: "youtube", label: "YOUTUBE", aspect: "16:9", duration: 300, spec: "≤10min" },
  { id: "custom", label: "CUSTOM", aspect: "1:1", duration: 120, spec: "any ratio" },
];

const styles = [
  { id: "anime", icon: "🌸", label: "ANIME" },
  { id: "pixar", icon: "🎪", label: "3D PIXAR" },
  { id: "flat", icon: "🎨", label: "2D FLAT" },
  { id: "cinema", icon: "🎬", label: "CINEMA" },
  { id: "pixel", icon: "👾", label: "PIXEL" },
  { id: "custom", icon: "⚛️", label: "CUSTOM" },
];
const moods = ["light", "dark", "epic", "cute", "mystery"];
const palettes = ["auto", "cool", "warm", "mono", "vivid"];
const voices = ["neutral", "dramatic", "kids", "doc"];
const cameras = ["Wide Shot", "Medium Shot", "Close-Up", "Low Angle", "POV"];
const roles = ["hero", "friend", "villain", "guide"];

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 18);
}

function makeScene(sentence, index, state) {
  const act = index === 0 ? "HOOK" : index < 3 ? "BUILD" : index < 6 ? "CLIMAX" : "OUTRO";
  const camera = cameras[index % cameras.length];
  const chars = state.characters.slice(0, Math.max(1, Math.min(2, state.characters.length))).map(c => c.name || c.id);
  const styleText = state.style.preset === "custom" ? state.style.custom_prompt : state.style.preset;
  return {
    id: `scene_${String(index + 1).padStart(2, "0")}`,
    index: index + 1,
    act,
    duration_sec: Math.max(3, Math.round(state.project.duration / Math.max(1, splitSentences(state.script.text).length))),
    voice_line: sentence,
    camera,
    characters_in_scene: chars,
    image_prompt_en: `SCENE PRIMARY FOCUS: Cartoon scene in ${styleText} style, ${state.style.mood} mood, ${state.style.palette} palette. Visualize: ${sentence}. Keep character identity, clean silhouette, vertical composition when needed, no text, no watermark.`,
    video_prompt_en: `ANIMATE CURRENT FRAME: ${sentence}. ${camera}. Preserve cartoon style, character identity, outfit, proportions and world continuity. Smooth motion, expressive animation, no subtitles, no UI, no watermark. SFX: soft cartoon ambience.`,
    continuity_note: "Keep global cartoon style lock and character visual DNA consistent.",
  };
}

function makeProjectJson(state) {
  const scenes = state.scenes.length ? state.scenes : splitSentences(state.script.text).map((s, i) => makeScene(s, i, state));
  return {
    project: {
      id: state.project.id,
      title: state.project.title || "Untitled Cartoon",
      created_at: state.project.created_at,
      format: state.project.format,
      duration_sec: Number(state.project.duration),
      aspect_ratio: state.project.aspect,
      language: state.project.language,
      style: state.style,
    },
    characters: state.characters,
    script: {
      full_text: state.script.text,
      voice_style: state.script.voice_style,
      word_count: state.script.text.trim() ? state.script.text.trim().split(/\s+/).length : 0,
      estimated_duration_sec: Number(state.project.duration),
      language: state.project.language,
    },
    storyboard: {
      total_scenes: scenes.length,
      total_duration_sec: scenes.reduce((a, s) => a + Number(s.duration_sec || 0), 0),
      scenes,
    },
    generation: {
      target: "veo3",
      mode: "safe",
      model_script: "gpt-5.4",
      model_storyboard: "gpt-5.4",
      model_image_analysis: "claude-sonnet-4-6",
      model_video_prompt: "claude-haiku-4-5",
      estimated_cost_usd: 0.04,
      pipeline: "cartoon_creator_v1",
    },
  };
}

function initialState() {
  return {
    step: 1,
    project: {
      id: `cartoon_${Date.now()}`,
      title: "",
      created_at: new Date().toISOString(),
      format: "shorts",
      duration: 60,
      aspect: "9:16",
      language: "ru",
    },
    style: { preset: "anime", custom_prompt: "", mood: "light", palette: "auto" },
    characters: [],
    script: { text: "", voice_style: "neutral" },
    scenes: [],
    selectedScene: null,
    status: "",
  };
}

function QuantumStyles() {
  return <style jsx global>{`
    .qc-page,.qc-page *{box-sizing:border-box}
    .qc-page{min-height:100dvh;background:#000512;color:rgba(255,255,255,.92);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;position:relative;padding-bottom:92px}
    .qc-page::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 20% 0%,rgba(0,80,255,.22),transparent 36%),radial-gradient(circle at 100% 14%,rgba(139,0,255,.20),transparent 32%),radial-gradient(circle at 50% 100%,rgba(0,212,255,.10),transparent 44%);z-index:0}
    .qc-page::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.045;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 100L0 84V50l28-16 28 16v34L28 100z' fill='none' stroke='%2300aaff' stroke-width='.5'/%3E%3C/svg%3E");z-index:0}
    .qc-wrap{position:relative;z-index:1;width:min(100% - 24px,540px);margin:0 auto;padding:22px 0 0}
    .qc-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}
    .qc-back{border:1px solid rgba(0,140,255,.18);background:rgba(0,8,30,.55);color:rgba(0,212,255,.78);border-radius:12px;padding:10px 12px;font:800 11px/1 monospace;text-decoration:none;letter-spacing:.06em}
    .qc-lang{display:flex;gap:6px}.qc-lang button{border:1px solid rgba(0,140,255,.18);background:rgba(0,8,30,.50);color:rgba(80,140,255,.65);border-radius:10px;padding:9px 11px;font:800 10px/1 monospace;cursor:pointer}.qc-lang button.on{border-color:rgba(0,200,255,.45);color:#00d4ff;background:rgba(0,80,255,.10)}
    .q-header{text-align:center;margin:6px 0 18px;animation:qFade .5s ease}.q-logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:8px}.q-orb{width:34px;height:34px;border-radius:999px;position:relative;display:grid;place-items:center}.q-orb i{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#00d4ff,#0050ff);box-shadow:0 0 16px #00d4ff}.q-orb:before,.q-orb:after{content:"";position:absolute;border:1px solid rgba(0,212,255,.35);border-radius:50%;inset:-5px;animation:qSpin 4s linear infinite;transform:scaleX(1.45)}.q-orb:after{inset:-11px;animation-duration:7s;animation-direction:reverse}.q-logo-text{font:900 14px/1 monospace;letter-spacing:.30em;background:linear-gradient(90deg,#00d4ff,#8b00ff,#ff00cc);-webkit-background-clip:text;color:transparent}.q-sub{font:800 10px/1.4 monospace;letter-spacing:.18em;color:rgba(80,140,255,.58);text-transform:uppercase}.q-tag{font:700 11px/1.4 monospace;color:rgba(0,180,255,.40)}
    .q-stepbar{display:flex;align-items:center;margin:18px 0 22px}.q-node{display:flex;align-items:center;flex:1}.q-dot{width:31px;height:31px;border-radius:50%;border:1px solid rgba(0,120,255,.25);background:rgba(0,10,40,.78);color:rgba(80,140,255,.7);display:grid;place-items:center;font:900 9px/1 monospace;cursor:pointer;box-shadow:inset 0 0 18px rgba(0,80,255,.06)}.q-dot.on{border-color:#00d4ff;color:#00d4ff;box-shadow:0 0 15px rgba(0,212,255,.26),inset 0 0 16px rgba(0,80,255,.12)}.q-dot.done{border-color:#00ff88;color:#00ff88;background:rgba(0,255,136,.07)}.q-wire{height:1px;flex:1;background:linear-gradient(90deg,rgba(0,140,255,.18),rgba(0,200,255,.08));overflow:hidden}.q-wire.done{background:rgba(0,255,136,.20)}
    .q-panel{border:1px solid rgba(0,140,255,.18);border-radius:20px;background:rgba(0,6,22,.82);box-shadow:0 0 60px rgba(0,80,255,.12),0 24px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(24px);padding:18px;animation:qFade .28s ease}.q-eye{display:flex;align-items:center;gap:10px;font:900 9px/1.4 monospace;letter-spacing:.15em;color:#00d4ff;text-transform:uppercase;margin-bottom:12px}.q-eye:before{content:"";width:20px;height:1px;background:#00d4ff;opacity:.55}.q-eye:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(0,212,255,.3),transparent)}.q-title{font:900 clamp(28px,7vw,40px)/1.02 monospace;letter-spacing:-.03em;margin-bottom:8px}.q-title span{display:block}.q-title .glow{background:linear-gradient(135deg,#fff 28%,#00d4ff 70%,#8b00ff);-webkit-background-clip:text;color:transparent}.q-title .dim{color:rgba(255,255,255,.32)}.q-body{font-size:13px;line-height:1.7;color:rgba(80,140,255,.62);margin-bottom:18px}
    .q-field{margin-bottom:14px;position:relative}.q-label{display:flex;gap:6px;margin-bottom:7px;font:900 9px/1 monospace;color:rgba(80,140,255,.62);letter-spacing:.12em;text-transform:uppercase}.q-label:before{content:"⟨";color:#00d4ff}.q-label:after{content:"⟩";color:#00d4ff}.q-inp{width:100%;background:rgba(0,10,40,.60);border:1px solid rgba(0,140,255,.18);border-radius:12px;padding:12px 15px;color:rgba(255,255,255,.92);font-size:14px;outline:none;box-shadow:inset 0 0 20px rgba(0,30,120,.1)}textarea.q-inp{min-height:96px;resize:vertical;line-height:1.65}.q-inp:focus{border-color:rgba(0,180,255,.5);box-shadow:0 0 0 3px rgba(0,120,255,.1),inset 0 0 20px rgba(0,50,200,.1)}.q-inp::placeholder{color:rgba(80,120,200,.32)}
    .fmt-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fmt-card,.sty-card,.q-chip,.v-b,.role-b,.cam-b{border:1px solid rgba(0,140,255,.18);background:rgba(0,8,30,.58);color:rgba(80,140,255,.65);cursor:pointer;transition:.18s ease}.fmt-card{border-radius:14px;padding:15px;position:relative;overflow:hidden}.fmt-card.on{border-color:rgba(0,180,255,.42);box-shadow:0 0 20px rgba(0,120,255,.12),inset 0 0 20px rgba(0,80,255,.06)}.fmt-ket{font:800 9px/1 monospace;color:rgba(80,140,255,.62);margin-bottom:8px}.fmt-card.on .fmt-ket{color:#00d4ff}.fmt-name{font:900 12px/1.2 monospace;color:rgba(255,255,255,.72);margin-bottom:4px}.fmt-card.on .fmt-name{color:#00d4ff}.fmt-spec{font:800 10px/1 monospace;color:rgba(80,140,255,.62)}
    .dur-panel{background:rgba(0,8,30,.70);border:1px solid rgba(0,140,255,.18);border-radius:14px;padding:17px}.dur-display{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px}.dur-num{font:900 38px/1 monospace;background:linear-gradient(135deg,#00d4ff,#8b00ff);-webkit-background-clip:text;color:transparent}.dur-sc{font:900 13px/1 monospace;color:#00d4ff;text-align:right}input[type=range]{width:100%;accent-color:#00d4ff}.chip-row,.v-row,.role-row,.cam-row{display:flex;flex-wrap:wrap;gap:6px}.q-chip,.v-b,.role-b,.cam-b{border-radius:999px;padding:7px 12px;font:900 9px/1 monospace;letter-spacing:.05em}.q-chip.on,.v-b.on,.role-b.on,.cam-b.on{border-color:#8b00ff;color:#c084fc;background:rgba(139,0,255,.09)}
    .sty-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sty-card{aspect-ratio:1;border-radius:14px;display:grid;place-items:center;text-align:center;position:relative;overflow:hidden}.sty-card.on{border-color:#8b00ff;box-shadow:0 0 20px rgba(139,0,255,.20)}.sty-ico{font-size:23px;filter:drop-shadow(0 0 6px currentColor)}.sty-name{font:900 8px/1.2 monospace;color:rgba(255,255,255,.62);letter-spacing:.08em;margin-top:5px}.sty-card.on .sty-name{color:#c084fc}
    .neural-list{display:grid;gap:10px;margin-bottom:12px}.neural-card{border:1px solid rgba(0,140,255,.18);border-radius:18px;background:rgba(0,6,24,.80);padding:14px}.nc-head{display:flex;align-items:center;gap:11px;margin-bottom:12px}.nc-orb{width:44px;height:44px;border-radius:50%;border:1px solid rgba(0,180,255,.25);display:grid;place-items:center;color:#00d4ff;box-shadow:0 0 18px rgba(0,180,255,.10)}.nc-grid{display:grid;gap:9px}.entangle-row{display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(0,200,255,.12);border-radius:12px;background:rgba(0,40,120,.08);padding:11px 12px}.ent-title{font-size:12px;font-weight:800}.ent-sub{font:800 9px/1.4 monospace;color:rgba(80,140,255,.62)}.ent-toggle{width:42px;height:22px;border-radius:999px;border:1px solid rgba(0,140,255,.22);background:rgba(0,10,40,.5);padding:2px}.ent-toggle i{display:block;width:16px;height:16px;border-radius:50%;background:rgba(80,140,255,.65);transition:.18s}.ent-toggle.on{border-color:#00d4ff;background:rgba(0,80,255,.15)}.ent-toggle.on i{transform:translateX(18px);background:#00d4ff;box-shadow:0 0 8px #00d4ff}.q-del,.add-neural,.mind-btn,.regen-q,.json-cp{border:1px solid rgba(0,140,255,.18);background:rgba(0,8,30,.45);color:rgba(80,140,255,.72);border-radius:13px;padding:12px;font:900 10px/1 monospace;letter-spacing:.08em;cursor:pointer}.add-neural,.mind-btn{width:100%;border-style:dashed}.add-neural:hover,.mind-btn:hover,.regen-q:hover,.json-cp:hover{color:#00d4ff;border-color:rgba(0,200,255,.4)}.q-del{width:100%;border-color:rgba(255,53,53,.18);color:rgba(255,53,53,.55);margin-top:8px}
    .meta-strip,.exp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 14px}.q-meta,.exp-s{border:1px solid rgba(0,140,255,.18);border-radius:14px;background:rgba(0,6,22,.80);padding:12px;text-align:center;font:900 9px/1.3 monospace;color:rgba(80,140,255,.72)}.q-meta span,.exp-v{color:#00d4ff}.seg-list{display:grid;gap:6px;max-height:180px;overflow:auto}.seg-row{border:1px solid rgba(0,200,255,.10);border-radius:10px;background:rgba(0,8,30,.60);padding:8px 10px;font-size:11px;color:rgba(255,255,255,.65);line-height:1.5}.syn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.syn-card{border:1px solid rgba(0,140,255,.18);border-radius:13px;background:rgba(0,6,22,.80);overflow:hidden;cursor:pointer}.syn-card.sel{border-color:#00d4ff;box-shadow:0 0 16px rgba(0,200,255,.2)}.syt{aspect-ratio:16/9;position:relative;background:radial-gradient(circle at 50% 50%,rgba(0,212,255,.18),rgba(0,40,120,.20),rgba(0,6,22,.95));display:grid;place-items:center}.syt:after{content:"";position:absolute;inset:0;background:repeating-conic-gradient(from 0deg,rgba(0,200,255,.035) 0deg,transparent 3deg,transparent 18deg);animation:qSpin 20s linear infinite}.pulse{width:8px;height:8px;border-radius:50%;background:#00d4ff;box-shadow:0 0 12px #00d4ff;z-index:1}.sy-act{position:absolute;top:5px;left:6px;z-index:2;font:900 7px/1 monospace;color:#00d4ff}.sy-num{position:absolute;bottom:5px;right:6px;z-index:2;font:900 8px/1 monospace;color:rgba(255,255,255,.35)}.sy-info{padding:8px}.sy-voice{font-size:10px;line-height:1.4;color:rgba(255,255,255,.58);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.sc-det{border:1px solid rgba(0,150,255,.20);border-radius:16px;background:rgba(0,5,20,.90);padding:14px;margin-bottom:12px}.det-pmt{font:800 9px/1.7 monospace;color:rgba(0,200,255,.55);background:rgba(0,10,40,.50);border:1px solid rgba(0,200,255,.10);border-radius:9px;padding:10px;max-height:84px;overflow:auto;word-break:break-word}
    .json-wrap{border:1px solid rgba(0,140,255,.18);border-radius:15px;background:rgba(0,4,16,.90);overflow:hidden}.json-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid rgba(0,200,255,.10)}.json-fn{font:900 9px/1 monospace;color:rgba(80,140,255,.72);letter-spacing:.08em}.json-body{padding:13px;font:800 9px/1.75 monospace;color:rgba(0,255,136,.78);white-space:pre;overflow:auto;max-height:300px}.qc-status{margin-top:10px;border:1px solid rgba(0,255,136,.22);border-radius:12px;background:rgba(0,255,136,.06);color:#00ff88;padding:10px 12px;font:900 10px/1.3 monospace;text-align:center}
    .q-nav{position:fixed;left:50%;bottom:0;z-index:20;width:min(100%,540px);transform:translateX(-50%);padding:10px 16px 18px;background:linear-gradient(to top,rgba(0,3,12,.96) 62%,transparent);display:flex;gap:8px}.nav-back,.nav-next{border-radius:13px;padding:13px 16px;font:900 11px/1 monospace;letter-spacing:.08em;cursor:pointer}.nav-back{border:1px solid rgba(0,140,255,.18);background:rgba(0,8,30,.68);color:rgba(80,140,255,.72)}.nav-next{flex:1;border:0;background:linear-gradient(135deg,#0050ff,#8b00ff);color:#fff;box-shadow:0 4px 24px rgba(0,60,200,.30)}.nav-next.launch{background:linear-gradient(135deg,#8b00ff,#ff00cc)}
    @keyframes qFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes qSpin{to{transform:rotate(360deg)}}
    @media(max-width:430px){.qc-wrap{width:min(100% - 20px,540px)}.q-panel{padding:16px}.fmt-grid{grid-template-columns:1fr 1fr}.syn-grid{grid-template-columns:repeat(2,1fr)}.sty-grid{gap:7px}.q-title{font-size:31px}.q-nav{padding-left:10px;padding-right:10px}.nav-back{padding-left:12px;padding-right:12px}}
  `}</style>;
}

export default function QuantumCartoonCreator() {
  const [lang, setLang] = useState("ru");
  const [s, setS] = useState(initialState);
  const t = UI[lang];
  const segments = useMemo(() => splitSentences(s.script.text), [s.script.text]);
  const json = useMemo(() => makeProjectJson(s), [s]);
  const jsonText = useMemo(() => JSON.stringify(json, null, 2), [json]);
  const selected = s.selectedScene ? (s.scenes.find(x => x.id === s.selectedScene) || null) : null;

  function patch(path, value) {
    setS(prev => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur = next;
      parts.slice(0, -1).forEach(p => { cur = cur[p]; });
      cur[parts.at(-1)] = value;
      return next;
    });
  }
  function goStep(n) {
    setS(prev => ({ ...prev, step: Math.min(6, Math.max(1, n)), scenes: n >= 5 ? buildScenes(prev) : prev.scenes }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function buildScenes(src = s) {
    const sentences = splitSentences(src.script.text);
    return sentences.map((sentence, i) => makeScene(sentence, i, src));
  }
  function addHero() {
    setS(prev => {
      if (prev.characters.length >= 3) return prev;
      const id = `char_${prev.characters.length + 1}`;
      return { ...prev, characters: [...prev.characters, { id, name: `Hero ${prev.characters.length + 1}`, description: "", role: "hero", face_lock: true, modifiers: [] }] };
    });
  }
  function patchHero(i, key, value) {
    setS(prev => ({ ...prev, characters: prev.characters.map((c, idx) => idx === i ? { ...c, [key]: value } : c) }));
  }
  function deleteHero(i) {
    setS(prev => ({ ...prev, characters: prev.characters.filter((_, idx) => idx !== i) }));
  }
  function demoScript() {
    patch("script.text", lang === "ru"
      ? "Однажды маленький робот проснулся на Луне. Он увидел светящийся след между кратерами. След привёл его к двери, которой вчера не было. За дверью жил потерянный солнечный зайчик. Робот понял, что должен вернуть его на небо. И когда зайчик прыгнул вверх, вся Луна впервые засветилась тёплым светом."
      : "One day a tiny robot woke up on the Moon. He saw a glowing trail between the craters. The trail led him to a door that had not existed yesterday. Behind the door lived a lost sunbeam. The robot knew he had to return it to the sky. When the sunbeam jumped up, the Moon glowed with warm light for the first time."
    );
  }
  async function copyJson() {
    await navigator.clipboard.writeText(jsonText);
    setS(prev => ({ ...prev, status: t.copied }));
    setTimeout(() => setS(prev => ({ ...prev, status: "" })), 1600);
  }

  return <main className="qc-page">
    <QuantumStyles />
    <div className="qc-wrap">
      <div className="qc-top">
        <a className="qc-back" href="/studio">{t.backStudio}</a>
        <div className="qc-lang">
          <button className={lang === "ru" ? "on" : ""} onClick={() => { setLang("ru"); patch("project.language", "ru"); }}>{t.ru}</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => { setLang("en"); patch("project.language", "en"); }}>{t.en}</button>
        </div>
      </div>

      <header className="q-header">
        <div className="q-logo"><div className="q-orb"><i /></div><div className="q-logo-text">NEUROCINE</div></div>
        <div className="q-sub">{t.logoSub}</div>
        <div className="q-tag">{t.tag}</div>
      </header>

      <div className="q-stepbar">
        {t.step.map((label, i) => <div className="q-node" key={label}>
          <button className={`q-dot ${s.step === i + 1 ? "on" : ""} ${s.step > i + 1 ? "done" : ""}`} onClick={() => goStep(i + 1)}>{s.step > i + 1 ? "✓" : String(i + 1).padStart(2, "0")}</button>
          {i < 5 && <div className={`q-wire ${s.step > i + 1 ? "done" : ""}`} />}
        </div>)}
      </div>

      <section className="q-panel">
        {s.step === 1 && <>
          <Head k={t.s1k} a={t.s1a} b={t.s1b} p={t.s1p} />
          <Field label={t.title}><input className="q-inp" value={s.project.title} placeholder={t.titlePh} onChange={e => patch("project.title", e.target.value)} /></Field>
          <Field label={t.format}><div className="fmt-grid">{formats.map(f => <button key={f.id} className={`fmt-card ${s.project.format === f.id ? "on" : ""}`} onClick={() => setS(prev => ({ ...prev, project: { ...prev.project, format: f.id, aspect: f.aspect, duration: f.duration } }))}><div className="fmt-ket">|{f.id}⟩</div><div className="fmt-name">{f.label}</div><div className="fmt-spec">{f.aspect} · {f.spec}</div></button>)}</div></Field>
          <Field label={t.duration}><div className="dur-panel"><div className="dur-display"><div><span className="dur-num">{s.project.duration}</span><span style={{fontFamily:"monospace",color:"rgba(80,140,255,.65)",marginLeft:4}}>s</span></div><div className="dur-sc">≈ {Math.max(1, Math.round(s.project.duration / 7))} {t.scenes}</div></div><input type="range" min="15" max="600" step="5" value={s.project.duration} onChange={e => patch("project.duration", Number(e.target.value))} /></div></Field>
        </>}

        {s.step === 2 && <>
          <Head k={t.s2k} a={t.s2a} b={t.s2b} p={t.s2p} />
          <Field label={t.renderStyle}><div className="sty-grid">{styles.map(st => <button className={`sty-card ${s.style.preset === st.id ? "on" : ""}`} key={st.id} onClick={() => patch("style.preset", st.id)}><div><div className="sty-ico">{st.icon}</div><div className="sty-name">{st.label}</div></div></button>)}</div></Field>
          {s.style.preset === "custom" && <Field label={t.custom}><textarea className="q-inp" placeholder={t.customPh} value={s.style.custom_prompt} onChange={e => patch("style.custom_prompt", e.target.value)} /></Field>}
          <Field label={t.mood}><div className="chip-row">{moods.map(m => <button key={m} className={`q-chip ${s.style.mood === m ? "on" : ""}`} onClick={() => patch("style.mood", m)}>{m.toUpperCase()}</button>)}</div></Field>
          <Field label={t.palette}><div className="chip-row">{palettes.map(p => <button key={p} className={`q-chip ${s.style.palette === p ? "on" : ""}`} onClick={() => patch("style.palette", p)}>{p.toUpperCase()}</button>)}</div></Field>
        </>}

        {s.step === 3 && <>
          <Head k={t.s3k} a={t.s3a} b={t.s3b} p={t.s3p} />
          <div className="neural-list">{s.characters.map((c, i) => <div className="neural-card" key={c.id}>
            <div className="nc-head"><div className="nc-orb">{i + 1}</div><div><div style={{fontWeight:900,color:"rgba(255,255,255,.82)"}}>{c.name || c.id}</div><div style={{fontFamily:"monospace",fontSize:9,color:"rgba(80,140,255,.65)"}}>{c.role} · {c.face_lock ? "FACE_LOCK" : "FREE"}</div></div></div>
            <div className="nc-grid">
              <Field label={t.heroName}><input className="q-inp" value={c.name} onChange={e => patchHero(i, "name", e.target.value)} /></Field>
              <Field label={t.heroDesc}><textarea className="q-inp" value={c.description} onChange={e => patchHero(i, "description", e.target.value)} placeholder="red hoodie, big eyes, brave but shy..." /></Field>
              <Field label={t.heroRole}><div className="role-row">{roles.map(r => <button key={r} className={`role-b ${c.role === r ? "on" : ""}`} onClick={() => patchHero(i, "role", r)}>{r.toUpperCase()}</button>)}</div></Field>
              <div className="entangle-row"><div><div className="ent-title">{t.faceLock}</div><div className="ent-sub">{t.faceSub}</div></div><button className={`ent-toggle ${c.face_lock ? "on" : ""}`} onClick={() => patchHero(i, "face_lock", !c.face_lock)}><i /></button></div>
              <button className="q-del" onClick={() => deleteHero(i)}>DELETE NODE</button>
            </div>
          </div>)}</div>
          <button className="add-neural" onClick={addHero} disabled={s.characters.length >= 3}>{t.addHero}</button>
        </>}

        {s.step === 4 && <>
          <Head k={t.s4k} a={t.s4a} b={t.s4b} p={t.s4p} />
          <button className="mind-btn" onClick={demoScript}>{t.buildDemo}</button>
          <Field label={t.voice}><div className="v-row">{voices.map(v => <button key={v} className={`v-b ${s.script.voice_style === v ? "on" : ""}`} onClick={() => patch("script.voice_style", v)}>{v.toUpperCase()}</button>)}</div></Field>
          <Field label={t.script}><textarea className="q-inp" rows={7} value={s.script.text} placeholder={t.scriptPh} onChange={e => patch("script.text", e.target.value)} /></Field>
          <div className="meta-strip"><div className="q-meta">{t.words}: <span>{s.script.text.trim() ? s.script.text.trim().split(/\s+/).length : 0}</span></div><div className="q-meta">{t.nodes}: <span>{segments.length}</span></div><div className="q-meta">~<span>{Math.min(s.project.duration, segments.length * 7)}</span>s</div></div>
          <div className="seg-list">{segments.map((x, i) => <div className="seg-row" key={i}>#{String(i + 1).padStart(2, "0")} · {x}</div>)}</div>
        </>}

        {s.step === 5 && <>
          <Head k={t.s5k} a={t.s5a} b={t.s5b} p={t.s5p} />
          <div className="sb-toolbar" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div className="q-meta">NODES: <span>{s.scenes.length}</span></div><button className="regen-q" onClick={() => setS(prev => ({...prev, scenes: buildScenes(prev)}))}>{t.rewire}</button></div>
          {selected && <div className="sc-det"><Field label={t.sceneVoice}><textarea className="q-inp" value={selected.voice_line} onChange={e => setS(prev => ({...prev, scenes: prev.scenes.map(sc => sc.id === selected.id ? {...sc, voice_line:e.target.value} : sc)}))} /></Field><div className="q-label">{t.imagePrompt}</div><div className="det-pmt">{selected.image_prompt_en}</div><Field label={t.camera}><div className="cam-row">{cameras.map(cam => <button key={cam} className={`cam-b ${selected.camera === cam ? "on" : ""}`} onClick={() => setS(prev => ({...prev, scenes: prev.scenes.map(sc => sc.id === selected.id ? {...sc, camera:cam} : sc)}))}>{cam}</button>)}</div></Field></div>}
          <div className="syn-grid">{s.scenes.map(sc => <button key={sc.id} className={`syn-card ${s.selectedScene === sc.id ? "sel" : ""}`} onClick={() => setS(prev => ({...prev, selectedScene: sc.id}))}><div className="syt"><div className="pulse"/><div className="sy-act">{sc.act}</div><div className="sy-num">{String(sc.index).padStart(2,"0")}</div></div><div className="sy-info"><div className="sy-voice">{sc.voice_line}</div></div></button>)}</div>
        </>}

        {s.step === 6 && <>
          <Head k={t.s6k} a={t.s6a} b={t.s6b} p={t.s6p} />
          <div className="exp-stats"><div className="exp-s"><span className="exp-v">1</span>{t.project}</div><div className="exp-s"><span className="exp-v">{s.characters.length}</span>{t.characters}</div><div className="exp-s"><span className="exp-v">{json.storyboard.total_scenes}</span>{t.storyboard}</div></div>
          <div className="json-wrap"><div className="json-bar"><span className="json-fn">◈ cartoon_project.quantum.json</span><button className="json-cp" onClick={copyJson}>{t.copy}</button></div><pre className="json-body">{jsonText}</pre></div>
          {s.status && <div className="qc-status">{s.status}</div>}
        </>}
      </section>
    </div>

    <div className="q-nav">
      <button className="nav-back" onClick={() => goStep(s.step - 1)} disabled={s.step <= 1}>{t.back}</button>
      <button className={`nav-next ${s.step === 6 ? "launch" : ""}`} onClick={() => s.step === 6 ? setS(prev => ({...prev, status:t.sent})) : goStep(s.step + 1)}>{s.step === 6 ? t.launch : t.next}</button>
    </div>
  </main>;
}

function Head({ k, a, b, p }) {
  return <><div className="q-eye">{k}</div><h1 className="q-title"><span className="glow">{a}</span><span className="dim">{b}</span></h1><p className="q-body">{p}</p></>;
}
function Field({ label, children }) {
  return <div className="q-field"><label className="q-label">{label}</label>{children}</div>;
}
