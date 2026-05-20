"use client";

import { useEffect } from "react";

const STORAGE_KEY = "neurocine.cartoon.autosave.dom.v1";
const GENERATION_RESTORE_PAUSE_MS = 45000;
const MUTATION_RESTORE_DEBOUNCE_MS = 90;

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

function isScriptFieldKey(key = "") {
  const text = String(key || "").toLowerCase();
  return text.includes("сценар") || text.includes("диктор") || text.includes("script");
}

function pauseRestore(ms = GENERATION_RESTORE_PAUSE_MS) {
  try {
    const until = Date.now() + Math.max(500, Number(ms) || GENERATION_RESTORE_PAUSE_MS);
    window.neurocineCartoonRestorePausedUntil = Math.max(Number(window.neurocineCartoonRestorePausedUntil || 0), until);
  } catch {}
}

function isRestorePaused() {
  return Number(window.neurocineCartoonRestorePausedUntil || 0) > Date.now();
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

function findScriptTextarea() {
  const areas = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root textarea.q-inp, body.route-cartoon .qcc-root textarea"));
  return areas.find((el) => {
    const text = `${el.placeholder || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase();
    return text.includes("сценар") || text.includes("диктор") || text.includes("script");
  }) || null;
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
  if (!saved?.fields || isRestorePaused()) return;
  const scriptClearUntil = Number(window.neurocineCartoonScriptClearedUntil || 0);
  const els = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input.q-inp, body.route-cartoon .qcc-root textarea.q-inp"));
  els.forEach((el, index) => {
    const key = fieldKey(el, index);
    const isScript = isScriptFieldKey(key);
    if (scriptClearUntil > Date.now() && isScript) return;
    if (!Object.prototype.hasOwnProperty.call(saved.fields, key)) return;

    const savedValue = String(saved.fields[key] || "");
    const currentValue = String(el.value || "");
    if (currentValue === savedValue) return;

    // The script textarea is React-controlled. If it already contains fresh text,
    // never replace it with an older non-empty autosave snapshot from MutationObserver.
    if (isScript && currentValue.trim() && savedValue.trim()) return;

    // Never overwrite a non-empty field with an empty saved value.
    if (!savedValue.trim() && currentValue.trim()) return;

    setNativeValue(el, savedValue);
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

function clearScriptAutosave() {
  try {
    window.neurocineCartoonScriptClearedUntil = Date.now() + 4000;
    const current = readSaved();
    const fields = { ...(current.fields || {}) };
    Object.keys(fields).forEach((key) => {
      if (isScriptFieldKey(key)) delete fields[key];
    });
    writeSaved({ ...current, fields, step: 3, scriptClearedAt: Date.now() });
  } catch {}

  const area = findScriptTextarea();
  if (area) setNativeValue(area, "");
}

function isClearScriptButton(target) {
  const btn = target?.closest?.("button");
  if (!btn) return false;
  const text = String(btn.textContent || "").toLowerCase();
  return text.includes("очистить текст сценар") || text.includes("clear script");
}

function isGenerateScriptButton(target) {
  const btn = target?.closest?.("button");
  if (!btn) return false;
  const text = String(btn.textContent || "").toLowerCase();
  return text.includes("сгенерировать сценар") || text.includes("generate script") || text.includes("ai думает");
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
    let mutationRestoreTimer = null;

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
    const onClick = (event) => {
      if (isClearScriptButton(event.target)) {
        window.setTimeout(() => {
          clearScriptAutosave();
          mountToast("Текст сценария очищен");
        }, 0);
        return;
      }
      if (isGenerateScriptButton(event.target)) pauseRestore();
      window.setTimeout(saveNow, 80);
    };
    const onBeforeUnload = () => saveNow();
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    const observer = new MutationObserver(() => {
      window.clearTimeout(mutationRestoreTimer);
      mutationRestoreTimer = window.setTimeout(restoreCycle, MUTATION_RESTORE_DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(saveNow, 1200);

    window.neurocineSaveNow = saveNow;
    window.neurocineCartoonPauseAutosaveRestore = pauseRestore;
    window.neurocineClearCartoonAutosave = () => {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
      mountToast("История мульт-проекта очищена");
    };
    window.neurocineClearCartoonScriptAutosave = () => {
      clearScriptAutosave();
      mountToast("Текст сценария очищен");
    };

    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      observer.disconnect();
      window.clearInterval(timer);
      window.clearTimeout(mutationRestoreTimer);
      style.remove();
    };
  }, []);

  return null;
}
