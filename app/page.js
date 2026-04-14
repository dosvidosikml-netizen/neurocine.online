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
  "CINEMATIC": { label: "Кино-реализм", prompt: "cinematic realism, photorealistic, deep shadows, 8k, Arri Alexa 65" },
  "DARK_HISTORY": { label: "Dark History", prompt: "dark history grunge, dirty vintage film effect, scratches, bleak atmosphere, heavy vignette, 8k, Arri Alexa 65" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm soft lighting, 8k" },
  "X_RAY": { label: "X-Ray / Схемы", prompt: "x-ray exploded view, detailed engineering diagram, glowing internal parts, technical cross-section render, 8k" }
};

const DURATION_SECONDS = { "15 сек": 15, "30–45 сек": 40, "До 60 сек": 60, "1.5 мин": 90, "3 мин": 180 };
const DURATIONS = Object.keys(DURATION_SECONDS); // 🔥 Исправлено: добавил массив длительностей

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px rgba(0,0,0,0.9)", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", borderBottom: "1px solid #e50914", paddingBottom: 4, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 } } },
  { id: "mrbeast", label: "MrBeast", style: { container: { alignItems: "center" }, hook: { fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", textTransform: "uppercase", WebkitTextStroke: "1px #000", textShadow: "3px 3px 0 #000", transform: "rotate(-3deg)", marginBottom: 4 }, title: { fontSize: 40, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "2px #000", textShadow: "5px 5px 0 #000, 0 0 40px #ff00ff", transform: "rotate(-3deg)", textAlign: "center", marginBottom: 16 }, cta: { fontSize: 13, fontWeight: 900, color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "6px 14px", borderRadius: 8, textTransform: "uppercase", transform: "rotate(-3deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" } } },
  { id: "tiktok", label: "TikTok", style: { container: { alignItems: "center" }, hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12 }, title: { fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 11, fontWeight: 900, color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "truecrime", label: "True Crime", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#000", background: "#ffdd00", padding: "4px 8px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, background: "#000", padding: "4px 12px", borderLeft: "4px solid #ffdd00", textAlign: "left", marginBottom: 12 }, cta: { color: "#aaa", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "history", label: "Dark History", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 400, fontFamily: "'Georgia', serif", color: "#d4af37", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { fontSize: 36, fontWeight: 900, fontFamily: "'Cinzel', serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 10px 30px #000, 0 2px 4px #000", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 2, textTransform: "uppercase", borderTop: "1px solid #d4af37", paddingTop: 6 } } },
  { id: "breaking", label: "Новости", style: { container: { alignItems: "flex-start" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", background: "#ef4444", padding: "4px 10px", textTransform: "uppercase", marginBottom: 8 }, title: { fontSize: 32, fontWeight: 900, fontFamily: "sans-serif", color: "#000", background: "#fff", padding: "4px 12px", textTransform: "uppercase", lineHeight: 1.1, textAlign: "left", marginBottom: 12 }, cta: { fontSize: 12, fontWeight: 900, color: "#ef4444", textTransform: "uppercase", background:"#000", padding:"2px 8px" } } },
  { id: "cyber", label: "Cyberpunk", style: { container: { alignItems: "center" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#fef08a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, textShadow: "0 0 10px #fef08a" }, title: { fontSize: 34, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "2px 2px 0px #0ea5e9, -2px -2px 0px #ec4899", textAlign: "center", marginBottom: 12, fontStyle: "italic" }, cta: { fontSize: 11, fontWeight: 900, color: "#000", background: "#0ea5e9", padding: "4px 12px", textTransform: "uppercase", boxShadow: "0 0 15px #0ea5e9" } } },
  { id: "minimal", label: "Minimal", style: { container: { alignItems: "center" }, hook: { fontSize: 10, fontWeight: 500, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", letterSpacing: 4, marginBottom: 12, opacity: 0.7 }, title: { fontSize: 30, fontWeight: 300, fontFamily: "sans-serif", color: "#fff", textTransform: "uppercase", lineHeight: 1.2, textAlign: "center", marginBottom: 16, letterSpacing: 2 }, cta: { fontSize: 9, fontWeight: 400, color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 } } }
];

// --- СИСТЕМНЫЕ ПРОМПТЫ ---
const SYS_STEP_1 = `You are 'Director-X'. Output ONLY valid JSON. DO NOT use newlines (\\n) inside string values.
Create a storyboard, voiceover, sfx, and SEO. 
ALL CONTENT MUST BE IN TARGET LANGUAGE EXCEPT "_EN" FIELDS.
Rule: Do NOT write "Диктор: " or "Narrator: " in the voice text. Just the words.

JSON FORMAT:
{
  "global_anchor_EN": "Detailed English character/location description...",
  "whisk_reference_EN": "Character Design Sheet or Architectural Blueprint prompt for Whisk based on anchor. Highly detailed, 8k...",
  "retention": { "score": 95, "feedback": "Анализ..." },
  "frames": [ 
    { "timecode": "0-3 сек", "camera": "Наезд", "visual": "Описание кадра", "sfx": "Шум толпы", "text_on_screen": "ТИТРЫ", "voice": "Чистый текст диктора без приписки" } 
  ],
  "thumbnail": { "title": "ЗАГОЛОВАК", "hook": "ХУК", "cta": "СМОТРЕТЬ" },
  "music_EN": "[Genre], [Mood], [Lead Instruments], [Tempo / Vocals]",
  "seo": { "titles": ["Заголовок"], "desc": "Описание", "tags": ["#тег"] }
}`;

const SYS_STEP_2 = `You are an Elite AI Prompter. Output ONLY valid JSON. DO NOT use newlines (\\n) inside string values.
Based on the storyboard, generate highly detailed English prompts for Whisk, Veo and Grok Super.
DO NOT mention Midjourney or Leonardo.

STRICT RULES:
1. Every prompt MUST be between 30 and 40 words long. Detail the lighting, atmosphere, and textures.
2. Every prompt MUST end with tags: 8k, hyperdetailed, [user chosen style].
3. For video prompts, YOU MUST append the SFX audio cue at the end like this: ", with ASMR audio of [SFX from storyboard]".
4. Main object MUST occupy 40-60% of frame.

JSON FORMAT:
{
  "frames_prompts": [ 
    { "imgPrompt_EN": "A highly detailed wide shot of...", "vidPrompt_EN": "A highly detailed wide shot of..., with ASMR audio of crowd cheering" } 
  ],
  "b_rolls": [ "Extreme close up of...", "Detailed English prompt 2..." ],
  "thumbnail_prompt_EN": "Highly detailed English prompt for cover, main object 40-60% of frame..."
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
      style={{background:ok?"rgba(34,197,94,.25)":"rgba(255,255,255,.05)",border:`1px solid ${ok?"#4ade80":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.7)",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
      {ok?"✓ СКОПИРОВАНО":label}
    </button>
  );
}

export default function Page() {
  const [tokens, setTokens] = useState(5);
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
  const [rawPrompts, setRawPrompts] = useState("");
  const [anchor, setAnchor] = useState("");
  const [whiskRef, setWhiskRef] = useState("");
  const [step2Done, setStep2Done] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const scrollRef = useRef(null);

  useEffect(() => { if (typeof window !== "undefined") { const saved = localStorage.getItem("ds_history"); if (saved) setHistory(JSON.parse(saved)); } }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({top:0,behavior:"smooth"}); }, [view]);

  const checkTokens = () => { if (tokens <= 0) { setShowPaywall(true); return false; } return true; };
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

  function rebuildRawText(frms, anc, brls, s2done) {
    let anchorStr = anc ? `[GLOBAL ANCHOR: ${anc}]\n\n` : "";
    let rScript = "🎬 СЦЕНАРИЙ:\n" + frms.map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n👁 Визуал: ${f.visual}\n🔊 Звук: ${f.sfx||''}\n🔤 Титры: ${f.text_on_screen||''}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    let imgList = s2done ? ("\n\n🖼 ЧИСТЫЕ IMAGE PROMPTS (8K):\n\n" + frms.map(f => anchorStr + f.imgPrompt_EN).filter(Boolean).join("\n\n")) : "";
    let vidList = s2done ? ("\n\n🎥 ЧИСТЫЕ VIDEO PROMPTS (8K):\n\n" + frms.map(f => anchorStr + f.vidPrompt_EN).filter(Boolean).join("\n\n")) : "";
    let bRollList = (brls && brls.length && s2done) ? "\n\n⚡ FLASH B-ROLLS (8K):\n\n" + brls.map(b => anchorStr + b).join("\n\n") : "";
    setRawPrompts(rScript + imgList + vidList + bRollList);
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
      setAnchor(data.global_anchor_EN || ""); 
      setWhiskRef(data.whisk_reference_EN || "");
      setBRolls([]); setStep2Done(false);
      
      if (data.thumbnail) { setCovTitle(data.thumbnail.title || ""); setCovHook(data.thumbnail.hook || ""); setCovCta(data.thumbnail.cta || "СМОТРЕТЬ"); }
      
      rebuildRawText(data.frames || [], data.global_anchor_EN, [], false);
      setTokens(t => t - 1); setBgImage(null); setTab("storyboard"); setView("result");
      
      const newHistory = [{ id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString("ru-RU"), text: JSON.stringify(data), format: vidFormat }, ...history].slice(0, 10);
      setHistory(newHistory); localStorage.setItem("ds_history", JSON.stringify(newHistory));
      
    } catch(e) { alert(`🚨 ОШИБКА ШАГА 1: ${e.message}\nПроверьте логи Vercel.`); setView("form"); } finally { setBusy(false); }
  }

  async function handleStep2() {
    if (!checkTokens()) return;
    setBusy(true); setLoadingMsg("Шаг 2: Генерируем 8k PRO-промпты..."); setView("loading");
    try {
      const storyboardLite = frames.map((f, i) => `Frame ${i+1}: Visual: ${f.visual}. SFX: ${f.sfx}`).join("\n");
      const req = `GLOBAL ANCHOR: ${anchor}
STYLE TAGS REQUIRED: ${VISUAL_ENGINES[engine].prompt}. ${customStyle}
STORYBOARD:
${storyboardLite}

Generate exactly ${frames.length} English prompts for frames_prompts. Integrate SFX into vidPrompt_EN. Make them 30-40 words.`;

      const text = await callAPI(req, 8000, SYS_STEP_2);
      const data = cleanJSON(text);
      
      const updatedFrames = frames.map((f, i) => {
        const p = data.frames_prompts && data.frames_prompts[i] ? data.frames_prompts[i] : {};
        return { ...f, imgPrompt_EN: p.imgPrompt_EN || "", vidPrompt_EN: p.vidPrompt_EN || "" };
      });
      
      setFrames(updatedFrames); setBRolls(data.b_rolls || []);
      if(data.thumbnail_prompt_EN && thumb) setThumb({...thumb, prompt_EN: data.thumbnail_prompt_EN});
      
      setStep2Done(true);
      rebuildRawText(updatedFrames, anchor, data.b_rolls, true);
      setTokens(t => t - 1); setView("result");
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
      `}</style>

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:24}}>‹</button>}
          <span style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>DOCU<span style={{color:"#a855f7"}}>SHORTS</span></span>
        </div>
        <div style={{display:"flex",gap:12, alignItems:"center"}}>
          {view==="form" && frames.length>0 && <button onClick={()=>setView("result")} style={{background:"none",border:"none",color:"#d8b4fe",fontSize:12,fontWeight:800,cursor:"pointer"}}>👁 РЕЗУЛЬТАТ</button>}
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
            <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{display:"flex", alignItems:"center", gap:8, background: genre===g ? p.col : "rgba(0,0,0,0.4)", border: `1px solid ${genre===g ? p.col : "rgba(255,255,255,0.1)"}`, boxShadow: genre===g ? `0 0 15px ${p.col}40` : "none", color: genre===g ? "#fff" : "rgba(255,255,255,0.6)", padding: "10px 16px", borderRadius: 100, fontWeight: 800, fontSize: 12, cursor: "pointer", transition: "all 0.2s"}}>
                  <span>{p.icon}</span> <span>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
             <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
               <label style={{...S.label, marginBottom:0}}>📝 СЦЕНАРИЙ (ТЕКСТ ДИКТОРА)</label>
               <button onClick={handleGenerateHooks} disabled={busy || !topic.trim()} style={{background:"rgba(249,115,22,0.15)", color:"#fbbf24", border:"1px solid rgba(249,115,22,0.3)", borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:900, cursor:"pointer"}}>🔥 3 ХУКА</button>
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
               <button onClick={handleDraftText} disabled={busy || !topic.trim()} style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>✍️ Написать весь текст</button>
               <button onClick={handleIntonations} disabled={busy || !script.trim()} style={{background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#d8b4fe", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>🎭 Интонации</button>
               <button onClick={()=>setShowTTS(!showTTS)} disabled={busy || !script.trim()} style={{gridColumn:"1/-1", background:"rgba(14,165,233,0.1)", border:"1px dashed rgba(14,165,233,0.3)", color:"#7dd3fc", padding:12, borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer"}}>⚙️ Настройки голоса (TTS)</button>
             </div>
             
             {showTTS && (
                <div style={{marginTop:16, display:"flex", flexDirection:"column", gap:10}}>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(16,185,129,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#34d399"}}>1. МЕДЛЕННЫЙ (Dark History)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 0.85</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#a7f3d0", flex:1}}>Deep, velvety, dark dramatic tone with tense slow pauses and grim whispering.</span><CopyBtn text="Deep, velvety, dark dramatic tone with tense slow pauses and grim whispering." small/></div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(56,189,248,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#38bdf8"}}>2. СРЕДНИЙ (Storytelling)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 1.1</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#bae6fd", flex:1}}>Confident, engaging documentary narrator with clear articulation and factual emphasis.</span><CopyBtn text="Confident, engaging documentary narrator with clear articulation and factual emphasis." small/></div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(244,63,94,0.3)", padding:12, borderRadius:12}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}><span style={{fontSize:11, fontWeight:900, color:"#fb7185"}}>3. БЫСТРЫЙ (Viral TikTok)</span><span style={{fontSize:10, color:"#94a3b8"}}>Speed: 1.35</span></div>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><span style={{fontSize:11, fontFamily:"monospace", color:"#fecdd3", flex:1}}>High energy, aggressive viral hook delivery, breathless pacing, sensational tone.</span><CopyBtn text="High energy, aggressive viral hook delivery, breathless pacing, sensational tone." small/></div>
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
          <button onClick={()=>setView("form")} style={{marginBottom:20, color:"#a855f7", background:"none", border:"none", fontWeight:800, cursor:"pointer", fontSize:12}}>← НАЗАД К ПРОЕКТАМ</button>
          
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
                {COVER_PRESETS.map(p=>(<button key={p.id} onClick={()=>setActivePreset(p.id)} style={{flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${activePreset===p.id?"#a855f7":"rgba(255,255,255,0.1)"}`, background:activePreset===p.id?"rgba(168,85,247,0.2)":"rgba(0,0,0,0.3)", color:activePreset===p.id?"#fff":"rgba(255,255,255,0.5)", fontSize:11, fontWeight:800, cursor:"pointer", textTransform:"uppercase"}}>{p.label}</button>))}
              </div>

              <div style={{display:"flex", justifyContent:"center", marginBottom:12}}>
                <div id="thumbnail-export" style={{width:320, aspectRatio:currFormat.ratio, position:"relative", background:bgImage?`url(${bgImage}) center/cover no-repeat`:"#111", overflow:"hidden"}}>
                  <div style={{position:"absolute", inset:0, background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`, zIndex:1}} />
                  <div style={{position:"absolute", left:`${covX}%`, top:`${covY}%`, transform:"translate(-50%,-50%)", width:"90%", zIndex:2, display:"flex", flexDirection:"column", alignItems:activeStyle.container?.alignItems || "center", textAlign:activeStyle.title?.textAlign || "center"}}>
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
                   <div><label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция X</label><input type="range" min="10" max="90" value={covX} onChange={e=>setCovX(e.target.value)} style={{width:"100%"}}/></div>
                   <div><label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Позиция Y</label><input type="range" min="10" max="90" value={covY} onChange={e=>setCovY(e.target.value)} style={{width:"100%"}}/></div>
                 </div>
                 <label style={{fontSize:10, color:"#94a3b8", fontWeight:800, textTransform:"uppercase", marginBottom:8, display:"block"}}>Затемнение картинки</label>
                 <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} style={{width:"100%"}}/>
              </div>

              <div style={{display:"flex", gap:10}}>
                <label style={{flex:1, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:800, textTransform:"uppercase"}}>📸 Фон<input type="file" hidden onChange={handleImageUpload}/></label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:1, height:48, background:"linear-gradient(135deg, #10b981, #059669)", borderRadius:14, border:"none", fontWeight:900, color:"#fff", cursor:downloading?"not-allowed":"pointer", textTransform:"uppercase"}}>{downloading ? "Рендер..." : "💾 СКАЧАТЬ"}</button>
              </div>
              
              {step2Done && thumb?.prompt_EN && (
                <div style={{marginTop:16, background:"rgba(16,185,129,.05)", border:"1px solid rgba(16,185,129,.2)", borderRadius:14, padding:14}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}><span style={{fontSize:10, fontWeight:800, color:"#34d399"}}>ПРОМПТ 50% / ЧЕРНЫЙ ФОН</span><CopyBtn text={thumb?.prompt_EN || ""} small/></div>
                  <div style={{fontFamily:"monospace", fontSize:12, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>{thumb?.prompt_EN}</div>
                </div>
              )}
            </div>
          </div>

          {!step2Done && (
            <div style={{background:"rgba(236,72,153,0.1)", border:"1px dashed rgba(236,72,153,0.4)", borderRadius:24, padding:24, textAlign:"center", marginBottom:24}}>
              <div style={{fontSize:14, fontWeight:900, color:"#fbcfe8", marginBottom:10}}>Сценарий готов! Теперь визуализация 🎨</div>
              <div style={{fontSize:12, color:"#f472b6", marginBottom:20}}>Нейросеть сгенерирует сверхдетальные 8K промпты на английском для генераторов (Veo, Whisk, Grok).</div>
              <button onClick={handleStep2} disabled={busy} style={{width:"100%", padding:"16px", background:"linear-gradient(135deg, #db2777, #9333ea)", borderRadius:16, color:"#fff", fontWeight:900, border:"none", cursor:"pointer", boxShadow:"0 5px 20px rgba(219,39,119,0.4)", animation:"pulse-glow 2s infinite"}}>🪄 ШАГ 2: СГЕНЕРИРОВАТЬ PRO-ПРОМПТЫ (💎 1)</button>
            </div>
          )}

          <div style={{display:"flex", gap:10, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:16, overflowX:"auto"}}>
             {["storyboard","raw","seo"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{background:"none", border:"none", color:tab===t?"#a855f7":"#94a3b8", fontWeight:800, fontSize:12, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap"}}>{t==="raw" ? "Скрипт и Промпты" : t==="seo" ? "Музыка и SEO" : "Раскадровка"}</button>))}
          </div>

          {tab==="storyboard" && (
            <div>
              {whiskRef && (
                <div style={{...S.section, border:"1px solid rgba(236,72,153,0.4)", background:"rgba(236,72,153,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#f472b6", textTransform:"uppercase"}}>🎭 БАЗОВЫЙ РЕФЕРЕНС (ДЛЯ WHISK)</span>
                    <CopyBtn text={whiskRef} small/>
                  </div>
                  <div style={{fontSize:12, color:"#fbcfe8", marginBottom:8, opacity:0.8}}>Сгенерируйте эту картинку первой, чтобы использовать её как исходник (Image Reference) для всех остальных кадров.</div>
                  <div style={{fontSize:13, fontFamily:"monospace", color:"#fff", lineHeight:1.5, background:"rgba(0,0,0,0.5)", padding:12, borderRadius:10}}>{whiskRef}</div>
                </div>
              )}
              
              {anchor && (
                <div style={{...S.section, border:"1px solid rgba(56,189,248,0.3)", background:"rgba(56,189,248,0.05)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <span style={{fontSize:12, fontWeight:900, color:"#38bdf8", textTransform:"uppercase"}}>⚓ Глобальный якорь (Вшит в каждый кадр)</span>
                    <CopyBtn text={anchor} small/>
                  </div>
                  <div style={{fontSize:13, fontFamily:"monospace", color:"#bae6fd", lineHeight:1.5}}>{anchor}</div>
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

          {tab==="raw" && <div style={S.section}><div style={{display:"flex",justifyContent:"flex-end",marginBottom:15}}><CopyBtn text={rawPrompts} label="Копировать ВСЁ"/></div><pre style={{whiteSpace:"pre-wrap", color:"#cbd5e1", fontSize:13, fontFamily:"monospace", lineHeight:1.6}}>{rawPrompts}</pre></div>}
          
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
