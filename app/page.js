
// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";

// --- ОПТИМИЗИРОВАННЫЙ ФОН ---
const NeuralBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return;
    
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

    for (let i = 0; i < 40; i++) {
      particles.push({ 
        x: Math.random() * canvas.width, 
        y: Math.random() * canvas.height, 
        vx: (Math.random() - 0.5) * 0.5, 
        vy: (Math.random() - 0.5) * 0.5 
      });
    }

    const render = () => {
      ctx.fillStyle = "#05050a"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168, 85, 247, 0.4)"; 
      ctx.strokeStyle = "rgba(168, 85, 247, 0.15)"; 
      ctx.lineWidth = 1;
      
      particles.forEach((p, i) => {
        p.x += p.vx; 
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1; 
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); 
        ctx.fill();
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]; 
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) { 
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

  return <canvas ref={canvasRef} style={{position:"fixed", top:0, left:0, zIndex:-2, width:"100vw", height:"100vh", background: "#05050a"}} />;
};

// --- MAINTENANCE LOCK OVERLAY ---
// ⬇ Сменить пароль здесь (только цифры)
const LOCK_PIN = "2025";

const DemonCanvas = () => {
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",background:"#06000c"}}>

      {/* ── Атмосферный фон ── */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 50% 100%, rgba(80,20,120,0.35) 0%, transparent 70%)"}} />
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 50% 40% at 20% 80%, rgba(40,0,80,0.2) 0%, transparent 60%)"}} />

      {/* ── Звёзды ── */}
      {[...Array(28)].map((_,i) => (
        <div key={i} style={{
          position:"absolute",
          width: i%5===0 ? 3 : 2,
          height: i%5===0 ? 3 : 2,
          borderRadius:"50%",
          background:"#fff",
          left: `${(i * 37 + 11) % 97}%`,
          top: `${(i * 23 + 7) % 55}%`,
          opacity: 0.15 + (i%4)*0.12,
          animation:`starTwinkle ${2+i%3}s ease-in-out infinite`,
          animationDelay:`${(i*0.37)%3}s`
        }}/>
      ))}

      {/* ── Трава / земля ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        height:"28%",
        background:"linear-gradient(to top, rgba(15,5,30,1) 0%, rgba(25,8,50,0.8) 60%, transparent 100%)"
      }}/>
      {/* Линия горизонта */}
      <div style={{
        position:"absolute", bottom:"27%", left:0, right:0, height:1,
        background:"linear-gradient(to right, transparent, rgba(120,60,180,0.4), rgba(168,85,247,0.6), rgba(120,60,180,0.4), transparent)"
      }}/>

      {/* ── МЯЧ ── */}
      <div style={{
        position:"absolute",
        bottom:"27%",
        left:"50%",
        animation:"ballBounce 1.8s cubic-bezier(0.33,0,0.66,1) infinite, ballTravel 6s ease-in-out infinite",
        zIndex:4
      }}>
        {/* Тень мяча */}
        <div style={{
          position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)",
          width:24, height:6, borderRadius:"50%",
          background:"rgba(0,0,0,0.5)",
          animation:"shadowScale 1.8s ease-in-out infinite",
          filter:"blur(3px)"
        }}/>
        {/* Сам мяч — SVG */}
        <svg width="38" height="38" viewBox="0 0 38 38" style={{display:"block", animation:"ballSpin 1.8s linear infinite", filter:"drop-shadow(0 0 8px rgba(255,200,50,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))"}}>
          <defs>
            <radialGradient id="ballGrad" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff9e0"/>
              <stop offset="40%" stopColor="#f5c842"/>
              <stop offset="100%" stopColor="#b8860b"/>
            </radialGradient>
          </defs>
          <circle cx="19" cy="19" r="17" fill="url(#ballGrad)" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
          <path d="M19 2 Q26 8 26 19 Q26 30 19 36 Q12 30 12 19 Q12 8 19 2Z" fill="rgba(0,0,0,0.12)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" fillRule="evenodd"/>
          <path d="M2 19 Q10 13 19 13 Q28 13 36 19 Q28 25 19 25 Q10 25 2 19Z" fill="rgba(0,0,0,0.12)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" fillRule="evenodd"/>
          <ellipse cx="13" cy="12" rx="3" ry="2" fill="rgba(255,255,255,0.35)" transform="rotate(-20,13,12)"/>
        </svg>
      </div>

      {/* ── ДЖЕК-РАССЕЛ (бежит слева) ── */}
      <div style={{
        position:"absolute", bottom:"26.5%",
        animation:"jackRun 6s ease-in-out infinite",
        zIndex:5
      }}>
        <div style={{animation:"dogBob 0.4s ease-in-out infinite", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.7))"}}>
          <svg width="80" height="56" viewBox="0 0 80 56">
            <defs>
              <linearGradient id="jackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5e6c8"/>
                <stop offset="100%" stopColor="#d4a96a"/>
              </linearGradient>
            </defs>
            {/* Тело */}
            <ellipse cx="38" cy="34" rx="22" ry="13" fill="url(#jackGrad)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"/>
            {/* Пятна */}
            <ellipse cx="30" cy="30" rx="8" ry="6" fill="rgba(80,40,10,0.3)"/>
            <ellipse cx="48" cy="36" rx="6" ry="4" fill="rgba(80,40,10,0.25)"/>
            {/* Голова */}
            <circle cx="58" cy="26" r="12" fill="url(#jackGrad)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
            <ellipse cx="54" cy="22" rx="5" ry="4" fill="rgba(80,40,10,0.35)"/>
            {/* Ухо */}
            <ellipse cx="63" cy="16" rx="5" ry="7" fill="#c8975a" transform="rotate(15,63,16)"/>
            {/* Нос */}
            <ellipse cx="68" cy="28" rx="3" ry="2" fill="#1a0a00"/>
            <ellipse cx="67" cy="27" rx="1" ry="0.8" fill="rgba(255,255,255,0.4)"/>
            {/* Глаз */}
            <circle cx="63" cy="22" r="2.5" fill="#1a0a00"/>
            <circle cx="62.5" cy="21.5" r="0.8" fill="rgba(255,255,255,0.7)"/>
            {/* Хвост */}
            <path d="M16 30 Q4 18 8 10" stroke="#d4a96a" strokeWidth="5" fill="none" strokeLinecap="round"/>
            {/* Ноги — бег */}
            <line x1="28" y1="44" x2="22" y2="56" stroke="#c8975a" strokeWidth="5" strokeLinecap="round" style={{transformOrigin:"28px 44px", animation:"legFront 0.4s ease-in-out infinite"}}/>
            <line x1="36" y1="45" x2="44" y2="55" stroke="#c8975a" strokeWidth="5" strokeLinecap="round" style={{transformOrigin:"36px 45px", animation:"legBack 0.4s ease-in-out infinite"}}/>
            <line x1="44" y1="44" x2="38" y2="56" stroke="#d4a96a" strokeWidth="4" strokeLinecap="round" style={{transformOrigin:"44px 44px", animation:"legBack 0.4s ease-in-out infinite 0.2s"}}/>
            <line x1="52" y1="43" x2="58" y2="54" stroke="#d4a96a" strokeWidth="4" strokeLinecap="round" style={{transformOrigin:"52px 43px", animation:"legFront 0.4s ease-in-out infinite 0.2s"}}/>
          </svg>
        </div>
      </div>

      {/* ── НЕМЕЦКАЯ ОВЧАРКА (бежит справа, навстречу) ── */}
      <div style={{
        position:"absolute", bottom:"26%",
        animation:"shepRun 6s ease-in-out infinite",
        zIndex:5
      }}>
        <div style={{animation:"dogBob 0.35s ease-in-out infinite 0.15s", transform:"scaleX(-1)", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.7))"}}>
          <svg width="96" height="66" viewBox="0 0 96 66">
            <defs>
              <linearGradient id="shepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b6914"/>
                <stop offset="50%" stopColor="#5c3d0a"/>
                <stop offset="100%" stopColor="#2a1500"/>
              </linearGradient>
              <linearGradient id="shepLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c8901a"/>
                <stop offset="100%" stopColor="#6b3f08"/>
              </linearGradient>
            </defs>
            {/* Тело */}
            <ellipse cx="46" cy="40" rx="28" ry="16" fill="url(#shepGrad)"/>
            {/* Спина темнее */}
            <ellipse cx="40" cy="32" rx="20" ry="8" fill="rgba(0,0,0,0.35)"/>
            {/* Бок светлее */}
            <ellipse cx="52" cy="44" rx="14" ry="7" fill="url(#shepLight)" opacity="0.6"/>
            {/* Голова */}
            <ellipse cx="70" cy="28" rx="13" ry="11" fill="url(#shepGrad)"/>
            {/* Морда вытянутая */}
            <ellipse cx="82" cy="33" rx="9" ry="6" fill="#7a5010"/>
            {/* Уши стоячие */}
            <polygon points="64,18 60,2 70,14" fill="#3d2008"/>
            <polygon points="74,16 72,1 80,13" fill="#3d2008"/>
            <polygon points="65,18 62,6 69,15" fill="#7a5010"/>
            <polygon points="75,16 73,5 79,14" fill="#7a5010"/>
            {/* Нос */}
            <ellipse cx="89" cy="34" rx="4" ry="2.5" fill="#0d0600"/>
            <ellipse cx="88" cy="33" rx="1.2" ry="0.9" fill="rgba(255,255,255,0.35)"/>
            {/* Глаз */}
            <circle cx="76" cy="25" r="3" fill="#0d0600"/>
            <circle cx="75" cy="24" r="1" fill="rgba(255,255,255,0.6)"/>
            <circle cx="77" cy="24.5" r="0.5" fill="rgba(255,200,0,0.3)"/>
            {/* Хвост пушистый */}
            <path d="M18 36 Q4 22 10 12 Q14 6 18 14" stroke="#5c3d0a" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <path d="M18 36 Q2 24 8 12" stroke="#8b6914" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
            {/* Ноги */}
            <line x1="32" y1="52" x2="24" y2="66" stroke="#5c3d0a" strokeWidth="6" strokeLinecap="round" style={{transformOrigin:"32px 52px", animation:"legFront 0.35s ease-in-out infinite"}}/>
            <line x1="42" y1="54" x2="52" y2="65" stroke="#5c3d0a" strokeWidth="6" strokeLinecap="round" style={{transformOrigin:"42px 54px", animation:"legBack 0.35s ease-in-out infinite"}}/>
            <line x1="54" y1="52" x2="46" y2="66" stroke="#6b4510" strokeWidth="5" strokeLinecap="round" style={{transformOrigin:"54px 52px", animation:"legBack 0.35s ease-in-out infinite 0.17s"}}/>
            <line x1="64" y1="50" x2="72" y2="63" stroke="#6b4510" strokeWidth="5" strokeLinecap="round" style={{transformOrigin:"64px 50px", animation:"legFront 0.35s ease-in-out infinite 0.17s"}}/>
          </svg>
        </div>
      </div>

      {/* ── Пылевые следы ── */}
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          position:"absolute", bottom:"25%",
          width:6+i*2, height:6+i*2, borderRadius:"50%",
          background:"rgba(120,80,200,0.12)",
          filter:"blur(4px)",
          animation:`dustPuff ${1.2+i*0.3}s ease-out infinite`,
          animationDelay:`${i*0.25}s`,
          left:`${15+i*14}%`
        }}/>
      ))}

      <style>{`
        @keyframes starTwinkle {
          0%,100%{opacity:0.1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(1.5)}
        }
        @keyframes ballBounce {
          0%,100%{transform:translateY(0) scaleX(1) scaleY(1)}
          40%{transform:translateY(-90px) scaleX(0.95) scaleY(1.05)}
          90%{transform:translateY(-8px) scaleX(1) scaleY(1)}
          95%{transform:translateY(0) scaleX(1.15) scaleY(0.85)}
        }
        @keyframes ballTravel {
          0%{left:20%}
          50%{left:65%}
          100%{left:20%}
        }
        @keyframes ballSpin {
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }
        @keyframes shadowScale {
          0%,100%{transform:translateX(-50%) scaleX(1);opacity:0.5}
          40%{transform:translateX(-50%) scaleX(0.3);opacity:0.15}
          95%{transform:translateX(-50%) scaleX(1.3);opacity:0.6}
        }
        @keyframes jackRun {
          0%{left:8%}
          50%{left:52%}
          100%{left:8%}
        }
        @keyframes shepRun {
          0%{left:75%}
          50%{left:30%}
          100%{left:75%}
        }
        @keyframes dogBob {
          0%,100%{transform:translateY(0) rotate(0deg)}
          50%{transform:translateY(-5px) rotate(1deg)}
        }
        @keyframes legFront {
          0%,100%{transform:rotate(-25deg)}
          50%{transform:rotate(25deg)}
        }
        @keyframes legBack {
          0%,100%{transform:rotate(25deg)}
          50%{transform:rotate(-25deg)}
        }
        @keyframes dustPuff {
          0%{transform:scale(0);opacity:0.6}
          100%{transform:scale(3);opacity:0}
        }
      `}</style>
    </div>
  );
};

