// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ff3355", physics:"кровь капает в слоу-мо, тени движутся",        light:"cold forensic overhead light, hard rim light from behind",        asmr:"металлический скрежет, сухой щелчок затвора" },
  "ТАЙНА":         { icon:"🔍", col:"#a855f7", physics:"туман стелется, пылинки кружатся",             light:"flickering volumetric light, bioluminescent glow",          asmr:"тихий шорох бумаги, шёпот вплотную к микрофону" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316", physics:"пылинки кружатся, листья срываются",           light:"golden hour dust beams, single candle chiaroscuro",              asmr:"шуршание ткани, стук каблуков по камню" },
  "НАУКА":         { icon:"⚗",  col:"#06b6d4", physics:"пылинки кружатся, вода растекается",           light:"neon reflections on wet surface, bioluminescent glow",            asmr:"электрический гул, капля воды в тишине" },
  "ВОЙНА":         { icon:"⚔",  col:"#ef4444", physics:"осколки разлетаются, дым клубится",            light:"strobing red emergency light, hard rim light from behind",        asmr:"металлический скрежет, треск огня" },
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e", physics:"волосы развеваются на ветру, туман стелется",  light:"golden hour dust beams, dynamic reflections in the eyes",     asmr:"шорох листьев, капля воды в тишине" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899", physics:"пылинки кружатся, лёд трескается",             light:"flickering volumetric light, dynamic reflections in the eyes",    asmr:"шёпот вплотную к микрофону, электрический гул" },
  "КОНСПИРОЛОГИЯ": { icon:"👁", col:"#fbbf24", physics:"дым клубится, тени движутся",                  light:"single candle chiaroscuro shadows, flickering volumetric light",  asmr:"электрический гул, тихий шорох бумаги" },
};

const STORYBOARD_STYLES = [
  { id:"CINEMATIC",   icon:"🎬", col:"#ff3355", label:"Синематик",      desc:"Голливуд, глубина кадра",       prompt:"cinematic Hollywood style, anamorphic lens, shallow depth of field, dramatic lighting, film grain" },
  { id:"DOCUMENTARY", icon:"🎥", col:"#f97316", label:"Документальный", desc:"Ручная камера, репортаж",       prompt:"documentary style, handheld camera, natural lighting, observational, raw authentic footage" },
  { id:"NOIR",        icon:"🌑", col:"#6366f1", label:"Нуар",           desc:"Тени, дым, ретро 40-50х",       prompt:"film noir style, high contrast black and white, dramatic shadows, venetian blind shadows, 1940s atmosphere" },
  { id:"ANIME",       icon:"✨", col:"#ec4899", label:"Аниме",           desc:"Японская анимация, экшн",      prompt:"anime cinematic style, cel shading, vibrant colors, speed lines, Japanese animation aesthetic" },
  { id:"CYBERPUNK",   icon:"⚡", col:"#00e5ff", label:"Киберпанк",      desc:"Неон, дождь, мегаполис",        prompt:"cyberpunk aesthetic, neon lights reflection on wet pavement, dystopian megacity, holographic displays, rain" },
  { id:"HORROR",      icon:"👁", col:"#dc2626", label:"Хоррор",         desc:"Ужас, темнота, напряжение",     prompt:"horror film style, deep shadows, flickering lights, extreme close-ups, tension atmosphere, dark corners" },
  { id:"VINTAGE",     icon:"📽", col:"#d97706", label:"Винтаж",         desc:"8мм, зернистость, ностальгия",  prompt:"vintage Super 8mm film, film grain, light leaks, faded colors, nostalgic warm tones, analog imperfections" },
  { id:"HYPERREAL",   icon:"🔬", col:"#22c55e", label:"Гиперреализм",   desc:"Макро, идеальная чёткость",    prompt:"hyperrealistic photography, macro lens, razor sharp detail, studio lighting, photorealistic textures" },
  { id:"POETIC",      icon:"🌙", col:"#a855f7", label:"Поэтический",    desc:"Символизм, медленные кадры",   prompt:"poetic visual style, slow motion, dreamy atmosphere, symbolic imagery, soft natural light, contemplative mood" },
  { id:"ACTION",      icon:"💥", col:"#ef4444", label:"Экшн",           desc:"Динамика, адреналин, монтаж",   prompt:"action movie style, dynamic camera movement, fast cuts, motion blur, explosive energy, adrenaline atmosphere" },
  { id:"MINIMALIST",  icon:"◻",  col:"#94a3b8", label:"Минимализм",     desc:"Пустота, тишина, один акцент", prompt:"minimalist visual style, empty space, single focal point, clean composition, silent atmosphere, zen aesthetic" },
  { id:"SURREAL",     icon:"🌀", col:"#8b5cf6", label:"Сюрреализм",     desc:"Дали, невозможная физика",     prompt:"surrealist visual style, impossible physics, dreamlike imagery, Salvador Dali aesthetic, melting reality" },
  { id:"NEWSREEL",    icon:"📺", col:"#64748b", label:"Новостной",      desc:"Live-репортаж, студия",         prompt:"news broadcast style, live report aesthetic, harsh on-camera flash, press photography, urgent atmosphere" },
  { id:"NATURE_FILM", icon:"🌿", col:"#16a34a", label:"Натурфильм",     desc:"BBC Planet Earth, макро",      prompt:"nature documentary style, BBC Planet Earth aesthetic, macro nature photography, golden hour, wildlife cinematography" },
  { id:"RETROFUTURE", icon:"🚀", col:"#f59e0b", label:"Ретрофутуризм",  desc:"60е + космос, хром",           prompt:"retro-futurist aesthetic, 1960s space age design, chrome details, atomic age optimism, Kubrick inspired" },
  { id:"GLITCH_ART",  icon:"📡", col:"#10b981", label:"Глитч-арт",      desc:"VHS, пиксельный распад",       prompt:"glitch art aesthetic, VHS distortion, digital artifacts, pixel corruption, RGB split, scanlines, data moshing" },
];

