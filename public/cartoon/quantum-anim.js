/* ════════════════════════════════════════════════════════════════
   NeuroCine Quantum Cartoon Creator — animation engine
   Particle field + wave canvas + tagline typewriter.
   Чистый ES module, без зависимостей. Подключается из QuantumCartoonCreator
   через useEffect:
     import { initQuantumField, initWaveCanvas, initTypewriter }
       from '/cartoon/quantum-anim.js'  (или из локальной копии)
   Каждая init-функция возвращает destroy() — вызывай в cleanup.
   ════════════════════════════════════════════════════════════════ */

/* ─── PARTICLE FIELD ─── */
export function initQuantumField(canvas){
  if(!canvas) return ()=>{};
  const ctx=canvas.getContext('2d');
  const COLORS=['#0066ff','#00d4ff','#8b00ff','#ff00cc','#ffffff','#00ff88'];
  const N=90;
  let W=0,H=0,particles=[],pulses=[],rafId=null,running=true;

  class P{
    constructor(){this.init(true)}
    init(rand){
      this.x=Math.random()*W;
      this.y=rand?Math.random()*H:-10;
      this.vx=(Math.random()-.5)*.4;
      this.vy=Math.random()*.25+.05;
      this.r=Math.random()*1.8+.3;
      this.op=Math.random()*.45+.1;
      this.col=COLORS[Math.floor(Math.random()*COLORS.length)];
      this.ph=Math.random()*Math.PI*2;
      this.ps=Math.random()*.025+.008;
      this.qt=Math.random()>.88;
    }
    tick(){
      this.x+=this.vx; this.y+=this.vy; this.ph+=this.ps;
      if(this.qt && Math.random()>.997){this.x=Math.random()*W;this.y=Math.random()*H}
      if(this.y>H+10) this.init(false);
    }
    draw(){
      const op=this.op*(0.5+0.5*Math.sin(this.ph));
      const hex=Math.round(op*255).toString(16).padStart(2,'0');
      const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*5);
      g.addColorStop(0,this.col+'33'); g.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r*5,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=this.col+hex; ctx.fill();
    }
  }

  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
  }
  function initP(){
    particles=[];
    for(let i=0;i<N;i++) particles.push(new P());
  }
  function addPulse(x,y,col){pulses.push({x,y,r:0,col,op:.6})}

  function frame(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    // connections
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const p1=particles[i],p2=particles[j];
        const dx=p1.x-p2.x,dy=p1.y-p2.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){
          const op=(1-d/110)*.12;
          const r=Math.round((1-d/110)*100);
          ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
          ctx.strokeStyle=`rgba(0,${80+r},255,${op})`;
          ctx.lineWidth=.5; ctx.stroke();
        }
      }
    }
    particles.forEach(p=>{p.tick();p.draw()});
    pulses=pulses.filter(p=>{
      p.r+=2; p.op-=.015;
      if(p.op<=0) return false;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.strokeStyle=p.col+Math.round(p.op*255).toString(16).padStart(2,'0');
      ctx.lineWidth=1; ctx.stroke();
      return true;
    });
    rafId=requestAnimationFrame(frame);
  }

  function onClick(e){
    const c=COLORS[Math.floor(Math.random()*COLORS.length)];
    addPulse(e.clientX,e.clientY,c);
    for(let i=0;i<3;i++){
      const p=new P(); p.x=e.clientX; p.y=e.clientY;
      p.vx=(Math.random()-.5)*2; p.vy=(Math.random()-.5)*2; p.r=2;
      particles.push(p);
    }
    if(particles.length>N+30) particles.splice(0,3);
  }
  function onResize(){resize(); initP()}

  resize(); initP(); frame();
  window.addEventListener('resize',onResize);
  document.addEventListener('click',onClick);

  // expose pulse for external triggers (step transitions etc.)
  window.qPulse=addPulse;

  return ()=>{
    running=false;
    if(rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize',onResize);
    document.removeEventListener('click',onClick);
    delete window.qPulse;
  };
}

/* ─── WAVE CANVAS (duration slider) ─── */
export function initWaveCanvas(canvas){
  if(!canvas) return {destroy:()=>{}, setDuration:()=>{}};
  const ctx=canvas.getContext('2d');
  let dur=60,t=0,rafId=null,running=true;

  function resize(){
    const dpr=window.devicePixelRatio||1;
    canvas.width=canvas.offsetWidth*dpr;
    canvas.height=40*dpr;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr,dpr);
  }
  function draw(){
    if(!running) return;
    const W=canvas.offsetWidth, H=40;
    ctx.clearRect(0,0,W,H);
    t+=.04;
    const pts=[];
    for(let x=0;x<=W;x+=2){
      const f=dur/600;
      const y=H/2
        + Math.sin(x*.04+t)*8*f
        + Math.sin(x*.09-t*1.5)*4*f
        + Math.sin(x*.02+t*.7)*6*f;
      pts.push({x,y});
    }
    ctx.beginPath(); ctx.moveTo(0,H);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(W,H); ctx.closePath();
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(0,180,255,.25)');
    g.addColorStop(1,'rgba(0,80,255,.03)');
    ctx.fillStyle=g; ctx.fill();
    ctx.beginPath();
    pts.forEach((p,i)=> i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
    ctx.strokeStyle='rgba(0,200,255,.6)';
    ctx.lineWidth=1.5; ctx.stroke();
    rafId=requestAnimationFrame(draw);
  }

  resize(); draw();
  window.addEventListener('resize',resize);

  return {
    destroy(){
      running=false;
      if(rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize',resize);
    },
    setDuration(v){dur=v}
  };
}

/* ─── TAGLINE TYPEWRITER ─── */
export function initTypewriter(el, lines){
  if(!el) return ()=>{};
  const L = lines && lines.length ? lines : [
    'Collapsing wave functions into scenes...',
    'Neural pathways → storyboard nodes...',
    'Quantum superposition of creativity...',
    'Entangling characters across dimensions...'
  ];
  let li=0,ci=0,timer=null,alive=true;
  function type(){
    if(!alive) return;
    if(ci<L[li].length){
      el.textContent=L[li].substring(0,ci+1)+'_';
      ci++;
      timer=setTimeout(type,40);
    }else{
      timer=setTimeout(()=>{ci=0; li=(li+1)%L.length; type()},2400);
    }
  }
  type();
  return ()=>{alive=false; if(timer) clearTimeout(timer)};
}
