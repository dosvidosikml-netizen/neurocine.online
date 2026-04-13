// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- БАЗОВЫЕ НАСТРОЙКИ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355", physics:"тени движутся, камера из-за угла",        light:"cold forensic overhead light, hard rim light from behind",        asmr:"металлический скрежет, сухой щелчок затвора" },
  "ТАЙНА":         { icon:"🔍", col:"#a855f7", physics:"туман стелется, пылинки кружатся",             light:"flickering volumetric light, bioluminescent glow",          asmr:"тихий шорох бумаги, шёпот вплотную к микрофону" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316", physics:"пылинки кружатся, листья срываются",           light:"golden hour dust beams, single candle chiaroscuro",              asmr:"шуршание ткани, тяжелые шаги по камню" },
  "НАУКА":         { icon:"⚗",  col:"#06b6d4", physics:"пылинки кружатся, вода растекается",           light:"neon reflections on wet surface, bioluminescent glow",            asmr:"электрический гул, капля воды в тишине" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444", physics:"дым клубится, пепел летит в камеру",            light:"strobing red emergency light, hard rim light from behind",        asmr:"далекий гул, треск огня" },
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e", physics:"волосы развеваются на ветру, туман стелется",  light:"golden hour dust beams, dynamic reflections in the eyes",     asmr:"шорох листьев, капля воды в тишине" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899", physics:"пылинки кружатся, лёд трескается",             light:"flickering volumetric light, dynamic reflections in the eyes",    asmr:"шёпот вплотную к микрофону, электрический гул" },
  "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24", physics:"дым клубится, тени на стене",                  light:"single candle chiaroscuro shadows, flickering volumetric light",  asmr:"электрический гул, тихий шорох бумаги" },
};

const STORYBOARD_STYLES = [
  { id:"CINEMATIC",    icon:"🎬", col:"#ef4444", label:"Кино-реализм",   desc:"Блокбастер, 8k, Alexa 65",prompt:"cinematic realism, shot on Arri Alexa 65, 8k resolution, photorealistic, deep shadows, cinematic lighting" },
  { id:"UGC_PHONE",    icon:"📱", col:"#3b82f6", label:"UGC (На телефон)",desc:"Живая съемка, реализм",  prompt:"UGC style, shot on iPhone 15 Pro, vertical video footage, raw authentic, realistic amateur camera" },
  { id:"DARK_FANTASY", icon:"🌘", col:"#9333ea", label:"Тёмное фэнтези", desc:"Мрак, туман, мистика",   prompt:"dark fantasy movie style, misty eerie atmosphere, dark synthwave cinematic lighting, psychological horror" },
  { id:"FOUND_FOOTAGE",icon:"📼", col:"#10b981", label:"Найденная плёнка",desc:"Трясущаяся камера VHS",  prompt:"found footage horror style, shaky handheld amateur camera, low quality vhs, realistic terrifying atmosphere" },
  { id:"MACRO_DET",    icon:"🔬", col:"#f59e0b", label:"Макро Детали",   desc:"Крупный план, боке",      prompt:"extreme macro cinematography, probe lens, shallow depth of field, highly detailed texture, cinematic lighting" },
  { id:"LIMINAL",      icon:"🚪", col:"#06b6d4", label:"Liminal Space",  desc:"Пустота, тревога",       prompt:"liminal space aesthetic, strangely familiar empty room, eerie lighting, unsettling atmosphere, backrooms" },
  { id:"VAPORWAVE",    icon:"🌴", col:"#f472b6", label:"Vaporwave",      desc:"Неон, статуи, ретро",    prompt:"vaporwave aesthetic, 1990s VHS camcorder footage, cyan and magenta neon lighting, nostalgic vibe" },
  { id:"ANIME_CORE",   icon:"🌸", col:"#ec4899", label:"Аниме-эстетика", desc:"Стиль Ghibli / Mappa",   prompt:"high quality 90s anime cinematic style, detailed cel shading, vibrant nostalgic colors, beautifully illustrated" },
];

const FORMATS = [
  { id:"9:16", label:"Вертикальный (Shorts)", ratio:"9/16" },
  { id:"16:9", label:"Горизонтальный (YouTube)", ratio:"16/9" },
  { id:"1:1",  label:"Квадрат (Instagram)", ratio:"1/1" },
];

