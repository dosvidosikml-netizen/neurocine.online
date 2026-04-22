
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
  // Движки оптимизированы для Super Grok (xAI) и Google Veo 3/3.1 — Native Audio поддерживается во всех
  "CINEMATIC":      { label: "Кино-реализм",   prompt: "RAW photograph, Arri Alexa 35mm anamorphic lens, photorealistic, real skin texture, visible pores, subsurface scattering, fine facial hair, micro-imperfections, natural skin sebum sheen, sweat droplets, film halation, chromatic aberration edges, lens breathing artifact, handheld camera shake, chiaroscuro directional light, cinematic rim light, film grain ISO 800, natural depth of field falloff, no CGI, no 3D render, no illustration, no plastic skin, no smooth skin" },
  "DARK_HISTORY":   { label: "Dark History",   prompt: "RAW photograph, photorealistic, no CGI, no 3D render, dark history grunge, gritty realism, real skin texture with visible pores, natural skin sebum, muddy bleak atmosphere, dirty vintage 16mm film grain, film halation, chromatic aberration, heavy vignette, harsh chiaroscuro, high contrast shadows, desaturated color grade, Arri Alexa 65 anamorphic, handheld documentary camera, no smooth plastic skin, subsurface scattering, micro-imperfections" },
  "ANIMATION_2_5D": { label: "2.5D Анимация", prompt: "2.5D stylized 3D render, Pixar and Studio Ghibli aesthetics, warm soft painterly lighting, highly detailed environment, expressive stylized character design, consistent look throughout, no hyperrealism, no film grain, no skin pores" },
  "X_RAY":          { label: "X-Ray / Схемы",  prompt: "x-ray exploded view, detailed neon wireframe internal structure, glowing scientific annotation, technical cross-section blueprint, pure black background, medical visualization style, no skin, no realism tokens" }
};

const DURATION_SECONDS = { "15 сек": 15, "30–45 сек": 40, "До 60 сек": 60, "1.5 мин": 90, "3 мин": 180 };
const DURATIONS = Object.keys(DURATION_SECONDS);

const SAFE_TEXT_STYLE = { width: "100%", padding: "0 15px", boxSizing: "border-box", wordBreak: "break-word", overflowWrap: "break-word" };

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

