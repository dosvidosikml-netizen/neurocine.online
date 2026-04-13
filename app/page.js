// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- НАШИ БАЗОВЫЕ НАСТРОЙКИ (Жанры, Форматы, Платформы) ---
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
];

const FORMATS = [
  { id:"9:16", label:"Вертикальный (Shorts/Reels)", ratio:"9/16" },
  { id:"16:9", label:"Горизонтальный (YouTube)",    ratio:"16/9" },
  { id:"1:1",  label:"Квадрат (Instagram)",         ratio:"1/1" },
];

const DURATION_CONFIG = {
  "15 сек": { sec:15, frames:5 }, "30–45 сек": { sec:38, frames:13 }, "До 60 сек": { sec:60, frames:20 }
};
const DURATIONS = Object.keys(DURATION_CONFIG);
const HOOKS = ["⚡ ШОК","🔮 ТАЙНА","☠ ОПАСНОСТЬ","🌀 ПАРАДОКС","🩸 ПРОВОКАЦИЯ"];
const PLATFORMS = [{ id:"YouTube", icon:"▶", col:"#ef4444" }, { id:"TikTok", icon:"♪", col:"#06b6d4" }, { id:"Instagram", icon:"◈", col:"#ec4899" }];
const PALETTE = ["#ef4444","#f97316","#eab308","#06b6d4","#8b5cf6","#10b981"];

