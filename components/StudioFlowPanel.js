"use client";

function stepState(active) {
  if (active === "done") return "done";
  if (active === "active") return "active";
  return "idle";
}

function progressFromSteps(steps) {
  const done = steps.filter(s => s.state === "done").length;
  const activeIndex = steps.findIndex(s => s.state === "active");
  const base = activeIndex >= 0 ? activeIndex + 0.48 : done;
  const value = Math.max(done, base);
  return Math.max(8, Math.min(100, (value / Math.max(1, steps.length - 1)) * 82));
}

function StudioFlowCompactStyles() {
  return (
    <style jsx global>{`
      .studio-flow-v62 {
        position: relative;
        overflow: hidden;
        margin: 10px auto 14px;
        width: min(100% - 18px, 860px);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 24px;
        padding: 14px;
        background:
          linear-gradient(145deg, rgba(14,16,27,.90), rgba(7,9,16,.78)),
          radial-gradient(circle at 10% -10%, rgba(168,85,247,.20), transparent 38%),
          radial-gradient(circle at 110% 12%, rgba(250,204,21,.12), transparent 32%);
        box-shadow: 0 18px 64px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(18px);
        animation: sf-enter-v70 .42s ease both;
      }
      .studio-flow-v62::before {
        content: "";
        position: absolute;
        inset: auto -60px -90px auto;
        width: 190px;
        height: 190px;
        border-radius: 999px;
        background: rgba(168,85,247,.12);
        filter: blur(30px);
        animation: sf-orb-v70 4.2s ease-in-out infinite;
        pointer-events: none;
      }
      .sf-head-v62 {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .sf-head-v62 h2 {
        margin: 0;
        font-size: clamp(19px, 4.7vw, 30px);
        line-height: .98;
        letter-spacing: -.055em;
      }
      .sf-kicker-v62 {
        margin-bottom: 5px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .sf-access-v62 {
        flex: none;
        min-width: 112px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 17px;
        padding: 9px 11px;
        background: rgba(255,255,255,.055);
        text-align: right;
      }
      .sf-access-v62 span {
        display: block;
        margin-bottom: 3px;
        color: rgba(238,240,248,.48);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .sf-access-v62 strong {
        display: block;
        color: #facc15;
        font-size: 12px;
        line-height: 1.05;
        text-shadow: 0 0 18px rgba(250,204,21,.28);
      }
      .sf-steps-v62 {
        --sf-progress: 8%;
        position: relative;
        display: grid;
        gap: 7px;
        padding-left: 28px;
      }
      .sf-steps-v62::before {
        content: "";
        position: absolute;
        left: 10px;
        top: 14px;
        bottom: 14px;
        width: 3px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }
      .sf-steps-v62::after {
        content: "";
        position: absolute;
        left: 10px;
        top: 14px;
        width: 3px;
        height: var(--sf-progress);
        max-height: calc(100% - 28px);
        border-radius: 999px;
        background: linear-gradient(180deg, #facc15, #a855f7, #22c55e);
        box-shadow: 0 0 20px rgba(250,204,21,.30), 0 0 34px rgba(168,85,247,.18);
        animation: sf-line-v70 .7s ease both, sf-line-glow-v70 2.6s ease-in-out infinite;
      }
      .sf-step-v62 {
        position: relative;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 50px;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 17px;
        padding: 9px 11px;
        background: rgba(255,255,255,.040);
        color: #eef0f8;
        text-decoration: none;
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        animation: sf-row-in-v70 .38s ease both;
      }
      .sf-step-v62:nth-child(2) { animation-delay: .04s; }
      .sf-step-v62:nth-child(3) { animation-delay: .08s; }
      .sf-step-v62:nth-child(4) { animation-delay: .12s; }
      .sf-step-v62:nth-child(5) { animation-delay: .16s; }
      .sf-step-v62:nth-child(6) { animation-delay: .20s; }
      .sf-step-v62::before {
        content: "";
        position: absolute;
        left: -26px;
        top: 50%;
        width: 13px;
        height: 13px;
        border-radius: 999px;
        transform: translateY(-50%);
        border: 2px solid rgba(255,255,255,.20);
        background: #0b0d16;
        z-index: 2;
        box-shadow: 0 0 0 4px rgba(7,9,16,.90);
      }
      .sf-step-v62:hover {
        transform: translateX(3px);
        border-color: rgba(250,204,21,.26);
        background: rgba(255,255,255,.065);
      }
      .sf-step-v62 span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background: rgba(255,255,255,.055);
        color: rgba(238,240,248,.55);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .12em;
      }
      .sf-step-copy-v62 {
        min-width: 0;
      }
      .sf-step-copy-v62 strong {
        display: block;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        line-height: 1.1;
      }
      .sf-step-copy-v62 em {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(238,240,248,.50);
        font-size: 11px;
        font-style: normal;
      }
      .sf-step-status-v62 {
        color: rgba(238,240,248,.42);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .10em;
        text-transform: uppercase;
      }
      .sf-step-v62.done {
        border-color: rgba(34,197,94,.23);
        background: linear-gradient(135deg, rgba(34,197,94,.08), rgba(255,255,255,.035));
      }
      .sf-step-v62.done::before {
        border-color: rgba(34,197,94,.85);
        background: #22c55e;
        box-shadow: 0 0 0 4px rgba(7,9,16,.90), 0 0 18px rgba(34,197,94,.42);
      }
      .sf-step-v62.done .sf-step-status-v62 { color: #86efac; }
      .sf-step-v62.active {
        border-color: rgba(250,204,21,.32);
        background: linear-gradient(135deg, rgba(250,204,21,.105), rgba(168,85,247,.075));
        box-shadow: 0 0 30px rgba(250,204,21,.08);
      }
      .sf-step-v62.active::before {
        border-color: #facc15;
        background: #facc15;
        box-shadow: 0 0 0 4px rgba(7,9,16,.90), 0 0 22px rgba(250,204,21,.55);
        animation: sf-dot-v70 1.7s ease-in-out infinite;
      }
      .sf-step-v62.active span {
        color: #0b0d16;
        background: linear-gradient(135deg, #facc15, #f97316);
      }
      .sf-step-v62.active .sf-step-status-v62 { color: #facc15; }
      @keyframes sf-enter-v70 {
        from { opacity: 0; transform: translateY(10px) scale(.988); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes sf-row-in-v70 {
        from { opacity: 0; transform: translateX(-8px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes sf-line-v70 {
        from { height: 8%; }
      }
      @keyframes sf-line-glow-v70 {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.35); }
      }
      @keyframes sf-dot-v70 {
        0%, 100% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.18); }
      }
      @keyframes sf-orb-v70 {
        0%, 100% { opacity: .48; transform: translateY(0) scale(1); }
        50% { opacity: .85; transform: translateY(-8px) scale(1.06); }
      }
      @media (max-width: 760px) {
        .studio-flow-v62 {
          margin: 8px auto 12px;
          width: calc(100% - 18px);
          border-radius: 21px;
          padding: 11px;
        }
        .sf-head-v62 { margin-bottom: 10px; }
        .sf-head-v62 h2 { font-size: 20px; }
        .sf-access-v62 { min-width: 98px; border-radius: 14px; padding: 8px 9px; }
        .sf-access-v62 strong { font-size: 11px; }
        .sf-steps-v62 { gap: 6px; padding-left: 24px; max-height: 318px; overflow-y: auto; scroll-snap-type: y proximity; }
        .sf-steps-v62::-webkit-scrollbar { width: 0; height: 0; }
        .sf-steps-v62::before, .sf-steps-v62::after { left: 8px; }
        .sf-step-v62 { grid-template-columns: 31px minmax(0, 1fr) auto; min-height: 48px; padding: 8px 9px; border-radius: 15px; scroll-snap-align: start; }
        .sf-step-v62::before { left: -23px; width: 12px; height: 12px; }
        .sf-step-v62 span { width: 31px; height: 31px; border-radius: 11px; font-size: 9px; }
        .sf-step-copy-v62 strong { font-size: 13px; }
        .sf-step-copy-v62 em { font-size: 10px; }
        .sf-step-status-v62 { font-size: 9px; }
      }
    `}</style>
  );
}

