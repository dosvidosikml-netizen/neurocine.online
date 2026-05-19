"use client";

import { useEffect } from "react";

function mountToast(text) {
  let el = document.querySelector(".nc-cartoon-script-fallback-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "nc-cartoon-script-fallback-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-show", "true");
  window.setTimeout(() => el?.removeAttribute("data-show"), 2600);
}

function isGenerateScriptButton(target) {
  const btn = target?.closest?.("button");
  if (!btn) return false;
  const text = String(btn.textContent || "").toLowerCase();
  return text.includes("сгенерировать сценар") || text.includes("generate script");
}

export default function CartoonScriptFallbackBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      .nc-cartoon-script-fallback-toast{
        position:fixed;left:50%;bottom:258px;transform:translateX(-50%) translateY(10px);
        z-index:2147483002;max-width:88vw;padding:9px 14px;border-radius:999px;
        border:1px solid rgba(168,85,247,.28);background:rgba(18,7,36,.86);
        color:rgba(245,235,255,.96);font-size:12px;font-weight:900;letter-spacing:.04em;
        opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      }
      .nc-cartoon-script-fallback-toast[data-show="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
    `;
    document.head.appendChild(style);

    let pendingTimer = null;
    const onClick = (event) => {
      if (!isGenerateScriptButton(event.target)) return;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(() => {
        mountToast("Генерация только через платный API. Локальный AI отключён.");
      }, 18000);
    };

    document.addEventListener("click", onClick, true);
    window.neurocineCartoonForceScriptFallback = () => {
      mountToast("Локальная генерация сценария отключена. Нужен платный API.");
    };

    return () => {
      window.clearTimeout(pendingTimer);
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, []);

  return null;
}