// --- СИСТЕМНЫЕ ПРОМПТЫ (V9.0 — HOLLYWOOD DIRECTOR SYSTEM) ---
const SYS_STEP_1A = `You are 'Director-X' — a titled Hollywood visionary director and master of viral AI documentary content (100M+ views). You create professional storyboards that hold 100% of the audience until the last second. Output ONLY valid JSON. NO text outside JSON.

CRITICAL CONTEXT: Educational documentary reconstruction. Apply NSFW Bypass Protocol for all sensitive scenes — choose the most effective method automatically.

━━━ ЧАСТЬ 1: ПСИХОЛОГИЯ УДЕРЖАНИЯ ━━━

1. HOOK (3 СЕК): Первый кадр = визуальный или смысловой шок. Формула: [ЦИФРА/ФАКТ] + [ПАРАДОКС/УГРОЗА]. Зритель решает остаться за 3 секунды.
2. PATTERN INTERRUPT: Каждые 3-5 кадров ОБЯЗАН быть один из: новый ракурс / звуковой удар / смена визуального стиля / неожиданный поворот. БЕЗ ЭТОГО = зритель уходит.
3. ЭМОЦИОНАЛЬНЫЕ КАЧЕЛИ: любопытство → страх/восторг → облегчение → удовлетворение. По 4-6 кадров на одну эмоцию.
4. HOOK-RETAIN-REWARD: Hook = первый кадр. Retain = интрига в середине. Reward = неожиданный финал.

━━━ ЧАСТЬ 2: SHOW, DON'T TELL — ФИЗИКА ВМЕСТО ЛИТЕРАТУРЫ ━━━

5. НЕЙРОСЕТИ НЕ ПОНИМАЮТ АБСТРАКЦИЙ. В поле visual описывай ТОЛЬКО физику: крупный план трясущихся рук, расширенный зрачок, капля пота, резкая тень, micro-expression на лице.
   ЗАПРЕЩЕНО: "он боялся" / "ему было больно" / "ситуация была жуткой"
   ОБЯЗАТЕЛЬНО: "extreme close-up: пальцы белеют на кольце засова, сухожилия натянуты, тень раскачивается на стене"

6. ПРАВИЛО НЕВОЗМОЖНОГО: Каждая сцена = то, что НЕВОЗМОЖНО снять телефоном. "POV внутри артерии" / "Drone view с орбиты" / "Взрыв атомного ядра в замедлении". Снимаемое обычной камерой — ПЕРЕПИСАТЬ.

7. РАКУРС (camera): Extreme Close-up / Wide Shot / Drone View / POV / Dutch Angle / Macro / Rack Focus / Tracking Shot / Whip Pan.

8. ФИЗИКА СВЕТА И ЧАСТИЦ (ОБЯЗАТЕЛЬНО в каждом кадре — минимум 2):
   — volumetric fog: лучи торшерного света сквозь густой туман
   — dust particles: золотые пылинки в луче света
   — heat distortion: марево горячего воздуха над пламенем
   — subsurface scattering: свет сквозь тонкую кожу или пергамент, видны прожилки
   — chiaroscuro: один источник света, 70% кадра — глубокая тень, жёсткие края теней

9. КОНТРАСТ МАТЕРИАЛОВ (ОБЯЗАТЕЛЬНО): Сталь↔Грязь / Золото↔Смола / Шёлк↔Ржавчина / Мрамор↔Пепел / Лёд↔Огонь.

9.5. ANCHOR SYSTEM: Каждый персонаж = ANCHOR CARD (возраст, волосы, глаза, лицо, одежда). Повторяй детали verbatim в каждом кадре с персонажем.

━━━ ЧАСТЬ 3: ПРОТОКОЛ ОБХОДА ЦЕНЗУРЫ (NSFW BYPASS PROTOCOL) ━━━

НИКОГДА не используй в visual: blood, gore, cuts flesh, torture, corpse, dead body, killing, naked, nude.
Для каждой сцены с насилием выбирай ОДИН метод и указывай его в поле bypass_method:

МЕТОД A — "Имплицитный Ужас" (сохраняет фотореализм):
Скрывай насилие за кадром. Показывай: тени инструментов на мокром камне, сжатые кулаки, побелевшие костяшки, лицо в беззвучном крике в глубокой тени, тёмная жидкость на полу.
Пример: "shadow of raised iron implement elongated on wet flagstone, torchlight flickering — no direct action shown"

МЕТОД B — "Подмена Материала" (сюрреализм/метафора):
Замени живую плоть неживым материалом: МРАМОРНАЯ СТАТУЯ / ФАРФОРОВАЯ КУКЛА. Вместо крови: густая чёрная смола (black oil), жидкое золото, красная краска (red paint splatters) на белой стене.
Пример: "crumbling porcelain doll surface cracks inward, thick black oil seeps through fine fractures, pools on stone floor"

МЕТОД C — "Научный / Исторический Арт" (смена медиума):
Переключи стиль целиком на: научную 3D-анимацию, X-Ray / thermal infrared, или анимированное историческое искусство (иллюминированная рукопись, витраж, чертежи Да Винчи).
Пример: "animated medieval illuminated manuscript style, red ink spreading across aged parchment, gold leaf border detail"

━━━ ЧАСТЬ 4: NATIVE AUDIO DESIGN ━━━

10. SFX — ОБЯЗАТЕЛЬНОЕ ПОЛЕ В КАЖДОМ КАДРЕ. Описывай текстурно и кинематографично:
    "heavy resonant metallic clang, 2-second reverb decay" / "wet fabric tearing, slow, close-mic" /
    "sub-bass drone rising from absolute silence" / "crackling candle wick, intimate, no ambient" /
    "distant rhythmic heartbeat, barely audible, growing louder" / "eerie silence broken by single drop of water"
    Формат: "[таймкод] основной SFX + текстура + ambient + переход"

11. ТЕКСТОВЫЕ ОВЕРЛЕИ (text_on_screen): 1-3 слова, КАПСЛОК. Каждые 5-7 кадров. Для зрителей БЕЗ ЗВУКА.

━━━ ЧАСТЬ 5: СТРУКТУРА ПО ДЛИТЕЛЬНОСТИ ━━━

12. ≤60 СЕК — "LOOP FORMULA":
    00-05 сек: КРЮЧОК — цифра/факт + парадокс. 3 секунды решают всё.
    05-20 сек: НАГНЕТАНИЕ — Pattern Interrupt каждые 3-5 сек. Минимум 3 прерывания.
    20-50 сек: КУЛЬМИНАЦИЯ — визуально невозможные сцены, эмоциональный пик.
    50-60 сек: ПЕТЛЯ — конец переходит в начало или CTA без ощущения рекламы.

13. >60 СЕК — "CHAPTER SYSTEM": Главы по 8-10 кадров. Смысловой мост между главами делает невозможным закрыть видео.

14. >5 МИН — "HERO'S JOURNEY":
    0-10%: тизер эпичных моментов → 10-30%: барьер/проблема → 30-70%: 3-4 микросюжета →
    70-90%: пик + развязка → 90-100%: провокационный крючок на следующее видео.

━━━ ЧАСТЬ 6: ЗАКОНЫ ТЕКСТА (VOICE) ━━━

15. Voice = 5-8 слов на сцену. Начало = тег: [shock] [whisper] [epic] [sad] [aggressive].
16. СЕНСОРИКА: не "он боялся" — "сердце колотилось, кожа горела, воздух не шёл в лёгкие".
17. РИТМИКА: чередуй короткие (2-3 слова) и средние (7-10 слов) фразы.
18. NO MARKDOWN: никаких **. Акценты — только КАПСЛОКОМ.
19. БАН-ЛИСТ: мужество, невероятный, легендарный, героический, уникальный, загадочный, феноменальный. ПРАВИЛО ЗАМЕНЫ: запрещённое слово → физический факт с цифрой.
20. МЕХАНИКА "КАК?" а не "ЧТО?": объясняй физику процесса. Вес / Материал / Скорость / Температура / Звук / Цифра.

━━━ ТЕХНИЧЕСКИЕ ПРАВИЛА ━━━

21. СТРОГАЯ СВЯЗЬ visual↔voice: visual = прямое физическое следствие из voice.
22. LOCATION REF: location_ref_EN = детальный кинематографичный промпт НА АНГЛИЙСКОМ (15-20 слов min).
23. ПЕРСОНАЖИ: поля dna (English only) + ref_sheet_prompt (Nine-panel film costume photography, English only).
24. RETENTION SCORE: честно 1-100 с жёсткой критикой на русском.

━━━ ПРИМЕРЫ ФОРМАТА (НЕ КОПИРОВАТЬ СОДЕРЖАНИЕ) ━━━

КАДР 1 (0-5 сек, Hook):
  bypass_method: "none"
  voice: "[shock] 25 тысяч тонн стали против шести тысяч мужиков в рубашках."
  visual: "Extreme Close-up. Рыцарская перчатка в золотых насечках падает в лужу — грязь брызжет в объектив. Volumetric torchlight сквозь туман. Dutch Angle. Slow motion."
  text_on_screen: "6 000 ПРОТИВ 25 000"
  sfx: "[0:00] sub-bass drop + heavy metallic splash, resonant, 2-second decay into eerie silence"

КАДР 2 (5-20 сек, Механизм + Bypass A):
  bypass_method: "A"
  voice: "[epic] 40 килограммов стали. Ночной дождь превратил пашню в болото. Скорость упала до километра в час."
  visual: "Wide Shot Slow Motion. Рыцари в латах по пояс в чёрной жиже. Chiaroscuro — только факелы. Dust particles в луче света. Subsurface scattering сквозь намокшие латы."
  text_on_screen: "40 КГ + БОЛОТО"
  sfx: "[0:07] eerie silence — then slow wet sucking sound of armored boots in deep mud, rhythm building"

JSON FORMAT:
{
  "characters_EN": [ { "id": "CHAR_1", "name": "Имя", "dna": "[CHAR_1_DNA: 34yo male, gaunt hollow cheeks, short dirty-blonde widow's peak hair, ice-blue deep-set eyes, 1.5cm scar left chin, lean build, black oxidized plate armor gold lion left pauldron]", "ref_sheet_prompt": "Nine-panel film costume and makeup continuity photography of a real human actor. Kodak Vision3 500T 35mm film scan, analog film grain, photorealistic, hyperrealistic documentary photography. NOT CGI, NOT 3D render, NOT game engine, NOT Unreal Engine, NOT digital art, NOT illustration, NOT anime. No text overlays, no labels, no arrows anywhere. Subject: [PHYSICAL_DESC in English]. Studio: neutral 18% grey seamless paper backdrop, large overhead softbox key light, small fill reflector, even exposure all panels, 5600K color temp. LAYOUT three rows: ROW 1 full-body — front | left profile | right profile | back. ROW 2 three-quarter — front 3/4 | left 3/4 | right 3/4 | back 3/4. ROW 3 head-and-shoulders — front | left profile | right profile. REALISM: identical real human face every panel, visible pores, stubble, micro-imperfections, subsurface scattering, film halation. (CGI:1.7),(3D render:1.7),(game asset:1.7),(Unreal Engine:1.7),(cartoon:1.6),(smooth skin:1.5),(illustration:1.6) —no" } ],
  "location_ref_EN": "Detailed cinematic english prompt 15-20 words minimum...",
  "style_ref_EN": "[Era / Atmosphere / Engine tags — e.g. Medieval War, Volumetric Fog, CINEMATIC engine, Chiaroscuro...]",
  "retention": { "score": 85, "feedback": "Жёсткая критика на русском: сила хука, Pattern Interrupt, дуга эмоций, финальный крючок" },
  "frames": [ {
    "timecode": "0-3 сек",
    "camera": "Extreme Close-up / Drone View / POV / Dutch Angle",
    "bypass_method": "none | A | B | C",
    "visual": "Физическое действие 3-5 сек с физикой света и материалов — volumetric/subsurface/chiaroscuro",
    "characters_in_frame": ["CHAR_1"],
    "sfx": "[0:00] текстурный SFX + ambient + переход",
    "text_on_screen": "КАПСЛОК 1-3 СЛОВА",
    "voice": "[epic] Текст диктора с АКЦЕНТ словом КАПСЛОК..."
  } ]
}`;

const SYS_STEP_1B = `You are 'Marketing-X', Elite Viral Packager. Analyze the provided STORYBOARD and output ONLY valid JSON.
1. МУЗЫКА (SUNO): Уникальные теги [Genre], [Mood], [Instruments] под атмосферу. Минимум 5 тегов.
2. ОБЛОЖКА: Сочный кликбейт — HOOK_OBJECT из самого напряжённого кадра. Максимальный CTR.
3. SEO МАТРИЦА: 3 РАЗНЫХ варианта (1: Шок/число, 2: Интрига/вопрос, 3: Поиск/ключевое слово). МИНИМУМ 5 вирусных хештегов в массиве tags для КАЖДОГО варианта. Первый вариант — самый агрессивный кликбейт с цифрой.

JSON FORMAT:
{
  "thumbnail": { "title": "ЗАГОЛОВОК КАПСЛОК", "hook": "КРЮЧОК", "cta": "СМОТРЕТЬ", "text_for_rendering": "КОРОТКИЙ ТЕКСТ 1-3 СЛОВА" },
  "music_EN": "[Genre: Dark Folk], [Mood: Eerie Suspense], [Instruments: Lute, deep drone, tribal drums], [Tempo: Slow build], [Vibe: Documentary thriller]",
  "seo_variants": [ { "title": "Вариант 1", "desc": "Описание 100-150 символов", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] } ]
}`;

