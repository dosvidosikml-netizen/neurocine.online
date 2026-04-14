// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- ЖИВОЙ ФОН НЕЙРОСЕТИ ---
const NeuralBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();

    for (let i = 0; i < 50; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8 });

    const render = () => {
      ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168, 85, 247, 0.8)"; ctx.strokeStyle = "rgba(168, 85, 247, 0.25)"; ctx.lineWidth = 1;
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]; const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
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

// --- КОНСТАНТЫ И ПРЕСЕТЫ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ef4444" }, 
  "ТАЙНА":         { icon:"🔍", col:"#a855f7" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316" }, 
  "НАУКА":         { icon:"⚗",  col:"#06b6d4" },
  "ВОЙНА":         { icon:"⚔",  col:"#dc2626" }, 
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899" }, 
  "ЗАГАДКИ":       { icon:"👁", col:"#fbbf24" },
};

const FORMATS = [ { id:"9:16", label:"Вертикальный", ratio:"9/16" }, { id:"16:9", label:"Горизонтальный", ratio:"16/9" }, { id:"1:1", label:"Квадрат", ratio:"1/1" } ];

const VISUAL_ENGINES = {
  "CINEMATIC": { label: "Кино-реализм", prompt: "cinematic realism, photorealistic, deep shadows, Arri Alexa 65" },
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge, dirty vintage film effect, scratches, bleak atmosphere, heavy vignette, Arri Alexa 65" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm soft lighting" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "x-ray exploded view, detailed engineering diagram, glowing internal parts, technical cross-section render" }
};

