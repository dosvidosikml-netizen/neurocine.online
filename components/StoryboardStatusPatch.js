"use client";

import { useEffect } from "react";

function hasReadyStoryboardStatus() {
  const text = String(document.body?.innerText || "");
  return /Storyboard JSON готов|STORYBOARD.+\d+|FRAME GRID PROMPT|PART-сетка|FRAME GRID/i.test(text);
}

function normalizeStatusText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanStaleGenerationStatus() {
  const ready = hasReadyStoryboardStatus();
  const nodes = Array.from(document.querySelectorAll(".setup-statusline-v40"));
  nodes.forEach((node) => {
    const text = normalizeStatusText(node.textContent);
    if (!/Генерация|Storyboard\.\.\.|Ждём/i.test(text)) return;

    if (ready) {
      node.textContent = "✓ Storyboard готов — можно идти в блок 03";
      node.classList.remove("err");
      node.classList.add("nc-status-fixed-ok");
    } else {
      node.textContent = "";
      node.classList.remove("err");
      node.classList.add("nc-status-fixed-hidden");
    }
  });
}

function markStoryboardRunStarted() {
  const nodes = Array.from(document.querySelectorAll(".setup-statusline-v40"));
  nodes.forEach((node) => {
    node.classList.remove("nc-status-fixed-ok", "nc-status-fixed-hidden");
  });
}

export default function StoryboardStatusPatch() {
  useEffect(() => {
    const originalFetch = window.fetch;
    let pendingStoryboard = 0;
    let disposed = false;

    function scheduleClean(delay = 650) {
      window.setTimeout(() => {
        if (!disposed && pendingStoryboard <= 0) cleanStaleGenerationStatus();
      }, delay);
    }

    window.fetch = async (...args) => {
      const raw = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const isStoryboard = raw.includes("/api/storyboard");
      if (isStoryboard) {
        pendingStoryboard += 1;
        markStoryboardRunStarted();
      }
      try {
        return await originalFetch(...args);
      } finally {
        if (isStoryboard) {
          pendingStoryboard = Math.max(0, pendingStoryboard - 1);
          scheduleClean(900);
          scheduleClean(2200);
        }
      }
    };

    const observer = new MutationObserver(() => {
      if (pendingStoryboard <= 0) scheduleClean(700);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    scheduleClean(1200);
    scheduleClean(3500);

    return () => {
      disposed = true;
      window.fetch = originalFetch;
      observer.disconnect();
    };
  }, []);

  return null;
}
