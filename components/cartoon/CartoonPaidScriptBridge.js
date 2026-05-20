"use client";

import { useEffect } from "react";

let rememberedTopic = "";

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

function normalizeTopic(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\.([А-ЯA-ZЁ])/g, ". $1")
    .trim();
}

function isTitleMeta(meta = "") {
  return /название|мультфильм|точная тема|тема|title|project|topic/i.test(String(meta || ""));
}

function rememberTopic(value) {
  const clean = normalizeTopic(value);
  if (clean.length >= 3) rememberedTopic = clean;
  return clean;
}

function findScriptTextarea() {
  const areas = Array.from(document.querySelectorAll("body.route-cartoon .qcc-root textarea.q-inp, body.route-cartoon textarea"));
  return areas.find((el) => {
    const text = `${el.placeholder || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase();
    return text.includes("сценар") || text.includes("диктор") || text.includes("script");
  }) || areas[0] || null;
}

function getVisibleInputs() {
  return Array.from(document.querySelectorAll("body.route-cartoon .qcc-root input, body.route-cartoon input"))
    .filter((el) => {
      if (el.type === "file" || el.type === "hidden" || el.type === "range") return false;
      const rect = el.getBoundingClientRect?.();
      return !rect || (rect.width > 20 && rect.height > 10);
    });
}

function maybeRememberFromInput(el) {
  if (!el) return "";
  if (el.type === "file" || el.type === "hidden" || el.type === "range") return "";
  const value = normalizeTopic(el.value);
  const meta = `${el.placeholder || ""} ${el.getAttribute("aria-label") || ""} ${el.closest(".q-field")?.textContent || ""}`;
  if (value.length >= 3 && isTitleMeta(meta)) return rememberTopic(value);
  return "";
}

function readTitle() {
  const inputs = getVisibleInputs();
  const filled = inputs
    .map((el) => ({
      el,
      value: normalizeTopic(el.value),
      meta: `${el.placeholder || ""} ${el.getAttribute("aria-label") || ""} ${el.closest(".q-field")?.textContent || ""}`.toLowerCase(),
    }))
    .filter((x) => x.value.length >= 3);

  const exact = filled.find((x) => isTitleMeta(x.meta));
  if (exact?.value) return rememberTopic(exact.value);

  if (rememberedTopic) return rememberedTopic;

  const longest = filled.sort((a, b) => b.value.length - a.value.length)[0];
  if (longest?.value) return rememberTopic(longest.value);

  return "";
}

function readProjectLanguage() {
  const text = document.body?.innerText || "";
  if (/UA\s*·\s*Укр|UA\b/.test(text)) return "ua";
  if (/EN\s*·\s*Eng|EN\b/.test(text)) return "en";
  return "ru";
}

function readDuration() {
  const txt = document.body?.innerText || "";
  const m = txt.match(/(\d{2,3})\s*с\b/i);
  const n = Number(m?.[1] || 60);
  return Number.isFinite(n) ? n : 60;
}

function readTimingPlan() {
  const live = window.neurocineCartoonTiming || {};
  const duration = Math.max(15, Math.min(600, Number(live.duration || live.duration_sec || readDuration()) || 60));
  const frameSeconds = Math.max(2, Math.min(4, Number(live.frameSeconds || live.frame_duration_sec || 3) || 3));
  const body = document.body?.innerText || "";
  const sceneBadge = body.match(/STORYBOARD\s+(\d+)\s+сцен/i);
  const scenes = Math.max(1, Number(live.scenes || live.target_scene_count || sceneBadge?.[1]) || Math.round(duration / frameSeconds));
  return { duration, frameSeconds, scenes };
}

function splitScriptScenes(text = "") {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]\s*|\d{1,3}[).:-]\s*)/, "").trim())
    .filter((line) => line.length > 3);
}

function trimScriptToSceneCount(text = "", maxScenes = 1) {
  const target = Math.max(1, Number(maxScenes) || 1);
  if (typeof window.neurocineCartoonTrimToSceneCount === "function") {
    return window.neurocineCartoonTrimToSceneCount(text, target);
  }
  const scenes = splitScriptScenes(text);
  if (scenes.length <= target) return String(text || "").trim();
  return scenes.slice(0, target).join(" ");
}

function readSelectedText(options) {
  const body = document.body?.innerText || "";
  for (const item of options) {
    if (body.includes(item.label) || body.includes(item.id)) return item.id;
  }
  return options[0]?.id || "";
}

function buildPayload() {
  const title = readTitle();
  const timing = readTimingPlan();
  const language = readProjectLanguage();
  const style = readSelectedText([
    { id: "pixar3d", label: "3D Pixar" },
    { id: "cinematic", label: "Кинематограф" },
    { id: "storybook_anime", label: "Studio Ghibli" },
    { id: "watercolor", label: "Акварель" },
    { id: "comic", label: "Комикс" },
    { id: "kids_book", label: "Детская книжка" },
    { id: "flat_design", label: "Flat" },
    { id: "clay", label: "Пластилин" },
    { id: "cyberpunk", label: "Киберпанк" },
    { id: "dark_fantasy", label: "Тёмное фэнтези" },
    { id: "anime_manga", label: "Аниме" },
  ]);
  const mood = readSelectedText([
    { id: "light", label: "СВЕТЛЫЙ" },
    { id: "dark", label: "ТЁМНЫЙ" },
    { id: "epic", label: "ЭПИК" },
    { id: "cute", label: "МИЛЫЙ" },
    { id: "mystery", label: "ТАЙНА" },
  ]);

  return {
    concept: {
      title,
      topic: title,
      exact_user_topic: title,
      language,
      duration_sec: timing.duration,
      frame_duration_sec: timing.frameSeconds,
      target_scene_count: timing.scenes,
      format: "shorts",
      aspect_ratio: "9:16",
    },
    timing: {
      duration_sec: timing.duration,
      frame_duration_sec: timing.frameSeconds,
      target_scene_count: timing.scenes,
    },
    style: {
      preset: style || "pixar3d",
      mood: mood || "light",
      palette: "AUTO",
    },
    script: {
      voice_style: "neutral",
      full_text: "",
      language,
    },
    instruction: `Write ONLY about this exact topic: ${title}. Do not introduce cats, stars, city, paper kite, or any unrelated cute story unless those are explicitly in the topic.`,
  };
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
  window.setTimeout(() => el?.removeAttribute("data-show"), 4200);
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

    const rememberFromEvent = (event) => {
      const input = event.target?.closest?.("input");
      if (input) maybeRememberFromInput(input);
    };

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

      const payload = buildPayload();
      if (!payload.concept.title || payload.concept.title.length < 4) {
        mountToast("Тема не найдена. Вернись на шаг 01 и проверь название.", true);
        return;
      }

      busy = true;
      setButtonBusy(btn, true);
      try { window.neurocineCartoonPauseAutosaveRestore?.(); } catch {}
      mountToast(`Платный API пишет: ${payload.concept.title.slice(0, 58)}`);

      try {
        const res = await fetch("/api/cartoon/script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        const text = String(data?.script?.full_text || data?.text || "").trim();

        if (!res.ok || data?.ok === false || !text) {
          const msg = data?.error || `API ошибка HTTP ${res.status}`;
          mountToast(msg, true);
          return;
        }

        const targetScenes = Number(data?.target_scene_count || payload.timing?.target_scene_count || payload.concept.target_scene_count || 1);
        const finalText = trimScriptToSceneCount(text, targetScenes);
        setNativeValue(area, finalText);
        window.setTimeout(() => { try { window.neurocineSaveNow?.(); } catch {} }, 120);
        mountToast(`AI сценарий готов · ${splitScriptScenes(finalText).length}/${targetScenes} сцен · ${data.model_used || "OpenRouter"}`);
      } catch (e) {
        mountToast(e.message || "Сетевая ошибка API", true);
      } finally {
        busy = false;
        setButtonBusy(btn, false);
      }
    }

    document.addEventListener("input", rememberFromEvent, true);
    document.addEventListener("change", rememberFromEvent, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("input", rememberFromEvent, true);
      document.removeEventListener("change", rememberFromEvent, true);
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, [liveAllowed, authToken]);

  return null;
}