export default function StudioFlowPanel({
  topic = "",
  script = "",
  storyboard = null,
  frameGridPrompt = "",
  videoPrompt = "",
  productionReady = false,
  access = null,
  devMode = true,
  liveAllowed = false,
}) {
  const hasTopic = Boolean(String(topic || "").trim());
  const hasScript = Boolean(String(script || "").trim());
  const hasStoryboard = Boolean(storyboard?.scenes?.length);
  const hasPartPrompt = Boolean(String(frameGridPrompt || "").trim());
  const hasVideoPrompt = Boolean(String(videoPrompt || "").trim());
  const isDirector = Boolean(access?.isOwner || access?.isAdmin);
  const isPro = access?.role === "pro" && !isDirector;

  const liveLabel = isDirector
    ? "DIRECTOR LIVE"
    : isPro
      ? (liveAllowed ? "PRO LIVE" : "PRO ждёт AI-ключ")
      : "FREE Preview";

  const steps = [
    { n: "01", title: "Тема", desc: hasTopic ? "тема задана" : "введите идею ролика", state: hasTopic ? "done" : "active", href: "#setup" },
    { n: "02", title: "Текст сценария", desc: "хук, диктор, структура", state: hasScript ? "done" : hasTopic ? "active" : "idle", href: "#script" },
    { n: "03", title: "Storyboard JSON", desc: "кадры, VO/SFX, тайминг", state: hasStoryboard ? "done" : hasScript ? "active" : "idle", href: "#storyboard" },
    { n: "04", title: "PART-сетка", desc: "Flow/VEO grid prompt", state: hasPartPrompt ? "done" : hasStoryboard ? "active" : "idle", href: "#production" },
    { n: "05", title: "Video prompt", desc: "движение, камера, SFX", state: hasVideoPrompt ? "done" : hasPartPrompt ? "active" : "idle", href: "#production" },
    { n: "06", title: "Финальный пакет", desc: "TTS, обложка, музыка, SEO", state: productionReady ? "done" : hasVideoPrompt ? "active" : "idle", href: "#pack" },
  ];
  const progress = progressFromSteps(steps);

  return (
    <section className="studio-flow-v62" aria-label="NeuroCine workflow status">
      <StudioFlowCompactStyles />
      <div className="sf-head-v62">
        <div>
          <div className="sf-kicker-v62">Studio Flow</div>
          <h2>Живая цепочка проекта</h2>
        </div>
        <div className={`sf-access-v62 ${liveAllowed ? "live" : devMode ? "demo" : "pending"}`}>
          <span>Доступ</span>
          <strong>{liveLabel}</strong>
        </div>
      </div>
      <div className="sf-steps-v62" style={{ "--sf-progress": `${progress}%` }}>
        {steps.map((s) => {
          const state = stepState(s.state);
          const status = state === "done" ? "готово" : state === "active" ? "сейчас" : "ожидает";
          return (
            <a key={s.n} className={`sf-step-v62 ${state}`} href={s.href}>
              <span>{s.n}</span>
              <div className="sf-step-copy-v62">
                <strong>{s.title}</strong>
                <em>{s.desc}</em>
              </div>
              <b className="sf-step-status-v62">{status}</b>
            </a>
          );
        })}
      </div>
    </section>
  );
}