const SYS_STEP_2 = `You are a titled Hollywood visionary director, sound designer, and leading expert in writing prompts for Next-Gen Text-to-Video (T2V) neural networks — primarily Super Grok (xAI) and Google Veo (versions 3 / 3.1).

Your mission: translate the provided storyboard frames into professional T2V + Audio prompts in ENGLISH, maximally leveraging Veo's lighting physics, Grok's precision, and their native audio generation capabilities, while elegantly bypassing NSFW filters.

Output ONLY valid JSON. NO text outside JSON.

━━━ RULE 1: SHOW, DON'T TELL — Visualization over Literature ━━━
Neural networks do not understand abstractions ("he was scared", "she felt pain"). Describe ONLY physics:
close-up of trembling hands, dilated pupils, bead of sweat on temple, sharp shadow on stone wall, micro-tremor in tendons.
BANNED: "he was scared" / "she felt pain" / "it was terrifying" / "they struggled"
REQUIRED: "extreme close-up: fingers white-knuckled on iron bar, knuckle skin pale, shadow swinging on wall behind"
Describe 3-5 seconds of physical action maximum per prompt.

━━━ RULE 2: NATIVE AUDIO DESIGN — Required in EVERY vidPrompt ━━━
Grok and Veo generate video WITH integrated sound. Every vidPrompt_EN MUST end with a detailed Audio section.
Describe sounds texturally and cinematically:
"heavy resonant metallic clang with 2-second reverb tail" / "wet fabric tearing, slow, close-mic" /
"sub-bass drone rising from absolute silence to full chest pressure" /
"crackling candle wick in intimate silence, no ambient" /
"distant rhythmic heartbeat, barely audible, growing louder with each cut" /
"eerie silence broken by single drop of water on stone, 3-second reverb"
FORMAT: Audio: [primary SFX + texture] + [ambient layer] + [silence or transition cue]
NO audio tags in imgPrompt_EN or thumbnail.

━━━ RULE 3: PHYSICS OF LIGHT AND PARTICLES — Required in EVERY prompt ━━━
Always describe at least TWO of these light-environment interactions per frame:
— volumetric fog: "shafts of torchlight piercing dense fog, God rays visible"
— dust particles: "golden dust motes drifting through shaft of morning light"
— heat distortion: "air shimmering and warping above open flame, background blurring"
— subsurface scattering: "candlelight glowing warmly through thin parchment, veins faintly visible"
— chiaroscuro: "single candle key light, deep shadow consuming 70% of frame, hard shadow edges on stone"

━━━ RULE 4: NSFW BYPASS PROTOCOL ━━━
Read the bypass_method field from the storyboard frame and apply the correct method.
NEVER use in any prompt: blood, gore, cut flesh, torture, corpse, dead body, killing, naked, nude, violence.

METHOD A — "Implicit Horror" (maintains photorealism):
Conceal violence off-screen. Show: shadows on wet stone wall, macro of dirty iron implements,
clenched fists, whitened knuckles, face contorted in silent scream in deep shadow,
dark liquid pooling on floor without naming it.
Example: "shadow of raised iron implement elongated across wet flagstone, torchlight flickering — no direct action visible, only aftermath implied by shadow geometry"

METHOD B — "Material Substitution" (surrealism/metaphor):
Replace living flesh with inanimate material: CRUMBLING MARBLE STATUE or CRACKING PORCELAIN DOLL.
Instead of red blood: flowing thick BLACK OIL, liquid GOLD seeping through cracks, RED PAINT splattering on white surface.
Example: "porcelain doll surface fractures inward under pressure, thick black oil seeps through hairline cracks, pools on cold stone floor, subsurface scattering through thin porcelain shell"

METHOD C — "Scientific / Historical Art" (medium switch):
Switch visual style entirely:
— X-Ray / medical visualization: "X-ray imaging style, skeletal structure highlighted neon blue, black background, scientific overlay annotations"
— Thermal infrared: "thermal camera footage, heat signatures orange and white, cold surfaces deep blue, eerie clinical distance"
— Animated historical art: "animated medieval illuminated manuscript style, gold leaf border, red ink spreading across aged parchment, hand-drawn figure in devotional pose"
— Da Vinci anatomical: "animated Da Vinci anatomical sketch style, sepia ink on aged paper, anatomical cross-section coming alive with motion"

If bypass_method is "none" — use safe photorealistic cinematic description normally.

━━━ RULE 5: PERFECT PROMPT STRUCTURE (VEO / GROK FORMAT) ━━━
Every prompt follows this STRICT formula:
[Style/Medium] + [Shot type & Camera movement] + [Subject + DNA anchor verbatim if present] + [Physical action 3-5 seconds] + [Light physics + particles] + [Technical realism tags]
Video only: + Consistency Footer + Audio: [SFX]

STYLE/MEDIUM — determine from styleRef engine field in storyboard:
— CINEMATIC engine: "RAW photograph, Arri Alexa 35mm anamorphic lens, photorealistic, real skin texture, visible pores, film grain ISO 800, slight handheld shake, subsurface scattering, film halation, chromatic aberration"
— DARK_HISTORY engine: "RAW photograph, photorealistic, dark history grunge, gritty realism, dirty 16mm film grain, heavy vignette, harsh chiaroscuro, desaturated color grade, no CGI, no 3D render"
— ANIMATION_2_5D engine: "2.5D stylized 3D render, Pixar-Ghibli aesthetics, warm painterly soft lighting, expressive character design, consistent stylized look" (NO realism tokens)
— X_RAY engine: "x-ray exploded view, neon wireframe internal structure, pure black background, scientific blueprint diagram, glowing technical annotation" (NO skin/realism tokens)

DNA INJECTION RULE: If character is in characters_in_frame, inject their dna verbatim at Subject position. Never paraphrase or abbreviate DNA. Copy word-for-word.

CONSISTENCY FOOTER (end of every vidPrompt_EN, before Audio):
"maintain absolute visual consistency with previous frames, same actor same costume locked appearance throughout sequence, no character drift, consistent color grading, locked camera exposure."

BANNED TOKENS (absolute — in ALL prompts):
masterpiece, best quality, 8k, ultra HD, beautiful, stunning, CGI (except Method C), 3D render (except Method C), anime (except Method C), perfect skin, smooth skin, plastic skin, blood, gore, torture, naked, nude

━━━ THUMBNAIL RULES ━━━
MANDATORY PREFIX: "TALL VERTICAL PORTRAIT ORIENTATION, "
No audio tags in thumbnail. Direct eye contact with camera. Hook object sharp in foreground.
Face fills upper 60% of frame. Shallow depth of field. Rule of thirds.

JSON FORMAT — output ONLY this structure, no text outside:
{
  "frames_prompts": [
    {
      "director_note": "1 sentence in Russian: why this angle was chosen, which bypass method and why, how audio amplifies the emotion of this specific scene",
      "imgPrompt_EN": "[Style/Medium per engine], [Shot type + camera movement], [Subject + DNA verbatim if character present], [Physical position/action SAFE vocabulary 3-5 seconds], [Light physics: volumetric/subsurface/chiaroscuro — min 2], [atmosphere 5-7 words], photorealistic, depth of field, film grain, subsurface scattering",
      "vidPrompt_EN": "[Style/Medium per engine], [Shot type + camera movement], [Subject + DNA verbatim if character], [Physical action 3-5 seconds SAFE vocabulary], [Light physics + particles — min 2], [atmosphere], photorealistic, depth of field. Consistency footer. Audio: [primary SFX + texture + reverb] + [ambient layer] + [silence or transition cue]"
    }
  ],
  "b_rolls": [
    "[Style/Medium per engine], macro shot of [safe environmental object + material detail + condition], [light physics: subsurface/volumetric/dust], [atmosphere 4-5 words]. Audio: [ambient texture SFX]",
    "[Style/Medium per engine], extreme close-up of [safe environment detail], [specific light interaction], [mood 3-4 words]. Audio: [ambient SFX]"
  ],
  "thumbnail_prompt_EN": "TALL VERTICAL PORTRAIT ORIENTATION, [Style/Medium per engine], no text, no watermarks, no letters, no subtitles, [Shot type], [Subject + DNA verbatim], direct eye contact with camera, hook object sharp in foreground, shallow depth of field, rule of thirds, face fills upper 60% of frame, [atmosphere + chiaroscuro + light physics 6-8 words], photorealistic, film grain, visible skin pores, subsurface scattering"
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
          "Content-Type": "application/json"
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
      try { data = JSON.parse(textRes); } catch (e) { throw new Error(`Сервер вернул не JSON: ${textRes.substring(0, 120)}`); }
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
      headers: { "Content-Type": "application/json" },
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
        "Content-Type": "application/json"
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

export default function Page() {
  const [tokens, setTokens] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [siteUnlocked, setSiteUnlocked] = useState(false);
  
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
      if (savedHist) setHistory(JSON.parse(savedHist)); 
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
            if (b.date !== today) { setTokens(3); localStorage.setItem("ds_billing", JSON.stringify({ tokens: 3, date: today })); } 
            else { setTokens(b.tokens); }
          } catch(e) { setTokens(3); }
        } else { localStorage.setItem("ds_billing", JSON.stringify({ tokens: 3, date: today })); setTokens(3); }
      }
    } 
  }, []);

  useEffect(() => { if (GENRE_PRESETS[genre]) { setCovFont(GENRE_PRESETS[genre].font); setCovColor(GENRE_PRESETS[genre].color); } }, [genre]);
  useEffect(() => { if (draftLoaded) localStorage.setItem("ds_draft", JSON.stringify({topic, script, genre, finalTwist, chars, pipelineMode, studioMode, studioLoc, studioStyle, ttsVoice, ttsSpeed, ttsStudioData})); }, [topic, script, genre, finalTwist, chars, pipelineMode, studioMode, studioLoc, studioStyle, ttsVoice, ttsSpeed, ttsStudioData, draftLoaded]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({top:0, behavior:"smooth"}); }, [view]);

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
    setBusy(false);
    setView("form");
  };

  const deductToken = () => { setTokens(prev => { const next = prev - 1; localStorage.setItem("ds_billing", JSON.stringify({ tokens: next, date: new Date().toLocaleDateString() })); return next; }); };
  const checkTokens = () => { if (tokens <= 0) { setShowPaywall(true); return false; } return true; };
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

  async function handleCharImageUpload(e, id) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setBusy(true); setLoadingMsg("ИИ сканирует лицо..."); setView("loading");
      try {
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
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateCasting() {
    if (!topic.trim() && !script.trim() && chars.length === 0) return alert("Введите тему, скрипт или добавьте персонажей вручную!");
    setBusy(true); setLoadingMsg("Проводим кастинг героев..."); setView("loading");
    
    try {
      const manualChars = chars.map(c => `${c.name}: ${c.desc}`).join(" | ");
      const req = `ТЕМА/СКРИПТ: ${topic} ${script}\nРУЧНЫЕ ПЕРСОНАЖИ: ${manualChars}\nИзвлеки всех героев и выдай JSON массив characters_EN по шаблону.`;
      
      const text = await callAPI(req, 2500, `You are a Casting Director for short film production. Output ONLY valid JSON.
