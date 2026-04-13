// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- ЖИВОЙ ФОН НЕЙРОСЕТИ (CANVAS ENGINE) ---
const NeuralBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8
      });
    }

    const render = () => {
      ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168, 85, 247, 0.8)"; ctx.strokeStyle = "rgba(168, 85, 247, 0.25)"; ctx.lineWidth = 1;
      
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animationFrameId); };
  }, []);
  
  return <canvas ref={canvasRef} style={{position:"fixed", top:0, left:0, zIndex:-2, width:"100vw", height:"100vh"}} />;
};

// --- НАСТРОЙКИ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355" }, "ТАЙНА":         { icon:"🔍", col:"#a855f7" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316" }, "НАУКА":         { icon:"⚗",  col:"#06b6d4" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444" }, "ПРИРОДА":       { icon:"🌿", col:"#22c55e" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899" }, "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24" },
};

const FORMATS = [
  { id:"9:16", label:"Вертикальный", ratio:"9/16" }, { id:"16:9", label:"Горизонтальный", ratio:"16/9" }, { id:"1:1", label:"Квадрат", ratio:"1/1" }
];

const VISUAL_ENGINES = {
  "CINEMATIC": { label: "Кино-реализм", prompt: "cinematic realism, photorealistic, deep shadows, 8k, Arri Alexa 65" },
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge, dirty vintage film effect, scratches, bleak atmosphere, heavy vignette, 8k, Arri Alexa 65" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm soft lighting, 8k" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "x-ray exploded view, detailed engineering diagram, glowing internal parts, technical cross-section render, 8k" }
};