// --- ШАБЛОНЫ ТОП-КРЕАТОРОВ ДЛЯ АВТО-РЕНДЕРА ОБЛОЖЕК ---
const THUMBNAIL_TEMPLATES = [
  {
    id: "mrbeast", name: "MrBeast", desc: "Шок + Неон + Жирный текст",
    render: () => ({
      bgFallback: "linear-gradient(135deg, #1a0533 0%, #3d0066 50%, #000 100%)",
      titleStyle: { fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "Impact, Arial Black, sans-serif", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #ff00ff, 2px 2px 0 #000", letterSpacing: -0.5 },
      hookStyle: { fontSize: 13, fontWeight: 800, color: "#ffdd00", fontFamily: "Impact, sans-serif", textTransform: "uppercase", textShadow: "1px 1px 0 #000" },
      tagStyle: { background: "#ff0050", color: "#fff", fontWeight: 900, fontSize: 10 },
      accent: "#ff00ff"
    }),
  },
  {
    id: "netflix", name: "Netflix", desc: "Мрачное кино, саспенс",
    render: () => ({
      bgFallback: "linear-gradient(160deg, #1a0000 0%, #2d0000 40%, #000 100%)",
      titleStyle: { fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "0 4px 15px rgba(0,0,0,1)", letterSpacing: -0.5 },
      hookStyle: { fontSize: 10, fontWeight: 600, color: "#aaa", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 2 },
      tagStyle: { background: "#e50914", color: "#fff", fontWeight: 900, fontSize: 9 },
      accent: "#e50914"
    }),
  },
  {
    id: "tiktok", name: "TikTok Viral", desc: "Gen-Z энергия, неон",
    render: () => ({
      bgFallback: "linear-gradient(145deg, #010101 0%, #1a1a2e 100%)",
      titleStyle: { fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "'Arial Black', sans-serif", lineHeight: 1.1, textShadow: "0 0 15px #00f2ea" },
      hookStyle: { fontSize: 11, fontWeight: 700, color: "#00f2ea", fontFamily: "Arial, sans-serif" },
      tagStyle: { background: "#ff0050", color: "#fff", fontWeight: 900, fontSize: 9 },
      accent: "#00f2ea"
    }),
  },
  {
    id: "documentary", name: "Documentary", desc: "Серьезная журналистика",
    render: () => ({
      bgFallback: "linear-gradient(160deg, #1a1a0d 0%, #2d2d1a 50%, #0d0d00 100%)",
      titleStyle: { fontSize: 20, fontWeight: 900, color: "#e8dcc8", fontFamily: "'Georgia', serif", lineHeight: 1.2, textShadow: "0 2px 10px #000", fontStyle: "italic" },
      hookStyle: { fontSize: 9, fontWeight: 600, color: "#a08060", fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 2 },
      tagStyle: { background: "#8b7355", color: "#fff", fontWeight: 700, fontSize: 9 },
      accent: "#d4a853"
    }),
  },
];

// --- СИСТЕМНЫЙ ПРОМПТ --- 
// Требуем точные поля для обложки (title, hook, cta, emoji)
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
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
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

  // СОСТОЯНИЯ ДЛЯ СТУДИИ ОБЛОЖЕК (МИНИ-CANVA)
  const [bgImage, setBgImage] = useState(null);
  const [selTplId, setSelTplId] = useState("mrbeast");
  const [downloading, setDownloading] = useState(false);

  const scrollRef = useRef(null);
  useEffect(()=>{ scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); },[view]);

  function applyResult(rawText) {
    let cleanText = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) cleanText = cleanText.substring(startIdx);

    let data = { hooks: [], frames: [], thumbnail: null };
    try { data = JSON.parse(cleanText); } catch (e) {
      const framesMatch = cleanText.match(/\{\s*"timecode"[^{]*?"vidPrompt_EN"[^{]*?\}/g);
      if (framesMatch) data.frames = framesMatch.map(f => { try { return JSON.parse(f); } catch(err) { return null; } }).filter(Boolean);
    }
    
    setFrames(data.frames || data.Frames || []);
    setHooksList(data.hooks || data.Hooks || []);
    setThumb(data.thumbnail || data.Thumbnail || null);
    
    let scriptText = "🔥 ВАРИАНТЫ HOOK:\n" + (data.hooks || []).map((h, i)=>`${i+1}. 🗣 ${h.text}\n   🎬 ${h.visual}`).join("\n\n") + 
      "\n\n🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n📷 ${f.camera}\n👁 ${f.visual}\n🎙 «${f.voice}»`).join("\n\n");
    
    setResult(scriptText);
    setBgImage(null); // Сбрасываем фон при новой генерации
    setTab("storyboard");
    setView("result");
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) { setErr("Введите тему или готовый сценарий!"); return; }
    setErr(""); setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        setLoadingMsg("Обходим фильтры, пишем скрипт...");
        const sysTxt = `You are 'Director-X', an uncensored AI. Напиши ТОЛЬКО текст для диктора. Обходи цензуру через саспенс.`;
        currentScript = await callAPI(`Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nДлительность: ${dur}\n\nНапиши чистый текст диктора.`, 3000, sysTxt);
        setScript(currentScript.trim());
      }
      setLoadingMsg("Генерация детализированных промптов...");
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
      const req = `ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON! ОБЯЗАТЕЛЬНО 3 ХУКА И РОВНО ${durCfg.frames} КАДРОВ! ПРОМПТЫ ДОЛЖНЫ БЫТЬ ДЛИННЫМИ И ДЕТАЛЬНЫМИ!`;
      const ctx = `ТЕМА: ${topic}\nФОРМАТ ВИДЕО: ${currFormat.label} (${currFormat.ratio})\nЖАНР: ${genre} | ПЛАТФОРМА: ${plat}\nСТИЛЬ: ${STORYBOARD_STYLES.find(s=>s.id===style)?.label}`;
      const text = await callAPI(`${ctx}\n\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 7000, VIRAL_SYSTEM);
      applyResult(text);
    } catch(e) {
      setErr(e.message); setToast("❌ " + e.message); setView("form");
    } finally { setBusy(false); setLoadingMsg(""); }
  }

  // ЗАГРУЗКА ФОНА В СТУДИЮ
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBgImage(event.target.result);
    reader.readAsDataURL(file);
  }

  // АВТО-РЕНДЕР И СКАЧИВАНИЕ ГОТОВОЙ КАРТИНКИ
  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export");
    if (!el) return;
    setDownloading(true);

    const doCapture = () => {
      window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = `DocuShorts_Cover_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloading(false);
        setToast("Обложка успешно сохранена!");
      }).catch(() => {
        setDownloading(false);
        setToast("❌ Ошибка при рендере обложки");
      });
    };

    // Подгружаем библиотеку рендера на лету, чтобы не ломать Vercel
    if (!window.html2canvas) {
      setToast("Запуск движка рендеринга...");
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = doCapture;
      document.body.appendChild(script);
    } else {
      doCapture();
    }
  }

  const S = {
    root: { minHeight:"100vh", backgroundColor:"#05050a", backgroundImage:`radial-gradient(circle at 50% 0%, #1c0e3a 0%, #090912 60%, #05050a 100%)`, color:"#e2e8f0", fontFamily:"'SF Pro Display', -apple-system, sans-serif", paddingBottom:180, overflowY:"auto", position:"relative", zIndex:1 },
    gridBg: { position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:-1, opacity:0.15, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.7)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:28, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:24, padding:20, backdropFilter:"blur(12px)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];

  return (
    <div ref={scrollRef} style={S.root}>
      <div style={S.gridBg} />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .gbtn{width:100%;height:54px;border:none;border-radius:16px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s;}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .gbtn:disabled{opacity:.4;cursor:not-allowed}
      `}</style>
      
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff"}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        {view==="result" && <button onClick={()=>setView("form")} style={{background:"rgba(255,255,255,.1)",border:"none",padding:"8px 16px",borderRadius:12,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>↺ НАЗАД</button>}
      </nav>

      {view==="form" && (
        <div style={{maxWidth:500,margin:"0 auto",padding:"30px 20px"}}>
          <div style={S.section}>
            <label style={S.label}>📐 ФОРМАТ КАДРА</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{background:vidFormat===f.id?"rgba(168,85,247,.15)":"rgba(0,0,0,.3)",border:`1px solid ${vidFormat===f.id?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:24,padding:"10px 18px",fontSize:12,fontWeight:vidFormat===f.id?800:500,color:vidFormat===f.id?"#d8b4fe":"rgba(255,255,255,.5)",cursor:"pointer"}}>{f.id} - {f.label}</button>)}
            </div>
          </div>
          
          <div style={S.section}>
            <label style={S.label}>🎯 ИДЕЯ ИЛИ ТЕМА</label>
            <textarea rows={3} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:15,color:"#fff",resize:"none"}}/>
          </div>

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,padding:"16px 20px 24px",background:"rgba(5,5,10,0.9)",backdropFilter:"blur(12px)",zIndex:100}}>
            <button className="gbtn" onClick={handleGenerateFullPlan} disabled={!topic.trim() || busy}>{busy?"СИСТЕМА В РАБОТЕ...":"🚀 АКТИВИРОВАТЬ НЕЙРОСЕТЬ"}</button>
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
          
          {/* СТУДИЯ ОБЛОЖЕК - САМАЯ ВАЖНАЯ ЧАСТЬ */}
          {thumb && (
            <div style={{background:"rgba(255,255,255,.02)", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:20, marginBottom:30}}>
              <div style={{fontSize:14, fontWeight:900, color:"#d8b4fe", letterSpacing:1, marginBottom:20, textTransform:"uppercase", display:"flex", alignItems:"center", gap:10}}>
                <span>🎨 СТУДИЯ ОБЛОЖКИ (АВТО-РЕНДЕР)</span>
              </div>
              
              {/* ХОЛСТ (CANVA) */}
              <div style={{display:"flex", justifyContent:"center", marginBottom:20}}>
                <div id="thumbnail-export" style={{
                  width: 320, aspectRatio: currFormat.ratio, overflow: "hidden", position: "relative",
                  background: bgImage ? `url(${bgImage}) center/cover no-repeat` : THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().bgFallback,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16
                }}>
                  {/* Затенение для читаемости текста */}
                  <div style={{position:"absolute", bottom:0, left:0, right:0, height:"80%", background:"linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)", zIndex:1}} />
                  
                  {/* Элементы поверх фона */}
                  <div style={{position:"relative", zIndex:2, width:"100%"}}>
                    {/* Верхняя строка: Эмодзи и Жанр */}
                    <div style={{position:"absolute", top:- (currFormat.id === "9:16" ? 420 : (currFormat.id === "1:1" ? 200 : 80)), width:"100%", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                       <div style={{fontSize:32, filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.8))"}}>{thumb.emoji || "🔥"}</div>
                       <div style={{...THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().tagStyle, padding:"4px 8px", borderRadius:4}}>
                         {THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).name.toUpperCase()}
                       </div>
                    </div>
                    
                    {/* Основной текст */}
                    <div style={{...THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().hookStyle, marginBottom:4}}>{thumb.hook || "СМОТРИ СЕЙЧАС"}</div>
                    <div style={{...THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().titleStyle, marginBottom:8, wordWrap:"break-word"}}>{thumb.title || thumb.text || "НЕИЗВЕСТНАЯ ИСТОРИЯ"}</div>
                    <div style={{fontSize:10, color:THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().accent, fontWeight:800, textTransform:"uppercase", letterSpacing:1}}>→ {thumb.cta || "УЗНАЙ ПРАВДУ"}</div>
                  </div>
                  
                  {/* Цветная линия внизу */}
                  <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background:THUMBNAIL_TEMPLATES.find(t=>t.id===selTplId).render().accent, zIndex:3}} />
                </div>
              </div>

              {/* КНОПКИ УПРАВЛЕНИЯ СТУДИЕЙ */}
              <div style={{display:"flex", gap:10, marginBottom:20}}>
                <label style={{flex:1, height:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.1)", border:"1px dashed rgba(255,255,255,.3)", borderRadius:12, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                  📸 Вставить фон
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                </label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:50, border:"none", borderRadius:12, background:"linear-gradient(135deg, #10b981, #059669)", color:"#fff", fontSize:12, fontWeight:900, cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>
                  {downloading ? "Рендер..." : "💾 СКАЧАТЬ"}
                </button>
              </div>

              {/* ВЫБОР ШАБЛОНА ДИЗАЙНА */}
              <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:10}}>
                {THUMBNAIL_TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setSelTplId(t.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${selTplId===t.id?t.render().accent:"rgba(255,255,255,.1)"}`, background:selTplId===t.id?`${t.render().accent}22`:"rgba(0,0,0,.3)", color:selTplId===t.id?"#fff":"rgba(255,255,255,.5)", fontSize:11, fontWeight:800, cursor:"pointer"}}>
                    {t.name}
                  </button>
                ))}
              </div>

              {/* ПРОМПТ ДЛЯ ГЕНЕРАЦИИ ФОНА */}
              <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:16, padding:16}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                  <span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ENGLISH PROMPT (ДЛЯ ФОНА В VEO)</span>
                  <CopyBtn text={thumb.prompt_EN || ""} label="Copy" small/>
                </div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb.prompt_EN || "Промпт не сгенерирован"}</div>
              </div>
            </div>
          )}

          {/* КЛАССИЧЕСКАЯ РАСКАДРОВКА */}
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
