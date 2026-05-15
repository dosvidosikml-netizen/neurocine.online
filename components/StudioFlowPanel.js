"use client";

function stepState(state) {
  if (state === "done") return "done";
  if (state === "active") return "active";
  return "idle";
}

function progressFromSteps(steps) {
  const done = steps.filter(s => s.state === "done").length;
  const activeIndex = steps.findIndex(s => s.state === "active");
  const value = activeIndex >= 0 ? activeIndex + 0.45 : done;
  return Math.max(7, Math.min(100, (value / Math.max(1, steps.length - 1)) * 90));
}

function StudioFlowStyles() {
  return (
    <style jsx global>{`
      .nc-flow-v72,
      .nc-flow-v72 * { box-sizing: border-box; }

      .nc-flow-v72 {
        --flow-progress: 7%;
        position: relative;
        width: min(calc(100% - 18px), 1180px);
        margin: 10px auto 14px;
        padding: 16px 12px 12px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 24px;
        background:
          radial-gradient(circle at 0% 0%, rgba(168,85,247,.18), transparent 34%),
          radial-gradient(circle at 100% 0%, rgba(250,204,21,.10), transparent 32%),
          linear-gradient(145deg, rgba(12,14,24,.94), rgba(7,9,16,.82));
        box-shadow: 0 18px 60px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(16px);
        animation: nc-flow-in-v72 .36s ease both;
      }

      .nc-flow-v72::before {
        content: "";
        position: absolute;
        right: -72px;
        bottom: -94px;
        width: 210px;
        height: 210px;
        border-radius: 999px;
        background: rgba(168,85,247,.13);
        filter: blur(34px);
        pointer-events: none;
        animation: nc-flow-orb-v72 4.4s ease-in-out infinite;
      }

      .nc-flow-grid-v72 {
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        min-width: 0;
      }

      .nc-flow-summary-v72 {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 10px;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 19px;
        padding: 22px 13px 13px;
        background: rgba(255,255,255,.042);
      }

      .nc-flow-summary-v72 > div:first-child {
        min-width: 0;
        padding-top: 3px;
      }

      .nc-flow-kicker-v72 {
        margin: 0 0 8px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }

      .nc-flow-title-v72 {
        margin: 0;
        padding-top: 2px;
        color: #f8fafc;
        font-size: clamp(22px, 7vw, 32px);
        line-height: 1.08;
        letter-spacing: -.055em;
      }

      .nc-flow-desc-v72 {
        display: none;
        margin: 8px 0 0;
        color: rgba(238,240,248,.62);
        font-size: 13px;
        line-height: 1.5;
      }

      .nc-flow-info-v72 {
        display: grid;
        grid-template-columns: 1fr;
        gap: 9px;
      }

      .nc-flow-access-v72,
      .nc-flow-meter-v72 {
        min-width: 0;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 15px;
        padding: 10px;
        background: rgba(0,0,0,.20);
      }

      .nc-flow-access-v72 span,
      .nc-flow-meter-v72 span {
        display: block;
        margin-bottom: 4px;
        color: rgba(238,240,248,.48);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }

      .nc-flow-access-v72 strong {
        display: block;
        overflow: hidden;
        color: #facc15;
        font-size: 13px;
        line-height: 1.05;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 0 18px rgba(250,204,21,.28);
      }

      .nc-flow-meter-head-v72 {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 10px;
        margin-bottom: 7px;
      }

      .nc-flow-meter-head-v72 b {
        color: #eef0f8;
        font-size: 12px;
      }

      .nc-flow-meter-line-v72 {
        position: relative;
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }

      .nc-flow-meter-line-v72 i {
        display: block;
        width: var(--flow-progress);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #facc15, #a855f7, #22c55e);
        box-shadow: 0 0 22px rgba(250,204,21,.24);
        animation: nc-flow-meter-v72 .65s ease both;
      }

      .nc-flow-timeline-v72 {
        position: relative;
        z-index: 1;
        min-width: 0;
        width: 100%;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.075);
        border-radius: 19px;
        padding: 10px;
        background: rgba(0,0,0,.16);
      }

      .nc-flow-steps-v72 {
        position: relative;
        display: grid;
        gap: 7px;
        min-width: 0;
        padding-left: 24px;
      }

      .nc-flow-steps-v72::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 14px;
        bottom: 14px;
        width: 3px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }

      .nc-flow-steps-v72::after {
        content: "";
        position: absolute;
        left: 8px;
        top: 14px;
        width: 3px;
        height: var(--flow-progress);
        max-height: calc(100% - 28px);
        border-radius: 999px;
        background: linear-gradient(180deg, #facc15, #a855f7, #22c55e);
        box-shadow: 0 0 18px rgba(250,204,21,.28), 0 0 32px rgba(168,85,247,.18);
        animation: nc-flow-line-v72 .65s ease both, nc-flow-glow-v72 2.8s ease-in-out infinite;
      }

      .nc-flow-step-v72 {
        position: relative;
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr) auto;
        align-items: center;
        gap: 9px;
        min-width: 0;
        min-height: 50px;
        padding: 8px 9px;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 16px;
        background: rgba(255,255,255,.040);
        color: #eef0f8;
        text-decoration: none;
        transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        animation: nc-flow-row-v72 .34s ease both;
      }

      .nc-flow-step-v72:nth-child(2) { animation-delay: .04s; }
      .nc-flow-step-v72:nth-child(3) { animation-delay: .08s; }
      .nc-flow-step-v72:nth-child(4) { animation-delay: .12s; }
      .nc-flow-step-v72:nth-child(5) { animation-delay: .16s; }
      .nc-flow-step-v72:nth-child(6) { animation-delay: .20s; }

      .nc-flow-step-v72::before {
        content: "";
        position: absolute;
        left: -23px;
        top: 50%;
        z-index: 2;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255,255,255,.20);
        border-radius: 999px;
        background: #0b0d16;
        transform: translateY(-50%);
        box-shadow: 0 0 0 4px rgba(7,9,16,.90);
      }

      .nc-flow-step-v72:hover {
        transform: translateX(2px);
        border-color: rgba(250,204,21,.26);
        background: rgba(255,255,255,.065);
      }

      .nc-flow-num-v72 {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 12px;
        background: rgba(255,255,255,.055);
        color: rgba(238,240,248,.55);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .10em;
      }

      .nc-flow-copy-v72 { min-width: 0; }

      .nc-flow-copy-v72 strong {
        display: block;
        margin-bottom: 2px;
        overflow: hidden;
        color: #f8fafc;
        font-size: 13px;
        line-height: 1.1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nc-flow-copy-v72 em {
        display: block;
        overflow: hidden;
        color: rgba(238,240,248,.50);
        font-size: 10px;
        font-style: normal;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nc-flow-status-v72 {
        color: rgba(238,240,248,.42);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .nc-flow-step-v72.done {
        border-color: rgba(34,197,94,.23);
        background: linear-gradient(135deg, rgba(34,197,94,.08), rgba(255,255,255,.035));
      }

      .nc-flow-step-v72.done::before {
        border-color: rgba(34,197,94,.85);
        background: #22c55e;
        box-shadow: 0 0 0 4px rgba(7,9,16,.90), 0 0 18px rgba(34,197,94,.42);
      }

      .nc-flow-step-v72.done .nc-flow-status-v72 { color: #86efac; }

      .nc-flow-step-v72.active {
        border-color: rgba(250,204,21,.36);
        background: linear-gradient(135deg, rgba(250,204,21,.12), rgba(168,85,247,.08));
        box-shadow: 0 0 28px rgba(250,204,21,.08);
      }

      .nc-flow-step-v72.active::before {
        border-color: #facc15;
        background: #facc15;
        box-shadow: 0 0 0 4px rgba(7,9,16,.90), 0 0 22px rgba(250,204,21,.55);
        animation: nc-flow-dot-v72 1.7s ease-in-out infinite;
      }

      .nc-flow-step-v72.active .nc-flow-num-v72 {
        color: #0b0d16;
        background: linear-gradient(135deg, #facc15, #f97316);
      }

      .nc-flow-step-v72.active .nc-flow-status-v72 { color: #facc15; }

      @media (min-width: 900px) {
        .nc-flow-v72 {
          width: min(calc(100% - 36px), 1180px);
          padding: 22px 18px 18px;
          border-radius: 28px;
        }
        .nc-flow-grid-v72 {
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 18px;
        }
        .nc-flow-summary-v72 {
          min-height: 330px;
          padding: 24px 18px 18px;
          align-content: space-between;
          border-radius: 23px;
        }
        .nc-flow-title-v72 {
          font-size: clamp(30px, 3vw, 44px);
          line-height: 1.06;
        }
        .nc-flow-desc-v72 { display: block; }
        .nc-flow-info-v72 { gap: 12px; }
        .nc-flow-timeline-v72 {
          padding: 16px;
          border-radius: 23px;
        }
        .nc-flow-steps-v72 {
          gap: 8px;
          padding-left: 31px;
        }
        .nc-flow-steps-v72::before,
        .nc-flow-steps-v72::after { left: 10px; }
        .nc-flow-step-v72 {
          grid-template-columns: 38px minmax(0, 1fr) auto;
          min-height: 58px;
          padding: 10px 12px;
          gap: 12px;
          border-radius: 18px;
        }
        .nc-flow-step-v72::before {
          left: -28px;
          width: 14px;
          height: 14px;
        }
        .nc-flow-num-v72 {
          width: 38px;
          height: 38px;
          border-radius: 13px;
        }
        .nc-flow-copy-v72 strong { font-size: 15px; }
        .nc-flow-copy-v72 em { font-size: 11px; }
        .nc-flow-status-v72 { font-size: 10px; }
      }

      @media (max-width: 390px) {
        .nc-flow-v72 {
          width: min(calc(100% - 12px), 1180px);
          padding: 14px 9px 9px;
        }
        .nc-flow-summary-v72 {
          padding: 20px 12px 12px;
        }
        .nc-flow-title-v72 {
          font-size: 20px;
          line-height: 1.1;
        }
        .nc-flow-timeline-v72 { padding: 8px; }
        .nc-flow-steps-v72 { padding-left: 21px; }
        .nc-flow-step-v72 { grid-template-columns: 30px minmax(0, 1fr); }
        .nc-flow-status-v72 { display: none; }
      }

      @keyframes nc-flow-in-v72 {
        from { opacity: 0; transform: translateY(10px) scale(.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes nc-flow-row-v72 {
        from { opacity: 0; transform: translateX(-8px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes nc-flow-line-v72 { from { height: 7%; } }
      @keyframes nc-flow-meter-v72 { from { width: 7%; } }
      @keyframes nc-flow-glow-v72 {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.35); }
      }
      @keyframes nc-flow-dot-v72 {
        0%, 100% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.18); }
      }
      @keyframes nc-flow-orb-v72 {
        0%, 100% { opacity: .48; transform: translateY(0) scale(1); }
        50% { opacity: .85; transform: translateY(-8px) scale(1.06); }
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
    ? "РЕЖИССЁР LIVE"
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
    <section className="nc-flow-v72" aria-label="NeuroCine workflow status" style={{ "--flow-progress": `${progress}%` }}>
      <StudioFlowStyles />
      <div className="nc-flow-grid-v72">
        <aside className="nc-flow-summary-v72">
          <div>
            <div className="nc-flow-kicker-v72">Studio Flow</div>
            <h2 className="nc-flow-title-v72">Живая цепочка проекта</h2>
            <p className="nc-flow-desc-v72">Адаптивный production‑маршрут: на ПК — пульт и таймлайн, на телефоне — аккуратная вертикальная лента.</p>
          </div>

          <div className="nc-flow-info-v72">
            <div className="nc-flow-access-v72">
              <span>Доступ</span>
              <strong>{liveLabel}</strong>
            </div>
            <div className="nc-flow-meter-v72">
              <div className="nc-flow-meter-head-v72">
                <span>Прогресс</span>
                <b>{doneCount}/{steps.length}</b>
              </div>
              <div className="nc-flow-meter-line-v72"><i /></div>
            </div>
          </div>
        </aside>

        <div className="nc-flow-timeline-v72">
          <div className="nc-flow-steps-v72">
            {steps.map((step) => {
              const state = stepState(step.state);
              const status = state === "done" ? "готово" : state === "active" ? "сейчас" : "ожидает";
              return (
                <a key={step.n} className={`nc-flow-step-v72 ${state}`} href={step.href}>
                  <span className="nc-flow-num-v72">{step.n}</span>
                  <div className="nc-flow-copy-v72">
                    <strong>{step.title}</strong>
                    <em>{step.desc}</em>
                  </div>
                  <b className="nc-flow-status-v72">{status}</b>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
