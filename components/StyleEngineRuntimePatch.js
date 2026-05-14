"use client";

import { useEffect } from "react";

const DNA = {
  truecrime: ["True Crime Evidence", "black/red/paper", "forensic zooms", "cold piano + pulse"],
  war: ["War Documentary", "dust/green/ochre", "long lens + handheld", "low brass pressure"],
  dark: ["Dark History Thriller", "cold shadows/amber", "slow reveal", "sub drone + cello"],
  neon: ["Neon Noir", "cyan/magenta/black", "wet parallax", "dark synth pulse"],
  analog: ["Analog Film", "portra/faded shadows", "gate weave", "warm tape noise"],
  horror: ["Mystic Horror", "blue/candle amber", "slow creep", "whisper pads"],
  cinematic: ["Cinematic Documentary", "warm neutrals", "slow push-in", "documentary bed"],
};

function keyFromText(text = "") {
  const t = String(text).toLowerCase();
  if (t.includes("crime")) return "truecrime";
  if (t.includes("war")) return "war";
  if (t.includes("dark") || t.includes("thriller")) return "dark";
  if (t.includes("neon") || t.includes("noir")) return "neon";
  if (t.includes("analog") || t.includes("kodak") || t.includes("vhs")) return "analog";
  if (t.includes("horror") || t.includes("mystic")) return "horror";
  return "cinematic";
}

function previewHtml(key) {
  const d = DNA[key] || DNA.cinematic;
  return `<div class="style-dna-preview-kicker">STYLE DNA ACTIVE</div><strong>${d[0]}</strong><div class="style-dna-preview-grid"><span><b>Palette</b>${d[1]}</span><span><b>Motion</b>${d[2]}</span><span><b>Music</b>${d[3]}</span></div><em>Этот стиль теперь выбран. Нажми генерацию/обновление, чтобы пересобрать storyboard, cover, music и visual explainer под него.</em>`;
}

function ensurePanel(grid) {
  let panel = grid.nextElementSibling;
  if (!panel || !panel.classList?.contains("style-dna-preview-v1")) {
    panel = document.createElement("div");
    panel.className = "style-dna-preview-v1";
    grid.insertAdjacentElement("afterend", panel);
  }
  return panel;
}

function bind() {
  const grids = document.querySelectorAll(".setup-style-grid-v40, .style-grid-v40, .style-carousel-v40, [class*='style-grid'], [class*='style-carousel']");
  grids.forEach((grid) => {
    const panel = ensurePanel(grid);
    const buttons = Array.from(grid.querySelectorAll("button"));
    const activeButton = buttons.find((b) => b.classList.contains("active") || b.getAttribute("aria-pressed") === "true") || buttons[0];
    if (activeButton && !panel.dataset.ready) {
      panel.innerHTML = previewHtml(keyFromText(activeButton.textContent || ""));
      panel.dataset.ready = "1";
    }

    buttons.forEach((btn) => {
      btn.type = "button";
      btn.dataset.styleKey = keyFromText(btn.textContent || "");
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
      if (btn.dataset.ncStyleButtonBound === "1") return;
      btn.dataset.ncStyleButtonBound = "1";

      btn.addEventListener("click", () => {
        const key = btn.dataset.styleKey || keyFromText(btn.textContent || "");
        buttons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
          b.dataset.active = "false";
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        btn.dataset.active = "true";
        panel.innerHTML = previewHtml(key);
        panel.dataset.ready = "1";
        try { window.localStorage.setItem("neurocine:selected-style-dna", key); } catch {}
        try { window.dispatchEvent(new CustomEvent("neurocine-style-selected", { detail: { key } })); } catch {}
      });
    });
  });
}

export default function StyleEngineRuntimePatch() {
  useEffect(() => {
    bind();
    const mo = new MutationObserver(bind);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-pressed"] });
    return () => mo.disconnect();
  }, []);
  return null;
}
