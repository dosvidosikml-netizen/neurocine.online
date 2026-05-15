"use client";

import { useEffect, useState } from "react";

const STUDIO_PLANS = [
  {
    name: "FREE",
    tag: "старт",
    price: "0€",
    sub: "preview",
    accent: "free",
    items: ["Google-вход", "локальный черновик", "до 3 проектов", "preview Studio"],
    href: "#setup",
  },
  {
    name: "PRO",
    tag: "рабочий режим",
    price: "19€",
    sub: "в месяц",
    accent: "pro",
    items: ["Cloud Projects", "свои AI‑ключи", "полный pipeline", "экспорт пакета"],
    href: "#pack",
  },
  {
    name: "DIRECTOR",
    tag: "studio owner",
    price: "LIVE",
    sub: "platform API",
    accent: "director",
    items: ["панель режиссёра", "пользователи", "usage и лимиты", "series modules"],
    href: "#pack",
  },
];

function isPackageHomeHash() {
  if (typeof window === "undefined") return true;
  const hash = String(window.location.hash || "").replace(/^#/, "");
  return !hash || hash === "studio-package" || hash === "tools";
}

function StudioPackageStyles() {
  return (
    <style jsx global>{`
      body.nc-studio-package-home .setup-v40,
      body.nc-studio-package-home .studio-status-bar-v33,
      body.nc-studio-package-home .nc-quick-tools-anchor,
      body.nc-studio-package-home .studio-flow-shell,
      body.nc-studio-package-home .floating-dock-v33 {
        display: none !important;
      }

      body.nc-studio-package-home .demo-banner-v35,
      body.nc-studio-package-home .snapshot-status {
        width: min(calc(100% - 18px), 1180px) !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }

      .nc-studio-pack-v1,
      .nc-studio-pack-v1 * { box-sizing: border-box; }

      .nc-studio-pack-v1 {
        position: relative;
        width: min(calc(100% - 18px), 1180px);
        margin: 10px auto 14px;
        padding: 12px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 24px;
        background:
          radial-gradient(circle at 0% 0%, rgba(168,85,247,.18), transparent 34%),
          radial-gradient(circle at 100% 0%, rgba(250,204,21,.11), transparent 32%),
          linear-gradient(145deg, rgba(12,14,24,.94), rgba(7,9,16,.82));
        box-shadow: 0 18px 60px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(16px);
        animation: nc-pack-in-v1 .32s ease both;
      }

      .nc-studio-pack-v1::before {
        content: "";
        position: absolute;
        right: -74px;
        bottom: -96px;
        width: 220px;
        height: 220px;
        border-radius: 999px;
        background: rgba(168,85,247,.13);
        filter: blur(34px);
        pointer-events: none;
      }

      .nc-studio-pack-shell-v1 {
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        min-width: 0;
      }

      .nc-studio-pack-head-v1 {
        display: grid;
        gap: 12px;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 20px;
        padding: 16px;
        background: rgba(255,255,255,.042);
      }

      .nc-studio-pack-kicker-v1 {
        margin-bottom: 8px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .24em;
        text-transform: uppercase;
      }

      .nc-studio-pack-title-v1 {
        margin: 0;
        color: #f8fafc;
        font-size: clamp(28px, 7vw, 44px);
        line-height: 1.02;
        letter-spacing: -.065em;
      }

      .nc-studio-pack-copy-v1 {
        margin: 9px 0 0;
        max-width: 680px;
        color: rgba(238,240,248,.66);
        font-size: 14px;
        line-height: 1.48;
      }

      .nc-studio-pack-status-v1 {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .nc-studio-pack-chip-v1 {
        min-width: 0;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 16px;
        padding: 10px 12px;
        background: rgba(0,0,0,.20);
      }

      .nc-studio-pack-chip-v1 span {
        display: block;
        margin-bottom: 4px;
        color: rgba(238,240,248,.48);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }

      .nc-studio-pack-chip-v1 strong {
        display: block;
        overflow: hidden;
        color: #facc15;
        font-size: 13px;
        line-height: 1.05;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 0 18px rgba(250,204,21,.28);
      }

      .nc-studio-pack-actions-v1 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .nc-studio-pack-btn-v1 {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 15px;
        padding: 0 12px;
        background: rgba(255,255,255,.055);
        color: #eef0f8;
        text-decoration: none;
        font-size: 12px;
        font-weight: 900;
      }

      .nc-studio-pack-btn-v1.primary {
        border-color: rgba(255,92,42,.34);
        background: linear-gradient(135deg, #ff4d5f, #ff7a3d);
        color: #16080a;
      }

      .nc-studio-pack-cards-v1 {
        display: grid;
        grid-template-columns: 1fr;
        gap: 9px;
        min-width: 0;
      }

      .nc-studio-pack-card-v1 {
        position: relative;
        overflow: hidden;
        display: grid;
        gap: 10px;
        min-width: 0;
        border: 1px solid rgba(255,255,255,.085);
        border-radius: 19px;
        padding: 13px;
        background: rgba(0,0,0,.16);
        color: #eef0f8;
        text-decoration: none;
      }

      .nc-studio-pack-card-v1.pro {
        border-color: rgba(250,204,21,.28);
        background:
          radial-gradient(circle at 86% 0%, rgba(250,204,21,.12), transparent 34%),
          rgba(255,255,255,.045);
      }

      .nc-studio-pack-card-v1.director {
        border-color: rgba(168,85,247,.26);
        background:
          radial-gradient(circle at 86% 0%, rgba(168,85,247,.14), transparent 34%),
          rgba(255,255,255,.045);
      }

      .nc-studio-pack-card-top-v1 {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
      }

      .nc-studio-pack-card-top-v1 strong {
        display: block;
        color: #fff;
        font-size: 21px;
        line-height: 1;
        letter-spacing: -.04em;
      }

      .nc-studio-pack-card-top-v1 span {
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 999px;
        padding: 6px 8px;
        color: rgba(238,240,248,.62);
        font-size: 10px;
        font-weight: 900;
        white-space: nowrap;
      }

      .nc-studio-pack-price-v1 {
        display: flex;
        align-items: baseline;
        gap: 7px;
        color: #facc15;
        font-size: 31px;
        font-weight: 950;
        letter-spacing: -.055em;
      }

      .nc-studio-pack-price-v1 small {
        color: rgba(238,240,248,.48);
        font-size: 11px;
        letter-spacing: 0;
        font-weight: 800;
      }

      .nc-studio-pack-list-v1 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 10px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .nc-studio-pack-list-v1 li {
        min-width: 0;
        color: rgba(238,240,248,.66);
        font-size: 11px;
        line-height: 1.28;
      }

      .nc-studio-pack-list-v1 li::before {
        content: "✓";
        margin-right: 6px;
        color: #86efac;
        font-weight: 950;
      }

      .nc-studio-pack-card-cta-v1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-top: 2px;
        color: rgba(238,240,248,.78);
        font-size: 12px;
        font-weight: 900;
      }

      .nc-studio-pack-note-v1 {
        border: 1px solid rgba(34,197,94,.22);
        border-radius: 17px;
        padding: 12px 13px;
        background: rgba(34,197,94,.075);
        color: #bbf7d0;
        font-size: 13px;
        font-weight: 850;
        line-height: 1.35;
      }

      @media (min-width: 900px) {
        .nc-studio-pack-v1 {
          width: min(calc(100% - 36px), 1180px);
          padding: 18px;
          border-radius: 28px;
        }
        .nc-studio-pack-shell-v1 {
          grid-template-columns: 330px minmax(0, 1fr);
          gap: 18px;
          align-items: stretch;
        }
        .nc-studio-pack-head-v1 {
          align-content: space-between;
          min-height: 350px;
          padding: 22px;
          border-radius: 24px;
        }
        .nc-studio-pack-cards-v1 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .nc-studio-pack-card-v1 {
          min-height: 350px;
          align-content: space-between;
          padding: 18px;
          border-radius: 23px;
        }
        .nc-studio-pack-list-v1 {
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .nc-studio-pack-list-v1 li { font-size: 12px; }
      }

      @media (max-width: 760px) {
        .nc-studio-pack-v1 {
          width: min(calc(100% - 18px), 1180px);
          margin-top: 8px;
          max-height: calc(100dvh - 226px);
          overflow-y: auto;
          overflow-x: hidden;
          padding: 11px;
          border-radius: 23px;
          overscroll-behavior: contain;
        }
        .nc-studio-pack-v1::-webkit-scrollbar { width: 0; height: 0; }
        .nc-studio-pack-head-v1 {
          padding: 15px;
          border-radius: 19px;
        }
        .nc-studio-pack-title-v1 {
          font-size: clamp(28px, 8vw, 36px);
          line-height: 1.02;
        }
        .nc-studio-pack-copy-v1 {
          font-size: 13px;
          line-height: 1.42;
        }
        .nc-studio-pack-cards-v1 { gap: 8px; }
        .nc-studio-pack-card-v1 {
          border-radius: 18px;
          padding: 12px;
        }
        .nc-studio-pack-list-v1 {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 390px) {
        .nc-studio-pack-v1 {
          width: min(calc(100% - 12px), 1180px);
          max-height: calc(100dvh - 218px);
          padding: 9px;
        }
        .nc-studio-pack-head-v1 { padding: 13px; }
        .nc-studio-pack-list-v1 { grid-template-columns: 1fr; }
        .nc-studio-pack-actions-v1 { grid-template-columns: 1fr; }
      }

      @keyframes nc-pack-in-v1 {
        from { opacity: 0; transform: translateY(10px) scale(.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `}</style>
  );
}

export default function StudioFlowPanel({ access = null, liveAllowed = false }) {
  const [packageHome, setPackageHome] = useState(true);
  const isDirector = Boolean(access?.isOwner || access?.isAdmin);
  const isPro = access?.role === "pro" && !isDirector;
  const activePlan = isDirector ? "DIRECTOR" : isPro ? "PRO" : "FREE";
  const liveLabel = isDirector ? "РЕЖИССЁР LIVE" : isPro ? (liveAllowed ? "PRO LIVE" : "PRO") : "FREE Preview";

  useEffect(() => {
    function syncMode() {
      const home = isPackageHomeHash();
      setPackageHome(home);
      document.body.classList.toggle("nc-studio-package-home", home);
    }

    syncMode();
    window.addEventListener("hashchange", syncMode);
    return () => {
      window.removeEventListener("hashchange", syncMode);
      document.body.classList.remove("nc-studio-package-home");
    };
  }, []);

  function openAnchor(anchor) {
    if (typeof window === "undefined") return;
    window.location.hash = anchor;
    setPackageHome(false);
    document.body.classList.remove("nc-studio-package-home");
    window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section id="studio-package" className="nc-studio-pack-v1" aria-label="NeuroCine package and pricing">
      <StudioPackageStyles />
      <div className="nc-studio-pack-shell-v1">
        <aside className="nc-studio-pack-head-v1">
          <div>
            <div className="nc-studio-pack-kicker-v1">NeuroCine Package</div>
            <h2 className="nc-studio-pack-title-v1">Пакет доступа Studio</h2>
            <p className="nc-studio-pack-copy-v1">
              После входа Studio сначала показывает пакет, тарифы и описание. Storyboard не стартует сам — он открывается из левого меню, кнопки плюс или пункта Studio.
            </p>
          </div>

          <div className="nc-studio-pack-status-v1">
            <div className="nc-studio-pack-chip-v1">
              <span>Текущий доступ</span>
              <strong>{liveLabel}</strong>
            </div>
            <div className="nc-studio-pack-chip-v1">
              <span>Активный пакет</span>
              <strong>{activePlan}</strong>
            </div>
            <div className="nc-studio-pack-actions-v1">
              <button className="nc-studio-pack-btn-v1 primary" type="button" onClick={() => openAnchor("setup")}>＋ Создать</button>
              <button className="nc-studio-pack-btn-v1" type="button" onClick={() => openAnchor("storyboard")}>Storyboard</button>
            </div>
          </div>
        </aside>

        <div className="nc-studio-pack-cards-v1">
          {STUDIO_PLANS.map((plan) => (
            <button key={plan.name} className={`nc-studio-pack-card-v1 ${plan.accent}`} type="button" onClick={() => openAnchor(plan.name === "FREE" ? "setup" : "pack")}>
              <div className="nc-studio-pack-card-top-v1">
                <strong>{plan.name}</strong>
                <span>{plan.tag}</span>
              </div>
              <div className="nc-studio-pack-price-v1">
                {plan.price}<small>{plan.sub}</small>
              </div>
              <ul className="nc-studio-pack-list-v1">
                {plan.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div className="nc-studio-pack-card-cta-v1">
                <span>{plan.name === activePlan ? "текущий пакет" : "открыть"}</span>
                <b>→</b>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="nc-studio-pack-note-v1">
        ✓ Сейчас показан стартовый пакет Studio. Чтобы увидеть генератор, открой Storyboard из меню слева или нажми “＋ Создать”.
      </div>
    </section>
  );
}
