"use client";

import { useEffect, useState } from "react";

function getActiveKey() {
  if (typeof window === "undefined") return "studio";
  const path = window.location.pathname || "";
  const hash = window.location.hash || "";

  if (path.startsWith("/projects")) return "projects";
  if (path.startsWith("/storyboard")) return "storyboard";
  if (path.startsWith("/studio") && hash.includes("studio-package")) return "pack";
  if (path.startsWith("/studio")) return "studio";
  return "studio";
}

function MobileBottomNavSkin() {
  return (
    <style jsx global>{`
      .nc-bottom-nav,
      .nc-bottom-nav * { box-sizing: border-box; }

      .nc-bottom-nav {
        position: fixed;
        left: 50%;
        bottom: max(10px, env(safe-area-inset-bottom));
        z-index: 500;
        width: min(calc(100% - 18px), 520px);
        min-height: 70px;
        transform: translateX(-50%);
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
        align-items: center;
        padding: 8px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 26px;
        background:
          radial-gradient(circle at 50% 0%, rgba(255,92,42,.18), transparent 42%),
          linear-gradient(180deg, rgba(18,20,30,.90), rgba(5,7,13,.88));
        box-shadow:
          0 22px 70px rgba(0,0,0,.58),
          inset 0 1px 0 rgba(255,255,255,.09);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .nc-bottom-nav::before {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        pointer-events: none;
        background: linear-gradient(135deg, rgba(255,255,255,.14), transparent 34%, rgba(255,92,42,.14));
        opacity: .55;
        mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        padding: 1px;
        mask-composite: exclude;
        -webkit-mask-composite: xor;
      }

      .nc-bottom-nav button {
        position: relative;
        min-width: 0;
        min-height: 54px;
        display: grid;
        place-items: center;
        gap: 2px;
        border: 1px solid transparent;
        border-radius: 19px;
        background: transparent;
        color: rgba(238,240,248,.52);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform .16s ease, color .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease;
      }

      .nc-bottom-nav button span {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        font-size: 17px;
        line-height: 1;
      }

      .nc-bottom-nav button b {
        max-width: 100%;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 9px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -.01em;
      }

      .nc-bottom-nav button:hover,
      .nc-bottom-nav button:focus-visible {
        color: #fff;
        background: rgba(255,255,255,.055);
        border-color: rgba(255,255,255,.09);
      }

      .nc-bottom-nav button.is-active {
        color: #fff;
        background: linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.045));
        border-color: rgba(255,255,255,.13);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 26px rgba(0,0,0,.20);
      }

      .nc-bottom-nav button.is-active::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 5px;
        width: 16px;
        height: 2px;
        border-radius: 999px;
        transform: translateX(-50%);
        background: linear-gradient(90deg, #ff4d5f, #ff8a3d);
        box-shadow: 0 0 14px rgba(255,92,42,.55);
      }

      .nc-bottom-nav .nc-create-plus {
        min-height: 62px;
        margin-top: -18px;
        border-radius: 23px;
        border-color: rgba(255,119,72,.45);
        background:
          radial-gradient(circle at 30% 12%, rgba(255,255,255,.42), transparent 18%),
          linear-gradient(135deg, #ff3f55, #ff7a3d);
        color: #16070a;
        font-size: 0;
        font-weight: 950;
        box-shadow: 0 16px 42px rgba(255,75,56,.32), inset 0 1px 0 rgba(255,255,255,.34);
      }

      .nc-bottom-nav .nc-create-plus::before {
        content: "+";
        font-size: 34px;
        line-height: 1;
        font-weight: 950;
        transform: translateY(-1px);
      }

      .nc-bottom-nav .nc-create-plus::after {
        content: "Создать";
        position: absolute;
        left: 50%;
        bottom: -14px;
        transform: translateX(-50%);
        color: rgba(238,240,248,.66);
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .02em;
      }

      .nc-bottom-nav .nc-create-plus:hover,
      .nc-bottom-nav .nc-create-plus:focus-visible {
        transform: translateY(-2px);
        color: #16070a;
        border-color: rgba(255,178,138,.74);
      }

      @media (max-width: 390px) {
        .nc-bottom-nav {
          width: min(calc(100% - 12px), 520px);
          gap: 4px;
          padding: 7px;
          border-radius: 24px;
        }
        .nc-bottom-nav button b { font-size: 8px; }
        .nc-bottom-nav button span { font-size: 16px; }
      }
    `}</style>
  );
}

export default function MobileBottomNav({ onCreate }) {
  const [active, setActive] = useState("studio");

  useEffect(() => {
    function syncActive() {
      setActive(getActiveKey());
    }
    syncActive();
    window.addEventListener("hashchange", syncActive);
    window.addEventListener("popstate", syncActive);
    return () => {
      window.removeEventListener("hashchange", syncActive);
      window.removeEventListener("popstate", syncActive);
    };
  }, []);

  function goStudioHome() {
    if (typeof window !== "undefined") window.location.href = "/studio";
  }

  function goProjects() {
    if (typeof window !== "undefined") window.location.href = "/projects";
  }

  function goStoryboard() {
    if (typeof window !== "undefined") window.location.href = "/storyboard#storyboard";
  }

  function goPack() {
    if (typeof window !== "undefined") window.location.href = "/studio#studio-package";
  }

  return (
    <>
      <MobileBottomNavSkin />
      <nav className="nc-bottom-nav" aria-label="NeuroCine mobile navigation">
        <button className={active === "studio" ? "is-active" : ""} type="button" onClick={goStudioHome}><span>⌂</span><b>Главная</b></button>
        <button className={active === "projects" ? "is-active" : ""} type="button" onClick={goProjects}><span>☷</span><b>Проекты</b></button>
        <button className="nc-create-plus" type="button" onClick={onCreate} aria-label="Создать">+</button>
        <button className={active === "storyboard" ? "is-active" : ""} type="button" onClick={goStoryboard}><span>▣</span><b>Кадры</b></button>
        <button className={active === "pack" ? "is-active" : ""} type="button" onClick={goPack}><span>◉</span><b>Пакет</b></button>
      </nav>
    </>
  );
}
