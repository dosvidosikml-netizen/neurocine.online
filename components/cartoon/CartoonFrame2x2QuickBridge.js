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

function fallbackScript() {
  const title = readTitle();
  return `Однажды история «${title}» началась со странного светящегося знака. Маленький герой заметил его там, где раньше была только тишина. Он пошёл за светом и попал в место, где обычные вещи оживали. Сначала герой испугался, но потом понял, что свет просит о помощи. Герой собрался с духом, сделал добрый поступок и изменил весь мир вокруг. В финале он вернулся домой, а внутри него навсегда осталась новая искра.`;
}

function clickStep(step) {
  const nodes = Array.from(document.querySelectorAll("body.route-cartoon .qb-qubit"));
  const btn = nodes[Math.max(0, Number(step || 1) - 1)];
  if (btn) btn.click();
}

function clickNext() {
  const btn = document.querySelector("body.route-cartoon .qcc-root .nav-next");
  if (btn && !btn.disabled) btn.click();
}

function mountToast(text) {
  let el = document.querySelector(".nc-cartoon-frame2x2-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "nc-cartoon-frame2x2-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-show", "true");
  window.setTimeout(() => el?.removeAttribute("data-show"), 2200);
}

function ensureScript() {
  const area = findScriptTextarea();
  if (!area) return false;
  if (String(area.value || "").trim().length < 20) {
    setNativeValue(area, fallbackScript());
  }
  return true;
}

function openFrame2x2() {
  ensureScript();
  mountToast("Открываю Frame 2×2 production");
  clickStep(3);
  window.setTimeout(() => { ensureScript(); clickNext(); }, 180);
  window.setTimeout(() => { clickNext(); }, 520);
  window.setTimeout(() => { clickNext(); }, 1100);
}

function mountButton() {
  const root = document.querySelector("body.route-cartoon .qcc-root");
  if (!root || document.querySelector(".nc-frame2x2-quick")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nc-frame2x2-quick";
  btn.innerHTML = "▦ Frame 2×2<br/><span>prompt · upload · video</span>";
  btn.addEventListener("click", openFrame2x2);
  document.body.appendChild(btn);
}

export default function CartoonFrame2x2QuickBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const style = document.createElement("style");
    style.textContent = `
      .nc-frame2x2-quick{
        position:fixed;right:14px;bottom:206px;z-index:2147483002;
        min-width:148px;min-height:50px;padding:8px 12px;border-radius:18px;
        border:1px solid rgba(45,212,255,.36);
        background:linear-gradient(135deg,rgba(0,120,255,.90),rgba(139,0,255,.88));
        color:white;font-size:12px;font-weight:1000;letter-spacing:.055em;text-align:center;
        box-shadow:0 16px 42px rgba(37,99,235,.30),0 0 28px rgba(139,0,255,.28),inset 0 1px 0 rgba(255,255,255,.16);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      }
      .nc-frame2x2-quick span{display:block;margin-top:2px;font-size:9px;opacity:.82;letter-spacing:.03em}
      .nc-frame2x2-toast{
        position:fixed;left:50%;bottom:270px;transform:translateX(-50%) translateY(10px);
        z-index:2147483003;max-width:88vw;padding:9px 14px;border-radius:999px;
        border:1px solid rgba(45,212,255,.28);background:rgba(2,6,23,.82);
        color:rgba(225,246,255,.96);font-size:12px;font-weight:900;letter-spacing:.04em;
        opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      }
      .nc-frame2x2-toast[data-show="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
      @media(max-width:430px){.nc-frame2x2-quick{right:14px;bottom:198px;min-width:134px;min-height:46px;font-size:11px;border-radius:16px}}
    `;
    document.head.appendChild(style);

    mountButton();
    const observer = new MutationObserver(mountButton);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      style.remove();
      document.querySelectorAll(".nc-frame2x2-quick,.nc-frame2x2-toast").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