const DURATION_CONFIG = {
  "15 сек":    { sec:15,  frames:5,  hint:"5 кадров · 3 сек" },
  "30–45 сек": { sec:38,  frames:13, hint:"13 кадров · 3 сек" },
  "До 60 сек": { sec:60,  frames:20, hint:"20 кадров · 3 сек" },
  "1.5 мин":   { sec:90,  frames:30, hint:"30 кадров · 3 сек" },
  "3 мин":     { sec:180, frames:60, hint:"60 кадров · 3 сек" },
};

const DURATIONS = Object.keys(DURATION_CONFIG);
const HOOKS     = ["⚡ ШОК","🔮 ТАЙНА","☠ ОПАСНОСТЬ","🌀 ПАРАДОКС","🩸 ПРОВОКАЦИЯ","👁 ЗАПРЕТ"];
const PLATFORMS = [
  { id:"YouTube",   icon:"▶", col:"#ff0000" },
  { id:"TikTok",    icon:"♪", col:"#00e5ff" },
  { id:"Instagram", icon:"◈", col:"#e1306c" },
  { id:"Facebook",  icon:"ƒ", col:"#1877f2" },
  { id:"Telegram",  icon:"✈", col:"#229ed9" },
];
const PALETTE = ["#ff3355","#f97316","#eab308","#06b6d4","#a855f7","#22c55e"];

const VIRAL_SYSTEM = `### SYSTEM ROLE & VIRAL ALGORITHMS (STRICT JSON ADHERENCE REQUIRED)
Ты профессиональный режиссер вирусных видео. ТВОЯ ГЛАВНАЯ И ЕДИНСТВЕННАЯ ЗАДАЧА - ВЫДАТЬ ОТВЕТ В СТРОГОМ ФОРМАТЕ JSON.
Никакого текста до или после JSON. Никаких маркдаун-блоков (без \`\`\`json). ТОЛЬКО ВАЛИДНЫЙ JSON!

СТРУКТУРА JSON ДОЛЖНА БЫТЬ ТАКОЙ:
{
  "hooks": [
    {"text": "Фраза диктора на 0-2 сек", "visual": "Детальное описание визуального хука"}
  ],
  "frames": [
    {
      "timecode": "0-3 сек",
      "camera": "описание движения",
      "visual": "что происходит в кадре",
      "voice": "слова диктора",
      "audio": "звуки и ASMR",
      "imgPrompt": "ENGLISH VEO/WHISK PROMPT STRICTLY IN ENGLISH",
      "vidPrompt": "ENGLISH GROK SUPER PROMPT STRICTLY IN ENGLISH"
    }
  ],
  "thumbnail": {
    "text": "2-4 слова",
    "prompt": "ENGLISH VEO/WHISK PROMPT: 1 main object, high contrast, cinematic lighting, 8K"
  }
}

ЖЕСТКИЕ ПРАВИЛА:
1. Ключи imgPrompt, vidPrompt и thumbnail.prompt ДОЛЖНЫ БЫТЬ ТОЛЬКО НА АНГЛИЙСКОМ!
2. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать Midjourney или Leonardo.
3. Массив "frames" должен содержать ТОЧНОЕ количество кадров. Один кадр = один imgPrompt + один vidPrompt.
4. Выдавай только JSON.`;

