(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function boot() {
    const page = document.querySelector(".qc-page");
    if (!page || document.getElementById("qc-field")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "qc-field";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:0",
      "width:100vw",
      "height:100dvh",
      "display:block",
      "pointer-events:none"
    ].join(";");
    page.prepend(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let particles = [];
    let pulses = [];
    const colors = ["#0066ff", "#00d4ff", "#8b00ff", "#ff00cc", "#ffffff", "#00ff88"];
    const maxParticles = Math.min(86, Math.max(46, Math.round(window.innerWidth / 7)));

    class Particle {
      constructor(randomY = true) { this.init(randomY); }
      init(randomY = true) {
        this.x = Math.random() * width;
        this.y = randomY ? Math.random() * height : -20;
        this.vx = (Math.random() - 0.5) * 0.36;
        this.vy = Math.random() * 0.24 + 0.045;
        this.r = Math.random() * 1.7 + 0.35;
        this.opacity = Math.random() * 0.42 + 0.10;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.phase = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.024 + 0.008;
        this.tunnel = Math.random() > 0.90;
      }
      tick() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += this.speed;
        if (this.tunnel && Math.random() > 0.997) {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
        if (this.x < -30) this.x = width + 30;
        if (this.x > width + 30) this.x = -30;
        if (this.y > height + 24) this.init(false);
      }
      draw() {
        const o = this.opacity * (0.52 + 0.48 * Math.sin(this.phase));
        const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 7);
        halo.addColorStop(0, this.color + "44");
        halo.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 7, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.round(o * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = "100vw";
      canvas.style.height = "100dvh";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!particles.length) {
        particles = Array.from({ length: maxParticles }, () => new Particle(true));
      }
    }

    function pulse(x, y, color = "#00d4ff") {
      pulses.push({ x, y, r: 0, opacity: 0.62, color });
      for (let i = 0; i < 4; i++) {
        const p = new Particle(true);
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 1.8;
        p.vy = (Math.random() - 0.5) * 1.8;
        p.r = Math.random() * 1.6 + 1.2;
        p.color = color;
        particles.push(p);
      }
      if (particles.length > maxParticles + 24) particles.splice(0, particles.length - maxParticles);
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 112) {
            const o = (1 - dist / 112) * 0.13;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, ${Math.round(90 + (1 - dist / 112) * 120)}, 255, ${o})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      drawConnections();
      for (const p of particles) { p.tick(); p.draw(); }

      pulses = pulses.filter(p => {
        p.r += 2.2;
        p.opacity -= 0.014;
        if (p.opacity <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color + Math.round(Math.max(0, p.opacity) * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 1;
        ctx.stroke();
        return true;
      });

      raf = requestAnimationFrame(frame);
    }

    function onClick(e) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      pulse(e.clientX, e.clientY, color);
    }

    resize();
    frame();
    setTimeout(() => pulse(window.innerWidth / 2, Math.min(260, window.innerHeight * 0.25), "#00d4ff"), 350);

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("click", onClick, { passive: true });

    window.__neurocineQuantumCartoonCleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("click", onClick);
      canvas.remove();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
