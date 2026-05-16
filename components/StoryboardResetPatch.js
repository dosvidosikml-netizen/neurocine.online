"use client";

import { useEffect } from "react";

const RESET_FLAG = "neurocine:reset-storyboard:restore-setup:v1";

function isStoryboardRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location?.pathname || "";
  return path === "/storyboard" || path.startsWith("/storyboard/");
}

function fieldByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((x) => String(x.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
  if (!label) return null;
  const wrap = label.closest(".setup-field-v40, .setup-manual-v40, .setup-main-v40") || label.parentElement;
  return wrap?.querySelector?.("input, textarea") || null;
}

function setNativeValue(el, value) {
  if (!el) return;
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc?.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function getSetupSnapshot() {
  return {
    projectName: fieldByLabel("название проекта")?.value || "",
    topic: document.querySelector("textarea.setup-topic-v40")?.value || fieldByLabel("тема ролика")?.value || "",
    script: document.querySelector("textarea.setup-script-v40")?.value || fieldByLabel("готовый сценарий")?.value || "",
    tone: fieldByLabel("тон")?.value || "",
  };
}

function restoreSetupSnapshot() {
  try {
    const raw = sessionStorage.getItem(RESET_FLAG);
    if (!raw) return;
    sessionStorage.removeItem(RESET_FLAG);
    const data = JSON.parse(raw);
    window.setTimeout(() => {
      setNativeValue(fieldByLabel("название проекта"), data.projectName || "");
      setNativeValue(document.querySelector("textarea.setup-topic-v40") || fieldByLabel("тема ролика"), data.topic || "");
      setNativeValue(document.querySelector("textarea.setup-script-v40") || fieldByLabel("готовый сценарий"), data.script || "");
      setNativeValue(fieldByLabel("тон"), data.tone || "cinematic documentary thriller");
    }, 900);
  } catch {}
}

function removeStoryboardStorage() {
  const remove = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      const isSetupDraft = lower.includes("nc_text_v3") || lower.includes("draft") || lower.includes("setup");
      const isStoryboardArtifact =
        lower.includes("storyboard") ||
        lower.includes("frame") ||
        lower.includes("grid") ||
        lower.includes("variant") ||
        lower.includes("crop") ||
        lower.includes("video") ||
        lower.includes("explore") ||
        lower.includes("part") ||
        lower.includes("production:v49");
      if (isStoryboardArtifact && !isSetupDraft) remove.push(key);
    }
    remove.forEach((key) => localStorage.removeItem(key));
  } catch {}
}

function mountButton() {
  if (!isStoryboardRoute()) return;
  if (document.querySelector("[data-nc-clear-storyboard]")) return;

  const storySection = document.querySelector("#storyboard") ||
    Array.from(document.querySelectorAll("section, .out-box, .setup-v40")).find((el) =>
      /Storyboard|STORYBOARD|V2 STATUS|FRAME GRID/i.test(String(el.textContent || ""))
    );
  if (!storySection) return;

  const bar = document.createElement("div");
  bar.className = "nc-clear-storyboard-bar";
  bar.style.display = "flex";
  bar.style.justifyContent = "center";
  bar.style.gap = "10px";
  bar.style.margin = "18px 0";
  bar.style.flexWrap = "wrap";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.ncClearStoryboard = "1";
  btn.textContent = "🧹 Удалить storyboard";
  btn.className = "setup-btn-v40 ghost";
  btn.style.maxWidth = "520px";
  btn.style.width = "100%";
  btn.style.border = "1px solid rgba(255,255,255,.18)";
  btn.style.background = "rgba(255,255,255,.06)";

  const hint = document.createElement("div");
  hint.textContent = "Оставит тему и сценарий, очистит кадры, grid, prompts и зависшие статусы";
  hint.style.width = "100%";
  hint.style.textAlign = "center";
  hint.style.fontSize = "12px";
  hint.style.color = "rgba(238,240,248,.52)";

  btn.addEventListener("click", () => {
    const snapshot = getSetupSnapshot();
    try { sessionStorage.setItem(RESET_FLAG, JSON.stringify(snapshot)); } catch {}
    removeStoryboardStorage();
    window.location.href = "/storyboard?resetStoryboard=1&t=" + Date.now();
  });

  bar.appendChild(btn);
  bar.appendChild(hint);

  const target = storySection.querySelector(".out-head, .setup-actions-v40") || storySection.firstElementChild || storySection;
  target.parentElement?.insertBefore(bar, target.nextSibling);
}

export default function StoryboardResetPatch() {
  useEffect(() => {
    if (!isStoryboardRoute()) return;
    restoreSetupSnapshot();
    mountButton();
    const observer = new MutationObserver(mountButton);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
