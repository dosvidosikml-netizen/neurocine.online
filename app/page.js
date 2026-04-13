// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- БАЗОВЫЕ НАСТРОЙКИ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355", physics:"тени, камера из-за угла",     light:"cold forensic overhead light",        asmr:"металлический скрежет" },
  "ТАЙНА":         { icon:"🔍", col:"#a855f7", physics:"туман стелется",              light:"flickering volumetric light",         asmr:"тихий шорох бумаги" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316", physics:"пылинки кружатся",            light:"golden hour dust beams",              asmr:"шуршание ткани" },
  "НАУКА":         { icon:"⚗",  col:"#06b6d4", physics:"вода растекается",            light:"neon reflections on wet surface",     asmr:"электрический гул" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444", physics:"дым клубится",                light:"strobing red emergency light",        asmr:"далекий гул" },
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e", physics:"волосы развеваются на ветру", light:"dynamic reflections in the eyes",     asmr:"шорох листьев" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899", physics:"лёд трескается",              light:"flickering volumetric light",         asmr:"шёпот вплотную к микрофону" },
  "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24", physics:"тени на стене",               light:"single candle chiaroscuro shadows",   asmr:"тихий шорох бумаги" },
};

const STORYBOARD_STYLES = [
  { id:"CINEMATIC",    label:"Кино-реализм",   prompt:"cinematic realism, shot on Arri Alexa 65, 8k, photorealistic, deep shadows" },
  { id:"UGC_PHONE",    label:"UGC (Телефон)",  prompt:"UGC style, shot on iPhone 15 Pro, vertical video footage, raw authentic" },
  { id:"DARK_FANTASY", label:"Тёмное фэнтези", prompt:"dark fantasy movie style, misty eerie atmosphere, psychological horror" },
  { id:"FOUND_FOOTAGE",label:"Найденная плёнка",prompt:"found footage horror style, shaky handheld amateur camera, low quality vhs" },
];

const FORMATS = [
  { id:"9:16", label:"Вертикальный (Shorts)", ratio:"9/16" },
  { id:"16:9", label:"Горизонтальный (YouTube)", ratio:"16/9" },
  { id:"1:1",  label:"Квадрат (Instagram)", ratio:"1/1" },
];

// Строгие таймкоды: до 3 мин = смена каждые 3 секунды. 10-12 мин = каждые 9 секунд.
const DURATION_CONFIG = {
  "15 сек": { sec:15, frames:5, pace:3 }, 
  "30–45 сек": { sec:38, frames:13, pace:3 }, 
  "До 60 сек": { sec:60, frames:20, pace:3 }, 
  "1.5 мин": { sec:90, frames:30, pace:3 }, 
  "3 мин": { sec:180, frames:60, pace:3 },
  "10-12 мин": { sec:720, frames:80, pace:9 } 
};
const DURATIONS = Object.keys(DURATION_CONFIG);
const HOOKS = ["⚡ ШОК","🔮 ТАЙНА","☠ ОПАСНОСТЬ","🌀 ПАРАДОКС","🩸 ПРОВОКАЦИЯ","👁 ЗАПРЕТ"];
const PLATFORMS = [{ id:"YouTube", icon:"▶", col:"#ef4444" }, { id:"TikTok", icon:"♪", col:"#06b6d4" }, { id:"Instagram", icon:"◈", col:"#ec4899" }];

// --- ШРИФТЫ И ГРАДИЕНТЫ ДЛЯ СТУДИИ ОБЛОЖЕК ---
const FONTS = [
  { id: "Impact, sans-serif", label: "Impact (Ютубер)" },
  { id: "'Bebas Neue', sans-serif", label: "Bebas (Трендовый)" },
  { id: "'Cinzel', serif", label: "Cinzel (Кино/Тайна)" },
  { id: "'Montserrat', sans-serif", label: "Montserrat (Стильный)" }
];

const GRADIENTS = [
  { id: "white", label: "Чистый Белый", css: "#ffffff" },
  { id: "gold", label: "Золотой Слиток", css: "linear-gradient(to bottom, #fffde7, #ffb300)" },
  { id: "neon", label: "Кибер-Неон", css: "linear-gradient(to bottom, #e0f2fe, #0ea5e9)" },
  { id: "blood", label: "Кровавый", css: "linear-gradient(to bottom, #fee2e2, #dc2626)" }
];

