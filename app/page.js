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
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
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
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge, dirty vintage film effect, scratches, bleak atmosphere, 8k, Arri Alexa 65" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm lighting, 8k" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "x-ray exploded view, technical engineering render, glowing internal parts, 8k" }
};

const DURATION_CONFIG = {
  "15 сек": { frames: 5 }, "30–45 сек": { frames: 13 }, 
  "До 60 сек": { frames: 20 }, "1.5 мин": { frames: 30 }, 
  "3 мин": { frames: 60 }, "10-12 мин": { frames: 80 } 
};
const DURATIONS = Object.keys(DURATION_CONFIG);

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 700, color: "#e50914", textTransform: "uppercase", letterSpacing: 4 }, title: { fontSize: 32, fontWeight: 900, color: "#fff", textTransform: "uppercase", textAlign: "center" }, cta: { fontSize: 10, color: "#fff", borderBottom: "1px solid #e50914", marginTop: 10 } } },
  { id: "mrbeast", label: "MrBeast", style: { container: { alignItems: "center" }, hook: { fontSize: 16, fontWeight: 900, color: "#ffdd00", WebkitTextStroke: "1px #000", transform: "rotate(-2deg)" }, title: { fontSize: 38, fontWeight: 900, color: "#fff", WebkitTextStroke: "2px #000", transform: "rotate(-3deg)", textAlign: "center" }, cta: { fontSize: 13, color: "#ff00ff", background: "#000", padding: "4px 10px" } } },
  { id: "truecrime", label: "True Crime", style: { container: { alignItems: "flex-start" }, hook: { background: "#ffdd00", color: "#000", padding: "2px 8px", fontWeight: 800 }, title: { fontSize: 30, background: "#000", color: "#fff", borderLeft: "5px solid #ffdd00", padding: "5px 15px", textAlign: "left" }, cta: { color: "#888", fontSize: 11, marginTop: 10 } } },
  { id: "horror", label: "Ужасы", style: { container: { alignItems: "center" }, hook: { color: "#dc2626", letterSpacing: 6, fontWeight: 900 }, title: { fontSize: 34, color: "#fff", textShadow: "0 0 20px #dc2626", textAlign: "center" }, cta: { opacity: 0.5, letterSpacing: 2 } } },
  { id: "scifi", label: "Sci-Fi", style: { container: { alignItems: "center" }, hook: { color: "#34d399", fontFamily: "monospace" }, title: { fontSize: 32, color: "#fff", textShadow: "0 0 15px #34d399", fontFamily: "monospace" }, cta: { border: "1px solid #0ea5e9", color: "#0ea5e9", padding: "4px 8px" } } }
];

const VIRAL_SYSTEM = `### SYSTEM ROLE (STRICT JSON)
You are 'Director-X'. Output ONLY valid JSON.

🚨 RULES:
1. PACING: Strictly 3 seconds per scene.
2. GLOBAL ANCHOR: Define character/location in "global_anchor_EN". Repeat it in every scene prompt.
3. 8K QUALITY: ALWAYS append ", shot on Arri Alexa 65, 8k resolution, photorealistic, masterpiece, cinematic lighting" to prompts.
4. PROMPTS IN ENGLISH ONLY: Even if the script is Russian, "global_anchor_EN", "imgPrompt_EN", "vidPrompt_EN" and "music_EN" MUST be strictly in ENGLISH.
5. NO Midjourney/Leonardo. Use Veo/Grok Super.
6. AUDIO: "music_EN" must be detailed instrumental Suno prompt, no vocals.`;

