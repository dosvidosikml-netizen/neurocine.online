// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- ЖИВОЙ ФОН НЕЙРОСЕТИ (CANVAS ENGINE) ---
const NeuralBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width, 
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8
      });
    }

    const render = () => {
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168, 85, 247, 0.8)";
      ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
      ctx.lineWidth = 1;
      
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas ref={canvasRef} style={{position:"fixed", top:0, left:0, zIndex:-2, width:"100vw", height:"100vh"}} />;
};

// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355" }, 
  "ТАЙНА":         { icon:"🔍", col:"#a855f7" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316" }, 
  "НАУКА":         { icon:"⚗",  col:"#06b6d4" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444" }, 
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899" }, 
  "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24" },
};

const FORMATS = [
  { id:"9:16", label:"Вертикальный", ratio:"9/16" }, 
  { id:"16:9", label:"Горизонтальный", ratio:"16/9" }, 
  { id:"1:1", label:"Квадрат", ratio:"1/1" }
];

const VISUAL_ENGINES = {
  "CINEMATIC": { label: "Кино-реализм", prompt: "cinematic realism, photorealistic, deep shadows, 8k, Arri Alexa 65" },
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge, dirty vintage film effect, scratches, bleak atmosphere, heavy vignette, 8k, Arri Alexa 65" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm soft lighting, 8k" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "x-ray exploded view, detailed engineering diagram, glowing internal parts, technical cross-section render, 8k" }
};