async function callAPI(content, maxTokens = 6000) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: VIRAL_SYSTEM }, { role: "user", content }],
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.error);
  const text = data.text || data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Пустой ответ API");
  return text;
}

function CopyBtn({ text, label="Копировать", small=false }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={e=>{ e.stopPropagation(); try{navigator.clipboard?.writeText(text)}catch{}; setOk(true); setTimeout(()=>setOk(false),2000); }}
      style={{background:ok?"rgba(34,197,94,.18)":"rgba(255,255,255,.07)",border:`1px solid ${ok?"#22c55e88":"rgba(255,255,255,.12)"}`,borderRadius:20,padding:small?"4px 10px":"6px 14px",fontSize:small?10:11,color:ok?"#4ade80":"rgba(255,255,255,.5)",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
      {ok?"✓ Скопировано":label}
    </button>
  );
}

function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t); },[onDone]);
  return <div style={{position:"fixed",bottom:110,left:"50%",transform:"translateX(-50%)",background:"rgba(239,68,68,.92)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,100,100,.4)",borderRadius:14,padding:"10px 18px",fontSize:12,fontWeight:600,color:"#fff",zIndex:200,whiteSpace:"nowrap"}}>⚠ {msg}</div>;
}

function FrameCard({ f, i }) {
  const c = PALETTE[i % PALETTE.length];
  return (
    <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:18,position:"relative",overflow:"hidden",marginBottom:10}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${c},transparent)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:2,background:`${c}22`,color:c,padding:"3px 10px",borderRadius:8}}>#{String(i+1).padStart(2,"0")}</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>{f.timecode || `${i*3}-${(i+1)*3} сек`}</span>
      </div>
      {f.camera && <div style={{fontSize:11,color:"#fbbf24",marginBottom:6}}>📷 {f.camera}</div>}
      {f.visual && <div style={{fontSize:13,color:"rgba(255,255,255,.75)",lineHeight:1.7,marginBottom:8}}>{f.visual}</div>}
      {f.voice  && <div style={{fontSize:12,fontStyle:"italic",color:"rgba(255,255,255,.4)",borderLeft:`2px solid ${c}55`,paddingLeft:10,marginBottom:10}}>«{f.voice}»</div>}
      {f.imgPrompt && (
        <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:"10px 12px",marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:2,color:"#4ade80"}}>🖼 IMAGE (VEO/WHISK)</span>
            <CopyBtn text={f.imgPrompt} label="Copy" small/>
          </div>
          <div style={{fontFamily:"monospace",fontSize:11,lineHeight:1.7,color:"rgba(255,255,255,.55)",userSelect:"text",wordBreak:"break-word"}}>{f.imgPrompt}</div>
        </div>
      )}
      {f.vidPrompt && (
        <div style={{background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.2)",borderRadius:12,padding:"10px 12px",marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:2,color:"#818cf8"}}>🎥 VIDEO (GROK SUPER)</span>
            <CopyBtn text={f.vidPrompt} label="Copy" small/>
          </div>
          <div style={{fontFamily:"monospace",fontSize:11,lineHeight:1.7,color:"rgba(255,255,255,.5)",userSelect:"text",wordBreak:"break-word"}}>{f.vidPrompt}</div>
        </div>
      )}
      {f.audio && <div style={{fontSize:11,color:"rgba(255,255,255,.3)",background:"rgba(255,255,255,.04)",borderRadius:8,padding:"5px 10px",marginTop:3}}>🎧 {f.audio}</div>}
    </div>
  );
}

function LoadingScreen() {
  const STEPS = ["Анализирую тему…","Строю раскадровку…","Прописываю физику…","Подбираю промпты…","Проверяю тайминг…"];
  const [step, setStep] = useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setStep(s=>Math.min(s+1,STEPS.length-1)),1800); return()=>clearInterval(iv); },[]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 40px",textAlign:"center"}}>
      <div style={{width:60,height:60,border:"3px solid rgba(255,51,85,.12)",borderTopColor:"#ff3355",borderRadius:"50%",animation:"spin .9s linear infinite",marginBottom:28}}/>
      <div style={{fontSize:19,fontWeight:800,background:"linear-gradient(135deg,#ff3355,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>Режиссёр думает…</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:24}}>{STEPS[step]}</div>
      <div style={{display:"flex",gap:6}}>
        {STEPS.map((_,i)=><div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i<=step?"#ff3355":"rgba(255,255,255,.12)",transition:"all .4s"}}/>)}
      </div>
    </div>
  );
}

