// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- ЖИВОЙ ФОН НЕЙРОСЕТИ ---
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

// --- КОНФИГУРАЦИЯ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ": { icon:"🔫", col:"#ff3355" }, "ТАЙНА": { icon:"🔍", col:"#a855f7" },
  "ИСТОРИЯ": { icon:"📜", col:"#f97316" }, "НАУКА": { icon:"⚗", col:"#06b6d4" },
  "ВОЙНА": { icon:"⚔", col:"#ef4444" }, "ПРИРОДА": { icon:"🌿", col:"#22c55e" },
  "ПСИХОЛОГИЯ": { icon:"🧠", col:"#ec4899" }, "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24" },
};

const VISUAL_ENGINES = {
  "CINEMATIC": { label: "Кино-реализм", prompt: "cinematic realism, photorealistic, 8k, Arri Alexa 65" },
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge style, vintage film, scratches, bleak shadows" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar style, soft global illumination" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "technical x-ray view, exploded diagram, glowing mechanical parts" }
};

const DURATION_CONFIG = {
  "15 сек": { frames: 5 }, "30–45 сек": { frames: 13 }, "До 60 сек": { frames: 20 },
  "1.5 мин": { frames: 30 }, "3 мин": { frames: 60 }, "10-12 мин": { frames: 80 }
};

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { hook: { fontSize: 12, color: "#e50914", textTransform: "uppercase", letterSpacing: 4 }, title: { fontSize: 32, fontWeight: 900, color: "#fff", textTransform: "uppercase" }, cta: { fontSize: 10, color: "#fff", borderBottom: "1px solid #e50914" } } },
  { id: "mrbeast", label: "MrBeast", style: { hook: { fontSize: 16, fontWeight: 900, color: "#ffdd00", WebkitTextStroke: "1px #000" }, title: { fontSize: 38, fontWeight: 900, color: "#fff", WebkitTextStroke: "2px #000", transform: "rotate(-3deg)" }, cta: { fontSize: 13, color: "#ff00ff", background: "#000", padding: "4px 10px" } } },
  { id: "truecrime", label: "True Crime", style: { hook: { background: "#ffdd00", color: "#000", padding: "2px 6px" }, title: { fontSize: 30, background: "#000", color: "#fff", borderLeft: "5px solid #ffdd00", padding: "4px 10px" }, cta: { color: "#888" } } },
  { id: "horror", label: "Ужасы", style: { hook: { color: "#dc2626", letterSpacing: 5 }, title: { fontSize: 34, color: "#fff", textShadow: "0 0 15px #dc2626" }, cta: { opacity: 0.5 } } },
  { id: "scifi", label: "Sci-Fi", style: { hook: { color: "#34d399", fontFamily: "monospace" }, title: { fontSize: 32, color: "#fff", textShadow: "0 0 10px #34d399" }, cta: { border: "1px solid #0ea5e9", color: "#0ea5e9" } } }
];

const VIRAL_SYSTEM = `### SYSTEM ROLE (STRICT JSON)
You are 'Director-X'. 🚨 RULES:
1. LANGUAGE: All visual prompts (imgPrompt_EN, vidPrompt_EN, global_anchor_EN) MUST be in ENGLISH.
2. QUALITY: End every visual prompt with: ", shot on Arri Alexa 65, 8k resolution, photorealistic, cinematic lighting".
3. PACING: Strictly 3 seconds per scene.
4. CONSISTENCY: Use "global_anchor_EN" to describe character/location once and repeat it in every frame prompt.
5. NO Midjourney/Leonardo mentions.
6. AUDIO: "music_EN" must be detailed instrumental Suno prompt (no vocals).`;

async function callAPI(content, maxTokens = 8000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }) });
    const textRes = await res.text();
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
    const data = JSON.parse(textRes);
    return data.text || (data.choices && data.choices[0]?.message?.content) || "";
  } catch (e) { throw e; }
}