const DURATION_CONFIG = {
  "15 сек": { frames: 5 }, "30–45 сек": { frames: 13 }, "До 60 сек": { frames: 20 }, 
  "1.5 мин": { frames: 30 }, "3 мин": { frames: 60 }, "10-12 мин": { frames: 80 } 
};
const DURATIONS = Object.keys(DURATION_CONFIG);

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,0.9)", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", borderBottom: "1px solid #e50914", marginTop: 10 } } },
  { id: "mrbeast", label: "MrBeast", style: { container: { alignItems: "center" }, hook: { fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", WebkitTextStroke: "1px #000", transform: "rotate(-2deg)" }, title: { fontSize: 38, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#fff", WebkitTextStroke: "2px #000", transform: "rotate(-3deg)", textAlign: "center" }, cta: { fontSize: 13, fontWeight: 900, color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "4px 10px", marginTop: 10 } } },
  { id: "tiktok", label: "TikTok", style: { container: { alignItems: "center" }, hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12 }, title: { fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", textAlign: "center" }, cta: { fontSize: 11, fontWeight: 900, color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20, marginTop: 10 } } },
  { id: "truecrime", label: "True Crime", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#000", background: "#ffdd00", padding: "4px 8px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, background: "#000", padding: "4px 12px", borderLeft: "4px solid #ffdd00", textAlign: "left" }, cta: { color: "#888", fontSize: 11, marginTop: 10 } } },
  { id: "horror", label: "Ужасы", style: { container: { alignItems: "center" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#dc2626", textTransform: "uppercase", letterSpacing: 6, marginBottom: 8, textShadow: "0 0 10px #dc2626" }, title: { fontSize: 36, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 5px 20px #000, 0 0 15px #dc2626", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", opacity: 0.5, marginTop: 10 } } }
];

const VIRAL_SYSTEM = `### SYSTEM ROLE (STRICT JSON)
You are 'Director-X'. OUTPUT STRICTLY IN JSON.

CRITICAL LANGUAGE RULE: YOU MUST USE TWO LANGUAGES!
1. PROMPTS = ENGLISH ONLY ("global_anchor_EN", "imgPrompt_EN", "vidPrompt_EN", "music_EN", "b_rolls").
2. SCRIPT = TARGET LANGUAGE ("voice", "visual", "camera", "seo", "thumbnail"). If Target Language is Russian, these MUST be in Russian!

🚨 RULES:
1. PACING: Strictly 3 seconds per scene! Every 3 seconds a new frame.
2. GLOBAL ANCHOR: Detailed physical description of the main character/location in "global_anchor_EN" (English).
3. 8K QUALITY: ALWAYS append ", shot on Arri Alexa 65, 8k resolution, photorealistic, cinematic lighting" to every image, video and b_roll prompt.
4. B-ROLLS: "b_rolls" MUST be a list of 2-3 full English visual prompts for Grok Super.

JSON SCHEMA:
{
  "global_anchor_EN": "(ENGLISH ONLY) ...",
  "retention": { "score": 95, "feedback": "(TARGET LANG) ..." },
  "frames": [ { "timecode": "0-3 сек", "camera": "(TARGET LANG)", "visual": "(TARGET LANG)", "voice": "(TARGET LANG)", "imgPrompt_EN": "(ENGLISH)", "vidPrompt_EN": "(ENGLISH) [SFX: ...]" } ],
  "b_rolls": [ "(ENGLISH) full prompt 1...", "(ENGLISH) full prompt 2..." ],
  "thumbnail": { "title": "(TARGET LANG)", "hook": "(TARGET LANG)", "cta": "(TARGET LANG)", "prompt_EN": "(ENGLISH)" },
  "music_EN": "(ENGLISH)",
  "seo": { "titles": ["(TARGET LANG)"], "desc": "(TARGET LANG)", "tags": ["#tag1"] }
}`;

async function callAPI(content, maxTokens = 8000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        messages: [
          { role: "system", content: sysPrompt }, 
          { role: "user", content }
        ], 
        max_tokens: maxTokens 
      }) 
    });
    const textRes = await res.text();
    if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
    const data = JSON.parse(textRes);
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
      const saved = localStorage.getItem("ds_history"); 
      if (saved) setHistory(JSON.parse(saved)); 
    }
  }, []);
  
  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTo({top:0,behavior:"smooth"}); 
  }, [view]);

  const checkTokens = () => { if (tokens <= 0) { setShowPaywall(true); return false; } return true; };

  const deleteFromHistory = (id) => {
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem("ds_history", JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    if(confirm("Очистить весь архив?")) {
      setHistory([]);
      localStorage.removeItem("ds_history");
    }
  };

  function applyResult(rawText, fromHistory = false) {
    let cleanText = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) cleanText = cleanText.substring(startIdx);

    try {
      const data = JSON.parse(cleanText);
      setFrames(data.frames || []); 
      setBRolls(data.b_rolls || []);
      setRetention(data.retention || null);
      setThumb(data.thumbnail || null); 
      setMusic(data.music_EN || ""); 
      setSeo(data.seo || null);
      
      if (data.thumbnail) { 
        setCovTitle(data.thumbnail.title || ""); 
        setCovHook(data.thumbnail.hook || ""); 
        setCovCta(data.thumbnail.cta || "СМОТРЕТЬ"); 
      }
      
      let anchorStr = data.global_anchor_EN ? `[GLOBAL ANCHOR: ${data.global_anchor_EN}] ` : "";
      let rScript = "🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n👁 Визуал: ${f.visual}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
      let imgList = "\n\n🖼 ЧИСТЫЕ IMAGE PROMPTS (8K):\n\n" + (data.frames || []).map(f => anchorStr + f.imgPrompt_EN).filter(Boolean).join("\n\n");
      let vidList = "\n\n🎥 ЧИСТЫЕ VIDEO PROMPTS (8K):\n\n" + (data.frames || []).map(f => anchorStr + f.vidPrompt_EN).filter(Boolean).join("\n\n");
      let bRollList = (data.b_rolls && data.b_rolls.length) ? "\n\n⚡ FLASH B-ROLLS (8K):\n\n" + data.b_rolls.map(b => anchorStr + b).join("\n\n") : "";
      
      setRawPrompts(rScript + imgList + vidList + bRollList); 
      setBgImage(null); setTab("storyboard"); setView("result");

      if (!fromHistory) {
        const newItem = { id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString("ru-RU"), text: cleanText, format: vidFormat };
        const newHistory = [newItem, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem("ds_history", JSON.stringify(newHistory));
      }
    } catch (e) {
      alert("Ошибка JSON. Попробуйте еще раз.");
      setView("form");
    }
  }

  async function handleDraftText() {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true); setLoadingMsg("Пишем черновик (Opus)...");
    try {
      const sysTxt = `You are 'Director-X'. Напиши ТОЛЬКО текст диктора. Мрачный стиль. Язык: ${lang==="RU" ? "Русский" : "English"}`;
      const text = await callAPI(`Тема: ${topic}\nЖанр: ${genre}\nДлительность: ${dur}\nНапиши чистый текст диктора.`, 3000, sysTxt);
      setScript(text.trim());
    } catch(e) { alert(e.message); } finally { setBusy(false); }
  }

  async function handleIntonations() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true); setLoadingMsg("Разметка интонаций...");
    try {
      const sysTxt = `You are an Audio Director. Расставь паузы (...) и выдели КАПСОМ слова для акцента. Верни только текст. Язык: ${lang==="RU" ? "Русский" : "English"}`;
      const text = await callAPI(`Расставь интонации для диктора:\n\n${script}`, 3000, sysTxt);
      setScript(text.trim());
    } catch(e) { alert(e.message); } finally { setBusy(false); }
  }

  async function handleTTS() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true); setLoadingMsg("Подбор голоса...");
    try {
      const text = await callAPI(`Genre: ${genre}. Script: "${script.substring(0,100)}..."\nProvide TTS settings for Google AI Studio:`, 1000, "Output strictly in English, 3 lines.");
      setTtsData(text.trim());
    } catch(e) { alert(e.message); } finally { setBusy(false); }
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) return alert("Заполните поля!");
    if (!checkTokens()) return;
    setBusy(true); setView("loading");
    try {
      let currentScript = script.trim();
      if (!currentScript) {
        currentScript = await callAPI(`Тема: ${topic}\nЯзык: ${lang==="RU" ? "Русский" : "English"}`, 3000, `Write only voiceover text. Target language: ${lang}`);
        setScript(currentScript.trim());
      }
      const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];
      const req = `ВЫДАЙ СТРОГО В JSON! РОВНО ${durCfg.frames} КАДРОВ. СТРОГО 3 СЕКУНДЫ НА СЦЕНУ. ЦЕЛЕВОЙ ЯЗЫК: ${lang==="RU" ? "Русский" : "English"}`;
      const text = await callAPI(`ТЕМА: ${topic}\nФОРМАТ: ${vidFormat}\nЖАНР: ${genre}\nСТИЛЬ: ${VISUAL_ENGINES[engine].prompt}\nСЦЕНАРИЙ:\n${currentScript}\n\n${req}`, 8000);
      setTokens(t => t - 1);
      applyResult(text, false);
    } catch(e) { alert(e.message); setView("form"); } finally { setBusy(false); setLoadingMsg(""); }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (ev) => setBgImage(ev.target.result); reader.readAsDataURL(file);
  }

  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export"); if (!el) return;
    setDownloading(true);
    if (!window.html2canvas) {
      const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = doCapture; document.body.appendChild(s);
    } else doCapture();
    function doCapture() {
      window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(c => {
        const a = document.createElement('a'); a.download = `Cover_${Date.now()}.png`; a.href = c.toDataURL(); a.click(); setDownloading(false);
      }).catch(() => { setDownloading(false); alert("Ошибка рендера"); });
    }
  }

  const S = {
    root: { minHeight:"100vh", color:"#e2e8f0", paddingBottom:120, overflowY:"auto", position:"relative", zIndex:1 },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.5)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:24, background:"rgba(15,15,25,.4)", border:"1px solid rgba(255,255,255,.08)", borderRadius:24, padding:24, backdropFilter:"blur(20px)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };

  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0];
  const activeStyle = COVER_PRESETS.find(p => p.id === activePreset).style;

  return (
    <div ref={scrollRef} style={S.root}>
      <NeuralBackground />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes blink { 0%, 100% {opacity:1} 50% {opacity:0.3} }
        @keyframes spin {to{transform:rotate(360deg)}}
        .gbtn{width:100%;height:56px;border:none;border-radius:16px;cursor:pointer;font-weight:900;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s;box-shadow: 0 4px 20px rgba(168,85,247,0.4);}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1);}
        textarea:focus, input:focus {outline:none;border-color:rgba(168,85,247,.6)!important;background:rgba(0,0,0,.6)!important;}
      `}</style>

      {showPaywall && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(20px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
           <div style={{background:"#0a0a12", border:"1px solid rgba(168,85,247,.4)", borderRadius:24, padding:40, maxWidth:400, textAlign:"center"}}>
              <h2 style={{color:"#fff", marginBottom:10}}>Лимит исчерпан</h2>
              <p style={{color:"#94a3b8", marginBottom:30}}>Используйте свой API ключ в настройках Vercel.</p>
              <button onClick={()=>setShowPaywall(false)} style={{width:"100%", padding:"16px", background:"#fff", borderRadius:14, border:"none", fontWeight:900}}>ПОНЯТНО</button>
           </div>
        </div>
      )}

      {showHistory && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(16px)"}}>
          <div style={{background:"#0a0a12",border:"1px solid rgba(139,92,246,.4)",borderRadius:24,width:"90%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
             <div style={{padding:24,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <span style={{fontWeight:800,color:"#fff"}}>🗄 АРХИВ ПРОЕКТОВ</span>
               <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"#fff",fontSize:24}}>✕</button>
             </div>
             <div style={{padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
               {history.length===0 ? <div style={{color:"#555",textAlign:"center"}}>Пусто</div> :
                 history.map((h) => (
                   <div key={h.id} style={{background:"rgba(255,255,255,.05)",borderRadius:16,padding:16,position:"relative"}}>
                     <div onClick={() => { setVidFormat(h.format || "9:16"); applyResult(h.text, true); setShowHistory(false); }}>
                       <div style={{fontSize:10,color:"#8b5cf6"}}>{h.time}</div>
                       <div style={{fontSize:14,fontWeight:600,color:"#fff", paddingRight:30}}>{h.topic}</div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); deleteFromHistory(h.id); }} style={{position:"absolute", right:15, top:20, background:"none", border:"none", color:"#ef4444", fontSize:18}}>🗑️</button>
                   </div>
                 ))
               }
             </div>
             {history.length > 0 && <div style={{padding:16}}><button onClick={clearHistory} style={{width:"100%", padding:12, border:"1px solid #ef4444", color:"#ef4444", background:"none", borderRadius:12, fontWeight:800}}>ОЧИСТИТЬ ВСЁ</button></div>}
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <span style={{fontSize:18,fontWeight:900,color:"#fff"}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#cbd5e1",fontSize:12,fontWeight:700}}>АРХИВ</button>
          <div style={{fontSize:11, fontWeight:800, color:"#34d399", background:"rgba(255,255,255,0.05)", padding:"6px 12px", borderRadius:10}}>💎 {tokens}</div>
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"30px 20px"}}>
          <div style={S.section}>
            <label style={S.label}>ЦЕЛЬ ВАШЕГО ХИТА</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Тема..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:18,fontSize:16,color:"#fff",marginBottom:16}}/>
            <textarea rows={4} value={script} onChange={e=>setScript(e.target.value)} placeholder="Готовый текст..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:16,fontSize:14,color:"#cbd5e1",marginBottom:16}}/>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
               <button onClick={handleDraftText} disabled={busy || !topic.trim()} style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:12, borderRadius:12, fontSize:12, fontWeight:700}}>✍️ Написать</button>
               <button onClick={handleIntonations} disabled={busy || !script.trim()} style={{background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#d8b4fe", padding:12, borderRadius:12, fontSize:12, fontWeight:700}}>🎭 Интонации</button>
               <button onClick={handleTTS} disabled={busy || !script.trim()} style={{gridColumn:"1/-1", background:"rgba(14,165,233,0.1)", border:"1px dashed rgba(14,165,233,0.3)", color:"#7dd3fc", padding:12, borderRadius:12, fontSize:12, fontWeight:700}}>⚙️ Настройки голоса</button>
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>ЖАНР</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?`${p.col}22`:"rgba(0,0,0,.4)",border:`1px solid ${genre===g?p.col:"rgba(255,255,255,.05)"}`,borderRadius:16,padding:"14px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <span style={{fontSize:24,filter:genre===g?"none":"grayscale(100%) opacity(50%)"}}>{p.icon}</span>
                  <span style={{fontSize:9,color:genre===g?p.col:"rgba(255,255,255,.4)",fontWeight:800}}>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom: 24}}>
             <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", padding:16, borderRadius:24, color:"#fff", fontSize:13, fontWeight:800}}>⚙️ НАСТРОЙКИ {settingsOpen?"▲":"▼"}</button>
             {settingsOpen && (
               <div style={{background:"rgba(15,15,25,.3)", border:"1px solid rgba(255,255,255,.05)", padding:24, borderRadius:"0 0 24px 24px"}}>
                  <label style={S.label}>Визуальный движок</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                    {Object.entries(VISUAL_ENGINES).map(([eId, e])=><button key={eId} onClick={()=>setEngine(eId)} style={{flex:"1 1 45%",background:engine===eId?"rgba(168,85,247,.15)":"rgba(0,0,0,.4)",border:`1px solid ${engine===eId?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,fontSize:11,color:engine===eId?"#d8b4fe":"#555"}}>{e.label}</button>)}
                  </div>
                  <label style={S.label}>Язык</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>{["RU", "EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,background:lang===l?"rgba(245,158,11,.15)":"rgba(0,0,0,.4)",border:`1px solid ${lang===l?"#fbbf24":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,color:lang===l?"#fcd34d":"#555"}}>{l}</button>)}</div>
                  <label style={S.label}>Формат</label>
                  <div style={{display:"flex",gap:8}}>{FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1,background:vidFormat===f.id?"rgba(14,165,233,.15)":"rgba(0,0,0,.4)",border:`1px solid ${vidFormat===f.id?"#0ea5e9":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,color:vidFormat===f.id?"#bae6fd":"#555"}}>{f.id}</button>)}</div>
               </div>
             )}
          </div>
          <button className="gbtn" onClick={handleGenerateFullPlan} disabled={busy}>🚀 ГЕНЕРАЦИЯ (💎 1)</button>
        </div>
      )}

      {view==="loading" && <div style={{textAlign:"center",padding:"100px 20px"}}><div style={{width:60,height:60,border:"4px solid rgba(168,85,247,0.2)",borderTopColor:"#a855f7",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 24px"}} /><div style={{color:"#fff", fontWeight:900}}>{loadingMsg}</div></div>}

      {view==="result" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:20}}>
          <button onClick={()=>setView("form")} style={{marginBottom:20, color:"#a855f7", background:"none", border:"none", fontWeight:800, cursor:"pointer"}}>← НАЗАД К ПРОЕКТАМ</button>
          
          <div style={S.section}>
            <label style={S.label}>🎨 СТУДИЯ ОБЛОЖКИ</label>
            <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:16}}>
              {COVER_PRESETS.map(p=>(<button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${activePreset===p.id?"#a855f7":"#333"}`, background:activePreset===p.id?"rgba(168,85,247,0.2)":"#111", color:"#fff", fontSize:11}}>{p.label}</button>))}
            </div>
            <div id="thumbnail-export" style={{width:320, aspectRatio:currFormat.ratio, margin:"0 auto 24px", position:"relative", background:bgImage?`url(${bgImage}) center/cover`:"#111", overflow:"hidden"}}>
              <div style={{position:"absolute", inset:0, background:`rgba(0,0,0,${covDark/100})`}}></div>
              <div style={{position:"absolute", left:`${covX}%`, top:`${covY}%`, transform:"translate(-50%,-50%)", width:"90%", display: "flex", flexDirection: "column", alignItems: activeStyle.container?.alignItems || "center", textAlign: activeStyle.title?.textAlign || "center"}}>
                <div style={activeStyle.hook}>{covHook}</div>
                <div style={{...activeStyle.title, wordWrap:"break-word"}}>{covTitle}</div>
                <div style={activeStyle.cta}>{covCta}</div>
              </div>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:16}}>
               <input type="text" value={covHook} onChange={e=>setCovHook(e.target.value)} placeholder="Верхний текст (Hook)" style={{width:"100%", background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:12, color:"#fff", fontSize:13}} />
               <input type="text" value={covTitle} onChange={e=>setCovTitle(e.target.value)} placeholder="Главный заголовок" style={{width:"100%", background:"rgba(0,0,0,0.5)", border:"1px solid rgba(168,85,247,0.4)", padding:"12px", borderRadius:12, color:"#fff", fontSize:13, fontWeight:800}} />
               <input type="text" value={covCta} onChange={e=>setCovCta(e.target.value)} placeholder="Нижний текст (CTA)" style={{width:"100%", background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:12, color:"#fff", fontSize:13}} />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>
               <div><label style={{fontSize:10, color:"#888"}}>X</label><input type="range" min="10" max="90" value={covX} onChange={e=>setCovX(e.target.value)} style={{width:"100%"}}/></div>
               <div><label style={{fontSize:10, color:"#888"}}>Y</label><input type="range" min="10" max="90" value={covY} onChange={e=>setCovY(e.target.value)} style={{width:"100%"}}/></div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"#222", borderRadius:12, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700}}>🖼 ФОН<input type="file" hidden onChange={handleImageUpload}/></label>
              <button onClick={downloadThumbnail} style={{background:"#10b981", borderRadius:12, border:"none", fontWeight:900, color:"#fff", height:48}}>💾 СКАЧАТЬ</button>
            </div>
          </div>

          <div style={{display:"flex", gap:10, marginBottom:20, overflowX:"auto"}}>
             {["storyboard","raw","seo"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"10px 15px", background:"none", border:"none", color:tab===t?"#a855f7":"#555", fontWeight:800, textTransform:"uppercase", cursor:"pointer", borderBottom: tab===t?"2px solid #a855f7":"none"}}>{t}</button>))}
          </div>

          {tab==="storyboard" && frames.map((f,i)=>(
            <div key={i} style={S.section}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:12}}><span style={{color:"#ef4444", fontWeight:900}}>REC {i+1}</span><span style={{fontSize:10, color:"#888"}}>{f.timecode}</span></div>
              <div style={{fontSize:14, color:"#fff", marginBottom:8}}>👁 {f.visual}</div>
              <div style={{fontSize:14, color:"#a855f7", fontStyle:"italic"}}>«{f.voice}»</div>
            </div>
          ))}

          {tab==="raw" && <div style={S.section}><div style={{display:"flex",justifyContent:"flex-end",marginBottom:15}}><CopyBtn text={rawPrompts} label="Копировать всё"/></div><pre style={{whiteSpace:"pre-wrap", color:"#ccc", fontSize:12, fontFamily:"monospace"}}>{rawPrompts}</pre></div>}
          
          {tab==="seo" && seo && (
            <div style={S.section}>
              <div style={{marginBottom:20}}><strong>МУЗЫКА (SUNO):</strong><p style={{fontSize:12, color:"#fbbf24", marginTop:5}}>{music}</p></div>
              <div style={{marginBottom:20}}><strong>ЗАГОЛОВКИ:</strong><ul style={{fontSize:13, margin:"10px 0", paddingLeft:20}}>{seo.titles.map((t,i)=><li key={i}>{t}</li>)}</ul></div>
              <div><strong>ТЕГИ:</strong><p style={{fontSize:12, color:"#60a5fa", marginTop:5}}>{seo.tags.join(" ")}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