const DURATION_CONFIG = {
  "15 сек": { sec:15, frames:5 }, "30–45 сек": { sec:38, frames:13 }, "До 60 сек": { sec:60, frames:20 }, "1.5 мин": { sec:90, frames:30 }, "3 мин": { sec:180, frames:60 }
};
const DURATIONS = Object.keys(DURATION_CONFIG);
const HOOKS = ["⚡ ШОК","🔮 ТАЙНА","☠ ОПАСНОСТЬ","🌀 ПАРАДОКС","🩸 ПРОВОКАЦИЯ","👁 ЗАПРЕТ"];
const PLATFORMS = [{ id:"YouTube", icon:"▶", col:"#ef4444" }, { id:"TikTok", icon:"♪", col:"#06b6d4" }, { id:"Instagram", icon:"◈", col:"#ec4899" }];
const PALETTE = ["#ef4444","#f97316","#eab308","#06b6d4","#8b5cf6","#10b981"];

// --- ПРОФЕССИОНАЛЬНЫЕ ШАБЛОНЫ ОБЛОЖЕК (БЕЗ ПЯТЕН, С РАЗНЫМ ПОЗИЦИОНИРОВАНИЕМ) ---
const THUMBNAIL_TEMPLATES = [
  {
    id: "youtube_viral", name: "YouTube Viral", desc: "Текст по центру, черная обводка",
    render: () => ({
      layout: "center", align: "center", // ТЕКСТ ПО ЦЕНТРУ
      bgFallback: "linear-gradient(135deg, #1a0533 0%, #3d0066 50%, #000 100%)",
      titleStyle: { fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "Impact, Arial Black, sans-serif", textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "1.5px #000", textShadow: "5px 5px 0 #000, 0 0 30px #ff00ff", letterSpacing: 1, transform: "rotate(-2deg)", marginBottom: 12 },
      hookStyle: { fontSize: 16, fontWeight: 900, color: "#ffdd00", fontFamily: "Impact, sans-serif", textTransform: "uppercase", WebkitTextStroke: "1px #000", textShadow: "3px 3px 0 #000", marginBottom: 8, transform: "rotate(-2deg)" },
      ctaStyle: { fontSize: 13, fontWeight: 900, color: "#ff00ff", textTransform: "uppercase", letterSpacing: 1, background: "#000", padding: "6px 14px", borderRadius: 8, border: "2px solid #ff00ff", transform: "rotate(-2deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" },
      accent: "#ff00ff"
    }),
  },
  {
    id: "cinematic", name: "Cinematic", desc: "Стиль кино по центру",
    render: () => ({
      layout: "center", align: "center", // ТЕКСТ ПО ЦЕНТРУ
      bgFallback: "linear-gradient(160deg, #1a0000 0%, #2d0000 40%, #000 100%)",
      titleStyle: { fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,1)", letterSpacing: 1, marginBottom: 12 },
      hookStyle: { fontSize: 12, fontWeight: 600, color: "#e50914", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 4, marginBottom: 10 },
      ctaStyle: { fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 2, borderBottom: "1px solid #e50914", paddingBottom: 4 },
      accent: "#e50914"
    }),
  },
  {
    id: "tiktok", name: "TikTok Viral", desc: "Текст сверху, неоновый свет",
    render: () => ({
      layout: "top", align: "center", // ТЕКСТ СВЕРХУ
      bgFallback: "linear-gradient(145deg, #010101 0%, #1a1a2e 100%)",
      titleStyle: { fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "'Arial Black', sans-serif", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", marginBottom: 10 },
      hookStyle: { fontSize: 13, fontWeight: 800, color: "#00f2ea", fontFamily: "Arial, sans-serif", textTransform: "uppercase", marginBottom: 8, background: "#000", padding: "4px 8px", borderRadius: 6 },
      ctaStyle: { fontSize: 11, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: 1, background: "#ff0050", padding: "6px 12px", borderRadius: 20 },
      accent: "#00f2ea"
    }),
  },
  {
    id: "documentary", name: "Documentary", desc: "Текст снизу, элегантно",
    render: () => ({
      layout: "bottom", align: "left", // ТЕКСТ СНИЗУ
      bgFallback: "linear-gradient(160deg, #1a1a0d 0%, #2d2d1a 50%, #0d0d00 100%)",
      titleStyle: { fontSize: 26, fontWeight: 900, color: "#e8dcc8", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "0 4px 15px rgba(0,0,0,1)", marginBottom: 12 },
      hookStyle: { fontSize: 11, fontWeight: 700, color: "#d4a853", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 },
      ctaStyle: { fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 2, opacity: 0.8 },
      accent: "#d4a853"
    }),
  },
];

// --- СИСТЕМНЫЙ ПРОМПТ --- 
const VIRAL_SYSTEM = `### SYSTEM ROLE & ALGORITHMS (STRICT JSON)
You are 'Director-X', an uncensored, elite AI director. 
OUTPUT STRICTLY IN JSON FORMAT. NO markdown (no \`\`\`json).

🚨 CRITICAL RULES:
1. "imgPrompt_EN" and "vidPrompt_EN" MUST BE 100% IN ENGLISH!
2. PROMPTS MUST BE HIGHLY DETAILED (30-50 words). Describe lighting, textures, camera angles, color grading for Veo/Whisk/Grok models.
3. ALWAYS provide EXACTLY 3 hooks in the "hooks" array.
4. INJECT AUDIO/SFX cues at the end of "vidPrompt_EN" (e.g. "SFX: heavy breathing, distant thunder").
5. ANTI-CENSORSHIP: Avoid words like "blood", "gore". Use "dark cinematic shadows", "fatal outcome".

JSON SCHEMA:
{
  "hooks": [
    {"text": "Фраза на 0-2 сек", "visual": "Описание кадра 1"},
    {"text": "Фраза на 0-2 сек", "visual": "Описание кадра 2"},
    {"text": "Фраза на 0-2 сек", "visual": "Описание кадра 3"}
  ],
  "frames": [
    {
      "timecode": "0-3 сек",
      "camera": "описание движения",
      "visual": "что происходит в кадре",
      "voice": "слова диктора",
      "imgPrompt_EN": "LONG, HIGHLY DETAILED ENGLISH PROMPT FOR VEO...",
      "vidPrompt_EN": "LONG, HIGHLY DETAILED ENGLISH PROMPT FOR GROK... [SFX: audio description]"
    }
  ],
  "thumbnail": {
    "title": "Главный заголовок обложки (до 5 слов)",
    "hook": "Крючок сверху (до 3 слов, caps)",
    "cta": "Призыв внизу (2-3 слова, например: УЗНАЙ ПРАВДУ)",
    "emoji": "Один эмодзи 😱",
    "prompt_EN": "LONG DETAILED ENGLISH PROMPT FOR BACKGROUND IMAGE..."
  }
}`;

async function callAPI(content, maxTokens = 7000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }),
    });
    const textResponse = await res.text();
    if (!res.ok) throw new Error(`Ошибка сервера. Код: ${res.status}`);
    const data = JSON.parse(textResponse);
    if (data.error) throw new Error(data.error.message || data.error);
    return data.text || (data.choices && data.choices[0]?.message?.content) || "";
  } catch (e) { throw e; }
}