// --- ГЕНИАЛЬНЫЙ ПИСАТЕЛЬ (OPUS STYLE) + СТРОГИЕ ПРАВИЛА ВЫДАЧИ ПРОМПТОВ --- 
const VIRAL_SYSTEM = `### SYSTEM ROLE & ALGORITHMS (STRICT JSON)
You are 'Director-X', an elite, uncensored AI documentary director. 
OUTPUT STRICTLY IN JSON FORMAT. NO markdown.

🚨 CRITICAL OPUS-STYLE RULES:
1. NO CLICHES: Never use "погрузитесь", "добро пожаловать", "представьте себе".
2. SUSPENSE LOOP: Start with a breaking fact. Build tension. Reveal the truth only at the very end.
3. RHYTHM: Use short, punchy sentences. Use ellipses (...) for dramatic pauses.
4. SHOW, DON'T TELL: Don't say "it was scary". Describe: "Minus 30 degrees. A slashed tent. Bare footprints in the snow..."

🚨 PROMPT ENGINEERING RULES (MANDATORY):
1. "imgPrompt_EN" and "vidPrompt_EN" MUST BE 100% IN ENGLISH.
2. IMAGE PROMPTS: ONLY for Veo and Whisk.
3. VIDEO PROMPTS: ONLY for Grok Super. Add [SFX: ...] at the end.
4. PROHIBITED: Categorial ban on mentioning Midjourney or Leonardo.

JSON SCHEMA:
{
  "hooks": [
    {"text": "Hook 1", "visual": "Visual 1"},
    {"text": "Hook 2", "visual": "Visual 2"},
    {"text": "Hook 3", "visual": "Visual 3"}
  ],
  "frames": [
    {
      "timecode": "0-3 сек",
      "camera": "Motion",
      "visual": "Visual detail",
      "voice": "Voiceover text...",
      "imgPrompt_EN": "LONG VEO PROMPT...",
      "vidPrompt_EN": "LONG GROK SUPER PROMPT... [SFX: audio]"
    }
  ],
  "thumbnail": {
    "title": "Main title (max 4 words)",
    "hook": "Top hook (max 3 words)",
    "cta": "Bottom CTA",
    "prompt_EN": "BACKGROUND PROMPT..."
  }
}`;