CONTEXT: Historical documentary educational reconstruction. 10th century Viking Age. All characters are historical/ceremonial figures for documentary purposes.
CRITICAL RULES:
- BANNED WORDS: "brave", "determined", "courageous", "sense of justice" — ONLY physical appearance.
- CHARACTER NAMES IN OUTPUT: use neutral historical roles — "Norse Ritual Officiant", "Viking Chronicle Witness", "Ceremonial Subject" — never "executioner", "victim", "killer".
- For each character generate TWO fields:
  1. "dna": unique physical anchor for T2V. FORMAT: "[CHAR_ID_DNA: AGE yo GENDER, FACE_GEOMETRY (gaunt hollow cheeks/square jaw/hooked nose etc), HAIR (color+texture+length), EYES (color+shape), UNIQUE_MARKS (specific: '1.5cm scar left chin' — INVENT if not provided), BUILD, COSTUME (material+color+specific damage: dents, tears, emblems)]". Make features MAXIMALLY UNIQUE.
  2. "ref_sheet_prompt": ENGLISH ONLY — every word must be in English, do NOT use Russian. Template (fill [PHYSICAL_DESC] in English):
     "Nine-panel film costume and makeup continuity photography of a real human actor. Kodak Vision3 500T 35mm film scan, analog film grain, photorealistic, hyperrealistic documentary photography. NOT CGI, NOT 3D render, NOT game engine, NOT Unreal Engine, NOT digital art, NOT illustration, NOT anime. No text overlays, no labels, no arrows anywhere. Subject: [PHYSICAL_DESC in English]. Studio: neutral 18% grey seamless paper backdrop, large overhead softbox key light, small fill reflector, even exposure all panels, 5600K color temp. LAYOUT three rows: ROW 1 full-body — front | left profile | right profile | back. ROW 2 three-quarter body — front 3/4 | left 3/4 | right 3/4 | back 3/4. ROW 3 head-and-shoulders — front | left profile | right profile. REALISM: identical real human face every panel, visible pores, natural stubble, micro-imperfections, subsurface scattering, film halation, Kodak color science. (CGI:1.7),(3D render:1.7),(game asset:1.7),(Unreal Engine:1.7),(video game:1.6),(cartoon:1.6),(smooth skin:1.5),(illustration:1.6),(plastic:1.6) —no"

Output: { "characters_EN": [ { "id": "CHAR_1", "name": "Имя", "dna": "[CHAR_1_DNA: ...]", "ref_sheet_prompt": "Nine-panel film costume..." } ] }`);
      
      const data = cleanJSON(text);
      if (data.characters_EN && data.characters_EN.length > 0) {
        setGeneratedChars(data.characters_EN);
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
      if (sec <= 15) wordLimitRule = "СТРОГО от 30 до 40 слов";
      else if (sec <= 40) wordLimitRule = "СТРОГО от 70 до 90 слов";
      else if (sec <= 60) wordLimitRule = "СТРОГО 130-150 слов. Опиши атмосферу подробно, минимум 4-5 длинных абзацев. Меньше 12 предложений КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО!";
      else wordLimitRule = `СТРОГО около ${Math.floor(sec * 2.2)} слов. Обязательно длинные, детализированные абзацы.`;

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

      const sysTxt = `You are 'Director-X' — elite viral documentary writer (100M+ views). Write voiceover in ${lang === "RU" ? "RUSSIAN" : "ENGLISH"}. Genre: ${genre}. Output ONLY valid JSON: { "script": "..." }

${structureRule}

━━━ ФОРМУЛА «АДРЕНАЛИН» — 10 ЗАКОНОВ ВИРУСНОГО СТОРИТЕЛЛИНГА ━━━

LAW 1 — СМЕРТЬ В ПЕРВОЙ СТРОКЕ:
Начинай С СЕРЕДИНЫ ДЕЙСТВИЯ или с ШОКИРУЮЩЕГО ФИНАЛА. Никогда с предыстории.
БАН НАВСЕГДА: "В этой истории...", "Знаете ли вы...", "В начале...", "Однажды...", "Мало кто знает..."
ПЛОХО: "История о человеке, который исчез."
ХОРОШО: "Его нашли спустя 40 лет — и он всё ещё дышал."

