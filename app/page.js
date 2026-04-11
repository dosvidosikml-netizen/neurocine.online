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

// СИСТЕМНЫЙ ПРОМПТ ДЛЯ РАСКАДРОВКИ (JSON)
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

// УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК API
async function callAPI(content, maxTokens = 6000, sysPrompt = VIRAL_SYSTEM) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: sysPrompt }, { role: "user", content }],
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

function LoadingScreen({ msg }) {
  const STEPS = ["Анализирую тему…","Строю раскадровку…","Прописываю физику…","Подбираю промпты…","Проверяю тайминг…"];
  const [step, setStep] = useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setStep(s=>Math.min(s+1,STEPS.length-1)),1800); return()=>clearInterval(iv); },[]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 40px",textAlign:"center"}}>
      <div style={{width:60,height:60,border:"3px solid rgba(255,51,85,.12)",borderTopColor:"#ff3355",borderRadius:"50%",animation:"spin .9s linear infinite",marginBottom:28}}/>
      <div style={{fontSize:19,fontWeight:800,background:"linear-gradient(135deg,#ff3355,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>{msg || "Режиссёр думает…"}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:24}}>{!msg ? STEPS[step] : "Обработка..."}</div>
      {!msg && (
        <div style={{display:"flex",gap:6}}>
          {STEPS.map((_,i)=><div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i<=step?"#ff3355":"rgba(255,255,255,.12)",transition:"all .4s"}}/>)}
        </div>
      )}
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
  const [loadingMsg, setLoadingMsg] = useState("");
  const [tab,  setTab]  = useState("storyboard");
  const [result,  setResult]  = useState("");
  
  const [frames,  setFrames]  = useState([]);
  const [hooksList, setHooksList] = useState([]);
  const [thumb, setThumb] = useState(null);
  const [imgP,    setImgP]    = useState([]);
  const [vidP,    setVidP]    = useState([]);
  
  const [tags,    setTags]    = useState({});
  const [ttsSettings, setTtsSettings] = useState(""); // Настройки Google AI Studio
  const [busy,     setBusy]     = useState(false);
  const [busyTags, setBusyTags] = useState(false);
  const [busyScriptProcess, setBusyScriptProcess] = useState(false);
  const [busyTts, setBusyTts] = useState(false);
  const [err,      setErr]      = useState("");
  const [toast,    setToast]    = useState("");

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

      if (!fromHistory) {
        const title = topic ? (topic.length > 30 ? topic.substring(0,30)+"..." : topic) : "Генерация по сценарию";
        const newItem = {
          id: Date.now(),
          topic: title,
          time: new Date().toLocaleString("ru-RU", {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}),
          text: cleanText
        };
        setHistory(prev => {
          const next = [newItem, ...prev].slice(0, 10);
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

  async function handleWriteScript() {
    if (!topic.trim()) { setErr("Сначала введите тему в поле выше!"); return; }
    setErr(""); setBusyScriptProcess(true); setLoadingMsg("Пишу сценарий..."); setView("loading");
    try {
      const sysTxt = `Ты топовый сценарист вирусных коротких видео. Твоя задача — написать ТОЛЬКО мощный текст для диктора по теме.
Никаких описаний кадров, никаких ремарок, никаких приветствий ИИ или JSON. ТОЛЬКО чистый текст диктора, который будет звучать в видео. 
Учитывай темп, делай микро-паузы, используй короткие цепкие предложения, которые держат внимание.`;
      const prompt = `Тема: ${topic}\nПлатформа: ${plat}\nЖанр: ${genre}\nЯзык: ${lang}\nОжидаемая длительность: ${dur}\nХук-эмоция: ${hook}\n\nНапиши чистый текст диктора.`;
      const text = await callAPI(prompt, 2000, sysTxt);
      setScript(text.trim());
      setToast("Текст сгенерирован! Можете его отредактировать.");
    } catch(e) {
      setErr("Ошибка: " + e.message);
    } finally {
      setBusyScriptProcess(false);
      setView("form");
    }
  }

  async function handlePrepareVoice() {
    if (!script.trim()) { setErr("Вставьте исходный текст для обработки!"); return; }
    setErr(""); setBusyScriptProcess(true); setLoadingMsg("Расставляю ударения..."); setView("loading");
    try {
      const sysVoice = `Ты эксперт-редактор и диктор. Твоя задача — обработать текст для озвучки ИИ-диктором.
1. Сделай текст уникальным, ритмичным и удерживающим внимание.
2. РАССТАВЬ УДАРЕНИЯ во всех словах длиннее одного слога. Ударную гласную делай ЗАГЛАВНОЙ БУКВОЙ (например: 'загАдка', 'человЕк', 'посмотрИте').
3. Добавь паузы (...) для создания интриги.
Верни ТОЛЬКО готовый обработанный текст. БЕЗ приветствий, БЕЗ формата JSON.`;
      
      const text = await callAPI(`Перепиши и расставь ударения в этом тексте:\n\n${script}`, 2000, sysVoice);
      setScript(text.trim());
      setToast("Текст уникализирован и подготовлен для TTS!");
    } catch(e) {
      setErr("Ошибка обработки: " + e.message);
    } finally {
      setBusyScriptProcess(false);
      setView("form");
    }
  }

  // --- НОВАЯ ФУНКЦИЯ ДЛЯ НАСТРОЕК GOOGLE AI STUDIO TTS ---
  async function handleGetTtsSettings() {
    setErr(""); setBusyTts(true);
    try {
      const sysTts = "Ты аудио-режиссер. Твоя задача выдать короткие настройки для Google AI Studio (Gemini 2.5 Pro Preview TTS). Без приветствий и воды.";
      const prompt = `Жанр видео: ${genre}. Платформа: ${plat}.
Выдай настройки в таком формате:
Голос: [Обязательно выбери 1 лучший из: Zephyr, Puck, Charon, Aoede, Fenrir]
Темп: [Укажи темп. Если это TikTok/Reel