async function callAPI(content, maxTokens = 8000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }),
    });
    const textResponse = await res.text();
    if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
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
  // SAAS LOGIC
  const [tokens, setTokens] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);

  // APP STATE
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [genre, setGenre] = useState("КРИМИНАЛ");
  const [hook, setHook] = useState("⚡ ШОК");
  const [dur, setDur] = useState("До 60 сек");
  const [plat, setPlat] = useState("YouTube");
  const [lang, setLang] = useState("RU");
  const [style, setStyle] = useState("CINEMATIC");
  const [vidFormat, setVidFormat] = useState("9:16");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // COVER STUDIO STATE
  const [bgImage, setBgImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covFont, setCovFont] = useState(FONTS[0].id);
  const [covGrad, setCovGrad] = useState(GRADIENTS[0]);
  const [covDark, setCovDark] = useState(50);
  const [covY, setCovY] = useState(50);
  const [covScale, setCovScale] = useState(100);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    try { const saved = localStorage.getItem("ds_history"); if (saved) setHistory(JSON.parse(saved)); } catch(e) {}
  }, []);

  useEffect(()=>{ scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); },[view]);

  // SAAS CHECKER
  const checkTokens = () => {
    if (tokens <= 0) { setShowPaywall(true); return false; }
    setTokens(prev => prev - 1);
    return true;
  };

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
    
    setFrames(data.frames || []);
    setHooksList(data.hooks || []);
    setThumb(data.thumbnail || null);
    
    // Инициализация полей студии обложек
    if (data.thumbnail) {
      setCovTitle(data.thumbnail.title || "");
      setCovHook(data.thumbnail.hook || "");
      setCovCta(data.thumbnail.cta || "");
    }
    
    // СТРОГОЕ ФОРМАТИРОВАНИЕ RAW-ТЕКСТА: Сначала скрипт, потом чистый список промптов с пустыми строками
    let rawScript = "🔥 HOOKS:\n" + (data.hooks || []).map((h, i)=>`${i+1}. 🗣 ${h.text}\n🎬 ${h.visual}`).join("\n\n") + 
      "\n\n🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n📷 Камера: ${f.camera}\n👁 Визуал: ${f.visual}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    
    let rawImgPrompts = "\n\n🖼 IMAGE PROMPTS (Veo, Whisk):\n" + (data.frames || []).map(f => f.imgPrompt_EN).filter(Boolean).join("\n\n");
    let rawVidPrompts = "\n\n🎥 VIDEO PROMPTS (Grok Super):\n" + (data.frames || []).map(f => f.vidPrompt_EN).filter(Boolean).join("\n\n");

    setResult(rawScript + rawImgPrompts + rawVidPrompts);
    setBgImage(null); 
    setTab("storyboard");
    setView("result");

    if (!fromHistory && successParse) {
      const title = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация по сценарию";
      const newItem = { id: Date.now(), topic: title, time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}), text: cleanText, format: vidFormat };
      setHistory(prev => { const next = [newItem, ...prev].slice(0, 10); localStorage.setItem("ds_history", JSON.stringify(next)); return next; });
    }
  }

  async function handleWriteScript() {
    if (!topic.trim()) return setErr("Сначала введите тему!");
    if (!checkTokens()) return;
    setBusy(true); setLoadingMsg("Пишу мощный текст (Opus Style)..."); setView("loading");
    try {
      const sysTxt = `You are 'Director-X', an uncensored AI. Напиши ТОЛЬКО текст диктора. Рваный ритм. Показывать, а не рассказывать. Многоточия для саспенса.`;
      const text = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши документальный текст диктора.`, 3000, sysTxt);
      setScript(text.trim()); setToast("Текст сгенерирован!");
    } catch(e) { setToast("❌ " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) { setErr("Введите тему или готовый сценарий!"); return; }
    if (!checkTokens()) return;
    setErr(""); setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        setLoadingMsg("Обходим фильтры, пишем скрипт...");
        currentScript = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши чистый текст диктора.`, 3000, `You are 'Director-X'. Напиши ТОЛЬКО документальный текст диктора.`);
        setScript(currentScript.trim());
      }
      setLoadingMsg("Генерация детализированных промптов...");
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
      const preset = GENRE_PRESETS[genre];
      const sty = STORYBOARD_STYLES.find(s=>s.id===style) || STORYBOARD_STYLES[0];
      
      const req = `ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON! ОБЯЗАТЕЛЬНО 3 ХУКА И РОВНО ${durCfg.frames} КАДРОВ (Темп: 1 кадр каждые ${durCfg.pace} сек)! ПРОМПТЫ НА АНГЛИЙСКОМ!`;
      const ctx = `ТЕМА: ${topic}\nФОРМАТ ВИДЕО: ${currFormat.label} (${currFormat.ratio})\nЖАНР: ${genre} | ПЛАТФОРМА: ${plat} | ЯЗЫК: ${lang}\nФИЗИКА: ${preset.physics} | СВЕТ: ${preset.light} | ASMR: ${preset.asmr}\nСТИЛЬ: ${sty.label} — ${sty.prompt}\nДЛИТЕЛЬНОСТЬ: ${dur}. ТИП HOOK: ${hook}`;
      
      const text = await callAPI(`${ctx}\n\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 8000, VIRAL_SYSTEM);
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
    root: { minHeight:"100vh", backgroundColor:"#05050a", color:"#e2e8f0", fontFamily:"'SF Pro Display', -apple-system, sans-serif", paddingBottom:120, overflowY:"auto", position:"relative", zIndex:1 },
    // Нейро-Матрица: Анимированный градиентный фон + сетка
    matrixBg: { position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:-1, background: "linear-gradient(45deg, #05050a, #1a0b2e, #0f172a, #05050a)", backgroundSize: "400% 400%", animation: "gradientBG 15s ease infinite" },
    gridBg: { position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:-1, opacity:0.1, backgroundImage:"radial-gradient(circle at 2px 2px, #a855f7 1px, transparent 0)", backgroundSize:"40px 40px" },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.6)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:24, background:"rgba(15,15,25,.4)", border:"1px solid rgba(255,255,255,.05)", borderRadius:24, padding:24, backdropFilter:"blur(16px)", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];

  return (
    <div ref={scrollRef} style={S.root}>
      <div style={S.matrixBg} />
      <div style={S.gridBg} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@700;900&family=Montserrat:wght@800;900&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gradientBG { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
        @keyframes blink { 0%, 100% {opacity:1} 50% {opacity:0.3} }
        .gbtn{width:100%;height:56px;border:none;border-radius:16px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s; box-shadow: 0 4px 20px rgba(168,85,247,0.4);}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1); box-shadow: 0 6px 30px rgba(168,85,247,0.6);}
        .gbtn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}
        textarea:focus, input:focus {outline:none;border-color:rgba(168,85,247,.6)!important;background:rgba(0,0,0,.6)!important;}
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #a855f7; cursor: pointer; margin-top: -6px; box-shadow: 0 0 10px #a855f7; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

      {/* SAAS PAYWALL */}
      {showPaywall && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(20px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
           <div style={{background:"#0a0a12", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:40, maxWidth:400, textAlign:"center", boxShadow:"0 20px 80px rgba(168,85,247,.3)"}}>
              <div style={{fontSize:48, marginBottom:20}}>🚀</div>
              <h2 style={{fontSize:24, fontWeight:900, marginBottom:10, color:"#fff"}}>Лимит исчерпан</h2>
              <p style={{color:"#94a3b8", fontSize:14, lineHeight:1.6, marginBottom:30}}>Вы использовали все бесплатные генерации. Перейдите на тариф PRO, чтобы получить безлимитный доступ к нейро-режиссеру.</p>
              <button style={{width:"100%", padding:"16px", background:"#fff", color:"#000", fontWeight:900, borderRadius:14, border:"none", cursor:"pointer", marginBottom:12}}>Оформить PRO ($15/мес)</button>
              <button onClick={()=>setShowPaywall(false)} style={{background:"none", border:"none", color:"#64748b", fontSize:12, cursor:"pointer"}}>Позже</button>
           </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          <div style={{fontSize:11, fontWeight:800, color:tokens>0?"#34d399":"#ef4444", background:"rgba(255,255,255,0.05)", padding:"6px 12px", borderRadius:10}}>💎 {tokens}</div>
          <button onClick={()=>setShowPaywall(true)} style={{padding:"6px 12px",background:"linear-gradient(135deg, #a855f7, #ec4899)",border:"none",borderRadius:10,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textTransform:"uppercase"}}>PRO</button>
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"30px 20px"}}>
          
          {/* ЧИСТЫЙ ВВОД ТЕМЫ */}
          <div style={{...S.section, borderColor:"rgba(168,85,247,0.4)", boxShadow:"0 10px 40px rgba(168,85,247,0.1)"}}>
            <label style={{...S.label, color:"#d8b4fe", fontSize:13}}>🎯 ИДЕЯ ИЛИ ТЕМА ВАШЕГО ХИТА</label>
            <textarea rows={2} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"18px",fontSize:16,color:"#fff",resize:"none",marginBottom:16}}/>
            <textarea rows={4} value={script} onChange={e=>setScript(e.target.value)} placeholder="Или вставьте готовый текст диктора..." style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:14,color:"#cbd5e1",resize:"none",marginBottom:16}}/>
            <button onClick={handleWriteScript} disabled={busy || (!topic.trim() && !script.trim())} style={{width:"100%",height:48,border:"1px dashed rgba(168,85,247,.5)",borderRadius:14,background:"rgba(168,85,247,.1)",color:"#d8b4fe",cursor:busy?"not-allowed":"pointer",fontWeight:800}}>✍️ Сгенерировать сильный текст (Opus)</button>
          </div>

          <div style={S.section}>
            <label style={S.label}>🎭 ЖАНР И СТИЛЬ</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10, marginBottom:16}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?`${p.col}22`:"rgba(0,0,0,.4)",border:`1px solid ${genre===g?p.col:"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8, transition:"all 0.2s"}}>
                  <span style={{fontSize:24,filter:genre===g?"none":"grayscale(100%) opacity(50%)"}}>{p.icon}</span>
                  <span style={{fontSize:9,color:genre===g?p.col:"rgba(255,255,255,.4)",fontWeight:800}}>{g}</span>
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {HOOKS.map(h=><button key={h} onClick={()=>setHook(h)} style={{background:hook===h?"rgba(239,68,68,.15)":"rgba(0,0,0,.4)",border:`1px solid ${hook===h?"#ef4444":"rgba(255,255,255,.05)"}`,borderRadius:20,padding:"10px 16px",fontSize:12,fontWeight:hook===h?800:500,color:hook===h?"#fca5a5":"rgba(255,255,255,.5)",cursor:"pointer"}}>{h}</button>)}
            </div>
          </div>

          {/* АККОРДЕОН НАСТРОЕК */}
          <div style={{marginBottom: 24}}>
             <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", padding:"16px 24px", borderRadius: settingsOpen ? "24px 24px 0 0" : 24, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                <span>⚙️ Технические настройки</span>
                <span>{settingsOpen ? "▲" : "▼"}</span>
             </button>
             {settingsOpen && (
               <div style={{background:"rgba(15,15,25,.4)", border:"1px solid rgba(255,255,255,.05)", borderTop:"none", borderRadius:"0 0 24px 24px", padding:24, backdropFilter:"blur(16px)"}}>
                  <label style={S.label}>📐 Формат</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>
                    {FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1,background:vidFormat===f.id?"rgba(168,85,247,.15)":"rgba(0,0,0,.4)",border:`1px solid ${vidFormat===f.id?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"10px",fontSize:12,fontWeight:vidFormat===f.id?800:500,color:vidFormat===f.id?"#d8b4fe":"rgba(255,255,255,.5)",cursor:"pointer"}}>{f.id}</button>)}
                  </div>
                  
                  <label style={S.label}>⏱ Хронометраж</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                    {DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.15)":"rgba(0,0,0,.4)",border:`1px solid ${dur===d?"#f97316":"rgba(255,255,255,.05)"}`,borderRadius:20,padding:"10px 16px",fontSize:12,fontWeight:dur===d?800:500,color:dur===d?"#fdba74":"rgba(255,255,255,.5)",cursor:"pointer"}}>{d}</button>)}
                  </div>

                  <label style={S.label}>🎨 Кино-стиль</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                    {STORYBOARD_STYLES.map(s=>(
                      <button key={s.id} onClick={()=>setStyle(s.id)} style={{background:style===s.id?`${s.col||'#a855f7'}15`:"rgba(0,0,0,.4)",border:`1px solid ${style===s.id?(s.col||'#a855f7'):"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px",cursor:"pointer",textAlign:"left"}}>
                        <div style={{fontSize:12,fontWeight:800,color:style===s.id?"#fff":"rgba(255,255,255,.7)",marginBottom:4}}>{s.icon} {s.label}</div>
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"16px 20px 24px",background:"linear-gradient(to top, rgba(5,5,10,1) 50%, transparent)",zIndex:100}}>
            <button className="gbtn" onClick={handleGenerateFullPlan} disabled={(!script.trim() && !topic.trim()) || busy}>{busy?"СИСТЕМА В РАБОТЕ...":"🚀 АКТИВИРОВАТЬ НЕЙРОСЕТЬ"}</button>
          </div>
        </div>
      )}

      {view==="loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 20px",textAlign:"center"}}>
           <div style={{width:60,height:60,border:"4px solid rgba(168,85,247,0.2)",borderTopColor:"#a855f7",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:24}} />
           <div style={{fontSize:20,fontWeight:900,color:"#fff", letterSpacing:2}}>{loadingMsg || "АНАЛИЗ..."}</div>
        </div>
      )}

      {view==="result" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"20px"}}>
          
          {/* МЕГА-СТУДИЯ ОБЛОЖЕК */}
          <div style={{...S.section, padding:0, overflow:"hidden"}}>
            <div style={{padding:"20px 24px", background:"rgba(0,0,0,0.3)", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
               <div style={{fontSize:14, fontWeight:900, color:"#d8b4fe", letterSpacing:1, textTransform:"uppercase", display:"flex", alignItems:"center", gap:10}}>🎨 Мега-Студия Обложки</div>
            </div>
            
            <div style={{padding:24}}>
              {/* ХОЛСТ */}
              <div style={{display:"flex", justifyContent:"center", marginBottom:24}}>
                <div id="thumbnail-export" style={{
                  width: 320, aspectRatio: currFormat.ratio, overflow: "hidden", position: "relative",
                  background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "#111",
                  display: "flex", flexDirection: "column"
                }}>
                  {/* Затемнение фона */}
                  <div style={{position:"absolute", inset:0, background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`, zIndex:1}} />
                  
                  {/* Блок текста (с позиционированием) */}
                  <div style={{position:"absolute", left:0, right:0, top: `${covY}%`, transform: `translateY(-${covY}%) scale(${covScale/100})`, zIndex:2, padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"}}>
                    
                    <input type="text" value={covHook} onChange={e=>setCovHook(e.target.value)} placeholder="ХУК" style={{background:"transparent", border:"none", width:"100%", textAlign:"center", fontSize:14, fontWeight:800, fontFamily:covFont, color:"#ffdd00", textTransform:"uppercase", WebkitTextStroke:"1px #000", textShadow:"2px 2px 0 #000", marginBottom:8, padding:0}} />
                    
                    <textarea rows={3} value={covTitle} onChange={e=>setCovTitle(e.target.value)} placeholder="ЗАГОЛОВОК" style={{background:"transparent", border:"none", width:"150%", marginLeft:"-25%", textAlign:"center", fontSize:32, fontWeight:900, fontFamily:covFont, textTransform:"uppercase", lineHeight:1.1, WebkitTextStroke:"1.5px #000", filter:"drop-shadow(3px 3px 0 #000) drop-shadow(0 0 20px rgba(0,0,0,0.8))", padding:0, resize:"none", overflow:"hidden", backgroundImage:covGrad.css, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}} />
                    
                    <input type="text" value={covCta} onChange={e=>setCovCta(e.target.value)} placeholder="ПРИЗЫВ" style={{background:"#ff0050", border:"none", textAlign:"center", fontSize:11, fontWeight:900, fontFamily:"sans-serif", color:"#fff", textTransform:"uppercase", letterSpacing:1, padding:"6px 12px", borderRadius:20, marginTop:12}} />

                  </div>
                </div>
              </div>

              {/* ПАНЕЛЬ ИНСТРУМЕНТОВ */}
              <div style={{background:"rgba(0,0,0,0.3)", borderRadius:16, padding:20, marginBottom:20}}>
                 <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:16}}>
                    <div>
                      <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Высота текста (Y)</label>
                      <input type="range" min="10" max="90" value={covY} onChange={e=>setCovY(e.target.value)} />
                    </div>
                    <div>
                      <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Размер текста</label>
                      <input type="range" min="50" max="150" value={covScale} onChange={e=>setCovScale(e.target.value)} />
                    </div>
                    <div style={{gridColumn:"1 / -1"}}>
                      <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Затемнение фона</label>
                      <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} />
                    </div>
                 </div>

                 <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:10, marginBottom:10}}>
                    {FONTS.map(f => <button key={f.id} onClick={()=>setCovFont(f.id)} style={{flexShrink:0, background:covFont===f.id?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${covFont===f.id?"#a855f7":"transparent"}`, color:covFont===f.id?"#fff":"#94a3b8", fontSize:11, padding:"6px 12px", borderRadius:8, fontFamily:f.id}}>{f.label}</button>)}
                 </div>
                 
                 <div style={{display:"flex", gap:8, overflowX:"auto"}}>
                    {GRADIENTS.map(g => <button key={g.id} onClick={()=>setCovGrad(g)} style={{flexShrink:0, background:covGrad.id===g.id?"rgba(255,255,255,0.1)":"transparent", border:`1px solid ${covGrad.id===g.id?"#fff":"rgba(255,255,255,0.1)"}`, color:"#fff", fontSize:11, padding:"6px 12px", borderRadius:8}}><span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:g.css,marginRight:6}}/>{g.label}</button>)}
                 </div>
              </div>

              {/* КНОПКИ ДЕЙСТВИЙ */}
              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                  📸 Фон из Veo
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                </label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:48, border:"none", borderRadius:14, background:"linear-gradient(135deg, #10b981, #059669)", color:"#fff", fontSize:12, fontWeight:900, cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>
                  {downloading ? "Рендер..." : "💾 СКАЧАТЬ"}
                </button>
              </div>
              
              <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:14, padding:14}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                  <span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ПРОМПТ ФОНА (VEO)</span>
                  <CopyBtn text={thumb?.prompt_EN || ""} label="Copy" small/>
                </div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb?.prompt_EN || "Промпт не сгенерирован"}</div>
              </div>

            </div>
          </div>

          {/* НАВИГАЦИЯ ПО РЕЗУЛЬТАТАМ */}
          <div style={{display:"flex", gap:10, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:16}}>
             <button onClick={()=>setTab("storyboard")} style={{background:"none", border:"none", color:tab==="storyboard"?"#a855f7":"#94a3b8", fontWeight:800, fontSize:13, textTransform:"uppercase", cursor:"pointer"}}>Раскадровка</button>
             <button onClick={()=>setTab("raw")} style={{background:"none", border:"none", color:tab==="raw"?"#a855f7":"#94a3b8", fontWeight:800, fontSize:13, textTransform:"uppercase", cursor:"pointer"}}>Сырой скрипт</button>
          </div>

          {/* РАСКАДРОВКА */}
          {tab === "storyboard" && (
            <div>
              {frames.map((f,i)=>{
                return (
                  <div key={i} style={{...S.section, position:"relative", overflow:"hidden"}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:16}}>
                      <span style={{fontSize:12, fontWeight:900, color:"#ef4444", display:"flex", alignItems:"center", gap:6}}><span style={{width:8,height:8,background:"#ef4444",borderRadius:"50%",animation:"blink 1.5s infinite"}}/> REC {String(i+1).padStart(2,"0")}</span>
                      <span style={{fontSize:10, color:"#cbd5e1", background:"rgba(255,255,255,0.1)", padding:"4px 8px", borderRadius:6, fontFamily:"monospace"}}>TC: {f.timecode}</span>
                    </div>
                    {f.visual && <div style={{fontSize:14, color:"#fff", marginBottom:12, lineHeight:1.5}}>👁 {f.visual}</div>}
                    {f.voice && <div style={{fontSize:14, fontStyle:"italic", color:"#a855f7", marginBottom:16, borderLeft:`3px solid #a855f7`, paddingLeft:12}}>«{f.voice}»</div>}
                    
                    {f.imgPrompt_EN && (
                      <div style={{background:"rgba(16,185,129,.05)", padding:12, borderRadius:12, marginBottom:10}}>
                        <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#34d399", fontWeight:800, letterSpacing:1}}>IMAGE PROMPT (VEO)</span><CopyBtn text={f.imgPrompt_EN} small/></div>
                        <div style={{fontSize:12, fontFamily:"monospace", color:"#6ee7b7", lineHeight:1.4}}>{f.imgPrompt_EN}</div>
                      </div>
                    )}
                    {f.vidPrompt_EN && (
                      <div style={{background:"rgba(139,92,246,.05)", padding:12, borderRadius:12}}>
                        <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#a78bfa", fontWeight:800, letterSpacing:1}}>VIDEO PROMPT (GROK)</span><CopyBtn text={f.vidPrompt_EN} small/></div>
                        <div style={{fontSize:12, fontFamily:"monospace", color:"#d8b4fe", lineHeight:1.4}}>{f.vidPrompt_EN}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* СЫРОЙ ТЕКСТ (СТРОГО КАК В ПРАВИЛАХ: Сценарий, затем пустые строки и чистые промпты) */}
          {tab === "raw" && (
            <div style={{...S.section}}>
               <div style={{display:"flex", justifyContent:"flex-end", marginBottom:10}}><CopyBtn text={result} label="Копировать всё"/></div>
               <pre style={{whiteSpace:"pre-wrap", fontFamily:"monospace", fontSize:13, color:"#cbd5e1", lineHeight:1.6}}>{result}</pre>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
