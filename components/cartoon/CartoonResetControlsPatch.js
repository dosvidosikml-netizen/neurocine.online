"use client";

import { useEffect } from "react";

function fireReactInput(el, value) {
  if (!el) return false;
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward", data: null }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function findScriptTextarea() {
  const areas = Array.from(document.querySelectorAll("body.route-cartoon textarea.q-inp, body.route-cartoon textarea"));
  return areas.find((el) => {
    const text = `${el.placeholder || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase();
    return text.includes("сценар") || text.includes("диктор") || text.includes("script");
  }) || null;
}

function clearScenarioOnly() {
  const area = findScriptTextarea();
  if (!area) return false;
  fireReactInput(area, "");
  area.focus();
  window.dispatchEvent(new CustomEvent("neurocine-cartoon-status", { detail: { status: "СЦЕНАРИЙ ОЧИЩЕН" } }));
  return true;
}

function resetCartoonProject() {
  try {
    sessionStorage.setItem("neurocine.cartoon.resetAt", String(Date.now()));
  } catch {}
  window.location.href = `/cartoon?reset=${Date.now()}`;
}

function makeButton(className, text, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  return btn;
}

function mountControls() {
  if (typeof document === "undefined") return;
  const root = document.querySelector("body.route-cartoon .qcc-v3");
  if (!root) return;

  const panel = root.querySelector(".step-panel.on");
  const scriptArea = findScriptTextarea();
  const target = scriptArea?.closest(".q-field") || panel?.querySelector(".q-body") || panel;
  if (!target || target.querySelector(".q-reset-row")) return;

  const row = document.createElement("div");
  row.className = "q-reset-row";
  const clearBtn = makeButton("q-reset-btn", "🧹 Очистить сценарий", () => {
    if (!clearScenarioOnly()) resetCartoonProject();
  });
  const resetBtn = makeButton("q-reset-btn danger", "↺ Сбросить всё", resetCartoonProject);
  row.append(clearBtn, resetBtn);
  target.insertAdjacentElement("afterend", row);
}

export default function CartoonResetControlsPatch() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.setAttribute("data-cartoon-reset-controls", "true");
    style.textContent = `
      body.route-cartoon .q-reset-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 8px;position:relative;z-index:5}
      body.route-cartoon .q-reset-btn{min-height:52px;border-radius:18px;border:1px solid rgba(0,212,255,.22);background:rgba(6,10,28,.58);color:rgba(230,245,255,.86);font-weight:900;letter-spacing:.06em;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 10px 26px rgba(0,0,0,.16);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
      body.route-cartoon .q-reset-btn.danger{border-color:rgba(255,77,95,.32);color:#ffd7dc;background:rgba(42,8,16,.50)}
      body.route-cartoon .q-reset-btn:active{transform:translateY(1px)}
      html[data-theme="light"] body.route-cartoon .q-reset-btn{border-color:rgba(22,163,74,.22);background:rgba(255,255,255,.80);color:#14532d;box-shadow:inset 0 1px 0 rgba(255,255,255,.94),0 10px 24px rgba(15,42,27,.07)}
      html[data-theme="light"] body.route-cartoon .q-reset-btn.danger{border-color:rgba(239,68,68,.24);background:rgba(255,245,245,.86);color:#991b1b}
      @media(max-width:430px){body.route-cartoon .q-reset-row{gap:10px}body.route-cartoon .q-reset-btn{min-height:48px;border-radius:16px;font-size:12px}}
    `;
    document.head.appendChild(style);

    mountControls();
    const observer = new MutationObserver(() => mountControls());
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(mountControls, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      style.remove();
      document.querySelectorAll("body.route-cartoon .q-reset-row").forEach((el) => el.remove());
    };
  }, []);

  return null;
}
