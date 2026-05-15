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
  return Math.max(8, Math.min(100, (value / Math.max(1, steps.length - 1)) * 88));
}

function StudioFlowResponsiveStyles() {
  return (
    <style jsx global>{`
      .studio-flow-v62 {
        --sf-progress: 8%;
        position: relative;
        overflow: hidden;
        margin: 12px auto 16px;
        width: min(100% - 22px, 1180px);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 26px;
        padding: 16px;
        background:
          linear-gradient(145deg, rgba(14,16,27,.91), rgba(7,9,16,.78)),
          radial-gradient(circle at 8% -8%, rgba(168,85,247,.20), transparent 38%),
          radial-gradient(circle at 105% 8%, rgba(250,204,21,.12), transparent 32%);
        box-shadow: 0 20px 70px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(18px);
        animation: sf-enter-v71 .42s ease both;
      }
      .studio-flow-v62::before {
        content: "";
        position: absolute;
        inset: auto -70px -100px auto;
        width: 210px;
        height: 210px;
        border-radius: 999px;
        background: rgba(168,85,247,.13);
        filter: blur(32px);
        animation: sf-orb-v71 4.2s ease-in-out infinite;
        pointer-events: none;
      }
      .sf-layout-v62 {
        position: relative;
        display: grid;
        grid-template-columns: minmax(230px, 310px) minmax(0, 1fr);
        gap: 16px;
        align-items: stretch;
      }
      .sf-summary-v62 {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 292px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 22px;
        padding: 18px;
        background: rgba(255,255,255,.045);
        overflow: hidden;
      }
      .sf-summary-v62::after {
        content: "";
        position: absolute;
        inset: auto -40px -54px auto;
        width: 140px;
        height: 140px;
        border-radius: 999px;
        background: rgba(250,204,21,.08);
        filter: blur(22px);
      }
      .sf-kicker-v62 {
        margin-bottom: 8px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .sf-summary-v62 h2 {
        margin: 0 0 10px;
        font-size: clamp(24px, 3.2vw, 42px);
        line-height: .96;
        letter-spacing: -.065em;
      }
      .sf-summary-v62 p {
        margin: 0;
        max-width: 260px;
        color: rgba(238,240,248,.62);
        font-size: 13px;
        line-height: 1.55;
      }
      .sf-access-v62 {
        position: relative;
        z-index: 1;
        margin-top: 18px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 17px;
        padding: 11px 12px;
        background: rgba(0,0,0,.20);
      }
      .sf-access-v62 span,
      .sf-meter-label-v62 span {
        display: block;
        margin-bottom: 4px;
        color: rgba(238,240,248,.48);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .sf-access-v62 strong {
        display: block;
        color: #facc15;
        font-size: 14px;
        line-height: 1.05;
        text-shadow: 0 0 18px rgba(250,204,21,.28);
      }
      .sf-meter-v62 {
        position: relative;
        z-index: 1;
        margin-top: 14px;
      }
      .sf-meter-label-v62 {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      .sf-meter-label-v62 b {
        color: #eef0f8;
        font-size: 12px;
      }
      .sf-meter-track-v62 {
        position: relative;
        height: 7px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        overflow: hidden;
      }
      .sf-meter-track-v62 i {
        display: block;
        width: var(--sf-progress);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #facc15, #a855f7, #22c55e);
        box-shadow: 0 0 22px rgba(250,204,21,.24);
        animation: sf-meter-v71 .75s ease both;
      }
      .sf-timeline-wrap-v62 {
        position: relative;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 22px;
        padding: 14px;
        background: rgba(0,0,0,.16);
      }
      .sf-steps-v62 {
        position: relative;
        display: grid;
        gap: 8px;
        padding-left: 30px;
      }
      .sf-steps-v62::before {
        content: "";
        position: absolute;
        left: 10px;
        top: 15px;
        bottom: 15px;
        width: 3px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }
      .sf-steps-v62::after {
        content: "";
        position: absolute;
        left: 10px;
        top: 15px;
        width: 3px;
        height: var(--sf-progress);
        max-height: calc(100% - 30px);
        border-radius: 999px;
        background: linear-gradient(180deg, #facc15, #a855f7, #22c55e);
        box-shadow: 0 0 20px rgba(250,204,21,.30), 0 0 34px rgba(168,85,247,.18);
        animation: sf-line-v71 .75s ease both, sf-line-glow-v71 2.6s ease-in-out infinite;
      }
      .sf-step-v62 {
        position: relative;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 54px;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 17px;
        padding: 9px 12px;
        background: rgba(255,255,255,.040);
        color: #eef0f8;
        text-decoration: none;
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        animation: sf-row-in-v71 .38s ease both;
      }
      .sf-step-v62:nth-child(2) { animation-delay: .04s; }
      .sf-step-v62:nth-child(3) { animation-delay: .08s; }
      .sf-step-v62:nth-child(4) { animation-delay: .12s; }
      .sf-step-v62:nth-child(5) { animation-delay: .16s; }
      .sf-step-v62:nth-child(6) { animation-delay: .20s; }
      .sf-step-v62::before {
        content: "";
        position: absolute;
        left: -27px;
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
        transform: translateX(4px);
        border-color: rgba(250,204,21,.26);
        background: rgba(255,255,255,.065);
      }
      .sf-step-v62 span {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        background: rgba(255,255,255,.055);
        color: rgba(238,240,248,.55);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .12em;
      }
      .sf-step-copy-v62 { min-width: 0; }
      .sf-step-copy-v62 strong {
        display: block;
        margin-bottom: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
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
        animation: sf-dot-v71 1.7s ease-in-out infinite;
      }
      .sf-step-v62.active span {
        color: #0b0d16;
        background: linear-gradient(135deg, #facc15, #f97316);
      }
      .sf-step-v62.active .sf-step-status-v62 { color: #facc15; }
      @keyframes sf-enter-v71 {
        from { opacity: 0; transform: translateY(10px) scale(.988); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes sf-row-in-v71 {
        from { opacity: 0; transform: translateX(-8px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes sf-line-v71 { from { height: 8%; } }
      @keyframes sf-meter-v71 { from { width: 8%; } }
      @keyframes sf-line-glow-v71 {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.35); }
      }
      @keyframes sf-dot-v71 {
        0%, 100% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.18); }
      }
      @keyframes sf-orb-v71 {
        0%, 100% { opacity: .48; transform: translateY(0) scale(1); }
        50% { opacity: .85; transform: translateY(-8px) scale(1.06); }
      }
      @media (min-width: 1040px) {
        .studio-flow-v62 { padding: 18px; }
        .sf-layout-v62 { grid-template-columns: 320px minmax(0, 1fr); gap: 18px; }
        .sf-timeline-wrap-v62 { padding: 16px; }
        .sf-step-v62 { min-height: 58px; }
      }
      @media (max-width: 820px) {
        .studio-flow-v62 {
          margin: 8px auto 12px;
          width: calc(100% - 18px);
          border-radius: 21px;
          padding: 11px;
        }
        .sf-layout-v62 { grid-template-columns: 1fr; gap: 10px; }
        .sf-summary-v62 { min-height: unset; border-radius: 18px; padding: 13px; }
        .sf-summary-v62 h2 { font-size: 21px; }
        .sf-summary-v62 p { display: none; }
        .sf-access-v62 { margin-top: 10px; border-radius: 14px; padding: 8px 9px; }
        .sf-access-v62 strong { font-size: 11px; }
        .sf-meter-v62 { margin-top: 10px; }
        .sf-timeline-wrap-v62 { border-radius: 18px; padding: 10px; }
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
  const doneCount = steps.filter(s => s.state === "done").length;

  return (
    <section className="studio-flow-v62" aria-label="NeuroCine workflow status" style={{ "--sf-progress": `${progress}%` }}>
      <StudioFlowResponsiveStyles />
      <div className="sf-layout-v62">
        <aside className="sf-summary-v62">
          <div>
            <div className="sf-kicker-v62">Studio Flow</div>
            <h2>Живая цепочка проекта</h2>
            <p>Адаптивный production‑маршрут: на ПК — пульт + таймлайн, на телефоне — компактная вертикальная лента.</p>
          </div>
          <div>
            <div className={`sf-access-v62 ${liveAllowed ? "live" : devMode ? "demo" : "pending"}`}>
              <span>Доступ</span>
              <strong>{liveLabel}</strong>
            </div>
            <div className="sf-meter-v62">
              <div className="sf-meter-label-v62">
                <span>Прогресс</span>
                <b>{doneCount}/{steps.length}</b>
              </div>
              <div className="sf-meter-track-v62"><i /></div>
            </div>
          </div>
        </aside>

        <div className="sf-timeline-wrap-v62">
          <div className="sf-steps-v62">
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
        </div>
      </div>
    </section>
  );
}