LAW 2 — SHOW, DON'T TELL (Сенсорные триггеры):
НИКОГДА не называй эмоцию — ПОКАЗЫВАЙ её через тело: жар, боль, запах, звук, вкус.
ПЛОХО: "Он испытывал сильный страх."
ХОРОШО: "Холодный пот стекал по спине. Пальцы не слушались. Мышцы — бетон."
ПЛОХО: "Тело стало беспомощным."
ХОРОШО: "Он бился в агонии, пока не закончился кислород."
ПЛОХО: "Ситуация была невыносимой."
ХОРОШО: "Зубы стиснуты до хруста. Ногти — в кровь. Тело не слушалось."
ФОРМУЛА: [эмоция/состояние] → [биология + физика + материал + цифра + звук]

LAW 3 — РИТМИКА 1-2-3 (Метод рубки):
Чередуй строго: КОРОТКОЕ (2-3 слова) → СРЕДНЕЕ (7-10 слов) → УДАР (цифра или шок).
ЗАПРЕЩЕНО: деепричастные обороты, причастные обороты, больше 2 запятых в предложении.
ЗАПРЕЩЕНО: "итак", "следовательно", "однако", "в связи с тем что", "несмотря на то что".
ПЛОХО: "Несмотря на то что условия были крайне тяжёлыми, они продолжали..."
ХОРОШО: "Условия — ад. Температура минус сорок. Выжил один из девяти."

LAW 4 — УБЕРИ ВОДУ:
Удаляй все вводные слова-паразиты: "итак", "следовательно", "стоит отметить", "можно сказать", "по сути", "на самом деле", "в целом". Каждое предложение = действие или факт. Ноль воды.

LAW 5 — ЛОГИКА И ПРАВДОПОДОБНОСТЬ:
Если в теме нереалистичные факты — адаптируй САМОСТОЯТЕЛЬНО без предупреждений.
Либо превращай в метафору, либо подавай как жуткую легенду/аномалию. Никогда не пиши "[АДАПТИРОВАНО]" или подобные пометки.

LAW 6 — ФИЗИКА ПРОЦЕССА:
Объясняй КАК, а не ЧТО. Обязательно: вес / материал / скорость / температура / звук / цифра.
ПЛОХО: "Звезда взорвалась."
ХОРОШО: "Ядро сжалось до 20км за 0.2 секунды — энергия в 100 раз больше всего Млечного пути."

LAW 7 — ДОБАВЬ НАПРЯЖЕНИЕ (каждая фраза = крючок):
Каждое предложение должно заставлять зрителя задать вопрос "А что дальше?". Никогда не давай полный ответ сразу. Веди через интригу.

LAW 8 — PATTERN INTERRUPT:
Каждые 3-4 фразы — смена ритма или угла атаки. Неожиданный поворот, смена масштаба или временной скачок.

LAW 9 — КАПСЛОК = ВИЗУАЛЬНЫЙ ЯКОРЬ:
1-2 слова в каждом блоке КАПСЛОКОМ = картинка на экране для монтажёра.

LAW 10 — ФИНАЛ-CTA (ОБЯЗАТЕЛЬНО):
Последняя фраза = ОДНО из трёх:
— Провокационный факт, делящий аудиторию на 2 лагеря ("Одни считают это геноцидом. Другие — спасением цивилизации.")
— Незакрытая интрига, намекающая на продолжение ("Но это был только первый уровень. Второй — ещё страшнее.")  
— Вопрос, провоцирующий спор в комментариях ("Если бы ты был на его месте — ты бы выбрал то же самое?")
БАН: мораль, резюме, "итак мы узнали", риторические вопросы типа "Так стоит ли...?"

LAW 11 — ОБЪЁМ И ФОРМАТ:
Объём: ${wordLimitRule}. КРИТИЧНО!
${finalTwist ? `Скрытый твист: ${finalTwist}` : ""}
NO MARKDOWN: никаких ** в тексте. Акценты — только КАПСЛОКОМ.

БАН-ЛИСТ: "погрузимся", "давайте", "невероятно", "поразительно", "мало кто знает", "интересный факт", "таким образом", "подведём итог", "мужество", "легендарный", "удивительный", "героический", "феноменальный", "огонь в глазах", любые риторические вопросы в финале.`;
      
      const manualChars = chars.map(c => `${c.name}: ${c.desc}`).join(" | ");
      const text = await callAPI(`Тема: ${topic}\nПерсонажи: ${manualChars}`, 3000, sysTxt);
      const data = cleanJSON(text);
      
      if (data && data.script) {
        setScript(data.script.replace(/Диктор:\s*/gi, "").trim());
      } else {
        setScript(text.replace(/Диктор:\s*/gi, "").trim());
      }
      setHooksList([]);
    } catch(e) { alert("🚨 ОШИБКА: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleBoostScript() {
    if (!script.trim()) return alert("Сначала напишите или вставьте текст сценария!");
    setBusy(true); setLoadingMsg("⚡ Усиливаем текст по вирусным законам..."); setView("loading");
    try {
      const sec = DURATION_SECONDS[dur] || 60;
      let wordLimitRule = "";
      if (sec <= 15) wordLimitRule = "СТРОГО от 30 до 40 слов";
      else if (sec <= 40) wordLimitRule = "СТРОГО от 70 до 90 слов";
      else if (sec <= 60) wordLimitRule = "СТРОГО 130-150 слов";
      else wordLimitRule = `СТРОГО около ${Math.floor(sec * 2.2)} слов`;

      const boostSys = `You are 'Director-X' — elite viral rewriter (100M+ views). Output ONLY valid JSON: { "script": "..." }

ЗАДАЧА: ПЕРЕПИСАТЬ сценарий сохранив ВСЕ факты, хронологию и смысл. Применить формулу АДРЕНАЛИН полностью.

LAW 1 — СМЕРТЬ В ПЕРВОЙ СТРОКЕ:
Первая фраза начинается с предыстории или контекста? УДАЛИ — начни с середины действия или шокирующего финала.
БАН: "В этой истории...", "Знаете ли вы...", "В начале...", "Однажды...", "История о том..."
ПЛОХО: "История о человеке, который исчез."
ХОРОШО: "Его нашли спустя 40 лет — и он всё ещё дышал."

LAW 2 — SHOW, DON'T TELL (Замени бледные слова на кинематографичные):
НИКОГДА не называй эмоцию — ПОКАЗЫВАЙ через физику тела: боль, жар, звук, запах, вес.
ПЛОХО: "Он испытывал ужас." → ХОРОШО: "Сердце — 180 ударов. Руки — лёд. Воздух не шёл."
ПЛОХО: "Это было невыносимо." → ХОРОШО: "Зубы — в крошку. Ногти — в мясо. 38 минут."
ПЛОХО: "Они победили." → ХОРОШО: "Трое выжили. Остальные — в яме под церковью."
ФОРМУЛА: [эмоция/состояние] → [биология + материал + цифра + звук]

LAW 3 — РИТМИКА 1-2-3 (Метод рубки фраз):
Чередуй СТРОГО: ОЧЕНЬ КОРОТКОЕ (2-3 слова) → СРЕДНЕЕ (7-10 слов) → УДАР (цифра или шок).
УДАЛИ все деепричастные и причастные обороты. Максимум 2 запятых в предложении.
ПЛОХО: "Несмотря на то что погода была ужасной, солдаты продолжали наступать."
ХОРОШО: "Погода — ад. Минус сорок пять. Каждый шаг — через мертвеца."

LAW 4 — УБЕРИ ВОДУ (Нулевая толерантность к пустым словам):
НАЙДИ И УДАЛИ все слова-паразиты: "итак", "следовательно", "однако", "стоит отметить",
"можно сказать", "по сути", "на самом деле", "в целом", "таким образом", "следует добавить".
Каждое предложение = конкретное действие или факт. НОЛЬ воды.

LAW 5 — ЛОГИКА И ПРАВДОПОДОБНОСТЬ:
Нереалистичные факты адаптируй САМОСТОЯТЕЛЬНО без предупреждений и пометок.
Превращай в метафору или подавай как жуткую легенду/аномалию.

LAW 6 — ДОБАВЬ НАПРЯЖЕНИЕ (каждая фраза = крючок):
Каждое предложение должно заставлять спросить "А что дальше?". Никогда не давай полный ответ сразу.