function CopyBtn({ text, label="Копировать", small=false }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={e=>{ e.stopPropagation(); try{navigator.clipboard?.writeText(text)}catch{}; setOk(true); setTimeout(()=>setOk(false),2000); }}
      style={{background:ok?"rgba(34,197,94,.25)":"rgba(255,255,255,.05)",border:`1px solid ${ok?"#4ade80":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.7)",cursor:"pointer"}}>
      {ok?"✓":"📋 " + label}
    </button>
  );
}

export default function Page() {
  const [tokens, setTokens] = useState(3);
  const [topic, setTopic] = useState("");
  const [script, setScript] = useState("");
  const [genre, setGenre] = useState("ТАЙНА");
  const [dur, setDur] = useState("До 60 сек");
  const [lang, setLang] = useState("RU");
  const [engine, setEngine] = useState("CINEMATIC");
  const [view, setView] = useState("form");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("storyboard");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [frames, setFrames] = useState([]);
  const [rawPrompts, setRawPrompts] = useState("");
  const [thumb, setThumb] = useState(null);
  const [music, setMusic] = useState("");
  const [seo, setSeo] = useState(null);
  const [retention, setRetention] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Студия обложки
  const [covX, setCovX] = useState(50);
  const [covY, setCovY] = useState(50);
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [activePreset, setActivePreset] = useState("netflix");
  const [bgImage, setBgImage] = useState(null);

  useEffect(() => { const s = localStorage.getItem("ds_history"); if(s) setHistory(JSON.parse(s)); }, []);

  const saveHistory = (h) => { setHistory(h); localStorage.setItem("ds_history", JSON.stringify(h)); };
  
  const deleteFromHistory = (id) => { saveHistory(history.filter(i => i.id !== id)); };
  const clearAllHistory = () => { if(confirm("Удалить всю историю?")) saveHistory([]); };

  const applyResult = (rawText, fromHistory = false) => {
    let clean = rawText.replace(/```json|```/gi, "").trim();
    const start = clean.indexOf('{'); if (start !== -1) clean = clean.substring(start);
    try {
      const data = JSON.parse(clean);
      setFrames(data.frames || []); setThumb(data.thumbnail || null);
      setMusic(data.music_EN || ""); setSeo(data.seo || null); setRetention(data.retention || null);
      if(data.thumbnail) { setCovTitle(data.thumbnail.title); setCovHook(data.thumbnail.hook); }
      let anchor = data.global_anchor_EN ? `[ANCHOR: ${data.global_anchor_EN}] ` : "";
      let resText = "🎬 СЦЕНАРИЙ:\n" + data.frames.map(f=>`${f.timecode}: ${f.voice}`).join("\n\n") + 
                    "\n\n🖼 VEO PROMPTS:\n\n" + data.frames.map(f=>anchor + f.imgPrompt_EN).join("\n\n") +
                    "\n\n🎥 GROK PROMPTS:\n\n" + data.frames.map(f=>anchor + f.vidPrompt_EN).join("\n\n");
      setRawPrompts(resText); setView("result");
      if(!fromHistory) {
        const newItem = { id: Date.now(), topic: topic || "Без темы", time: new Date().toLocaleString(), text: clean };
        saveHistory([newItem, ...history].slice(0, 20));
      }
    } catch(e) { alert("Ошибка парсинга. Попробуйте еще раз."); setView("form"); }
  };

  const handleGenerate = async () => {
    if(!topic && !script) return alert("Введите тему!");
    if(tokens <= 0) return alert("Нет кристаллов!");
    setBusy(true); setView("loading");
    try {
      const prompt = `ТЕМА: ${topic}. ЯЗЫК: ${lang}. ЖАНР: ${genre}. СТИЛЬ: ${VISUAL_ENGINES[engine].prompt}. СЦЕНАРИЙ: ${script}. ВЫДАЙ JSON.`;
      const res = await callAPI(prompt);
      setTokens(t => t - 1); applyResult(res);
    } catch(e) { alert(e.message); setView("form"); } finally { setBusy(false); }
  };

  return (
    <div style={{minHeight:"100vh", color:"#e2e8f0", position:"relative", paddingBottom:100}}>
      <NeuralBackground />
      <nav style={{display:"flex", justifyContent:"space-between", padding:20, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(10px)"}}>
        <div style={{fontWeight:900, fontSize:20}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></div>
        <div style={{display:"flex", gap:15, alignItems:"center"}}>
          <button onClick={()=>setShowHistory(true)} style={{background:"none", border:"none", color:"#fff", cursor:"pointer"}}>🗄 АРХИВ</button>
          <div style={{background:"rgba(255,255,255,0.1)", padding:"5px 12px", borderRadius:10}}>💎 {tokens}</div>
        </div>
      </nav>

      {view === "form" && (
        <div style={{maxWidth:600, margin:"40px auto", padding:20}}>
          <div style={{background:"rgba(20,20,30,0.6)", padding:25, borderRadius:24, border:"1px solid rgba(168,85,247,0.3)"}}>
            <label style={{fontSize:12, fontWeight:800, color:"#94a3b8", display:"block", marginBottom:10}}>ЦЕЛЬ ВАШЕГО ВИДЕО</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Тайна Мертвой Руки..." style={{width:"100%", background:"#000", border:"1px solid #333", borderRadius:12, padding:15, color:"#fff", marginBottom:20}} />
            <button className="gbtn" onClick={handleGenerate} style={{width:"100%", height:55, borderRadius:16, border:"none", background:"linear-gradient(135deg,#4f46e5,#9333ea)", color:"#fff", fontWeight:900, cursor:"pointer"}}>АКТИВИРОВАТЬ НЕЙРОСЕТЬ (💎 1)</button>
          </div>
          
          <div style={{marginTop:20}}>
            <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"none", padding:15, borderRadius:15, color:"#fff", cursor:"pointer"}}>⚙️ ТЕХНИЧЕСКИЕ НАСТРОЙКИ {settingsOpen?"▲":"▼"}</button>
            {settingsOpen && (
              <div style={{padding:20, background:"rgba(0,0,0,0.3)", marginTop:10, borderRadius:15}}>
                <label style={{fontSize:11, display:"block", marginBottom:10}}>ВИЗУАЛЬНЫЙ ДВИЖОК</label>
                <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
                  {Object.entries(VISUAL_ENGINES).map(([k,v])=><button key={k} onClick={()=>setEngine(k)} style={{padding:"8px 12px", borderRadius:10, border:engine===k?"1px solid #a855f7":"1px solid #333", background:engine===k?"#a855f722":"none", color:"#fff"}}>{v.label}</button>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "loading" && <div style={{textAlign:"center", marginTop:100}}><div className="spinner"></div><p>Мастер-режиссер создает проект...</p></div>}

      {view === "result" && (
        <div style={{maxWidth:600, margin:"20px auto", padding:20}}>
          <button onClick={()=>setView("form")} style={{marginBottom:20, background:"none", border:"none", color:"#a855f7", cursor:"pointer"}}>← НАЗАД В МЕНЮ</button>
          <div style={{display:"flex", gap:15, marginBottom:20}}>
             <button onClick={()=>setTab("storyboard")} style={{color:tab==="storyboard"?"#a855f7":"#fff", background:"none", border:"none", fontWeight:800}}>РАСКАДРОВКА</button>
             <button onClick={()=>setTab("raw")} style={{color:tab==="raw"?"#a855f7":"#fff", background:"none", border:"none", fontWeight:800}}>ПРОМПТЫ</button>
          </div>
          {tab === "storyboard" && frames.map((f,i)=><div key={i} style={{background:"rgba(255,255,255,0.05)", padding:20, borderRadius:15, marginBottom:15}}><strong>{f.timecode}</strong><p style={{marginTop:10, fontStyle:"italic"}}>{f.voice}</p></div>)}
          {tab === "raw" && <pre style={{whiteSpace:"pre-wrap", background:"#000", padding:20, borderRadius:15, fontSize:12}}>{rawPrompts}</pre>}
        </div>
      )}

      {showHistory && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, padding:20}}>
          <div style={{maxWidth:500, margin:"0 auto", background:"#111", borderRadius:24, height:"80vh", display:"flex", flexDirection:"column"}}>
            <div style={{padding:20, borderBottom:"1px solid #222", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontWeight:800}}>АРХИВ ПРОЕКТОВ</span>
              <button onClick={()=>setShowHistory(false)} style={{background:"none", border:"none", color:"#fff", fontSize:20}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:"auto", padding:15}}>
              {history.map(i=>(
                <div key={i.id} style={{background:"#1a1a1a", padding:15, borderRadius:15, marginBottom:10, position:"relative"}}>
                  <div onClick={()=>applyResult(i.text, true)} style={{cursor:"pointer"}}>
                    <div style={{fontSize:10, color:"#a855f7"}}>{i.time}</div>
                    <div style={{fontWeight:700, marginTop:5}}>{i.topic}</div>
                  </div>
                  <button onClick={()=>deleteFromHistory(i.id)} style={{position:"absolute", right:15, top:20, background:"none", border:"none", color:"#ef4444"}}>🗑️</button>
                </div>
              ))}
            </div>
            <div style={{padding:20, borderTop:"1px solid #222"}}>
              <button onClick={clearAllHistory} style={{width:"100%", padding:12, borderRadius:12, border:"1px solid #ef4444", color:"#ef4444", background:"none", fontWeight:700}}>ОЧИСТИТЬ ВЕСЬ АРХИВ</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gbtn:active { transform: scale(0.98); }
        .spinner { width: 40px; height: 40px; border: 4px solid #a855f722; border-top: 4px solid #a855f7; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
