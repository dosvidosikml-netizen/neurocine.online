"use client";

import { useEffect } from "react";

const STORE_KEY = "neurocine.cartoon.timing.v1";

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, Number(num) || min));
}

function buildTiming(durationSec = 60, frameSeconds = 3) {
  const duration = clamp(durationSec, 15, 600);
  const frame = clamp(frameSeconds, 2, 4);
  const minScenes = Math.max(1, Math.ceil(duration / 4));
  const maxScenes = Math.max(minScenes, Math.floor(duration / 2));
  const targetScenes = clamp(Math.round(duration / frame), minScenes, maxScenes);
  const base = Math.max(2, Math.min(4, Math.floor(duration / targetScenes)));
  let rest = duration - base * targetScenes;
  const durations = Array.from({ length: targetScenes }, () => base);
  for (let i = 0; i < durations.length && rest > 0; i += 1) {
    if (durations[i] < 4) {
      durations[i] += 1;
      rest -= 1;
    }
  }
  return { duration, frameSeconds: frame, targetScenes, durations };
}

function readStored() {
  try { return JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}"); }
  catch { return {}; }
}

function writeStored(data) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() })); }
  catch {}
}

function findDurationInput() {
  const inputs = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input[type='range']"));
  return inputs.find((el) => Number(el.max) >= 300 || Number(el.max) === 600) || inputs[0] || null;
}

function getDuration() {
  const input = findDurationInput();
  const value = Number(input?.value || 60);
  return Number.isFinite(value) ? value : 60;
}

function getFrameSeconds() {
  const current = window.neurocineCartoonTiming?.frameSeconds;
  if (current) return Number(current);
  const saved = readStored();
  return Number(saved.frameSeconds || 3);
}

function publishTiming() {
  const timing = buildTiming(getDuration(), getFrameSeconds());
  window.neurocineCartoonTiming = timing;
  writeStored(timing);
  window.dispatchEvent(new CustomEvent("neurocine-cartoon-timing", { detail: timing }));
  return timing;
}

function updateDurationLabel() {
  const timing = publishTiming();
  const label = document.querySelector("body.route-cartoon .dur-sc");
  if (label) label.textContent = `≈ ${timing.targetScenes} сцен · ${timing.frameSeconds}с/кадр`;
}

function mountFrameSlider() {
  const durationInput = findDurationInput();
  if (!durationInput) return;
  const panel = durationInput.closest(".dur-panel") || durationInput.parentElement;
  if (!panel || panel.querySelector(".nc-frame-seconds-control")) return;

  const timing = publishTiming();
  const wrap = document.createElement("div");
  wrap.className = "nc-frame-seconds-control";
  wrap.innerHTML = `
    <div class="nc-frame-seconds-head"><span>Секунд на кадр</span><b>${timing.frameSeconds}с</b></div>
    <input class="nc-frame-seconds-range" type="range" min="2" max="4" step="1" value="${timing.frameSeconds}" />
    <div class="nc-frame-seconds-hint">2–4с на кадр · PART 2×2 остаётся по 4 кадра</div>
  `;
  panel.appendChild(wrap);

  const range = wrap.querySelector(".nc-frame-seconds-range");
  const badge = wrap.querySelector("b");
  range.addEventListener("input", () => {
    const next = buildTiming(getDuration(), Number(range.value));
    window.neurocineCartoonTiming = next;
    writeStored(next);
    if (badge) badge.textContent = `${next.frameSeconds}с`;
    updateDurationLabel();
  });
  updateDurationLabel();
}

export default function CartoonTimingBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const style = document.createElement("style");
    style.textContent = `
      .nc-frame-seconds-control{margin-top:18px;padding:14px 0 0;border-top:1px solid rgba(45,212,255,.10)}
      .nc-frame-seconds-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;color:rgba(120,180,255,.70);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .nc-frame-seconds-head b{color:#22d3ee;font-size:18px;letter-spacing:.04em;text-transform:none}
      .nc-frame-seconds-range{width:100%;accent-color:#22d3ee}
      .nc-frame-seconds-hint{margin-top:8px;color:rgba(148,163,184,.58);font-size:11px;line-height:1.35;letter-spacing:.04em}
    `;
    document.head.appendChild(style);

    mountFrameSlider();
    updateDurationLabel();
    const observer = new MutationObserver(() => { mountFrameSlider(); updateDurationLabel(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const onInput = (event) => {
      if (event.target === findDurationInput()) updateDurationLabel();
    };
    document.addEventListener("input", onInput, true);
    const timer = window.setInterval(updateDurationLabel, 1000);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      window.clearInterval(timer);
      style.remove();
    };
  }, []);

  return null;
}