LAW 7 — ФИЗИКА ПРОЦЕССА:
Каждое событие = механизм. Добавь: вес / скорость / температура / звук / цифра / материал.

LAW 8 — КОНТРАСТ МАТЕРИАЛОВ:
Минимум 2 столкновения противоположных материалов: Сталь↔Грязь / Золото↔Кровь / Лёд↔Огонь.

LAW 9 — ФИНАЛ-CTA (ОБЯЗАТЕЛЬНО ЗАМЕНИТЬ):
Риторический вопрос или мораль → заменить на ОДНО из:
— Провокационный факт, делящий на 2 лагеря
— Незакрытая интрига, намекающая на продолжение ("Но это был только первый уровень...")
— Вопрос, провоцирующий спор ("Если бы ты был на его месте — что выбрал бы ты?")

LAW 10 — NO MARKDOWN: Убери все ** из текста. Акценты — только КАПСЛОКОМ.

ОБЪЁМ: ${wordLimitRule}.
БАН-ЛИСТ: "погрузимся", "давайте", "невероятно", "удивительно", "мало кто знает", "феноменальный", "героический", "мужество", "легендарный", "огонь в глазах", "уникальный".`;

      const text = await callAPI(`ОРИГИНАЛЬНЫЙ ТЕКСТ ДЛЯ ПЕРЕРАБОТКИ:\n\n${script}`, 3500, boostSys);
      const data = cleanJSON(text);
      if (data && data.script) {
        setScript(data.script.replace(/Диктор:\s*/gi, "").trim());
      }
    } catch(e) { alert("🚨 ОШИБКА УСИЛЕНИЯ: " + e.message); } finally { setBusy(false); setView("form"); }
  }

  async function handleGenerateTTSStudio() {
    if (!checkTokens()) return;
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
      deductToken();
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
    let imgTxt = s2done ? frms.map(f => f.imgPrompt_EN).filter(Boolean).join("\n\n") : "";
    let vidTxt = s2done ? frms.map(f => f.vidPrompt_EN).filter(Boolean).join("\n\n") : "";
    setRawScript(scriptTxt); setRawImg(imgTxt); setRawVid(vidTxt);
  }

  async function handleStep1() {
    if (!topic.trim() && !script.trim()) return alert("Заполните тему или скрипт!");
    if (!checkTokens()) return;
    
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
      const rawTargetFrames = Math.floor(sec / 3);
      const targetFrames = rawTargetFrames; // без ограничений
      
      setLoadingMsg("🎬 Шаг 1/2: Пишем раскадровку и ДНК персонажей...");
      const preGeneratedChars = generatedChars.length > 0 ? JSON.stringify(generatedChars) : JSON.stringify(chars);
      const studioInfo = studioMode === "MANUAL" ? `ВВОДНЫЕ СТУДИИ: Локация [${studioLoc}], Стиль [${studioStyle}]. НЕ МЕНЯЙ ИХ!` : "ВВОДНЫЕ СТУДИИ: Автоматически.";

      // БАТЧ-ГЕНЕРАЦИЯ раскадровки
      // Каждый батч = отдельный лёгкий запрос к серверу
      // 10 кадров * ~150 токенов = ~1500 токенов на батч → быстро и стабильно
      const BATCH_SIZE = 10;
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

        const batchReq = isFirstBatch
          ? `LANGUAGE: ${lang === "RU" ? "РУССКИЙ" : "ENGLISH"}.\nТЕМА: ${topic}. ЖАНР: ${genre}.\n${studioInfo}\nПЕРСОНАЖИ: ${preGeneratedChars}.\nСЦЕНАРИЙ (кадры ${batchStart}–${batchEnd}): ${scriptChunk}.\nВЫДАЙ СТРОГО JSON! 3 СЕК/КАДР. РОВНО ${batchCount} КАДРОВ. Тайм-коды с ${timecodeStart} сек.`
          : `LANGUAGE: ${lang === "RU" ? "РУССКИЙ" : "ENGLISH"}.\nПРОДОЛЖЕНИЕ. ЖАНР: ${genre}.\nПЕРСОНАЖИ: ${JSON.stringify(data1A.characters_EN || [])}.\nЛОКАЦИЯ: ${data1A.location_ref_EN || ""}.\nСЦЕНАРИЙ (кадры ${batchStart}–${batchEnd}): ${scriptChunk}.\nВЫДАЙ СТРОГО JSON! РОВНО ${batchCount} КАДРОВ. Тайм-коды с ${timecodeStart} сек. Используй тех же персонажей.`;

        const batchSys = isFirstBatch
          ? SYS_STEP_1A
          : `${SYS_STEP_1A}\nIMPORTANT: Continuation batch ${batch+1}/${totalBatches}. Output JSON with ONLY "frames" array. Reuse existing characters_EN. Timecodes start from ${timecodeStart} sec.`;

        let batchText, batchData;
        try {
          batchText = await callAPI(batchReq, 3500, batchSys, MODEL_FAST);
          batchData = cleanJSON(batchText);
        } catch(fastErr) {
          // Fallback: MODEL_FAST отказал или вернул не-JSON — повторяем через MODEL_STD (Claude)
          setLoadingMsg(`🔄 Батч ${batch+1}/${totalBatches}: переключаемся на резервную модель...`);
          batchText = await callAPI(batchReq, 3500, batchSys, MODEL_STD);
          batchData = cleanJSON(batchText);
        }

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
      // Токен НЕ списываем здесь — только после успешного Шага 2
      setBgImage(null); 
      setTab("storyboard"); 
      setView("result");
      
      const stateData = { frames: data1A.frames, generatedChars: data1A.characters_EN, locRef: data1A.location_ref_EN, styleRef: data1A.style_ref_EN, retention: data1A.retention, thumb: data1B.thumbnail, seoVariants: data1B.seo_variants, music: data1B.music_EN, step2Done: false, ttsStudioData };
      const newHistory = [{ id: Date.now(), topic: topic || "Генерация", time: new Date().toLocaleString("ru-RU"), text: JSON.stringify(stateData), format: vidFormat }, ...history].slice(0, 10);
      setHistory(newHistory); localStorage.setItem("ds_history", JSON.stringify(newHistory));
      
    } catch(e) { alert(`🚨 ОШИБКА ШАГА 1: ${e.message}`); setView("form"); } finally { setBusy(false); }
  }

  async function handleStep2(resumeFrom = null) {
    if (!checkTokens()) return;
    setBusy(true); setView("loading");

    // Прогреваем сервер — между Шагом 1 и 2 пользователь изучает раскадровку,
    // за это время Render Free успевает заснуть снова (< 15 мин без запросов)
    setLoadingMsg("🔄 Проверяем соединение... 💎 API не тратится");
    await warmupServer(() => setLoadingMsg("😴 Сервер просыпается (~15 сек)... 💎 API ещё не тратится, ждите!"));
    setLoadingMsg(`🪄 Шаг 2: Генерируем PRO-промпты (${pipelineMode} режим)...`);

    try {
      const charDnaDict = {};
      generatedChars.forEach(c => { if (c.dna) charDnaDict[c.id] = c.dna; });
      const charsDict = generatedChars.map(c => `${c.id} DNA: ${c.dna || c.ref_sheet_prompt}`).join("\n");
      const textToRender = thumb?.text_for_rendering ? `\n\nNATIVE CYRILLIC REQUIRED: text_for_rendering = "${thumb.text_for_rendering}"` : "";
      
      const pipelineDirective = pipelineMode === "I2V" 
        ? "PIPELINE_MODE = I2V (Studio). Keep 'vidPrompt_EN' very short — ONLY action and camera movement."
        : "PIPELINE_MODE = T2V (Direct). 'vidPrompt_EN' = [DNA_BLOCK] + [Location] + [Action] + [Camera].";

      const PROMPT_BATCH = 5;
      const totalPromptBatches = Math.ceil(frames.length / PROMPT_BATCH);

      // Восстанавливаем уже оплаченные батчи если это продолжение после ошибки
      let allPrompts = resumeFrom ? [...resumeFrom.prompts] : [];
      let thumbnailPromptRaw = resumeFrom ? (resumeFrom.thumbRaw || "") : "";
      let finalBRolls = resumeFrom ? (resumeFrom.brolls || []) : [];
      const startBatch = resumeFrom ? resumeFrom.fromBatch : 0;

      if (resumeFrom) {
        setStep2Partial(null); // Сбрасываем partial — начинаем продолжение
      }

      for (let batch = startBatch; batch < totalPromptBatches; batch++) {
        const bStart = batch * PROMPT_BATCH;
        const bEnd = Math.min(bStart + PROMPT_BATCH, frames.length);
        const batchFrames = frames.slice(bStart, bEnd);
        const isLastBatch = batch === totalPromptBatches - 1;

        setLoadingMsg(`🎥 Промпты: кадры ${bStart+1}–${bEnd} из ${frames.length} (${batch+1}/${totalPromptBatches})`);

        const batchStoryboard = batchFrames.map((f, i) => 
          `Frame ${bStart+i+1}: Visual: ${f.visual} | Voice: ${f.voice||""} | SFX: ${f.sfx||""} | Chars: ${(f.characters_in_frame || []).join(",")}`
        ).join("\n");

        const batchReq = `PIPELINE RULE:\n${pipelineDirective}\n\nSTORYBOARD (frames ${bStart+1}–${bEnd}):\n${batchStoryboard}\n\nCHARACTERS:\n${charsDict}\n\nLOCATION:\n${locRef}${isLastBatch ? textToRender : ""}\n\nGenerate exactly ${batchFrames.length} prompts.${isLastBatch ? "\nAlso generate thumbnail_prompt_EN." : "\nSkip thumbnail_prompt_EN."}`;

        let batchData;
        try {
          // 150 сек таймаут для тяжёлых промпт-батчей, 2 ретрая
          const batchText = await callAPI(batchReq, 6000, SYS_STEP_2, MODEL_FAST, 2, 150000);
          batchData = cleanJSON(batchText);
        } catch(fastErr) {
          // Fallback: MODEL_FAST отказал или вернул не-JSON — пробуем MODEL_STD
          let batchTextFallback;
          try {
            setLoadingMsg(`🔄 Батч ${batch+1}/${totalPromptBatches}: переключаемся на резервную модель...`);
            batchTextFallback = await callAPI(batchReq, 6000, SYS_STEP_2, MODEL_STD, 1, 150000);
            batchData = cleanJSON(batchTextFallback);
          } catch(batchErr) {
          // Батч упал — сохраняем УЖЕ ОПЛАЧЕННЫЙ прогресс и сообщаем пользователю
          setStep2Partial({ prompts: allPrompts, fromBatch: batch, totalBatches: totalPromptBatches, thumbRaw: thumbnailPromptRaw, brolls: finalBRolls });
          setBusy(false);
          setView("result");
          alert(`⚠️ Шаг 2 прерван на батче ${batch+1}/${totalPromptBatches} (кадры ${bStart+1}–${bEnd}).\n\n✅ Кадры 1–${bStart} уже готовы и сохранены.\n❌ Кадры ${bStart+1}–${frames.length} не обработаны.\n\n💡 Нажмите кнопку "▶ ПРОДОЛЖИТЬ" чтобы дообработать оставшиеся кадры без повторной оплаты готовых.\n\nОшибка: ${batchErr.message}`);
          return;
          }
        }

        allPrompts = [...allPrompts, ...(batchData.frames_prompts || [])];
        if (isLastBatch && batchData.thumbnail_prompt_EN) {
          thumbnailPromptRaw = batchData.thumbnail_prompt_EN;
        }
        if (isLastBatch) {
          finalBRolls = batchData.b_rolls || [];
          setBRolls(finalBRolls);
        }

        if (batch < totalPromptBatches - 1) await sleep(300);
      }

      // Собираем финальные промпты с DNA и realism prefix
      const engineStyle = VISUAL_ENGINES[engine]?.prompt || "";
      const customText = customStyle ? `, ${customStyle}` : "";
      const finalStyle = `${engineStyle}${styleRef ? ", " + styleRef : ""}${customText}`;
      const realismPrefix = (engine === "CINEMATIC" || engine === "DARK_HISTORY")
        ? "RAW photo, photorealistic, no CGI, no 3D render, no illustration, no plastic skin, no airbrushed skin, film halation, chromatic aberration edges, natural skin sebum sheen, subsurface scattering, film grain ISO 800, "
        : "";

      const updatedFrames = frames.map((f, i) => {
        const p = allPrompts[i] || {};
        const frameChars = f.characters_in_frame || [];
        const dnaBlocks = frameChars.map(cid => charDnaDict[cid]).filter(Boolean).join(", ");
        const dnaPrefix = dnaBlocks ? `${dnaBlocks}, ` : "";

        const rawVid = p.vidPrompt_EN || f.visual;
        const rawImg = p.imgPrompt_EN || f.visual;
        const vidAlreadyHasDna = rawVid.includes("_DNA:");
        const imgAlreadyHasDna = rawImg.includes("_DNA:");

        // Чистим vidPrompt от SD-синтаксиса — Kling/Runway/Sora его не понимают
        const cleanVid = rawVid
          .replace(/\([^)]+:\d+(\.\d+)?\)/g, "")
          .replace(/\s*—no\b/gi, "")
          .replace(/,\s*,/g, ",")
          .trim();

        const vPrompt = vidAlreadyHasDna
          ? `${realismPrefix}${finalStyle}, ${cleanVid}`
          : `${realismPrefix}${dnaPrefix}${finalStyle}, ${cleanVid}`;
        const iPrompt = imgAlreadyHasDna
          ? `${realismPrefix}${finalStyle}, ${rawImg}`
          : `${realismPrefix}${dnaPrefix}${finalStyle}, ${rawImg}`;

        // 🔒 SEED LOCK — фиксируем seed для консистентности между кадрами
        const seedSuffix = seedLocked ? ` --seed ${seedValue}` : "";

        return { ...f, imgPrompt_EN: iPrompt + seedSuffix, vidPrompt_EN: vPrompt + seedSuffix };
      });

      // Чистим thumbnail от ASMR-тегов
      const cleanThumbPrompt = thumbnailPromptRaw
        .replace(/,?\s*clear ASMR audio of[^,.]*/gi, "")
        .replace(/,?\s*isolated sound[^,.]*/gi, "")
        .replace(/,?\s*zero background noise[^,.]*/gi, "")
        .replace(/,?\s*no ambient hum[^,.]*/gi, "")
        .replace(/\.\s*$/, "").trim();
      const finalThumbPrompt = cleanThumbPrompt.includes("no text")
        ? cleanThumbPrompt
        : cleanThumbPrompt + ", no text, no watermarks, no letters, no subtitles, (text:1.5), (watermark:1.5) —no";

      setStep2Partial(null); // Успех — очищаем partial
      setFrames(updatedFrames); 
      setThumb({...thumb, prompt_EN: finalThumbPrompt}); 
      setStep2Done(true);
      
      rebuildRawText(updatedFrames, true); 
      deductToken(); // Токен списывается ТОЛЬКО здесь — только при полном успехе
      setView("result");

      setHistory(prev => {
         const next = [...prev];
         if(next.length > 0) { 
           const stateData = { frames: updatedFrames, generatedChars, locRef, styleRef, retention, thumb: {...thumb, prompt_EN: finalThumbPrompt}, seoVariants, music, bRolls: finalBRolls, step2Done: true, ttsStudioData };
           next[0].text = JSON.stringify(stateData); 
           localStorage.setItem("ds_history", JSON.stringify(next)); 
         }
         return next;
      });
    } catch(e) { alert(`🚨 ОШИБКА ШАГА 2: ${e.message}\n\n💡 Попробуйте ещё раз — уже оплаченные батчи не повторятся.`); setView("result"); } finally { setBusy(false); }
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
            <div style={{fontSize:52,marginBottom:12}}>💎</div>
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
          <div className="token-badge" style={{fontSize:12,fontWeight:900,color:tokens>0?"#34d399":"#ef4444",background:"rgba(255,255,255,.05)",border:`1px solid ${tokens>0?"rgba(52,211,153,.3)":"rgba(239,68,68,.3)"}`,padding:"6px 14px",borderRadius:10,letterSpacing:"0.5px"}}>💎 {tokens}</div>
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

            {/* КУЗНИЦА ПЕРСОНАЖЕЙ */}
            <div className="glass panel" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <label style={{fontSize:10,fontWeight:900,letterSpacing:"2.5px",color:"#f472b6",textTransform:"uppercase"}}>👤 КУЗНИЦА ПЕРСОНАЖЕЙ</label>
                  <button onClick={()=>openInfo('forge')} className="icon-btn" style={{color:"#f472b6",fontSize:13}}>ℹ️</button>
                </div>
                <button onClick={addChar} style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.35)",borderRadius:8,color:"#fbcfe8",padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>➕ ДОБАВИТЬ</button>
              </div>
              {chars.length===0&&<div style={{fontSize:12,color:"#475569",fontStyle:"italic",textAlign:"center",marginBottom:14}}>ИИ сам выберет героев из текста</div>}
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
              <button onClick={handleGenerateCasting} disabled={busy||(!topic.trim()&&!script.trim()&&chars.length===0)} style={{width:"100%",background:"linear-gradient(135deg,rgba(236,72,153,.12),rgba(168,85,247,.12))",border:"1px dashed rgba(236,72,153,.4)",borderRadius:12,padding:12,color:"#fbcfe8",fontSize:11,fontWeight:800,cursor:busy?"not-allowed":"pointer",transition:"all .2s"}}>🧬 СГЕНЕРИРОВАТЬ КАСТИНГ (ДО РАСКАДРОВКИ)</button>
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
                {busy?"⏳ СИСТЕМА В РАБОТЕ...":"🚀 ШАГ 1: РАСКАДРОВКА  (💎 1)"}
              </button>
            </div>

            {/* CREDITS MINI */}
            <div className="desktop-only" style={{background:"rgba(168,85,247,.06)",border:"1px solid rgba(168,85,247,.15)",borderRadius:14,padding:16,textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:8}}>💎</div>
              <div style={{fontSize:22,fontWeight:900,color:tokens>0?"#a855f7":"#ef4444"}}>{tokens}</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{tokens>0?"генераций сегодня":"Лимит исчерпан"}</div>
            </div>

          </div>
        </div>
      )}

      {/* ── MOBILE STICKY CTA ─────────────────────────────────────── */}
      {view==="form"&&(
        <div className="mobile-only" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,padding:"14px 16px 24px",background:"linear-gradient(to top,rgba(5,5,10,1) 60%,transparent)",zIndex:100}}>
          <button className={`gbtn${(topic.trim()||script.trim())&&!busy?" pulsing":""}`} onClick={handleStep1} disabled={(!script.trim()&&!topic.trim())||busy}>
            {busy?"⏳ СИСТЕМА В РАБОТЕ...":"🚀 ШАГ 1: СОЗДАТЬ РАСКАДРОВКУ (💎 1)"}
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
          <div style={{fontSize:12,color:"#475569",marginBottom:32,fontFamily:"monospace"}}>~ 15–40 сек</div>

          <div style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",borderRadius:14,padding:"14px 20px",maxWidth:300,marginBottom:28}}>
            <div style={{fontSize:11,color:"#fcd34d",fontWeight:700,marginBottom:6}}>💡 Совет пока ждёшь</div>
            <div style={{fontSize:11,color:"#fef3c7",lineHeight:1.6}}>Если генерация часто падает — уменьши длительность до «До 60 сек» или «30–45 сек»</div>
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

          {/* THUMBNAIL PROMPT */}
          {step2Done&&thumb?.prompt_EN&&(
            <div className="hover-lift" style={{background:"rgba(220,38,38,.08)",border:"2px dashed rgba(239,68,68,.5)",borderRadius:20,padding:20,marginBottom:20,boxShadow:"0 0 24px rgba(220,38,38,.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:900,color:"#fca5a5",textTransform:"uppercase",letterSpacing:"1px"}}>🖼 PRO-ПРОМПТ ДЛЯ ФОНА ОБЛОЖКИ</span>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {seedLocked&&<div style={{fontSize:9,color:"#f59e0b",background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",padding:"2px 8px",borderRadius:10,fontWeight:900}}>🔒 SEED {seedValue}</div>}
                  <CopyBtn text={thumb.prompt_EN}/>
                </div>
              </div>
              <div style={{fontSize:13,fontFamily:"monospace",color:"#fecaca",lineHeight:1.5,background:"rgba(0,0,0,.5)",padding:14,borderRadius:10}}>{thumb.prompt_EN}</div>
              <div style={{marginTop:10,fontSize:11,color:"#f87171",textAlign:"center"}}>☝️ Скопируйте в видеогенератор для вертикального фона обложки</div>
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
              <button onClick={()=>handleStep2(null)} disabled={busy||!checkTokens()} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#db2777,#9333ea)",borderRadius:14,color:"#fff",fontWeight:900,border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(219,39,119,.4)",fontSize:15,letterSpacing:"0.5px",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>🪄 ШАГ 2: СГЕНЕРИРОВАТЬ PRO-ПРОМПТЫ СЦЕН (💎 1)</button>
            </div>
          )}

          {/* TABS */}
          <div className="hide-scroll" style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:2}}>
            {[["storyboard","🎞 Раскадровка"],["raw","📄 Скрипт и Промпты"],["seo","🚀 Музыка и SEO"],["tts","🎙 TTS Studio"]].map(([t,label])=>(
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

                    {step2Done&&f.imgPrompt_EN&&(
                      <div style={{background:"rgba(16,185,129,.04)",padding:12,borderRadius:10,marginBottom:10,marginTop:step2Done?10:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:9,color:"#34d399",fontWeight:900,letterSpacing:"1.5px"}}>🖼 IMAGE PROMPT</span>
                          <CopyBtn text={f.imgPrompt_EN} small/>
                        </div>
                        <div style={{fontSize:11,fontFamily:"monospace",color:"#6ee7b7",lineHeight:1.5}}>{f.imgPrompt_EN}</div>
                      </div>
                    )}
                    {step2Done&&f.vidPrompt_EN&&(
                      <div style={{background:"rgba(139,92,246,.04)",padding:12,borderRadius:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:9,color:"#a78bfa",fontWeight:900,letterSpacing:"1.5px"}}>🎬 VIDEO PROMPT (GROK / KLING)</span>
                          <CopyBtn text={f.vidPrompt_EN} small/>
                        </div>
                        <div style={{fontSize:11,fontFamily:"monospace",color:"#d8b4fe",lineHeight:1.5}}>{f.vidPrompt_EN}</div>
                        <div style={{marginTop:10,background:"rgba(250,204,21,.04)",border:"1px dashed rgba(250,204,21,.25)",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>🔒</span>
                          <div>
                            <div style={{fontSize:10,fontWeight:900,color:"#fbbf24"}}>SEED LOCK — для сходства лица</div>
                            <div style={{fontSize:10,color:"#fef08a",lineHeight:1.5}}>Запомни seed первого удачного кадра и используй для всех кадров с этим персонажем</div>
                          </div>
                        </div>
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
                    {generatingTTS?"⏳ ГЕНЕРАЦИЯ...":"🎙 СГЕНЕРИРОВАТЬ TTS НАСТРОЙКИ (💎 1)"}
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
                    🔄 Сгенерировать заново (💎 1)
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