const DURATION_SECONDS = { "15 сек": 15, "30–45 сек": 40, "До 60 сек": 60, "1.5 мин": 90, "3 мин": 180 };
const DURATIONS = Object.keys(DURATION_SECONDS);

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,0.9)", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", borderBottom: "1px solid #e50914", paddingBottom: 4, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 } } },
  { id: "mrbeast", label: "MrBeast", style: { container: { alignItems: "center" }, hook: { fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", textTransform: "uppercase", WebkitTextStroke: "1px #000", textShadow: "3px 3px 0 #000", transform: "rotate(-3deg)", marginBottom: 4 }, title: { fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "2px #000", textShadow: "5px 5px 0 #000, 0 0 40px #ff00ff", transform: "rotate(-3deg)", textAlign: "center", marginBottom: 16 }, cta: { fontSize: 13, fontWeight: 900, color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "6px 14px", borderRadius: 8, textTransform: "uppercase", transform: "rotate(-3deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" } } },
  { id: "tiktok", label: "TikTok", style: { container: { alignItems: "center" }, hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12 }, title: { fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 11, fontWeight: 900, color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "truecrime", label: "True Crime", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#000", background: "#ffdd00", padding: "4px 8px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, background: "#000", padding: "4px 12px", borderLeft: "4px solid #ffdd00", textAlign: "left", marginBottom: 12 }, cta: { color: "#aaa", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "history", label: "Dark History", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 400, fontFamily: "'Georgia', serif", color: "#d4af37", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 36, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 10px 30px #000, 0 2px 4px #000", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 2, textTransform: "uppercase", borderTop: "1px solid #d4af37", paddingTop: 6 } } },
  { id: "breaking", label: "Новости", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", background: "#ef4444", padding: "4px 10px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 32, fontWeight: 900, fontFamily: "sans-serif", color: "#000", background: "#fff", padding: "4px 12px", textTransform: "uppercase", lineHeight: 1.1, textAlign: "left", marginBottom: 12 }, cta: { fontSize: 12, fontWeight: 900, color: "#ef4444", textTransform: "uppercase", background:"#000", padding:"2px 8px" } } },
  { id: "cyber", label: "Cyberpunk", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#fef08a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, textShadow: "0 0 10px #fef08a" }, title: { fontSize: 34, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "2px 2px 0px #0ea5e9, -2px -2px 0px #ec4899", textAlign: "center", marginBottom: 12, fontStyle: "italic" }, cta: { fontSize: 11, fontWeight: 900, color: "#000", background: "#0ea5e9", padding: "4px 12px", textTransform: "uppercase", boxShadow: "0 0 15px #0ea5e9" } } },
  { id: "minimal", label: "Minimal", style: { container: { alignItems: "center" }, hook: { fontSize: 10, fontWeight: 500, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", letterSpacing: 4, marginBottom: 12, opacity: 0.7 }, title: { fontSize: 30, fontWeight: 300, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.2, textAlign: "center", marginBottom: 16, letterSpacing: 2 }, cta: { fontSize: 9, fontWeight: 400, color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "edge", label: "Vertical Edge", style: { container: { left: "15%", top: "50%", transform: "translate(-50%, -50%) rotate(-90deg)", alignItems: "flex-end", width: "120%", height:"auto" }, hook: { fontSize: 14, color: "#fff", background: "#ef4444", padding: "4px 12px", letterSpacing: 2 }, title: { fontSize: 44, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", whiteSpace:"nowrap", textShadow:"0 4px 10px rgba(0,0,0,0.8)" }, cta: { display:"none" } } },
  { id: "zpattern", label: "Z-Pattern", style: { container: { left: "0", top: "0", transform: "none", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding:"30px 20px" }, hook: { alignSelf: "flex-start", fontSize: 13, background: "#fff", color: "#000", padding: "6px 12px", fontWeight:900 }, title: { alignSelf: "center", textAlign: "center", fontSize: 36, fontWeight: 900, color: "#fff", textShadow: "0 8px 30px #000" }, cta: { alignSelf: "flex-end", fontSize: 12, color: "#0ea5e9", borderBottom: "2px solid #0ea5e9", paddingBottom:4, fontWeight:900 } } },
  { id: "sidebar", label: "Sidebar", style: { container: { left: "0", top: "0", transform: "none", width: "45%", height: "100%", background: "rgba(0,0,0,0.85)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", borderRight: "2px solid #a855f7" }, hook: { color: "#a855f7", fontSize: 12, marginBottom: 15, fontWeight:800, letterSpacing:1 }, title: { color: "#fff", fontSize: 26, fontWeight: 900, textAlign: "left", marginBottom: 25, lineHeight:1.1 }, cta: { color: "#000", background: "#a855f7", padding: "8px 16px", fontSize: 10, fontWeight:900, textTransform:"uppercase" } } },
  { id: "cinematic", label: "Cinematic", style: { container: { left: "0", top: "0", transform: "none", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }, hook: { width: "100%", background: "#000", color: "#fff", textAlign: "center", padding: "12px", fontSize: 11, letterSpacing: 4, textTransform:"uppercase" }, title: { width: "100%", background: "#000", color: "#fff", textAlign: "center", padding: "20px 10px", fontSize: 28, fontWeight: 900, marginBottom: 0, textTransform:"uppercase" }, cta: { position: "absolute", bottom: "12%", fontSize: 10, color: "#fff", border: "1px solid rgba(255,255,255,0.5)", padding: "6px 14px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(5px)" } } }
];

// --- СИСТЕМНЫЕ ПРОМПТЫ ---
const SYS_STEP_1 = `You are 'Director-X'. Output ONLY valid JSON.
Create a storyboard, voiceover, sfx, and SEO. 
ALL CONTENT MUST BE IN TARGET LANGUAGE EXCEPT "_EN" FIELDS.
Rule: Do NOT write "Диктор: " in the voice text. Just the words.
Rule: SEO titles must have a curiosity gap. Description MUST end on a cliffhanger.
Rule: Provide EXACTLY 5 hashtags (2 broad, 3 specific). 
Rule: Music prompt MUST be a rich cinematic description for Suno AI (15-20 words). DO NOT just list 3 words.
Rule: For character_ref_EN, if the story mentions ANY human, historical figure, or mysterious silhouette (e.g., 'Iron Mask', 'Sniper'), YOU MUST create the Character Reference sheet. Use 'No character' ONLY if the story is strictly an empty landscape or mechanism without people.

JSON FORMAT:
{
  "character_ref_EN": "Create a professional character reference sheet for: [CHARACTER DESC]. Use a clean, neutral solid background and present the sheet as a technical model turnaround in a photographic style. Organize the composition into two horizontal rows. Top row: four full-body views... (front, left, right, back). Bottom row: three close-up portraits. A-pose, accurate anatomy, identical flat lighting. 8k. (IF NO CHARACTER IN STORY, WRITE: 'No character in this scene')",
  "location_ref_EN": "A wide architectural establishing shot of [LOCATION], empty space, highly detailed environment design, clean perspective, 8k.",
  "style_ref_EN": "[Era/Atmosphere tags, e.g., 1980s Soviet cold war aesthetic, grainy vintage film, dim fluorescent lighting, muted colors]",
  "retention": { "score": 95, "feedback": "Анализ..." },
  "frames": [ 
    { "timecode": "0-3 сек", "camera": "Наезд", "visual": "Описание кадра", "sfx": "Шум", "text_on_screen": "ТИТР", "voice": "Текст диктора" } 
  ],
  "thumbnail": { "title": "ЗАГОЛОВАК", "hook": "ХУК", "cta": "СМОТРЕТЬ" },
  "music_EN": "Dark cinematic orchestral score, ominous deep cello, eerie atmospheric choir, high tension buildup, ticking clock rhythm, 120 BPM, thriller soundtrack",
  "seo": { "titles": ["Viral Title 1", "Viral Title 2"], "desc": "Cliffhanger...", "tags": ["#broad1", "#niche1", "#niche2", "#niche3", "#niche4"] }
}`;

const SYS_STEP_2 = `You are an Elite AI Prompter. Output ONLY valid JSON. DO NOT use newlines (\\n) inside string values.
Based on the storyboard, generate highly detailed English visual descriptions for frames.
DO NOT add style tags (like 8k, cinematic, 2.5D), DO NOT add audio descriptions. JUST the pure visual subject and action. Make them 20-30 words.

JSON FORMAT:
{
  "frames_prompts": [ { "imgPrompt_EN": "A close up of...", "vidPrompt_EN": "A close up of..." } ],
  "b_rolls": [ "Extreme close up of...", "Detailed English prompt 2..." ],
  "thumbnail_prompt_EN": "Highly detailed English prompt for the thumbnail background. Rule: Main subject (face or artifact) MUST take 40-60% of the frame. Emotion: shock/mystery. MUST include: 'dark empty background space for text layout', 8k, photorealistic."
}`;

// --- ФУНКЦИИ ---
async function callAPI(content, maxTokens = 4000, sysPrompt) {
  try {
    const res = await fetch("/api/chat", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], max_tokens: maxTokens }) 
    });
    const textRes = await res.text();
    let data;
    try { data = JSON.parse(textRes); } catch (e) { throw new Error(`Сервер вернул не JSON: ${textRes.substring(0, 100)}`); }
    if (!res.ok || data.error) throw new Error(data.error || `Ошибка сервера: ${res.status}`);
    return data.text || "";
  } catch (e) { throw e; }
}

function cleanJSON(rawText) {
  let cleanText = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
  const startIdx = cleanText.indexOf('{'); const endIdx = cleanText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) cleanText = cleanText.substring(startIdx, endIdx + 1);
  cleanText = cleanText.replace(/\r?\n|\r/g, " ").replace(/[\u0000-\u001F]+/g, "");
  return JSON.parse(cleanText);
}

function CopyBtn({ text, label="Копировать", small=false }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={e=>{ e.stopPropagation(); try{navigator.clipboard?.writeText(text)}catch{}; setOk(true); setTimeout(()=>setOk(false),2000); }}
      style={{background:ok?"rgba(34,197,94,.25)":"rgba(255,255,255,.05)",border:`1px solid ${ok?"#4ade80":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.7)",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
      {ok?"✓ СКОПИРОВАНО":label}
    </button>
  );
}

export default function Page() {
  const [tokens, setTokens] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const [topic, setTopic] = useState("");
  const [finalTwist, setFinalTwist] = useState(""); 
  const [genre, setGenre] = useState("ТАЙНА");
  const [script, setScript] = useState("");
  const [dur, setDur] = useState("До 60 сек");
  const [vidFormat, setVidFormat] = useState("9:16");
  const [engine, setEngine] = useState("CINEMATIC");
  const [customStyle, setCustomStyle] = useState(""); 
  const [lang, setLang] = useState("RU"); 
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [showTTS, setShowTTS] = useState(false);
  const [hooksList, setHooksList] = useState([]); 

  const [view, setView] = useState("form");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [tab, setTab] = useState("storyboard");
  
  const [frames, setFrames] = useState([]);
  const [bRolls, setBRolls] = useState([]);
  const [retention, setRetention] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [music, setMusic] = useState("");
  const [seo, setSeo] = useState(null);
  const [charRef, setCharRef] = useState("");
  const [locRef, setLocRef] = useState("");
  const [styleRef, setStyleRef] = useState("");
  const [step2Done, setStep2Done] = useState(false);
  const [busy, setBusy] = useState(false);

  const [rawScript, setRawScript] = useState("");
  const [rawImg, setRawImg] = useState("");
  const [rawVid, setRawVid] = useState("");

  const [bgImage, setBgImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false); 
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [covX, setCovX] = useState(50);
  const [covY, setCovY] = useState(50);
  const [activePreset, setActivePreset] = useState("netflix");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const scrollRef = useRef(null);

  // --- ИНИЦИАЛИЗАЦИЯ И БИЛЛИНГ ---
  useEffect(() => { 
    if (typeof window !== "undefined") { 
      // Загрузка Истории
      const savedHist = localStorage.getItem("ds_history"); 
      if (savedHist) setHistory(JSON.parse(savedHist)); 

      // Загрузка Черновика
      const savedDraft = localStorage.getItem("ds_draft");
      if (savedDraft) {
         try {
           const d = JSON.parse(savedDraft);
           if (d.topic) setTopic(d.topic);
           if (d.script) setScript(d.script);
           if (d.genre) setGenre(d.genre);
           if (d.finalTwist) setFinalTwist(d.finalTwist);
         } catch(e){}
      }
      setDraftLoaded(true);

      // Загрузка Биллинга (Кристаллы)
      const today = new Date().toLocaleDateString();
      const savedBilling = localStorage.getItem("ds_billing");
      if (savedBilling) {
        try {
          const b = JSON.parse(savedBilling);
          if (b.date !== today) {
            setTokens(3);
            localStorage.setItem("ds_billing", JSON.stringify({ tokens: 3, date: today }));
          } else {
            setTokens(b.tokens);
          }
        } catch(e) { setTokens(3); }
      } else {
        localStorage.setItem("ds_billing", JSON.stringify({ tokens: 3, date: today }));
        setTokens(3);
      }
    } 
  }, []);

  useEffect(() => {
    if (draftLoaded) localStorage.setItem("ds_draft", JSON.stringify({topic, script, genre, finalTwist}));
  }, [topic, script, genre, finalTwist, draftLoaded]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({top:0,behavior:"smooth"}); }, [view]);

  // Списание кристалла
  const deductToken = () => {
    setTokens(prev => {
      const next = prev - 1;
      localStorage.setItem("ds_billing", JSON.stringify({ tokens: next, date: new Date().toLocaleDateString() }));
      return next;
    });
  };

  const checkTokens = () => { 
    if (tokens <= 0) { 
      setShowPaywall(true); 
      return false; 
    } 
    return true; 
  };

  const deleteFromHistory = (id) => { setHistory(prev => { const next = prev.filter(item => item.id !== id); localStorage.setItem("ds_history", JSON.stringify(next)); return next; }); };
  const clearHistory = () => { if(confirm("Очистить архив проектов?")) { setHistory([]); localStorage.removeItem("ds_history"); } };

  async function handleGenerateHooks() {
    if (!topic.trim()) return alert("Сначала введите Тему!");
    setBusy(true); setLoadingMsg("Придумываем кликбейты..."); setView("loading");
    try {
      const text = await callAPI(`Topic: ${topic}`, 2000, `You are a viral TikTok producer. Write 3 powerful hooks (1 sentence each) in RUSSIAN. Genre: ${genre}. Provide valid JSON array of 3 strings ONLY. Format: ["Хук 1", "Хук 2", "Хук 3"]`);
      const arr = cleanJSON(text); if(Array.isArray(arr)) setHooksList(arr);
    } catch(e) { alert("🚨 ОШИБКА ГЕНЕРАЦИИ ХУКОВ: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleDraftText() {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true); setLoadingMsg("Пишем сценарий..."); setView("loading");
    try {
      const sec = DURATION_SECONDS[dur] || 60; const maxWords = Math.floor(sec * 2.2); 
      const sysTxt = `You are 'Director-X'. Напиши ТОЛЬКО текст диктора на РУССКОМ ЯЗЫКЕ. Без слова "Диктор:". Жанр: ${genre}. ОГРАНИЧЕНИЕ: СТРОГО не более ${maxWords} слов! ${finalTwist ? `Сохраняй интригу (${finalTwist}) до финала.` : ""}`;
      const text = await callAPI(`Тема: ${topic}`, 3000, sysTxt);
      setScript(text.replace(/Диктор:\s*/gi, "").trim()); setHooksList([]);
    } catch(e) { alert("🚨 ОШИБКА ГЕНЕРАЦИИ ТЕКСТА: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleIntonations() {
    if (!script.trim()) return alert("Нет текста!");
    setBusy(true); setLoadingMsg("Разметка интонаций..."); setView("loading");
    try {
      const text = await callAPI(script, 3000, `You are an Audio Director. Расставь паузы (...) и выдели КАПСОМ слова для акцента в РУССКОМ тексте. Жанр: ${genre}.`);
      setScript(text.trim());
    } catch(e) { alert("🚨 ОШИБКА ИНТОНАЦИЙ: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  function rebuildRawText(frms, s2done) {
    let scriptTxt = frms.map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n👁 Визуал: ${f.visual}\n🔊 Звук: ${f.sfx||''}\n🔤 Титры: ${f.text_on_screen||''}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    let imgTxt = s2done ? frms.map(f => f.imgPrompt_EN).filter(Boolean).join("\n\n") : "";
    let vidTxt = s2done ? frms.map(f => f.vidPrompt_EN).filter(Boolean).join("\n\n") : "";
    
    setRawScript(scriptTxt); setRawImg(imgTxt); setRawVid(vidTxt);
  }

  async function handleStep1() {
    if (!topic.trim() && !script.trim()) return alert("Заполните тему или скрипт!");
    if (!checkTokens()) return;
    setBusy(true); setLoadingMsg("Шаг 1: Создаем раскадровку и режиссуру..."); setView("loading");
    try {
      let currentScript = script.trim();
      const sec = DURATION_SECONDS[dur] || 60;
      if (!currentScript) {
        const maxWords = Math.floor(sec * 2.2);
        currentScript = await callAPI(`Тема: ${topic}`, 3000, `Write only voiceover text in ${lang === "RU" ? "Russian" : "English"}. MUST be under ${maxWords} words. DO NOT WRITE "Narrator:" or "Диктор:".`);
        setScript(currentScript.trim());
      }
      
      const targetFrames = Math.floor(sec / 3);
      const req = `LANGUAGE FOR SCENARIO/SEO: ${lang === "RU" ? "РУССКИЙ" : "ENGLISH"}.
ТЕМА: ${topic}. ЖАНР: ${genre}. ТВИСТ В ФИНАЛЕ: ${finalTwist}. СЦЕНАРИЙ: ${currentScript}. 
ВЫДАЙ СТРОГО JSON! СТРОГО 3 СЕКУНДЫ НА СЦЕНУ. РОВНО ${targetFrames} КАДРОВ.`;

      const text = await callAPI(req, 8000, SYS_STEP_1);
      const data = cleanJSON(text);
      
      setFrames(data.frames || []); 
      setRetention(data.retention || null);
      setThumb(data.thumbnail || null); 
      setMusic(data.music_EN || ""); 
      setSeo(data.seo || null);
      
      setCharRef(data.character_ref_EN || ""); 
      setLocRef(data.location_ref_EN || ""); 
      setStyleRef(data.style_ref_EN || ""); 
      
      setBRolls([]); setStep2Done(false);
      
      if (data.thumbnail) { setCovTitle(data.thumbnail.title || ""); setCovHook(data.thumbnail.hook || ""); setCovCta(data.thumbnail.cta || "СМОТРЕТЬ"); }
      
      rebuildRawText(data.frames || [], false);
      deductToken(); 
      setBgImage(null); setTab("storyboard"); setView("result");
      
      const stateData = { frames: data.frames, charRef: data.character_ref_EN, locRef: data.location_ref_EN, styleRef: data.style_ref_EN, retention: data.retention, thumb: data.thumbnail, seo: data.seo, music: data.music_EN, step2Done: false };
      const newHistory = [{ id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString("ru-RU"), text: JSON.stringify(stateData), format: vidFormat }, ...history].slice(0, 10);
      setHistory(newHistory); localStorage.setItem("ds_history", JSON.stringify(newHistory));
      
    } catch(e) { alert(`🚨 ОШИБКА ШАГА 1: ${e.message}\nПроверьте логи Vercel.`); setView("form"); } finally { setBusy(false); }
  }

  async function handleStep2() {
    if (!checkTokens()) return;
    setBusy(true); setLoadingMsg("Шаг 2: Генерируем 8k PRO-промпты..."); setView("loading");
    try {
      const storyboardLite = frames.map((f, i) => `Frame ${i+1}: Visual: ${f.visual}`).join("\n");
      const req = `STORYBOARD:
${storyboardLite}

Generate exactly ${frames.length} English visual prompts. Make them 20-30 words. No audio/style tags.`;

      const text = await callAPI(req, 8000, SYS_STEP_2);
      const data = cleanJSON(text);
      
      const updatedFrames = frames.map((f, i) => {
        const p = data.frames_prompts && data.frames_prompts[i] ? data.frames_prompts[i] : {};
        const engineStyle = VISUAL_ENGINES[engine]?.prompt || "";
        const customText = customStyle ? `, ${customStyle}` : "";
        const finalStyle = `${styleRef ? styleRef + ", " : ""}${engineStyle}${customText}`;
        const sfxText = f.sfx ? `, with ASMR audio of ${f.sfx}` : "";
        
        let vPrompt = (p.vidPrompt_EN || f.visual) + sfxText + `, ${finalStyle}, 8k, masterpiece`;
        let iPrompt = (p.imgPrompt_EN || f.visual) + `, ${finalStyle}, 8k, masterpiece`;

        return { ...f, imgPrompt_EN: iPrompt, vidPrompt_EN: vPrompt };
      });
      
      let updatedThumb = thumb;
      if(data.thumbnail_prompt_EN && thumb) updatedThumb = {...thumb, prompt_EN: data.thumbnail_prompt_EN};

      setFrames(updatedFrames); 
      setBRolls(data.b_rolls || []);
      setThumb(updatedThumb);
      setStep2Done(true);
      
      rebuildRawText(updatedFrames, true);
      deductToken();
      setView("result");

      setHistory(prev => {
         const next = [...prev];
         if(next.length > 0) { 
           const stateData = { frames: updatedFrames, charRef, locRef, styleRef, retention, thumb: updatedThumb, seo, music, bRolls: data.b_rolls, step2Done: true };
           next[0].text = JSON.stringify(stateData); 
           localStorage.setItem("ds_history", JSON.stringify(next)); 
         }
         return next;
      });

    } catch(e) { alert(`🚨 ОШИБКА ШАГА 2: ${e.message}`); setView("result"); } finally { setBusy(false); }
  }

  function handleImageUpload(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setBgImage(ev.target.result); reader.readAsDataURL(file); }
  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export"); if (!el) return;
    setDownloading(true); const wasSafeZone = showSafeZone; setShowSafeZone(false); 
    setTimeout(() => {
      if (!window.html2canvas) { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload = doCapture; document.body.appendChild(s); } else doCapture();
      function doCapture() {
        window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(c => { const a = document.createElement('a'); a.download = `Cover_${Date.now()}.png`; a.href = c.toDataURL(); a.click(); setDownloading(false); setShowSafeZone(wasSafeZone); }).catch(() => { setDownloading(false); setShowSafeZone(wasSafeZone); alert("Ошибка рендера"); });
      }
    }, 100);
  }

  const S = {
    root: { minHeight:"100vh", color:"#e2e8f0", paddingBottom:120, overflowY:"auto", position:"relative", zIndex:1 },
    nav: { position:"sticky", top:0, zIndex:50, background:"rgba(5,5,10,.5)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.05)", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    section: { marginBottom:24, background:"rgba(15,15,25,.4)", border:"1px solid rgba(255,255,255,.08)", borderRadius:24, padding:24, backdropFilter:"blur(20px)", boxShadow:"0 10px 40px rgba(0,0,0,0.2)" },
    label: { fontSize:11, fontWeight:800, letterSpacing:2, color:"#94a3b8", display:"block", marginBottom:12, textTransform:"uppercase" }
  };
  const currFormat = FORMATS.find(f=>f.id === vidFormat) || FORMATS[0]; const activeStyle = COVER_PRESETS.find(p => p.id === activePreset).style;

  return (
    <div ref={scrollRef} style={S.root}>
      <NeuralBackground />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Montserrat:wght@800;900&display=swap');
        @keyframes blink { 0%, 100% {opacity:1} 50% {opacity:0.3} }
        @keyframes pulse-glow { 0% {box-shadow: 0 0 15px rgba(236,72,153,0.5);} 50% {box-shadow: 0 0 30px rgba(236,72,153,1);} 100% {box-shadow: 0 0 15px rgba(236,72,153,0.5);} }
        @keyframes spin {to{transform:rotate(360deg)}}
        .gbtn{width:100%;height:56px;border:none;border-radius:16px;cursor:pointer;font-weight:900;color:#fff;background:linear-gradient(135deg,#4f46e5,#9333ea,#ec4899);transition:all .2s;box-shadow: 0 4px 20px rgba(168,85,247,0.4);}
        .gbtn:hover{transform:translateY(-2px);filter:brightness(1.1);}
        textarea:focus, input:focus {outline:none;border-color:rgba(168,85,247,.6)!important;background:rgba(0,0,0,.6)!important;}
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #a855f7; cursor: pointer; margin-top: -6px; box-shadow: 0 0 10px #a855f7; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 2px; }
        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Экран Жадности (Paywall) */}
      {showPaywall && (
        <div style={{position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{background:"#111827", border:"1px solid #a855f7", borderRadius:24, padding:30, maxWidth:400, textAlign:"center", position:"relative", boxShadow:"0 10px 50px rgba(168,85,247,0.3)"}}>
            <button onClick={()=>setShowPaywall(false)} style={{position:"absolute", top:15, right:15, background:"none", border:"none", color:"#9ca3af", fontSize:24, cursor:"pointer"}}>×</button>
            <div style={{fontSize:50, marginBottom:10}}>💎</div>
            <h2 style={{fontSize:22, fontWeight:900, color:"#fff", marginBottom:10}}>Магия на сегодня закончилась!</h2>
            <p style={{fontSize:14, color:"#cbd5e1", marginBottom:24, lineHeight:1.5}}>Вы исчерпали свой бесплатный лимит (3 кристалла). Возвращайтесь завтра или оформите PRO-подписку для безлимитной генерации контента.</p>
            <button onClick={()=>setShowPaywall(false)} style={{width:"100%", background:"linear-gradient(135deg, #a855f7, #ec4899)", border:"none", padding:"16px", borderRadius:16, color:"#fff", fontWeight:900, fontSize:14, cursor:"pointer"}}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {showHistory && (
        <div style={{position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{background:"#111827", border:"1px solid #374151", borderRadius:24, width:"100%", maxWidth:500, maxHeight:"80vh", display:"flex", flexDirection:"column", overflow:"hidden"}}>
            <div style={{padding:"20px 24px", borderBottom:"1px solid #374151", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
               <h2 style={{fontSize:18, fontWeight:900, color:"#fff"}}>🗄 Архив Проектов</h2>
               <button onClick={()=>setShowHistory(false)} style={{background:"none", border:"none", color:"#9ca3af", fontSize:24, cursor:"pointer"}}>×</button>
            </div>
            <div style={{padding:20, overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:12}}>
              {history.length === 0 ? (
                <div style={{color:"#9ca3af", textAlign:"center", padding:20}}>Архив пуст</div>
              ) : history.map(item => (
                <div key={item.id} style={{background:"rgba(255,255,255,0.05)", borderRadius:16, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14, fontWeight:800, color:"#d8b4fe", marginBottom:4}}>{item.topic || "Без названия"}</div>
                    <div style={{fontSize:11, color:"#9ca3af"}}>{item.time} • {item.format || "9:16"}</div>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <button onClick={()=>{
                      const d = JSON.parse(item.text);
                      setFrames(d.frames || []);
                      setRetention(d.retention || null);
                      setThumb(d.thumb || null);
                      setMusic(d.music || "");
                      setSeo(d.seo || null);
                      setCharRef(d.charRef || "");
                      setLocRef(d.locRef || "");
                      setStyleRef(d.styleRef || "");
                      setBRolls(d.bRolls || []);
                      setStep2Done(d.step2Done || false);
                      if(d.thumb) { setCovTitle(d.thumb.title || ""); setCovHook(d.thumb.hook || ""); setCovCta(d.thumb.cta || "СМОТРЕТЬ"); }
                      rebuildRawText(d.frames || [], d.step2Done);
                      setShowHistory(false);
                      setView("result");
                    }} style={{background:"#10b981", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer"}}>ОТКРЫТЬ</button>
                    <button onClick={()=>deleteFromHistory(item.id)} style={{background:"#ef4444", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer"}}>УДАЛИТЬ</button>
                  </div>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <div style={{padding:"16px 20px", borderTop:"1px solid #374151"}}>
                 <button onClick={clearHistory} style={{width:"100%", background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:12, fontWeight:800, cursor:"pointer"}}>ОЧИСТИТЬ АРХИВ</button>
              </div>
            )}
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
          {view==="form" && frames.length>0 && <button onClick={()=>setView("result")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>›</button>}
        </div>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#cbd5e1",fontSize:12,fontWeight:700, cursor:"pointer"}}>🗄 АРХИВ</button>
          <div style={{fontSize:11, fontWeight:800, color:tokens>0?"#34d399":"#ef4444", background:"rgba(255,255,255,0.05)", padding:"6px 12px", borderRadius:10}}>💎 {tokens}</div>
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"30px 20px"}}>
          
          <div style={{...S.section, borderColor:"rgba(168,85,247,0.4)"}}>
            <label style={{...S.label, color:"#d8b4fe"}}>🎯 ИДЕЯ ИЛИ ТЕМА ХИТА</label>
            <textarea rows={2} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:18,fontSize:16,color:"#fff", resize:"none", marginBottom:12}}/>
            <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Скрытый твист (Развязка в финале)</label>
            <input type="text" value={finalTwist} onChange={e=>setFinalTwist(e.target.value)} placeholder="Например: Оказалось, что бункер был пуст" style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px dashed rgba(168,85,247,0.4)",borderRadius:12,padding:12,fontSize:13,color:"#e9d5ff", marginBottom:0}}/>
          </div>

          <div style={{...S.section, padding:"20px 24px"}}>
            <label style={S.label}>🎭 ЖАНР РАССКАЗА</label>
            <div className="hide-scroll" style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:8}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{flexShrink:0, display:"flex", alignItems:"center", gap:6, background: genre===g ? p.col : "rgba(0,0,0,0.4)", border: `1px solid ${genre===g ? p.col : "rgba(255,255,255,0.1)"}`, color: genre===g ? "#fff" : "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: 100, fontWeight: 800, fontSize: 11, cursor: "pointer", transition: "all 0.2s"}}>
                  <span>{p.icon}</span> <span>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
             <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
               <label style={{...S.label, marginBottom:0}}>📝 СЦЕНАРИЙ (ТЕКСТ ДИКТОРА)</label>
               <div style={{display:"flex", gap: 8}}>
                 <CopyBtn text={script} small />
                 <button onClick={handleGenerateHooks} disabled={busy || !topic.trim() || !checkTokens()} style={{background:"rgba(249,115,22,0.15)", color:"#fbbf24", border:"1px solid rgba(249,115,22,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:900, cursor:"pointer"}}>🔥 3 ХУКА</button>
               </div>
             </div>
             
             {hooksList.length > 0 && (
               <div style={{background:"rgba(0,0,0,0.3)", border:"1px dashed rgba(249,115,22,0.3)", borderRadius:12, padding:12, marginBottom:16}}>
                 <div style={{fontSize:10, color:"#94a3b8", marginBottom:8, textTransform:"uppercase"}}>Кликни на хук, чтобы добавить в сценарий:</div>
                 <div style={{display:"flex", flexDirection:"column", gap:6}}>
                   {hooksList.map((h,i) => ( <div key={i} onClick={() => { setScript(h + " " + script); setHooksList([]); }} style={{background:"rgba(255,255,255,0.05)", padding:10, borderRadius:8, fontSize:13, color:"#fcd34d", cursor:"pointer", borderLeft:"3px solid #f59e0b"}}>{h}</div> ))}
                 </div>
               </div>
             )}

             <textarea rows={5} value={script} onChange={e=>setScript(e.target.value)} placeholder="Вставьте готовый текст или нажмите «Написать»..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:16,fontSize:14,color:"#cbd5e1",marginBottom:16, resize:"none"}}/>
             <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
               <button onClick={handleDraftText} disabled={busy || !topic.trim() || !checkTokens()} style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>✍️ Написать весь текст</button>
               <button onClick={handleIntonations} disabled={busy || !script.trim() || !checkTokens()} style={{background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#d8b4fe", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>🎭 Интонации</button>
               <button onClick={()=>setShowTTS(!showTTS)} disabled={busy || !script.trim()} style={{gridColumn:"1/-1", background:"rgba(14,165,233,0.1)", border:"1px dashed rgba(14,165,233,0.3)", color:"#7dd3fc", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>⚙️ Настройки голоса (TTS)</button>
             </div>
             
             {showTTS && (
                <div style={{marginTop:16, display:"flex", flexDirection:"column", gap:10}}>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(16,185,129,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#34d399"}}>1. МЕДЛЕННЫЙ (Dark History)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 0.85</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#a7f3d0", flex:1}}>A middle-aged male voice, extremely raspy and hoarse, speaking in a low, sinister whisper right into the microphone. Slow pacing with heavy, audible breathing and dramatic pauses. Cinematic documentary style.</span><CopyBtn text="A middle-aged male voice, extremely raspy and hoarse, speaking in a low, sinister whisper right into the microphone. Slow pacing with heavy, audible breathing and dramatic pauses. Cinematic documentary style." small/></div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(56,189,248,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#38bdf8"}}>2. СРЕДНИЙ (Storytelling)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 1.1</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#bae6fd", flex:1}}>A 35-year-old male voice, professional documentary narrator. Warm, authoritative, and engaging tone. Crisp studio articulation, natural conversational inflections, no robotic monotony.</span><CopyBtn text="A 35-year-old male voice, professional documentary narrator. Warm, authoritative, and engaging tone. Crisp studio articulation, natural conversational inflections, no robotic monotony." small/></div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(244,63,94,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#fb7185"}}>3. БЫСТРЫЙ (Viral TikTok)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 1.35</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#fecdd3", flex:1}}>Young male voice, highly energetic, breathless and urgent. Speaking rapidly and aggressively with extreme excitement. Close-mic podcast style, sensational tone.</span><CopyBtn text="Young male voice, highly energetic, breathless and urgent. Speaking rapidly and aggressively with extreme excitement. Close-mic podcast style, sensational tone." small/></div>
                  </div>
                </div>
             )}
          </div>

          <div style={{marginBottom: 24}}>
             <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", padding:"16px 24px", borderRadius:settingsOpen?"24px 24px 0 0":24, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>
               <span>⚙️ Технические настройки</span><span>{settingsOpen?"▲":"▼"}</span>
             </button>
             {settingsOpen && (
               <div style={{background:"rgba(15,15,25,.3)", border:"1px solid rgba(255,255,255,.05)", borderTop:"none", padding:24, borderRadius:"0 0 24px 24px", backdropFilter:"blur(20px)"}}>
                  <label style={S.label}>🎨 Визуальный движок</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                    {Object.entries(VISUAL_ENGINES).map(([eId, e])=><button key={eId} onClick={()=>setEngine(eId)} style={{flex:"1 1 45%",background:engine===eId?"rgba(168,85,247,.15)":"rgba(0,0,0,.4)",border:`1px solid ${engine===eId?"#a855f7":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,fontSize:11,fontWeight:engine===eId?800:500,color:engine===eId?"#d8b4fe":"rgba(255,255,255,.5)", cursor:"pointer"}}>{e.label}</button>)}
                  </div>
                  <input type="text" value={customStyle} onChange={e=>setCustomStyle(e.target.value)} placeholder="Особый стиль (VHS, Киберпанк и т.д.)" style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:12,fontSize:12,color:"#cbd5e1", marginBottom:20}}/>
                  
                  <label style={S.label}>🌐 Язык сценария</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>{["RU", "EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,background:lang===l?"rgba(245,158,11,.15)":"rgba(0,0,0,.4)",border:`1px solid ${lang===l?"#fbbf24":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,fontSize:12,fontWeight:lang===l?800:500,color:lang===l?"#fcd34d":"rgba(255,255,255,.5)", cursor:"pointer"}}>{l === "RU" ? "Русский" : "English"}</button>)}</div>
                  <label style={S.label}>📐 Формат</label>
                  <div style={{display:"flex",gap:8,marginBottom:20}}>{FORMATS.map(f=><button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1,background:vidFormat===f.id?"rgba(14,165,233,.15)":"rgba(0,0,0,.4)",border:`1px solid ${vidFormat===f.id?"#0ea5e9":"rgba(255,255,255,.05)"}`,borderRadius:14,padding:10,fontSize:12,fontWeight:vidFormat===f.id?800:500,color:vidFormat===f.id?"#bae6fd":"rgba(255,255,255,.5)", cursor:"pointer"}}>{f.id}</button>)}</div>
                  <label style={S.label}>⏳ Длительность видео</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.15)":"rgba(0,0,0,.4)",border:`1px solid ${dur===d?"#f97316":"rgba(255,255,255,.05)"}`,borderRadius:20,padding:"10px 16px",fontSize:12,fontWeight:dur===d?800:500,color:dur===d?"#fdba74":"rgba(255,255,255,.5)", cursor:"pointer"}}>{d}</button>)}</div>
               </div>
             )}
          </div>
          
          {frames.length > 0 && (
             <div style={{textAlign:"center", marginBottom: 20}}>
               <button onClick={()=>setView("result")} style={{background:"none", border:"none", color:"#a855f7", fontWeight:900, fontSize:12, cursor:"pointer"}}>ВЕРНУТЬСЯ К РЕЗУЛЬТАТУ →</button>
             </div>
          )}

          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"16px 20px 24px",background:"linear-gradient(to top, rgba(5,5,10,1) 50%, transparent)",zIndex:100}}>
            <button className="gbtn" onClick={handleStep1} disabled={(!script.trim() && !topic.trim()) || busy}>{busy?"СИСТЕМА В РАБОТЕ...":"🚀 ШАГ 1: СОЗДАТЬ РАСКАДРОВКУ (💎 1)"}</button>
          </div>
        </div>
      )}

      {view==="loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"50vh",padding:"20px",textAlign:"center"}}>
           <div style={{width:60,height:60,border:"4px solid rgba(168,85,247,0.2)",borderTopColor:"#a855f7",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:24}} />
           <div style={{fontSize:20,fontWeight:900,color:"#fff", letterSpacing:2}}>{loadingMsg}</div>
        </div>
      )}

      {view==="result" && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"20px 20px 100px"}}>
          <button onClick={()=>setView("form")} style={{marginBottom:20, color:"#a855f7", background:"none", border:"none", fontWeight:800, cursor:"pointer", fontSize:12}}>← ВЕРНУТЬСЯ В НАСТРОЙКИ</button>
          
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
              <div className="hide-scroll" style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:16, marginBottom:10}}>
                {COVER_PRESETS.map(p=>(<button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${activePreset===p.id?"#a855f7":"rgba(255,255,255,0.1)"}`, background:activePreset===p.id?"rgba(168,85,247,0.2)":"rgba(0,0,0,0.3)", color:activePreset===p.id?"#fff":"rgba(255,255,255,0.5)", fontSize:11, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>{p.label}</button>))}
              </div>

              <div style={{display:"flex", justifyContent:"center", marginBottom:12}}>
                <div id="thumbnail-export" style={{width:320, aspectRatio:currFormat.ratio, position:"relative", background:bgImage?`url(${bgImage}) center/cover no-repeat`:"#111", overflow:"hidden"}}>
                  <div style={{position:"absolute", inset:0, background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`, zIndex:1}} />
                  <div style={{position:"absolute", left:`${covX}%`, top:`${covY}%`, transform:"translate(-50%,-50%)", width:"90%", zIndex:2, display:"flex", flexDirection:"column", alignItems:activeStyle.container?.alignItems || "center", textAlign:activeStyle.title?.textAlign || "center", ...activeStyle.container}}>
                    <div style={activeStyle.hook}>{covHook}</div>
                    <div style={{...activeStyle.title, wordWrap:"break-word"}}>{covTitle}</div>
                    <div style={activeStyle.cta}>{covCta}</div>
                  </div>
                  {showSafeZone && vidFormat === "9:16" && (
                    <div style={{position:"absolute", inset:0, pointerEvents:"none", zIndex:10}}>
                      <div style={{position:"absolute", right:0, bottom:"20%", width:"18%", height:"40%", borderLeft:"2px dashed rgba(239,68,68,0.6)", borderTop:"2px dashed rgba(239,68,68,0.6)", background:"rgba(239,68,68,0.1)"}}></div>
                      <div style={{position:"absolute", bottom:0, left:0, right:0, height:"20%", borderTop:"2px dashed rgba(239,68,68,0.6)", background:"rgba(239,68,68,0.1)"}}></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{display:"flex", justifyContent:"center", marginBottom:24}}>
                 <label style={{display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#94a3b8", cursor:"pointer"}}><input type="checkbox" checked={showSafeZone} onChange={e=>setShowSafeZone(e.target.checked)} /> Показать Сейф-зону TikTok</label>
              </div>

              <div style={{background:"rgba(0,0,0,0.3)", borderRadius:16, padding:20, marginBottom:20}}>
                 <label style={{fontSize:11, color:"#d8b4fe", fontWeight:900, textTransform:"uppercase", marginBottom:12, display:"block"}}>📝 ТЕКСТ НА ОБЛОЖКЕ</label>
                 <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:20}}>
                   <input type="text" value={covHook} onChange={e=>setCovHook(e.target.value)} placeholder="Верхний текст (Hook)" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:10, color:"#fff", fontSize:13}} />
                   <input type="text" value={covTitle} onChange={e=>setCovTitle(e.target.value)} placeholder="Главный заголовок" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(168,85,247,0.4)", padding:"12px", borderRadius:10, color:"#fff", fontSize:13, fontWeight:800}} />
                   <input type="text" value={covCta} onChange={e=>setCovCta(e.target.value)} placeholder="Нижний текст (CTA)" style={{width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"12px", borderRadius:10, color:"#fff", fontSize:13}} />
                 </div>
                 
                 <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>
                   <div><label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция X</label><input type="range" min="0" max="100" value={covX} onChange={e=>setCovX(e.target.value)} style={{width:"100%"}}/></div>
                   <div><label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция Y</label><input type="range" min="0" max="100" value={covY} onChange={e=>setCovY(e.target.value)} style={{width:"100%"}}/></div>
                 </div>
                 <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Затемнение картинки</label>
                 <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} style={{width:"100%"}}/>
              </div>

              {/* НОВЫЙ БЛОК: Специальный промпт для обложки (Появляется после Шага 2) */}
              {step2Done && thumb?.prompt_EN && (
                <div style={{background:"rgba(14,165,233,0.1)", border:"1px dashed rgba(14,165,233,0.4)", borderRadius:16, padding:16, marginBottom:20}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                    <span style={{fontSize:11, fontWeight:900, color:"#38bdf8", textTransform:"uppercase"}}>🖼 PROMPT ДЛЯ ФОНА ОБЛОЖКИ</span>
                    <CopyBtn text={thumb.prompt_EN} small/>
                  </div>
                  <div style={{fontSize:12, fontFamily:"monospace", color:"#bae6fd", lineHeight:1.4}}>{thumb.prompt_EN}</div>
                </div>
              )}

              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:800, textTransform:"uppercase"}}>📸 Фон<input type="file" hidden onChange={handleImageUpload}/></label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:48, background:"linear-gradient(135deg, #10b981, #059669)", borderRadius:14, border:"none", fontWeight:900, color:"#fff", cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>{downloading ? "Рендер..." : "💾 СКАЧАТЬ"}</button>
              </div>
            </div>
          </div>

          {!step2Done && (
            <div style={{background:"rgba(236,72,153,0.1)", border:"1px dashed rgba(236,72,153,0.4)", borderRadius:24, padding:24, textAlign:"center", marginBottom:24}}>
              <div style={{fontSize:14, fontWeight:900, color:"#fbcfe8", marginBottom:10}}>Сценарий готов! Теперь визуализация 🎨</div>
              <div style={{fontSize:12, color:"#f472b6", marginBottom:20}}>Нейросеть сгенерирует сверхдетальные 8K промпты на английском для генераторов (Veo, Whisk, Grok).</div>
              <button onClick={handleStep2} disabled={busy || !checkTokens()} style={{width:"100%", padding:"16px", background:"linear-gradient(135deg, #db2777, #9333ea)", borderRadius:16, color:"#fff", fontWeight:900, border:"none", cursor:"pointer", boxShadow:"0 5px 20px rgba(219,39,119,0.4)", animation:"pulse-glow 2s infinite"}}>🪄 ШАГ 2: СГЕНЕРИРОВАТЬ PRO-ПРОМПТЫ (💎 1)</button>
            </div>
          )}

          <div className="hide-scroll" style={{display:"flex", gap:10, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:16, overflowX:"auto"}}>
             {["storyboard","raw","seo"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{background:"none", border:"none", color:tab===t?"#a855f7":"#94a3b8", fontWeight:800, fontSize:12, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap"}}>{t==="raw" ? "Скрипт и Промпты" : t==="seo" ? "Музыка и SEO" : "Раскадровка"}</button>))}
          </div>

          {tab==="storyboard" && (
            <div>
              {charRef && (
                <div style={{...S.section, border:"1px solid rgba(236,72,153,0.4)", background:"rgba(236,72,153,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#f472b6", textTransform:"uppercase"}}>👤 CHARACTER REF (ГЕРОЙ)</span>
                    <CopyBtn text={charRef} small/>
                  </div>
                  <div style={{fontSize:13, fontFamily:"monospace", color:"#fff", lineHeight:1.5, background:"rgba(0,0,0,0.5)", padding:12, borderRadius:10}}>{charRef}</div>
                </div>
              )}
              
              {locRef && (
                <div style={{...S.section, border:"1px solid rgba(56,189,248,0.3)", background:"rgba(56,189,248,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#38bdf8", textTransform:"uppercase"}}>🌍 LOCATION REF (ФОН)</span>
                    <CopyBtn text={locRef} small/>
                  </div>
                  <div style={{fontSize:13, fontFamily:"monospace", color:"#bae6fd", lineHeight:1.5}}>{locRef}</div>
                </div>
              )}

              {styleRef && (
                <div style={{...S.section, border:"1px solid rgba(250,204,21,0.3)", background:"rgba(250,204,21,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#facc15", textTransform:"uppercase"}}>🎨 STYLE REF (АТМОСФЕРА)</span>
                    <CopyBtn text={`${styleRef}, ${VISUAL_ENGINES[engine]?.prompt || ""}${customStyle ? ", "+customStyle : ""}`} small/>
                  </div>
                  <div style={{fontSize:13, fontFamily:"monospace", color:"#fef08a", lineHeight:1.5}}>{`${styleRef}, ${VISUAL_ENGINES[engine]?.prompt || ""}${customStyle ? ", "+customStyle : ""}`}</div>
                </div>
              )}
              
              {frames.map((f,i)=>(
                <div key={i} style={{...S.section, position:"relative", overflow:"hidden"}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:16}}><span style={{fontSize:12, fontWeight:900, color:"#ef4444", display:"flex", alignItems:"center", gap:6}}><span style={{width:8,height:8,background:"#ef4444",borderRadius:"50%",animation:"blink 1.5s infinite"}}/> REC {String(i+1).padStart(2,"0")}</span><span style={{fontSize:10, color:"#cbd5e1", background:"rgba(255,255,255,0.1)", padding:"4px 8px", borderRadius:6, fontFamily:"monospace"}}>TC: {f.timecode}</span></div>
                  
                  {f.visual && <div style={{fontSize:14, color:"#fff", marginBottom:12, lineHeight:1.5}}>👁 {f.visual}</div>}
                  {f.voice && <div style={{fontSize:14, fontStyle:"italic", color:"#a855f7", marginBottom:16, borderLeft:"3px solid #a855f7", paddingLeft:12}}>«{f.voice}»</div>}
                  
                  <div style={{display:"flex", gap:10, marginBottom: step2Done ? 16 : 0}}>
                    {f.sfx && <div style={{flex:1, background:"rgba(245,158,11,0.05)", border:"1px dashed rgba(245,158,11,0.3)", padding:8, borderRadius:8, fontSize:11, color:"#fcd34d"}}>🔊 {f.sfx}</div>}
                    {f.text_on_screen && <div style={{flex:1, background:"rgba(236,72,153,0.05)", border:"1px dashed rgba(236,72,153,0.3)", padding:8, borderRadius:8, fontSize:11, color:"#fbcfe8", fontWeight:800}}>🔤 "{f.text_on_screen}"</div>}
                  </div>

                  {step2Done && f.imgPrompt_EN && <div style={{background:"rgba(16,185,129,.05)", padding:12, borderRadius:12, marginBottom:10}}><div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#34d399", fontWeight:800}}>IMAGE PROMPT (WHISK)</span><CopyBtn text={f.imgPrompt_EN} small/></div><div style={{fontSize:12, fontFamily:"monospace", color:"#6ee7b7", lineHeight:1.4}}>{f.imgPrompt_EN}</div></div>}
                  {step2Done && f.vidPrompt_EN && <div style={{background:"rgba(139,92,246,.05)", padding:12, borderRadius:12}}><div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:9, color:"#a78bfa", fontWeight:800}}>VIDEO PROMPT (VEO/GROK)</span><CopyBtn text={f.vidPrompt_EN} small/></div><div style={{fontSize:12, fontFamily:"monospace", color:"#d8b4fe", lineHeight:1.4}}>{f.vidPrompt_EN}</div></div>}
                </div>
              ))}
              {step2Done && bRolls.length > 0 && (
                <div style={{...S.section, border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.05)"}}>
                  <div style={{fontSize:12, fontWeight:900, color:"#fbbf24", marginBottom:16}}>⚡ МИКРО-ПЕРЕБИВКИ (FLASH B-ROLLS)</div>
                  {bRolls.map((b,i)=>(<div key={i} style={{fontSize:12, fontFamily:"monospace", color:"#fcd34d", marginBottom:8, paddingBottom:8, borderBottom:"1px solid rgba(245,158,11,0.1)"}}>- {b}</div>))}
                </div>
              )}
            </div>
          )}

          {tab==="raw" && (
            <div style={{display: "flex", flexDirection: "column", gap: 20}}>
              <div style={{...S.section, padding:20}}>
                 <div style={{display:"flex",justifyContent:"space-between",marginBottom:15}}>
                   <span style={{fontWeight:900, color:"#fff"}}>🎬 СЦЕНАРИЙ</span>
                   <CopyBtn text={rawScript}/>
                 </div>
                 <pre style={{whiteSpace:"pre-wrap", color:"#cbd5e1", fontSize:13, fontFamily:"monospace", lineHeight:1.6}}>{rawScript}</pre>
              </div>
              {step2Done && (
                <>
                  <div style={{...S.section, padding:20}}>
                     <div style={{display:"flex",justifyContent:"space-between",marginBottom:15}}>
                       <span style={{fontWeight:900, color:"#34d399"}}>🖼 IMAGE PROMPTS (Whisk)</span>
                       <CopyBtn text={rawImg}/>
                     </div>
                     <pre style={{whiteSpace:"pre-wrap", color:"#6ee7b7", fontSize:13, fontFamily:"monospace", lineHeight:1.6}}>{rawImg}</pre>
                  </div>
                  <div style={{...S.section, padding:20}}>
                     <div style={{display:"flex",justifyContent:"space-between",marginBottom:15}}>
                       <span style={{fontWeight:900, color:"#a78bfa"}}>🎥 VIDEO PROMPTS (Veo/Grok)</span>
                       <CopyBtn text={rawVid}/>
                     </div>
                     <pre style={{whiteSpace:"pre-wrap", color:"#d8b4fe", fontSize:13, fontFamily:"monospace", lineHeight:1.6}}>{rawVid}</pre>
                  </div>
                </>
              )}
            </div>
          )}
          
          {tab==="seo" && seo && (
            <div style={S.section}>
              <div style={{background:"rgba(245,158,11,.05)", border:"1px solid rgba(245,158,11,.2)", padding:16, borderRadius:16, marginBottom:16}}>
                 <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}><span style={{fontSize:11, fontWeight:900, color:"#fbbf24"}}>🎵 МУЗЫКА (SUNO AI PROMPT)</span><CopyBtn text={music} small/></div>
                 <div style={{fontFamily:"monospace", fontSize:13, color:"#fcd34d"}}>{music || "Промпт не сгенерирован"}</div>
              </div>
              <div style={{background:"rgba(59,130,246,.05)", border:"1px solid rgba(59,130,246,.2)", padding:16, borderRadius:16}}>
                   <span style={{fontSize:11, fontWeight:900, color:"#60a5fa", display:"block", marginBottom:12}}>🚀 ВИРУСНОЕ SEO</span>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Названия:</strong></div>
                   <ul style={{color:"#93c5fd", fontSize:13, paddingLeft:20, marginBottom:16}}>{seo.titles?.map((t,i)=><li key={i} style={{marginBottom:4}}>{t}</li>)}</ul>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Описание:</strong></div>
                   <div style={{color:"#93c5fd", fontSize:13, marginBottom:16, whiteSpace:"pre-wrap"}}>{seo.desc}</div>
                   <div style={{fontSize:13, color:"#fff", marginBottom:8}}><strong>Теги:</strong></div>
                   <div style={{color:"#93c5fd", fontSize:13}}>{seo.tags?.join(" ")}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
