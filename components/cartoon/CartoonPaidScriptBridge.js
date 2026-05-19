"use client";

import { useEffect } from "react";

function setNativeValue(el, value) {
  if (!el) return false;
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function findScriptTextarea() {
  const areas = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root textarea.q-inp, body.route-cartoon textarea"));
  return areas.find((el) => {
    const text = `${el.placeholder || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase();
    return text.includes("сценар") || text.includes("диктор") || text.includes("script");
  }) || areas[0] || null;
}

function readTitle() {
  const inputs = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input.q-inp, body.route-cartoon input"));
  const titleInput = inputs.find((el) => {
    const text = `${el.placeholder || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase();
    return text.includes("название") || text.includes("мультфильма") || text.includes("кот");
  });
  return (titleInput?.value || "мультфильм").trim() || "мультфильм";
}

function readDuration() {
  const txt = document.body?.innerText || "";
  const m = txt.match(/(\d{2,3})\s*с\b/i);
  const n = Number(m?.[1] || 60);
  return Number.isFinite(n) ? n : 60;
}

function mountToast(text, danger = false) {
  let el = document.querySelector(".nc-cartoon-paid-script-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "nc-cartoon-paid-script-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-show", "true");
  el.setAttribute("data-danger", danger ? "true" : "false");
  window.setTimeout(() => el?.removeAttribute("data-show"), 3400);
}

function isGenerateScriptButton(target) {
  const btn = target?.closest?.("button");
  if (!btn) return null;
  const text = String(btn.textContent || "").toLowerCase();
  if (text.includes("сгенерировать сценар") || text.includes("generate script")) return btn;
  return null;
}

function setButtonBusy(btn, busy) {
  if (!btn) return;
  if (busy) {
    btn.dataset.ncOriginalText = btn.textContent || "";
    btn.textContent = "⚡ AI ДУМАЕТ...";
    btn.disabled = true;
  } else {
    if (btn.dataset.ncOriginalText) btn.textContent = btn.dataset.ncOriginalText;
    btn.disabled = false;
  }
}

export default function CartoonPaidScriptBridge({ liveAllowed = false, authToken = "" }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      .nc-cartoon-paid-script-toast{
        position:fixed;left:50%;bottom:258px;transform:translateX(-50%) translateY(10px);
        z-index:2147483004;max-width:88vw;padding:9px 14px;border-radius:999px;
        border:1px solid rgba(45,212,255,.28);background:rgba(4,18,38,.88);
        color:rgba(225,246,255,.96);font-size:12px;font-weight:900;letter-spacing:.04em;
        opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      }
      .nc-cartoon-paid-script-toast[data-danger="true"]{border-color:rgba(239,68,68,.34);background:rgba(38,8,18,.90);color:#ffd6dc;}
      .nc-cartoon-paid-script-toast[data-show="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
    `;
    document.head.appendChild(style);

    let busy = false;

    async function onClick(event) {
      const btn = isGenerateScriptButton(event.target);
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

      if (busy) return;
      const area = findScriptTextarea();
      if (!area) {
        mountToast("Поле сценария не найдено", true);
        return;
      }
      if (!liveAllowed || !authToken) {
        mountToast("Генерация только через платный API. Проверь вход и AI-ключ.", true);
        return;
      }

      busy = true;
      setButtonBusy(btn, true);
      mountToast("Платный API пишет текст диктора...");

      try {
        const res = await fetch("/api/cartoon/script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            concept: {
              title: readTitle(),
              language: "ru",
              duration_sec: readDuration(),
              format: "shorts",
              aspect_ratio: "9:16",
            },
            script: { voice_style: "neutral" },
          }),
        });

        const data = await res.json().catch(() => ({}));
        const text = String(data?.script?.full_text || data?.text || "").trim();

        if (!res.ok || data?.ok === false || !text) {
          const msg = data?.error || `API ошибка HTTP ${res.status}`;
          mountToast(msg, true);
          return;
        }

        setNativeValue(area, text);
        try { window.localStorage.setItem("neurocine.cartoon.lastPaidScriptAt", String(Date.now())); } catch {}
        mountToast(`AI сценарий готов · ${data.model_used || "OpenRouter"}`);
      } catch (e) {
        mountToast(e.message || "Сетевая ошибка API", true);
      } finally {
        busy = false;
        setButtonBusy(btn, false);
      }
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, [liveAllowed, authToken]);

  return null;
}