function CopyBtn({ text, label="Копировать", small=false }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={e=>{ e.stopPropagation(); try{navigator.clipboard?.writeText(text)}catch{}; setOk(true); setTimeout(()=>setOk(false),2000); }}
      style={{background:ok?"rgba(34,197,94,.25)":"rgba(255,255,255,.05)",border:`1px solid ${ok?"#4ade80":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.7)",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
      {ok?"✓ СКОПИРОВАНО":label}
    </button>
  );
}

function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone, 6000); return()=>clearTimeout(t); },[onDone]);
  const isErr = msg.includes("❌");
  return (
    <div style={{position:"fixed", top:isErr?"35%":"auto", bottom:isErr?"auto":"110px", left:"50%", transform:"translate(-50%, -50%)", background:isErr?"rgba(20,0,0,.95)":"rgba(0,20,10,.92)", backdropFilter:"blur(16px)", border:`1px solid ${isErr?"#ef4444":"#10b981"}`, borderRadius:isErr?24:16, padding:isErr?"30px 24px":"14px 20px", fontSize:isErr?16:12, fontWeight:800, color:isErr?"#fca5a5":"#6ee7b7", zIndex:9999, textAlign:"center", boxShadow:isErr?"0 0 60px rgba(239,68,68,.6)":"0 0 30px rgba(16,185,129,.2)", width:isErr?"90%":"auto" }}>
      {msg}
    </div>
  );
}

export default function Page() {
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [genre, setGenre] = useState("КРИМИНАЛ");
  const [hook, setHook] = useState("⚡ ШОК");
  const [dur, setDur] = useState("До 60 сек");
  const [plat, setPlat] = useState("YouTube");
  const [lang, setLang] = useState("RU");
  const [style, setStyle] = useState("CINEMATIC");
  const [vidFormat, setVidFormat] = useState("9:16");

  const [view, setView] = useState("form");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [tab, setTab] = useState("storyboard");
  const [result, setResult] = useState("");
  
  const [frames, setFrames] = useState([]);
  const [hooksList, setHooksList] = useState([]);
  const [thumb, setThumb] = useState(null);
  
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [busyScriptProcess, setBusyScriptProcess] = useState(false);
  const [busyTts, setBusyTts] = useState(false);
  const [ttsSettings, setTtsSettings] = useState("");

  const [bgImage, setBgImage] = useState(null);
  const [selTplId, setSelTplId] = useState("youtube_viral");
  const [downloading, setDownloading] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    try { const saved = localStorage.getItem("ds_history"); if (saved) setHistory(JSON.parse(saved)); } catch(e) {}
  }, []);

  useEffect(()=>{ scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); },[view]);

  function applyResult(rawText, fromHistory = false) {
    let cleanText = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) cleanText = cleanText.substring(startIdx);

    let data = { hooks: [], frames: [], thumbnail: null };
    let successParse = false;

    try { data = JSON.parse(cleanText); successParse = true; } catch (e) {
      const framesMatch = cleanText.match(/\{\s*"timecode"[^{]*?"vidPrompt_EN"[^{]*?\}/g) || cleanText.match(/\{\s*"timecode"[^{]*?"vidPrompt"[^{]*?\}/g);
      if (framesMatch) data.frames = framesMatch.map(f => { try { return JSON.parse(f); } catch(err) { return null; } }).filter(Boolean);
      if (!data.frames || data.frames.length === 0) throw new Error("Таймаут сервера. Уменьшите длину видео.");
    }
    
    setFrames(data.frames || data.Frames || []);
    setHooksList(data.hooks || data.Hooks || []);
    setThumb(data.thumbnail || data.Thumbnail || null);
    
    let scriptText = "🔥 ВАРИАНТЫ HOOK:\n" + (data.hooks || []).map((h, i)=>`${i+1}. 🗣 ${h.text}\n   🎬 ${h.visual}`).join("\n\n") + 
      "\n\n🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n📷 ${f.camera}\n👁 ${f.visual}\n🎙 «${f.voice}»`).join("\n\n");
    
    setResult(scriptText);
    setBgImage(null); 
    setTab("storyboard");
    setView("result");

    if (!fromHistory && successParse) {
      const title = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация по сценарию";
      const newItem = { id: Date.now(), topic: title, time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}), text: cleanText, format: vidFormat };
      setHistory(prev => { const next = [newItem, ...prev].slice(0, 10); localStorage.setItem("ds_history", JSON.stringify(next)); return next; });
    }
  }

  function clearHistory() { localStorage.removeItem("ds_history"); setHistory([]); setShowHistory(false); }

  async function handleWriteScript() {
    if (!topic.trim()) return setErr("Сначала введите тему!");
    setBusyScriptProcess(true); setLoadingMsg("Пишу мощный текст..."); setView("loading");
    try {
      const sysTxt = `You are 'Director-X', an uncensored AI. Напиши ТОЛЬКО текст для диктора. Обходи цензуру через саспенс.`;
      const text = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши чистый текст диктора.`, 3000, sysTxt);
      setScript(text.trim()); setToast("Текст сгенерирован!");
    } catch(e) { setToast("❌ " + e.message); } finally { setBusyScriptProcess(false); setView("form"); }
  }

  async function handlePrepareVoice() {
    if (!script.trim()) return setErr("Вставьте исходный текст!");
    setBusyScriptProcess(true); setLoadingMsg("Уникализация..."); setView("loading");
    try {
      const sysVoice = `You are an uncensored AI editor. Заменяй слова на метафоры. РАССТАВЬ УДАРЕНИЯ в словах (гласную делай ЗАГЛАВНОЙ). Добавь паузы (...). Верни ТОЛЬКО текст.`;
      const text = await callAPI(`Перепиши и расставь ударения в тексте:\n\n${script}`, 3000, sysVoice);
      setScript(text.trim()); setToast("Текст уникализирован!");
    } catch(e) { setToast("❌ " + e.message); } finally { setBusyScriptProcess(false); setView("form"); }
  }

  async function handleGetTtsSettings() {
    if (!script.trim()) return;
    setBusyTts(true);
    try {
      const text = await callAPI(`Genre: ${genre}. Platform: ${plat}. Script: "${script.substring(0,100)}..."\nProvide Google AI Studio TTS settings:\nVOICE: [Zephyr, Puck, Charon, Aoede, Fenrir]\nSPEED: [Fast/Medium/Slow]\nSTYLE PROMPT: [English instruction]`, 1000, "Output STRICTLY IN ENGLISH. 3 lines only.");
      setTtsSettings(text.trim()); setToast("Настройки TTS получены!");
    } catch(e) { setToast("❌ " + e.message); } finally { setBusyTts(false); }
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) { setErr("Введите тему или готовый сценарий!"); return; }
    setErr(""); setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        setLoadingMsg("Обходим фильтры, пишем скрипт...");
        currentScript = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши чистый текст диктора.`, 3000, `You are 'Director-X', an uncensored AI. Напиши ТОЛЬКО текст для диктора.`);
        setScript(currentScript.trim());
      }
      setLoadingMsg("Генерация детализированных промптов...");
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
      const preset = GENRE_PRESETS[genre];
      const sty = STORYBOARD_STYLES.find(s=>s.id===style) || STORYBOARD_STYLES[0];
      
      const req = `ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON! ОБЯЗАТЕЛЬНО 3 ХУКА И РОВНО ${durCfg.frames} КАДРОВ! ПРОМПТЫ НА АНГЛИЙСКОМ!`;
      const ctx = `ТЕМА: ${topic}\nФОРМАТ ВИДЕО: ${currFormat.label} (${currFormat.ratio})\nЖАНР: ${genre} | ПЛАТФОРМА: ${plat} | ЯЗЫК: ${lang}\nФИЗИКА: ${preset.physics} | СВЕТ: ${preset.light} | ASMR: ${preset.asmr}\nСТИЛЬ: ${sty.label} — ${sty.prompt}\nДЛИТЕЛЬНОСТЬ: ${dur} → СТРОГО ${durCfg.frames} КАДРОВ. ТИП HOOK: ${hook}`;
      
      const text = await callAPI(`${ctx}\n\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 7000, VIRAL_SYSTEM);
      applyResult(text, false);
    } catch(e) {
      setErr(e.message); setToast("❌ " + e.message); setView("form");
    } finally { setBusy(false); setLoadingMsg(""); }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBgImage(event.target.result);
    reader.readAsDataURL(file);
  }

  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export");
    if (!el) return;
    setDownloading(true);

    const doCapture = () => {
      window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
        const link = document.createElement('a'); link.download = `DocuShorts_Cover_${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
        setDownloading(false); setToast("Обложка успешно сохранена!");
      }).catch(() => { setDownloading(false); setToast("❌ Ошибка при рендере обложки"); });
    };

    if (!window.html2canvas) {
      setToast("Запуск движка рендеринга...");
      const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = doCapture; document.body.appendChild(script);
    } else { doCapture(); }
  }

  const S = {
    root: { minHeight:"100vh", backgroundColor:"#05050a", backgroundImage:`radial-gradient(circle at 50% 0%, #1c0e3a 0%, #090912 60%, #05050a 100%)`, color:"#e2e8f0", fontFamily:"'SF Pro Display', -apple-system, sans-serif", paddingBottom:180, overflowY:"auto", position:"relative", zIndex:1 },
    gridBg: { position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:-1, opacity:0.15, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.7)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:24, padding:20, backdropFilter:"blur(12px)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];

  // Динамические стили для контейнера обложки
  const tpl = THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render();
  const getGradientForLayout = (layout) => {
    if (layout === "center") return "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)";
    if (layout === "top") return "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)";
    return "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)"; // bottom
  };

  return (
    <div ref={scrollRef} style={S.root}>
      <div style={S.gridBg} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .gbtn{width:100%;height:54px;border:none;border-radius:16px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s;}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .gbtn:disabled{opacity:.4;cursor:not-allowed}
        textarea:focus{outline:none;border-color:rgba(168,85,247,.6)!important;background:rgba(0,0,0,.6)!important;}
      `}</style>
      
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

      {showHistory && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(16px)"}}>
          <div style={{background:"#0a0a12",border:"1px solid rgba(139,92,246,.4)",borderRadius:24,width:"90%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.8)"}}>
             <div style={{padding:24,borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <span style={{fontWeight:800,color:"#fff",letterSpacing:1,textTransform:"uppercase",fontSize:14}}>🗄 АРХИВ ПРОЕКТОВ</span>
               <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",fontSize:24,cursor:"pointer"}}>✕</button>
             </div>
             <div style={{padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
               {history.length===0 ? <div style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:"40px 0"}}>Архив пуст</div> :
                 history.map((h) => (
                   <div key={h.id} style={{background:"rgba(255,255,255,.03)",borderRadius:16,padding:16,cursor:"pointer",border:"1px solid rgba(255,255,255,.05)",transition:"all .2s"}} onClick={() => { setVidFormat(h.format || "9:16"); applyResult(h.text, true); setShowHistory(false); }}>
                     <div style={{fontSize:10,color:"#8b5cf6",fontWeight:700,marginBottom:6,fontFamily:"monospace"}}>{h.time}</div>
                     <div style={{fontSize:14,fontWeight:600,color:"#fff",lineHeight:1.4}}>{h.topic}</div>
                   </div>
                 ))
               }
             </div>
             {history.length > 0 && (
               <div style={{padding:20,borderTop:"1px solid rgba(255,255,255,.05)"}}>
                 <button onClick={clearHistory} style={{width:"100%",background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.3)",padding:"14px",borderRadius:14,fontWeight:800,cursor:"pointer",textTransform:"uppercase",fontSize:12,letterSpacing:1}}>Очистить архив</button>
               </div>
             )}
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff"}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        <div style={{display:"flex",gap:8}}>
          {view==="form" && result && <button onClick={()=>setView("result")} style={{padding:"8px 16px",background:"rgba(168,85,247,.1)",border:"1px solid rgba(168,85,247,.3)",borderRadius:12,color:"#d8b4fe",fontSize:12,fontWeight:800,cursor:"pointer",textTransform:"uppercase"}}>👁 К Результату</button>}
          {view==="form" && !result && <button onClick={()=>setShowHistory(true)} style={{padding:"8px 16px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"#cbd5e1",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>🗄 Архив</button>}
          {view==="result" && result && <button onClick={()=>setView("form")} style={{padding:"8px 14px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"#cbd5e1",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>↺ Редактор</button>}
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:500,margin:"0 auto",padding:"30px 20px"}}>
          
          <div style={S.section}>
            <label style={S.label}>📐 ФОРМАТ КАДРА И ОБЛОЖКИ</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{background:vidFormat===f.id?"rgba(168,85,247,.15)":"rgba(0,0,0,.3)",border:`1px solid ${vidFormat===f.id?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:24,padding:"10px 18px",fontSize:12,fontWeight:vidFormat===f.id?800:500,color:vidFormat===f.id?"#d8b4fe":"rgba(255,255,255,.5)",cursor:"pointer"}}>{f.id} - {f.label}</button>)}
            </div>
          </div>
          
          <div style={S.section}>
            <label style={S.label}>🎯 ИДЕЯ ИЛИ ТЕМА ВАШЕГО ХИТА *</label>
            <textarea rows={2} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:15,color:"#fff",resize:"none",marginBottom:12}}/>
            <button onClick={handleWriteScript} disabled={busyScriptProcess || !topic.trim()} style={{width:"100%",height:44,border:"1px dashed rgba(168,85,247,.4)",borderRadius:14,background:"rgba(168,85,247,.05)",color:"#d8b4fe",cursor:topic.trim()?"pointer":"not-allowed",fontWeight:700,opacity:topic.trim()?1:0.5}}>✍️ Сгенерировать сильный текст</button>
          </div>

          <div style={S.section}>
            <label style={S.label}>📝 ТЕКСТ ДЛЯ ОЗВУЧКИ (ЕСЛИ ЕСТЬ)</label>
            <textarea rows={5} value={script} onChange={e=>setScript(e.target.value)} placeholder="Вставьте сюда текст диктора..." style={{width:"100%",background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:14,color:"#e2e8f0",resize:"none"}}/>
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={handlePrepareVoice} disabled={!script.trim() || busyScriptProcess || busy} style={{flex:1,height:50,border:"1px solid rgba(16,185,129,.3)",borderRadius:16,background:"rgba(16,185,129,.1)",color:"#6ee7b7",cursor:script.trim()?"pointer":"not-allowed",fontWeight:800,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:script.trim()?1:0.5}}>
                <span style={{textTransform:"uppercase",letterSpacing:1}}>🎙 Уникализировать</span><span style={{fontSize:9,fontWeight:500,opacity:.7}}>Обход цензуры</span>
              </button>
              <button onClick={handleGetTtsSettings} disabled={!script.trim() || busyTts || busy} style={{flex:1,height:50,border:"1px solid rgba(14,165,233,.3)",borderRadius:16,background:"rgba(14,165,233,.1)",color:"#7dd3fc",cursor:script.trim()?"pointer":"not-allowed",fontWeight:800,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:script.trim()?1:0.5}}>
                <span style={{textTransform:"uppercase",letterSpacing:1}}>{busyTts ? "Анализ..." : "⚙️ Настройки"}</span><span style={{fontSize:9,fontWeight:500,opacity:.7}}>Google AI Studio</span>
              </button>
            </div>
            {ttsSettings && (
              <div style={{marginTop:16, background:"rgba(14,165,233,.05)", border:"1px solid rgba(14,165,233,.2)", borderRadius:16, padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:10,color:"#38bdf8",fontWeight:800}}>НАСТРОЙКИ ДИКТОРА</span><CopyBtn text={ttsSettings} small/></div>
                <pre style={{whiteSpace:"pre-wrap",fontFamily:"monospace",fontSize:13,color:"#e2e8f0"}}>{ttsSettings}</pre>
              </div>
            )}
          </div>

          <div style={S.section}>
            <label style={S.label}>🎭 ЖАНР НАРАТИВА</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?`${p.col}22`:"rgba(0,0,0,.3)",border:`1px solid ${genre===g?p.col:"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <span style={{fontSize:24,filter:genre===g?"none":"grayscale(100%) opacity(50%)"}}>{p.icon}</span>
                  <span style={{fontSize:9,color:genre===g?p.col:"rgba(255,255,255,.4)",fontWeight:800}}>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>🎣 ТРИГГЕР ДЛЯ ЗРИТЕЛЯ (HOOK)</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {HOOKS.map(h=><button key={h} onClick={()=>setHook(h)} style={{background:hook===h?"rgba(239,68,68,.15)":"rgba(0,0,0,.3)",border:`1px solid ${hook===h?"#ef4444":"rgba(255,255,255,.05)"}`,borderRadius:24,padding:"10px 18px",fontSize:12,fontWeight:hook===h?800:500,color:hook===h?"#fca5a5":"rgba(255,255,255,.5)",cursor:"pointer"}}>{h}</button>)}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>🎨 КИНЕМАТОГРАФИЧЕСКИЙ СТИЛЬ</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {STORYBOARD_STYLES.map(s=>(
                <button key={s.id} onClick={()=>setStyle(s.id)} style={{background:style===s.id?`${s.col}15`:"rgba(0,0,0,.3)",border:`1px solid ${style===s.id?s.col:"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:style===s.id?s.col:"rgba(255,255,255,.7)",marginBottom:4}}>{s.label}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.3)",lineHeight:1.3}}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>⏱ ХРОНОМЕТРАЖ</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.15)":"rgba(0,0,0,.3)",border:`1px solid ${dur===d?"#f97316":"rgba(255,255,255,.05)"}`,borderRadius:24,padding:"10px 18px",fontSize:12,fontWeight:dur===d?800:500,color:dur===d?"#fdba74":"rgba(255,255,255,.5)",cursor:"pointer"}}>{d}</button>)}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <div style={{...S.section, marginBottom:0}}>
              <label style={S.label}>📱 ПЛАТФОРМА</label>
              {PLATFORMS.map(p=><button key={p.id} onClick={()=>setPlat(p.id)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:plat===p.id?`${p.col}1a`:"rgba(0,0,0,.3)",border:`1px solid ${plat===p.id?p.col:"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"12px 16px",cursor:"pointer",marginBottom:8}}><span style={{fontSize:16}}>{p.icon}</span><span style={{fontSize:13,fontWeight:plat===p.id?800:500,color:plat===p.id?p.col:"rgba(255,255,255,.5)"}}>{p.id}</span></button>)}
            </div>
            <div style={{...S.section, marginBottom:0}}>
              <label style={S.label}>🌐 ЯЗЫК ОЗВУЧКИ</label>
              {["RU","EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{display:"block",width:"100%",background:lang===l?"rgba(168,85,247,.15)":"rgba(0,0,0,.3)",border:`1px solid ${lang===l?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"16px",cursor:"pointer",marginBottom:8,fontSize:16,fontWeight:lang===l?900:500,color:lang===l?"#d8b4fe":"rgba(255,255,255,.4)"}}>{l}</button>)}
            </div>
          </div>

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,padding:"16px 20px 24px",background:"rgba(5,5,10,0.9)",backdropFilter:"blur(12px)",zIndex:100}}>
            <button className="gbtn" onClick={handleGenerateFullPlan} disabled={(!script.trim() && !topic.trim()) || busy}>{busy?"СИСТЕМА В РАБОТЕ...":"🚀 АКТИВИРОВАТЬ НЕЙРОСЕТЬ"}</button>
          </div>
        </div>
      )}

      {view==="loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 20px",textAlign:"center"}}>
           <div style={{fontSize:40, animation:"spin 1s linear infinite", marginBottom:20}}>⏳</div>
           <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{loadingMsg || "АНАЛИЗ..."}</div>
        </div>
      )}

      {view==="result" && (
        <div style={{maxWidth:500,margin:"0 auto",padding:"20px"}}>
          
          {/* СТУДИЯ ОБЛОЖЕК */}
          {thumb && (
            <div style={{background:"rgba(255,255,255,.02)", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:20, marginBottom:30}}>
              <div style={{fontSize:14, fontWeight:900, color:"#d8b4fe", letterSpacing:1, marginBottom:20, textTransform:"uppercase", display:"flex", alignItems:"center", gap:10}}>
                <span>🎨 СТУДИЯ ОБЛОЖКИ (АВТО-РЕНДЕР)</span>
              </div>
              
              <div style={{display:"flex", justifyContent:"center", marginBottom:20}}>
                <div id="thumbnail-export" style={{
                  width: 320, aspectRatio: currFormat.ratio, overflow: "hidden", position: "relative",
                  background: bgImage ? `url(${bgImage}) center/cover no-repeat` : tpl.bgFallback,
                  display: "flex", flexDirection: "column", padding: 24,
                  // ДИНАМИЧЕСКИЙ LAYOUT ИЗ ШАБЛОНА
                  justifyContent: tpl.layout === "center" ? "center" : (tpl.layout === "top" ? "flex-start" : "flex-end"),
                  alignItems: tpl.align === "center" ? "center" : "flex-start",
                  textAlign: tpl.align
                }}>
                  {/* Динамический градиент */}
                  <div style={{position:"absolute", inset:0, background:getGradientForLayout(tpl.layout), zIndex:1}} />
                  
                  {/* Текстовые элементы */}
                  <div style={{position:"relative", zIndex:2, width:"100%", display: "flex", flexDirection: "column", alignItems: tpl.align === "center" ? "center" : "flex-start"}}>
                    
                    {/* Эмодзи можно показывать только в определенных стилях или оставить общим */}
                    {tpl.layout !== "center" && (
                      <div style={{fontSize:32, filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.8))", marginBottom: 10}}>{thumb.emoji || "🔥"}</div>
                    )}

                    <div style={tpl.hookStyle}>{thumb.hook || "СМОТРИ СЕЙЧАС"}</div>
                    <div style={tpl.titleStyle}>{thumb.title || thumb.text || "НЕИЗВЕСТНАЯ ИСТОРИЯ"}</div>
                    <div style={tpl.ctaStyle}>{thumb.cta || "УЗНАЙ ПРАВДУ"}</div>

                  </div>
                </div>
              </div>

              <div style={{display:"flex", gap:10, marginBottom:20}}>
                <label style={{flex:1, height:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.1)", border:"1px dashed rgba(255,255,255,.3)", borderRadius:12, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                  📸 Вставить фон
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                </label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:50, border:"none", borderRadius:12, background:"linear-gradient(135deg, #10b981, #059669)", color:"#fff", fontSize:12, fontWeight:900, cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>
                  {downloading ? "Рендер..." : "💾 СКАЧАТЬ"}
                </button>
              </div>

              <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:10}}>
                {THUMBNAIL_TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setSelTplId(t.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${selTplId===t.id?t.render().accent:"rgba(255,255,255,.1)"}`, background:selTplId===t.id?`${t.render().accent}22`:"rgba(0,0,0,.3)", color:selTplId===t.id?"#fff":"rgba(255,255,255,.5)", fontSize:11, fontWeight:800, cursor:"pointer"}}>
                    {t.name}
                  </button>
                ))}
              </div>

              <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:16, padding:16}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                  <span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ENGLISH PROMPT (ДЛЯ ФОНА В VEO)</span>
                  <CopyBtn text={thumb.prompt_EN || ""} label="Copy" small/>
                </div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb.prompt_EN || "Промпт не сгенерирован"}</div>
              </div>
            </div>
          )}

          {/* РАСКАДРОВКА */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14, fontWeight:900, color:"#fff", letterSpacing:1, marginBottom:20, textTransform:"uppercase"}}>🎬 РАСКАДРОВКА ({frames.length} КАДРОВ)</div>
            {frames.map((f,i)=>{
              const c = PALETTE[i % PALETTE.length];
              return (
                <div key={i} style={{background:"rgba(10,10,15,.6)", border:"1px solid rgba(255,255,255,.05)", borderRadius:16, padding:20, marginBottom:16}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#ef4444"}}>● CH-{String(i+1).padStart(2,"0")}</span>
                    <span style={{fontSize:10, color:c, background:`${c}1a`, padding:"2px 6px", borderRadius:6}}>TC: {f.timecode}</span>
                  </div>
                  {f.visual && <div style={{fontSize:13, color:"#fff", marginBottom:10}}>👁 {f.visual}</div>}
                  {f.voice && <div style={{fontSize:13, fontStyle:"italic", color:"rgba(255,255,255,.8)", marginBottom:12, borderLeft:`2px solid ${c}`, paddingLeft:10}}>«{f.voice}»</div>}
                  
                  {f.imgPrompt_EN && (
                    <div style={{background:"rgba(16,185,129,.05)", padding:10, borderRadius:8, marginBottom:8}}>
                      <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}><span style={{fontSize:9, color:"#34d399", fontWeight:800}}>IMAGE PROMPT</span><CopyBtn text={f.imgPrompt_EN} small/></div>
                      <div style={{fontSize:11, fontFamily:"monospace", color:"#6ee7b7"}}>{f.imgPrompt_EN}</div>
                    </div>
                  )}
                  {f.vidPrompt_EN && (
                    <div style={{background:"rgba(139,92,246,.05)", padding:10, borderRadius:8}}>
                      <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}><span style={{fontSize:9, color:"#a78bfa", fontWeight:800}}>VIDEO + AUDIO PROMPT</span><CopyBtn text={f.vidPrompt_EN} small/></div>
                      <div style={{fontSize:11, fontFamily:"monospace", color:"#d8b4fe"}}>{f.vidPrompt_EN}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  );
}
