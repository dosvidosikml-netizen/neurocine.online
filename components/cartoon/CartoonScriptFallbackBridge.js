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
  return `Однажды история «${title}» началась со странного светящегося знака. Главный герой заметил его там, где обычно всё было тихо и безопасно. Знак мягко пульсировал, будто звал на помощь. Герой пошёл за светом и оказался в мире, где игрушки двигались, тени шептали, а маленькие огоньки показывали дорогу. Сначала герой испугался и хотел вернуться домой. Но рядом появилось маленькое существо и объяснило, что волшебный свет почти погас. Если он исчезнет, весь мультяшный мир станет пустым и немым. Герой выбрал доброту вместо страха. Шаг за шагом он помог жителям собрать смелость, починить сломанное сияние и снова поверить друг в друга. В финале знак загорелся ярче прежнего, а герой вернулся домой с новой искрой внутри.`;
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
  window.setTimeout(() => el?.removeAttribute("data-show"), 2600);
}

async function ensureScriptFilled(reason = "manual") {
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
  mountToast(reason === "manual" ? "Вставлен локальный сценарий" : "AI долго не отвечает — локальный сценарий доступен вручную");
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
        const area = findScriptTextarea();
        if (!area || String(area.value || "").trim().length > 20) return;
        mountToast("AI ещё думает. Локальный fallback не вставляю поверх платного API.");
      }, 18000);
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
