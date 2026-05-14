"use client";

import { useEffect, useRef, useState } from "react";

const WATCH_ENDPOINTS = [
  "/api/chat",
  "/api/storyboard",
  "/api/script-polish",
  "/api/video",
  "/api/cover",
  "/api/seo-pack",
  "/api/social-pack",
  "/api/music-suno",
  "/api/tts-studio",
  "/api/character-bible",
];

const PHASES = [
  "Анализирую тему и тон",
  "Строю драматургию",
  "Разбиваю на кадры",
  "Усиливаю визуальные образы",
  "Проверяю связность",
  "Собираю production pack",
];

const TIPS = [
  "Не закрывай вкладку — генерация может идти 1–2 минуты.",
  "Длинные сценарии требуют больше времени: идёт сборка кадров и промтов.",
  "После генерации проверь score сценария и storyboard validation.",
  "Если сеть медленная, дождись статуса — запрос ещё может выполняться.",
];

function isWatchedUrl(input) {
  const raw = typeof input === "string" ? input : input?.url || "";
  return WATCH_ENDPOINTS.some((x) => raw.includes(x));
}

function oldInlineBusyPresent() {
  const text = String(document.body?.innerText || "");
  return /⏳\s*Генерация|Генерация\.\.\.|Storyboard\.\.\.|Ищу героев|Создаю\.\.\.|Ждём\.\.\./i.test(text);
}

function terminalStatusPresent() {
  const text = String(document.body?.innerText || "");
  return /Storyboard JSON готов|✓\s*Storyboard готов|ошибка|✗|error|готов\s*[·—-]/i.test(text);
}

function setInlineBusyHidden(hidden) {
  try {
    document.documentElement.classList.toggle("nc-generation-overlay-active", !!hidden);
  } catch {}
}

export default function GenerationCinematicOverlay() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState(PHASES[0]);
  const [tip, setTip] = useState(TIPS[0]);
  const startedAtRef = useRef(0);
  const pendingRef = useRef(0);
  const softHoldRef = useRef(false);
  const forceCloseTimerRef = useRef(null);

  useEffect(() => {
    const originalFetch = window.fetch;
    let disposed = false;

    function clearForceCloseTimer() {
      if (forceCloseTimerRef.current) {
        window.clearTimeout(forceCloseTimerRef.current);
        forceCloseTimerRef.current = null;
      }
    }

    function closeOverlay() {
      if (disposed) return;
      pendingRef.current = 0;
      softHoldRef.current = false;
      startedAtRef.current = 0;
      clearForceCloseTimer();
      setInlineBusyHidden(false);
      setActive(false);
    }

    function setOn({ soft = false } = {}) {
      if (disposed) return;
      if (!startedAtRef.current) startedAtRef.current = Date.now();
      if (soft) softHoldRef.current = true;
      setInlineBusyHidden(true);
      setActive(true);
      clearForceCloseTimer();
      forceCloseTimerRef.current = window.setTimeout(closeOverlay, 240000);
    }

    function setOffSoon() {
      if (disposed) return;
      const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      const delay = elapsed < 1200 ? 1200 - elapsed : 900;
      window.setTimeout(() => {
        if (disposed) return;
        if (pendingRef.current > 0) return;
        if (oldInlineBusyPresent() && !terminalStatusPresent()) {
          setOn({ soft: true });
          return;
        }
        closeOverlay();
      }, delay);
    }

    window.fetch = async (...args) => {
      const watched = isWatchedUrl(args[0]);
      if (watched) {
        pendingRef.current += 1;
        setOn();
      }
      try {
        return await originalFetch(...args);
      } finally {
        if (watched) {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
          setOffSoon();
        }
      }
    };

    const observer = new MutationObserver(() => {
      if (pendingRef.current > 0) return;
      if (oldInlineBusyPresent() && !terminalStatusPresent()) setOn({ soft: true });
      else if (softHoldRef.current) setOffSoon();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const phaseTimer = window.setInterval(() => {
      const elapsed = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
      setPhase(PHASES[Math.floor(elapsed / 12) % PHASES.length]);
      setTip(TIPS[Math.floor(elapsed / 18) % TIPS.length]);
    }, 1000);

    return () => {
      disposed = true;
      window.fetch = originalFetch;
      observer.disconnect();
      window.clearInterval(phaseTimer);
      clearForceCloseTimer();
      setInlineBusyHidden(false);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="nc-gen-overlay" aria-live="polite">
      <div className="nc-gen-card">
        <div className="nc-gen-orb">
          <span />
          <i />
        </div>
        <div className="nc-gen-copy">
          <div className="nc-gen-kicker">NEUROCINE ENGINE</div>
          <div className="nc-gen-title">Генерация идёт</div>
          <div className="nc-gen-phase">{phase}</div>
          <div className="nc-gen-bar"><b /></div>
          <div className="nc-gen-tip">{tip}</div>
        </div>
      </div>
    </div>
  );
}