const DURATION_CONFIG = {
  "15 сек": { frames: 5 }, "30–45 сек": { frames: 13 }, 
  "До 60 сек": { frames: 20 }, "1.5 мин": { frames: 30 }, 
  "3 мин": { frames: 60 }, "10-12 мин": { frames: 80 } 
};
const DURATIONS = Object.keys(DURATION_CONFIG);

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,0.9)", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", letterSpacing: 2, borderBottom: "1px solid #e50914", marginTop: 10 } } },
  { id: "mrbeast", label: "MrBeast", style: { container: { alignItems: "center" }, hook: { fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", textTransform: "uppercase", WebkitTextStroke: "1px #000", transform: "rotate(-2deg)" }, title: { fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "2px #000", textShadow: "5px 5px 0 #000, 0 0 40px #ff00ff", transform: "rotate(-3deg)", textAlign: "center" }, cta: { fontSize: 13, fontWeight: 900, fontFamily: "sans-serif", color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "6px 14px", transform: "rotate(-1deg)" } } },
  { id: "tiktok", label: "TikTok", style: { container: { alignItems: "center" }, hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12 }, title: { fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", textAlign: "center" }, cta: { fontSize: 11, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20 } } },
  { id: "truecrime", label: "True Crime", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#000", background: "#ffdd00", padding: "4px 8px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, background: "#000", padding: "4px 12px", borderLeft: "4px solid #ffdd00", textAlign: "left" }, cta: { fontSize: 11, fontWeight: 800, color: "#888", marginTop: 10 } } },
  { id: "horror", label: "Ужасы", style: { container: { alignItems: "center" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#dc2626", textTransform: "uppercase", letterSpacing: 6, marginBottom: 8, textShadow: "0 0 10px #dc2626" }, title: { fontSize: 36, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 5px 20px #000, 0 0 15px #dc2626", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", opacity: 0.5, letterSpacing: 2 } } },
  { id: "scifi", label: "Sci-Fi", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#34d399", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }, title: { fontSize: 32, fontWeight: 900, fontFamily: "monospace", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 10px #34d399, -2px 0 0 #0ea5e9", textAlign: "center" }, cta: { fontSize: 10, border: "1px solid #0ea5e9", color: "#0ea5e9", padding: "4px 8px" } } },
  { id: "news", label: "News", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 11, fontWeight: 900, background: "#ef4444", color: "#fff", padding: "4px 10px", textTransform: "uppercase" }, title: { fontSize: 30, fontWeight: 900, background: "#fff", color: "#000", padding: "5px 10px", textTransform: "uppercase" }, cta: { display: "none" } } },
  { id: "documentary", label: "Документалка", style: { container: { alignItems: "center" }, hook: { display: "none" }, title: { fontSize: 28, fontWeight: 800, fontFamily: "'Montserrat', sans-serif", color: "#e8dcc8", textTransform: "uppercase", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 700, color: "#d4a853", letterSpacing: 4 } } }
];

const VIRAL_SYSTEM = `### SYSTEM ROLE (STRICT JSON)
You are 'Director-X'. OUTPUT STRICTLY IN JSON.

🚨 RULES:
1. PACING: Strictly 3 seconds per scene!
2. GLOBAL ANCHOR: Define characters and location in "global_anchor_EN" for consistency.
3. QUALITY: ALWAYS append ", shot on Arri Alexa 65, 8k resolution, photorealistic, masterpiece, cinematic lighting" to every image and video prompt.
4. PROMPTS IN ENGLISH ONLY: Even if target language is Russian, "global_anchor_EN", "imgPrompt_EN", "vidPrompt_EN" and "music_EN" MUST be in ENGLISH. Translate everything (actions, sounds, camera) to English.
5. NO Midjourney/Leonardo. Use Veo or Whisk for Image, Grok Super for Video.
6. AUDIO: "music_EN" must be instrumental Suno prompt, no vocals.

JSON SCHEMA:
{
  "global_anchor_EN": "...",
  "retention": { "score": 95, "feedback": "..." },
  "frames": [ { "timecode": "0-3 сек", "camera": "Motion", "visual": "Detail", "voice": "Voiceover...", "imgPrompt_EN": "...", "vidPrompt_EN": "... [SFX: ...]" } ],
  "b_rolls": [ "..." ],
  "thumbnail": { "title": "...", "hook": "...", "cta": "...", "prompt_EN": "..." },
  "music_EN": "...",
  "seo": { "titles": ["T1", "T2", "T3"], "desc": "...", "tags": ["#tag1", "#tag2"] }
}`;

async function callAPI(content, maxTokens = 8000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }) });
    const textRes = await res.text();
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
    const data = JSON.parse(textRes);
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
  const [tokens, setTokens] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);

  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [genre, setGenre] = useState("ТАЙНА");
  const [dur, setDur] = useState("До 60 сек");
  const [vidFormat, setVidFormat] = useState("9:16");
  const [engine, setEngine] = useState("CINEMATIC");
  const [lang, setLang] = useState("RU"); 
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ttsData, setTtsData] = useState("");

  const [view, setView] = useState("form");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [tab, setTab] = useState("storyboard");
  
  const [frames, setFrames] = useState([]);
  const [bRolls, setBRolls] = useState([]);
  const [retention, setRetention] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [music, setMusic] = useState("");
  const [seo, setSeo] = useState(null);
  const [rawPrompts, setRawPrompts] = useState("");
  const [busy, setBusy] = useState(false);

  const [bgImage, setBgImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [covX, setCovX] = useState(50);
  const [covY, setCovY] = useState(50);
  const [activePreset, setActivePreset] = useState("netflix");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef(null);
  useEffect(() => { 
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ds_history"); if (saved) setHistory(JSON.parse(saved)); 
    }
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); }, [view]);

  const checkTokens = () => { if (tokens <= 0) { setShowPaywall(true); return false; } setTokens(prev => prev - 1); return true; };

  const deleteFromHistory = (id) => {
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem("ds_history", JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    if(confirm("Очистить весь архив?")) {
      setHistory([]); localStorage.removeItem("ds_history");
    }
  };

  function applyResult(rawText, fromHistory = false) {
    let cleanText = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) cleanText = cleanText.substring(startIdx);

    let data = { frames: [], b_rolls: [], thumbnail: null, seo: null, music_EN: "", retention: null, global_anchor_EN: "" };
    try { data = JSON.parse(cleanText); } catch (e) {
      alert("Таймаут. Попробуйте уменьшить длительность."); return setView("form");
    }
    
    setFrames(data.frames || []); 
    setBRolls(data.b_rolls || []);
    setRetention(data.retention || null);
    setThumb(data.thumbnail || null); 
    setMusic(data.music_EN || ""); 
    setSeo(data.seo || null);
    
    if (data.thumbnail) { setCovTitle(data.thumbnail.title || ""); setCovHook(data.thumbnail.hook || ""); setCovCta(data.thumbnail.cta || "СМОТРЕТЬ"); }
    
    let anchorStr = data.global_anchor_EN ? `[GLOBAL ANCHOR: ${data.global_anchor_EN}] ` : "";
    let rScript = "🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n👁 Визуал: ${f.visual}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    let imgList = "\n\n🖼 ЧИСТЫЕ IMAGE PROMPTS (Veo/Whisk):\n\n" + (data.frames || []).map(f => anchorStr + f.imgPrompt_EN).filter(Boolean).join("\n\n");
    let vidList = "\n\n🎥 ЧИСТЫЕ VIDEO PROMPTS (Grok Super):\n\n" + (data.frames || []).map(f => anchorStr + f.vidPrompt_EN).filter(Boolean).join("\n\n");
    let bRollList = (data.b_rolls && data.b_rolls.length) ? "\n\n⚡ FLASH B-ROLLS (Grok Super Перебивки):\n\n" + data.b_rolls.map(b => anchorStr + b).join("\n\n") : "";
    
    setRawPrompts(rScript + imgList + vidList + bRollList); 
    setBgImage(null); setTab("storyboard"); setView("result");

    if (!fromHistory) {
      const tName = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация ИИ";
      const newItem = { id: Date.now(), topic: tName, time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}), text: cleanText, format: vidFormat };
      setHistory(prev => { const next = [newItem, ...prev].slice(0, 10); localStorage.setItem("ds_history", JSON.stringify(next)); return next; });
    }
  }

  async function handleDraftText() {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true); setLoadingMsg("Пишем черновик (Opus)...");
    try {
      const sysTxt = `You are 'Director-X'. Напиши ТОЛЬКО текст диктора. Мрачный стиль. Без разметки. Язык: ${lang==="RU" ? "Русский" : "English"}`;
      const text = await callAPI(`Тема: ${topic}\nЖанр: ${genre}\nДлительность: ${dur}\nНапиши чистый текст диктора.`, 3000, sysTxt);
      setScript(text.trim());
    } catch(e) { alert("Ошибка: " + e.message); } finally { setBusy(false); }
  }

  async function handleIntonations() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true); setLoadingMsg("Разметка интонаций...");
    try {
      const sysTxt = `You are an Audio Director. Расставь паузы (...) и выдели КАПСОМ слова для акцента. Верни только текст. Язык: ${lang==="RU" ? "Русский" : "English"}`;
      const text = await callAPI(`Расставь интонации для диктора:\n\n${script}`, 3000, sysTxt);
      setScript(text.trim());
    } catch(e) { alert("Ошибка: " + e.message); } finally { setBusy(false); }
  }

  async function handleTTS() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true); setLoadingMsg("Подбор голоса...");
    try {
      const text = await callAPI(`Genre: ${genre}. Script: "${script.substring(0,100)}..."\nProvide TTS settings for Google AI Studio:\nVOICE: [Name]\nSPEED: [Value]\nSTYLE PROMPT: [English instruction]`, 1000, "Output strictly in English, 3 lines.");
      setTtsData(text.trim());
    } catch(e) { alert("Ошибка: " + e.message); } finally { setBusy(false); }
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) return alert("Заполните идею или текст!");
    if (!checkTokens()) return;
    setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        setLoadingMsg("Создаем текст...");
        currentScript = await callAPI(`Тема: ${topic}\nЖанр: ${genre}\nДлительность: ${dur}\nЯзык: ${lang==="RU" ? "Русский" : "English"}\nНапиши текст.`, 3000, `You are 'Director-X'. Напиши ТОЛЬКО текст.`);
        setScript(currentScript.trim());
      }
      setLoadingMsg("Режиссура, Якоря и Студия Обложек (8K Quality)...");
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
      const engineStyle = VISUAL_ENGINES[engine].prompt;
      
      const req = `ВЫДАЙ СТРОГО В JSON! РОВНО ${durCfg.frames} КАДРОВ. СТРОГО 3 СЕКУНДЫ НА СЦЕНУ.`;
      const text = await callAPI(`ТЕМА: ${topic}\nФОРМАТ: ${currFormat.ratio}\nЖАНР: ${genre}\nСТИЛЬ РЕНДЕРА: ${engineStyle}\nЦЕЛЕВОЙ ЯЗЫК: ${lang==="RU" ? "Русский" : "English"}\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 8000, VIRAL_SYSTEM);
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
    if (!window.html2canvas) {
      const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = doCapture; document.body.appendChild(script);
    } else doCapture();
    function doCapture() {
      window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
        const link = document.createElement('a'); link.download = `DocuCover_${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click(); setDownloading(false);
      }).catch(() => { setDownloading(false); alert("Ошибка рендера"); });
    }
  }

  const S = {
    root: { minHeight:"100vh", color:"#e2e8f0", fontFamily:"'SF Pro Display', -apple-system, sans-serif", paddingBottom:120, overflowY:"auto", position:"relative", zIndex:1 },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.5)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:24, background:"rgba(15,15,25,.4)", border:"1px solid rgba(255,255,255,.08)", borderRadius:24, padding:24, backdropFilter:"blur(20px)", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
  const activeStyle = COVER_PRESETS.find(p => p.id === activePreset).style;

  return (
    <div ref={scrollRef} style={S.root}>
      <NeuralBackground />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Montserrat:wght@800;900&display=swap');
        @keyframes blink { 0%, 100% {opacity:1} 50% {opacity:0.3} }
        @keyframes spin {to{transform:rotate(360deg)}}
        .gbtn{width:100%;height:56px;border:none;border-radius:16px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s; box-shadow: 0 4px 20px rgba(168,85,247,0.4);}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1); box-shadow: 0 6px 30px rgba(168,85,247,0.6);}
        .gbtn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}
        textarea:focus, input:focus {outline:none;border-color:rgba(168,85,247,.6)!important;background:rgba(0,0,0,.6)!important;}
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #a855f7; cursor: pointer; margin-top: -6px; box-shadow: 0 0 10px #a855f7; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {showPaywall && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(20px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
           <div style={{background:"#0a0a12", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:40, maxWidth:400, textAlign:"center", boxShadow:"0 20px 80px rgba(168,85,247,.3)"}}>
              <div style={{fontSize:48, marginBottom:20}}>🚀</div>
              <h2 style={{fontSize:24, fontWeight:900, marginBottom:10, color:"#fff"}}>Лимит исчерпан</h2>
              <p style={{color:"#94a3b8", fontSize:14, lineHeight:1.6, marginBottom:30}}>Вы использовали все генерации полного цикла. Перейдите на PRO.</p>
              <button style={{width:"100%", padding:"16px", background:"#fff", color:"#000", fontWeight:900, borderRadius:14, border:"none", cursor:"pointer", marginBottom:12}}>Оформить PRO ($15/мес)</button>
              <button onClick={()=>setShowPaywall(false)} style={{background:"none", border:"none", color:"#64748b", fontSize:12, cursor:"pointer"}}>Позже</button>
           </div>
        </div>
      )}

      {showHistory && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(16px)"}}>
          <div style={{background:"#0a0a12",border:"1px solid rgba(139,92,246,.4)",borderRadius:24,width:"90%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
             <div style={{padding:24,borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <span style={{fontWeight:800,color:"#fff",letterSpacing:1,textTransform:"uppercase",fontSize:14}}>🗄 АРХИВ ПРОЕКТОВ</span>
               <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",fontSize:24,cursor:"pointer"}}>✕</button>
             </div>
             <div style={{padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
               {history.length===0 ? <div style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:"40px 0"}}>Архив пуст</div> :
                 history.map((h) => (
                   <div key={h.id} style={{background:"rgba(255,255,255,.05)",borderRadius:16,padding:16,cursor:"pointer",position:"relative"}}>
                     <div onClick={() => { setVidFormat(h.format || "9:16"); applyResult(h.text, true); setShowHistory(false); }}>
                        <div style={{fontSize:10,color:"#8b5cf6",fontWeight:700,marginBottom:6}}>{h.time}</div>
                        <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{h.topic}</div>
                     </div>
                     <button onClick={() => deleteFromHistory(h.id)} style={{position:"absolute", right:10, top:20, background:"none", border:"none", color:"#ef4444", fontSize:20, cursor:"pointer"}}>🗑️</button>
                   </div>
                 ))
               }
             </div>
             {history.length > 0 && (
               <div style={{padding:16, borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                 <button onClick={clearHistory} style={{width:"100%", padding:10, background:"none", border:"1px solid #ef4444", color:"#ef4444", borderRadius:12, fontSize:12, fontWeight:800, cursor:"pointer"}}>ОЧИСТИТЬ ВСЕ</button>
               </div>
             )}
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          {view==="form" && rawPrompts && <button onClick={()=>setView("result")} style={{background:"none",border:"none",color:"#d8b4fe",fontSize:12,fontWeight:800,cursor:"pointer"}}>👁 РЕЗУЛЬТАТ</button>}
          <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#cbd5e1",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗄 АРХИВ</button>
          
          <div style={{fontSize:11, fontWeight:800, color:tokens>0?"#34d399":"#ef4444", background:"rgba(255,255,255,0.05)", padding:"6px 12px", borderRadius:10}}>💎 {tokens}</div>
          <button onClick={()=>setShowPaywall(true)} style={{padding:"6px 12px",background:"linear-gradient(135deg, #a855f7, #ec4899)",border:"none",borderRadius:10,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>PRO</button>
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"30px 20px"}}>
          
          <div style={{...S.section, borderColor:"rgba(168,85,247,0.4)", boxShadow:"0 10px 40px rgba(168,85,247,0.15)"}}>
            <label style={{...S.label, color:"#d8b4fe", fontSize:13}}>🎯 ИДЕЯ ИЛИ ТЕМА ВАШЕГО ХИТА</label>
            <textarea rows={2} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"18px",fontSize:16,color:"#fff",resize:"none",marginBottom:16}}/>
            
            <label style={S.label}>📝 ИЛИ ГОТОВЫЙ ТЕКСТ</label>
            <textarea rows={4} value={script} onChange={e=>setScript(e.target.value)} placeholder="Вставьте готовый текст диктора..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"16px",fontSize:14,color:"#cbd5e1",resize:"none",marginBottom:16}}/>
            
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
               <button onClick={handleDraftText} disabled={busy || !topic.trim()} style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"12px", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>✍️ Написать черновик</button>
               <button onClick={handleIntonations} disabled={busy || !script.trim()} style={{background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#d8b4fe", padding:"12px", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>🎭 Добавить интонации</button>
               <button onClick={handleTTS} disabled={busy || !script.trim()} style={{gridColumn:"1 / -1", background:"rgba(14,165,233,0.1)", border:"1px dashed rgba(14,165,233,0.3)", color:"#7dd3fc", padding:"12px", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>⚙️ Настройки голоса (Google AI Studio)</button>
            </div>
            {ttsData && <pre style={{marginTop:12, padding:12, background:"rgba(0,0,0,0.5)", borderRadius:10, fontSize:11, color:"#bae6fd", fontFamily:"monospace", whiteSpace:"pre-wrap"}}>{ttsData}</pre>}
          </div>

          <div style={S.section}>
            <label style={S.label}>🎭 ЖАНР</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?`${p.col}22`:"rgba(0,0,0,.4)",border:`1px solid ${genre===g?p.col:"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8, transition:"all 0.2s"}}>
                  <span style={{fontSize:24,filter:genre===g?"none":"grayscale(100%) opacity(50%)"}}>{p.icon}</span>
                  <span style={{fontSize:9,color:genre===g?p.col:"rgba(255,255,255,.4)",fontWeight:800}}>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom: 24}}>
             <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", padding:"16px 24px", borderRadius: settingsOpen ? "24px 24px 0 0" : 24, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                <span>⚙️ Технические настройки</span><span>{settingsOpen ? "▲" : "▼"}</span>
             </button>
             {settingsOpen && (
               <div style={{background:"rgba(15,15,25,.3)", border:"1px solid rgba(255,255,255,.05)", borderTop:"none", borderRadius:"0 0 24px 24px", padding:24, backdropFilter:"blur(20px)"}}>
                  <label style={S.label}>🎨 Визуальный движок</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                    {Object.entries(VISUAL_ENGINES).map(([eId, e])=><button key={eId} onClick={()=>setEngine(eId)} style={{flex:"1 1 45%",background:engine===eId?"rgba(168,85,247,.15)":"rgba(0,0,0,.4)",border:`1px solid ${engine===eId?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"10px",fontSize:11,fontWeight:engine===eId?800:500,color:engine===eId?"#d8b4fe":"rgba(255,255,255,.5)",cursor:"pointer"}}>{e.label}</button>)}
                  </div>
               
                  <label style={S.label}>🌐 Язык контента (SEO)</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>
                    {["RU", "EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,background:lang===l?"rgba(245,158,11,.15)":"rgba(0,0,0,.4)",border:`1px solid ${lang===l?"#fbbf24":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"10px",fontSize:12,fontWeight:lang===l?800:500,color:lang===l?"#fcd34d":"rgba(255,255,255,.5)",cursor:"pointer"}}>{l === "RU" ? "Русский" : "English"}</button>)}
                  </div>
                  
                  <label style={S.label}>📐 Формат</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>
                    {FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1,background:vidFormat===f.id?"rgba(14,165,233,.15)":"rgba(0,0,0,.4)",border:`1px solid ${vidFormat===f.id?"#0ea5e9":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:"10px",fontSize:12,fontWeight:vidFormat===f.id?800:500,color:vidFormat===f.id?"#bae6fd":"rgba(255,255,255,.5)",cursor:"pointer"}}>{f.id}</button>)}
                  </div>
                  
                  <label style={S.label}>⏱ Хронометраж</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                    {DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.15)":"rgba(0,0,0,.4)",border:`1px solid ${dur===d?"#f97316":"rgba(255,255,255,.05)"}`,borderRadius:20,padding:"10px 16px",fontSize:12,fontWeight:dur===d?800:500,color:dur===d?"#fdba74":"rgba(255,255,255,.5)",cursor:"pointer"}}>{d}</button>)}
                  </div>
               </div>
             )}
          </div>

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"16px 20px 24px",background:"linear-gradient(to top, rgba(5,5,10,1) 50%, transparent)",zIndex:100}}>
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
          
          {retention && (
             <div style={{background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:16, padding:16, marginBottom:24}}>
               <div style={{fontSize:11, fontWeight:900, color:"#34d399", textTransform:"uppercase", marginBottom:6}}>📊 Оценка Удержания: {retention.score}%</div>
               <div style={{fontSize:13, color:"#a7f3d0"}}>{retention.feedback}</div>
             </div>
          )}

          <div style={{...S.section, padding:0, overflow:"hidden"}}>
            <div style={{padding:"20px 24px", background:"rgba(0,0,0,0.3)", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
               <div style={{fontSize:14, fontWeight:900, color:"#d8b4fe", letterSpacing:1, textTransform:"uppercase"}}>🎨 Студия Обложки</div>
            </div>
            
            <div style={{padding:24}}>
              <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:16, marginBottom:10}}>
                {COVER_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${activePreset===p.id?"#a855f7":"rgba(255,255,255,.1)"}`, background:activePreset===p.id?"rgba(168,85,247,0.2)":"rgba(0,0,0,.3)", color:activePreset===p.id?"#fff":"rgba(255,255,255,.5)", fontSize:11, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>{p.label}</button>
                ))}
              </div>

              <div style={{display:"flex", justifyContent:"center", marginBottom:24}}>
                <div id="thumbnail-export" style={{
                  width: 320, aspectRatio: currFormat.ratio, overflow: "hidden", position: "relative",
                  background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "#111",
                }}>
                  <div style={{position:"absolute", inset:0, background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`, zIndex:1}} />
                  <div style={{position:"absolute", left:`${covX}%`, top:`${covY}%`, transform:"translate(-50%, -50%)", zIndex:2, width:"90%", display: "flex", flexDirection: "column", alignItems: activeStyle.container?.alignItems || "center", textAlign: activeStyle.title?.textAlign || "center"}}>
                    <div style={activeStyle.hook}>{covHook}</div>
                    <div style={{...activeStyle.title, wordWrap:"break-word"}}>{covTitle}</div>
                    <div style={activeStyle.cta}>{covCta}</div>
                  </div>
                </div>
              </div>

              <div style={{background:"rgba(0,0,0,0.3)", borderRadius:16, padding:20, marginBottom:20}}>
                 <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>
                   <div>
                     <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция X (Влево/Вправо)</label>
                     <input type="range" min="10" max="90" value={covX} onChange={e=>setCovX(e.target.value)} />
                   </div>
                   <div>
                     <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция Y (Вверх/Вниз)</label>
                     <input type="range" min="10" max="90" value={covY} onChange={e=>setCovY(e.target.value)} />
                   </div>
                 </div>
                 <input type="text" value={covTitle} onChange={e=>setCovTitle(e.target.value)} placeholder="Заголовок" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:10, color:"#fff", marginBottom:10, fontSize:13}} />
                 <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginTop:10, marginBottom:8, display:"block"}}>Затемнение картинки</label>
                 <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} />
              </div>

              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
                  📸 Картинка
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                </label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:48, border:"none", borderRadius:14, background:"linear-gradient(135deg, #10b981, #059669)", color:"#fff", fontSize:12, fontWeight:900, cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>{downloading ? "Рендер..." : "💾 СКАЧАТЬ"}</button>
              </div>
              
              <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:14, padding:14}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}><span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ПРОМПТ 50% / ЧЕРНЫЙ ФОН</span><CopyBtn text={thumb?.prompt_EN || ""} small/></div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb?.prompt_EN}</div>
              </div>
            </div>
          </div>

          <div style={{display:"flex", gap:10, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:16, overflowX:"auto"}}>
             <button onClick={()=>setTab("storyboard")} style={{background:"none", border:"none", color:tab==="storyboard"?"#a855f7":"#94a3b8", fontWeight:800, fontSize:12, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap"}}>Раскадровка</button>
             <button onClick={()=>setTab("raw")} style={{background:"none", border:"none", color:tab==="raw"?"#a855f7":"#94a3b8", fontWeight:800, fontSize:12, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap"}}>Скрипт и Промпты</button>
             <button onClick={()=>setTab("seo")} style={{background:"none", border:"none", color:tab==="seo"?"#a855f7":"#94a3b8", fontWeight:800, fontSize:12, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap"}}>Музыка и SEO</button>
          </div>

          {tab === "storyboard" && (
            <div>
              {frames.map((f,i)=>(
                  <div key={i} style={{...S.section, position:"relative", overflow:"hidden"}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:16}}><span style={{fontSize:12, fontWeight:900, color:"#ef4444", display:"flex", alignItems:"center", gap:6}}><span style={{width:8,height:8,background:"#ef4444",borderRadius:"50%",animation:"blink 1.5s infinite"}}/> REC {String(i+1).padStart(2,"0")}</span><span style={{fontSize:10, color:"#cbd5e1", background:"rgba(255,255,255,0.1)", padding:"4px 8px", borderRadius:6, fontFamily:"monospace"}}>TC: {f.timecode}</span></div>
                    {f.visual && <div style={{fontSize:14, color:"#fff", marginBottom:12, lineHeight:1.5}}>👁 {f.visual}</div>}
                    {f.voice && <div style={{fontSize:14, fontStyle:"italic", color:"#a855f7", marginBottom:16, borderLeft:`3px solid #a855f7`, paddingLeft:12}}>«{f.voice}»</div>}
                    {f.imgPrompt_EN && <div style={{background:"rgba(16,185,129,.05)", padding:12, borderRadius:12, marginBottom:10}}><div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#34d399", fontWeight:800}}>IMAGE PROMPT (VEO/WHISK)</span><CopyBtn text={anchorStr + f.imgPrompt_EN} small/></div><div style={{fontSize:12, fontFamily:"monospace", color:"#6ee7b7", lineHeight:1.4}}>{anchorStr + f.imgPrompt_EN}</div></div>}
                    {f.vidPrompt_EN && <div style={{background:"rgba(139,92,246,.05)", padding:12, borderRadius:12}}><div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#a78bfa", fontWeight:800}}>VIDEO PROMPT (GROK SUPER)</span><CopyBtn text={anchorStr + f.vidPrompt_EN} small/></div><div style={{fontSize:12, fontFamily:"monospace", color:"#d8b4fe", lineHeight:1.4}}>{anchorStr + f.vidPrompt_EN}</div></div>}
                  </div>
              ))}
              
              {bRolls.length > 0 && (
                <div style={{...S.section, border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.05)"}}>
                  <div style={{fontSize:12, fontWeight:900, color:"#fbbf24", marginBottom:16}}>⚡ МИКРО-ПЕРЕБИВКИ (FLASH B-ROLLS)</div>
                  {bRolls.map((b,i)=>(
                    <div key={i} style={{fontSize:12, fontFamily:"monospace", color:"#fcd34d", marginBottom:8, paddingBottom:8, borderBottom:"1px solid rgba(245,158,11,0.1)"}}>- {anchorStr + b}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "raw" && (
            <div style={{...S.section}}>
               <div style={{display:"flex", justifyContent:"flex-end", marginBottom:10}}><CopyBtn text={rawPrompts} label="Копировать ВСЁ"/></div>
               <pre style={{whiteSpace:"pre-wrap", fontFamily:"monospace", fontSize:13, color:"#cbd5e1", lineHeight:1.6}}>{rawPrompts}</pre>
            </div>
          )}

          {tab === "seo" && (
            <div style={{...S.section}}>
               <div style={{background:"rgba(245,158,11,.05)", border:"1px solid rgba(245,158,11,.2)", padding:16, borderRadius:16, marginBottom:16}}>
                 <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:11, fontWeight:900, color:"#fbbf24"}}>🎵 МУЗЫКА (SUNO AI)</span><CopyBtn text={music} small/></div>
                 <div style={{fontFamily:"monospace", fontSize:13, color:"#fcd34d"}}>{music || "Промпт не сгенерирован"}</div>
               </div>
               {seo && (
                 <div style={{background:"rgba(59,130,246,.05)", border:"1px solid rgba(59,130,246,.2)", padding:16, borderRadius:16}}>
                   <span style={{fontSize:11, fontWeight:900, color:"#60a5fa", display:"block", marginBottom:12}}>🚀 ВИРУСНОЕ SEO</span>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Названия:</strong></div>
                   <ul style={{color:"#93c5fd", fontSize:13, paddingLeft:20, marginBottom:16}}>{seo.titles?.map((t,i)=><li key={i} style={{marginBottom:4}}>{t}</li>)}</ul>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Описание:</strong></div>
                   <div style={{color:"#93c5fd", fontSize:13, marginBottom:16, whiteSpace:"pre-wrap"}}>{seo.desc}</div>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Теги:</strong></div>
                   <div style={{color:"#93c5fd", fontSize:13}}>{seo.tags?.join(" ")}</div>
                 </div>
               )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