export default function Page() {
  const [topic,  setTopic]  = useState("");
  const [script, setScript] = useState("");
  const [genre,  setGenre]  = useState("КРИМИНАЛ");
  const [hook,   setHook]   = useState("⚡ ШОК");
  const [dur,    setDur]    = useState("До 60 сек");
  const [plat,   setPlat]   = useState("YouTube");
  const [lang,   setLang]   = useState("RU");
  const [style,  setStyle]  = useState("CINEMATIC");

  const [view, setView] = useState("form");
  const [tab,  setTab]  = useState("storyboard");
  const [result,  setResult]  = useState("");
  
  const [frames,  setFrames]  = useState([]);
  const [hooksList, setHooksList] = useState([]);
  const [thumb, setThumb] = useState(null);
  const [imgP,    setImgP]    = useState([]);
  const [vidP,    setVidP]    = useState([]);
  
  const [tags,    setTags]    = useState({});
  const [busy,     setBusy]     = useState(false);
  const [busyTags, setBusyTags] = useState(false);
  const [err,      setErr]      = useState("");
  const [toast,    setToast]    = useState("");

  // СИСТЕМА ИСТОРИИ (LOCAL STORAGE)
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ds_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const scrollRef = useRef(null);
  const preset = GENRE_PRESETS[genre];
  const sty    = STORYBOARD_STYLES.find(s=>s.id===style) || STORYBOARD_STYLES[0];
  const durCfg = DURATION_CONFIG[dur] || DURATION_CONFIG["До 60 сек"];

  useEffect(()=>{ scrollRef.current?.scrollTo({top:0,behavior:"smooth"}); },[view]);

  // ОБРАБОТЧИК JSON ОТВЕТА С СОХРАНЕНИЕМ В ИСТОРИЮ
  function applyResult(rawText, fromHistory = false) {
    try {
      let cleanText = rawText.replace(/```json|```/gi, "").trim();
      const startIdx = cleanText.indexOf('{');
      const endIdx = cleanText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanText = cleanText.substring(startIdx, endIdx + 1);
      }

      const data = JSON.parse(cleanText);
      const frms = data.frames || [];
      const imgs = frms.map(f => f.imgPrompt).filter(Boolean);
      const vids = frms.map(f => f.vidPrompt).filter(Boolean);

      setFrames(frms);
      setHooksList(data.hooks || []);
      setThumb(data.thumbnail || null);
      setImgP(imgs);
      setVidP(vids);

      let scriptText = "🔥 ВАРИАНТЫ HOOK:\n" + 
        (data.hooks || []).map((h, i)=>`${i+1}. 🗣 ${h.text}\n   🎬 ${h.visual}`).join("\n\n") + 
        "\n\n🎬 СЦЕНАРИЙ:\n" + frms.map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n📷 Камера: ${f.camera}\n👁 Визуал: ${f.visual}\n🎙 Диктор: «${f.voice}»\n🎧 Звук: ${f.audio}`).join("\n\n");

      if (data.thumbnail) {
        scriptText += `\n\n🖼 ПРЕВЬЮ (ОБЛОЖКА):\nТекст: [ ${data.thumbnail.text} ]\nПромпт: ${data.thumbnail.prompt}`;
      }

      setResult(scriptText);
      setTags({});
      setTab("storyboard");
      setView("result");

      // Сохранение в LocalStorage
      if (!fromHistory) {
        const title = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация по сценарию";
        const newItem = {
          id: Date.now(),
          topic: title,
          time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}),
          text: cleanText
        };
        setHistory(prev => {
          const next = [newItem, ...prev].slice(0, 10); // Храним последние 10 штук
          localStorage.setItem("ds_history", JSON.stringify(next));
          return next;
        });
      }
    } catch(e) {
      console.error(e);
      setErr("Ошибка: Нейросеть нарушила структуру. Попробуйте еще раз.");
      setView("form");
    }
  }

  function clearHistory() {
    localStorage.removeItem("ds_history");
    setHistory([]);
    setShowHistory(false);
  }

  function buildUserPrompt(fromScript) {
    const ctx = `ТЕМА: ${topic || "из готового сценария"}
ЖАНР: ${genre} | ПЛАТФОРМА: ${plat} | ЯЗЫК: ${lang}
ФИЗИКА: ${preset.physics} | СВЕТ: ${preset.light} | ASMR: ${preset.asmr}
СТИЛЬ: ${sty.label} — ${sty.prompt}
ДЛИТЕЛЬНОСТЬ: ${dur} → СТРОГО ${durCfg.frames} КАДРОВ. ТИП HOOK: ${hook}`;

    const req = `ВЫДАЙ ОТВЕТ СТРОГО В ФОРМАТЕ JSON. МАССИВ "frames" ДОЛЖЕН СОДЕРЖАТЬ РОВНО ${durCfg.frames} ЭЛЕМЕНТОВ! Распиши 3 хука и обложку.`;

    if (fromScript) return `${ctx}\n\nГОТОВЫЙ СЦЕНАРИЙ:\n${script.trim()}\n\n${req}`;
    return `${ctx}\n\n${req}`;
  }

  async function handleGenerate() {
    if (!topic.trim()) { setErr("Введите тему!"); return; }
    setErr(""); setBusy(true); setView("loading");
    try {
      const text = await callAPI(buildUserPrompt(false));
      applyResult(text, false);
    } catch(e) { setErr(e.message); setView("form"); } finally { setBusy(false); }
  }

  async function handleGenerateFromScript() {
    if (!script.trim()) { setErr("Вставьте готовый сценарий!"); return; }
    setErr(""); setBusy(true); setView("loading");
    try {
      const text = await callAPI(buildUserPrompt(true));
      applyResult(text, false);
    } catch(e) { setErr(e.message); setView("form"); } finally { setBusy(false); }
  }

  async function handleGenTags() {
    if (!result) return;
    setBusyTags(true);
    try {
      const raw = await callAPI(`Сгенерируй JSON с хештегами для темы: "${topic}". МИНИМУМ по 5 штук для каждой платформы! Микс русских и английских хештегов. Формат: {"YouTube":["#a","#b","#c","#d","#e"], "TikTok":["#a","#b","#c","#d","#e"], "Instagram":["#a","#b","#c","#d","#e"], "Facebook":["#a","#b","#c","#d","#e"], "Telegram":["#a","#b","#c","#d","#e"]}`, 800);
      let cleanText = raw.replace(/```json|```/gi, "").trim();
      const startIdx = cleanText.indexOf('{');
      const endIdx = cleanText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) cleanText = cleanText.substring(startIdx, endIdx + 1);
      setTags(JSON.parse(cleanText));
      setTab("hashtags");
    } catch { setToast("Не удалось получить хештеги."); } finally { setBusyTags(false); }
  }

  const S = {
    root:    { minHeight:"100vh", background:"#08080f", color:"#d0d4e8", fontFamily:"-apple-system,'SF Pro Text',sans-serif", paddingBottom:110, overflowY:"auto" },
    nav:     { position:"sticky", top:0, zIndex:50, background:"rgba(8,8,15,.92)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,.06)", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" },
    label:   { fontSize:10, fontWeight:700, letterSpacing:3, color:"rgba(255,255,255,.3)", display:"block", marginBottom:10 },
    section: { marginBottom:24 },
    ta:      { width:"100%", background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(255,255,255,.1)", borderRadius:14, padding:"14px 16px", fontSize:14, color:"#fff", fontFamily:"inherit", resize:"none", lineHeight:1.6 },
  };

  return (
    <div ref={scrollRef} style={S.root}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes glow{0%,100%{box-shadow:0 0 30px rgba(255,51,85,.35)}50%{box-shadow:0 0 60px rgba(255,51,85,.6)}}
        .gbtn{width:100%;height:60px;border:none;border-radius:18px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(135deg,#c8001e,#ff1a3d,#ff4d1a,#ff8800);background-size:300% 300%;animation:shimmer 4s linear infinite,glow 3s ease-in-out infinite;transition:transform .15s}
        .gbtn:hover{transform:translateY(-2px)}
        .gbtn:disabled{opacity:.4;cursor:not-allowed;animation:none;box-shadow:none}
        textarea:focus{outline:none;border-color:rgba(255,51,85,.6)!important}
      `}</style>
      
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}

      {/* МОДАЛЬНОЕ ОКНО ИСТОРИИ */}
      {showHistory && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",backdropFilter:"blur(8px)"}}>
          <div style={{background:"#111118",border:"1px solid rgba(255,51,85,.3)",borderRadius:20,width:"90%",maxWidth:400,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
             <div style={{padding:20,borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <span style={{fontWeight:700,color:"#fff"}}>🕒 История (последние 10)</span>
               <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer"}}>✕</button>
             </div>
             <div style={{padding:20,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
               {history.length===0 ? <div style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:"20px 0"}}>История пуста</div> :
                 history.map((h) => (
                   <div key={h.id} style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:14,cursor:"pointer",border:"1px solid rgba(255,255,255,.1)"}} 
                        onClick={() => { applyResult(h.text, true); setShowHistory(false); }}>
                     <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginBottom:4}}>{h.time}</div>
                     <div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.4}}>{h.topic}</div>
                   </div>
                 ))
               }
             </div>
             {history.length > 0 && (
               <div style={{padding:20,borderTop:"1px solid rgba(255,255,255,.05)"}}>
                 <button onClick={clearHistory} style={{width:"100%",background:"rgba(255,51,85,.1)",color:"#ff3355",border:"none",padding:"12px",borderRadius:12,fontWeight:700,cursor:"pointer"}}>Очистить историю</button>
               </div>
             )}
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {view==="result" && <button onClick={()=>setView("form")} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,width:34,height:34,color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginRight:4}}>‹</button>}
          <span style={{fontSize:17,fontWeight:800,color:"#fff",letterSpacing:"-.5px"}}>Docu<span style={{color:"#ff3355"}}>Shorts</span></span>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:2,background:"linear-gradient(135deg,#ff3355,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",border:"1px solid rgba(255,51,85,.35)",padding:"2px 7px",borderRadius:6}}>PRO</span>
        </div>
        
        {/* КНОПКИ В ПАНЕЛИ НАВИГАЦИИ */}
        <div style={{display:"flex",gap:6}}>
          {view==="form" && (
            <button onClick={()=>setShowHistory(true)} style={{height:34,padding:"0 14px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,color:"rgba(255,255,255,.75)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>🕒 История</button>
          )}
          {view==="result" && result && (
            <>
              <button onClick={()=>setView("form")} style={{height:34,padding:"0 12px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,color:"rgba(255,255,255,.75)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↺ Изменить</button>
              <button onClick={handleGenTags} disabled={busyTags} style={{height:34,padding:"0 14px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,color:"rgba(255,255,255,.75)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{busyTags?"...":"# Хештеги"}</button>
            </>
          )}
        </div>
      </nav>

      {view==="form" && (
        <div style={{maxWidth:480,margin:"0 auto",padding:"24px 18px"}}>
          <div style={S.section}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <label style={{...S.label,marginBottom:0}}>ТЕМА *</label>
            </div>
            <textarea rows={2} value={topic} maxLength={200} onChange={e=>setTopic(e.target.value)} placeholder="Например: Перевал Дятлова..." style={S.ta}/>
          </div>
          <div style={S.section}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <label style={{...S.label,marginBottom:0}}>ГОТОВЫЙ СЦЕНАРИЙ</label>
            </div>
            <textarea rows={4} value={script} onChange={e=>setScript(e.target.value)} placeholder="Вставьте текст..." style={{...S.ta,fontSize:13}}/>
            {script.trim()&&<button onClick={handleGenerateFromScript} disabled={busy} style={{marginTop:8,width:"100%",height:46,border:"none",borderRadius:14,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>🎬 Из сценария</button>}
          </div>

          <div style={S.section}>
            <label style={S.label}>ЖАНР</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?`${p.col}1a`:"rgba(255,255,255,.04)",border:`1.5px solid ${genre===g?p.col+"80":"rgba(255,255,255,.08)"}`,borderRadius:14,padding:"10px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <span style={{fontSize:20}}>{p.icon}</span><span style={{fontSize:9,color:genre===g?p.col:"rgba(255,255,255,.3)",fontWeight:700}}>{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>ТИП HOOK</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {HOOKS.map(h=><button key={h} onClick={()=>setHook(h)} style={{background:hook===h?"rgba(255,51,85,.18)":"rgba(255,255,255,.04)",border:`1.5px solid ${hook===h?"#ff335580":"rgba(255,255,255,.08)"}`,borderRadius:20,padding:"7px 14px",fontSize:12,color:hook===h?"#ff3355":"rgba(255,255,255,.4)",cursor:"pointer"}}>{h}</button>)}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>СТИЛЬ РАСКАДРОВКИ</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7}}>
              {STORYBOARD_STYLES.map(s=>(
                <button key={s.id} onClick={()=>setStyle(s.id)} style={{background:style===s.id?`${s.col}1a`:"rgba(255,255,255,.03)",border:`1.5px solid ${style===s.id?s.col+"80":"rgba(255,255,255,.07)"}`,borderRadius:14,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:9,textAlign:"left"}}>
                  <span style={{fontSize:18}}>{s.icon}</span>
                  <div><div style={{fontSize:11,fontWeight:700,color:style===s.id?s.col:"rgba(255,255,255,.6)"}}>{s.label}</div><div style={{fontSize:9,color:"rgba(255,255,255,.22)"}}>{s.desc}</div></div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <label style={S.label}>ДЛИТЕЛЬНОСТЬ</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {DURATIONS.map(d=><button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.18)":"rgba(255,255,255,.04)",border:`1.5px solid ${dur===d?"#f9731680":"rgba(255,255,255,.08)"}`,borderRadius:20,padding:"7px 14px",fontSize:12,color:dur===d?"#f97316":"rgba(255,255,255,.4)",cursor:"pointer"}}>{d}</button>)}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label style={S.label}>ПЛАТФОРМА</label>
              {PLATFORMS.map(p=><button key={p.id} onClick={()=>setPlat(p.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:plat===p.id?`${p.col}14`:"rgba(255,255,255,.03)",border:`1.5px solid ${plat===p.id?p.col+"55":"rgba(255,255,255,.07)"}`,borderRadius:12,padding:"9px 12px",cursor:"pointer",marginBottom:5}}><span style={{fontSize:14,color:plat===p.id?p.col:"rgba(255,255,255,.3)"}}>{p.icon}</span><span style={{fontSize:12,fontWeight:plat===p.id?700:400,color:plat===p.id?p.col:"rgba(255,255,255,.4)"}}>{p.id}</span></button>)}
            </div>
            <div>
              <label style={S.label}>ЯЗЫК</label>
              {["RU","EN"].map(l=><button key={l} onClick={()=>setLang(l)} style={{display:"block",width:"100%",background:lang===l?"rgba(255,51,85,.15)":"rgba(255,255,255,.03)",border:`1.5px solid ${lang===l?"#ff335555":"rgba(255,255,255,.07)"}`,borderRadius:12,padding:"11px",cursor:"pointer",marginBottom:5,fontSize:14,color:lang===l?"#ff3355":"rgba(255,255,255,.35)"}}>{l}</button>)}
            </div>
          </div>
          {err&&<div style={{background:"rgba(255,51,85,.1)",border:"1px solid rgba(255,51,85,.3)",borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#fca5a5"}}>⚠ {err}</div>}
        </div>
      )}

      {view==="loading"&&<LoadingScreen/>}

      {view==="result"&&result&&(
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"0 16px",position:"sticky",top:56,zIndex:40,background:"rgba(8,8,15,.95)",backdropFilter:"blur(20px)",overflowX:"auto"}}>
            {[{id:"storyboard",label:"Раскадровка",badge:frames.length},{id:"raw",label:"Сценарий"},{id:"prompts",label:"Промпты",badge:(imgP.length+vidP.length)||null},{id:"hashtags",label:"Хештеги",badge:Object.keys(tags).length||null}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"none",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#ff3355":"transparent"}`,color:tab===t.id?"#ff3355":"rgba(255,255,255,.3)",fontSize:12,padding:"13px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                {t.label}{t.spin?<span style={{width:10,height:10,border:"1.5px solid rgba(255,51,85,.3)",borderTopColor:"#ff3355",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>:t.badge>0&&<span style={{background:"#ff3355",color:"#fff",fontSize:9,padding:"1px 5px",borderRadius:6}}>{t.badge}</span>}
              </button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",paddingRight:4}}><CopyBtn text={result} label="⎘" small/></div>
          </div>

          <div style={{padding:"18px 16px"}}>
            {tab==="storyboard"&&(
              <div>
                {/* БЛОК ХУКОВ */}
                {hooksList.length > 0 && (
                  <div style={{marginBottom: 20}}>
                    <div style={{fontSize:11, letterSpacing:1, color:"#ff3355", fontWeight:800, marginBottom:10}}>🔥 ВАРИАНТЫ HOOK</div>
                    {hooksList.map((h, i) => (
                      <div key={i} style={{background:"rgba(255,51,85,.05)", border:"1px solid rgba(255,51,85,.2)", borderRadius:14, padding:14, marginBottom:8}}>
                        <div style={{fontSize:13, fontWeight:700, color:"#fff", marginBottom:6, lineHeight:1.4}}>🗣 «{h.text}»</div>
                        <div style={{fontSize:11, color:"rgba(255,255,255,.6)", lineHeight:1.5}}>🎬 {h.visual}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* КАДРЫ РАСКАДРОВКИ */}
                {frames.map((f,i)=><FrameCard key={i} f={f} i={i}/>)}
                
                {/* БЛОК ПРЕВЬЮ (THUMBNAIL) */}
                {thumb && (
                  <div style={{marginTop: 20, background:"rgba(249,115,22,.05)", border:"1px solid rgba(249,115,22,.2)", borderRadius:16, padding:16}}>
                    <div style={{fontSize:11, letterSpacing:1, color:"#f97316", fontWeight:800, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <span>🖼 ПРЕВЬЮ ОБЛОЖКИ</span>
                      <CopyBtn text={thumb.prompt} label="Copy Prompt" small />
                    </div>
                    <div style={{fontSize:16, fontWeight:800, color:"#fff", textAlign:"center", marginBottom:12, textTransform:"uppercase", letterSpacing:1, background:"#000", padding:"10px", borderRadius:8, border:"1px solid rgba(255,255,255,.1)"}}>
                      [ {thumb.text} ]
                    </div>
                    <div style={{fontFamily:"monospace", fontSize:11, lineHeight:1.7, color:"rgba(255,255,255,.55)", userSelect:"text"}}>{thumb.prompt}</div>
                  </div>
                )}
              </div>
            )}
            
            {tab==="raw"&&(<div style={{background:"rgba(255,255,255,.025)",borderRadius:18,padding:20}}><pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(255,255,255,.55)",userSelect:"text"}}>{result}</pre></div>)}
            {tab==="prompts"&&(
              <div>
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:9,fontWeight:700,color:"#4ade80"}}>🖼 IMAGE PROMPTS</span>{imgP.length>0&&<CopyBtn text={imgP.join("\n\n")} label="Все" small/>}</div>
                  {imgP.length>0?imgP.map((p,i)=><div key={i} style={{background:"rgba(34,197,94,.04)",border:"1px solid rgba(34,197,94,.15)",borderRadius:14,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,color:"#4ade80",fontWeight:700}}>IMG {i+1}</span><CopyBtn text={p} label="Copy" small/></div><div style={{fontSize:11,color:"rgba(255,255,255,.5)",userSelect:"text"}}>{p}</div></div>):<div style={{fontSize:12,color:"rgba(255,255,255,.2)"}}>Промпты отсутствуют</div>}
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:9,fontWeight:700,color:"#818cf8"}}>🎥 VIDEO PROMPTS</span>{vidP.length>0&&<CopyBtn text={vidP.join("\n\n")} label="Все" small/>}</div>
                  {vidP.length>0?vidP.map((p,i)=><div key={i} style={{background:"rgba(99,102,241,.04)",border:"1px solid rgba(99,102,241,.15)",borderRadius:14,padding:14,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,color:"#818cf8",fontWeight:700}}>VID {i+1}</span><CopyBtn text={p} label="Copy" small/></div><div style={{fontSize:11,color:"rgba(255,255,255,.45)",userSelect:"text"}}>{p}</div></div>):<div style={{fontSize:12,color:"rgba(255,255,255,.2)"}}>Промпты отсутствуют</div>}
                </div>
              </div>
            )}
            {tab==="hashtags"&&(<div>{Object.keys(tags).length>0?PLATFORMS.map(p=>tags[p.id]&&<div key={p.id} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${p.col}25`,borderRadius:16,padding:16,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:p.col}}>{p.id}</span><CopyBtn text={tags[p.id].join(" ")} label="Копировать"/></div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{tags[p.id].map((t,i)=><span key={i} style={{background:`${p.col}18`,border:`1px solid ${p.col}35`,borderRadius:20,padding:"4px 12px",fontSize:12,color:p.col}}>{t}</span>)}</div></div>):<button onClick={handleGenTags} style={{color:"#ff3355"}}>Сгенерировать</button>}</div>)}
          </div>
        </div>
      )}
      {view==="form"&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 18px 32px",background:"linear-gradient(to top,#08080f 60%,transparent)",zIndex:100}}>
          <button className="gbtn" onClick={handleGenerate} disabled={busy}>{busy?"Генерирую…":"▶  Создать план"}</button>
        </div>
      )}
    </div>
  );
}
