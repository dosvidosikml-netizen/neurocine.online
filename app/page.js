// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- БАЗОВЫЕ НАСТРОЙКИ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355", physics:"тени, камера из-за угла",     light:"cold forensic overhead light" },
  "ТАЙНА":         { icon:"🔍", col:"#a855f7", physics:"туман стелется",              light:"flickering volumetric light" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316", physics:"пылинки кружатся",            light:"golden hour dust beams" },
  "НАУКА":         { icon:"⚗",  col:"#06b6d4", physics:"вода растекается",            light:"neon reflections on wet surface" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444", physics:"дым клубится",                light:"strobing red emergency light" },
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e", physics:"волосы развеваются на ветру", light:"dynamic reflections in the eyes" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899", physics:"лёд трескается",              light:"flickering volumetric light" },
  "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24", physics:"тени на стене",               light:"single candle chiaroscuro shadows" },
};

const STORYBOARD_STYLES = [
  { id:"CINEMATIC",    label:"Кино-реализм",   prompt:"cinematic realism, photorealistic, deep shadows" },
  { id:"UGC_PHONE",    label:"UGC (Телефон)",  prompt:"UGC style, vertical video footage, raw authentic" },
  { id:"DARK_FANTASY", label:"Тёмное фэнтези", prompt:"dark fantasy movie style, misty eerie atmosphere" },
  { id:"FOUND_FOOTAGE",label:"Найденная плёнка",prompt:"found footage horror style, shaky handheld amateur camera" },
];

const FORMATS = [
  { id:"9:16", label:"Вертикальный (Shorts)", ratio:"9/16" },
  { id:"16:9", label:"Горизонтальный (YouTube)", ratio:"16/9" },
  { id:"1:1",  label:"Квадрат (Instagram)", ratio:"1/1" },
];

// Настройка таймкодов
const DURATION_CONFIG = {
  "15 сек": { sec:15, frames:5, pace:3 }, 
  "30–45 сек": { sec:38, frames:13, pace:3 }, 
  "До 60 сек": { sec:60, frames:20, pace:3 }, 
  "1.5 мин": { sec:90, frames:30, pace:3 }, 
  "3 мин": { sec:180, frames:60, pace:3 },
  "10-12 мин": { sec:720, frames:80, pace:9 } 
};
const DURATIONS = Object.keys(DURATION_CONFIG);
const HOOKS = ["⚡ ШОК","🔮 ТАЙНА","☠ ОПАСНОСТЬ","🌀 ПАРАДОКС","🩸 ПРОВОКАЦИЯ"];
const PLATFORMS = [{ id:"YouTube", icon:"▶" }, { id:"TikTok", icon:"♪" }, { id:"Instagram", icon:"◈" }];

