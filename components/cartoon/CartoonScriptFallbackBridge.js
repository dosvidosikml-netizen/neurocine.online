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

function localFallbackText() {
  const title = readTitle();
  return `Однажды история «${title}» началась со странного светящегося знака. Маленький герой заметил его там, где раньше была только тишина. Он пошёл за светом и попал в место, где обычные вещи оживали. Сначала герой испугался, но потом понял, что свет просит о помощи. Герой собрался с духом, сделал добрый поступок и изменил весь мир вокруг. В финале он вернулся домой, а внутри него навсегда осталась новая искра.`;
}

function mountToast(text) {
  let el = document.querySelector(".nc-cartoon-script-fallback-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "nc-cartoon-script-fallback-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-show", "true");
  window.setTimeout(() => el?.removeAttribute("data-show"), 2200);
}

async function ensureScriptFilled(reason = "fallback") {
  const area = findScriptTextarea();
  if (!area) return;
  if (String(area.value || "").trim().length > 20) return;

  let text = "";
  try {
    const res = await fetch("/api/cartoon/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "local", concept: { title: readTitle(), language: "ru", duration_sec: 60 }, script: { voice_style: "neutral" } }),
    });
    const data = await res.json().catch(() => ({}));
    text = data?.script?.full_text || "";
  } catch {}

  if (!text) text = localFallbackText();
  setNativeValue(area, text);
  try {
    window.localStorage.setItem("neurocine.cartoon.lastScriptFallbackAt", String(Date.now()));
  } catch {}
  mountToast(reason === "timeout" ? "AI не ответил — вставлен локальный сценарий" : "Сценарий создан локально");
}

function isGenerateScriptButton(target) {
  const btn = target?.closest?.("button");
  if (!btn) return false;
  const text = String(btn.textContent || "").toLowerCase();
  return text.includes("сгенерировать сценар") || text.includes("ai думает") || text.includes("generate script");
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
      pendingTimer = window.setTimeout(() => ensureScriptFilled("timeout"), 4200);
    };

    document.addEventListener("click", onClick, true);
    window.neurocineCartoonForceScriptFallback = () => ensureScriptFilled("manual");

    return () => {
      window.clearTimeout(pendingTimer);
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, []);

  return null;
}
