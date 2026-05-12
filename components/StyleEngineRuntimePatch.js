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
  if (t.includes("horror")) return "horror";
  return "cinematic";
}

function previewHtml(key) {
  const d = DNA[key] || DNA.cinematic;
  return `<div class="style-dna-preview-kicker">STYLE DNA ACTIVE</div><strong>${d[0]}</strong><div class="style-dna-preview-grid"><span><b>Palette</b>${d[1]}</span><span><b>Motion</b>${d[2]}</span><span><b>Music</b>${d[3]}</span></div><em>Cover / Music / Visual Explainer будут пересобраны под выбранный стиль.</em>`;
}

function bind() {
  const grids = document.querySelectorAll(".setup-style-grid-v40, .style-grid-v40, .style-carousel-v40, [class*='style-grid'], [class*='style-carousel']");
  grids.forEach((grid) => {
    if (grid.dataset.ncStyleBound === "1") return;
    grid.dataset.ncStyleBound = "1";

    const panel = document.createElement("div");
    panel.className = "style-dna-preview-v1";
    panel.innerHTML = previewHtml("cinematic");
    grid.insertAdjacentElement("afterend", panel);

    const buttons = Array.from(grid.querySelectorAll("button"));
    buttons.forEach((btn) => {
      btn.type = "button";
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
      btn.addEventListener("click", () => {
        const key = keyFromText(btn.textContent || "");
        buttons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
          b.dataset.active = "false";
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        btn.dataset.active = "true";
        panel.innerHTML = previewHtml(key);
      });
    });
  });
}

export default function StyleEngineRuntimePatch() {
  useEffect(() => {
    bind();
    const mo = new MutationObserver(bind);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