// --- ПРЕСЕТЫ ОБЛОЖЕК (ПРОФЕССИОНАЛЬНЫЕ СТИЛИ) ---
const COVER_PRESETS = [
  {
    id: "netflix", label: "Netflix (Кино)",
    style: {
      container: { justifyContent: "flex-end", paddingBottom: "40px" },
      hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000" },
      title: { fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,0.9)", marginBottom: 12 },
      cta: { fontSize: 10, fontWeight: 800, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", letterSpacing: 2, opacity: 0.8, borderBottom: "1px solid #e50914", paddingBottom: 4 }
    }
  },
  {
    id: "mrbeast", label: "MrBeast (Вирал)",
    style: {
      container: { justifyContent: "center", alignItems: "center" },
      hook: { fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", textTransform: "uppercase", WebkitTextStroke: "1px #000", textShadow: "3px 3px 0 #000", transform: "rotate(-3deg)", marginBottom: 4 },
      title: { fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "2px #000", textShadow: "5px 5px 0 #000, 0 0 40px #ff00ff", transform: "rotate(-3deg)", marginBottom: 16, textAlign: "center" },
      cta: { fontSize: 13, fontWeight: 900, fontFamily: "sans-serif", color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "6px 14px", borderRadius: 8, textTransform: "uppercase", transform: "rotate(-3deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" }
    }
  },
  {
    id: "tiktok", label: "TikTok (Неон)",
    style: {
      container: { justifyContent: "flex-start", paddingTop: "60px", alignItems: "center" },
      hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12 },
      title: { fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", marginBottom: 12, textAlign: "center" },
      cta: { fontSize: 11, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 }
    }
  },
  {
    id: "documentary", label: "Документалка",
    style: {
      container: { justifyContent: "center", alignItems: "center" },
      hook: { display: "none" },
      title: { fontSize: 28, fontWeight: 800, fontFamily: "'Montserrat', sans-serif", color: "#e8dcc8", textTransform: "uppercase", lineHeight: 1.2, letterSpacing: 2, textShadow: "0 4px 15px #000", textAlign: "center", marginBottom: 16 },
      cta: { fontSize: 10, fontWeight: 700, fontFamily: "sans-serif", color: "#d4a853", textTransform: "uppercase", letterSpacing: 4 }
    }
  }
];

// --- ГЕНИАЛЬНЫЙ ПИСАТЕЛЬ (OPUS STYLE) + СТРОГИЕ ПРАВИЛА --- 
const VIRAL_SYSTEM = `### SYSTEM ROLE (STRICT JSON)
You are 'Director-X', an elite AI documentary director. OUTPUT STRICTLY IN JSON.

🚨 OPUS-STYLE WRITING:
1. NO CLICHES: Never use "погрузитесь", "добро пожаловать".
2. SUSPENSE LOOP: Hook -> Build tension -> Reveal at the end.
3. RHYTHM: Short punchy sentences. Use ellipses (...) for dramatic pauses. Show, don't tell.

🚨 PROMPT ENGINEERING RULES:
1. "imgPrompt_EN" and "vidPrompt_EN" MUST BE 100% IN ENGLISH.
2. QUALITY CORE: End every single prompt with: ", shot on Arri Alexa 65, 8k resolution, hyper-photorealistic, masterpiece, highly detailed, cinematic lighting".
3. CONTINUITY: If duration is long, use "seamless slow pan transition". If short, use "fast match cut".
4. IMAGE PROMPTS: ONLY for Veo. 
5. VIDEO PROMPTS: ONLY for Grok Super. Add [SFX: audio] at the end.
6. NO Midjourney/Leonardo mentions!

🚨 THUMBNAIL RULES (CRITICAL):
Create extreme contrast prompts.
"prompt_EN": "Extreme close up of [ONE OBJECT]. The object takes up 50% of the frame. Absolute black void background, extreme contrast, bright rim lighting."
"title": 2-4 words MAX (Curiosity gap).

JSON SCHEMA:
{
  "hooks": [ {"text": "Hook 1", "visual": "Vis 1"} ],
  "frames": [
    {
      "timecode": "0-3 сек", "camera": "Motion", "visual": "Detail", "voice": "Voiceover...",
      "imgPrompt_EN": "...", "vidPrompt_EN": "... [SFX: ...]"
    }
  ],
  "thumbnail": { "title": "...", "hook": "...", "cta": "...", "prompt_EN": "..." }
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

export default function Page() {
  // SAAS & APP STATE
  const [tokens, setTokens] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);

  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [genre, setGenre] = useState("ТАЙНА");
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

  // COVER STUDIO STATE
  const [bgImage, setBgImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [activePreset, setActivePreset] = useState("netflix");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef(null);
  useEffect(() => { try { const saved = localStorage.getItem("ds_history"); if (saved) setHistory(JSON.parse(saved)); } catch(e) {} }, []);
  useEffect(() => { scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); }, [view]);

  // Списание токенов ТОЛЬКО при полной генерации
  const checkTokens = () => { if (tokens <= 0) { setShowPaywall(true); return false; } setTokens(prev => prev - 1); return true; };

  function applyResult(rawText, fromHistory = false) {
    let cleanText = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) cleanText = cleanText.substring(startIdx);

    let data = { hooks: [], frames: [], thumbnail: null };
    let successParse = false;

    try { data = JSON.parse(cleanText); successParse = true; } catch (e) {
      const framesMatch = cleanText.match(/\{\s*"timecode"[^{]*?"vidPrompt_EN"[^{]*?\}/g);
      if (framesMatch) data.frames = framesMatch.map(f => { try { return JSON.parse(f); } catch(err) { return null; } }).filter(Boolean);
      if (!data.frames || data.frames.length === 0) { alert("Таймаут сервера. Уменьшите длину видео."); return setView("form"); }
    }
    
    setFrames(data.frames || []); setHooksList(data.hooks || []); setThumb(data.thumbnail || null);
    if (data.thumbnail) { setCovTitle(data.thumbnail.title || ""); setCovHook(data.thumbnail.hook || ""); setCovCta(data.thumbnail.cta || "УЗНАТЬ БОЛЬШЕ"); }
    
    // СТРОГОЕ ФОРМАТИРОВАНИЕ RAW: Сценарий -> Отступы -> Чистые Промпты
    let rawScript = "🔥 HOOKS:\n" + (data.hooks || []).map((h, i)=>`${i+1}. 🗣 ${h.text}\n🎬 ${h.visual}`).join("\n\n") + 
      "\n\n🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n📷 Камера: ${f.camera}\n👁 Визуал: ${f.visual}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    let rawImgPrompts = "\n\n🖼 IMAGE PROMPTS (Veo/Whisk):\n" + (data.frames || []).map(f => f.imgPrompt_EN).filter(Boolean).join("\n\n");
    let rawVidPrompts = "\n\n🎥 VIDEO PROMPTS (Grok Super):\n" + (data.frames || []).map(f => f.vidPrompt_EN).filter(Boolean).join("\n\n");

    setResult(rawScript + rawImgPrompts + rawVidPrompts);
    setBgImage(null); setTab("storyboard"); setView("result");

    if (!fromHistory && successParse) {
      const tName = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация ИИ";
      const newItem = { id: Date.now(), topic: tName, time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}), text: cleanText, format: vidFormat };
      setHistory(prev => { const next = [newItem, ...prev].slice(0, 10); localStorage.setItem("ds_history", JSON.stringify(next)); return next; });
    }
  }

  // БЕСПЛАТНАЯ КНОПКА (Черновик текста)
  async function handleWriteScript() {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true); setLoadingMsg("Пишу мощный текст (Opus Style)..."); setView("loading");
    try {
      const sysTxt = `You are 'Director-X'. Напиши ТОЛЬКО текст диктора. Рваный ритм. Многоточия. Документальный мрачный стиль.`;
      const text = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши чистый текст диктора.`, 3000, sysTxt);
      setScript(text.trim());
    } catch(e) { alert("Ошибка: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  // ПЛАТНАЯ КНОПКА (Списание 💎)
  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) return alert("Введите тему или готовый сценарий!");
    if (!checkTokens()) return;
    setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        setLoadingMsg("Генерируем текст...");
        currentScript = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши текст диктора.`, 3000, `You are 'Director-X'. Напиши ТОЛЬКО текст диктора.`);
        setScript(currentScript.trim());
      }
      setLoadingMsg("Создаем раскадровку и промпты (8K Quality)...");
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
      const preset = GENRE_PRESETS[genre];
      const sty = STORYBOARD_STYLES.find(s=>s.id===style) || STORYBOARD_STYLES[0];
      
      const req = `ВЫДАЙ ОТВЕТ СТРОГО В JSON! РОВНО ${durCfg.frames} КАДРОВ (Темп: ${durCfg.pace} сек/кадр)! ПРОМПТЫ НА АНГЛИЙСКОМ С УСИЛИТЕЛЕМ КАЧЕСТВА!`;
      const ctx = `ТЕМА: ${topic}\nФОРМАТ ВИДЕО: ${currFormat.ratio}\nЖАНР: ${genre} | СТИЛЬ: ${sty.prompt}\nДЛИТЕЛЬНОСТЬ: ${dur}. ТИП HOOK: ${hook}`;
      
      const text = await callAPI(`${ctx}\n\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 8000, VIRAL_SYSTEM);
      applyResult(text, false);
    } catch(e) { alert("Ошибка: " + e.message); setView("form"); } finally { setBusy(false); setLoadingMsg(""); }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (ev) => setBgImage(ev.target.result); reader.readAsDataURL(file);
  }

  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export"); if (!el) return;
    setDownloading(true);
    const doCapture = () => {
      window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
        const link = document.createElement('a'); link.download = `DocuCover_${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click(); setDownloading(false);
      }).catch(() => { setDownloading(false); alert("Ошибка при рендере обложки"); });
    };
    if (!window.html2canvas) {
      const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = doCapture; document.body.appendChild(script);
    } else doCapture();
  }

  const S = {
    root: { minHeight:"100vh", backgroundColor:"#05050a", color:"#e2e8f0", fontFamily:"'SF Pro Display', -apple-system, sans-serif", paddingBottom:120, overflowY:"auto", position:"relative", zIndex:1 },
    // Анимированная Нейро-Матрица и Glassmorphism
    matrixBg: { position:"fixed", inset:0, zIndex:-2, background: "linear-gradient(45deg, #05050a, #1a0b2e, #0a0a1a, #0f051a)", backgroundSize: "400% 400%", animation: "gradientBG 15s ease infinite" },
    gridBg: { position:"fixed", inset:0, zIndex:-1, opacity:0.2, backgroundImage:"radial-gradient(circle at 2px 2px, rgba(168,85,247,0.3) 1px, transparent 0)", backgroundSize:"30px 30px" },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.5)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:24, background:"rgba(15,15,25,.3)", border:"1px solid rgba(255,255,255,.08)", borderRadius:24, padding:24, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", boxShadow:"0 10px 40px rgba(0,0,0,0.5)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
  const activeStyle = COVER_PRESETS.find(p => p.id === activePreset).style;

  return (
    <div ref={scrollRef} style={S.root}>
      <div style={S.matrixBg} />
      <div style={S.gridBg} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Montserrat:wght@800;900&display=swap');
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

      {/* SAAS PAYWALL */}
      {showPaywall && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(20px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
           <div style={{background:"#0a0a12", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:40, maxWidth:400, textAlign:"center", boxShadow:"0 20px 80px rgba(168,85,247,.3)"}}>
              <div style={{fontSize:48, marginBottom:20}}>🚀</div>
              <h2 style={{fontSize:24, fontWeight:900, marginBottom:10, color:"#fff"}}>Лимит исчерпан</h2>
              <p style={{color:"#94a3b8", fontSize:14, lineHeight:1.6, marginBottom:30}}>Вы использовали все генерации полного цикла. Перейдите на PRO, чтобы получить безлимит к нейро-режиссеру.</p>
              <button style={{width:"100%", padding:"16px", background:"#fff", color:"#000", fontWeight:900, borderRadius:14, border:"none", cursor:"pointer", marginBottom:12}}>Оформить PRO ($15/мес)</button>
              <button onClick={()=>setShowPaywall(false)} style={{background:"none", border:"none", color:"#64748b", fontSize:12, cursor:"pointer"}}>Позже</button>
           </div>
        </div>
      )}

      {/* АРХИВ */}
      {showHistory && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(16px)"}}>
          <div style={{background:"#0a0a12",border:"1px solid rgba(139,92,246,.4)",borderRadius:24,width:"90%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.8)"}}>
             <div style={{padding:24,borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <span style={{fontWeight:800,color:"#fff",letterSpacing:1,textTransform:"uppercase",fontSize:14}}>🗄 АРХИВ ПРОЕКТОВ</span>
               <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",fontSize:24,cursor:"pointer"}}>✕</button>
             </div>
             <div style={{padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
               {history.length===0 ? <div style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:"40px 0"}}>Архив пуст</div> :
                 history.map((h) => (
                   <div key={h.id} style={{background:"rgba(255,255,255,.03)",borderRadius:16,padding:16,cursor:"pointer",border:"1px solid rgba(255,255,255,.05)"}} onClick={() => { setVidFormat(h.format || "9:16"); applyResult(h.text, true); setShowHistory(false); }}>
                     <div style={{fontSize:10,color:"#8b5cf6",fontWeight:700,marginBottom:6,fontFamily:"monospace"}}>{h.time}</div>
                     <div style={{fontSize:14,fontWeight:600,color:"#fff",lineHeight:1.4}}>{h.topic}</div>
                   </div>
                 ))
               }
             </div>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Починенная кнопка возврата */}
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          {/* Починенные кнопки Архива и Редактора */}
          {view==="form" && result && <button onClick={()=>setView("result")} style={{background:"none",border:"none",color:"#d8b4fe",fontSize:12,fontWeight:800,cursor:"pointer",textTransform:"uppercase"}}>👁 Результат</button>}
          {view==="form" && !result && <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#cbd5e1",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>🗄 Архив</button>}
          
          <div style={{fontSize:11, fontWeight:800, color:tokens>0?"#34d399":"#ef4444", background:"rgba(255,255,255,0.05)", padding:"6px 12px", borderRadius:10}}>💎 {tokens}</div>
          <button onClick={()=>setShowPaywall(true)} style={{padding:"6px 12px",background:"linear-gradient(135deg, #a855f7, #ec4899)",border:"none",borderRadius:10,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>PRO</button>
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"30px 20px"}}>
          
          <div style={{...S.section, borderColor:"rgba(168,85,247,0.4)", boxShadow:"0 10px 40px rgba(168,85,247,0.1)"}}>
            <label style={{...S.label, color:"#d8b4fe", fontSize:13}}>🎯 ИДЕЯ ИЛИ ТЕМА ВАШЕГО ХИТА</label>
            <textarea rows={2} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"18px",fontSize:16,color:"#fff",resize:"none",marginBottom:16}}/>
            <textarea rows={4} value={script} onChange={e=>setScript(e.target.value)} placeholder="Или вставьте готовый текст диктора..." style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:14,color:"#cbd5e1",resize:"none",marginBottom:16}}/>
            
            {/* БЕСПЛАТНАЯ КНОПКА ЧЕРНОВИКА */}
            <button onClick={handleWriteScript} disabled={busy || (!topic.trim() && !script.trim())} style={{width:"100%",height:48,border:"1px dashed rgba(168,85,247,.5)",borderRadius:14,background:"rgba(168,85,247,.05)",color:"#d8b4fe",cursor:busy?"not-allowed":"pointer",fontWeight:800}}>✍️ Набросать черновик (Бесплатно)</button>
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

          {/* АККОРДЕОН НАСТРОЕК (Всё скрыто для чистоты) */}
          <div style={{marginBottom: 24}}>
             <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", padding:"16px 24px", borderRadius: settingsOpen ? "24px 24px 0 0" : 24, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                <span>⚙️ Технические настройки</span>
                <span>{settingsOpen ? "▲" : "▼"}</span>
             </button>
             {settingsOpen && (
               <div style={{background:"rgba(15,15,25,.3)", border:"1px solid rgba(255,255,255,.05)", borderTop:"none", borderRadius:"0 0 24px 24px", padding:24, backdropFilter:"blur(20px)"}}>
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
                      <button key={s.id} onClick={()=>setStyle(s.id)} style={{background:style===s.id?`rgba(168,85,247,.15)`:"rgba(0,0,0,.4)",border:`1px solid ${style===s.id?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px",cursor:"pointer",textAlign:"left"}}>
                        <div style={{fontSize:12,fontWeight:800,color:style===s.id?"#fff":"rgba(255,255,255,.7)",marginBottom:4}}>{s.label}</div>
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"16px 20px 24px",background:"linear-gradient(to top, rgba(5,5,10,1) 50%, transparent)",zIndex:100}}>
            {/* ГЛАВНАЯ КНОПКА (Списывает 💎) */}
            <button className="gbtn" onClick={handleGenerateFullPlan} disabled={(!script.trim() && !topic.trim()) || busy}>{busy?"СИСТЕМА В РАБОТЕ...":"🚀 АКТИВИРОВАТЬ НЕЙРОСЕТЬ (💎 1)"}</button>
          </div>
        </div>
      )}

      {view==="loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 20px",textAlign:"center"}}>
           <div style={{width:60,height:60,border:"4px solid rgba(168,85,247,0.2)",borderTopColor:"#a855f7",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:24}} />
           <div style={{fontSize:20,fontWeight:900,color:"#fff", letterSpacing:2}}>{loadingMsg}</div>
        </div>
      )}

      {view==="result" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"20px"}}>
          
          {/* МЕГА-СТУДИЯ ОБЛОЖЕК С ПРЕСЕТАМИ */}
          <div style={{...S.section, padding:0, overflow:"hidden"}}>
            <div style={{padding:"20px 24px", background:"rgba(0,0,0,0.3)", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
               <div style={{fontSize:14, fontWeight:900, color:"#d8b4fe", letterSpacing:1, textTransform:"uppercase", display:"flex", alignItems:"center", gap:10}}>🎨 Студия Обложки</div>
            </div>
            
            <div style={{padding:24}}>
              {/* ПРОФЕССИОНАЛЬНЫЕ КНОПКИ СТИЛЕЙ */}
              <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:16, marginBottom:10}}>
                {COVER_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${activePreset===p.id?"#a855f7":"rgba(255,255,255,.1)"}`, background:activePreset===p.id?"rgba(168,85,247,0.2)":"rgba(0,0,0,.3)", color:activePreset===p.id?"#fff":"rgba(255,255,255,.5)", fontSize:11, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* ХОЛСТ С АВТО-ПРИМЕНЕНИЕМ СТИЛЕЙ */}
              <div style={{display:"flex", justifyContent:"center", marginBottom:24}}>
                <div id="thumbnail-export" style={{
                  width: 320, aspectRatio: currFormat.ratio, overflow: "hidden", position: "relative",
                  background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "#111",
                  display: "flex", flexDirection: "column", padding: "20px",
                  ...activeStyle.container
                }}>
                  {/* Затемнение фона */}
                  <div style={{position:"absolute", inset:0, background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`, zIndex:1}} />
                  
                  {/* Тексты с подтянутыми стилями пресета */}
                  <div style={{position:"relative", zIndex:2, width:"100%", display: "flex", flexDirection: "column", alignItems: activeStyle.container.alignItems || "center", textAlign: activeStyle.title.textAlign || "left"}}>
                    <div style={activeStyle.hook}>{covHook || "ХУК"}</div>
                    <div style={{...activeStyle.title, wordWrap:"break-word"}}>{covTitle || "ЗАГОЛОВОК"}</div>
                    <div style={activeStyle.cta}>{covCta || "УЗНАТЬ БОЛЬШЕ"}</div>
                  </div>
                </div>
              </div>

              {/* РУЧНОЕ РЕДАКТИРОВАНИЕ ТЕКСТА И ФОНА */}
              <div style={{background:"rgba(0,0,0,0.3)", borderRadius:16, padding:20, marginBottom:20}}>
                 <input type="text" value={covHook} onChange={e=>setCovHook(e.target.value)} placeholder="Короткий хук сверху" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:10, color:"#fff", marginBottom:10, fontSize:13}} />
                 <input type="text" value={covTitle} onChange={e=>setCovTitle(e.target.value)} placeholder="Главный заголовок" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:10, color:"#fff", marginBottom:10, fontSize:13}} />
                 
                 <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginTop:10, marginBottom:8, display:"block"}}>Затемнение картинки (для читаемости)</label>
                 <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} />
              </div>

              {/* КНОПКИ ЗАГРУЗКИ / СКАЧИВАНИЯ */}
              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                  📸 Картинка из Veo
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                </label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:48, border:"none", borderRadius:14, background:"linear-gradient(135deg, #10b981, #059669)", color:"#fff", fontSize:12, fontWeight:900, cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>
                  {downloading ? "Рендер..." : "💾 СКАЧАТЬ"}
                </button>
              </div>
              
              <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:14, padding:14}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                  <span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ПРОМПТ 50% / ЧЕРНЫЙ ФОН (VEO)</span>
                  <CopyBtn text={thumb?.prompt_EN || ""} label="Copy" small/>
                </div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb?.prompt_EN || "Промпт не сгенерирован"}</div>
              </div>

            </div>
          </div>

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

          {/* ЧИСТЫЙ СПИСОК ПРОМПТОВ ДЛЯ КОПИРОВАНИЯ */}
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