const LockedOverlay = ({ onUnlock }) => {
  const [count, setCount] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const handleCorner = () => {
    const n = count + 1; setCount(n);
    if (n >= 7) { setShowPin(true); setCount(0); }
  };

  const handleKey = (k) => {
    if (k === "CLR") { setPin(""); return; }
    if (k === "OK") {
      if (pin === LOCK_PIN) { localStorage.setItem("nc_unlocked","true"); onUnlock(); }
      else { setShake(true); setTimeout(() => { setShake(false); setPin(""); }, 600); }
      return;
    }
    if (pin.length < 6) setPin(p => p + k);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:99999,overflow:"hidden",background:"#06000c"}}>
      <DemonCanvas />
      {/* Силуэт и текст */}
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:0}}>
        <div style={{fontSize:"clamp(70px,16vw,150px)",lineHeight:1,userSelect:"none",animation:"demonPulse 4s ease-in-out infinite",filter:"drop-shadow(0 0 30px rgba(168,85,247,0.5))"}}>🐕‍🦺&nbsp;🐕</div>
        <div style={{marginTop:28,fontSize:"clamp(13px,3.5vw,20px)",fontWeight:900,letterSpacing:"0.35em",color:"rgba(168,85,247,0.9)",textTransform:"uppercase",textShadow:"0 0 24px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.3)",fontFamily:"monospace",animation:"demonPulse 3s ease-in-out infinite 0.5s"}}>СКОРО ОТКРОЕТСЯ</div>
        <div style={{marginTop:10,fontSize:"clamp(9px,2vw,12px)",letterSpacing:"0.22em",color:"rgba(168,85,247,0.3)",fontFamily:"monospace"}}>NEUROCINE.ONLINE</div>
      </div>

      {/* PIN-терминал */}
      {showPin && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:2}}>
          <div style={{background:"linear-gradient(180deg,#0e0e1c,#060610)",border:"1px solid rgba(200,30,30,0.5)",borderRadius:22,padding:28,width:"min(280px,90vw)",boxShadow:"0 0 60px rgba(200,20,20,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",animation:shake?"pinShake 0.5s ease":"none"}}>
            <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(200,50,50,0.8)",letterSpacing:"3px",textAlign:"center",marginBottom:18,textTransform:"uppercase"}}>⬛ ТЕРМИНАЛ ДОСТУПА</div>
            {/* Дисплей */}
            <div style={{background:"#000",border:"1px solid rgba(200,30,30,0.35)",borderRadius:12,padding:"14px 18px",marginBottom:20,textAlign:"center",fontFamily:"monospace",fontSize:28,letterSpacing:12,color:"#ef4444",minHeight:56,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {pin ? "●".repeat(pin.length) : <span style={{opacity:0.25,fontSize:13,letterSpacing:4}}>_ _ _ _</span>}
            </div>
            {/* Кнопки */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {["1","2","3","4","5","6","7","8","9","CLR","0","OK"].map(k => (
                <button key={k} onClick={()=>handleKey(k)} style={{background:k==="OK"?"rgba(200,30,30,0.2)":k==="CLR"?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)",border:k==="OK"?"1px solid rgba(200,30,30,0.55)":"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"15px 0",fontSize:k==="OK"||k==="CLR"?10:20,fontWeight:800,color:k==="OK"?"#ef4444":k==="CLR"?"#4b5563":"#fff",cursor:"pointer",fontFamily:"monospace",letterSpacing:1,transition:"background .15s"}}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Невидимая зона 7 тапов — правый нижний угол */}
      <div onClick={handleCorner} style={{position:"absolute",bottom:0,right:0,width:72,height:72,zIndex:3,cursor:"default"}} />
      {/* Прогресс тапов */}
      {count > 0 && (
        <div style={{position:"absolute",bottom:18,right:18,display:"flex",gap:5,zIndex:3,pointerEvents:"none"}}>
          {Array.from({length:7}).map((_,i)=>(
            <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<count?"rgba(210,30,30,0.9)":"rgba(255,255,255,0.12)",transition:"background .2s"}}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes demonPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 50px rgba(220,20,20,0.8));}50%{transform:scale(1.05);filter:drop-shadow(0 0 90px rgba(230,20,20,1)) drop-shadow(0 0 150px rgba(180,0,0,0.6));}}
        @keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}
      `}</style>
    </div>
  );
};

// --- КОНСТАНТЫ И ПРЕСЕТЫ ---
const GENRE_PRESETS = {
  "КРИМИНАЛ":      { icon:"🔫", col:"#ef4444", font: "'Creepster', cursive", color: "#ef4444" }, 
  "ТАЙНА":         { icon:"🔍", col:"#a855f7", font: "'Creepster', cursive", color: "#a855f7" },
  "ИСТОРИЯ":       { icon:"📜", col:"#f97316", font: "'Cinzel', serif", color: "#fbbf24" }, 
  "НАУКА":         { icon:"⚗",  col:"#06b6d4", font: "'Montserrat', sans-serif", color: "#0ea5e9" },
  "ВОЙНА":         { icon:"⚔",  col:"#dc2626", font: "'Bebas Neue', sans-serif", color: "#ffffff" }, 
  "ПРИРОДА":       { icon:"🌿", col:"#22c55e", font: "'Montserrat', sans-serif", color: "#22c55e" },
  "ПСИХОЛОГИЯ":    { icon:"🧠", col:"#ec4899", font: "'Playfair Display', serif", color: "#ffffff" }, 
  "ЗАГАДКИ":       { icon:"👁", col:"#fbbf24", font: "Impact, sans-serif", color: "#ffdd00" },
};

const FORMATS = [ 
  { id:"9:16", label:"Вертикальный", ratio:"9/16" }, 
  { id:"16:9", label:"Горизонтальный", ratio:"16/9" }, 
  { id:"1:1", label:"Квадрат", ratio:"1/1" } 
];

const VISUAL_ENGINES = {
  "CINEMATIC":      { label: "Кино-реализм",   prompt: "cinematic realism, natural color, 35mm anamorphic, grounded physical action, premium docudrama lighting, Veo 3.1 optimized" },
  "DARK_HISTORY":   { label: "Dark History",   prompt: "dark history documentary, 16mm grain, desaturated amber-green palette, handheld archival realism, hard practical light, Grok Video optimized" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized animation, painterly cinematic lighting, layered parallax, expressive silhouettes, no photorealistic skin" },
  "X_RAY":          { label: "X-Ray / Схемы",  prompt: "x-ray visualization, neon wireframe, scientific blueprint, fluoroscopy scan aesthetic, Grok Imagine API" },
  "VIRAL_SHOCK":    { label: "Viral Shock",    prompt: "viral shock documentary, immediate visual hook, high contrast danger, dramatic reveal, every frame contains anomaly or conflict" },
  "MIL_ARCHIVE":    { label: "Military Archive", prompt: "military archive thriller, classified operation atmosphere, 1940s-1970s government evidence, dusty files, field lights, covert tension" },
  "FOUND_FOOTAGE":  { label: "Found Footage",  prompt: "paranormal found footage, handheld imperfect camera, VHS noise, surveillance angle, night vision tension, realistic accidental framing" },
  "NETFLIX_RECON":  { label: "Netflix Recon",  prompt: "premium Netflix docudrama reconstruction, realistic color grading, cinematic natural light, historically accurate costumes, expensive production design, not black and white unless explicitly requested" }
};

const CURRENCY_SYMBOL = "⭐";
const START_BALANCE = 25;
const DAILY_MIN_BALANCE = 10;
const COSTS = { boost: 1, referencePrompts: 1, casting: 1, step1: 1, step2: 1, tts: 1, preview: 1 };
const formatStars = (amount = 0) => `${CURRENCY_SYMBOL} ${Number(amount) || 0}`;

const DURATION_SECONDS = { "15 сек": 15, "30–45 сек": 40, "До 60 сек": 60, "1.5 мин": 90, "3 мин": 180 };
const DURATIONS = Object.keys(DURATION_SECONDS);

const SAFE_TEXT_STYLE = { width: "100%", padding: "0 15px", boxSizing: "border-box", wordBreak: "break-word", overflowWrap: "break-word" };

// 2026: Стандартный Negative Prompt — вставляется в поле —no / Negative в любом генераторе
const DEFAULT_NEGATIVE = "CGI, 3D render, illustration, anime, cartoon, plastic skin, smooth skin, airbrushed skin, blood, gore, naked, nude, text overlay, watermark, duplicate frames, blurry, overexposed, flat lighting";

// Советы на экране загрузки — меняются каждые 5 секунд
const LOADING_TIPS = [
  { icon: "🎬", text: "Лучшие видео начинаются с физики, а не с эмоций. Show, don't tell — закон нейросетей." },
  { icon: "🎙", text: "TTS диктор лучше читает короткие рубленые фразы. После точки — пауза 0.3 сек." },
  { icon: "⚡", text: "Первые 3 секунды видео решают всё. Если хук не шокирует — зритель уже ушёл." },
  { icon: "🎨", text: "Движок DARK HISTORY даёт самые жёсткие результаты в Grok. CINEMATIC — для Veo 3.1." },
  { icon: "💡", text: "Если генерация падает — уменьши длительность до «30–45 сек». Меньше кадров = меньше токенов." },
  { icon: "🔊", text: "Sub-bass drop в первые 2 секунды повышает удержание на 23%. Не забудь SFX в промпте." },
  { icon: "🧠", text: "Pattern Interrupt каждые 3-5 кадров — обязательное условие вирусного видео." },
  { icon: "📐", text: "DNA персонажа должна быть в каждом кадре дословно. Без этого лицо дрейфует между сценами." },
  { icon: "🌫", text: "Volumetric fog + chiaroscuro = самый кинематографичный результат в Veo 3.1. Проверено." },
  { icon: "🎯", text: "Метод B (замена материала) — самый надёжный обход цензуры. Фарфоровая кукла vs чёрная смола." },
  { icon: "🔄", text: "Если батч упал — система автоматически переключается на резервную модель." },
  { icon: "📱", text: "Для TikTok/Reels: 9:16, до 60 сек, Sub-bass в первые 2 сек, текст КАПСЛОКОМ каждые 5-7 кадров." },
  { icon: "🎭", text: "X-Ray движок идеален для научных тем. Grok Imagine API генерирует нейроны, атомы, ДНК лучше всего." },
  { icon: "✂️", text: "Смена кадра каждые 3 секунды = оптимальный ритм для удержания аудитории 60%+." },
  { icon: "🌊", text: "Эмоциональная дуга: любопытство → страх → восторг → облегчение. Без дуги — нет вирусности." },
  { icon: "⭐", text: "TTS Studio подбирает голос и эмоциональные теги автоматически под твой жанр." },
  { icon: "🎥", text: "I2V (Студийный) режим даёт контроль над внешностью — ты сам загружаешь референс-кадр." },
  { icon: "🔍", text: "SEO-матрица создаёт 3 варианта заголовка: Шок, Тайна и Поиск. Тестируй все три." },
  { icon: "🌙", text: "Для мрачных тем: Dark History + chiaroscuro + «wet stone» в локации = максимальный эффект." },
  { icon: "📊", text: "Retention Score 85%+ = вирусный потенциал. Ниже 70% — переработай хук и финал." },
  { icon: "🧠", text: "GOD MODE: после черновика сценария ИИ автоматически критикует его и переписывает слабые места." },
  { icon: "🎬", text: "GOD MODE: раскадровка теперь генерируется через Claude — мышление уровня Кубрик + Финчер." },
  { icon: "⚡", text: "GOD MODE: FINCHER'S DEAD SECOND — кадр полной тишины каждые 7-8 сцен усиливает следующий удар в 3 раза." },
  { icon: "🏆", text: "GOD MODE: KUBRICK SELF-CHECK — если Retention Score < 80, ИИ сам переделывает слабые кадры." },
  { icon: "🎯", text: "GOD MODE: TARANTINO'S REVERSE — лучший момент показывается первым. Зритель знает финал и всё равно смотрит." },
  { icon: "🚀", text: "Veo 3.1 — текущая GA-модель Google (preview-эндпоинты устарели с 02.04.2026). Всегда используй GA endpoint." },
  { icon: "🤖", text: "Grok Video (xAI Imagine API): text-to-video, image-to-video, reference-guided. Задачи — async polling." },
  { icon: "🔗", text: "Правильный стек: LLM → image anchor (I2V) → video per frame → timeline assembly. Никаких one-shot video." },
  { icon: "🔒", text: "Character DNA + Seed + Reference Image = тройной замок лица. Без этого персонаж дрейфует между кадрами." },
  { icon: "🎞", text: "Preferred I2V order: сгенерируй image-keyframe → подай его в video model. Это даёт стабильность лица." },
];

const COVER_PRESETS = [
  { id: "netflix", label: "Netflix", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { ...SAFE_TEXT_STYLE, fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#e50914", textTransform: "uppercase", letterSpacing: 4, marginBottom: 8, textShadow: "0 2px 4px #000", textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 32, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 8px 25px #000", textAlign: "center" }, cta: { fontSize: 10, fontWeight: 800, color: "#fff", borderBottom: "1px solid #e50914", paddingBottom: 4, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 } } },
  { id: "mrbeast", label: "MrBeast", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { ...SAFE_TEXT_STYLE, fontSize: 16, fontWeight: 900, fontFamily: "Impact, sans-serif", color: "#ffdd00", textTransform: "uppercase", WebkitTextStroke: "1px #000", textShadow: "3px 3px 0 #000", transform: "rotate(-3deg)", marginBottom: 4, textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 40, fontWeight: 900, textTransform: "uppercase", lineHeight: 1, WebkitTextStroke: "2px #000", textShadow: "5px 5px 0 #000, 0 0 40px rgba(0,0,0,0.8)", transform: "rotate(-3deg)", textAlign: "center", marginBottom: 16 }, cta: { fontSize: 13, fontWeight: 900, color: "#ff00ff", background: "#000", border: "2px solid #ff00ff", padding: "6px 14px", borderRadius: 8, textTransform: "uppercase", transform: "rotate(-3deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.8)" } } },
  { id: "tiktok", label: "TikTok", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { fontSize: 13, fontWeight: 800, fontFamily: "sans-serif", color: "#00f2ea", background: "#000", padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 28, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 0 20px #00f2ea, 0 0 40px #00f2ea", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 11, fontWeight: 900, color: "#fff", background: "#ff0050", padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "truecrime", label: "True Crime", defX: 10, defY: 50, style: { container: { alignItems: "flex-start", width: "90%" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#000", background: "#ffdd00", padding: "4px 8px", textTransform: "uppercase", marginBottom: 8, marginLeft: 15 }, title: { ...SAFE_TEXT_STYLE, fontSize: 34, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1, background: "#000", padding: "4px 12px 4px 15px", borderLeft: "4px solid #ffdd00", textAlign: "left", marginBottom: 12 }, cta: { color: "#aaa", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginLeft: 15 } } },
  { id: "history", label: "History", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { ...SAFE_TEXT_STYLE, fontSize: 12, fontWeight: 400, fontFamily: "'Georgia', serif", color: "#d4af37", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8, textShadow: "0 2px 4px #000", textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 36, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 10px 30px #000", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 2, textTransform: "uppercase", borderTop: "1px solid #d4af37", paddingTop: 6 } } },
  { id: "breakingnews", label: "Breaking News", defX: 50, defY: 85, style: { container: { alignItems: "center", width: "100%", background:"#dc2626", padding:"15px 0" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "sans-serif", color: "#fff", background: "#000", padding: "2px 8px", textTransform: "uppercase", marginBottom: 4, display:"inline-block" }, title: { ...SAFE_TEXT_STYLE, fontSize: 28, fontWeight: 900, color:"#fff", textTransform: "uppercase", lineHeight: 1, textAlign: "center" }, cta: { display:"none" } } },
  { id: "cyberpunk", label: "Cyberpunk", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: "#fef08a", textTransform: "uppercase", marginBottom: 8, textShadow: "0 0 10px #eab308", textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 42, fontWeight: 900, color:"#fff", textTransform: "uppercase", lineHeight: 1, textShadow: "3px 3px 0 #ec4899, -3px -3px 0 #06b6d4", textAlign: "center", marginBottom: 16 }, cta: { fontSize: 12, fontWeight: 900, color: "#000", background: "#ec4899", padding: "4px 12px", textTransform: "uppercase", letterSpacing: 2 } } },
  { id: "natgeo", label: "NatGeo", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%", height: "95%", border:"8px solid #facc15", display:"flex", flexDirection:"column", justifyContent:"flex-end", paddingBottom:30 }, hook: { fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", color: "#facc15", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, textShadow: "0 2px 4px #000" }, title: { ...SAFE_TEXT_STYLE, fontSize: 32, fontWeight: 900, color:"#fff", textTransform: "uppercase", lineHeight: 1.1, textShadow: "0 4px 10px #000", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 10, fontWeight: 400, color: "#fff", textTransform: "uppercase", letterSpacing: 1 } } },
  { id: "horror", label: "Horror", defX: 50, defY: 40, style: { container: { alignItems: "center", width: "95%" }, hook: { fontSize: 14, fontWeight: 900, fontFamily: "serif", color: "#fff", textTransform: "uppercase", letterSpacing: 6, marginBottom: 12, opacity:0.8, textAlign: "center" }, title: { ...SAFE_TEXT_STYLE, fontSize: 46, fontWeight: 400, fontFamily: "'Creepster', cursive", color:"#ef4444", textTransform: "uppercase", lineHeight: 1, textShadow: "0 5px 20px #000", textAlign: "center", marginBottom: 20 }, cta: { fontSize: 14, fontWeight: 900, color: "#ef4444", borderTop:"1px solid #ef4444", borderBottom:"1px solid #ef4444", padding: "4px 0", textTransform: "uppercase", letterSpacing: 4 } } },
  { id: "podcast", label: "Podcast", defX: 50, defY: 20, style: { container: { alignItems: "center", width: "90%", background:"rgba(0,0,0,0.8)", padding:"20px", borderRadius:"20px" }, hook: { fontSize: 12, fontWeight: 800, fontFamily: "sans-serif", color: "#a855f7", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }, title: { ...SAFE_TEXT_STYLE, fontSize: 30, fontWeight: 900, color:"#fff", lineHeight: 1.2, textAlign: "center", padding:0 }, cta: { display:"none" } } },
  { id: "retro", label: "Retro 80s", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "95%" }, hook: { fontSize: 16, fontWeight: 400, fontFamily: "'Permanent Marker', cursive", color: "#f472b6", transform: "rotate(-5deg)", marginBottom: -10, zIndex:2, position:"relative" }, title: { ...SAFE_TEXT_STYLE, fontSize: 40, fontWeight: 900, color:"transparent", WebkitTextStroke:"2px #38bdf8", textTransform: "uppercase", lineHeight: 1, background:"linear-gradient(to bottom, #a855f7, #ec4899)", WebkitBackgroundClip:"text", textAlign: "center", marginBottom: 12 }, cta: { fontSize: 12, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: 4, textShadow:"0 0 10px #38bdf8" } } },
  { id: "minimal", label: "Minimal", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "90%" }, hook: { display:"none" }, title: { ...SAFE_TEXT_STYLE, fontSize: 24, fontWeight: 300, fontFamily: "sans-serif", color:"#fff", textTransform: "lowercase", lineHeight: 1.4, textAlign: "center", letterSpacing: 1 }, cta: { display:"none" } } },
  { id: "science", label: "Scientific", defX: 10, defY: 10, style: { container: { alignItems: "flex-start", width: "90%", customTransform: "translate(0, 0)" }, hook: { fontSize: 10, fontWeight: 800, fontFamily: "monospace", color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }, title: { ...SAFE_TEXT_STYLE, padding:0, fontSize: 22, fontWeight: 700, fontFamily: "sans-serif", color:"#fff", textTransform: "uppercase", lineHeight: 1.2, textAlign: "left", marginBottom: 12, borderLeft:"2px solid #0ea5e9", paddingLeft:10 }, cta: { fontSize: 10, fontWeight: 400, fontFamily: "monospace", color: "#94a3b8", textTransform: "uppercase" } } },
  { id: "quote", label: "Quote", defX: 50, defY: 50, style: { container: { alignItems: "center", width: "85%" }, hook: { fontSize: 40, fontWeight: 900, fontFamily: "serif", color: "#fbbf24", marginBottom: -20, opacity:0.5 }, title: { ...SAFE_TEXT_STYLE, fontSize: 26, fontWeight: 400, fontFamily: "serif", fontStyle:"italic", color:"#fff", lineHeight: 1.4, textAlign: "center", marginBottom: 16 }, cta: { fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 2 } } }
];

const FONTS = [
  { id: "Impact, sans-serif", label: "Viral (Толстый)" },
  { id: "'Bebas Neue', sans-serif", label: "YouTube (Кликбейт)" },
  { id: "'Creepster', cursive", label: "Horror (Рваный)" },
  { id: "'Cinzel', serif", label: "Cinematic (Кино)" },
  { id: "'Oswald', sans-serif", label: "Oswald (Строгий)" },
  { id: "'Montserrat', sans-serif", label: "Clean (Док)" },
  { id: "'Permanent Marker', cursive", label: "Marker (Гранж)" },
  { id: "'Playfair Display', serif", label: "Elegance (Курсив)" },
  { id: "'Courier New', monospace", label: "Secret (Машинка)" }
];

const COLORS = ["#ffffff", "#ffdd00", "#facc15", "#ef4444", "#ec4899", "#0ea5e9", "#a855f7", "#22c55e", "#f97316", "#000000"];

const SEO_COLORS = [
  { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.3)", text: "#fca5a5", title: "#ef4444" }, 
  { bg: "rgba(168,85,247,0.05)", border: "rgba(168,85,247,0.3)", text: "#d8b4fe", title: "#a855f7" }, 
  { bg: "rgba(59,130,246,0.05)", border: "rgba(59,130,246,0.3)", text: "#93c5fd", title: "#3b82f6" }  
];

// --- GOOGLE AI STUDIO TTS VOICES ---
const GOOGLE_VOICES = [
  { id:"Algenib",    desc:"Gravelly · Lower pitch",        best:["ИСТОРИЯ","ВОЙНА","КРИМИНАЛ"] },
  { id:"Algieba",    desc:"Smooth · Lower pitch",          best:["ТАЙНА","ПСИХОЛОГИЯ","ЗАГАДКИ"] },
  { id:"Alnilam",    desc:"Firm · Lower middle pitch",     best:["НАУКА","ИСТОРИЯ"] },
  { id:"Charon",     desc:"Informative · Lower pitch",     best:["НАУКА","ВОЙНА","ИСТОРИЯ"] },
  { id:"Iapetus",    desc:"Calm · Lower middle pitch",     best:["ПСИХОЛОГИЯ","ТАЙНА","ПРИРОДА"] },
  { id:"Orus",       desc:"Firm · Lower middle pitch",     best:["КРИМИНАЛ","ЗАГАДКИ"] },
  { id:"Kore",       desc:"Firm · Middle pitch",           best:["ПСИХОЛОГИЯ","ТАЙНА"] },
  { id:"Fenrir",     desc:"Excitable · Lower middle pitch",best:["ЗАГАДКИ","КРИМИНАЛ"] },
  { id:"Aoede",      desc:"Breezy · Middle pitch",         best:["ПРИРОДА"] },
  { id:"Sulafat",    desc:"Warm · Higher middle pitch",    best:["ПРИРОДА","ПСИХОЛОГИЯ"] },
  { id:"Autonoe",    desc:"Bright · Middle pitch",         best:["НАУКА"] },
  { id:"Achird",     desc:"Friendly · Lower middle pitch", best:[] },
  { id:"Puck",       desc:"Upbeat · Middle pitch",         best:[] },
];

// --- AUTO-CENSOR BYPASS DETECTOR (Grok / Veo 3 safe-pass) ---
// Любое из этих слов в visual или voice → автоматически X-ray стиль
const CENSOR_KEYWORDS = [
  // Насилие / оружие
  "кровь","крови","кровью","blood","gore","резня","убийство","убийства","убит","убита","убили",
  "топор","топором","нож","ножом","ножи","клинок","меч","мечом","кинжал","кинжалом",
  "axe","knife","blade","sword","dagger","machete","hatchet",
  "удар","удара","удары","рубит","рубить","рубил","рубили","slash","slashes","slashing",
  "выстрел","выстрела","стреляет","выстрелил","bullet","gunshot","gunfire","shot","shooting",
  "рана","раны","ранение","wound","wounded","injury","injuries",
  "порез","порезан","порезали","cut flesh","cuts flesh","cutting flesh",
  // Смерть / тела
  "труп","трупа","трупов","тела","тело","мертвец","мертвеца","corpse","dead body","dead bodies",
  "казнь","казнили","казнён","казнили","execution","executed","firing squad","beheaded",
  "обезглавл","decapitation","decapitate","decapitating",
  "повешение","повешен","виселица","hanging","hanged","gallows",
  "расстрел","расстреляли","расстрелян",
  // Пытки
  "пытка","пытки","пыток","пытают","пытал","torture","tortured","torturing","torment",
  "истязание","истязали","четвертование","dismemberment","dismembered",
  // Внутренности
  "внутренности","кишки","gore","guts","entrails","intestines",
  "перелом","сломан","сломаны","перебит","fracture","broken bone","shattered bone",
  "череп","черепа","skull","skulls","skeletal remains",
];

/**
 * Сканирует visual + voice кадра.
 * Возвращает "AUTO_XRAY" если найдено цензурное слово, иначе "none".
 */
function autoCensorBypass(visualText = "", voiceText = "") {
  const combined = (visualText + " " + voiceText).toLowerCase();
  const hit = CENSOR_KEYWORDS.find(kw => combined.includes(kw.toLowerCase()));
  return hit ? "AUTO_XRAY" : "none";
}

/**
 * Оборачивает оригинальный visual в X-ray описание для Grok.
 * Полностью заменяет потенциально цензурный контент на научный стиль.
 */
const XRAY_WRAP = (originalVisual) =>
  `X-ray medical fluoroscopy imaging style. Neon blue glowing skeletal and anatomical structures on deep black background. ` +
  `High-resolution scientific scan annotations visible at frame edges. Cold clinical atmosphere, zero color saturation. ` +
  `Scene context rendered as pure fluoroscopic visualization: ${originalVisual} — ` +
  `no photorealistic flesh, no direct violence, no blood, only skeletal and structural scientific imagery. ` +
  `Volumetric light shafts through X-ray exposure field. Subsurface skeletal glow. Chiaroscuro clinical lighting.`;

// --- PIPELINE PROMPT SANITIZER ---
// Не даём старому X-Ray/AUTO_XRAY протекать в Dark History / Cinematic / 2.5D.
// X-Ray применяется ТОЛЬКО когда пользователь явно выбрал движок X_RAY.
function isXrayEngine(engineId = "") {
  return String(engineId).toUpperCase() === "X_RAY";
}

function hasVisibleCharacter(frame = {}, prompt = "") {
  const chars = Array.isArray(frame.characters_in_frame) ? frame.characters_in_frame.filter(Boolean) : [];
  if (chars.length > 0) return true;
  const t = `${frame.visual || ""} ${frame.voice || ""} ${prompt || ""}`.toLowerCase();
  return /\b(agent|officer|detective|witness|man|woman|person|figure|soldier|president|official|scientist|архивист|агент|офицер|человек|женщина|мужчина|солдат|учёный|ученый|свидетель)\b/i.test(t);
}

function sanitizeModeLeak(text = "", { allowXray = false, frame = null } = {}) {
  let t = String(text || "");
  t = t.replace(/\bANIMATE CURRENT FRAME:\s*ANIMATE CURRENT FRAME:/gi, "ANIMATE CURRENT FRAME:");
  t = t.replace(/\bANIMATE CURRENT FRAME:\s*/gi, "ANIMATE CURRENT FRAME: ");

  if (!allowXray) {
    const xrayPatterns = [
      /\bX[-\s]?ray\s+(?:medical\s+)?fluoroscopy\s+imaging\s+style\.?:?/gi,
      /\bX[-\s]?ray\s+fluoroscopy\s+style\.?:?/gi,
      /\bX[-\s]?ray\s+visualization\.?:?/gi,
      /\bfluoroscopic\s+visualization:?/gi,
      /\bfluoroscopy\s+style\.?:?/gi,
      /\bmedical\s+scan\s+style\.?:?/gi,
      /\bclinical\s+scan\s+annotations?[^,.]*(?:[,.]|$)/gi,
      /\bneon\s+blue\s+(?:glowing\s+)?skeletal[^,.]*(?:[,.]|$)/gi,
      /\bskeletal\s+(?:jeep|soldier|body|anatomical|structures?)[^,.]*(?:[,.]|$)/gi,
      /\bdeep\s+black\s+field[^,.]*(?:[,.]|$)/gi,
      /\bsubsurface\s+skeletal\s+glow[^,.]*(?:[,.]|$)/gi,
      /\blow\s+clinical\s+scan\s+hum[^,.]*(?:[,.]|$)/gi,
      /\bcold\s+reverb\s+ambient[^,.]*(?:[,.]|$)/gi,
    ];
    for (const re of xrayPatterns) t = t.replace(re, "");
  }

  const visibleChar = hasVisibleCharacter(frame || {}, t);
  if (!visibleChar) {
    t = t.replace(/preserve same face and outfit(?:\s+for visible character only)?[, ]*/gi, "");
    t = t.replace(/same character, consistent face[^,.]*(?:[,.]|$)/gi, "");
    t = t.replace(/no identity drift[, ]*/gi, "");
  } else {
    t = t.replace(/preserve same face and outfit(?:,\s*preserve same face and outfit)+/gi, "preserve same face and outfit");
  }

  return t
    .replace(/,\s*,+/g, ",")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .replace(/^\s*,\s*|\s*,\s*$/g, "")
    .trim();
}

function getStyleLock(engineId = "CINEMATIC", customStyle = "") {
  const base = VISUAL_ENGINES[engineId]?.prompt || VISUAL_ENGINES.CINEMATIC.prompt;
  return [base, customStyle].filter(Boolean).join(", ");
}

function getTimingPlan(durationLabel = "До 60 сек") {
  const seconds = DURATION_SECONDS[durationLabel] || 60;
  const frameDuration = 3;
  const frames = Math.max(1, Math.round(seconds / frameDuration));
  const minWords = Math.max(3, Math.floor(frameDuration * 2.0));
  const maxWords = Math.max(6, Math.ceil(frameDuration * 3.2));
  return { seconds, frameDuration, frames, minWords, maxWords };
}

function buildReferenceSheetPrompt({ char = {}, index = 1, engine = "CINEMATIC", genre = "ТАЙНА", topic = "", style = "" } = {}) {
  const name = char.name || "CHAR_" + index;
  const desc = char.desc || "important story character, visually distinctive face, production-ready appearance";
  const styleLock = style || getStyleLock(engine);
  const banBW = /NETFLIX_RECON|CINEMATIC|VIRAL_SHOCK|MIL_ARCHIVE/i.test(engine) ? "full color reference sheet, not black and white, no noir monochrome unless explicitly requested," : "";
  return ("CHAR_" + index + " • " + name + "\nCharacter reference sheet for " + name + ". " + desc + ". Show the SAME identity from multiple angles: front view, left side view, right side view, three-quarter view, full body neutral pose. Same outfit, same face, same hairstyle, clean studio background, production character sheet, consistent identity, " + banBW + " " + styleLock + ". Topic context: " + topic + ". Genre: " + genre + ". No text, no logo, no watermark.").replace(/\s+/g, " ").trim();
}

function buildAllReferencePrompts({ chars = [], engine = "CINEMATIC", genre = "ТАЙНА", topic = "", loc = "", style = "" } = {}) {
  const sourceChars = chars.length ? chars : [{ name: "Main character", desc: "primary protagonist inferred from script" }];
  const characterPrompts = sourceChars.slice(0, 6).map((char, idx) => ({
    id: char.id || "CHAR_" + (idx + 1),
    name: char.name || "CHAR_" + (idx + 1),
    type: "character",
    prompt: buildReferenceSheetPrompt({ char, index: idx + 1, engine, genre, topic, style }),
  }));
  const styleLock = style || getStyleLock(engine);
  return [
    ...characterPrompts,
    { id: "LOCATION_REF", type: "location", name: "Location reference", prompt: "Location reference sheet for NeuroCine scene environment. " + (loc || topic || "main story location") + ". Show wide establishing view, medium shot, key prop corner, lighting reference, atmosphere plate. " + styleLock + ". No characters, no text, no logo." },
    { id: "STYLE_REF", type: "style", name: "Style reference", prompt: "Visual style reference board. " + styleLock + ". Include color palette, lighting sample, lens texture, grain/noise level, contrast, mood, cinematic examples. No text, no watermark." },
  ];
}

// --- СИСТЕМНЫЕ ПРОМПТЫ (NeuroCine Master Engine v3) ---
const SYS_STEP_1A = `You are NeuroCine Master Engine — an elite AI short-form video writing, storyboard, and prompt-generation system for TikTok, Reels, and YouTube Shorts.
You do NOT write vague text. You build production-ready short-form video packages.
Output STRICT JSON ONLY. No markdown. No explanations. No notes. No text before or after JSON.

--------------------------------------------------
GLOBAL QUALITY RULES
--------------------------------------------------
- No generic phrases. No filler. No weak intros. No abstract descriptions.
- No "in this video I will tell you" or any equivalent opener.
- Every frame must be visually clear and contain movement or tension.
- If unsure, simplify instead of adding fluff.
- Use short, strong, visual language.

--------------------------------------------------
HOOK ENGINE
--------------------------------------------------
Internally generate 5 hooks using these 5 triggers: fear/loss, curiosity gap, contrarian, direct benefit, shocking fact.
Rules: max 10 words each, punchy, emotionally loaded, no repeated structure.
Select the strongest one — use it as the voice of frame 1.

--------------------------------------------------
SHORT-FORM STRUCTURE
--------------------------------------------------
For ≤15s: 0–3s hook | 3–6s context | 6–9s value | 9–12s twist | 12–15s payoff/CTA
For 30s and 60s: same principle, extend with additional value beats and pattern interrupts.
For >60s: chapters of 8–10 frames each with a story bridge between chapters.

--------------------------------------------------
RETENTION ENGINE
--------------------------------------------------
- Pattern interrupt every 2–3 frames: change camera angle, motion type, or reveal new visual info.
- Each frame must contain a micro-hook — a reason to stay one more second.
- Escalate curiosity or tension over time. No flat pacing.
- No repeated frame logic. If two frames feel similar, rewrite one.

--------------------------------------------------
EMOTION CURVE ENGINE
--------------------------------------------------
Default arc:
- Frame 1–2: curiosity / confusion
- Frame 3–4: tension / discovery
- Frame 5–6: escalation / pressure
- Final frame: payoff / realization / CTA
No emotional flatline. No early resolution.

--------------------------------------------------
CUT / EDITING LOGIC
--------------------------------------------------
Each frame must imply a clear edit. Use cut types: hard cut, match cut, jump cut, reveal cut.
At every cut, change at least ONE of: camera distance, camera angle, movement type, lighting emphasis, visual focus.
Never use the same camera twice in a row.

--------------------------------------------------
VISUAL DESCRIPTION RULES
--------------------------------------------------
The "visual" field must describe PHYSICAL reality only. Max 140 chars.
BAD: "he feels scared" / "the situation is dramatic" / "success" / "motivation"
GOOD: "close-up of trembling fingers on laptop edge" / "man freezes as blue screen light flickers on his face"
- Action must be visible. Environment must be clear. No abstract wording.

--------------------------------------------------
CAMERA & MOTION VARIATION
--------------------------------------------------
Rotate between: close-up, medium, wide, over-shoulder, tracking, handheld, macro, reveal angle.
Motion types: push-in, pull-back, pan, tilt, handheld drift, snap zoom, tracking move.
No identical camera + motion combination twice in a row.

--------------------------------------------------
VOICEOVER RULES (voice field)
--------------------------------------------------
Each voice line MUST:
- match the exact action of the frame
- fit ~3 seconds of speech
- be 6–12 words max
- express one clear idea only
- react to the visual, not narrate around it

Reactive style preferred: "wait..." / "look closer" / "this is bad" / "no way" / "this changes everything"
Emotional tags allowed: [shock] [intrigue] [fear] [whisper] [confident] [urgent]
Do not overuse tags.

FORBIDDEN: "in this video..." / "now we will see..." / "this shows that..." / long explanatory narration / multi-sentence VO inside one frame.

--------------------------------------------------
SFX RULES
--------------------------------------------------
SFX must be short and useful. Max 60 chars.
Examples: whoosh / bass hit / glitch click / screen hum / heartbeat thump / metal scrape / distant rumble

--------------------------------------------------
VISUAL TEXT OVERLAY (text_on_screen)
--------------------------------------------------
1–3 words, ALL CAPS. Use every 4–6 frames. For viewers without sound.

--------------------------------------------------
CHARACTER DNA / CONSISTENCY
--------------------------------------------------
If characters are provided: use the same identity in every frame. Never change face, hairstyle, or outfit unless explicitly instructed.
Each character gets: "dna" field (English only, physical anchor 20–30 words) + "ref_sheet_prompt" (Nine-panel continuity photography, English only).
Use characters_in_frame array to track who appears in each frame.

--------------------------------------------------
NSFW BYPASS PROTOCOL
--------------------------------------------------
NEVER use in visual: blood, gore, cuts flesh, torture, corpse, dead body, killing, naked, nude.
For sensitive scenes choose ONE method and set bypass_method:
bypass_method = "none" → describe normally in clean physical language.
bypass_method = "A" → Implicit Horror: show only external evidence — shadows, clenched fists, whitened knuckles, face in silent scream in deep shadow, dark liquid on floor — never the act itself.
bypass_method = "B" → Material Substitution: replace living body with crumbling marble statue or cracking porcelain doll. Replace red with thick black oil or liquid gold.
bypass_method = "C" → Scientific/Art style: switch entirely to X-ray fluoroscopy, 3D anatomy, or animated historical manuscript style.

--------------------------------------------------
FINAL SELF-CHECK BEFORE OUTPUT
--------------------------------------------------
Review every frame. Score retention honestly 1–100.
If score < 80 — rewrite the 3 weakest frames before output.
Never output a result with retention score below 80.

--------------------------------------------------
JSON FORMAT — output ONLY this, no text outside:
--------------------------------------------------
{
  "characters_EN": [ { "id": "CHAR_1", "name": "Name", "dna": "[CHAR_1_DNA: 34yo male, sharp jaw, short dark hair, green eyes, 2cm scar right brow, lean build, grey worn jacket]", "ref_sheet_prompt": "Nine-panel film costume and makeup continuity photography, real human actor, hyperrealistic. Subject: [PHYSICAL_DESC in English]. Studio setting: neutral 18% grey seamless backdrop, large overhead softbox key light, small fill reflector, even exposure across all panels, 5600K color temperature. Three rows — ROW 1: full-body front, left profile, right profile, back. ROW 2: three-quarter body front, left 3/4, right 3/4, back 3/4. ROW 3: head-and-shoulders front, left profile, right profile. Every panel shows the identical real human face — visible pores, natural stubble, micro-imperfections, subsurface scattering, Kodak Vision3 500T film grain. --no CGI, 3D render, game engine, Unreal Engine, illustration, anime, smooth skin, plastic skin, text, labels, arrows, watermark" } ],
  "location_ref_EN": "Detailed cinematic location prompt in English, 15–20 words minimum.",
  "style_ref_EN": "Era / Atmosphere / Engine tags — e.g. Modern Urban, Natural Light, CINEMATIC, Handheld Realism.",
  "retention": { "score": 85, "feedback": "Честная критика на русском: сила хука, ритм pattern interrupt, эмоциональная дуга, финальный крючок." },
  "frames": [ {
    "timecode": "0–3s",
    "camera": "close-up / medium / wide / over-shoulder / tracking / handheld / macro / reveal",
    "bypass_method": "none | A | B | C",
    "visual": "Physical action only, max 140 chars. Visible action + clear environment.",
    "characters_in_frame": ["CHAR_1"],
    "sfx": "short SFX description, max 60 chars",
    "text_on_screen": "1–3 WORDS CAPS",
    "voice": "[shock] Reactive VO line, 6–12 words max."
  } ]
}`;

const SYS_STEP_1B = `You are NeuroCine Master Engine — Cover, SEO, and Music specialist. Analyze the provided STORYBOARD and output ONLY valid JSON. No markdown. No text outside JSON.

COVER ENGINE:
- title: short, clickable, high curiosity or strong emotion — no filler.
- hook: one dominant visual object from the most tense frame.
- cta: short action word (СМОТРЕТЬ / WATCH).
- text_for_rendering: 1–3 words MAX, all caps — the one phrase that stops the scroll.

MUSIC ENGINE (Suno AI):
Generate specific tags matching the storyboard atmosphere. Minimum 5 tags: [Genre], [Mood], [Instruments], [Tempo], [Vibe]. Be specific — avoid generic "epic" alone.

SEO ENGINE — 3 DIFFERENT variants:
- Variant 1: shock/number — most aggressive clickbait with a number.
- Variant 2: intrigue/question — curiosity gap.
- Variant 3: search/keyword — algorithm-friendly.
Rules: concise, platform-native, no spam hashtags. Each variant needs minimum 5 relevant hashtags. Descriptions 100–150 chars.

JSON FORMAT — output ONLY this:
{
  "thumbnail": { "title": "SHORT CLICKABLE TITLE CAPS", "hook": "DOMINANT VISUAL OBJECT", "cta": "СМОТРЕТЬ", "text_for_rendering": "1–3 WORDS CAPS" },
  "music_EN": "[Genre: ...], [Mood: ...], [Instruments: ...], [Tempo: ...], [Vibe: ...]",
  "seo_variants": [ { "title": "Variant title", "desc": "100–150 char description", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] } ]
}`;

const SYS_STEP_2 = `You are NeuroCine Master Engine — elite image and video prompt engineer for TikTok, Reels, and YouTube Shorts production.
Output STRICT JSON ONLY. No markdown. No explanations. No text before or after JSON.

--------------------------------------------------
IMAGE PROMPT RULES (imgPrompt_EN)
--------------------------------------------------
Structure: [character/subject] + [action] + [environment] + [lighting] + [camera/lens] + [style]
- Max 220 chars
- No long prose. No storytelling. No repeated adjectives.
- No "beautiful/amazing/stunning" spam.
- No "photorealistic" / "hyperrealistic" / "8k" / "ultra HD" / "masterpiece" / "high quality" — these go in negative_prompt only.
- No "Maintain visual consistency" / "same actor" / "no character drift" — these also go in negative_prompt only.

--------------------------------------------------
VIDEO PROMPT RULES (vidPrompt_EN)
--------------------------------------------------
Structure: [camera movement] + [subject motion] + [environment motion] + [audio]
- Max 220 chars
- No static scenes. Motion must feel realistic and filmic.
- Always include all 3 motion layers: camera / subject / environment.
- Audio section always last, starts with "Audio:" — short SFX + ambient.
- No Audio in imgPrompt_EN or thumbnail_prompt_EN.

--------------------------------------------------
CAMERA & MOTION VARIATION
--------------------------------------------------
Rotate between: close-up, medium, wide, over-shoulder, tracking, handheld, macro, reveal angle.
Motion: push-in, pull-back, pan, tilt, handheld drift, snap zoom, tracking move.
Environment motion: flicker, particles, light shift, screen glow, cloth movement, smoke/dust, rain/reflections.
No identical camera + motion combination twice in a row.

--------------------------------------------------
CHARACTER CONSISTENCY
--------------------------------------------------
If character_dna is provided:
- Insert [CHAR_DNA: ...] block at the very start of each prompt where that character appears.
- After the DNA block use only pronouns: he / she / the figure. Never repeat DNA details in the same prompt.
- DNA block: 20–30 words max — traits + costume + key physical condition only.
- Never change face, hair, outfit between frames unless the scene explicitly requires it.

--------------------------------------------------
SEED & REFERENCE STABILITY
--------------------------------------------------
Do NOT include --seed in any prompt field. Seeds are appended by the system.
If reference_image is provided, preserve identity, silhouette, hairstyle, wardrobe, and mood in every frame.

--------------------------------------------------
NSFW BYPASS PROTOCOL — read bypass_method and apply
--------------------------------------------------
bypass_method = "none" → describe scene normally, clean physical camera-visible vocabulary only.
bypass_method = "A" → Implicit: show only external evidence — shadows of objects, clenched fists, whitened knuckles, face in silent scream in deep shadow, dark liquid on floor. Never show the act itself.
bypass_method = "B" → Material Substitution: replace body with crumbling marble statue or cracking porcelain doll. Replace red with thick black oil or liquid gold splattering white plaster.
bypass_method = "C" or "AUTO_XRAY" → Full style switch to X-ray fluoroscopy: neon blue skeletal structures on deep black background, clinical scan annotations, no photorealism, no flesh. Audio: low clinical scan hum + cold reverb ambient.

--------------------------------------------------
NEGATIVE PROMPT ENGINE
--------------------------------------------------
Always output one "negative_prompt" per frame. All banned elements go here — NEVER in the main prompts.
Reduce: blur, bad anatomy, duplicate people, extra fingers, plastic skin, low detail, watermark, text artifacts, flat lighting, oversaturated CGI, blood, gore, naked, nude.

--------------------------------------------------
THUMBNAIL RULES — VIRAL 2-VARIANT ENGINE
--------------------------------------------------
Always generate TWO different thumbnail concepts, adapted to the actual storyboard theme.
Variant 1 = SHOCK / EVENT: show the strongest physical event or forbidden evidence. Do NOT default to a neutral portrait.
Variant 2 = HYBRID / HUMAN + EVIDENCE: keep a human/agent/witness/direct eye contact in foreground, but add the story evidence or threat clearly visible in background/reflection/foreground.
Both prompts MUST start with: "Tall vertical portrait orientation."
Both prompts MUST be cinematic, high contrast, clear dominant hook, shallow depth of field, rule of thirds. No text, no watermarks, no letters, no subtitles.
If the story has aliens/UFO/Roswell: include non-human silhouettes, covered non-human bodies, alien hand, crash-site evidence, military floodlights, or alien reflection — never only a person with a folder.
If the story is crime: include crime-scene evidence, police light, case-file object, suspect silhouette, forensic board — clean non-graphic.
If the story is conspiracy/secret documents: include classified evidence, hidden lab, shadow officials, redacted files, surveillance screens.

--------------------------------------------------
FINAL PASS BEFORE OUTPUT
--------------------------------------------------
- Shorten prompts that exceed limits.
- Remove filler and repeated adjectives.
- Ensure motion exists in every video_prompt.
- Ensure no two frames use the same camera + motion combo.
- Ensure character consistency is preserved across all frames.

JSON FORMAT — output ONLY this, no text outside:
{
  "frames_prompts": [
    {
      "bypass_applied": "none | A | B | C | AUTO_XRAY",
      "imgPrompt_EN": "[char/subject] + [action] + [environment] + [lighting] + [camera] + [style]. Max 220 chars.",
      "vidPrompt_EN": "[camera move] + [subject motion] + [environment motion] + [style]. Audio: [SFX] + [ambient]. Max 220 chars.",
      "negative_prompt": "blur, bad anatomy, plastic skin, watermark, text, flat lighting, CGI, blood, gore, naked, nude, duplicate people"
    }
  ],
  "b_rolls": [
    "[Shot type]. [Environmental detail — material + texture]. [Light interaction]. [Mood]. Style tags. Audio: [ambient SFX].",
    "[Shot type]. [Environment detail]. [Light interaction]. [Mood]. Style tags. Audio: [ambient SFX]."
  ],
  "thumbnail_prompt_EN": "Legacy fallback: the single best thumbnail prompt.",
  "thumbnail_prompts_EN": [
    { "type": "shock", "title": "SHOCK / EVENT", "prompt": "Tall vertical portrait orientation. Event-first viral thumbnail... No text, no watermarks, no letters, no subtitles." },
    { "type": "hybrid", "title": "HYBRID / HUMAN + EVIDENCE", "prompt": "Tall vertical portrait orientation. Human foreground + story evidence... No text, no watermarks, no letters, no subtitles." }
  ]
}`;



// --- МОДЕЛИ ---
// Умная модель для всех задач (Render даёт достаточно времени)
const MODEL_FAST = "meta-llama/llama-3.3-70b-instruct";
const MODEL_STD  = "anthropic/claude-sonnet-4-6";

// --- ФУНКЦИИ АПИ ---
// Утилита: пауза
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// callAPI с таймаутом 90 сек (Render Free засыпает и просыпается 50+ сек)
// и авто-ретраем 1 раз
async function callAPI(content, maxTokens = 4000, sysPrompt, model = MODEL_STD, retries = 1, timeoutMs = 90000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("/api/chat", { 
        method: "POST",
        signal: controller.signal,
        headers: { 
          "Content-Type": "application/json",
          "X-App-Token": process.env.NEXT_PUBLIC_APP_SECRET || ""
        }, 
        body: JSON.stringify({ 
          model: model,
          messages: [{ role: "system", content: sysPrompt }, { role: "user", content }], 
          max_tokens: maxTokens 
        }) 
      });
      clearTimeout(timeoutId);
      const textRes = await res.text();
      let data;
      try { data = JSON.parse(textRes); } catch (e) { 
        const isHtml = textRes.trimStart().startsWith("<!DOCTYPE") || textRes.trimStart().startsWith("<html");
        const msg = isHtml 
          ? `Сервер недоступен (вернул HTML страницу ошибки). Проверьте деплой /api/chat и попробуйте ещё раз.`
          : `Сервер вернул не JSON: ${textRes.substring(0, 120)}`;
        throw new Error(msg); 
      }
      if (!res.ok || data.error) throw new Error(data.error || `Ошибка API (${res.status})`);
      return data.text || "";
    } catch (e) {
      clearTimeout(timeoutId);
      const isTimeout = e.name === "AbortError";
      const isNetwork = e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed");
      if ((isTimeout || isNetwork) && attempt < retries) {
        await sleep(3000);
        continue;
      }
      if (isTimeout) throw new Error(`⏱ Сервер не ответил за ${Math.round(timeoutMs/1000)} сек. Попробуйте ещё раз.`);
      throw e;
    }
  }
}

// Прогрев сервера — лёгкий ping чтобы Render проснулся ДО основного запроса
async function warmupServer(onWaking) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch("/api/chat", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "X-App-Token": process.env.NEXT_PUBLIC_APP_SECRET || "" },
      body: JSON.stringify({ model: MODEL_STD, messages: [{ role: "user", content: "hi" }], max_tokens: 5 })
    });
    clearTimeout(t);
    // Если ответ пришёл быстро — сервер уже тёплый
  } catch(e) {
    // Сервер спал — уведомляем пользователя и ждём пока проснётся
    if (onWaking) onWaking();
    await sleep(20000); // Render cold start реально занимает 15-30 сек
  }
}

async function callVisionAPI(base64Image, sysPrompt) {
  try {
    const res = await fetch("/api/chat", { 
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "X-App-Token": process.env.NEXT_PUBLIC_APP_SECRET || ""
      }, 
      body: JSON.stringify({ 
        model: "openai/gpt-4o-mini", // Дешевая и быстрая модель для зрения
        messages: [
          { role: "system", content: sysPrompt }, 
          { role: "user", content: [ 
              { type: "text", text: "Опиши человека на фото. ВЫДАЙ ТОЛЬКО JSON ОБЪЕКТ." }, 
              { type: "image_url", image_url: { url: base64Image } } 
            ] 
          }
        ], 
        max_tokens: 1500 
      }) 
    });
    const textRes = await res.text();
    let data;
    try { data = JSON.parse(textRes); } catch (e) { throw new Error(`Сервер вернул не JSON: ${textRes.substring(0, 100)}`); }
    if (!res.ok || data.error) throw new Error(data.error || "Ошибка Vision API");
    return data.text || "";
  } catch (e) { throw e; }
}

function cleanJSON(rawText) {
  if (!rawText || typeof rawText !== "string") throw new Error("Пустой ответ от сервера");
  let cleanText = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
  // Detect model refusal before trying to parse
  const lower = cleanText.toLowerCase();
  if (lower.startsWith("i'm not") || lower.startsWith("i cannot") || lower.startsWith("i can't") || lower.startsWith("i am not") || lower.startsWith("sorry,") || lower.startsWith("i apologize")) {
    throw new Error("Модель отказала в генерации. Попробуйте ещё раз: " + cleanText.substring(0, 120));
  }
  const startIdx = cleanText.indexOf('{'); 
  const endIdx = cleanText.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) throw new Error("Модель не вернула JSON. Ответ: " + cleanText.substring(0, 120));
  cleanText = cleanText.substring(startIdx, endIdx + 1);
  cleanText = cleanText.replace(/\r?\n|\r/g, " ").replace(/[\u0000-\u001F]+/g, "");
  return JSON.parse(cleanText);
}


function ncText(value = "") { return String(value || "").toLowerCase(); }
function detectPreviewTheme({ topic = "", frames = [], thumb = null, locRef = "", styleRef = "" } = {}) {
  const source = ncText([topic, locRef, styleRef, thumb?.title, thumb?.hook, thumb?.text_for_rendering, ...(frames || []).flatMap(f => [f.visual, f.voice, f.text_on_screen, f.sfx])].filter(Boolean).join(" "));
  const hasAny = (words) => words.some(w => source.includes(w));
  if (hasAny(["нло", "ufo", "alien", "иноплан", "розуэл", "roswell", "mj-12", "mj12", "аквариус", "aquarius", "пентагон", "pentagon", "внезем"])) return "alien";
  if (hasAny(["убий", "маньяк", "crime", "преступ", "детектив", "полици", "фбр", "fbi", "cia", "цру", "след", "case file"])) return "crime";
  if (hasAny(["заговор", "секрет", "секретн", "classified", "redacted", "архив", "документ", "правительство", "government", "лаборатор", "experiment"])) return "conspiracy";
  if (hasAny(["ужас", "хоррор", "призрак", "демон", "монстр", "страх", "horror", "creature", "nightmare"])) return "horror";
  if (hasAny(["война", "солдат", "танк", "battle", "war", "military", "армия", "ракета", "взрыв"])) return "war";
  if (hasAny(["катастроф", "disaster", "авар", "цунами", "землетр", "пожар", "шторм", "самолет", "корабль"])) return "disaster";
  if (hasAny(["древн", "археолог", "фараон", "рим", "history", "истори", "импер", "артефакт"])) return "history";
  if (hasAny(["ai", "ии", "нейро", "робот", "эксперимент", "наука", "учен", "технолог", "science"])) return "science";
  return "general";
}
function cleanThumbnailPromptText(value = "") {
  return String(value || "").replace(/,?\s*clear ASMR audio of[^,.]*/gi, "").replace(/,?\s*isolated sound[^,.]*/gi, "").replace(/,?\s*zero background noise[^,.]*/gi, "").replace(/,?\s*no ambient hum[^,.]*/gi, "").replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
}
function hardenThumbnailPrompt(value = "") {
  let prompt = cleanThumbnailPromptText(value);
  if (!prompt) prompt = "Tall vertical portrait orientation. Viral cinematic thumbnail, strongest story evidence in foreground, dramatic lighting, shallow depth of field, rule of thirds";
  if (!/^Tall vertical portrait orientation\./i.test(prompt)) prompt = `Tall vertical portrait orientation. ${prompt}`;
  if (!/no text/i.test(prompt)) prompt += ", no text, no watermarks, no letters, no subtitles";
  return prompt.replace(/\s+/g, " ").trim();
}
function extractPrimaryCharDNA(generatedChars = []) {
  const c = (generatedChars || [])[0] || {};
  return c.dna || c.ref_sheet_prompt || "serious human witness, tense eyes, cinematic wardrobe";
}
function buildPreviewVariants({ rawPrompt = "", modelVariants = [], topic = "", frames = [], generatedChars = [], locRef = "", styleRef = "", thumb = null } = {}) {
  const theme = detectPreviewTheme({ topic, frames, thumb, locRef, styleRef });
  const hook = thumb?.hook || thumb?.text_for_rendering || topic || "forbidden evidence";
  const dna = extractPrimaryCharDNA(generatedChars);
  const packs = {
    alien: { shock: "1947 desert crash site at night, military floodlights, soldiers carrying covered non-human bodies on stretchers, one grey alien hand visible from under a sheet, dust and smoke, impossible wreckage in background", hybrid: "female intelligence agent in foreground holding a stamped confidential folder, anxious direct eye contact, glasses reflecting a non-human silhouette, behind her military personnel carry a covered alien body, one alien hand visible" },
    crime: { shock: "non-graphic crime scene evidence, torn case file, chalk outline partially hidden by police tape, flashing red-blue police lights, suspect silhouette behind frosted glass, forensic markers, tense night atmosphere", hybrid: "detective or FBI analyst in foreground holding a case file, direct eye contact, crime-scene evidence reflected in glasses, suspect silhouette and police lights blurred behind, clean non-graphic thriller tone" },
    conspiracy: { shock: "secret archive room, redacted classified documents scattered under a hard desk lamp, surveillance screens, shadow officials behind glass, one folder stamped above top secret, tense evidence-first composition", hybrid: "government archivist or agent in foreground with a classified folder, direct eye contact, redacted documents sharp in lower third, shadow officials and hidden lab monitors visible behind, paranoid thriller lighting" },
    horror: { shock: "dark corridor with a barely visible unnatural creature silhouette, clawed shadow crossing the wall, frightened hand reaching from foreground, flickering light, heavy fog, clean non-graphic horror tension", hybrid: "terrified witness in foreground, direct eye contact, creature silhouette reflected in eyes or glasses, door behind slightly open with cold light leaking out, cinematic horror shadows" },
    war: { shock: "battlefield evidence, damaged military vehicle, soldiers rushing through smoke, searchlights and sparks, classified map in foreground, high tension war documentary thumbnail", hybrid: "military analyst or soldier in foreground with classified map, direct eye contact, battlefield chaos blurred behind, smoke, searchlights, urgent documentary thriller tone" },
    disaster: { shock: "large-scale disaster moment, emergency lights, cracked ground or burning debris, rescue workers silhouetted, one impossible clue sharp in foreground, cinematic chaos, no gore", hybrid: "survivor or investigator in foreground holding evidence, direct eye contact, disaster scene blurred behind, emergency lights and smoke, dramatic high contrast tension" },
    history: { shock: "ancient forbidden artifact uncovered in dust, torchlight, shocked archaeologists, cracked stone chamber, mysterious symbol glowing faintly, cinematic historical mystery thumbnail", hybrid: "historian or archaeologist in foreground holding an ancient document, direct eye contact, forbidden artifact visible behind, torchlit archive, dust, mystery atmosphere" },
    science: { shock: "secret laboratory experiment going wrong, glowing containment chamber, warning lights, scientists behind glass, impossible object floating in center, cinematic science thriller", hybrid: "scientist in foreground holding research file, direct eye contact, failed experiment reflected in glasses, glowing lab chamber behind, high contrast sci-fi documentary tone" },
    general: { shock: "strongest visible story evidence in foreground, dramatic event happening behind, shocked witnesses, cinematic high contrast lighting, clear viral hook object, tense atmosphere", hybrid: "main witness or investigator in foreground, direct eye contact, key evidence sharp in lower third, story threat visible in background or reflection, cinematic tension" },
  };
  const pack = packs[theme] || packs.general;
  const style = styleRef || "cinematic realism, high contrast shadows, shallow depth of field, viral documentary thriller";
  const normalizedModelVariants = Array.isArray(modelVariants) ? modelVariants.map((v, idx) => ({ id: v.type || (idx === 0 ? "shock" : "hybrid"), title: v.title || (idx === 0 ? "ШОК / СОБЫТИЕ" : "ГИБРИД / ЧЕЛОВЕК + ДОКАЗАТЕЛЬСТВО"), prompt_EN: hardenThumbnailPrompt(v.prompt || v.prompt_EN || v) })).filter(v => v.prompt_EN) : [];
  const deterministic = [
    { id: "shock", title: "ШОК / СОБЫТИЕ", prompt_EN: hardenThumbnailPrompt(`Tall vertical portrait orientation. ${pack.shock}. Dominant hook object: ${hook}. Event-first viral thumbnail, no neutral portrait, face optional, sharp foreground evidence, dramatic lighting, rule of thirds, desaturated cinematic color, ${style}`) },
    { id: "hybrid", title: "ГИБРИД / ЧЕЛОВЕК + ДОКАЗАТЕЛЬСТВО", prompt_EN: hardenThumbnailPrompt(`Tall vertical portrait orientation. [PRIMARY_DNA: ${dna}] direct eye contact in foreground, tense expression, ${pack.hybrid}. Hook object sharp in lower third: ${hook}. Face upper 50-60%, story evidence clearly visible, shallow depth of field, ${style}`) },
  ];
  const byId = new Map();
  [...normalizedModelVariants, ...deterministic].forEach(v => { const id = v.id === "hybrid" ? "hybrid" : v.id === "shock" ? "shock" : byId.size === 0 ? "shock" : "hybrid"; if (!byId.has(id)) byId.set(id, { ...v, id }); });
  return [byId.get("shock") || deterministic[0], byId.get("hybrid") || deterministic[1]];
}

function CopyBtn({ text, label="Копировать", small=false, fullWidth=false }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); try { navigator.clipboard?.writeText(text); } catch{} setOk(true); setTimeout(() => setOk(false), 2000); }}
      style={{ width: fullWidth ? "100%" : "auto", background: ok ? "rgba(34,197,94,.25)" : "rgba(255,255,255,.05)", border: `1px solid ${ok ? "#4ade80" : "rgba(255,255,255,.1)"}`, borderRadius: 8, padding: small ? "4px 10px" : "6px 14px", fontSize: small ? 10 : 11, color: ok ? "#4ade80" : "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap" }}>
      {ok ? "✓ СКОПИРОВАНО" : label}
    </button>
  );
}

// Разрешаем только безопасные теги — никакого XSS
function sanitizeHtml(html) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Возвращаем только <b> и <br/> — всё остальное уже заэскейплено
    .replace(/&lt;b&gt;/g, "<b>")
    .replace(/&lt;\/b&gt;/g, "</b>")
    .replace(/&lt;br\s*\/&gt;/g, "<br/>")
    .replace(/&lt;br&gt;/g, "<br/>");
}

const InfoModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div style={{position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20}} onClick={onClose}>
      <div style={{background:"#111827", border:"1px solid #a855f7", borderRadius:20, padding:24, maxWidth:400, width:"100%"}} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
          <h3 style={{color:"#d8b4fe", fontSize:16, fontWeight:900, textTransform:"uppercase"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none", border:"none", color:"#9ca3af", fontSize:20, cursor:"pointer"}}>×</button>
        </div>
        <div style={{color:"#cbd5e1", fontSize:14, lineHeight:1.6}} dangerouslySetInnerHTML={{__html: sanitizeHtml(content)}} />
      </div>
    </div>
  );
};

// --- TTS SCRIPT TABS COMPONENT (вынесен из IIFE чтобы хуки работали корректно) ---
function TTSScriptTabs({ ttsStudioData }) {
  const [activeTTS, setActiveTTS] = useState("google");
  const ttsScripts = {
    google:     { label:"🔵 Google AI",   color:"#38bdf8", text: ttsStudioData.script_google     || "" },
    elevenlabs: { label:"🟣 ElevenLabs",  color:"#a78bfa", text: ttsStudioData.script_elevenlabs || "" },
    clean:      { label:"⚪ Чистый",      color:"#94a3b8", text: ttsStudioData.script_clean       || "" }
  };
  return (
    <div style={{background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        {Object.entries(ttsScripts).map(([k,v])=>(
          <button key={k} onClick={()=>setActiveTTS(k)} style={{flex:1,padding:"10px 4px",background:activeTTS===k?"rgba(255,255,255,.06)":"transparent",border:"none",color:activeTTS===k?v.color:"#475569",fontSize:10,fontWeight:900,cursor:"pointer",transition:"all .2s",letterSpacing:"0.5px"}}>
            {v.label}
          </button>
        ))}
      </div>
      <div style={{padding:14}}>
        <div style={{fontFamily:"monospace",fontSize:11,color:"#fef3c7",lineHeight:1.8,background:"rgba(0,0,0,.4)",padding:12,borderRadius:10,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto"}} className="hide-scroll">
          {ttsScripts[activeTTS].text || <span style={{color:"#475569",fontStyle:"italic"}}>Нет данных</span>}
        </div>
        <div style={{marginTop:10}}>
          <CopyBtn text={ttsScripts[activeTTS].text} label={`📋 СКОПИРОВАТЬ — ${ttsScripts[activeTTS].label}`} fullWidth/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY LOCK ENGINE (встроен из neurocineVideoPipeline.js)
// Вызывается автоматически в конце Шага 2 — не требует отдельного запуска
// ─────────────────────────────────────────────────────────────────────────────

function ncNormalizeText(value = "", max = 260) {
  const s = String(value || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

function ncBuildIdentityLock({ characterDNA = {}, seed = "777777", referenceImage = "" } = {}) {
  const dna = {
    name:     characterDNA.name     || "",
    gender:   characterDNA.gender   || "",
    age:      characterDNA.age      || "",
    face:     characterDNA.face     || characterDNA.dna || "",
    hair:     characterDNA.hair     || "",
    outfit:   characterDNA.outfit   || "",
    style:    characterDNA.style    || "cinematic realism",
    lighting: characterDNA.lighting || "high contrast shadows",
    camera:   characterDNA.camera   || "35mm",
  };

  const parts = [
    dna.name, dna.gender,
    dna.age ? `${dna.age} years old` : "",
    dna.face, dna.hair,
    dna.outfit ? `wearing ${dna.outfit}` : "",
    dna.style, dna.lighting, dna.camera,
  ].filter(Boolean);

  return {
    dna,
    seed,
    referenceImage,
    identity: parts.join(", "),
    lockPhrase: "same character, consistent face, same hairstyle, same outfit, same lighting style, no identity drift",
  };
}

function stripDnaForI2V(prompt) {
  prompt = String(prompt || "");
  return prompt
    .replace(/\[CHAR_\d+_DNA:[^\]]*\]/gi, "")
    .replace(/same character, consistent face[^,."]*/gi, "")
    .replace(/opening shot, establish identity and world,?\s*/gi, "")
    .replace(/continue previous shot world, preserve identity[^,."]*/gi, "")
    .replace(/preserve same face and outfit,?\s*/gi, "")
    .replace(/no identity drift,?\s*/gi, "")
    .replace(/use reference image as identity anchor,?\s*/gi, "")
    .replace(/seed \d+,?\s*/gi, "")
    .replace(/,\s*,/g, ",")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ncEnrichFrames({ frames = [], identityLock, styleLock = "" } = {}) {
  const style = styleLock || "cinematic, high contrast, consistent color grading, trailer-like continuity";
  const allowXray = /\bx[-\s]?ray\b|fluoroscopy|scientific blueprint/i.test(style);

  return frames.map((frame, index) => {
    const continuity =
      index === 0
        ? "opening shot, establish story world"
        : "continue previous scene logic, preserve lighting continuity";

    const refNote = identityLock.referenceImage ? "use reference image as identity anchor" : "";
    const seedNote = identityLock.seed && identityLock.seed !== "777777" ? `seed ${identityLock.seed}` : "";
    const sceneFirst = frame.imgPrompt_EN || frame.visual || frame.scene || "";
    const motionFirst = frame.vidPrompt_EN || frame.video_prompt || frame.visual || "";
    const hasIdentity = identityLock.identity && identityLock.identity.length > 4;
    const visibleChar = hasIdentity && hasVisibleCharacter(frame, `${sceneFirst} ${motionFirst}`);

    const identityBlock = visibleChar
      ? [identityLock.identity, identityLock.lockPhrase, refNote].filter(Boolean).join(", ")
      : "";

    // SCENE-FIRST: сюжет/визуал кадра всегда выше DNA. DNA добавляем только если персонаж реально виден.
    const enrichedImg = ncNormalizeText(
      sanitizeModeLeak([
        sceneFirst,
        identityBlock,
        continuity,
        style,
        seedNote,
      ].filter(Boolean).join(", "), { allowXray, frame }),
      320
    );

    const enrichedVid = ncNormalizeText(
      sanitizeModeLeak([
        motionFirst.replace(/^ANIMATE CURRENT FRAME:\s*/i, ""),
        visibleChar ? "preserve same face and outfit" : "no character identity lock; focus on scene objects and environment",
        "smooth camera motion, subject/object motion, environment motion",
        continuity,
        style,
        refNote,
        seedNote,
      ].filter(Boolean).join(", "), { allowXray, frame }),
      320
    );

    return {
      ...frame,
      imgPrompt_EN: enrichedImg,
      vidPrompt_EN: enrichedVid,
      identity_lock_applied: Boolean(visibleChar),
      continuity_note: continuity,
    };
  });
}
export default function Page() {
  const [tokens, setTokens] = useState(START_BALANCE);
  const [showPaywall, setShowPaywall] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  
  const [topic, setTopic] = useState("");
  const [finalTwist, setFinalTwist] = useState(""); 
  const [genre, setGenre] = useState("ТАЙНА");
  const [script, setScript] = useState("");
  
  // STUDIO SETUP
  const [studioMode, setStudioMode] = useState("AUTO");
  const [studioLoc, setStudioLoc] = useState("");
  const [studioStyle, setStudioStyle] = useState("");

  const [dur, setDur] = useState("До 60 сек");
  const [vidFormat, setVidFormat] = useState("9:16");
  const [engine, setEngine] = useState("CINEMATIC");
  const [customStyle, setCustomStyle] = useState(""); 
  const [lang, setLang] = useState("RU"); 
  const [pipelineMode, setPipelineMode] = useState("T2V");
  const [promptView, setPromptView] = useState("T2V"); // T2V = full DNA prompts, I2V = action-only prompts
  
  const [chars, setChars] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false); 

  // 🔒 SEED LOCK SYSTEM
  const [seedLocked, setSeedLocked] = useState(false);
  const [seedValue, setSeedValue] = useState(() => Math.floor(Math.random() * 999999999));
  const genNewSeed = () => setSeedValue(Math.floor(Math.random() * 999999999));

  // PRO TTS SETUP
  const [showTTS, setShowTTS] = useState(false);
  const [ttsVoice, setTtsVoice] = useState("Male_Deep"); 
  const [ttsSpeed, setTtsSpeed] = useState("1.15");

  const [hooksList, setHooksList] = useState([]); 
  const [view, setView] = useState("form");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [tab, setTab] = useState("storyboard");
  
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: "", content: "" });
  const [showGuide, setShowGuide] = useState(false);
  
  const [frames, setFrames] = useState([]);
  const [retention, setRetention] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [music, setMusic] = useState("");
  const [seoVariants, setSeoVariants] = useState([]);
  const [generatedChars, setGeneratedChars] = useState([]);
  const [locRef, setLocRef] = useState("");
  const [styleRef, setStyleRef] = useState("");
  
  const [bRolls, setBRolls] = useState([]);
  const [step2Done, setStep2Done] = useState(false);
  // Частичный прогресс Шага 2 — сохраняем готовые батчи чтобы не потерять оплаченные запросы
  const [step2Partial, setStep2Partial] = useState(null); // { prompts, fromBatch, totalBatches, thumbRaw, brolls }
  const [busy, setBusy] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [ttsStudioData, setTtsStudioData] = useState(null);
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [fbData, setFbData] = useState(null);
  const [generatingFB, setGeneratingFB] = useState(false);

  // ── REFERENCE STUDIO STATE ────────────────────────────────────────────────
  const [refChar, setRefChar] = useState(null);        // base64 фото персонажа
  const [refLoc, setRefLoc] = useState(null);          // base64 фото локации
  const [refStyle, setRefStyle] = useState(null);      // base64 фото стиля
  const [refCharDNA, setRefCharDNA] = useState("");    // проанализированная ДНК персонажа
  const [refLocText, setRefLocText] = useState("");    // проанализированная локация
  const [refStyleText, setRefStyleText] = useState(""); // проанализированный стиль
  const [refAnalyzed, setRefAnalyzed] = useState(false);
  const [referencePrompts, setReferencePrompts] = useState([]);
  const [multiCharRefs, setMultiCharRefs] = useState([]); // [{id, src, dna, name}]
  const [currentStep, setCurrentStep] = useState("form");

  // ── I2V ANALYZER STATE ────────────────────────────────────────────────────
  const [i2vPackage, setI2vPackage] = useState(null);
  const [generatingI2V, setGeneratingI2V] = useState(false);

  // ── PRODUCTION PIPELINE STATE ─────────────────────────────────────────────
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null); // { stage, index, total, message }

  const [rawScript, setRawScript] = useState("");
  const [rawImg, setRawImg] = useState("");
  const [rawVid, setRawVid] = useState("");

  const [bgImage, setBgImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false); 
  
  const [covTitle, setCovTitle] = useState("");
  const [covHook, setCovHook] = useState("");
  const [covCta, setCovCta] = useState("");
  const [covDark, setCovDark] = useState(50);
  const [covX, setCovX] = useState(50);
  const [covY, setCovY] = useState(50);
  const [covFont, setCovFont] = useState(FONTS[1].id);
  const [covColor, setCovColor] = useState(COLORS[0]);
  const [activePreset, setActivePreset] = useState("netflix");

  const [sizeHook, setSizeHook] = useState(12);
  const [sizeTitle, setSizeTitle] = useState(32);
  const [sizeCta, setSizeCta] = useState(10);
  
  const [logoX, setLogoX] = useState(50);
  const [logoY, setLogoY] = useState(10);
  const [logoSize, setLogoSize] = useState(20);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const scrollRef = useRef(null);

  // ─── DEV MODE ──────────────────────────────────────────────────────────────
  // Пароль хранится ТОЛЬКО в process.env.DEV_KEY на сервере (не здесь!)
  // Создай app/api/check-dev/route.js:
  //   export async function GET(req) {
  //     const key = new URL(req.url).searchParams.get("key");
  //     if (key && key === process.env.DEV_KEY) {
  //       return Response.json({ ok: true });
  //     }
  //     return Response.json({ ok: false }, { status: 403 });
  //   }

  const activateDevMode = () => {
    setTokens(999);
    localStorage.setItem("ds_billing", JSON.stringify({ tokens: 999, date: new Date().toLocaleDateString() }));
  };

  useEffect(() => { 
    if (typeof window !== "undefined") { 

      // ── ПРОВЕРКА LOCK OVERLAY ──
      if (localStorage.getItem("nc_unlocked") === "true") setSiteUnlocked(true);

      // ── ПРОВЕРКА URL-ПАРАМЕТРА (?dev=пароль) — проверка на СЕРВЕРЕ ──
      const params = new URLSearchParams(window.location.search);
      const devKey = params.get("dev");
      if (devKey) {
        // Убираем пароль из адресной строки немедленно
        window.history.replaceState({}, "", window.location.pathname);
        // Проверяем через сервер — пароль в коде не хранится
        fetch(`/api/check-dev?key=${encodeURIComponent(devKey)}`)
          .then(r => r.json())
          .then(d => { if (d.ok) activateDevMode(); })
          .catch(() => {});
      }

      const savedHist = localStorage.getItem("ds_history"); 
      if (savedHist) { try { setHistory(JSON.parse(savedHist)); } catch { localStorage.removeItem("ds_history"); } }
      const savedDraft = localStorage.getItem("ds_draft");
      if (savedDraft) {
         try {
           const d = JSON.parse(savedDraft);
           if (d.topic) {
             setTopic(d.topic);
             if (d.script) setScript(d.script); // скрипт только вместе с темой
           }
           // script без topic не восстанавливаем — иначе "старый" скрипт появится при пустой теме
           if (d.genre) setGenre(d.genre); 
           if (d.finalTwist) setFinalTwist(d.finalTwist);
           if (d.chars) setChars(d.chars);
           if (d.pipelineMode) setPipelineMode(d.pipelineMode);
           if (d.studioMode) setStudioMode(d.studioMode);
           if (d.studioLoc) setStudioLoc(d.studioLoc);
           if (d.studioStyle) setStudioStyle(d.studioStyle);
           if (d.ttsVoice) setTtsVoice(d.ttsVoice);
           if (d.ttsSpeed) setTtsSpeed(d.ttsSpeed);
           if (d.ttsStudioData) setTtsStudioData(d.ttsStudioData);
           if (d.dur) setDur(d.dur);
           if (d.vidFormat) setVidFormat(d.vidFormat);
           if (d.engine) setEngine(d.engine);
           if (d.customStyle) setCustomStyle(d.customStyle);
           if (d.lang) setLang(d.lang);
           if (d.seedLocked !== undefined) setSeedLocked(Boolean(d.seedLocked));
           if (d.seedValue) setSeedValue(d.seedValue);
           if (d.frames) setFrames(d.frames);
           if (d.generatedChars) setGeneratedChars(d.generatedChars);
           if (d.locRef) setLocRef(d.locRef);
           if (d.styleRef) setStyleRef(d.styleRef);
           if (d.step2Done !== undefined) setStep2Done(Boolean(d.step2Done));
           if (d.referencePrompts) setReferencePrompts(d.referencePrompts);
           if (d.multiCharRefs) setMultiCharRefs(d.multiCharRefs);
           if (d.currentStep) setCurrentStep(d.currentStep);
         } catch(e){}
      }
      setDraftLoaded(true);

      // Если dev не активирован через URL — загружаем обычный биллинг
      {
        const today = new Date().toLocaleDateString();
        const savedBilling = localStorage.getItem("ds_billing");
        if (savedBilling) {
          try {
            const b = JSON.parse(savedBilling);
            const currentTokens = Number.isFinite(Number(b.tokens)) ? Number(b.tokens) : START_BALANCE;
            if (b.date !== today) {
              const nextTokens = Math.max(currentTokens, DAILY_MIN_BALANCE);
              setTokens(nextTokens);
              localStorage.setItem("ds_billing", JSON.stringify({ tokens: nextTokens, date: today }));
            } else {
              setTokens(currentTokens);
            }
          } catch(e) {
            setTokens(START_BALANCE);
            try { localStorage.setItem("ds_billing", JSON.stringify({ tokens: START_BALANCE, date: today })); } catch {}
          }
        } else {
          localStorage.setItem("ds_billing", JSON.stringify({ tokens: START_BALANCE, date: today }));
          setTokens(START_BALANCE);
        }
      }
    } 
  }, []);

  useEffect(() => { if (GENRE_PRESETS[genre]) { setCovFont(GENRE_PRESETS[genre].font); setCovColor(GENRE_PRESETS[genre].color); } }, [genre]);
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem("ds_draft", JSON.stringify({
        topic, script, genre, finalTwist, chars, pipelineMode, studioMode, studioLoc, studioStyle,
        ttsVoice, ttsSpeed, ttsStudioData, dur, vidFormat, engine, customStyle, lang,
        seedLocked, seedValue, frames, generatedChars, locRef, styleRef, step2Done,
        referencePrompts, multiCharRefs, currentStep
      }));
    } catch {}
  }, [topic, script, genre, finalTwist, chars, pipelineMode, studioMode, studioLoc, studioStyle, ttsVoice, ttsSpeed, ttsStudioData, dur, vidFormat, engine, customStyle, lang, seedLocked, seedValue, frames, generatedChars, locRef, styleRef, step2Done, referencePrompts, multiCharRefs, currentStep, draftLoaded]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({top:0, behavior:"smooth"}); }, [view]);

  // Ротация советов каждые 5 секунд на экране загрузки
  useEffect(() => {
    if (view !== "loading") return;
    setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  // GOD MODE по кликам — отключён, используй URL ?dev=пароль
  const handleGodMode = () => {};

  // ОЧИСТИТЬ ВСEX — сброс до состояния нового проекта
  const handleClearAll = () => {
    if (!topic.trim() && !script.trim() && frames.length === 0 && generatedChars.length === 0 && chars.length === 0) return;
    if (!confirm("Очистить всё? Тема, сценарий, персонажи, раскадровка, промпты и SEO будут удалены. Начнём новый проект?")) return;
    setTopic("");
    setFinalTwist("");
    setScript("");
    setFrames([]);
    setHooksList([]);
    setStep2Done(false);
    setSeoVariants([]);
    setMusic("");
    setBRolls([]);
    setRawScript("");
    setRawImg("");
    setRawVid("");
    setRetention(null);
    setGeneratedChars([]);
    setChars([]);
    setLocRef("");
    setStyleRef("");
    setThumb(null);
    setTtsStudioData(null);
    setReferencePrompts([]);
    setMultiCharRefs([]);
    setCurrentStep("form");
    setBusy(false);
    setView("form");
    // Референсы не сбрасываем — пользователь мог их загрузить для нового проекта тоже
  };

  const deductToken = (amount = 1) => { setTokens(prev => { const next = Math.max(0, prev - amount); try { localStorage.setItem("ds_billing", JSON.stringify({ tokens: next, date: new Date().toLocaleDateString() })); } catch {} return next; }); };
  const refundToken = (amount = 1) => { setTokens(prev => { const next = prev + amount; try { localStorage.setItem("ds_billing", JSON.stringify({ tokens: next, date: new Date().toLocaleDateString() })); } catch {} return next; }); };
  const checkTokens = (amount = 1) => { if (tokens < amount) { setShowPaywall(true); return false; } return true; };
  const deleteFromHistory = (id) => { setHistory(prev => { const next = prev.filter(item => item.id !== id); localStorage.setItem("ds_history", JSON.stringify(next)); return next; }); };
  const clearHistory = () => { if(confirm("Очистить архив проектов?")) { setHistory([]); localStorage.removeItem("ds_history"); } };

  const applyPreset = (presetId) => {
    setActivePreset(presetId); 
    const p = COVER_PRESETS.find(x => x.id === presetId);
    if (p) { setCovX(p.defX); setCovY(p.defY); setSizeHook(p.style.hook.fontSize || 12); setSizeTitle(p.style.title.fontSize || 32); setSizeCta(p.style.cta?.fontSize || 10); }
  };

  const saveCustomPreset = () => {
    const p = { covX, covY, covFont, covColor, sizeHook, sizeTitle, sizeCta, covDark, logoX, logoY, logoSize };
    localStorage.setItem("ds_custom_preset", JSON.stringify(p)); alert("⭐ Ваш стиль успешно сохранен в памяти!");
  };

  const loadCustomPreset = () => {
    try {
      const raw = localStorage.getItem("ds_custom_preset");
      if (!raw) { alert("У вас еще нет сохраненного стиля."); return; }
      const p = JSON.parse(raw);
      if (p) {
        setCovX(p.covX); setCovY(p.covY); setCovFont(p.covFont); setCovColor(p.covColor); setSizeHook(p.sizeHook); setSizeTitle(p.sizeTitle); setSizeCta(p.sizeCta); setCovDark(p.covDark);
        if(p.logoX) setLogoX(p.logoX); if(p.logoY) setLogoY(p.logoY); if(p.logoSize) setLogoSize(p.logoSize); setActivePreset("custom");
      } else { alert("У вас еще нет сохраненного стиля."); }
    } catch(e) { alert("Ошибка загрузки стиля. Попробуйте сохранить заново."); }
  };

  const openInfo = (type) => {
    const infos = {
      engine: { title: "Визуальный движок", content: "<b>Кино-реализм:</b> Идеально для фактов и тайн.<br/><b>Dark History:</b> Рваный, мрачный стиль с шумом пленки.<br/><b>2.5D Анимация:</b> Мягкий стиль Pixar/Ghibli для сторителлинга.<br/><b>X-Ray:</b> Схемы и рентген для науки." },
      format: { title: "Формат и Длительность", content: "Для Shorts/TikTok всегда используйте <b>9:16</b>.<br/>Длительность определяет объем сценария. Для удержания ритма (смена кадра каждые 3 секунды), система жестко контролирует количество слов." },
      seo: { title: "Вирусное SEO", content: "Матрица SEO создает 3 варианта: <b>Кликбейт</b> (эмоции/шок), <b>Тайна</b> (интрига/загадка) и <b>Поиск</b> (алгоритмы YouTube). Вы можете сгенерировать дополнительные варианты." },
      forge: { title: "Кузница Персонажей", content: "Добавьте имена и промпты (внешность) героев <b>ДО генерации</b>. Нажмите кнопку КАСТИНГ, чтобы ИИ перевел ваши простые слова в правильный референс-лист. Эти лица будут стабильно повторяться в видео!" },
      pipeline: { title: "Пайплайн Генерации", content: "<b>Прямой (T2V):</b> ИИ пишет длинные промпты, вшивая внешность и локацию прямо в текст. Идеально для генерации без стартовых картинок.<br/><b>Студийный (I2V):</b> ИИ пишет экстремально короткие промпты (только действие). Идеально, если вы сами подкладываете картинки-референсы в Whisk или Runway." },
      clearAll: { title: "🗑 Очистить проект", content: "Полный сброс до чистого листа.<br/><br/>Будет удалено:<br/><b>• Тема и скрытый твист</b><br/><b>• Сценарий</b><br/><b>• Кузница персонажей</b><br/><b>• Раскадровка и все кадры</b><br/><b>• Image / Video промпты</b><br/><b>• SEO-матрица и музыка</b><br/><b>• TTS настройки</b><br/><br/>Используйте когда готовы начать новый проект." }
    };
    setInfoModal({ isOpen: true, ...infos[type] });
  };

  const addChar = () => setChars([...chars, { id: `CHAR_${Date.now()}`, name: "", desc: "" }]);
  const removeChar = (id) => setChars(chars.filter(c => c.id !== id));
  const updateChar = (id, field, value) => setChars(chars.map(c => c.id === id ? { ...c, [field]: value } : c));

  // Ресайз фото до макс 1024px перед отправкой в API
  function resizeImageToBase64(file, maxPx = 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleCharImageUpload(e, id) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setLoadingMsg("Сжимаем и сканируем лицо..."); setView("loading");
    try {
      const base64 = await resizeImageToBase64(file, 1024);
      const sys = `You are an elite Character Designer. Describe the person's physical appearance in the image in English. Focus ONLY on physical traits: age, jawline, facial hair, scars, eye color, specific clothing style. DO NOT describe the background or lighting. Return ONLY a valid JSON object: { "desc": "Detailed english prompt..." }`;
      const rawText = await callVisionAPI(base64, sys);
      const parsed = cleanJSON(rawText);
      if (parsed && parsed.desc) {
        updateChar(id, 'desc', `[${parsed.desc}]`);
      }
    } catch (err) {
      alert("🚨 ОШИБКА АНАЛИЗА ФОТО: " + err.message);
    } finally {
      setBusy(false); setView("form");
    }
  }

  async function handleGenerateReferencePrompts() {
    if (!checkTokens(COSTS.referencePrompts)) return;
    const prompts = buildAllReferencePrompts({ chars, engine, genre, topic: topic || script.slice(0, 120), loc: studioLoc, style: studioStyle || customStyle });
    setReferencePrompts(prompts);
    deductToken(COSTS.referencePrompts);
  }

  async function handleMultiCharUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 6);
    if (!files.length) return;
    setBusy(true); setLoadingMsg("Сканируем персонажей..."); setView("loading");
    try {
      const next = [...multiCharRefs];
      for (let i = 0; i < files.length; i++) {
        const src = await resizeImageToBase64(files[i], 1024);
        const raw = await callVisionAPI(src, 'Analyze this character reference image for AI video identity lock. Return ONLY JSON: { "dna": "[CHAR_DNA: age, gender, face geometry, eyes, hair, skin, body, outfit, unique marks, production identity lock in English]" }');
        const parsed = cleanJSON(raw);
        const id = "CHAR_" + (next.length + 1);
        next.push({ id, src, dna: parsed?.dna || "", name: id });
      }
      setMultiCharRefs(next.slice(0, 6));
    } catch (err) {
      alert("🚨 Ошибка multi-character анализа: " + err.message);
    } finally {
      setBusy(false); setView("form");
    }
  }

  function removeMultiCharRef(id) {
    setMultiCharRefs(prev => prev.filter(x => x.id !== id));
  }

  async function handleAnalyzeRefs() {
    if (!refLoc && !refStyle && multiCharRefs.length === 0 && !refChar) return alert("Загрузите локацию, стиль или персонажей!");
    setBusy(true); setView("loading");
    try {
      if (refChar) {
        setLoadingMsg("👤 Сканируем лицо персонажа...");
        const raw = await callVisionAPI(refChar, `You are an elite Character Designer for AI video production. Analyze this reference photo and describe the person's PHYSICAL appearance in English. Focus ONLY on: exact age range, face geometry (jaw shape, cheekbone prominence, nose bridge), eye color+shape+spacing, eyebrow thickness, hair (color/texture/length/style), facial hair details, skin tone, build, any unique marks/scars/features. Be maximally specific — this DNA will be used to lock character identity across all video frames. Return ONLY valid JSON: { "dna": "[CHAR_REF_DNA: very detailed physical description in English]" }`);
        const p = cleanJSON(raw);
        if (p?.dna) setRefCharDNA(p.dna);
      }
      if (refLoc) {
        setLoadingMsg("🌍 Анализируем локацию...");
        const raw = await callVisionAPI(refLoc, `You are a Location Scout for cinematic AI production. Analyze this reference photo. Describe the environment for AI image/video generation: architecture style, spatial layout, lighting quality+direction+color temperature, time of day, atmosphere, dominant colors+textures, era/period, key visual elements in foreground/background. Return ONLY valid JSON: { "location": "cinematic location description in English, 25-40 words" }`);
        const p = cleanJSON(raw);
        if (p?.location) setRefLocText(p.location);
      }
      if (refStyle) {
        setLoadingMsg("🎨 Анализируем визуальный стиль...");
        const raw = await callVisionAPI(refStyle, `You are an Art Director for AI video generation. Analyze this reference image's VISUAL STYLE: color grading (warm/cool/desaturated), lighting approach (hard/soft/rim/practical), film grain/texture, contrast ratio, mood, cinematography style (handheld/steady/wide/tight), era aesthetic, any specific visual effects or treatment. Return ONLY valid JSON: { "style": "cinematic style reference description in English, 20-35 words" }`);
        const p = cleanJSON(raw);
        if (p?.style) setRefStyleText(p.style);
      }
      setRefAnalyzed(true);
      const analyzed = [multiCharRefs.length && (multiCharRefs.length + " персонаж(ей)"), refLoc && "локация", refStyle && "стиль"].filter(Boolean).join(", ");
      alert(`✅ Проанализировано: ${analyzed}.\n\nТеперь запускайте Шаг 1 — раскадровка будет построена под ваши референсы!`);
    } catch(e) {
      alert("🚨 Ошибка анализа референсов: " + e.message);
    } finally {
      setBusy(false); setView("form");
    }
  }

  async function handleAnalyzeI2V() {
    if (!frames.length) return alert("Сначала создайте раскадровку (Шаг 1)!");
    setGeneratingI2V(true);
    setI2vPackage(null);

    const sys = `You are a professional I2V (Image-to-Video) Production Coordinator for AI video studios. Given a storyboard, output a ready-to-use I2V production package.

For EACH frame generate:
1. ref_image_prompt — the STILL image to generate FIRST as the anchor/reference frame.
   Structure: [subject + exact pose + body language + facial expression] + [environment + background + lighting direction + shadows] + [camera angle + lens type] + [cinematic style tags]
   Rules: max 200 chars · NO motion words · NO audio · this is a STILL photo prompt for Midjourney/Grok/Flux.
2. i2v_prompt — how to ANIMATE that image. MUST start with "Animate:" · then camera movement + subject motion only · max 15 words total · ZERO appearance description.
3. duration — clip length in seconds (2–5)
4. tool — best tool for this frame: Kling / Runway / Veo / Hailuo / Minimax

Output ONLY valid JSON, no text outside:
{
  "frames": [
    { "n": 1, "ref_image_prompt": "...", "i2v_prompt": "Animate: slow push-in, subject exhales, hands grip table edge", "duration": 3, "tool": "Kling" }
  ],
  "workflow_note": "1-2 sentence production tip for this specific storyboard"
}`;

    try {
      const BATCH = 8;
      let allResults = [];

      const charCtx = generatedChars.length > 0
        ? `\nCHARACTERS: ${generatedChars.map(c => `${c.name}: ${c.dna || ""}`).join(" | ")}`
        : "";
      const locCtx  = locRef   ? `\nLOCATION: ${locRef}`   : "";
      const refCtx  = refCharDNA ? `\nCHAR_REF_DNA: ${refCharDNA}` : "";

      for (let i = 0; i < frames.length; i += BATCH) {
        const chunk = frames.slice(i, i + BATCH);
        const storyboard = chunk.map((f, idx) =>
          `Frame ${i+idx+1} [${f.timecode||""}] cam:${f.camera||""} | Visual: ${f.visual} | Voice: ${f.voice||""} | SFX: ${f.sfx||""}`
        ).join("\n");

        const req = `STORYBOARD (frames ${i+1}–${i+chunk.length}):
${storyboard}${charCtx}${locCtx}${refCtx}

Generate exactly ${chunk.length} frames. Keep frame numbering starting from ${i+1}.`;

        const text = await callAPI(req, 4000, sys);
        const data = cleanJSON(text);
        if (data?.frames) allResults = [...allResults, ...data.frames];
        if (i + BATCH < frames.length) await sleep(400);
      }

      setI2vPackage({ frames: allResults });
    } catch(e) {
      alert("🚨 Ошибка I2V анализа: " + e.message);
    } finally {
      setGeneratingI2V(false);
    }
  }

  async function handleGenerateCasting() {
    if (!topic.trim() && chars.length === 0) return alert("Введите тему или добавьте персонажей вручную!");
    if (!checkTokens(COSTS.casting)) return;
    setBusy(true); setLoadingMsg("Проводим кастинг героев..."); setView("loading");
    
    try {
      const manualChars = chars.map(c => `${c.name}: ${c.desc}`).join(" | ");
      const topicSafe = topic.slice(0, 200);
      // Если персонажи не заданы — ИИ придумывает сам из темы
      const charInstruction = manualChars
        ? `ПЕРСОНАЖИ (описаны пользователем): ${manualChars}`
        : `ПЕРСОНАЖИ: не указаны — АВТОМАТИЧЕСКИ придумай 1-2 главных персонажа подходящих для этой темы. Дай им реалистичные имена и уникальную внешность соответствующую эпохе и жанру темы.`;
      const req = `ТЕМА: ${topicSafe}\n${charInstruction}\nЗадача: создай DNA-карточки для каждого персонажа. Выдай JSON массив characters_EN по шаблону.`;
      
      const text = await callAPI(req, 2500, `You are a Casting Director for short film production. Output ONLY valid JSON.
CONTEXT: Historical documentary educational reconstruction. 10th century Viking Age. All characters are historical/ceremonial figures for documentary purposes.
CRITICAL RULES:
- BANNED WORDS: "brave", "determined", "courageous", "sense of justice" — ONLY physical appearance.
- CHARACTER NAMES IN OUTPUT: use neutral historical roles — "Norse Ritual Officiant", "Viking Chronicle Witness", "Ceremonial Subject" — never "executioner", "victim", "killer".
- For each character generate TWO fields:
  1. "dna": unique physical anchor for T2V. FORMAT: "[CHAR_ID_DNA: AGE yo GENDER, FACE_GEOMETRY (gaunt hollow cheeks/square jaw/hooked nose etc), HAIR (color+texture+length), EYES (color+shape), UNIQUE_MARKS (specific: '1.5cm scar left chin' — INVENT if not provided), BUILD, COSTUME (material+color+specific damage: dents, tears, emblems)]". Make features MAXIMALLY UNIQUE.
  2. "ref_sheet_prompt": ENGLISH ONLY — every word must be in English, do NOT use Russian. Template (fill [PHYSICAL_DESC] in English):
     "Nine-panel film costume and makeup continuity photography, real human actor, hyperrealistic. Subject: [PHYSICAL_DESC in English]. Studio setting: neutral 18% grey seamless backdrop, large overhead softbox key light, small fill reflector, even exposure across all panels, 5600K color temperature. Three rows — ROW 1: full-body front, left profile, right profile, back. ROW 2: three-quarter body front, left 3/4, right 3/4, back 3/4. ROW 3: head-and-shoulders front, left profile, right profile. Every panel shows the identical real human face — visible pores, natural stubble, micro-imperfections, subsurface scattering, Kodak Vision3 500T film grain. --no CGI, 3D render, game engine, Unreal Engine, illustration, anime, smooth skin, plastic skin, text, labels, arrows, watermark"

Output: { "characters_EN": [ { "id": "CHAR_1", "name": "Имя", "dna": "[CHAR_1_DNA: ...]", "ref_sheet_prompt": "Nine-panel film costume..." } ] }`);
      
      const data = cleanJSON(text);
      if (data.characters_EN && data.characters_EN.length > 0) {
        setGeneratedChars(data.characters_EN);
        deductToken(COSTS.casting);
        alert(`Успешно! ИИ подготовил кастинг на ${data.characters_EN.length} чел. Можно переходить к Шагу 1.`);
      } else {
        alert("Героев не найдено.");
      }
    } catch(e) { alert("🚨 ОШИБКА КАСТИНГА: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleGenerateHooks() {
    if (!topic.trim()) return alert("Сначала введите Тему!");
    setBusy(true); setLoadingMsg("Придумываем кликбейты..."); setView("loading");
    try {
      const text = await callAPI(`Topic: ${topic}`, 2000, `You are a viral TikTok producer. Write 3 powerful hooks (1 sentence each) in RUSSIAN. Genre: ${genre}. Provide valid JSON object ONLY. Format: { "hooks": ["Хук 1", "Хук 2", "Хук 3"] }`);
      const data = cleanJSON(text);
      if(data && Array.isArray(data.hooks)) setHooksList(data.hooks);
    } catch(e) { alert("🚨 ОШИБКА: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleDraftText() {
    if (!topic.trim()) return alert("Введите тему!");
    setBusy(true); setScript(""); setLoadingMsg("Пишем сценарий..."); setView("loading");
    try {
      const sec = DURATION_SECONDS[dur] || 60; 
      let wordLimitRule = "";
      if (sec <= 15) wordLimitRule = "СТРОГО от 30 до 40 слов. Максимум 5 предложений. Не превышать.";
      else if (sec <= 40) wordLimitRule = "СТРОГО от 70 до 90 слов. Максимум 8 предложений. Не превышать.";
      else if (sec <= 60) wordLimitRule = "СТРОГО от 120 до 150 слов. Максимум 10 предложений. ЗАПРЕЩЕНО писать длиннее — это ровно 60 секунд озвучки.";
      else wordLimitRule = `СТРОГО около ${Math.floor(sec * 2.2)} слов (не более ${Math.floor(sec * 2.4)}). Это ${sec} секунд озвучки.`;

      // Структура зависит от длительности
      const isShort = sec <= 60;
      const isMedium = sec > 60 && sec <= 180;

      const structureRule = isShort
        ? `СТРУКТУРА SHORTS (≤60 сек) — Hook→Context→Payoff→Loop:
  0-5 сек КРЮЧОК: Визуальный парадокс + шоковая фраза. Удар без вступления.
  5-20 сек НАГНЕТАНИЕ: Быстрые факты, Pattern Interrupt каждые 2-3 фразы.
  20-50 сек КУЛЬМИНАЦИЯ: Главное действие, эмоциональный пик, невозможные сцены.
  50-60 сек ПЕТЛЯ: Конец → начало ИЛИ провокационный крючок. БЕЗ морали.`
        : isMedium
        ? `СТРУКТУРА СРЕДНЕГО ФОРМАТА (1-3 мин) — 3 главы:
  ГЛАВА 1 (первые 20%): Тизер эпичных моментов + обещание результата.
  ГЛАВА 2 (средние 60%): 2-3 мини-истории, каждая со своим хуком и финалом.
  ГЛАВА 3 (последние 20%): Пик, неожиданная развязка, крючок-провокация.
  Смысловой мост между главами — фраза делающая невозможным закрыть видео.`
        : `СТРУКТУРА ДЛИННОГО ФОРМАТА (>3 мин) — Путешествие героя:
  0-10%: Нарезка лучших моментов + обещание невозможного.
  10-30%: Постановка проблемы. Первый барьер. Почему это важно?
  30-70%: 4 главы-микросюжета (хук→развитие→твист→мост к следующей).
  70-90%: Пик + развязка главной интриги.
  90-100%: Провокационный факт + отсылка к следующему видео.`;

      const sysTxt = `You are NeuroCine Master Engine — elite short-form script writer for TikTok, Reels, and YouTube Shorts. Write voiceover in ${lang === "RU" ? "RUSSIAN" : "ENGLISH"}. Genre: ${genre}. Output ONLY valid JSON: { "script": "..." }

SCRIPT ENGINE RULES:
- Short sentences. Natural voice-over rhythm. No filler.
- Every line must move the viewer forward and keep tension alive until the end.
- Final line must feel like payoff or CTA — never a moral summary or rhetorical question.
- No "in this video..." / "let me tell you..." / "few people know..." type openers.
- Start from the middle of action or with a shocking fact. Never with background context.
- Reactive language preferred: direct, punchy, physically descriptive.
- BANNED words: "incredible", "amazing", "legendary", "unique", "fascinating" — replace with physical facts and numbers.

${structureRule}

${structureRule}

VOLUME: ${wordLimitRule}. CRITICAL — do not go under or over.
${finalTwist ? `Hidden twist to reveal mid-story: ${finalTwist}` : ""}
No markdown. No ** in text. Emphasis in CAPS only.`;
      
      const manualChars = chars.map(c => `${c.name}: ${c.desc}`).join(" | ");
      const text = await callAPI(`Тема: ${topic}\nПерсонажи: ${manualChars}`, 3000, sysTxt);
      const data = cleanJSON(text);
      
      let draftScript = "";
      if (data && data.script) {
        draftScript = data.script.replace(/Диктор:\s*/gi, "").trim();
      } else {
        draftScript = text.replace(/Диктор:\s*/gi, "").trim();
      }

      // ── GOD MODE: SELF-CRITIQUE LOOP ──
      // Claude читает свой же черновик, находит 3 слабых места и переписывает их
      setLoadingMsg("🧠 GOD MODE: Критика и доработка сценария...");
      try {
        const critiqueSys = `You are the most brutal script editor in Hollywood. You read a documentary voiceover draft and find its WEAKEST moments, then rewrite the full script making it perfect. Output ONLY valid JSON: { "weaknesses": ["слабость 1", "слабость 2", "слабость 3"], "script": "ПОЛНЫЙ ПЕРЕРАБОТАННЫЙ СЦЕНАРИЙ" }

КРИТЕРИИ СЛАБОСТИ (ищи именно это):
- Любые фразы где зритель может зазеваться или уйти
- Абстракции без цифр, материалов или физики 
- Предложения длиннее 10 слов без Pattern Interrupt после них
- Финальная фраза не раскалывает аудиторию на 2 лагеря
- Вводные слова-паразиты (итак, следовательно, стоит отметить)
- Хук первой секунды — недостаточно жёсткий

ПРАВИЛО: Переписывай ТОЛЬКО слабые места. Всё сильное — оставляй дословно.
Объём финального скрипта: ${wordLimitRule}.`;
        
        const critiqueText = await callAPI(
          `ЧЕРНОВИК СЦЕНАРИЯ ДЛЯ КРИТИКИ:\n\n${draftScript}`,
          3500,
          critiqueSys
        );
        const critiqueData = cleanJSON(critiqueText);
        if (critiqueData && critiqueData.script) {
          draftScript = critiqueData.script.replace(/Диктор:\s*/gi, "").trim();
        }
      } catch(critiqueErr) {
        // Если критика упала — используем оригинальный черновик
        console.warn("Self-critique failed, using original draft:", critiqueErr.message);
      }

      setScript(draftScript);
      setHooksList([]);
    } catch(e) { alert("🚨 ОШИБКА: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleBoostScript() {
    if (!script.trim()) return alert("Сначала напишите или вставьте текст сценария!");
    setBusy(true); setLoadingMsg("⚡ Усиливаем текст по вирусным законам..."); setView("loading");
    try {
      const sec = DURATION_SECONDS[dur] || 60;
      let wordLimitRule = "";
      if (sec <= 15) wordLimitRule = "СТРОГО от 30 до 40 слов. Максимум 5 предложений.";
      else if (sec <= 40) wordLimitRule = "СТРОГО от 70 до 90 слов. Максимум 8 предложений.";
      else if (sec <= 60) wordLimitRule = "СТРОГО от 120 до 150 слов. Максимум 10 предложений. Не превышать — это 60 секунд.";
      else wordLimitRule = `СТРОГО около ${Math.floor(sec * 2.2)} слов (лимит ${Math.floor(sec * 2.4)})`;

      const boostSys = `You are NeuroCine Master Engine — elite short-form script rewriter. Output ONLY valid JSON: { "script": "..." }

TASK: Rewrite the script preserving ALL facts, timeline, and meaning. Apply NeuroCine quality rules fully.

RULE 1 — HOOK FIRST: Does the first line start with context or background? DELETE IT. Start from the middle of action or a shocking fact. BANNED openers: "Once...", "Few know...", "In this story...", "Let me tell you..."

RULE 2 — SHOW DON'T TELL: Never name an emotion — show it through the body: pain, heat, sound, smell, weight. Replace "he was scared" → "heart at 180 bpm. hands ice cold. no air coming in."

RULE 3 — SENTENCE RHYTHM: Alternate strictly — very short (2–3 words) → medium (7–10 words) → impact (number or shock). Remove all filler conjunctions and weak transitions.

RULE 4 — NO FILLER: Delete all: "so", "therefore", "however", "it's worth noting", "essentially", "in general", "thus". Every sentence = action or fact. Zero filler.

RULE 5 — TENSION EVERY LINE: Each sentence must make the viewer ask "what next?" Never give the full answer immediately.

RULE 6 — FINAL LINE: Replace any rhetorical question or moral summary with ONE of: provocative fact dividing audience into 2 camps / open loop hinting at continuation / question that provokes argument.

RULE 7 — NO MARKDOWN: Remove all ** from text. Emphasis only in CAPS.

VOLUME: ${wordLimitRule}.
BANNED: "incredible", "amazing", "legendary", "heroic", "unique", "fascinating", "let's dive in", "few people know".`;

      const text = await callAPI(`ОРИГИНАЛЬНЫЙ ТЕКСТ ДЛЯ ПЕРЕРАБОТКИ:\n\n${script}`, 3500, boostSys);
      const data = cleanJSON(text);
      if (data && data.script) {
        setScript(data.script.replace(/Диктор:\s*/gi, "").trim());
        deductToken(COSTS.boost);
      }
    } catch(e) { alert("🚨 ОШИБКА УСИЛЕНИЯ: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleGenerateTTSStudio() {
    if (!checkTokens(COSTS.tts)) return;
    setGeneratingTTS(true);
    try {
      const voiceList = GOOGLE_VOICES.map(v => `${v.id} (${v.desc})`).join(", ");
      const sys = `You are a PRO TTS Director for multi-platform voice production. Analyze the script and output ONLY valid JSON (no markdown, no text outside JSON):
{
  "scene": "Short location/atmosphere for TTS booth — 5-8 words, English. Examples: The Dark History Vault. / Underground Interrogation Room. / Deep Space Observatory Deck.",
  "context": "Directing note — pacing and emotional arc in English, 1-2 sentences. Example: Documentary thriller. Starts cold and slow, accelerates to controlled panic. Authoritative, never sensational.",
  "voice_id": "Pick the single best voice from: ${voiceList}. Match to genre and mood.",
  "voice_reason": "1 sentence in Russian why this voice fits this specific content.",
  "script_google": "Rewrite the FULL script with Google AI Studio emotion tags. Available: [intrigue] [desire] [shock] [information] [inspiration] [confident] [sad] [whisper] [aggressive] [calm]. Tag every 1-3 sentences. Replace internal tags. Preserve EXACT original language. Do NOT cut or summarize — use the COMPLETE text.",
  "script_elevenlabs": "Rewrite the FULL script with ElevenLabs SSML-style tags. Use: <break time='0.5s'/> for pauses, <prosody rate='slow'> for dramatic slowdown, <emphasis level='strong'> for key words. Preserve ALL original text.",
  "script_clean": "The FULL script completely clean — no tags, no markdown, no brackets. Ready to paste into any TTS. Preserve ALL original text word for word.",
  "pacing_tips": "3 short Russian tips for recording this specific script. Example: Первые 5 сек — очень медленно, почти шёпот. На слове КАПСЛОК — ускорить в 1.5 раза. Финал — понизить голос до минимума."
}`;
      const text = await callAPI(`Жанр: ${genre}. Тема: ${topic||"Видео"}.\nСценарий:\n${script}`, 2000, sys);
      const data = cleanJSON(text);
      setTtsStudioData(data);
      deductToken(COSTS.tts);
    } catch(e) { alert("Ошибка TTS Studio: " + e.message); }
    finally { setGeneratingTTS(false); }
  }

  async function handleAddSEOVariant() {    setGeneratingSEO(true);
    try {
      const req = `Тема: ${topic}. Сценарий: ${script}. Сгенерируй еще 1 АБСОЛЮТНО НОВЫЙ вариант SEO. Выдай только JSON объект: { "title": "...", "desc": "...", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] }`;
      const text = await callAPI(req, 1000, `Output ONLY valid JSON object representing 1 SEO variant with AT LEAST 5 hashtags.`);
      const newVar = cleanJSON(text);
      setSeoVariants(prev => [...prev, newVar]);
    } catch (e) { alert("Ошибка генерации SEO: " + e.message); } finally { setGeneratingSEO(false); }
  }

  const savePageProfile = (profile) => {};

  // ── PRODUCTION PIPELINE ───────────────────────────────────────────────────
  async function handleRunPipeline() {
    if (!step2Done || frames.length === 0) return alert("Сначала выполните Шаг 2 — PRO-промпты!");
    setPipelineRunning(true);
    setPipelineResult(null);
    setPipelineProgress({ stage: "prepare", index: 0, total: frames.length, message: "Подготовка locked промптов..." });

    try {
      // Собираем scriptPackage из текущего состояния
      const scriptPackage = {
        topic,
        genre,
        frames: frames.map((f, i) => ({
          id: `frame_${String(i + 1).padStart(2, "0")}`,
          time: f.timecode || `${i * 3}-${i * 3 + 3}s`,
          visual: f.visual || "",
          image_prompt: f.imgPrompt_EN || f.visual || "",
          video_prompt: f.vidPrompt_EN || "",
          vo: f.voice || "",
          sfx: f.sfx || "",
          text_on_screen: f.text_on_screen || "",
          negative_prompt: f.negative_prompt || "",
          bypass_method: f.bypass_method || "none",
          characters_in_frame: f.characters_in_frame || [],
          duration: 3,
        })),
        character_dna_used: generatedChars.length > 0 ? {
          name: generatedChars[0]?.name || "Character",
          gender: "unknown",
          age: "unknown",
          face: generatedChars[0]?.dna || "",
          hair: "",
          outfit: "",
          style: styleRef || "cinematic",
          lighting: "high contrast shadows",
          camera: "35mm",
        } : {},
        location_ref_EN: locRef,
        style_ref_EN: styleRef,
      };

      const characterDNA = scriptPackage.character_dna_used;
      const seed = seedLocked ? String(seedValue) : "777777";
      const styleLockStr = [VISUAL_ENGINES[engine]?.prompt, styleRef || "cinematic", customStyle]
        .filter(Boolean)
        .map(part => sanitizeModeLeak(part, { allowXray: isXrayEngine(engine) }))
        .filter(Boolean)
        .join(", ") || "cinematic";

      // Симуляция прогресса пока идёт запрос
      let progressInterval;
      let simIndex = 0;
      const stages = [
        ...frames.map((_, i) => ({ stage: "image", index: i, total: frames.length, message: `🖼 Image anchor ${i + 1}/${frames.length}...` })),
        ...frames.map((_, i) => ({ stage: "video", index: i, total: frames.length, message: `🎥 Video clip ${i + 1}/${frames.length}...` })),
        { stage: "render", index: 0, total: 1, message: "🎬 Собираем timeline..." },
      ];
      progressInterval = setInterval(() => {
        if (simIndex < stages.length) {
          setPipelineProgress(stages[simIndex]);
          simIndex++;
        }
      }, 600);

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Token": process.env.NEXT_PUBLIC_APP_SECRET || "" },
        body: JSON.stringify({ scriptPackage, characterDNA, seed, referenceImage: "", styleLock: styleLockStr }),
      });

      clearInterval(progressInterval);

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Pipeline error");

      setPipelineResult(data);
      setPipelineProgress({ stage: "done", index: frames.length, total: frames.length, message: "✅ Timeline готов!" });
      setTab("pipeline");

    } catch (e) {
      alert("🚨 Pipeline error: " + e.message);
    } finally {
      setPipelineRunning(false);
    }
  }

  async function handleGenerateFB() {
    if (!script.trim()) return alert("Сначала создайте сценарий (Шаг 1)!");
    setGeneratingFB(true);
    setFbData(null);
    try {
      const sys = `Ты — elite SMM-копирайтер для Facebook и Instagram. Пишешь ТОЛЬКО на русском языке. Output ONLY valid JSON (no markdown, no text outside JSON).

ЖАНР КОНТЕНТА: ${genre}. Тема: тёмная история, факты, тайны.

═══ ПРАВИЛА ПУБЛИКАЦИИ FACEBOOK ═══
— Первая строка = стоп-скроллер. Читатель должен остановиться. Без вступлений.
— Абзацы по 2-3 предложения. Много пробелов — читается на телефоне.
— Каждый абзац = крючок, нельзя остановиться.
— Факты с цифрами и физикой — никаких абстракций.
— Финал = вопрос который раскалывает аудиторию на 2 лагеря → комментарии.
— 5-7 хештегов тематики. Конкретные, не общие.
— БАН: "невероятно", "удивительно", "мало кто знает", "погрузимся".

═══ ПРАВИЛА REELS CAPTION (Instagram) ═══
— Максимум 3 строки до "ещё" — первые 3 строки РЕШАЮТ всё.
— Строка 1: цифра + шок (5-7 слов max).
— Строка 2: механизм — КАК это произошло (физика/цифры).
— Строка 3: незакрытая интрига ("Но никто не знал...").
— 3-5 хештегов в конце.

═══ ПРАВИЛА INSTAGRAM CAROUSEL (5 слайдов) ═══
Это серия из 5 слайдов для карусели. Каждый слайд = 1 экран.
СЛАЙД 1 — ОБЛОЖКА (bg: "#0d0010"): Заголовок-удар. КАПСЛОК. 1-2 строки max.
СЛАЙД 2 — КОНТЕКСТ (bg: "#0a0500"): Физика проблемы. Числа + материалы.
СЛАЙД 3 — ПОВОРОТ (bg: "#000a06"): Неожиданный факт — то, чего не знают.
СЛАЙД 4 — ПИК (bg: "#0a000a"): Самый жуткий/шокирующий момент. Физика.
СЛАЙД 5 — CTA (bg: "#00060d"): Смотри видео + вопрос для комментариев.

═══ ПРАВИЛА 3 STORIES-ТИЗЕРОВ ═══
СЛАЙД 1 — УДАР (bg: "#0d0010"): Одна фраза-шок. Максимум 7 слов. КАПСЛОК на ключевом слове.
СЛАЙД 2 — ИНТРИГА (bg: "#0a0500"): Риторический обрыв без ответа.
СЛАЙД 3 — ПРИЗЫВ (bg: "#00060d"): Мощный CTA на видео.

JSON FORMAT:
{
  "post_hook": "Первая строка публикации — стоп-скроллер",
  "post_body": "Тело публикации. Абзацы через \\n\\n",
  "post_question": "Финальный вопрос для комментариев",
  "post_tags": "#тег1 #тег2 #тег3 #тег4 #тег5",
  "reels_caption": "Строка 1: цифра + шок\\nСтрока 2: механизм\\nСтрока 3: интрига\\n\\n#тег1 #тег2 #тег3",
  "carousel": [
    { "emoji": "🎬", "headline": "ЗАГОЛОВОК ОБЛОЖКИ", "sub": "подзаголовок 1-2 строки", "bg": "#0d0010" },
    { "emoji": "⚡", "headline": "Заголовок контекста", "sub": "факт с числами", "bg": "#0a0500" },
    { "emoji": "🔍", "headline": "Неожиданный поворот", "sub": "то чего не знают", "bg": "#000a06" },
    { "emoji": "💀", "headline": "Пик — самый жуткий момент", "sub": "физика + число", "bg": "#0a000a" },
    { "emoji": "▶️", "headline": "Смотри полное видео", "sub": "вопрос для комментариев", "bg": "#00060d" }
  ],
  "slides": [
    { "emoji": "🩸", "headline": "ГЛАВНЫЙ УДАР в 7 слов", "sub": "уточнение до 10 слов", "bg": "#0d0010" },
    { "emoji": "👁", "headline": "Интрига без ответа", "sub": "нагнетание до 10 слов", "bg": "#0a0500" },
    { "emoji": "▶️", "headline": "CTA смотреть видео", "sub": "обещание что ждёт", "bg": "#00060d" }
  ]
}`;

      const req = `Тема: ${topic || "Видео"}. Жанр: ${genre}.\n\nСЦЕНАРИЙ:\n${script}`;
      const text = await callAPI(req, 2000, sys);
      const data = cleanJSON(text);
      setFbData(data);
    } catch(e) { alert("🚨 Ошибка генерации Facebook: " + e.message); }
    finally { setGeneratingFB(false); }
  }

  function rebuildRawText(frms, s2done) {
    let scriptTxt = frms.map((f, i) => `КАДР ${i+1} [${f.timecode || ''}]\n👁 Визуал: ${f.visual}\n🔊 SFX: ${f.sfx||''}\n🔤 Титры: ${f.text_on_screen||''}\n🎙 Диктор: «${f.voice}»`).join("\n\n");
    let imgTxt = s2done ? frms.map((f,i) => `[КАДР ${i+1}]\n${f.imgPrompt_EN||''}`).filter(x=>x.includes("\n")).join("\n\n") : "";
    let vidTxt = s2done ? frms.map((f,i) => `[КАДР ${i+1}]\n${f.vidPrompt_EN||''}`).filter(x=>x.includes("\n")).join("\n\n") : "";
    setRawScript(scriptTxt); setRawImg(imgTxt); setRawVid(vidTxt);
  }

  async function handleStep1() {
    if (!topic.trim() && !script.trim()) return alert("Заполните тему или скрипт!");
    if (!checkTokens(COSTS.step1)) return;
    
    setBusy(true); setView("loading");
    
    // Сбрасываем старые результаты перед новой генерацией
    setFrames([]); setStep2Done(false); setSeoVariants([]); setMusic("");
    setBRolls([]); setRawScript(""); setRawImg(""); setRawVid(""); setRetention(null);
    
    try {
      // Прогреваем Render-сервер перед основным запросом
      // Render Free засыпает после 15 мин — первый запрос занимает 50+ сек
      setLoadingMsg("🔄 Проверяем соединение с сервером...");
      await warmupServer(() => setLoadingMsg("😴 Сервер просыпается (~15 сек), подождите..."));
      
      let currentScript = script.trim();
      const sec = DURATION_SECONDS[dur] || 60;
      
      if (!currentScript) {
        setLoadingMsg("✍️ Генерируем текст диктора...");
        const maxWords = Math.floor(sec * 2.2);
        let volRule = maxWords > 100 ? `MUST be ~${maxWords} words. Write 4-5 detailed paragraphs. DO NOT WRITE SHORT TEXT.` : `MUST be under ${maxWords} words.`;
        const rawVoiceText = await callAPI(`Тема: ${topic}`, 3000, `You are elite viral documentary writer. Write voiceover in ${lang === "RU" ? "Russian" : "English"}. Genre: ${genre}. OUTPUT ONLY JSON: { "script": "..." }

HOOK LAW: First sentence = [NUMBER/FACT] + [PARADOX]. NEVER start with context, intro, or background. BANNED OPENERS: "Once upon a time", "At the beginning", "Few people know", "History knows", "В начале", "Однажды", "Мало кто знает".
PHYSICS LAW: Every claim has a physical anchor (weight, size, count, sound). No abstractions.
CAPS LAW: 1-2 words per block in CAPS = visual anchor for the editor.
TWIST LAW: Mid-text emotional inversion — break the expected narrative with "But they didn't know..." / "И тут произошло невозможное."
FINALE LAW: Last sentence = controversy bait. No rhetorical questions. No moral summary. No conclusions.
VOLUME: ${volRule}
BANNED WORDS: "погрузимся", "давайте", "мало кто знает", "история знает", "невероятно", "удивительно", "таким образом", "интересный факт", "можно ли".`);
        const parsedVoice = cleanJSON(rawVoiceText);
        currentScript = (parsedVoice.script || rawVoiceText).trim();
        setScript(currentScript);
      }
      
      // Render.com выдерживает долгие запросы — снимаем искусственный лимит
      const timingPlan = getTimingPlan(dur);
      const rawTargetFrames = timingPlan.frames;
      const targetFrames = rawTargetFrames; // выбранная длительность строго управляет количеством кадров
      
      setLoadingMsg("🎬 Шаг 1/2: Пишем раскадровку и ДНК персонажей...");
      const characterRefsForPrompt = multiCharRefs.map((c, i) => ({ id: c.id || "CHAR_" + (i+1), dna: c.dna, source: "uploaded_reference" }));
      const preGeneratedChars = generatedChars.length > 0 ? JSON.stringify(generatedChars) : JSON.stringify(chars);
      const visualStyleLock = getStyleLock(engine, customStyle);
      const studioInfo = studioMode === "MANUAL" ? `ВВОДНЫЕ СТУДИИ: Локация [${studioLoc}], Стиль [${studioStyle}]. НЕ МЕНЯЙ ИХ!` : "ВВОДНЫЕ СТУДИИ: Автоматически.";

      // БАТЧ-ГЕНЕРАЦИЯ раскадровки
      // Каждый батч = отдельный лёгкий запрос к серверу
      // 6 кадров * ~250 токенов = ~1500 токенов на батч → быстро и стабильно
      // Уменьшено с 10 до 6 — новый промпт детальнее, нужно больше токенов на кадр
      const BATCH_SIZE = 6;
      const totalBatches = Math.ceil(targetFrames / BATCH_SIZE);
      let allFrames = [];
      let data1A = null;

      // Нарезаем сценарий на равные части для каждого батча
      const scriptWords = currentScript.split(/\s+/);
      const wordsPerBatch = Math.ceil(scriptWords.length / totalBatches);

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchStart = batch * BATCH_SIZE + 1;
        const batchEnd = Math.min((batch + 1) * BATCH_SIZE, targetFrames);
        const batchCount = batchEnd - batchStart + 1;
        const timecodeStart = (batchStart - 1) * 3;

        // Даём каждому батчу свой кусок сценария
        const wordStart = batch * wordsPerBatch;
        const scriptChunk = scriptWords.slice(wordStart, wordStart + wordsPerBatch + 20).join(" ");

        setLoadingMsg(`🎬 Раскадровка: кадры ${batchStart}–${batchEnd} из ${targetFrames} (батч ${batch+1}/${totalBatches})`);

        const isFirstBatch = batch === 0;

        // Инжектируем проанализированные референсы в промпт (если есть)
        const refCharBlock = refCharDNA ? `\nCHARACTER VISUAL REFERENCE (from uploaded photo — MANDATORY): ${refCharDNA}. Apply this EXACT appearance to the main character in EVERY frame. Do NOT invent or change any physical feature.` : "";
        const refLocBlock  = refLocText  ? `\nLOCATION VISUAL REFERENCE (from uploaded photo): ${refLocText}. Match this environment throughout all frames.` : "";
        const refStyleBlock= refStyleText? `\nSTYLE VISUAL REFERENCE (from uploaded photo): ${refStyleText}. Apply this visual style to every frame.` : "";
        const refBlock = refCharBlock + refLocBlock + refStyleBlock;

        const batchReq = isFirstBatch
          ? `LANGUAGE: ${lang === "RU" ? "РУССКИЙ" : "ENGLISH"}.\nТЕМА: ${topic}. ЖАНР: ${genre}.\n${studioInfo}${refBlock}\nПЕРСОНАЖИ: ${preGeneratedChars}.\nСЦЕНАРИЙ (кадры ${batchStart}–${batchEnd}): ${scriptChunk}.\nВЫДАЙ СТРОГО JSON! ${timingPlan.frameDuration} СЕК/КАДР. РОВНО ${batchCount} КАДРОВ. Тайм-коды с ${timecodeStart} сек. Каждый кадр обязан учитывать жанр ${genre} и стиль ${VISUAL_ENGINES[engine]?.label || engine}.`
          : `LANGUAGE: ${lang === "RU" ? "РУССКИЙ" : "ENGLISH"}.\nПРОДОЛЖЕНИЕ. ЖАНР: ${genre}.\nПЕРСОНАЖИ: ${JSON.stringify(data1A.characters_EN || [])}.\nЛОКАЦИЯ: ${data1A.location_ref_EN || ""}.\n${refBlock}\nСЦЕНАРИЙ (кадры ${batchStart}–${batchEnd}): ${scriptChunk}.\nВЫДАЙ СТРОГО JSON! РОВНО ${batchCount} КАДРОВ. Тайм-коды с ${timecodeStart} сек. Используй тех же персонажей, но только когда они реально видны в кадре.`;

        const batchSys = isFirstBatch
          ? SYS_STEP_1A
          : `${SYS_STEP_1A}\nIMPORTANT: Continuation batch ${batch+1}/${totalBatches}. Output JSON with ONLY "frames" array. Reuse existing characters_EN. Timecodes start from ${timecodeStart} sec.`;

        let batchText, batchData;
        batchText = await callAPI(batchReq, 5000, batchSys, MODEL_STD);
        batchData = cleanJSON(batchText);

        if (isFirstBatch) {
          data1A = batchData;
          allFrames = batchData.frames || [];
        } else {
          allFrames = [...allFrames, ...(batchData.frames || [])];
        }

        if (batch < totalBatches - 1) await sleep(300);
      }

      data1A.frames = allFrames;
      
      setLoadingMsg("📊 Шаг 2/2: Генерируем SEO, музыку и обложку...");
      // Передаём только первые 10 кадров для SEO — не нужно всё
      const framesForSEO = (data1A.frames || []).slice(0, 10);
      const req1B = `STORYBOARD:\n${JSON.stringify(framesForSEO)}\n\nGenerate SEO, Music tags, and Thumbnail concept.`;
      
      const text1B = await callAPI(req1B, 2000, SYS_STEP_1B);
      const data1B = cleanJSON(text1B);

      setFrames(data1A.frames || []); 
      setRetention(data1A.retention || null); 
      setGeneratedChars(data1A.characters_EN || []);
      setLocRef(data1A.location_ref_EN || ""); 
      setStyleRef(data1A.style_ref_EN || ""); 
      
      setThumb(data1B.thumbnail || null); 
      setMusic(data1B.music_EN || ""); 
      setSeoVariants(data1B.seo_variants || []);
      
      setBRolls([]); 
      setStep2Done(false);
      
      if (data1B.thumbnail) { 
        setCovTitle(data1B.thumbnail.title || ""); 
        setCovHook(data1B.thumbnail.hook || ""); 
        setCovCta(data1B.thumbnail.cta || "СМОТРЕТЬ"); 
        applyPreset("netflix"); 
      }
      
      rebuildRawText(data1A.frames || [], false);
      deductToken(COSTS.step1); // Step 1 — отдельная AI-генерация, списываем только после полного успеха
      setCurrentStep("storyboard");
      setBgImage(null); 
      setTab("storyboard"); 
      setView("result");
      
      const stateData = { frames: data1A.frames, generatedChars: data1A.characters_EN, locRef: data1A.location_ref_EN, styleRef: data1A.style_ref_EN, retention: data1A.retention, thumb: data1B.thumbnail, seoVariants: data1B.seo_variants, music: data1B.music_EN, step2Done: false, ttsStudioData };
      const newHistory = [{ id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString("ru-RU"), text: JSON.stringify(stateData), format: vidFormat }, ...history].slice(0, 10);
      setHistory(newHistory); localStorage.setItem("ds_history", JSON.stringify(newHistory));
      
    } catch(e) { alert(`🚨 ОШИБКА ШАГА 1: ${e.message}`); setView("form"); } finally { setBusy(false); }
  }

  async function handleStep2(resumeFrom = null) {
    if (!checkTokens(COSTS.step2)) return;
    setBusy(true); setView("loading");
    let tokenDeducted = false;

    // Прогреваем сервер — между Шагом 1 и 2 пользователь изучает раскадровку,
    // за это время Render Free успевает заснуть снова (< 15 мин без запросов)
    setLoadingMsg("🔄 Проверяем соединение... ⭐ API не тратится");
    await warmupServer(() => setLoadingMsg("😴 Сервер просыпается (~15 сек)... ⭐ API ещё не тратится, ждите!"));
    setLoadingMsg(`🪄 Шаг 2: Генерируем PRO-промпты (${pipelineMode} режим)...`);

    try {
      const charDnaDict = {};
      generatedChars.forEach(c => { if (c.dna) charDnaDict[c.id] = c.dna; });
      const charsDict = generatedChars.map(c => `${c.id} DNA: ${c.dna || c.ref_sheet_prompt}`).join("\n");
      const textToRender = thumb?.text_for_rendering ? `\n\nNATIVE CYRILLIC REQUIRED: text_for_rendering = "${thumb.text_for_rendering}"` : "";
      
      // Если загружен референс персонажа + I2V режим → специальный формат промпта
      const hasRefChar = !!(refChar && refCharDNA);
      const refI2VNote = hasRefChar
        ? ` REFERENCE_IMAGE is provided (uploaded character photo). Each 'vidPrompt_EN' MUST start with: "Animate the reference image:" — then add ONLY: camera movement + subject action (max 12 words total after prefix). Zero DNA description. Zero appearance words.`
        : "";
      const refCharPromptNote = hasRefChar
        ? `\nCHARACTER_REF_DNA (from uploaded photo — embed in imgPrompt_EN for T2V): ${refCharDNA}`
        : "";

      const pipelineDirective = pipelineMode === "I2V" 
        ? `PIPELINE_MODE = I2V (Studio). Keep 'vidPrompt_EN' very short — ONLY action and camera movement.${refI2VNote}`
        : "PIPELINE_MODE = T2V (Direct). 'vidPrompt_EN' = [DNA_BLOCK] + [Location] + [Action] + [Camera].";

      const PROMPT_BATCH = 5;

      // Восстанавливаем уже оплаченные батчи если это продолжение после ошибки
      let allPrompts = resumeFrom ? [...resumeFrom.prompts] : [];
      let thumbnailPromptRaw = resumeFrom ? (resumeFrom.thumbRaw || "") : "";
      let thumbnailPromptVariantsRaw = resumeFrom ? (resumeFrom.thumbVariantsRaw || []) : [];
      let finalBRolls = resumeFrom ? (resumeFrom.brolls || []) : [];
      const startBatch = resumeFrom ? resumeFrom.fromBatch : 0;

      if (resumeFrom) {
        setStep2Partial(null); // Сбрасываем partial — начинаем продолжение
      }

      // AUTO-CENSOR: проходим по всем кадрам ДО батчинга
      // Если в visual/voice есть цензурное слово — помечаем bypass_method = "AUTO_XRAY"
      // и заменяем visual на X-ray описание (чтобы Grok не получил запрещённый контент)
      const xraySelected = isXrayEngine(engine);
      const framesForStep2 = frames.map(f => {
        // X-Ray применяется только если выбран движок X_RAY или пользователь вручную поставил bypass для X_RAY-режима.
        if (f.bypass_method && f.bypass_method !== "none") {
          if ((f.bypass_method === "AUTO_XRAY" || f.bypass_method === "C") && xraySelected) {
            return { ...f, visual: XRAY_WRAP(f.visual || "") };
          }
          return f;
        }
        const detected = autoCensorBypass(f.visual || "", f.voice || "");
        if (detected === "AUTO_XRAY" && xraySelected) {
          return {
            ...f,
            bypass_method: "AUTO_XRAY",
            visual: XRAY_WRAP(f.visual || ""),
          };
        }
        // В Dark History / Cinematic / 2.5D не подменяем сюжет на X-ray из-за слов "тела", "солдаты" и т.д.
        return { ...f, bypass_method: f.bypass_method || "none" };
      });

      // totalPromptBatches считаем от framesForStep2 (после авто-цензора)
      const totalPromptBatches = Math.ceil(framesForStep2.length / PROMPT_BATCH);

      const autoCensorCount = framesForStep2.filter(f => f.bypass_method === "AUTO_XRAY").length;
      if (autoCensorCount > 0) {
        setLoadingMsg(`🛡 Авто-цензор: ${autoCensorCount} кадр(ов) переведено в X-ray стиль`);
        await sleep(1200);
      }

      for (let batch = startBatch; batch < totalPromptBatches; batch++) {
        const bStart = batch * PROMPT_BATCH;
        const bEnd = Math.min(bStart + PROMPT_BATCH, framesForStep2.length);
        const batchFrames = framesForStep2.slice(bStart, bEnd);
        const isLastBatch = batch === totalPromptBatches - 1;

        setLoadingMsg(`🎥 Промпты: кадры ${bStart+1}–${bEnd} из ${framesForStep2.length} (${batch+1}/${totalPromptBatches})`);

        const batchStoryboard = batchFrames.map((f, i) => 
          `Frame ${bStart+i+1} [bypass:${f.bypass_method||"none"}]: Visual: ${f.visual} | Voice: ${f.voice||""} | SFX: ${f.sfx||""} | Chars: ${(f.characters_in_frame || []).join(",")}`
        ).join("\n");

        const batchReq = `PIPELINE RULE:\n${pipelineDirective}\n\nSTORYBOARD (frames ${bStart+1}–${bEnd}):\n${batchStoryboard}\n\nCHARACTERS:\n${charsDict}${refCharPromptNote}\n\nLOCATION:\n${locRef}${isLastBatch ? textToRender : ""}\n\nGenerate exactly ${batchFrames.length} prompts.${isLastBatch ? "\nAlso generate thumbnail_prompt_EN." : "\nSkip thumbnail_prompt_EN."}`;

        let batchData;
        try {
          // 150 сек таймаут для тяжёлых промпт-батчей, 2 ретрая
          const batchText = await callAPI(batchReq, 6000, SYS_STEP_2, MODEL_STD, 2, 150000);
          batchData = cleanJSON(batchText);
        } catch(batchErr) {
          // Батч упал — сохраняем УЖЕ ОПЛАЧЕННЫЙ прогресс и сообщаем пользователю
          setStep2Partial({ prompts: allPrompts, fromBatch: batch, totalBatches: totalPromptBatches, thumbRaw: thumbnailPromptRaw, thumbVariantsRaw: thumbnailPromptVariantsRaw, brolls: finalBRolls });
          setBusy(false);
          setView("result");
          alert(`⚠️ Шаг 2 прерван на батче ${batch+1}/${totalPromptBatches} (кадры ${bStart+1}–${bEnd}).\n\n✅ Кадры 1–${bStart} уже готовы и сохранены.\n❌ Кадры ${bStart+1}–${frames.length} не обработаны.\n\n💡 Нажмите кнопку "▶ ПРОДОЛЖИТЬ" чтобы дообработать оставшиеся кадры без повторной оплаты готовых.\n\nОшибка: ${batchErr.message}`);
          return;
        }

        allPrompts = [...allPrompts, ...(batchData.frames_prompts || [])];
        if (isLastBatch && batchData.thumbnail_prompt_EN) {
          thumbnailPromptRaw = batchData.thumbnail_prompt_EN;
        }
        if (isLastBatch && Array.isArray(batchData.thumbnail_prompts_EN)) {
          thumbnailPromptVariantsRaw = batchData.thumbnail_prompts_EN;
        }
        if (isLastBatch) {
          finalBRolls = batchData.b_rolls || [];
          setBRolls(finalBRolls);
        }

        if (batch < totalPromptBatches - 1) await sleep(300);
      }

      // Собираем финальные промпты с DNA (2026 NLP approach — без keyword salad)
      const engineStyle = VISUAL_ENGINES[engine]?.prompt || "";
      const customText = customStyle ? `, ${customStyle}` : "";
      const finalStyle = `${engineStyle}${styleRef ? ", " + styleRef : ""}${customText}`;

      const updatedFrames = framesForStep2.map((f, i) => {
        const p = allPrompts[i] || {};

        const rawVid = p.vidPrompt_EN || f.visual;
        const rawImg = p.imgPrompt_EN || f.visual;

        // Чистим от любого оставшегося SD-синтаксиса на случай если модель его вернёт
        const cleanPrompt = (txt) => txt
          .replace(/\([^)]+:\d+(\.\d+)?\)/g, "")   // убираем веса (word:1.4)
          .replace(/\s*—no\b/gi, "")                 // убираем —no (em dash)
          .replace(/--no\b[^,\n]*/gi, "")            // убираем --no ... из тела
          .replace(/\bMaintain absolute visual consistency[^.]*\./gi, "") // убираем старый footer
          .replace(/\bsame actor[^,.]*/gi, "")
          .replace(/\blocked appearance[^,.]*/gi, "")
          .replace(/\bno character drift[^,.]*/gi, "")
          .replace(/,\s*,/g, ",")
          .replace(/\.\s*\./g, ".")
          .trim();

        const allowXray = isXrayEngine(engine);
        const cleanVid = sanitizeModeLeak(cleanPrompt(rawVid), { allowXray, frame: f });
        const cleanImg = sanitizeModeLeak(cleanPrompt(rawImg), { allowXray, frame: f });

        // 🔒 SEED LOCK — фиксируем seed для консистентности между кадрами
        const seedSuffix = seedLocked ? ` --seed ${seedValue}` : "";

        const negPrompt = p.negative_prompt || DEFAULT_NEGATIVE;

        return { ...f, imgPrompt_EN: cleanImg + seedSuffix, vidPrompt_EN: cleanVid + seedSuffix, negative_prompt: negPrompt };
      });

      // ── AUTO IDENTITY LOCK (встроен из Pipeline) ──────────────────────────
      // Строим identityLock из первого сгенерированного персонажа (или пустой если нет)
      const primaryChar = generatedChars[0] || {};
      const autoIdentityLock = ncBuildIdentityLock({
        characterDNA: {
          name:     primaryChar.name     || "",
          face:     primaryChar.dna      || "",
          style:    styleRef             || "cinematic realism",
          lighting: "high contrast shadows",
          camera:   "35mm anamorphic",
        },
        seed: seedLocked ? String(seedValue) : "777777",
        referenceImage: "",
      });

      const styleLockStr = [VISUAL_ENGINES[engine]?.prompt, styleRef, customStyle]
        .filter(Boolean)
        .map(part => sanitizeModeLeak(part, { allowXray: isXrayEngine(engine) }))
        .filter(Boolean)
        .join(", ") || "cinematic";

      // Обогащаем промпты: каждый кадр получает identity lock + continuity note
      const enrichedFrames = ncEnrichFrames({
        frames: updatedFrames,
        identityLock: autoIdentityLock,
        styleLock: styleLockStr,
      });

      // Усиленная система превью: всегда 2 варианта — событие/шок и гибрид человек+доказательство.
      const finalThumbVariants = buildPreviewVariants({ rawPrompt: thumbnailPromptRaw, modelVariants: thumbnailPromptVariantsRaw, topic, frames: framesForStep2, generatedChars, locRef, styleRef: finalStyle, thumb });
      const finalThumbPrompt = finalThumbVariants[0]?.prompt_EN || hardenThumbnailPrompt(thumbnailPromptRaw);
      const nextThumb = {...thumb, prompt_EN: finalThumbPrompt, preview_variants: finalThumbVariants};

      setStep2Partial(null); // Успех — очищаем partial
      setFrames(enrichedFrames); // ← enrichedFrames: промпты усилены Identity Lock + continuity
      setThumb(nextThumb); 
      setStep2Done(true);
      
      rebuildRawText(enrichedFrames, true); 
      tokenDeducted = true;
      deductToken(COSTS.step2); // Step 2 — отдельная AI-генерация, списываем только после полного успеха
      setView("result");

      setHistory(prev => {
         const next = [...prev];
         if(next.length > 0) { 
           const stateData = { frames: enrichedFrames, generatedChars, locRef, styleRef, retention, thumb: nextThumb, seoVariants, music, bRolls: finalBRolls, step2Done: true, ttsStudioData };
           next[0].text = JSON.stringify(stateData); 
           localStorage.setItem("ds_history", JSON.stringify(next)); 
         }
         return next;
      });
    } catch(e) { if (tokenDeducted) refundToken(); alert(`🚨 ОШИБКА ШАГА 2: ${e.message}\n\n💡 Попробуйте ещё раз — уже оплаченные батчи не повторятся.`); setView("result"); } finally { setBusy(false); }
  }

  function handleImageUpload(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setBgImage(ev.target.result); reader.readAsDataURL(file); }
  function handleLogoUpload(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setLogoImage(ev.target.result); reader.readAsDataURL(file); }
  
  async function downloadThumbnail() {
    const el = document.getElementById("thumbnail-export"); if (!el) return;
    setDownloading(true); const wasSafeZone = showSafeZone; setShowSafeZone(false); 
    setTimeout(() => {
      if (!window.html2canvas) { 
        const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; 
        s.onload = doCapture; document.body.appendChild(s); 
      } else { doCapture(); }
      
      function doCapture() {
        window.html2canvas(el, { useCORS: true, scale: 3, backgroundColor: null }).then(c => { 
          const a = document.createElement('a'); a.download = `Cover_${Date.now()}.png`; a.href = c.toDataURL(); a.click(); 
          setDownloading(false); setShowSafeZone(wasSafeZone); 
        }).catch(() => { setDownloading(false); setShowSafeZone(wasSafeZone); alert("Ошибка рендера обложки"); });
      }
    }, 100);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function downloadPDF() {
    setPdfDownloading(true);
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #111;">
        <h1 style="color: #a855f7;">🎬 DOCUSHORTS PRODUCER BRIEF</h1>
        <h2>Тема: ${escapeHtml(topic) || "Без темы"}</h2><p><strong>Жанр:</strong> ${escapeHtml(genre)}</p><hr style="margin: 20px 0;" />
        <h3>🎵 Музыка (Suno AI Prompt):</h3>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px;">${escapeHtml(music) || "Не сгенерировано"}</div>
        <hr style="margin: 20px 0;" />
        <h3>🎙 Настройки Диктора:</h3>
        <p><strong>Голос:</strong> ${escapeHtml(ttsVoice)} | <strong>Скорость:</strong> ${escapeHtml(ttsSpeed)}x | <strong>Эмоция:</strong> Авто (теги в тексте)</p>
        <hr style="margin: 20px 0;" />
        <h3>📝 Раскадровка:</h3>
        ${frames.map((f, i) => `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <strong style="color: #ef4444; font-size: 16px;">Кадр ${i+1} [${escapeHtml(f.timecode)}]</strong><br/>
            <div style="margin-top: 8px; font-size: 14px;"><b>👁 Визуал:</b> ${escapeHtml(f.visual)}</div>
            <div style="margin-top: 6px; color: #d97706; font-size: 14px;"><b>🔊 SFX:</b> ${escapeHtml(f.sfx) || "-"}</div>
            ${f.text_on_screen ? `<div style="margin-top: 6px; color: #ec4899; font-size: 14px;"><b>🔤 Титр:</b> ${escapeHtml(f.text_on_screen)}</div>` : ''}
            <div style="margin-top: 6px; color: #7c3aed; font-style: italic; font-size: 15px;"><b>🎙 Диктор:</b> «${escapeHtml(f.voice)}»</div>
            ${step2Done ? `<div style="margin-top: 10px; padding: 10px; background: #f8fafc; font-size: 12px; color: #475569; font-family: monospace;"><b>Video Prompt (Grok Super):</b> ${escapeHtml(f.vidPrompt_EN)}</div>` : ''}
          </div>
        `).join('')}
      </div>`;
    
    const opt = { margin: 0.5, filename: `Brief_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    if (!window.html2pdf) {
      const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.onload = () => { window.html2pdf().set(opt).from(element).save().then(() => setPdfDownloading(false)); }; document.body.appendChild(s);
    } else { window.html2pdf().set(opt).from(element).save().then(() => setPdfDownloading(false)); }
  }

  const currFormat = FORMATS.find(f => f.id === vidFormat) || FORMATS[0]; 
  const activeStyle = activePreset === "custom" ? COVER_PRESETS[0].style : COVER_PRESETS.find(p => p.id === activePreset).style;


  return (
    <div ref={scrollRef} style={{minHeight:"100vh", color:"#e2e8f0", paddingBottom:100, position:"relative", zIndex:1, overflowY:"auto"}}>
      <NeuralBackground />
      {!siteUnlocked && <LockedOverlay onUnlock={() => setSiteUnlocked(true)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@700;900&family=Creepster&family=Montserrat:wght@800;900&family=Oswald:wght@700&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,900;1,900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── ANIMATIONS ─────────────────────────────────────────── */
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes filmSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulseGlow   { 0%,100% { box-shadow: 0 4px 20px rgba(168,85,247,.45); } 50% { box-shadow: 0 4px 50px rgba(168,85,247,.95), 0 0 80px rgba(236,72,153,.3); } }
        @keyframes tokenPop    { 0%,100% { transform:scale(1); } 40% { transform:scale(1.45); } }
        @keyframes clapFlap    { 0% { transform:rotate(0deg); transform-origin: left top; } 30% { transform:rotate(-28deg); transform-origin: left top; } 55% { transform:rotate(0deg); transform-origin: left top; } 100% { transform:rotate(0deg); } }
        @keyframes gradShift   { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        @keyframes borderGlow  { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        @keyframes scanline    { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }

        /* ── STAGGER PANELS ─────────────────────────────────────── */
        .panel { animation: fadeSlideUp .45s ease both; opacity:0; }
        .panel:nth-child(1) { animation-delay:.05s; }
        .panel:nth-child(2) { animation-delay:.12s; }
        .panel:nth-child(3) { animation-delay:.19s; }
        .panel:nth-child(4) { animation-delay:.26s; }
        .panel:nth-child(5) { animation-delay:.33s; }
        .panel:nth-child(6) { animation-delay:.40s; }
        .panel:nth-child(7) { animation-delay:.47s; }

        /* ── FILM CARD ──────────────────────────────────────────── */
        .film-card { animation: filmSlideIn .4s ease both; opacity:0; }

        /* ── BUTTONS ─────────────────────────────────────────────  */
        .gbtn { width:100%; height:56px; border:none; border-radius:16px; cursor:pointer; font-weight:900; color:#fff;
          background: linear-gradient(135deg, #4f46e5, #9333ea, #ec4899);
          background-size: 200% 200%;
          transition: all .25s;
          box-shadow: 0 4px 20px rgba(168,85,247,.4); }
        .gbtn:hover { transform:translateY(-2px); filter:brightness(1.15); box-shadow:0 8px 35px rgba(168,85,247,.6); }
        .gbtn.pulsing { animation: pulseGlow 2s ease-in-out infinite; }

        .icon-btn { background:none; border:none; cursor:pointer; transition:opacity .2s; }
        .icon-btn:hover { opacity:.7; }

        /* ── GLASS PANEL ─────────────────────────────────────────  */
        .glass { background:rgba(12,12,22,.55); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-radius:20px; position:relative; }
        .glass::before { content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
          background: linear-gradient(135deg, rgba(168,85,247,.35) 0%, rgba(255,255,255,.06) 50%, rgba(236,72,153,.2) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out; mask-composite: exclude;
          pointer-events:none; animation: borderGlow 4s ease-in-out infinite; }

        /* ── INPUTS ──────────────────────────────────────────────  */
        textarea, input[type="text"], select { transition: border-color .2s, background .2s; }
        textarea:focus, input[type="text"]:focus, select:focus { outline:none; border-color:rgba(168,85,247,.65) !important; background:rgba(0,0,0,.65) !important; }

        /* ── RANGE SLIDER ────────────────────────────────────────  */
        input[type=range] { -webkit-appearance:none; width:100%; background:transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; height:16px; width:16px; border-radius:50%; background:#a855f7; cursor:pointer; margin-top:-6px; box-shadow:0 0 12px #a855f7; }
        input[type=range]::-webkit-slider-runnable-track { width:100%; height:4px; cursor:pointer; background:rgba(255,255,255,.1); border-radius:2px; }

        /* ── SCROLLBAR ───────────────────────────────────────────  */
        .hide-scroll::-webkit-scrollbar { display:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(168,85,247,.35); border-radius:2px; }

        /* ── DESKTOP 2-COL ───────────────────────────────────────  */
        @media (min-width:1024px) {
          .studio-grid { display:grid; grid-template-columns:1fr 380px; gap:28px; max-width:1160px; margin:0 auto; padding:24px 32px 80px; align-items:start; }
          .studio-right-col { position:sticky; top:76px; display:flex; flex-direction:column; gap:20px; }
          .mobile-only { display:none !important; }
        }
        @media (max-width:1023px) {
          .studio-grid { max-width:600px; margin:0 auto; padding:20px 16px 100px; display:flex; flex-direction:column; gap:20px; }
          .desktop-only { display:none !important; }
        }

        /* ── NAV GRADIENT BORDER ─────────────────────────────────  */
        .nav-bar { background:rgba(5,5,12,.75); backdrop-filter:blur(28px); border-bottom:1px solid transparent;
          background-clip:padding-box; position:relative; }
        .nav-bar::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg, transparent, rgba(168,85,247,.6), rgba(236,72,153,.4), transparent);
          animation: gradShift 6s ease-in-out infinite; background-size:200% 100%; }

        /* ── FILM STRIP ──────────────────────────────────────────  */
        .film-strip { position:relative; }
        .film-sprocket { display:flex; flex-direction:column; gap:6px; padding:6px 0; }
        .film-hole { width:8px; height:8px; border-radius:2px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.06); }

        /* ── TOOLTIP hover ───────────────────────────────────────  */
        .hover-lift { transition: transform .2s, box-shadow .2s; }
        .hover-lift:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,.5); }

        /* ── TOKEN COUNTER ───────────────────────────────────────  */
        .token-badge { transition: color .3s; }
        .token-pop { animation: tokenPop .5s ease; }
      `}</style>

      {/* ── PAYWALL MODAL ─────────────────────────────────────────── */}
      {showPaywall && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.88)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="glass" style={{padding:36,maxWidth:380,textAlign:"center",position:"relative",boxShadow:"0 20px 60px rgba(168,85,247,.35)"}}>
            <button onClick={()=>setShowPaywall(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <div style={{fontSize:52,marginBottom:12}}>⭐</div>
            <h2 style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:10}}>Лимит исчерпан</h2>
            <p style={{fontSize:14,color:"#94a3b8",marginBottom:28,lineHeight:1.6}}>Магия на сегодня закончилась.<br/>Возвращайтесь завтра или оформите PRO.</p>
            <button onClick={()=>setShowPaywall(false)} style={{width:"100%",background:"linear-gradient(135deg,#a855f7,#ec4899)",border:"none",padding:"16px",borderRadius:14,color:"#fff",fontWeight:900,cursor:"pointer",fontSize:15}}>ПОНЯТНО</button>
          </div>
        </div>
      )}

      {/* ── GUIDE MODAL ───────────────────────────────────────────── */}
      {showGuide && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.88)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowGuide(false)}>
          <div className="glass" style={{padding:28,maxWidth:440,position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowGuide(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            <h2 style={{fontSize:18,fontWeight:900,color:"#fff",marginBottom:16,borderBottom:"1px solid rgba(255,255,255,.08)",paddingBottom:12}}>📖 ПРАВИЛА ВИРУСНОСТИ</h2>
            <ul style={{color:"#cbd5e1",fontSize:14,lineHeight:1.7,paddingLeft:18}}>
              <li style={{marginBottom:10}}><b style={{color:"#a855f7"}}>Правило 3 секунд:</b> Картинка должна меняться каждые 3 секунды.</li>
              <li style={{marginBottom:10}}><b style={{color:"#a855f7"}}>Визуальный Якорь:</b> Макро-детали + 1 слово КАПСОМ = фокус в кадре.</li>
              <li style={{marginBottom:10}}><b style={{color:"#a855f7"}}>Экватор (15 сек):</b> Ломайте ритм фразой-крючком в середине.</li>
              <li><b style={{color:"#a855f7"}}>Хоррор Обложки:</b> Вызывайте дикое любопытство или лёгкое отвращение.</li>
            </ul>
            <button onClick={()=>setShowGuide(false)} style={{width:"100%",background:"#10b981",border:"none",padding:"12px",borderRadius:12,color:"#fff",fontWeight:900,cursor:"pointer",marginTop:20,fontSize:14}}>Я ГОТОВ СОЗДАВАТЬ ХИТЫ</button>
          </div>
        </div>
      )}

      <InfoModal isOpen={infoModal.isOpen} onClose={()=>setInfoModal({...infoModal,isOpen:false})} title={infoModal.title} content={infoModal.content}/>

      {/* ── HISTORY MODAL ─────────────────────────────────────────── */}
      {showHistory && (
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.85)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="glass" style={{width:"100%",maxWidth:500,maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h2 style={{fontSize:18,fontWeight:900,color:"#fff"}}>🗄 Архив Проектов</h2>
              <button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer"}}>×</button>
            </div>
            <div style={{padding:20,overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:10}}>
              {history.length === 0 && <div style={{color:"#6b7280",fontSize:14,textAlign:"center",paddingTop:20}}>Архив пуст</div>}
              {history.map(item=>(
                <div key={item.id} className="hover-lift" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#d8b4fe",marginBottom:4}}>{item.topic||"Без названия"}</div>
                    <div style={{fontSize:11,color:"#6b7280"}}>{item.time}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{const d=JSON.parse(item.text);setFrames(d.frames||[]);setRetention(d.retention||null);setThumb(d.thumb||null);setSeoVariants(d.seoVariants||[]);setMusic(d.music||"");setGeneratedChars(d.generatedChars||[]);setLocRef(d.locRef||"");setStyleRef(d.styleRef||"");setBRolls(d.bRolls||[]);setStep2Done(d.step2Done||false);if(d.ttsStudioData)setTtsStudioData(d.ttsStudioData);if(d.thumb){setCovTitle(d.thumb.title||"");setCovHook(d.thumb.hook||"");setCovCta(d.thumb.cta||"СМОТРЕТЬ");applyPreset("netflix");}rebuildRawText(d.frames||[],d.step2Done);setShowHistory(false);setView("result");}} style={{background:"#10b981",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>ОТКРЫТЬ</button>
                    <button onClick={()=>deleteFromHistory(item.id)} style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"8px 14px",color:"#ef4444",fontSize:11,fontWeight:800,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            {history.length>0&&<div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,.06)"}}><button onClick={clearHistory} style={{width:"100%",background:"rgba(239,68,68,.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,.25)",borderRadius:12,padding:12,fontWeight:800,cursor:"pointer",fontSize:13}}>ОЧИСТИТЬ АРХИВ</button></div>}
          </div>
        </div>
      )}

      {/* ══ NAV ══════════════════════════════════════════════════════ */}
      <nav className="nav-bar" style={{position:"sticky",top:0,zIndex:50,height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {view==="result"&&<button onClick={()=>{setView("form");setBusy(false);}} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",cursor:"pointer",fontSize:18,width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}} onMouseEnter={e=>e.target.style.background="rgba(255,255,255,.12)"} onMouseLeave={e=>e.target.style.background="rgba(255,255,255,.06)"}>‹</button>}
          <span onClick={handleGodMode} style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",cursor:"pointer",userSelect:"none"}}>
            NEURO<span style={{background:"linear-gradient(135deg,#a855f7,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CINE</span>
          </span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>setShowGuide(true)} style={{background:"none",border:"none",color:"#10b981",fontSize:11,fontWeight:800,cursor:"pointer",padding:"6px 10px",borderRadius:8,transition:"background .2s"}} onMouseEnter={e=>e.target.style.background="rgba(16,185,129,.1)"} onMouseLeave={e=>e.target.style.background="none"}>📖 ГАЙД</button>
          <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#94a3b8",fontSize:11,fontWeight:700,cursor:"pointer",padding:"6px 10px",borderRadius:8,transition:"background .2s"}} onMouseEnter={e=>e.target.style.background="rgba(255,255,255,.06)"} onMouseLeave={e=>e.target.style.background="none"}>🗄 АРХИВ</button>
          <div className="token-badge" style={{fontSize:12,fontWeight:900,color:tokens>0?"#34d399":"#ef4444",background:"rgba(255,255,255,.05)",border:`1px solid ${tokens>0?"rgba(52,211,153,.3)":"rgba(239,68,68,.3)"}`,padding:"6px 14px",borderRadius:10,letterSpacing:"0.5px"}}>{formatStars(tokens)}</div>
        </div>
      </nav>

      {/* ══ FORM VIEW ════════════════════════════════════════════════ */}
      {view==="form"&&(
        <div className="studio-grid">

          {/* ── LEFT COL: CONTENT ───────────────────────────────── */}
          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {frames.length>0&&(
              <button className="panel hover-lift" onClick={()=>setView("result")} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(5,150,105,.2))",border:"1px solid rgba(16,185,129,.4)",borderRadius:16,color:"#34d399",fontWeight:900,cursor:"pointer",fontSize:14,textTransform:"uppercase",letterSpacing:"1px"}}>
                ➔ ВЕРНУТЬСЯ К РЕЗУЛЬТАТУ
              </button>
            )}

            {/* ИДЕЯ */}
            <div className="glass panel" style={{padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#d8b4fe",textTransform:"uppercase"}}>🎯 Идея или тема хита</label>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <button onClick={()=>openInfo('clearAll')} className="icon-btn" style={{color:"#94a3b8",fontSize:15,lineHeight:1}}>ℹ️</button>
                  <button onClick={handleClearAll} style={{background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.35)",borderRadius:8,padding:"4px 11px",color:"#f87171",fontSize:10,fontWeight:900,cursor:"pointer",letterSpacing:"0.5px",transition:"all .2s",whiteSpace:"nowrap"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.25)";e.currentTarget.style.borderColor="rgba(239,68,68,.6)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,.12)";e.currentTarget.style.borderColor="rgba(239,68,68,.35)";}}>
                    🗑 ОЧИСТИТЬ
                  </button>
                </div>
              </div>
              <textarea rows={2} value={topic} onChange={e=>{const v=e.target.value;setTopic(v);if(!v.trim()){setScript("");setFrames([]);setHooksList([]);setStep2Done(false);setSeoVariants([]);setMusic("");setBRolls([]);setRawScript("");setRawImg("");setRawVid("");setRetention(null);setBusy(false);}}} placeholder="Например: Загадка перевала Дятлова..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(168,85,247,.2)",borderRadius:14,padding:16,fontSize:16,color:"#fff",resize:"none",marginBottom:12,fontFamily:"inherit"}}/>
              <input type="text" value={finalTwist} onChange={e=>setFinalTwist(e.target.value)} placeholder="💡 Скрытый твист в конце..." style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px dashed rgba(168,85,247,.3)",borderRadius:12,padding:12,fontSize:13,color:"#e9d5ff",fontFamily:"inherit"}}/>
            </div>

            {/* ЖАНР */}
            <div className="glass panel" style={{padding:"20px 22px"}}>
              <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#94a3b8",display:"block",marginBottom:14,textTransform:"uppercase"}}>🎭 Жанр рассказа</label>
              <div className="hide-scroll" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
                {Object.entries(GENRE_PRESETS).map(([g,p])=>(
                  <button key={g} onClick={()=>setGenre(g)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,background:genre===g?p.col+"26":"rgba(0,0,0,.4)",border:`1px solid ${genre===g?p.col:"rgba(255,255,255,.08)"}`,color:genre===g?"#fff":"rgba(255,255,255,.55)",padding:"8px 16px",borderRadius:100,fontWeight:800,fontSize:11,cursor:"pointer",transition:"all .2s",boxShadow:genre===g?`0 0 16px ${p.col}55`:"none"}}>
                    <span>{p.icon}</span><span>{g}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* СЦЕНАРИЙ */}
            <div className="glass panel" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#94a3b8",textTransform:"uppercase"}}>📝 Сценарий</label>
                <div style={{display:"flex",gap:8}}>
                  <CopyBtn text={script} small/>
                  {script.trim() && (
                    <button onClick={()=>{setScript("");setFrames([]);setStep2Done(false);setSeoVariants([]);setMusic("");setBRolls([]);setRawScript("");setRawImg("");setRawVid("");setRetention(null);}} style={{background:"rgba(239,68,68,.12)",color:"#f87171",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:900,cursor:"pointer"}} title="Очистить сценарий и всё что с ним связано">🗑 Очистить</button>
                  )}
                  <button onClick={handleGenerateHooks} disabled={busy||!topic.trim()} style={{background:"rgba(249,115,22,.15)",color:"#fbbf24",border:"1px solid rgba(249,115,22,.3)",borderRadius:8,padding:"4px 12px",fontSize:10,fontWeight:900,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(249,115,22,.3)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(249,115,22,.15)";}}>🔥 3 ХУКА</button>
                </div>
              </div>
              {/* Предупреждение: скрипт есть, но тема изменилась — пользователь мог забыть очистить */}
              {script.trim() && topic.trim() && !script.toLowerCase().includes(topic.toLowerCase().split(" ")[0]) && frames.length === 0 && (
                <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:16}}>⚠️</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#fbbf24"}}>Скрипт от предыдущей темы</div>
                    <div style={{fontSize:11,color:"#fef3c7"}}>Тема изменилась — скрипт может быть устаревшим. Нажмите «Написать» или очистите вручную.</div>
                  </div>
                  <button onClick={()=>setScript("")} style={{background:"rgba(245,158,11,.2)",border:"none",borderRadius:6,color:"#fbbf24",fontSize:10,fontWeight:800,padding:"4px 8px",cursor:"pointer"}}>Очистить</button>
                </div>
              )}
              {hooksList.length>0&&(
                <div style={{background:"rgba(0,0,0,.35)",border:"1px dashed rgba(249,115,22,.3)",borderRadius:12,padding:12,marginBottom:14}}>
                  {hooksList.map((h,i)=>(
                    <div key={i} onClick={()=>{setScript(h+" "+script);setHooksList([]);}} style={{background:"rgba(255,255,255,.04)",padding:"10px 12px",borderRadius:8,fontSize:13,color:"#fcd34d",cursor:"pointer",borderLeft:"3px solid #f59e0b",marginBottom:i<hooksList.length-1?8:0,transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}>{h}</div>
                  ))}
                </div>
              )}
              <textarea rows={5} value={script} onChange={e=>setScript(e.target.value)} placeholder="Вставьте текст или нажмите 'Написать'..." style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:16,fontSize:14,color:"#cbd5e1",marginBottom:14,resize:"none",lineHeight:1.6,fontFamily:"inherit"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <button onClick={handleDraftText} disabled={busy||!topic.trim()} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",padding:"12px 8px",borderRadius:12,fontSize:11,fontWeight:700,cursor:busy||!topic.trim()?"not-allowed":"pointer",transition:"all .2s",opacity:busy||!topic.trim()?0.5:1}} onMouseEnter={e=>{if(!busy&&topic.trim())e.currentTarget.style.background="rgba(255,255,255,.1)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";}}>✍️ Написать</button>
                <button onClick={handleBoostScript} disabled={busy||!script.trim()} style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.4)",color:"#fbbf24",padding:"12px 8px",borderRadius:12,fontSize:11,fontWeight:800,cursor:busy||!script.trim()?"not-allowed":"pointer",transition:"all .2s",opacity:busy||!script.trim()?0.4:1}} title="Переписывает слабый текст по вирусным законам, сохраняя все факты" onMouseEnter={e=>{if(!busy&&script.trim())e.currentTarget.style.background="rgba(245,158,11,.22)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(245,158,11,.1)";}}>⚡ Усилить</button>
                <button onClick={()=>setShowTTS(!showTTS)} style={{background:"rgba(14,165,233,.08)",border:`1px ${showTTS?"solid":"dashed"} rgba(14,165,233,.3)`,color:"#7dd3fc",padding:"12px 8px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>⚙️ Голос</button>
              </div>
              {showTTS&&(
                <div style={{marginTop:14,padding:18,background:"rgba(0,0,0,.4)",borderRadius:14,border:"1px solid rgba(14,165,233,.3)"}}>
                  <span style={{fontSize:10,color:"#7dd3fc",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px",display:"block",marginBottom:12}}>🎙 PRO-НАСТРОЙКИ ДИКТОРА</span>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div>
                      <label style={{fontSize:10,color:"#bae6fd",display:"block",marginBottom:6}}>Голос</label>
                      <select value={ttsVoice} onChange={e=>setTtsVoice(e.target.value)} style={{width:"100%",background:"#0f172a",color:"#fff",border:"1px solid rgba(14,165,233,.3)",padding:10,borderRadius:10,fontSize:12}}>
                        <option value="Male_Deep">Мужской: Глубокий бас (Детектив)</option>
                        <option value="Female_Mystic">Женский: Мистический шепот (Тайны)</option>
                        <option value="Doc_Narrator">Универсальный Документальный</option>
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#bae6fd",display:"block",marginBottom:6}}>Скорость (Speed: {ttsSpeed}x)</label>
                      <input type="range" min="0.8" max="1.5" step="0.05" value={ttsSpeed} onChange={e=>setTtsSpeed(e.target.value)} style={{width:"100%"}}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STUDIO SETUP */}
            <div className="glass panel" style={{padding:24,borderColor:"rgba(56,189,248,.25) !important"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#38bdf8",textTransform:"uppercase"}}>🎬 STUDIO SETUP</label>
                <div style={{display:"flex",background:"rgba(0,0,0,.5)",borderRadius:8,padding:3,gap:3}}>
                  {["AUTO","MANUAL"].map(m=>(
                    <button key={m} onClick={()=>setStudioMode(m)} style={{background:studioMode===m?"#38bdf8":"transparent",color:studioMode===m?"#000":"#6b7280",border:"none",borderRadius:6,padding:"4px 14px",fontSize:10,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>{m==="AUTO"?"АВТО":"РУЧНОЙ"}</button>
                  ))}
                </div>
              </div>
              {studioMode==="AUTO"
                ?<p style={{fontSize:12,color:"#64748b",margin:0}}>ИИ сам придумает идеальную локацию и стиль на основе сценария.</p>
                :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <p style={{fontSize:11,color:"#bae6fd",margin:0}}>Вставьте свои промпты — ИИ не будет их менять.</p>
                  <input type="text" value={studioLoc} onChange={e=>setStudioLoc(e.target.value)} placeholder="Location Ref (напр: Dark medieval dungeon)" style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(56,189,248,.25)",borderRadius:12,padding:12,fontSize:12,color:"#bae6fd",fontFamily:"inherit"}}/>
                  <input type="text" value={studioStyle} onChange={e=>setStudioStyle(e.target.value)} placeholder="Style Ref (напр: cinematic realism)" style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:12,fontSize:12,color:"#bae6fd",fontFamily:"inherit"}}/>
                </div>
              }
            </div>

            {/* PRE-REFERENCE PROMPTS */}
            <div className="glass panel" style={{padding:24,borderColor:"rgba(56,189,248,.25) !important"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#67e8f9",textTransform:"uppercase"}}>🧩 REFERENCE PROMPTS ДО ЗАГРУЗКИ</label>
                  <p style={{fontSize:11,color:"#64748b",margin:"8px 0 0",lineHeight:1.4}}>Сначала получи карты персонажей / локации / стиля, сгенерируй их, потом загрузи ниже.</p>
                </div>
                <button onClick={handleGenerateReferencePrompts} disabled={busy||tokens<COSTS.referencePrompts} style={{background:"rgba(14,165,233,.12)",border:"1px solid rgba(56,189,248,.35)",color:"#bae6fd",borderRadius:12,padding:"10px 12px",fontSize:11,fontWeight:900,cursor:"pointer"}}>✨ Получить ({formatStars(COSTS.referencePrompts)})</button>
              </div>
              {referencePrompts.length>0&&(
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                  <CopyBtn text={referencePrompts.map(p=>(p.id + " • " + p.name + "\n" + p.prompt)).join("\n\n")} label="📦 Все" small/>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:360,overflow:"auto"}}>
                {referencePrompts.map((p)=>(
                  <div key={p.id} style={{background:"rgba(0,0,0,.42)",border:"1px solid rgba(56,189,248,.18)",borderRadius:14,padding:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{fontSize:11,fontWeight:900,color:p.type==="character"?"#f472b6":p.type==="location"?"#38bdf8":"#facc15",fontFamily:"monospace"}}>{p.id} · {p.name}</div>
                      <CopyBtn text={p.prompt} small label="📋"/>
                    </div>
                    <div style={{fontSize:11,lineHeight:1.55,color:"#cbd5e1",fontFamily:"monospace"}}>{p.prompt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MULTI CHARACTER REFERENCES */}
            <div className="glass panel" style={{padding:24,borderColor:"rgba(244,114,182,.25) !important"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#f472b6",textTransform:"uppercase"}}>👥 MULTI CHARACTER REFERENCES</label>
                  <p style={{fontSize:11,color:"#64748b",margin:"8px 0 0",lineHeight:1.4}}>Загружай 2–6 фото персонажей. Каждый станет отдельным CHAR_X DNA-lock.</p>
                </div>
                <label style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.35)",color:"#fbcfe8",borderRadius:12,padding:"10px 14px",fontSize:12,fontWeight:900,cursor:"pointer"}}>➕ Фото<input type="file" accept="image/*" multiple hidden onChange={handleMultiCharUpload}/></label>
              </div>
              {multiCharRefs.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(92px,1fr))",gap:10}}>
                  {multiCharRefs.map((c,i)=>(
                    <div key={c.id} style={{position:"relative",background:"rgba(0,0,0,.45)",border:"1px solid rgba(244,114,182,.25)",borderRadius:14,padding:8}}>
                      <button onClick={()=>removeMultiCharRef(c.id)} style={{position:"absolute",top:4,right:4,border:"none",background:"rgba(0,0,0,.7)",color:"#f87171",borderRadius:8,fontWeight:900,cursor:"pointer"}}>×</button>
                      <img src={c.src} alt={c.id} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:10,marginBottom:6}}/>
                      <div style={{fontSize:10,fontWeight:900,color:"#f472b6",fontFamily:"monospace"}}>CHAR_{i+1}</div>
                      <div style={{fontSize:8,color:"#64748b",lineHeight:1.3,maxHeight:30,overflow:"hidden"}}>{c.dna||"DNA готов"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* REFERENCE STUDIO */}
            <div className="glass panel" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#f97316",textTransform:"uppercase"}}>📸 REFERENCE STUDIO</label>
                  {refAnalyzed && <span style={{fontSize:9,background:"rgba(34,197,94,.2)",color:"#4ade80",border:"1px solid rgba(34,197,94,.3)",padding:"2px 8px",borderRadius:10,fontWeight:900}}>✓ ГОТОВО</span>}
                </div>
                {(multiCharRefs.length>0||refLoc||refStyle)&&(
                  <button onClick={()=>{setMultiCharRefs([]);setRefChar(null);setRefLoc(null);setRefStyle(null);setRefCharDNA("");setRefLocText("");setRefStyleText("");setRefAnalyzed(false);}} style={{background:"rgba(239,68,68,.1)",color:"#f87171",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:900,cursor:"pointer"}}>✕ Очистить</button>
                )}
              </div>

              <p style={{fontSize:11,color:"#64748b",marginBottom:16,lineHeight:1.6}}>
                Персонажи загружаются в Multi Character. Здесь — окружение: локация и визуальный стиль.
              </p>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {key:"loc",   label:"🌍 Локация",   stateVal:refLoc,   setFn:setRefLoc,   dna:refLocText,  color:"#38bdf8"},
                  {key:"style", label:"🎨 Стиль",     stateVal:refStyle, setFn:setRefStyle, dna:refStyleText,color:"#a78bfa"},
                ].map(({key,label,stateVal,setFn,dna,color})=>(
                  <div key={key} style={{display:"flex",flexDirection:"column",gap:6}}>
                    <label style={{fontSize:9,color,fontWeight:900,textTransform:"uppercase",letterSpacing:"1px"}}>{label}</label>
                    <div
                      style={{position:"relative",aspectRatio:"1",background:"rgba(0,0,0,.5)",border:`2px dashed ${stateVal?color+"44":"rgba(255,255,255,.1)"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"border-color .2s"}}
                      onClick={()=>document.getElementById(`ref-upload-${key}`).click()}
                    >
                      {stateVal
                        ? <img src={stateVal} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={label}/>
                        : <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:4}}>
                            <span style={{fontSize:22,opacity:.4}}>+</span>
                            <span style={{fontSize:8,color:"#475569",textAlign:"center",lineHeight:1.3}}>Нажми<br/>загрузить</span>
                          </div>
                      }
                      {dna && <div style={{position:"absolute",bottom:4,right:4,width:18,height:18,background:"#22c55e",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff",boxShadow:"0 2px 6px rgba(0,0,0,.5)"}}>✓</div>}
                    </div>
                    <input id={`ref-upload-${key}`} type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                      const f=e.target.files[0]; if(!f) return;
                      const b64=await resizeImageToBase64(f,1024); setFn(b64); setRefAnalyzed(false);
                    }}/>
                    {dna && <div style={{fontSize:8,color:"#6b7280",lineHeight:1.4,maxHeight:36,overflow:"hidden",fontFamily:"monospace",wordBreak:"break-all"}}>{dna.slice(0,65)}…</div>}
                  </div>
                ))}
              </div>

              {(multiCharRefs.length>0||refLoc||refStyle)&&(
                <button onClick={handleAnalyzeRefs} disabled={busy||refAnalyzed} style={{width:"100%",padding:"12px",background:refAnalyzed?"rgba(34,197,94,.12)":"linear-gradient(135deg,rgba(249,115,22,.25),rgba(168,85,247,.25))",border:`1px solid ${refAnalyzed?"rgba(34,197,94,.4)":"rgba(249,115,22,.5)"}`,borderRadius:12,color:refAnalyzed?"#4ade80":"#fff",fontWeight:900,cursor:busy||refAnalyzed?"default":"pointer",fontSize:13,letterSpacing:"0.5px",transition:"all .2s"}}>
                  {refAnalyzed?"✅ Референсы готовы — запускайте Шаг 1":busy?"⏳ Анализируем...":"🔍 АНАЛИЗИРОВАТЬ РЕФЕРЕНСЫ"}
                </button>
              )}
            </div>

            {/* КУЗНИЦА ПЕРСОНАЖЕЙ */}
            <div className="glass panel" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#f472b6",textTransform:"uppercase"}}>⚙️ ADVANCED CHARACTER EDITOR</label>
                  <button onClick={()=>openInfo('forge')} className="icon-btn" style={{color:"#f472b6",fontSize:13}}>ℹ️</button>
                </div>
                <button onClick={addChar} style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.35)",borderRadius:8,color:"#fbcfe8",padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>➕ ДОБАВИТЬ</button>
              </div>
              {chars.length===0&&<div style={{fontSize:12,color:"#475569",fontStyle:"italic",textAlign:"center",marginBottom:14}}>Ручной режим: можно уточнить персонажей, если сценарий сам не даёт достаточно деталей</div>}
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                {chars.map((c)=>(
                  <div key={c.id} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.05)",borderRadius:12,padding:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <input type="text" value={c.name} onChange={e=>updateChar(c.id,'name',e.target.value)} style={{background:"none",border:"none",color:"#fbcfe8",fontWeight:800,fontSize:13,width:"100%",fontFamily:"inherit"}} placeholder="Имя (напр. Палач)"/>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                        <label style={{background:"rgba(56,189,248,.12)",border:"1px solid rgba(56,189,248,.3)",color:"#bae6fd",fontSize:10,padding:"4px 8px",borderRadius:6,cursor:"pointer",fontWeight:800}}>
                          📸<input type="file" accept="image/*" hidden onChange={e=>handleCharImageUpload(e,c.id)}/>
                        </label>
                        <button onClick={()=>removeChar(c.id)} style={{background:"none",border:"none",color:"#ef4444",fontSize:16,cursor:"pointer",padding:"2px 4px"}}>×</button>
                      </div>
                    </div>
                    <textarea rows={2} value={c.desc} onChange={e=>updateChar(c.id,'desc',e.target.value)} placeholder="Внешность своими словами или загрузите ФОТО." style={{width:"100%",background:"rgba(255,255,255,.04)",border:"none",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#cbd5e1",resize:"none",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
              <button onClick={handleGenerateCasting} disabled={busy||(!topic.trim()&&!script.trim()&&chars.length===0)} style={{width:"100%",background:"linear-gradient(135deg,rgba(236,72,153,.12),rgba(168,85,247,.12))",border:"1px dashed rgba(236,72,153,.4)",borderRadius:12,padding:12,color:"#fbcfe8",fontSize:11,fontWeight:800,cursor:busy?"not-allowed":"pointer",transition:"all .2s"}}>🧬 УТОЧНИТЬ КАСТИНГ (ДО РАСКАДРОВКИ)</button>
              {generatedChars.length>0&&<div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#34d399",fontWeight:800}}>✅ Кастинг готов ({generatedChars.length} персонажей)</div>}
            </div>
          </div>

          {/* ── RIGHT COL: SETTINGS + CTA ───────────────────────── */}
          <div className="studio-right-col">

            {/* ТЕХНИЧЕСКИЕ НАСТРОЙКИ */}
            <div className="glass" style={{padding:24}}>
              <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",textTransform:"uppercase",padding:0,letterSpacing:"1px"}}>
                <span>⚙️ Технические настройки</span>
                <span style={{color:"#a855f7",fontSize:10}}>{settingsOpen?"▲":"▼"}</span>
              </button>

              {settingsOpen&&(
                <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:18}}>

                  {/* ПАЙПЛАЙН */}
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <label style={{fontSize:10,color:"#38bdf8",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px"}}>🚀 ПАЙПЛАЙН</label>
                      <button onClick={()=>openInfo('pipeline')} className="icon-btn" style={{color:"#38bdf8",fontSize:12}}>ℹ️</button>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {[["T2V","Прямой"],["I2V","Студийный"]].map(([id,label])=>(
                        <button key={id} onClick={()=>setPipelineMode(id)} style={{flex:1,background:pipelineMode===id?"rgba(56,189,248,.18)":"rgba(0,0,0,.4)",border:`1px solid ${pipelineMode===id?"#38bdf8":"rgba(255,255,255,.06)"}`,borderRadius:12,padding:"11px 10px",fontSize:11,fontWeight:pipelineMode===id?800:500,color:pipelineMode===id?"#bae6fd":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}>{id} ({label})</button>
                      ))}
                    </div>
                  </div>

                  {/* ДВИЖОК */}
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <label style={{fontSize:10,color:"#94a3b8",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px"}}>🎨 ВИЗУАЛЬНЫЙ ДВИЖОК</label>
                      <button onClick={()=>openInfo('engine')} className="icon-btn" style={{color:"#a855f7",fontSize:12}}>ℹ️</button>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {Object.entries(VISUAL_ENGINES).map(([eId,e])=>(
                        <button key={eId} onClick={()=>setEngine(eId)} style={{flex:"1 1 45%",background:engine===eId?"rgba(168,85,247,.15)":"rgba(0,0,0,.4)",border:`1px solid ${engine===eId?"#a855f7":"rgba(255,255,255,.06)"}`,borderRadius:12,padding:"10px 8px",fontSize:11,color:engine===eId?"#d8b4fe":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s",fontWeight:engine===eId?700:400}}>{e.label}</button>
                      ))}
                    </div>
                    <input type="text" value={customStyle} onChange={e=>setCustomStyle(e.target.value)} placeholder="Особый стиль (VHS, Киберпанк...)" style={{width:"100%",background:"rgba(0,0,0,.5)",border:"1px solid rgba(255,255,255,.08)",borderRadius:11,padding:"10px 12px",fontSize:12,color:"#cbd5e1",marginTop:10,fontFamily:"inherit"}}/>
                  </div>

                  {/* ЯЗЫК + ФОРМАТ */}
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <label style={{fontSize:10,color:"#94a3b8",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px"}}>🌐 ЯЗЫК И ФОРМАТ</label>
                      <button onClick={()=>openInfo('format')} className="icon-btn" style={{color:"#a855f7",fontSize:12}}>ℹ️</button>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      {["RU","EN"].map(l=>(
                        <button key={l} onClick={()=>setLang(l)} style={{flex:1,background:lang===l?"rgba(245,158,11,.15)":"rgba(0,0,0,.4)",border:`1px solid ${lang===l?"#fbbf24":"rgba(255,255,255,.06)"}`,borderRadius:12,padding:"10px",fontSize:12,fontWeight:lang===l?800:400,color:lang===l?"#fcd34d":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}>{l==="RU"?"Русский":"English"}</button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {FORMATS.map(f=>(
                        <button key={f.id} onClick={()=>setVidFormat(f.id)} style={{flex:1,background:vidFormat===f.id?"rgba(14,165,233,.15)":"rgba(0,0,0,.4)",border:`1px solid ${vidFormat===f.id?"#0ea5e9":"rgba(255,255,255,.06)"}`,borderRadius:12,padding:"10px",fontSize:12,fontWeight:vidFormat===f.id?800:400,color:vidFormat===f.id?"#bae6fd":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}>{f.id}</button>
                      ))}
                    </div>
                  </div>

                  {/* 🔒 SEED LOCK */}
                  <div>
                    <label style={{fontSize:10,color:"#f59e0b",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px",display:"block",marginBottom:10}}>🔒 SEED LOCK (консистентность)</label>
                    <div style={{background:"rgba(245,158,11,.07)",border:`1px solid ${seedLocked?"#f59e0b":"rgba(245,158,11,.2)"}`,borderRadius:14,padding:14}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                        <div style={{flex:1,fontFamily:"monospace",fontSize:18,fontWeight:900,color:seedLocked?"#fbbf24":"#6b7280",background:"rgba(0,0,0,.4)",padding:"8px 14px",borderRadius:10,letterSpacing:"2px"}}>
                          {seedValue}
                        </div>
                        <button onClick={genNewSeed} disabled={seedLocked} title="Генерировать новый seed" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 12px",color:seedLocked?"#374151":"#94a3b8",fontSize:16,cursor:seedLocked?"not-allowed":"pointer",transition:"all .2s"}}>🎲</button>
                      </div>
                      <button onClick={()=>setSeedLocked(p=>!p)} style={{width:"100%",background:seedLocked?"rgba(245,158,11,.25)":"rgba(0,0,0,.4)",border:`1px solid ${seedLocked?"#f59e0b":"rgba(255,255,255,.1)"}`,borderRadius:10,padding:"9px",color:seedLocked?"#fbbf24":"#6b7280",fontSize:11,fontWeight:900,cursor:"pointer",transition:"all .2s",letterSpacing:"0.5px"}}>
                        {seedLocked?"🔒 SEED ЗАФИКСИРОВАН — НАЖМИ ЧТОБЫ СНЯТЬ":"🔓 ЗАФИКСИРОВАТЬ SEED"}
                      </button>
                      <div style={{fontSize:10,color:"#78716c",marginTop:8,lineHeight:1.5,textAlign:"center"}}>
                        {seedLocked?"Один и тот же seed → одно лицо во всех кадрах":"Без seed — лицо меняется каждый кадр"}
                      </div>
                    </div>
                  </div>

                  {/* ДЛИТЕЛЬНОСТЬ */}
                  <div>
                    <label style={{fontSize:10,color:"#94a3b8",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px",display:"block",marginBottom:10}}>⏳ ДЛИТЕЛЬНОСТЬ</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {DURATIONS.map(d=>(
                        <button key={d} onClick={()=>setDur(d)} style={{background:dur===d?"rgba(249,115,22,.15)":"rgba(0,0,0,.4)",border:`1px solid ${dur===d?"#f97316":"rgba(255,255,255,.06)"}`,borderRadius:20,padding:"9px 14px",fontSize:11,fontWeight:dur===d?800:400,color:dur===d?"#fdba74":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}>{d}</button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* CTA — DESKTOP visible */}
            <div className="desktop-only">
              <button className={`gbtn${(topic.trim()||script.trim())&&!busy?" pulsing":""}`} onClick={handleStep1} disabled={(!script.trim()&&!topic.trim())||busy}>
                {busy?"⏳ СИСТЕМА В РАБОТЕ...":"🚀 ШАГ 1: РАСКАДРОВКА  (⭐ 1)"}
              </button>
            </div>

            {/* CREDITS MINI */}
            <div className="desktop-only" style={{background:"rgba(168,85,247,.06)",border:"1px solid rgba(168,85,247,.15)",borderRadius:14,padding:16,textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:8}}>⭐</div>
              <div style={{fontSize:22,fontWeight:900,color:tokens>0?"#a855f7":"#ef4444"}}>{formatStars(tokens)}</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{tokens>0?"доступно сегодня":"Лимит исчерпан"}</div>
            </div>

          </div>
        </div>
      )}

      {/* ── MOBILE STICKY CTA ─────────────────────────────────────── */}
      {view==="form"&&(
        <div className="mobile-only" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"14px 16px 24px",background:"linear-gradient(to top,rgba(5,5,10,1) 60%,transparent)",zIndex:100}}>
          <button className={`gbtn${(topic.trim()||script.trim())&&!busy?" pulsing":""}`} onClick={handleStep1} disabled={(!script.trim()&&!topic.trim())||busy}>
            {busy?"⏳ СИСТЕМА В РАБОТЕ...":"🚀 ШАГ 1: СОЗДАТЬ РАСКАДРОВКУ (⭐ 1)"}
          </button>
        </div>
      )}

      {/* ══ LOADING SCREEN ═══════════════════════════════════════════ */}
      {view==="loading"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"75vh",padding:"40px 20px",textAlign:"center"}}>

          {/* CLAPPERBOARD */}
          <div style={{marginBottom:36,position:"relative",width:140,height:120}}>
            {/* Stick top */}
            <div style={{position:"absolute",top:-22,left:0,right:0,height:32,background:"#1a1a2e",borderRadius:"6px 6px 0 0",border:"2px solid rgba(168,85,247,.3)",overflow:"hidden",animation:"clapFlap 1.4s ease-in-out infinite",transformOrigin:"left top"}}>
              {Array.from({length:8}).map((_,i)=>(
                <div key={i} style={{position:"absolute",left:i*18-4,top:0,bottom:0,width:14,background:i%2===0?"rgba(168,85,247,.7)":"rgba(236,72,153,.5)",transform:"skewX(-10deg)"}}/>
              ))}
            </div>
            {/* Body */}
            <div style={{position:"absolute",top:10,left:0,right:0,bottom:0,background:"rgba(12,12,22,.9)",border:"2px solid rgba(168,85,247,.3)",borderRadius:"0 0 10px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 12px"}}>
              <div style={{fontSize:11,fontWeight:900,color:"#a855f7",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>NeuroCine</div>
              <div style={{fontSize:10,color:"#475569",fontFamily:"monospace"}}>PRODUCTION</div>
              <div style={{marginTop:8,display:"flex",gap:4}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#a855f7",animation:`spin .8s ease-in-out infinite`,animationDelay:`${i*0.2}s`,opacity:0.8}}/>
                ))}
              </div>
            </div>
          </div>

          <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"0.5px",marginBottom:10,lineHeight:1.5,maxWidth:320}}>{loadingMsg}</div>
          <div style={{fontSize:12,color:"#475569",marginBottom:32,fontFamily:"monospace"}}>
            {loadingMsg.includes("просыпается") ? "~ 30–60 сек" :
             loadingMsg.includes("сервер") || loadingMsg.includes("соединени") ? "~ 10–20 сек" :
             loadingMsg.includes("Промпты") ? "~ 40–90 сек на батч" :
             loadingMsg.includes("Раскадровка") || loadingMsg.includes("раскадров") ? "~ 30–70 сек на батч" :
             loadingMsg.includes("SEO") ? "~ 15–30 сек" :
             loadingMsg.includes("TTS") ? "~ 20–40 сек" :
             "~ 30–90 сек"}
          </div>

          <div style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:14,padding:"14px 20px",maxWidth:300,marginBottom:28,transition:"all .4s"}}>
            <div style={{fontSize:11,color:"#fcd34d",fontWeight:700,marginBottom:6}}>
              {LOADING_TIPS[tipIndex]?.icon} Совет пока ждёшь
            </div>
            <div style={{fontSize:11,color:"#fef3c7",lineHeight:1.6}}>{LOADING_TIPS[tipIndex]?.text}</div>
          </div>

          <button onClick={()=>{setBusy(false);setView("form");}} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"10px 28px",color:"#6b7280",fontSize:12,cursor:"pointer",fontWeight:700,transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.09)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}>✕ Отмена</button>
        </div>
      )}

      {/* ══ RESULT VIEW ══════════════════════════════════════════════ */}
      {view==="result"&&(
        <div style={{maxWidth:640,margin:"0 auto",padding:"20px 16px 120px"}}>

          <button onClick={()=>setView("form")} style={{marginBottom:20,color:"#a855f7",background:"none",border:"none",fontWeight:800,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>← НАЗАД В НАСТРОЙКИ</button>

          {/* RETENTION */}
          {retention&&(
            <div style={{background:"linear-gradient(135deg,rgba(16,185,129,.1),rgba(5,150,105,.08))",border:"1px solid rgba(16,185,129,.3)",borderRadius:18,padding:18,marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:36,fontWeight:900,color:"#34d399",fontFamily:"monospace",minWidth:70,textAlign:"center"}}>{retention.score}<span style={{fontSize:16}}>%</span></div>
              <div>
                <div style={{fontSize:10,fontWeight:900,color:"#34d399",textTransform:"uppercase",letterSpacing:"2px",marginBottom:6}}>📊 ОЦЕНКА УДЕРЖАНИЯ</div>
                <div style={{fontSize:12,color:"#a7f3d0",lineHeight:1.5}}>{retention.feedback}</div>
              </div>
            </div>
          )}

          {/* THUMBNAIL PROMPTS */}
          {step2Done&&thumb?.prompt_EN&&(
            <div className="hover-lift" style={{background:"rgba(220,38,38,.08)",border:"2px dashed rgba(239,68,68,.5)",borderRadius:20,padding:20,marginBottom:20,boxShadow:"0 0 24px rgba(220,38,38,.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10}}>
                <span style={{fontSize:12,fontWeight:900,color:"#fca5a5",textTransform:"uppercase",letterSpacing:"1px"}}>🖼 2 PRO-ПРЕВЬЮ НА ВЫБОР</span>
                {seedLocked&&<div style={{fontSize:9,color:"#f59e0b",background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",padding:"2px 8px",borderRadius:10,fontWeight:900,whiteSpace:"nowrap"}}>🔒 SEED {seedValue}</div>}
              </div>
              {(thumb.preview_variants?.length ? thumb.preview_variants : [{id:"default",title:"PRO-ПРОМПТ",prompt_EN:thumb.prompt_EN}]).map((variant, idx)=>(
                <div key={variant.id || idx} style={{background:"rgba(0,0,0,.45)",border:"1px solid rgba(248,113,113,.22)",borderRadius:14,padding:14,marginBottom:idx===0?12:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:900,color:idx===0?"#fbbf24":"#93c5fd",textTransform:"uppercase",letterSpacing:"1px"}}>{idx===0?"⚡ ":"🕵️ "}{variant.title || (idx===0?"ШОК / СОБЫТИЕ":"ГИБРИД / ДОКАЗАТЕЛЬСТВО")}</div>
                    <CopyBtn text={variant.prompt_EN || variant.prompt || thumb.prompt_EN} small/>
                  </div>
                  <div style={{fontSize:12,fontFamily:"monospace",color:"#fecaca",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{variant.prompt_EN || variant.prompt || thumb.prompt_EN}</div>
                </div>
              ))}
              <div style={{marginTop:10,fontSize:11,color:"#f87171",textAlign:"center"}}>☝️ Выбирайте: 1-й — кликабельный шок, 2-й — персонаж + доказательство</div>
            </div>
          )}

          {/* COVER STUDIO */}
          <div className="glass" style={{marginBottom:20,overflow:"hidden"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:900,color:"#d8b4fe",letterSpacing:"1px",textTransform:"uppercase"}}>🎨 Студия Обложки</div>
              <button onClick={loadCustomPreset} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#fbbf24",fontSize:10,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontWeight:800}}>⭐ МОЙ СТИЛЬ</button>
            </div>
            <div style={{padding:22}}>
              <div className="hide-scroll" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:14,marginBottom:10}}>
                {COVER_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>applyPreset(p.id)} style={{flexShrink:0,padding:"7px 14px",borderRadius:10,border:`1px solid ${activePreset===p.id?"#a855f7":"rgba(255,255,255,.08)"}`,background:activePreset===p.id?"rgba(168,85,247,.2)":"rgba(0,0,0,.35)",color:activePreset===p.id?"#fff":"rgba(255,255,255,.45)",fontSize:11,fontWeight:800,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                <div id="thumbnail-export" style={{width:300,aspectRatio:currFormat.ratio,position:"relative",background:bgImage?`url(${bgImage}) center/cover no-repeat`:"#0f0f1a",overflow:"hidden",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>
                  <div style={{position:"absolute",inset:0,background:`linear-gradient(to top, rgba(0,0,0,${covDark/100}) 0%, rgba(0,0,0,${covDark/200}) 50%, transparent 100%)`,zIndex:1}}/>
                  {logoImage&&<img src={logoImage} style={{position:"absolute",left:`${logoX}%`,top:`${logoY}%`,transform:"translate(-50%,-50%)",width:`${logoSize}%`,zIndex:3,pointerEvents:"none"}} alt="Logo"/>}
                  <div style={{...activeStyle.container,position:"absolute",left:`${covX}%`,top:`${covY}%`,transform:activeStyle.container.customTransform||"translate(-50%,-50%)",zIndex:2}}>
                    <div style={{...activeStyle.hook,fontSize:Number(sizeHook)}}>{covHook}</div>
                    <div style={{...activeStyle.title,fontFamily:covFont,color:covColor,fontSize:Number(sizeTitle)}}>{covTitle}</div>
                    <div style={{...activeStyle.cta,fontSize:Number(sizeCta)}}>{covCta}</div>
                  </div>
                  {showSafeZone&&vidFormat==="9:16"&&(
                    <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10}}>
                      <div style={{position:"absolute",right:0,bottom:"20%",width:"18%",height:"40%",borderLeft:"2px dashed rgba(239,68,68,.6)",borderTop:"2px dashed rgba(239,68,68,.6)",background:"rgba(239,68,68,.08)"}}/>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"20%",borderTop:"2px dashed rgba(239,68,68,.6)",background:"rgba(239,68,68,.08)"}}/>
                    </div>
                  )}
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#6b7280",cursor:"pointer"}}>
                  <input type="checkbox" checked={showSafeZone} onChange={e=>setShowSafeZone(e.target.checked)}/> Показать Сейф-зону
                </label>
              </div>

              <div style={{background:"rgba(0,0,0,.3)",borderRadius:14,padding:18,marginBottom:18}}>
                <label style={{fontSize:10,color:"#d8b4fe",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px",marginBottom:14,display:"block"}}>📝 ТЕКСТ И РАЗМЕРЫ</label>
                <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:18}}>
                  {[{val:covHook,set:setCovHook,ph:"Верхний текст (Hook)",sz:sizeHook,setSz:setSizeHook,min:8,max:40},{val:covTitle,set:setCovTitle,ph:"Главный заголовок",sz:sizeTitle,setSz:setSizeTitle,min:16,max:80,highlight:true},{val:covCta,set:setCovCta,ph:"Нижний текст (CTA)",sz:sizeCta,setSz:setSizeCta,min:8,max:30}].map((f,i)=>(
                    <div key={i}>
                      <input type="text" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${f.highlight?"rgba(168,85,247,.3)":"rgba(255,255,255,.08)"}`,padding:"11px 12px",borderRadius:10,color:"#fff",fontSize:13,fontWeight:f.highlight?800:400,marginBottom:6,fontFamily:"inherit"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:10,color:"#475569",width:50,flexShrink:0}}>Размер</span><input type="range" min={f.min} max={f.max} value={f.sz} onChange={e=>f.setSz(e.target.value)} style={{flex:1}}/></div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
                  {[{label:"Позиция X",val:covX,set:setCovX},{label:"Позиция Y",val:covY,set:setCovY}].map(({label,val,set})=>(
                    <div key={label}><label style={{fontSize:10,color:"#475569",fontWeight:800,textTransform:"uppercase",marginBottom:6,display:"block"}}>{label}</label><input type="range" min="0" max="100" value={val} onChange={e=>set(e.target.value)} style={{width:"100%"}}/></div>
                  ))}
                </div>
                <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:12,padding:14,marginBottom:14}}>
                  <label style={{fontSize:10,color:"#475569",fontWeight:800,textTransform:"uppercase",marginBottom:10,display:"block"}}>Атмосфера текста</label>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:10}} className="hide-scroll">
                    {FONTS.map(f=>(<button key={f.id} onClick={()=>setCovFont(f.id)} style={{background:covFont===f.id?"rgba(168,85,247,.2)":"rgba(0,0,0,.5)",border:`1px solid ${covFont===f.id?"#a855f7":"rgba(255,255,255,.08)"}`,color:"#fff",padding:"6px 12px",borderRadius:8,fontSize:11,fontFamily:f.id,whiteSpace:"nowrap",cursor:"pointer",transition:"all .2s"}}>{f.label}</button>))}
                  </div>
                  <div className="hide-scroll" style={{display:"flex",gap:10,alignItems:"center",overflowX:"auto",paddingBottom:4}}>
                    {COLORS.map(c=>(<div key={c} onClick={()=>setCovColor(c)} style={{flexShrink:0,width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:covColor===c?"3px solid #fff":"1px solid rgba(255,255,255,.2)",boxShadow:covColor===c?`0 0 12px ${c}`:"none",transition:"all .2s"}}/>))}
                    <input type="color" value={covColor} onChange={e=>setCovColor(e.target.value)} style={{flexShrink:0,width:28,height:28,padding:0,border:"none",borderRadius:"50%",cursor:"pointer",background:"none"}} title="Свой цвет"/>
                  </div>
                </div>
                <label style={{fontSize:10,color:"#475569",fontWeight:800,textTransform:"uppercase",marginBottom:6,display:"block"}}>Затемнение картинки</label>
                <input type="range" min="0" max="100" value={covDark} onChange={e=>setCovDark(e.target.value)} style={{width:"100%",marginBottom:16}}/>
                <button onClick={saveCustomPreset} style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#94a3b8",padding:12,borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>⭐ Сохранить как МОЙ СТИЛЬ</button>
              </div>

              {logoImage&&(
                <div style={{background:"rgba(56,189,248,.08)",borderRadius:14,padding:18,marginBottom:18,border:"1px dashed rgba(56,189,248,.25)"}}>
                  <label style={{fontSize:10,color:"#38bdf8",fontWeight:900,textTransform:"uppercase",marginBottom:12,display:"block"}}>🛡 НАСТРОЙКА ЛОГОТИПА</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:10}}>
                    {[{label:"Позиция X",val:logoX,set:setLogoX},{label:"Позиция Y",val:logoY,set:setLogoY}].map(({label,val,set})=>(
                      <div key={label}><label style={{fontSize:10,color:"#bae6fd",display:"block",marginBottom:4}}>{label}</label><input type="range" min="0" max="100" value={val} onChange={e=>set(e.target.value)} style={{width:"100%"}}/></div>
                    ))}
                  </div>
                  <label style={{fontSize:10,color:"#bae6fd",display:"block",marginBottom:4}}>Размер логотипа</label>
                  <input type="range" min="5" max="100" value={logoSize} onChange={e=>setLogoSize(e.target.value)} style={{width:"100%"}}/>
                </div>
              )}

              <div style={{display:"flex",gap:10}}>
                <label style={{flex:1,height:46,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,color:"#94a3b8",cursor:"pointer",fontSize:12,fontWeight:800,textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.08)"}>📸 ФОН<input type="file" hidden onChange={handleImageUpload}/></label>
                <label style={{flex:1,height:46,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(56,189,248,.08)",border:"1px solid rgba(56,189,248,.25)",borderRadius:13,color:"#38bdf8",cursor:"pointer",fontSize:12,fontWeight:800,textTransform:"uppercase",transition:"all .2s"}}>🛡 ЛОГО<input type="file" accept="image/png" hidden onChange={handleLogoUpload}/></label>
                <button onClick={downloadThumbnail} disabled={downloading} style={{flex:2,height:46,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:13,border:"none",fontWeight:900,color:"#fff",cursor:downloading?"not-allowed":"pointer",textTransform:"uppercase",fontSize:12,boxShadow:"0 4px 16px rgba(16,185,129,.35)",transition:"all .2s"}}>{downloading?"Рендер...":"💾 СКАЧАТЬ"}</button>
              </div>
            </div>
          </div>

          {/* STEP 2 BTN */}
          {!step2Done&&(
            <div style={{background:"rgba(236,72,153,.07)",border:"1px dashed rgba(236,72,153,.35)",borderRadius:20,padding:20,textAlign:"center",marginBottom:20}}>
              {step2Partial&&(
                <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(234,179,8,.07)",border:"1px solid rgba(234,179,8,.3)",borderRadius:12}}>
                  <div style={{fontSize:12,color:"#fcd34d",fontWeight:700,marginBottom:8}}>
                    ⚠️ Прервано на батче {step2Partial.fromBatch+1}/{step2Partial.totalBatches} — кадры 1–{step2Partial.fromBatch*5} уже готовы
                  </div>
                  <button onClick={()=>handleStep2(step2Partial)} disabled={busy} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#d97706,#b45309)",borderRadius:12,color:"#fff",fontWeight:900,border:"none",cursor:"pointer",fontSize:14,letterSpacing:"0.5px",marginBottom:6}}>
                    ▶ ПРОДОЛЖИТЬ С КАДРА {step2Partial.fromBatch*5+1} (без повторной оплаты)
                  </button>
                </div>
              )}
              <button onClick={()=>handleStep2(null)} disabled={busy||tokens < COSTS.step2} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#db2777,#9333ea)",borderRadius:14,color:"#fff",fontWeight:900,border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(219,39,119,.4)",fontSize:15,letterSpacing:"0.5px",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>🪄 ШАГ 2: СГЕНЕРИРОВАТЬ PRO-ПРОМПТЫ СЦЕН (⭐ 1)</button>
            </div>
          )}

          {/* PIPELINE LAUNCH BTN — появляется после Шага 2 */}
          {step2Done && (
            <div style={{background:"rgba(14,165,233,.07)",border:"1px dashed rgba(14,165,233,.4)",borderRadius:20,padding:20,textAlign:"center",marginBottom:20}}>
              {pipelineRunning && pipelineProgress && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:"#38bdf8",fontWeight:900,marginBottom:8}}>{pipelineProgress.message}</div>
                  <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,height:8,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,#0ea5e9,#a855f7)",borderRadius:10,width:`${Math.round(((pipelineProgress.index||0)/(pipelineProgress.total||1))*100)}%`,transition:"width .4s"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#475569",marginTop:6,fontFamily:"monospace"}}>
                    {pipelineProgress.stage?.toUpperCase()} · {pipelineProgress.index}/{pipelineProgress.total}
                  </div>
                </div>
              )}
              <button
                onClick={handleRunPipeline}
                disabled={pipelineRunning}
                style={{width:"100%",padding:"16px",background:pipelineRunning?"rgba(14,165,233,.2)":"linear-gradient(135deg,#0ea5e9,#7c3aed)",borderRadius:14,color:"#fff",fontWeight:900,border:"none",cursor:pipelineRunning?"not-allowed":"pointer",boxShadow:"0 6px 24px rgba(14,165,233,.35)",fontSize:15,letterSpacing:"0.5px",transition:"all .2s"}}>
                {pipelineRunning ? "⏳ ПАЙПЛАЙН РАБОТАЕТ..." : "🎬 ЗАПУСТИТЬ ПРОДАКШН ПАЙПЛАЙН"}
              </button>
              <div style={{marginTop:8,fontSize:11,color:"#475569"}}>
                script → identity lock → image anchors → video clips → timeline package
              </div>
            </div>
          )}

          {/* TABS */}
          <div className="hide-scroll" style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:2}}>
            {[["storyboard","🎞 Раскадровка"],["raw","📄 Скрипт и Промпты"],["seo","🚀 Музыка и SEO"],["tts","🎙 TTS Studio"],["pipeline","🎬 Pipeline"]].map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,background:tab===t?"rgba(168,85,247,.18)":"rgba(0,0,0,.3)",border:`1px solid ${tab===t?"rgba(168,85,247,.5)":"rgba(255,255,255,.07)"}`,color:tab===t?"#d8b4fe":"#6b7280",fontWeight:tab===t?900:600,fontSize:12,textTransform:"uppercase",cursor:"pointer",borderRadius:10,padding:"9px 16px",transition:"all .2s",letterSpacing:"0.5px"}}>
                {label}
              </button>
            ))}
          </div>

          {/* ── STORYBOARD TAB ─────────────────────────────────────── */}
          {tab==="storyboard"&&(
            <div>
              {generatedChars&&generatedChars.length>0&&(
                <div className="glass" style={{marginBottom:20,padding:22,border:"1px solid rgba(236,72,153,.25) !important"}}>
                  <div style={{fontSize:11,fontWeight:900,color:"#f472b6",marginBottom:16,textTransform:"uppercase",letterSpacing:"2px"}}>👤 СГЕНЕРИРОВАННЫЕ ПЕРСОНАЖИ</div>
                  {generatedChars.map((c,i)=>(
                    <div key={i} style={{marginBottom:i!==generatedChars.length-1?14:0,paddingBottom:i!==generatedChars.length-1?14:0,borderBottom:i!==generatedChars.length-1?"1px solid rgba(236,72,153,.1)":"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#fbcfe8"}}>{c.name} <span style={{color:"#6b7280",fontSize:11}}>({c.id})</span></span>
                        <CopyBtn text={c.ref_sheet_prompt} small/>
                      </div>
                      <div style={{fontSize:11,fontFamily:"monospace",color:"#f9a8d4",lineHeight:1.5}}>{c.ref_sheet_prompt}</div>
                    </div>
                  ))}
                </div>
              )}

              {locRef&&(
                <div className="glass" style={{marginBottom:16,padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:10,fontWeight:900,color:"#38bdf8",textTransform:"uppercase",letterSpacing:"2px"}}>🌍 LOCATION REF</span><CopyBtn text={locRef} small/></div>
                  <div style={{fontSize:12,fontFamily:"monospace",color:"#bae6fd",lineHeight:1.5}}>{locRef}</div>
                </div>
              )}
              {styleRef&&(
                <div className="glass" style={{marginBottom:20,padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:10,fontWeight:900,color:"#facc15",textTransform:"uppercase",letterSpacing:"2px"}}>🎨 STYLE REF</span><CopyBtn text={`${styleRef}, ${VISUAL_ENGINES[engine]?.prompt||""}${customStyle?", "+customStyle:""}`} small/></div>
                  <div style={{fontSize:12,fontFamily:"monospace",color:"#fef08a",lineHeight:1.5}}>{`${styleRef}, ${VISUAL_ENGINES[engine]?.prompt||""}${customStyle?", "+customStyle:""}`}</div>
                </div>
              )}

              {/* ── PROMPT VIEW TOGGLE ─────────────────────────── */}
              {step2Done&&(
                <div style={{display:"flex",gap:8,marginBottom:16,background:"rgba(0,0,0,.3)",borderRadius:12,padding:6}}>
                  {[["T2V","🎯 T2V (с DNA)"],["I2V","📸 I2V (без DNA)"]].map(([mode,label])=>(
                    <button key={mode} onClick={()=>setPromptView(mode)} style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1px solid ${promptView===mode?"rgba(168,85,247,.6)":"rgba(255,255,255,.08)"}`,background:promptView===mode?"rgba(168,85,247,.2)":"transparent",color:promptView===mode?"#d8b4fe":"rgba(255,255,255,.4)",fontSize:11,fontWeight:promptView===mode?900:500,cursor:"pointer",transition:"all .2s"}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {step2Done&&promptView==="I2V"&&(
                <div style={{background:"rgba(56,189,248,.06)",border:"1px solid rgba(56,189,248,.2)",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:11,color:"#7dd3fc"}}>
                  📸 <b>I2V режим:</b> ты загружаешь свой референс в Grok/Kling/Runway — промпты содержат только действие и камеру, без описания внешности
                </div>
              )}
              {/* Баннер: Reference Studio активен */}
              {refAnalyzed&&(refChar||refLoc||refStyle)&&(
                <div style={{display:"flex",gap:10,alignItems:"center",background:"rgba(249,115,22,.06)",border:"1px solid rgba(249,115,22,.3)",borderRadius:14,padding:"12px 16px",marginBottom:16}}>
                  <div style={{display:"flex",gap:6}}>
                    {refChar  && <img src={refChar}  style={{width:36,height:36,objectFit:"cover",borderRadius:8,border:"2px solid #f472b6"}} alt="char ref"/>}
                    {refLoc   && <img src={refLoc}   style={{width:36,height:36,objectFit:"cover",borderRadius:8,border:"2px solid #38bdf8"}} alt="loc ref"/>}
                    {refStyle && <img src={refStyle} style={{width:36,height:36,objectFit:"cover",borderRadius:8,border:"2px solid #a78bfa"}} alt="style ref"/>}
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:900,color:"#f97316",textTransform:"uppercase",letterSpacing:"1px"}}>📸 Reference Studio активен</div>
                    <div style={{fontSize:10,color:"#94a3b8",lineHeight:1.4}}>
                      {[refChar&&"👤 персонаж",refLoc&&"🌍 локация",refStyle&&"🎨 стиль"].filter(Boolean).join(" · ")} — встроены в промпты
                    </div>
                  </div>
                </div>
              )}
              {/* ── FILM STRIP FRAMES ─────────────────────────────── */}
              {frames.map((f,i)=>(
                <div key={i} className="film-card hover-lift" style={{marginBottom:16,animationDelay:`${Math.min(i*0.06,0.8)}s`,display:"flex",gap:0}}>
                  {/* Левая плёнка */}
                  <div style={{width:22,background:"rgba(0,0,0,.6)",borderRadius:"12px 0 0 12px",border:"1px solid rgba(255,255,255,.07)",borderRight:"none",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:5,flexShrink:0}}>
                    {Array.from({length:8}).map((_,j)=>(
                      <div key={j} style={{width:8,height:8,borderRadius:2,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.05)"}}/>
                    ))}
                  </div>
                  {/* Основное тело */}
                  <div style={{flex:1,background:"rgba(10,10,20,.75)",border:"1px solid rgba(255,255,255,.07)",borderLeft:"none",borderRight:"none",padding:"16px 18px"}}>
                    {/* Заголовок кадра */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{background:"linear-gradient(135deg,#ef4444,#dc2626)",borderRadius:8,padding:"4px 10px",fontFamily:"monospace",fontSize:12,fontWeight:900,color:"#fff",letterSpacing:"1px",boxShadow:"0 2px 10px rgba(239,68,68,.4)"}}>
                          {String(i+1).padStart(2,"0")}
                        </div>
                        {f.camera&&<span style={{fontSize:10,color:"#475569",fontFamily:"monospace",fontStyle:"italic"}}>{f.camera}</span>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                        {f.characters_in_frame&&f.characters_in_frame.length>0&&(
                          <span style={{fontSize:9,color:"#f472b6",background:"rgba(236,72,153,.1)",border:"1px solid rgba(236,72,153,.25)",padding:"3px 7px",borderRadius:5,fontFamily:"monospace",fontWeight:700}}>
                            👤 {f.characters_in_frame.join(" + ")}
                          </span>
                        )}
                        <span style={{fontSize:9,color:"#94a3b8",background:"rgba(255,255,255,.07)",padding:"3px 8px",borderRadius:5,fontFamily:"monospace",letterSpacing:"0.5px"}}>⏱ {f.timecode}</span>
                      </div>
                    </div>

                    {f.visual&&<div style={{fontSize:13,color:"#e2e8f0",marginBottom:12,lineHeight:1.6}}>👁 {f.visual}</div>}

                    {f.voice&&(
                      <div style={{fontSize:13,fontStyle:"italic",color:"#c4b5fd",marginBottom:12,borderLeft:"3px solid #7c3aed",paddingLeft:12,background:"rgba(124,58,237,.04)",borderRadius:"0 8px 8px 0",padding:"8px 12px"}}>
                        «{f.voice}»
                      </div>
                    )}

                    {(f.sfx||f.text_on_screen)&&(
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:step2Done?14:0}}>
                        {f.sfx&&<div style={{flex:"1 1 140px",background:"rgba(245,158,11,.05)",border:"1px dashed rgba(245,158,11,.25)",padding:"7px 10px",borderRadius:8,fontSize:11,color:"#fcd34d"}}>🔊 {f.sfx}</div>}
                        {f.text_on_screen&&<div style={{flex:"1 1 140px",background:"rgba(236,72,153,.05)",border:"1px dashed rgba(236,72,153,.25)",padding:"7px 10px",borderRadius:8,fontSize:11,color:"#fbcfe8",fontWeight:800}}>🔤 "{f.text_on_screen}"</div>}
                      </div>
                    )}

                    {step2Done&&f.imgPrompt_EN&&(()=>{
                      const imgTxt = promptView==="I2V" ? stripDnaForI2V(f.imgPrompt_EN) : f.imgPrompt_EN;
                      return (
                      <div style={{background:"rgba(16,185,129,.04)",padding:12,borderRadius:10,marginBottom:10,marginTop:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:9,color:"#34d399",fontWeight:900,letterSpacing:"1.5px"}}>🖼 IMAGE PROMPT {promptView==="I2V"?"(I2V — без DNA)":""}</span>
                          <CopyBtn text={imgTxt} small/>
                        </div>
                        <div style={{fontSize:11,fontFamily:"monospace",color:"#6ee7b7",lineHeight:1.5}}>{imgTxt}</div>
                      </div>);
                    })()}
                    {step2Done&&f.vidPrompt_EN&&(()=>{
                      const vidTxt = promptView==="I2V" ? stripDnaForI2V(f.vidPrompt_EN) : f.vidPrompt_EN;
                      return (
                      <div style={{background:"rgba(139,92,246,.04)",padding:12,borderRadius:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:9,color:"#a78bfa",fontWeight:900,letterSpacing:"1.5px"}}>🎬 VIDEO PROMPT {promptView==="I2V"?"(I2V — только действие)":"(GROK / KLING)"}</span>
                          <CopyBtn text={vidTxt} small/>
                        </div>
                        <div style={{fontSize:11,fontFamily:"monospace",color:"#d8b4fe",lineHeight:1.5}}>{vidTxt}</div>
                        <div style={{marginTop:10,background:"rgba(250,204,21,.04)",border:"1px dashed rgba(250,204,21,.25)",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>🔒</span>
                          <div>
                            <div style={{fontSize:10,fontWeight:900,color:"#fbbf24"}}>SEED LOCK — для сходства лица</div>
                            <div style={{fontSize:10,color:"#fef08a",lineHeight:1.5}}>Запомни seed первого удачного кадра и используй для всех кадров с этим персонажем</div>
                          </div>
                        </div>
                        {f.identity_lock_applied&&(
                          <div style={{marginTop:6,background:"rgba(168,85,247,.06)",border:"1px dashed rgba(168,85,247,.3)",borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:13}}>🧬</span>
                            <div style={{fontSize:10,color:"#d8b4fe",lineHeight:1.5}}>
                              <b style={{color:"#a855f7"}}>IDENTITY LOCK применён</b> — DNA персонажа + continuity note зашиты в промпт автоматически
                            </div>
                          </div>
                        )}
                      </div>
                    );})()}
                    {step2Done&&f.negative_prompt&&(
                      <div style={{background:"rgba(239,68,68,.04)",border:"1px solid rgba(239,68,68,.2)",padding:12,borderRadius:10,marginTop:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:9,color:"#f87171",fontWeight:900,letterSpacing:"1.5px"}}>🚫 NEGATIVE PROMPT</span>
                          <CopyBtn text={f.negative_prompt} small/>
                        </div>
                        <div style={{fontSize:10,fontFamily:"monospace",color:"#fca5a5",lineHeight:1.6,opacity:0.85}}>{f.negative_prompt}</div>
                      </div>
                    )}
                  </div>
                  {/* Правая плёнка */}
                  <div style={{width:22,background:"rgba(0,0,0,.6)",borderRadius:"0 12px 12px 0",border:"1px solid rgba(255,255,255,.07)",borderLeft:"none",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:5,flexShrink:0}}>
                    {Array.from({length:8}).map((_,j)=>(
                      <div key={j} style={{width:8,height:8,borderRadius:2,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.05)"}}/>
                    ))}
                  </div>
                </div>
              ))}

              {/* B-ROLLS */}
              {step2Done&&bRolls.length>0&&(
                <div style={{marginBottom:20,background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.25)",borderRadius:20,padding:20}}>
                  <div style={{fontSize:11,fontWeight:900,color:"#fbbf24",marginBottom:14,textTransform:"uppercase",letterSpacing:"2px"}}>⚡ МИКРО-ПЕРЕБИВКИ (B-ROLLS)</div>
                  {bRolls.map((b,i)=><div key={i} style={{fontSize:12,fontFamily:"monospace",color:"#fcd34d",marginBottom:i<bRolls.length-1?8:0,paddingBottom:i<bRolls.length-1?8:0,borderBottom:i<bRolls.length-1?"1px solid rgba(245,158,11,.08)":"none"}}>- {b}</div>)}
                </div>
              )}

              {/* ── I2V ANALYZER ───────────────────────────────────── */}
              {frames.length>0&&(
                <div style={{marginBottom:20}}>
                  {/* Заголовок + кнопка */}
                  <div style={{background:"rgba(14,165,233,.05)",border:"1px solid rgba(14,165,233,.3)",borderRadius:20,padding:20,marginBottom:i2vPackage?14:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:900,color:"#38bdf8",textTransform:"uppercase",letterSpacing:"2px",marginBottom:4}}>🎬 I2V АНАЛИЗАТОР</div>
                        <div style={{fontSize:11,color:"#475569",lineHeight:1.5}}>ИИ исследует каждый кадр и выдаёт:<br/><span style={{color:"#7dd3fc"}}>📸 Что генерировать</span> → <span style={{color:"#a78bfa"}}>🎬 Как анимировать</span></div>
                      </div>
                      {i2vPackage&&<button onClick={()=>setI2vPackage(null)} style={{background:"none",border:"none",color:"#475569",fontSize:18,cursor:"pointer"}}>×</button>}
                    </div>
                    <button
                      onClick={handleAnalyzeI2V}
                      disabled={generatingI2V}
                      style={{width:"100%",padding:"13px",background:generatingI2V?"rgba(14,165,233,.1)":"linear-gradient(135deg,rgba(14,165,233,.3),rgba(139,92,246,.3))",border:"1px solid rgba(14,165,233,.5)",borderRadius:14,color:"#fff",fontWeight:900,cursor:generatingI2V?"not-allowed":"pointer",fontSize:13,letterSpacing:"0.5px",transition:"all .2s",boxShadow:generatingI2V?"none":"0 0 20px rgba(14,165,233,.15)"}}
                    >
                      {generatingI2V
                        ? "⏳ Анализируем раскадровку..."
                        : i2vPackage
                        ? "🔄 Анализировать заново"
                        : `🔍 АНАЛИЗИРОВАТЬ ДЛЯ I2V (${frames.length} кадров)`}
                    </button>
                  </div>

                  {/* Результаты */}
                  {i2vPackage&&(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>

                      {/* Кнопка скопировать всё */}
                      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                        <CopyBtn
                          label="📋 Все IMG промпты"
                          text={i2vPackage.frames.map((f,i)=>`[КАДР ${f.n||i+1}] IMG:\n${f.ref_image_prompt}`).join("\n\n")}
                        />
                        <CopyBtn
                          label="📋 Все I2V промпты"
                          text={i2vPackage.frames.map((f,i)=>`[КАДР ${f.n||i+1}] I2V:\n${f.i2v_prompt}`).join("\n\n")}
                        />
                      </div>

                      {/* Карточка каждого кадра */}
                      {i2vPackage.frames.map((f,i)=>{
                        const toolColors = {Kling:"#a855f7",Runway:"#ef4444",Veo:"#3b82f6",Hailuo:"#f97316",Minimax:"#10b981"};
                        const tc = toolColors[f.tool] || "#6b7280";
                        return (
                          <div key={i} style={{background:"rgba(10,10,22,.8)",border:"1px solid rgba(14,165,233,.15)",borderRadius:16,overflow:"hidden"}}>
                            {/* Шапка кадра */}
                            <div style={{background:"rgba(14,165,233,.06)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{background:"linear-gradient(135deg,#0ea5e9,#6366f1)",borderRadius:8,padding:"3px 10px",fontFamily:"monospace",fontSize:12,fontWeight:900,color:"#fff"}}>
                                  {String(f.n||i+1).padStart(2,"0")}
                                </div>
                                <span style={{fontSize:9,color:"#475569",fontFamily:"monospace"}}>{frames[i]?.timecode||""}</span>
                              </div>
                              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                <span style={{fontSize:9,fontWeight:900,color:tc,background:`${tc}18`,border:`1px solid ${tc}40`,padding:"2px 8px",borderRadius:20}}>{f.tool||"Kling"}</span>
                                <span style={{fontSize:9,color:"#6b7280",fontFamily:"monospace"}}>{f.duration||3}s</span>
                              </div>
                            </div>

                            <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                              {/* Шаг 1 — генерировать изображение */}
                              <div style={{background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:12}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                                  <span style={{fontSize:9,fontWeight:900,color:"#34d399",letterSpacing:"1.5px",textTransform:"uppercase"}}>
                                    ШАГ 1 — 📸 СГЕНЕРИРОВАТЬ ИЗОБРАЖЕНИЕ
                                  </span>
                                  <CopyBtn text={f.ref_image_prompt||""} small/>
                                </div>
                                <div style={{fontSize:11,fontFamily:"monospace",color:"#6ee7b7",lineHeight:1.6}}>{f.ref_image_prompt}</div>
                                <div style={{marginTop:8,fontSize:9,color:"#374151"}}>→ Midjourney / Grok Imagine / Flux / Firefly</div>
                              </div>

                              {/* Шаг 2 — анимировать */}
                              <div style={{background:"rgba(139,92,246,.04)",border:"1px solid rgba(139,92,246,.2)",borderRadius:12,padding:12}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                                  <span style={{fontSize:9,fontWeight:900,color:"#a78bfa",letterSpacing:"1.5px",textTransform:"uppercase"}}>
                                    ШАГ 2 — 🎬 АНИМИРОВАТЬ (I2V)
                                  </span>
                                  <CopyBtn text={f.i2v_prompt||""} small/>
                                </div>
                                <div style={{fontSize:12,fontFamily:"monospace",color:"#d8b4fe",lineHeight:1.5,fontWeight:700}}>{f.i2v_prompt}</div>
                                <div style={{marginTop:8,fontSize:9,color:"#374151"}}>→ {f.tool||"Kling"} · {f.duration||3} сек · Image-to-Video</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Workflow note */}
                      {i2vPackage.workflow_note&&(
                        <div style={{background:"rgba(245,158,11,.05)",border:"1px dashed rgba(245,158,11,.25)",borderRadius:12,padding:"12px 16px",fontSize:11,color:"#fcd34d",lineHeight:1.6}}>
                          💡 {i2vPackage.workflow_note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── RAW TAB ────────────────────────────────────────────── */}
          {tab==="raw"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="glass" style={{padding:22}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{fontWeight:900,color:"#fff",fontSize:14}}>🎬 СЦЕНАРИЙ</span><CopyBtn text={rawScript}/></div>
                <pre style={{whiteSpace:"pre-wrap",color:"#94a3b8",fontSize:12,fontFamily:"monospace",lineHeight:1.7}}>{rawScript}</pre>
              </div>
              {step2Done&&(
                <>
                  <div className="glass" style={{padding:22}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{fontWeight:900,color:"#34d399",fontSize:13}}>🖼 IMAGE PROMPTS</span><CopyBtn text={rawImg}/></div>
                    <pre style={{whiteSpace:"pre-wrap",color:"#6ee7b7",fontSize:12,fontFamily:"monospace",lineHeight:1.6}}>{rawImg}</pre>
                  </div>
                  <div className="glass" style={{padding:22}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{fontWeight:900,color:"#a78bfa",fontSize:13}}>🎥 VIDEO PROMPTS</span><CopyBtn text={rawVid}/></div>
                    <pre style={{whiteSpace:"pre-wrap",color:"#d8b4fe",fontSize:12,fontFamily:"monospace",lineHeight:1.6}}>{rawVid}</pre>
                  </div>
                  <div className="glass" style={{padding:22,border:"1px solid rgba(239,68,68,.2)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontWeight:900,color:"#f87171",fontSize:13}}>🚫 NEGATIVE PROMPT</span>
                      <CopyBtn text={frames[0]?.negative_prompt||DEFAULT_NEGATIVE}/>
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",marginBottom:10,lineHeight:1.5}}>Вставляй в поле <b style={{color:"#fca5a5"}}>«—no»</b> / <b style={{color:"#fca5a5"}}>«Negative prompt»</b> в Midjourney, Grok, Kling, Veo.</div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:"#fca5a5",lineHeight:1.7,background:"rgba(239,68,68,.04)",padding:12,borderRadius:10}}>
                      {frames[0]?.negative_prompt||DEFAULT_NEGATIVE}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── SEO TAB ────────────────────────────────────────────── */}
          {tab==="seo"&&(
            <div style={{marginBottom:20}}>
              <div className="glass" style={{padding:22,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:10,fontWeight:900,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"2px"}}>🎵 МУЗЫКА (SUNO AI)</span>
                </div>
                <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.2)",padding:14,borderRadius:12}}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><CopyBtn text={music||"Промпт не сгенерирован"} small/></div>
                  <div style={{fontFamily:"monospace",fontSize:13,color:"#fcd34d",lineHeight:1.6}}>{music||"Промпт не сгенерирован"}</div>
                </div>
              </div>

              <div className="glass" style={{padding:22}}>
                <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
                  <span style={{fontSize:10,fontWeight:900,color:"#60a5fa",textTransform:"uppercase",letterSpacing:"2px"}}>🚀 МАТРИЦА ВИРУСНОГО SEO</span>
                  <button onClick={()=>openInfo('seo')} className="icon-btn" style={{color:"#60a5fa",fontSize:12,marginLeft:6}}>ℹ️</button>
                </div>
                {seoVariants&&seoVariants.length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {seoVariants.map((seoVar,i)=>(
                      <div key={i} style={{background:SEO_COLORS[i%3].bg,border:`1px solid ${SEO_COLORS[i%3].border}`,padding:16,borderRadius:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{fontSize:10,color:SEO_COLORS[i%3].title,fontWeight:900,letterSpacing:"1.5px",textTransform:"uppercase"}}>ВАРИАНТ {i+1}</div>
                        </div>
                        <div style={{fontSize:14,color:"#fff",fontWeight:900,marginBottom:8}}>📌 ЗАГОЛОВОК:<br/><span>{seoVar.title}</span></div>
                        <div style={{color:SEO_COLORS[i%3].text,fontSize:13,marginBottom:10,lineHeight:1.6}}>📝 ОПИСАНИЕ:<br/>{seoVar.desc}</div>
                        <div style={{color:SEO_COLORS[i%3].title,fontSize:12,fontWeight:700,marginBottom:14}}>🏷 ТЕГИ:<br/>{seoVar.tags?.join(" ")}</div>
                        <CopyBtn text={`${seoVar.title}\n\n${seoVar.desc}\n\n${seoVar.tags?.join(" ")}`} label="СКОПИРОВАТЬ ВАРИАНТ" fullWidth/>
                      </div>
                    ))}
                    <button onClick={handleAddSEOVariant} disabled={generatingSEO} style={{width:"100%",padding:"12px",background:"rgba(59,130,246,.08)",border:"1px dashed rgba(59,130,246,.4)",borderRadius:12,color:"#60a5fa",fontWeight:800,cursor:generatingSEO?"not-allowed":"pointer",transition:"all .2s",fontSize:13}}>
                      {generatingSEO?"ГЕНЕРАЦИЯ...":"➕ СГЕНЕРИРОВАТЬ ЕЩЕ ВАРИАНТ"}
                    </button>
                  </div>
                ):<div style={{color:"#475569",fontSize:13}}>SEO не сгенерировано.</div>}
              </div>

              {/* ── FACEBOOK КОНТЕНТ ── */}
              <div className="glass" style={{padding:22}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <span style={{fontSize:10,fontWeight:900,color:"#60a5fa",textTransform:"uppercase",letterSpacing:"2px"}}>📘 FACEBOOK КОНТЕНТ</span>
                </div>

                {!fbData&&(
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#475569",marginBottom:14,lineHeight:1.6}}>
                      Facebook публикация + Reels подпись + Instagram карусель<br/>
                      + серия из 3 слайдов для Stories.
                    </div>
                    <button onClick={handleGenerateFB} disabled={generatingFB||!script.trim()}
                      style={{width:"100%",padding:"13px",background:generatingFB?"rgba(29,78,216,.3)":"linear-gradient(135deg,#1d4ed8,#7c3aed)",borderRadius:12,color:"#fff",fontWeight:900,border:"none",cursor:generatingFB||!script.trim()?"not-allowed":"pointer",opacity:!script.trim()?0.4:1,fontSize:13,letterSpacing:"0.5px",boxShadow:"0 4px 20px rgba(29,78,216,.35)",transition:"all .2s"}}>
                      {generatingFB?"⏳ ГЕНЕРАЦИЯ...":"📘 FB + REELS + CAROUSEL + STORIES"}
                    </button>
                    {!script.trim()&&<div style={{fontSize:10,color:"#ef4444",marginTop:8}}>Сначала создайте сценарий (Шаг 1)</div>}
                  </div>
                )}

                {fbData&&(
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>

                    {/* ПУБЛИКАЦИЯ */}
                    <div style={{background:"rgba(29,78,216,.07)",border:"1px solid rgba(29,78,216,.25)",borderRadius:14,padding:14}}>
                      <div style={{fontSize:9,fontWeight:900,color:"#93c5fd",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>📘 FACEBOOK ПУБЛИКАЦИЯ</div>
                      <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:12,marginBottom:10,lineHeight:1.75}}>
                        <div style={{fontSize:14,color:"#fff",fontWeight:900,marginBottom:8}}>{fbData.post_hook}</div>
                        <div style={{fontSize:12,color:"#cbd5e1",whiteSpace:"pre-wrap",marginBottom:10}}>{fbData.post_body}</div>
                        <div style={{fontSize:13,color:"#fff",fontWeight:800,borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:10,marginBottom:8}}>{fbData.post_question}</div>
                        <div style={{fontSize:11,color:"#3b82f6"}}>{fbData.post_tags}</div>
                      </div>
                      <CopyBtn text={`${fbData.post_hook}\n\n${fbData.post_body}\n\n${fbData.post_question}\n\n${fbData.post_tags}`} label="📋 СКОПИРОВАТЬ ПУБЛИКАЦИЮ" fullWidth/>
                    </div>

                    {/* REELS CAPTION */}
                    {fbData.reels_caption&&(
                      <div style={{background:"rgba(236,72,153,.07)",border:"1px solid rgba(236,72,153,.25)",borderRadius:14,padding:14}}>
                        <div style={{fontSize:9,fontWeight:900,color:"#f9a8d4",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>📱 INSTAGRAM REELS CAPTION</div>
                        <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:12,marginBottom:10,fontSize:13,color:"#fff",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{fbData.reels_caption}</div>
                        <CopyBtn text={fbData.reels_caption} label="📋 СКОПИРОВАТЬ REELS CAPTION" fullWidth/>
                      </div>
                    )}

                    {/* INSTAGRAM CAROUSEL */}
                    {fbData.carousel&&fbData.carousel.length>0&&(
                      <div>
                        <div style={{fontSize:9,fontWeight:900,color:"#c084fc",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>🎠 INSTAGRAM КАРУСЕЛЬ — 5 СЛАЙДОВ</div>
                        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}} className="hide-scroll">
                          {fbData.carousel.map((slide,i)=>(
                            <div key={i} style={{flexShrink:0,width:130,borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.08)"}}>
                              <div style={{background:slide.bg||"#0d0010",padding:"16px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:140,textAlign:"center",gap:6}}>
                                <div style={{fontSize:9,fontWeight:900,color:"rgba(255,255,255,.25)",letterSpacing:"2px"}}>{i+1}/5</div>
                                <div style={{fontSize:20}}>{slide.emoji}</div>
                                <div style={{fontSize:11,color:"#fff",fontWeight:900,lineHeight:1.3}}>{slide.headline}</div>
                                <div style={{fontSize:9,color:"rgba(255,255,255,.55)",lineHeight:1.3}}>{slide.sub}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:8}}>
                          <CopyBtn text={fbData.carousel.map((s,i)=>`СЛАЙД ${i+1}:\n${s.emoji} ${s.headline}\n${s.sub}`).join("\n\n")} label="📋 СКОПИРОВАТЬ ВСЕ 5 СЛАЙДОВ" fullWidth/>
                        </div>
                      </div>
                    )}

                    {/* 3 STORIES */}
                    {fbData.slides&&fbData.slides.length>0&&(
                      <div>
                        <div style={{fontSize:9,fontWeight:900,color:"#a78bfa",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>⚡ STORIES — 3 СЛАЙДА-ТИЗЕРА</div>
                        <div style={{display:"flex",gap:8}}>
                          {fbData.slides.map((slide,i)=>(
                            <div key={i} style={{flex:1,borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.08)"}}>
                              <div style={{background:slide.bg||"#0d0010",padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:100,textAlign:"center",gap:6}}>
                                <div style={{fontSize:20}}>{slide.emoji}</div>
                                <div style={{fontSize:11,color:"#fff",fontWeight:900,lineHeight:1.2}}>{slide.headline}</div>
                                <div style={{fontSize:9,color:"rgba(255,255,255,.55)",lineHeight:1.3}}>{slide.sub}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:8}}>
                          <CopyBtn text={fbData.slides.map((s,i)=>`STORIES ${i+1}:\n${s.emoji} ${s.headline}\n${s.sub}`).join("\n\n")} label="📋 СКОПИРОВАТЬ STORIES" fullWidth/>
                        </div>
                      </div>
                    )}

                    {/* Сброс */}
                    <button onClick={()=>setFbData(null)} style={{width:"100%",padding:"9px",background:"transparent",border:"1px dashed rgba(255,255,255,.1)",borderRadius:10,color:"#475569",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                      🔄 Сгенерировать заново
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── TTS STUDIO TAB ─────────────────────────────────────── */}
          {tab==="tts"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Кнопка генерации */}
              {!ttsStudioData&&(
                <div style={{background:"rgba(14,165,233,.07)",border:"1px dashed rgba(14,165,233,.35)",borderRadius:20,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🎙</div>
                  <div style={{fontSize:13,color:"#7dd3fc",fontWeight:700,marginBottom:6}}>Настройки для Google AI Studio</div>
                  <div style={{fontSize:11,color:"#475569",marginBottom:18,lineHeight:1.6}}>ИИ подберёт Scene, Context, лучший голос<br/>и перепишет скрипт с Google-тегами эмоций</div>
                  <button onClick={handleGenerateTTSStudio} disabled={generatingTTS||!script.trim()} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0ea5e9,#0284c7)",borderRadius:14,color:"#fff",fontWeight:900,border:"none",cursor:generatingTTS||!script.trim()?"not-allowed":"pointer",opacity:!script.trim()?0.4:1,fontSize:14,letterSpacing:"0.5px",boxShadow:"0 4px 20px rgba(14,165,233,.35)",transition:"all .2s"}}>
                    {generatingTTS?"⏳ ГЕНЕРАЦИЯ...":"🎙 СГЕНЕРИРОВАТЬ TTS НАСТРОЙКИ (⭐ 1)"}
                  </button>
                  {!script.trim()&&<div style={{fontSize:10,color:"#ef4444",marginTop:8}}>Сначала создайте сценарий (Шаг 1)</div>}
                </div>
              )}

              {/* Результат */}
              {ttsStudioData&&(
                <>
                  {/* Scene + Context row */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:"rgba(14,165,233,.06)",border:"1px solid rgba(14,165,233,.3)",borderRadius:14,padding:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:9,fontWeight:900,color:"#38bdf8",letterSpacing:"2px",textTransform:"uppercase"}}>🎬 SCENE</span>
                        <CopyBtn text={ttsStudioData.scene||""} small/>
                      </div>
                      <div style={{fontFamily:"monospace",fontSize:12,color:"#e0f2fe",fontWeight:700,lineHeight:1.4}}>{ttsStudioData.scene}</div>
                    </div>
                    <div style={{background:"rgba(168,85,247,.06)",border:"1px solid rgba(168,85,247,.3)",borderRadius:14,padding:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:9,fontWeight:900,color:"#c084fc",letterSpacing:"2px",textTransform:"uppercase"}}>📋 CONTEXT</span>
                        <CopyBtn text={ttsStudioData.context||""} small/>
                      </div>
                      <div style={{fontSize:11,color:"#e9d5ff",lineHeight:1.5}}>{ttsStudioData.context}</div>
                    </div>
                  </div>

                  {/* Voice */}
                  <div style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.35)",borderRadius:14,padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:9,fontWeight:900,color:"#34d399",letterSpacing:"2px",textTransform:"uppercase"}}>🎤 ГОЛОС</span>
                      <CopyBtn text={ttsStudioData.voice_id||""} small/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"monospace"}}>{ttsStudioData.voice_id}</div>
                      <div style={{fontSize:10,color:"#6ee7b7",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.25)",padding:"2px 8px",borderRadius:20}}>{GOOGLE_VOICES.find(v=>v.id===ttsStudioData.voice_id)?.desc||""}</div>
                    </div>
                    <div style={{fontSize:11,color:"#a7f3d0",lineHeight:1.5}}>{ttsStudioData.voice_reason}</div>
                  </div>

                  {/* Pacing Tips */}
                  {ttsStudioData.pacing_tips&&(
                    <div style={{background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.25)",borderRadius:14,padding:14}}>
                      <div style={{fontSize:9,fontWeight:900,color:"#fbbf24",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>🎯 СОВЕТЫ ПО ТЕМПУ</div>
                      <div style={{fontSize:12,color:"#fef3c7",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{ttsStudioData.pacing_tips}</div>
                    </div>
                  )}

                  {/* Script tabs — 3 platforms */}
                  <TTSScriptTabs ttsStudioData={ttsStudioData} />

                  {/* Сброс */}
                  <button onClick={()=>setTtsStudioData(null)} style={{width:"100%",padding:"10px",background:"transparent",border:"1px dashed rgba(255,255,255,.1)",borderRadius:12,color:"#475569",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    🔄 Сгенерировать заново (⭐ 1)
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── PIPELINE TAB ─────────────────────────────────────── */}
          {tab==="pipeline"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {!pipelineResult&&!pipelineRunning&&(
                <div style={{textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:40,marginBottom:16}}>🎬</div>
                  <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:8}}>Production Pipeline</div>
                  <div style={{fontSize:13,color:"#475569",lineHeight:1.7,marginBottom:24}}>
                    Превращает раскадровку в готовый пакет для монтажа.<br/>
                    <b style={{color:"#38bdf8"}}>script → identity lock → image anchors → video clips → timeline</b>
                  </div>
                  <button onClick={handleRunPipeline} disabled={!step2Done} style={{padding:"14px 32px",background:step2Done?"linear-gradient(135deg,#0ea5e9,#7c3aed)":"rgba(255,255,255,.05)",border:"none",borderRadius:14,color:"#fff",fontWeight:900,cursor:step2Done?"pointer":"not-allowed",fontSize:14,opacity:step2Done?1:0.4}}>
                    {step2Done?"🚀 ЗАПУСТИТЬ":"Сначала выполните Шаг 2"}
                  </button>
                </div>
              )}

              {pipelineRunning&&pipelineProgress&&(
                <div style={{textAlign:"center",padding:"30px 20px"}}>
                  <div style={{fontSize:14,color:"#38bdf8",fontWeight:900,marginBottom:12}}>{pipelineProgress.message}</div>
                  <div style={{background:"rgba(0,0,0,.4)",borderRadius:10,height:10,overflow:"hidden",marginBottom:8}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,#0ea5e9,#a855f7)",borderRadius:10,width:`${Math.round(((pipelineProgress.index||0)/(pipelineProgress.total||1))*100)}%`,transition:"width .4s"}}/>
                  </div>
                  <div style={{fontSize:11,color:"#475569",fontFamily:"monospace"}}>{pipelineProgress.stage?.toUpperCase()} · {pipelineProgress.index}/{pipelineProgress.total}</div>
                </div>
              )}

              {pipelineResult&&(
                <>
                  {/* IDENTITY LOCK */}
                  <div className="glass" style={{padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <span style={{fontSize:10,fontWeight:900,color:"#d8b4fe",textTransform:"uppercase",letterSpacing:"2px"}}>🔒 IDENTITY LOCK</span>
                      <CopyBtn text={JSON.stringify(pipelineResult.identityLock,null,2)} small label="Копировать JSON"/>
                    </div>
                    <div style={{background:"rgba(0,0,0,.4)",borderRadius:12,padding:14,marginBottom:10}}>
                      <div style={{fontSize:12,fontFamily:"monospace",color:"#c4b5fd",lineHeight:1.7}}>{pipelineResult.identityLock?.identity}</div>
                    </div>
                    <div style={{fontSize:11,fontFamily:"monospace",color:"#7c3aed",padding:"8px 12px",background:"rgba(124,58,237,.07)",borderRadius:8,border:"1px dashed rgba(124,58,237,.3)"}}>
                      🔑 SEED: {pipelineResult.identityLock?.seed} &nbsp;|&nbsp; {pipelineResult.identityLock?.lockPhrase}
                    </div>
                  </div>

                  {/* STATS */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[
                      {icon:"🖼",label:"Image Anchors",val:pipelineResult.frames?.length||0,color:"#34d399"},
                      {icon:"🎥",label:"Video Clips",val:pipelineResult.frames?.filter(f=>f.video)?.length||0,color:"#a78bfa"},
                      {icon:"⏱",label:"Timeline сек",val:pipelineResult.timeline?.reduce((s,c)=>s+(c.duration||0),0)||0,color:"#fbbf24"},
                    ].map(({icon,label,val,color})=>(
                      <div key={label} style={{background:"rgba(0,0,0,.4)",border:`1px solid ${color}22`,borderRadius:14,padding:14,textAlign:"center"}}>
                        <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                        <div style={{fontSize:22,fontWeight:900,color,fontFamily:"monospace"}}>{val}</div>
                        <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:"1px",marginTop:2}}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* TIMELINE */}
                  <div className="glass" style={{padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <span style={{fontSize:10,fontWeight:900,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"2px"}}>📽 TIMELINE ASSEMBLY</span>
                      <CopyBtn text={JSON.stringify(pipelineResult.timeline,null,2)} label="Весь JSON"/>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {(pipelineResult.timeline||[]).map((clip,i)=>{
                        const tc={cold_open:"#ef4444",pattern_interrupt:"#f97316",reveal_cut:"#a855f7",hard_cut:"#475569"}[clip.transition]||"#475569";
                        return(
                          <div key={i} style={{background:"rgba(0,0,0,.35)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                            <div style={{flexShrink:0,textAlign:"center",minWidth:48}}>
                              <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"4px 6px",fontFamily:"monospace",fontSize:11,fontWeight:900,color:"#ef4444",marginBottom:4}}>{String(i+1).padStart(2,"0")}</div>
                              <div style={{fontSize:9,color:"#475569",fontFamily:"monospace"}}>{clip.start}s–{clip.start+clip.duration}s</div>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                                <span style={{fontSize:9,fontWeight:900,color:tc,background:`${tc}18`,border:`1px solid ${tc}40`,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"1px"}}>{clip.transition}</span>
                                <span style={{fontSize:9,color:"#6b7280",fontFamily:"monospace"}}>{clip.duration}s</span>
                              </div>
                              {clip.vo&&<div style={{fontSize:11,color:"#c4b5fd",fontStyle:"italic",marginBottom:4}}>🎙 «{clip.vo}»</div>}
                              {clip.sfx&&<div style={{fontSize:10,color:"#fcd34d"}}>🔊 {clip.sfx}</div>}
                              {clip.continuity_note&&<div style={{fontSize:9,color:"#374151",marginTop:4}}>{clip.continuity_note}</div>}
                            </div>
                            <CopyBtn text={(pipelineResult.frames?.[i]?.video_prompt)||""} small label="Промпт"/>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ENRICHED PROMPTS */}
                  <div className="glass" style={{padding:20}}>
                    <div style={{fontSize:10,fontWeight:900,color:"#34d399",textTransform:"uppercase",letterSpacing:"2px",marginBottom:14}}>🖼 ENRICHED PROMPTS → Grok / Veo 3.1</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {(pipelineResult.frames||[]).map((f,i)=>(
                        <div key={i} style={{background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.12)",borderRadius:10,padding:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                            <span style={{fontSize:9,fontWeight:900,color:"#34d399",fontFamily:"monospace"}}>FRAME {i+1} · {f.time}</span>
                            <CopyBtn text={f.image_prompt} small label="IMG"/>
                          </div>
                          <div style={{fontSize:10,fontFamily:"monospace",color:"#6ee7b7",lineHeight:1.6,marginBottom:8}}>{f.image_prompt}</div>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:9,fontWeight:900,color:"#a78bfa"}}>VIDEO</span>
                            <CopyBtn text={f.video_prompt} small label="VID"/>
                          </div>
                          <div style={{fontSize:10,fontFamily:"monospace",color:"#d8b4fe",lineHeight:1.5}}>{f.video_prompt}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HOW TO */}
                  <div style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.25)",borderRadius:16,padding:18}}>
                    <div style={{fontSize:10,fontWeight:900,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"2px",marginBottom:12}}>📖 КАК ИСПОЛЬЗОВАТЬ</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:12,color:"#fef3c7",lineHeight:1.7}}>
                      <div>1. 🖼 <b>Image Prompt</b> → Grok Imagine / Veo 3.1 / Midjourney → стабильный кадр</div>
                      <div>2. 🎥 <b>Video Prompt</b> → подай image + prompt в I2V (Kling / Runway / Veo 3.1)</div>
                      <div>3. ✂️ Собери клипы в редакторе по transition-типам из Timeline</div>
                      <div>4. 🎙 Наложи VO/SFX из каждого clip.vo / clip.sfx</div>
                      <div>5. 🔒 Seed <b>{pipelineResult.identityLock?.seed}</b> — один seed для всех кадров с тем же персонажем</div>
                    </div>
                  </div>

                  <button onClick={()=>{setPipelineResult(null);setPipelineProgress(null);}} style={{width:"100%",padding:"10px",background:"transparent",border:"1px dashed rgba(255,255,255,.1)",borderRadius:12,color:"#475569",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    🔄 Запустить пайплайн заново
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {view==="result"&&step2Done&&frames.length>0&&(
        <div style={{padding:"0 16px 40px",maxWidth:640,margin:"0 auto"}}>
          <button onClick={downloadPDF} disabled={pdfDownloading} style={{width:"100%",height:52,background:"rgba(10,10,20,.7)",backdropFilter:"blur(10px)",border:"1px solid rgba(168,85,247,.4)",borderRadius:14,color:"#d8b4fe",fontWeight:900,fontSize:13,cursor:pdfDownloading?"not-allowed":"pointer",boxShadow:"0 4px 20px rgba(168,85,247,.12)",textTransform:"uppercase",transition:"all .2s",letterSpacing:"0.5px"}}>
            {pdfDownloading?"ГЕНЕРАЦИЯ PDF...":"📄 СКАЧАТЬ ФИНАЛЬНЫЙ PDF БРИФ"}
          </button>
        </div>
      )}
    </div>
  );
}