async function callAPI(content, maxTokens = 8000, sysPrompt = VIRAL_SYSTEM) {
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }) });
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
      style={{background:ok?"rgba(34,197,94,.25)":"rgba(255,255,255,.05)",border:`1px solid ${ok?"#4ade80":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.7)",cursor:"pointer", transition:"all 0.2s"}}>
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
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [covX, setCovX] = useState(50);
  const [covY, setCovY] = useState(50);
  const [activePreset, setActivePreset] = useState("netflix");
  const [downloading, setDownloading] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { 
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ds_history"); 
      if (saved) setHistory(JSON.parse(saved)); 
    }
  }, []);

  const deleteFromHistory = (id) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("ds_history", JSON.stringify(updated));
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
      
      if (data.thumbnail) { setCovTitle(data.thumbnail.title || ""); setCovHook(data.thumbnail.hook || ""); setCovCta(data.thumbnail.cta || "СМОТРЕТЬ"); }
      
      let anchorStr = data.global_anchor_EN ? `[GLOBAL ANCHOR: ${data.global_anchor_EN}] ` : "";
      let rScript = "🎬 СЦЕНАРИЙ:\n" + (data.frames || []).map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n🎙 Диктор: «${f.voice}»`).join("\n\n");
      let imgList = "\n\n🖼 VEO IMAGE PROMPTS (8K):\n\n" + (data.frames || []).map(f => anchorStr + f.imgPrompt_EN).filter(Boolean).join("\n\n");
      let vidList = "\n\n🎥 GROK VIDEO PROMPTS (8K):\n\n" + (data.frames || []).map(f => anchorStr + f.vidPrompt_EN).filter(Boolean).join("\n\n");
      let bRollList = (data.b_rolls && data.b_rolls.length) ? "\n\n⚡ FLASH B-ROLLS:\n\n" + data.b_rolls.map(b => anchorStr + b).join("\n\n") : "";
      
      setRawPrompts(rScript + imgList + vidList + bRollList); 
      setView("result");

      if (!fromHistory) {
        const newItem = { id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString(), text: cleanText };
        const newHistory = [newItem, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem("ds_history", JSON.stringify(newHistory));
      }
    } catch (e) {
      alert("Ошибка парсинга. ИИ выдал кривой JSON. Попробуйте еще раз.");
      setView("form");
    }
  }

  async function handleDraftText(type) {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true);
    try {
      const sysTxt = type === 'draft' ? "Write only voiceover text. Dark documentary style." : "Add '...' and CAPS for dramatic emphasis.";
      const res = await callAPI(`Topic: ${topic}. Language: ${lang}. Current: ${script}`, 3000, sysTxt);
      setScript(res.trim());
    } catch(e) { alert(e.message); } finally { setBusy(false); }
  }

  async function handleTTS() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true);
    try {
      const res = await callAPI(`Provide TTS settings for: ${script.substring(0,100)}`, 1000, "VOICE: [Name], SPEED: [Value], STYLE PROMPT: [English instruction]");
      setTtsData(res.trim());
    } catch(e) { alert(e.message); } finally { setBusy(false); }
  }

  async function handleGenerateFullPlan() {
    if (!topic.trim() && !script.trim()) return alert("Заполните поля!");
    if (tokens <= 0) return alert("Кристаллы закончились");
    setBusy(true); setView("loading"); setLoadingMsg("Мастер-режиссер создает проект...");
    try {
      const req = `ТЕМА: ${topic}. ЖАНР: ${genre}. СТИЛЬ: ${VISUAL_ENGINES[engine].prompt}. СЦЕНАРИЙ: ${script}. ЯЗЫК: ${lang}. ВЫДАЙ JSON.`;
      const res = await callAPI(req);
      setTokens(t => t - 1);
      applyResult(res);
    } catch(e) { alert(e.message); setView("form"); } finally { setBusy(false); }
  }

  const downloadCover = () => {
    const el = document.getElementById("cover-export");
    setDownloading(true);
    import("html2canvas").then(h => h.default(el, { scale: 3 }).then(c => {
      const a = document.createElement("a"); a.href = c.toDataURL(); a.download = "cover.png"; a.click(); setDownloading(false);
    }));
  };

  const activeStyle = COVER_PRESETS.find(p => p.id === activePreset).style;

  return (
    <div style={{minHeight:"100vh", color:"#e2e8f0", position:"relative", paddingBottom:120}}>
      <NeuralBackground />
      
      <nav style={{display:"flex", justifyContent:"space-between", padding:20, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(15px)", position:"sticky", top:0, zIndex:10}}>
        <div style={{fontWeight:900, fontSize:22}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></div>
        <div style={{display:"flex", gap:15, alignItems:"center"}}>
          {view === "form" && rawPrompts && <button onClick={()=>setView("result")} style={{background:"none", border:"none", color:"#d8b4fe", fontSize:12, fontWeight:800, cursor:"pointer"}}>👁 РЕЗУЛЬТАТ</button>}
          <button onClick={()=>setShowHistory(true)} style={{background:"none", border:"none", color:"#fff", cursor:"pointer", fontWeight:700}}>🗄 АРХИВ</button>
          <div style={{background:"rgba(168,85,247,0.2)", border:"1px solid #a855f7", padding:"5px 15px", borderRadius:12, fontWeight:800}}>💎 {tokens}</div>
        </div>
      </nav>

      {view === "form" && (
        <div style={{maxWidth:600, margin:"30px auto", padding:"0 20px"}}>
          <div style={{background:"rgba(15,15,25,0.7)", padding:25, borderRadius:28, border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(20px)"}}>
            <label style={{fontSize:11, fontWeight:800, color:"#a855f7", letterSpacing:2, display:"block", marginBottom:10}}>ЦЕЛЬ ВАШЕГО ХИТА</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка Мертвой Руки..." style={{width:"100%", background:"#000", border:"1px solid #333", borderRadius:15, padding:15, color:"#fff", marginBottom:15, fontSize:16}} />
            <textarea value={script} onChange={e=>setScript(e.target.value)} placeholder="Текст диктора..." style={{width:"100%", background:"#000", border:"1px solid #333", borderRadius:15, padding:15, color:"#ccc", marginBottom:15, fontSize:14}} rows={4} />
            
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20}}>
               <button onClick={()=>handleDraftText('draft')} disabled={busy} style={{background:"rgba(255,255,255,0.05)", border:"1px solid #333", color:"#fff", padding:12, borderRadius:12, fontSize:12, cursor:"pointer"}}>✍️ Написать черновик</button>
               <button onClick={()=>handleDraftText('intonations')} disabled={busy} style={{background:"rgba(168,85,247,0.1)", border:"1px solid #a855f7", color:"#d8b4fe", padding:12, borderRadius:12, fontSize:12, cursor:"pointer"}}>🎭 Добавить интонации</button>
               <button onClick={handleTTS} style={{gridColumn:"1/-1", background:"rgba(14,165,233,0.1)", border:"1px dashed #0ea5e9", color:"#bae6fd", padding:12, borderRadius:12, fontSize:12, cursor:"pointer"}}>⚙️ Настройки голоса (Google AI Studio)</button>
            </div>
            {ttsData && <pre style={{padding:12, background:"#000", borderRadius:10, fontSize:11, color:"#34d399", marginBottom:15, whiteSpace:"pre-wrap"}}>{ttsData}</pre>}

            <button className="gbtn" onClick={handleGenerateFullPlan} disabled={busy} style={{width:"100%", height:60, borderRadius:18, border:"none", background:"linear-gradient(135deg,#6366f1,#a855f7,#ec4899)", color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer"}}>🚀 АКТИВИРОВАТЬ НЕЙРОСЕТЬ (💎 1)</button>
          </div>

          <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", marginTop:15, padding:15, background:"rgba(255,255,255,0.05)", border:"none", borderRadius:15, color:"#fff", fontWeight:700}}>⚙️ ТЕХНИЧЕСКИЕ НАСТРОЙКИ</button>
          {settingsOpen && (
            <div style={{padding:20, background:"rgba(0,0,0,0.4)", borderRadius:20, marginTop:10, display:"flex", flexDirection:"column", gap:15}}>
               <div>
                 <label style={{fontSize:11, color:"#94a3b8", display:"block", marginBottom:8}}>ВИЗУАЛЬНЫЙ ДВИЖОК</label>
                 <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                   {Object.entries(VISUAL_ENGINES).map(([k,v])=><button key={k} onClick={()=>setEngine(k)} style={{padding:10, borderRadius:10, border:engine===k?"1px solid #a855f7":"1px solid #333", background:engine===k?"#a855f722":"none", color:"#fff", fontSize:11}}>{v.label}</button>)}
                 </div>
               </div>
               <div>
                 <label style={{fontSize:11, color:"#94a3b8", display:"block", marginBottom:8}}>ЯЗЫК И ФОРМАТ</label>
                 <div style={{display:"flex", gap:10}}>
                    {["RU", "EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1, padding:10, borderRadius:10, border:lang===l?"1px solid #f59e0b":"1px solid #333", background:lang===l?"#f59e0b22":"none", color:"#fff"}}>{l}</button>)}
                    {FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1, padding:10, borderRadius:10, border:vidFormat===f.id?"1px solid #0ea5e9":"1px solid #333", background:vidFormat===f.id?"#0ea5e922":"none", color:"#fff"}}>{f.id}</button>)}
                 </div>
               </div>
               <div>
                 <label style={{fontSize:11, color:"#94a3b8", display:"block", marginBottom:8}}>ХРОНОМЕТРАЖ</label>
                 <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                   {DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{padding:"8px 12px", borderRadius:20, border:dur===d?"1px solid #fff":"1px solid #333", color:"#fff", fontSize:11}}>{d}</button>)}
                 </div>
               </div>
            </div>
          )}
        </div>
      )}

      {view === "loading" && <div style={{textAlign:"center", marginTop:120}}><div className="spinner"></div><p style={{fontWeight:800}}>{loadingMsg}</p></div>}

      {view === "result" && (
        <div style={{maxWidth:600, margin:"0 auto", padding:20}}>
          <button onClick={()=>setView("form")} style={{marginBottom:20, color:"#a855f7", background:"none", border:"none", fontWeight:800, cursor:"pointer"}}>← НАЗАД В МЕНЮ</button>
          
          {retention && (
             <div style={{background:"rgba(16,185,129,0.1)", border:"1px solid #34d399", borderRadius:16, padding:16, marginBottom:20}}>
                <div style={{fontSize:11, fontWeight:900, color:"#34d399"}}>📊 УДЕРЖАНИЕ: {retention.score}%</div>
                <p style={{fontSize:13, marginTop:5}}>{retention.feedback}</p>
             </div>
          )}

          <div style={{background:"rgba(15,15,25,0.7)", borderRadius:24, padding:25, border:"1px solid #333", marginBottom:25}}>
            <h3 style={{fontSize:14, marginBottom:20, color:"#a855f7"}}>🎨 СТУДИЯ ОБЛОЖКИ</h3>
            <div style={{display:"flex", gap:8, overflowX:"auto", marginBottom:20, paddingBottom:10}}>
              {COVER_PRESETS.map(p=>(
                <button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 15px", borderRadius:10, background:activePreset===p.id?"#a855f7":"#111", border:"none", color:"#fff", fontSize:12, whiteSpace:"nowrap"}}>{p.label}</button>
              ))}
            </div>

            <div id="cover-export" style={{width:300, aspectRatio:vidFormat==="9:16"?"9/16":"16/9", margin:"0 auto", position:"relative", overflow:"hidden", background: bgImage ? `url(${bgImage}) center/cover` : "#111"}}>
              <div style={{position:"absolute", inset:0, background:`rgba(0,0,0,${covDark/100})`}}></div>
              <div style={{position:"absolute", left:`${covX}%`, top:`${covY}%`, transform:"translate(-50%,-50%)", width:"90%", display: "flex", flexDirection: "column", ...activeStyle.container}}>
                <div style={activeStyle.hook}>{covHook}</div>
                <div style={activeStyle.title}>{covTitle}</div>
                <div style={activeStyle.cta}>{covCta || "СМОТРЕТЬ"}</div>
              </div>
            </div>

            <div style={{marginTop:20, display:"flex", flexDirection:"column", gap:15}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:15}}>
                <div><label style={{fontSize:10}}>ПОЗИЦИЯ X</label><input type="range" value={covX} onChange={e=>setCovX(e.target.value)} style={{width:"100%"}} /></div>
                <div><label style={{fontSize:10}}>ПОЗИЦИЯ Y</label><input type="range" value={covY} onChange={e=>setCovY(e.target.value)} style={{width:"100%"}} /></div>
              </div>
              <input value={covTitle} onChange={e=>setCovTitle(e.target.value)} style={{background:"#000", border:"1px solid #333", padding:10, borderRadius:8, color:"#fff"}} placeholder="Заголовок" />
              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, textAlign:"center", padding:12, background:"rgba(255,255,255,0.05)", border:"1px solid #333", borderRadius:12, fontSize:12, cursor:"pointer"}}>📷 ФОН<input type="file" hidden onChange={e=>{const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setBgImage(ev.target.result); r.readAsDataURL(f);}}} /></label>
                <button onClick={downloadCover} style={{flex:1, background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:12, color:"#fff", fontSize:12, fontWeight:900}}>{downloading?"...":"💾 СКАЧАТЬ"}</button>
              </div>
            </div>
          </div>

          <div style={{display:"flex", gap:20, borderBottom:"1px solid #333", marginBottom:20}}>
            <button onClick={()=>setTab("storyboard")} style={{padding:"10px 0", color:tab==="storyboard"?"#a855f7":"#888", borderBottom:tab==="storyboard"?"2px solid #a855f7":"none", background:"none", border:"none", fontWeight:800}}>РАСКАДРОВКА</button>
            <button onClick={()=>setTab("raw")} style={{padding:"10px 0", color:tab==="raw"?"#a855f7":"#888", borderBottom:tab==="raw"?"2px solid #a855f7":"none", background:"none", border:"none", fontWeight:800}}>ПРОМПТЫ</button>
            <button onClick={()=>setTab("seo")} style={{padding:"10px 0", color:tab==="seo"?"#a855f7":"#888", borderBottom:tab==="seo"?"2px solid #a855f7":"none", background:"none", border:"none", fontWeight:800}}>SEO</button>
          </div>

          {tab === "storyboard" && frames.map((f,i)=><div key={i} style={{background:"rgba(255,255,255,0.05)", padding:20, borderRadius:15, marginBottom:10}}><strong>{f.timecode}</strong><p style={{marginTop:10}}>{f.voice}</p></div>)}
          {tab === "raw" && (
            <div>
              <div style={{display:"flex", justifyContent:"flex-end", marginBottom:10}}><CopyBtn text={rawPrompts} label="Копировать ВСЁ" /></div>
              <pre style={{whiteSpace:"pre-wrap", background:"#000", padding:20, borderRadius:15, fontSize:12, color:"#ccc"}}>{rawPrompts}</pre>
            </div>
          )}
          {tab === "seo" && seo && (
            <div style={{display:"flex", flexDirection:"column", gap:15}}>
              <div style={{background:"#111", padding:15, borderRadius:12}}><strong>🎵 MUSIC:</strong><p style={{color:"#fbbf24", fontSize:13, marginTop:5}}>{music}</p></div>
              <div style={{background:"#111", padding:15, borderRadius:12}}><strong>🚀 ЗАГОЛОВКИ:</strong><ul style={{fontSize:13, paddingLeft:20, marginTop:10}}>{seo.titles.map((t,i)=><li key={i}>{t}</li>)}</ul></div>
              <div style={{background:"#111", padding:15, borderRadius:12}}><strong>🏷 ТЕГИ:</strong><p style={{fontSize:12, color:"#60a5fa", marginTop:5}}>{seo.tags.join(" ")}</p></div>
            </div>
          )}
        </div>
      )}

      {showHistory && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, display:"flex", justifyContent:"center", alignItems:"center"}}>
          <div style={{width:400, background:"#0a0a0f", borderRadius:28, height:"80vh", display:"flex", flexDirection:"column", border:"1px solid #333"}}>
            <div style={{padding:20, borderBottom:"1px solid #222", display:"flex", justifyContent:"space-between"}}>
              <strong>АРХИВ ПРОЕКТОВ</strong>
              <button onClick={()=>setShowHistory(false)} style={{background:"none", border:"none", color:"#fff", fontSize:20}}>✕</button>
            </div>
            <div style={{flex:1, overflowY:"auto", padding:15}}>
              {history.map(i=>(
                <div key={i.id} style={{background:"#16161c", padding:15, borderRadius:15, marginBottom:10, position:"relative"}}>
                  <div onClick={()=>{applyResult(i.text, true); setShowHistory(false);}} style={{cursor:"pointer"}}>
                    <div style={{fontSize:10, color:"#a855f7"}}>{i.time}</div>
                    <div style={{fontWeight:700, marginTop:5}}>{i.topic}</div>
                  </div>
                  <button onClick={()=>deleteFromHistory(i.id)} style={{position:"absolute", right:15, top:20, background:"none", border:"none", color:"#ef4444", fontSize:16, cursor:"pointer"}}>🗑️</button>
                </div>
              ))}
            </div>
            <div style={{padding:20}}>
               <button onClick={clearHistory} style={{width:"100%", padding:12, borderRadius:12, border:"1px solid #ef4444", color:"#ef4444", background:"none", fontWeight:700, cursor:"pointer"}}>ОЧИСТИТЬ АРХИВ</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gbtn { transition: all 0.3s; }
        .gbtn:hover { filter: brightness(1.2); transform: translateY(-2px); }
        .spinner { width: 40px; height: 40px; border: 4px solid #a855f722; border-top: 4px solid #a855f7; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
