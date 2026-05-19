"use client";

import { useEffect } from "react";

const STORAGE_KEY = "neurocine.cartoon.autosave.dom.v1";

function readSaved() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeSaved(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

function fieldKey(el, index) {
  const field = el.closest?.(".q-field");
  const label = field?.querySelector?.(".q-label")?.textContent?.trim();
  const placeholder = el.getAttribute("placeholder") || "";
  return `${label || placeholder || el.name || el.id || "field"}#${index}`;
}

function setNativeValue(el, value) {
  if (!el || typeof value !== "string") return;
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: null }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function getActiveStep() {
  const nodes = Array.from(document.querySelectorAll("body.route-cartoon .qb-qubit"));
  const index = nodes.findIndex((btn) => btn.classList.contains("active"));
  return index >= 0 ? index + 1 : 1;
}

function clickStep(step) {
  const nodes = Array.from(document.querySelectorAll("body.route-cartoon .qb-qubit"));
  const btn = nodes[Math.max(0, Number(step || 1) - 1)];
  if (btn) btn.click();
}

function collectFields() {
  const fields = {};
  const els = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input.q-inp, body.route-cartoon .qcc-root textarea.q-inp"));
  els.forEach((el, index) => {
    fields[fieldKey(el, index)] = el.value || "";
  });
  return fields;
}

function restoreFields(saved) {
  if (!saved?.fields) return;
  const els = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input.q-inp, body.route-cartoon .qcc-root textarea.q-inp"));
  els.forEach((el, index) => {
    const key = fieldKey(el, index);
    if (Object.prototype.hasOwnProperty.call(saved.fields, key) && el.value !== saved.fields[key]) {
      // Never overwrite a non-empty field with an empty saved value —
      // this was wiping AI-generated scripts on every DOM mutation
      if (!String(saved.fields[key] || "").trim() && String(el.value || "").trim()) continue;
      setNativeValue(el, saved.fields[key]);
    }
  });
}

function saveNow() {
  const current = readSaved();
  const fields = collectFields();
  const hasUsefulField = Object.values(fields).some((v) => String(v || "").trim().length > 0);
  if (!hasUsefulField && !current.fields) return;
  writeSaved({
    ...current,
    path: "/cartoon",
    step: getActiveStep(),
    fields: { ...(current.fields || {}), ...fields },
  });
}

function mountToast(text) {
  let el = document.querySelector(".nc-cartoon-autosave-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "nc-cartoon-autosave-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.setAttribute("data-show", "true");
  window.setTimeout(() => el?.removeAttribute("data-show"), 1800);
}

export default function CartoonAutosaveBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      .nc-cartoon-autosave-toast{
        position:fixed;left:50%;bottom:214px;transform:translateX(-50%) translateY(10px);
        z-index:2147483001;max-width:88vw;padding:8px 13px;border-radius:999px;
        border:1px solid rgba(45,212,255,.22);background:rgba(2,6,23,.78);
        color:rgba(190,244,255,.94);font-size:12px;font-weight:800;letter-spacing:.04em;
        opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      }
      .nc-cartoon-autosave-toast[data-show="true"]{opacity:1;transform:translateX(-50%) translateY(0)}
    `;
    document.head.appendChild(style);

    const saved = readSaved();
    let restored = false;

    function restoreCycle() {
      const fresh = readSaved();
      restoreFields(fresh);
      if (!restored && fresh?.fields && Object.values(fresh.fields).some((v) => String(v || "").trim())) {
        restored = true;
        mountToast("История мульт-проекта восстановлена");
      }
    }

    window.setTimeout(() => {
      if (saved?.step && Number(saved.step) > 1) clickStep(Math.min(3, Number(saved.step)));
      restoreCycle();
    }, 450);

    window.setTimeout(() => {
      restoreCycle();
      if (saved?.step && Number(saved.step) > 3) clickStep(Number(saved.step));
    }, 1100);

    const onInput = () => saveNow();
    const onClick = () => window.setTimeout(saveNow, 80);
    const onBeforeUnload = () => saveNow();
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    const observer = new MutationObserver(() => restoreCycle());
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(saveNow, 1200);

    window.neurocineClearCartoonAutosave = () => {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
      mountToast("История мульт-проекта очищена");
    };

    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      observer.disconnect();
      window.clearInterval(timer);
      style.remove();
    };
  }, []);

  return null;
}
