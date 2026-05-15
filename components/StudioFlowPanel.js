"use client";

function stepState(active) {
  if (active === "done") return "done";
  if (active === "active") return "active";
  return "idle";
}

function StudioFlowCompactStyles() {
  return (
    <style jsx global>{`
      .studio-flow-v62 {
        position: relative;
        overflow: hidden;
        margin: 10px auto 14px;
        width: min(100% - 18px, 1120px);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 22px;
        padding: 12px;
        background:
          linear-gradient(135deg, rgba(18,20,32,.86), rgba(8,10,18,.74)),
          radial-gradient(circle at 8% 0%, rgba(168,85,247,.18), transparent 34%),
          radial-gradient(circle at 96% 12%, rgba(250,204,21,.10), transparent 30%);
        box-shadow: 0 16px 54px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(18px);
        animation: sf-enter-v67 .44s ease both;
      }
      .studio-flow-v62::before {
        content: "";
        position: absolute;
        inset: -80px -80px auto auto;
        width: 180px;
        height: 180px;
        border-radius: 999px;
        background: rgba(250,204,21,.10);
        filter: blur(28px);
        pointer-events: none;
        animation: sf-pulse-v67 3.8s ease-in-out infinite;
      }
      .sf-head-v62 {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .sf-head-v62 h2 {
        margin: 0;
        font-size: clamp(18px, 4.8vw, 28px);
        line-height: 1;
        letter-spacing: -.05em;
      }
      .sf-head-v62 p {
        display: none;
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
        border-radius: 16px;
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
        position: relative;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
      }
      .sf-step-v62 {
        position: relative;
        overflow: hidden;
        min-height: 74px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 18px;
        padding: 11px;
        background: rgba(255,255,255,.045);
        color: #eef0f8;
        text-decoration: none;
        transform: translateZ(0);
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        animation: sf-card-in-v67 .42s ease both;
      }
      .sf-step-v62:nth-child(2) { animation-delay: .04s; }
      .sf-step-v62:nth-child(3) { animation-delay: .08s; }
      .sf-step-v62:nth-child(4) { animation-delay: .12s; }
      .sf-step-v62:nth-child(5) { animation-delay: .16s; }
      .sf-step-v62::after {
        content: "";
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 8px;
        height: 3px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }
      .sf-step-v62.done::after,
      .sf-step-v62.active::after {
        background: linear-gradient(90deg, #facc15, #a855f7);
        box-shadow: 0 0 16px rgba(250,204,21,.22);
      }
      .sf-step-v62:hover {
        transform: translateY(-2px);
        border-color: rgba(250,204,21,.28);
        background: rgba(255,255,255,.075);
      }
      .sf-step-v62 span {
        display: block;
        margin-bottom: 8px;
        color: rgba(238,240,248,.48);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .18em;
      }
      .sf-step-v62 strong {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
        line-height: 1.08;
      }
      .sf-step-v62 em {
        display: block;
        color: rgba(238,240,248,.52);
        font-size: 11px;
        font-style: normal;
        line-height: 1.2;
      }
      .sf-step-v62.done {
        border-color: rgba(34,197,94,.22);
        background: linear-gradient(135deg, rgba(34,197,94,.08), rgba(255,255,255,.045));
      }
      .sf-step-v62.active {
        border-color: rgba(250,204,21,.30);
        background: linear-gradient(135deg, rgba(250,204,21,.10), rgba(168,85,247,.08));
        box-shadow: 0 0 28px rgba(250,204,21,.08);
      }
      .sf-step-v62.active span { color: #facc15; }
      @keyframes sf-enter-v67 {
        from { opacity: 0; transform: translateY(12px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes sf-card-in-v67 {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes sf-pulse-v67 {
        0%, 100% { opacity: .45; transform: scale(1); }
        50% { opacity: .85; transform: scale(1.08); }
      }
      @media (max-width: 760px) {
        .studio-flow-v62 {
          margin: 8px auto 12px;
          width: calc(100% - 18px);
          border-radius: 20px;
          padding: 10px;
        }
        .sf-head-v62 {
          align-items: stretch;
          margin-bottom: 8px;
        }
        .sf-head-v62 h2 { font-size: 21px; }
        .sf-access-v62 {
          min-width: 98px;
          border-radius: 14px;
          padding: 8px 9px;
        }
        .sf-access-v62 strong { font-size: 11px; }
        .sf-steps-v62 {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 1px 1px 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .sf-steps-v62::-webkit-scrollbar { display: none; }
        .sf-step-v62 {
          min-width: 126px;
          min-height: 68px;
          border-radius: 16px;
          padding: 10px;
          scroll-snap-align: start;
        }
        .sf-step-v62 span { margin-bottom: 6px; font-size: 10px; }
        .sf-step-v62 strong { font-size: 13px; }
        .sf-step-v62 em { font-size: 10px; }
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
    { n: "01", title: "Сценарий", desc: "хук, диктор", state: hasScript ? "done" : hasTopic ? "active" : "idle" },
    { n: "02", title: "Storyboard", desc: "JSON, кадры", state: hasStoryboard ? "done" : hasScript ? "active" : "idle" },
    { n: "03", title: "Pipeline", desc: "PART grid", state: hasVideoPrompt ? "done" : hasPartPrompt ? "active" : hasStoryboard ? "active" : "idle" },
    { n: "04", title: "Пакет", desc: "TTS, SEO", state: productionReady ? "done" : hasScript || hasStoryboard ? "active" : "idle" },
    { n: "05", title: "Экспорт", desc: "snapshot", state: hasScript || hasStoryboard ? "active" : "idle" },
  ];

  return (
    <section className="studio-flow-v62" aria-label="NeuroCine workflow status">
      <StudioFlowCompactStyles />
      <div className="sf-head-v62">
        <div>
          <div className="sf-kicker-v62">Studio Flow</div>
          <h2>Production workflow</h2>
        </div>
        <div className={`sf-access-v62 ${liveAllowed ? "live" : devMode ? "demo" : "pending"}`}>
          <span>Доступ</span>
          <strong>{liveLabel}</strong>
        </div>
      </div>
      <div className="sf-steps-v62">
        {steps.map((s) => (
          <a key={s.n} className={`sf-step-v62 ${stepState(s.state)}`} href={s.n === "01" ? "#script" : s.n === "02" ? "#storyboard" : s.n === "03" ? "#production" : s.n === "04" ? "#pack" : "#projects"}>
            <span>{s.n}</span>
            <strong>{s.title}</strong>
            <em>{s.desc}</em>
          </a>
        ))}
      </div>
    </section>
  );
}
