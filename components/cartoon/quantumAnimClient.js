"use client";

export function initQuantumField(canvas) {
  if (!canvas || typeof window === "undefined") return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const colors = ["#0066ff", "#00d4ff", "#8b00ff", "#ff00cc", "#ffffff", "#00ff88"];
  const maxParticles = 86;
  let width = 0;
  let height = 0;
  let raf = 0;
  let running = true;
  let particles = [];
  let pulses = [];

  class Particle {
    constructor(randomY = true) {
      this.init(randomY);
    }
    init(randomY = true) {
      this.x = Math.random() * width;
      this.y = randomY ? Math.random() * height : -12;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = Math.random() * 0.25 + 0.05;
      this.r = Math.random() * 1.8 + 0.3;
      this.opacity = Math.random() * 0.45 + 0.1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.phase = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 0.025 + 0.008;
      this.quantumTunnel = Math.random() > 0.88;
    }
    tick() {
      this.x += this.vx;
      this.y += this.vy;
      this.phase += this.speed;
      if (this.quantumTunnel && Math.random() > 0.997) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }
      if (this.x < -30) this.x = width + 30;
      if (this.x > width + 30) this.x = -30;
      if (this.y > height + 12) this.init(false);
    }
    draw() {
      const alpha = this.opacity * (0.5 + 0.5 * Math.sin(this.phase));
      const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      glow.addColorStop(0, `${this.color}33`);
      glow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${hex}`;
      ctx.fill();
    }
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = "100vw";
    canvas.style.height = "100dvh";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: maxParticles }, () => new Particle(true));
  }

  function addPulse(x, y, color = "#00d4ff") {
    pulses.push({ x, y, r: 0, color, opacity: 0.6 });
    for (let i = 0; i < 3; i++) {
      const particle = new Particle(true);
      particle.x = x;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 2;
      particle.vy = (Math.random() - 0.5) * 2;
      particle.r = 2;
      particle.color = color;
      particles.push(particle);
    }
    if (particles.length > maxParticles + 30) particles.splice(0, particles.length - maxParticles);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 110) {
          const opacity = (1 - distance / 110) * 0.12;
          const green = Math.round(80 + (1 - distance / 110) * 100);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,${green},255,${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    drawConnections();
    particles.forEach((particle) => {
      particle.tick();
      particle.draw();
    });
    pulses = pulses.filter((pulse) => {
      pulse.r += 2;
      pulse.opacity -= 0.015;
      if (pulse.opacity <= 0) return false;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
      ctx.strokeStyle = `${pulse.color}${Math.round(pulse.opacity * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 1;
      ctx.stroke();
      return true;
    });
    raf = requestAnimationFrame(frame);
  }

  function handleClick(event) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    addPulse(event.clientX, event.clientY, color);
  }

  resize();
  frame();
  window.qPulse = addPulse;
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("click", handleClick, { passive: true });

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("click", handleClick);
    if (window.qPulse === addPulse) delete window.qPulse;
  };
}

export function initWaveCanvas(canvas) {
  if (!canvas || typeof window === "undefined") return { destroy: () => {}, setDuration: () => {} };
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => {}, setDuration: () => {} };
  let duration = 60;
  let phase = 0;
  let raf = 0;
  let running = true;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(220, canvas.offsetWidth || 320);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(40 * dpr);
    canvas.style.height = "40px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    if (!running) return;
    const width = Math.max(220, canvas.offsetWidth || 320);
    const height = 40;
    ctx.clearRect(0, 0, width, height);
    phase += 0.04;
    const factor = duration / 600;
    const points = [];
    for (let x = 0; x <= width; x += 2) {
      const y = height / 2
        + Math.sin(x * 0.04 + phase) * 8 * factor
        + Math.sin(x * 0.09 - phase * 1.5) * 4 * factor
        + Math.sin(x * 0.02 + phase * 0.7) * 6 * factor;
      points.push({ x, y });
    }
    const fill = ctx.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, "rgba(0,180,255,.25)");
    fill.addColorStop(1, "rgba(0,80,255,.03)");
    ctx.beginPath();
    ctx.moveTo(0, height);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = "rgba(0,200,255,.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    },
    setDuration(value) {
      duration = Number(value || 60);
    },
  };
}

export function initTypewriter(element, lines) {
  if (!element || typeof window === "undefined") return () => {};
  const list = Array.isArray(lines) && lines.length ? lines : [
    "Collapsing wave functions into scenes...",
    "Neural pathways → storyboard nodes...",
    "Quantum superposition of creativity...",
    "Entangling characters across dimensions...",
  ];
  let line = 0;
  let char = 0;
  let timer = 0;
  let alive = true;

  function type() {
    if (!alive) return;
    const current = list[line % list.length];
    if (char < current.length) {
      element.textContent = `${current.slice(0, char + 1)}_`;
      char += 1;
      timer = window.setTimeout(type, 40);
    } else {
      timer = window.setTimeout(() => {
        char = 0;
        line += 1;
        type();
      }, 2400);
    }
  }

  type();
  return () => {
    alive = false;
    window.clearTimeout(timer);
  };
}
