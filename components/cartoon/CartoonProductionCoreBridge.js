"use client";

import { useEffect, useRef, useState } from "react";

const STORE_KEY = "neurocine.cartoon.production.core.v1";

function readStore() {
  try { return JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}"); }
  catch { return {}; }
}

function writeStore(next) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...next, savedAt: Date.now() })); }
  catch {}
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function cropSmartGridFrame(dataUrl, frameIndex, totalFrames = 4, cols = 2, topTrimPx = 0) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rows = Math.ceil(totalFrames / cols);
      let autoTrim = Number(topTrimPx) || 0;

      if (!autoTrim) {
        try {
          const probeH = Math.min(120, img.height);
          const probe = document.createElement("canvas");
          probe.width = img.width;
          probe.height = probeH;
          const pctx = probe.getContext("2d");
          pctx.drawImage(img, 0, 0, img.width, probeH, 0, 0, img.width, probeH);
          const pixels = pctx.getImageData(0, 0, img.width, probeH).data;
          for (let y = 0; y < probeH; y += 2) {
            let min = 255;
            let max = 0;
            for (let x = 0; x < img.width; x += Math.max(1, Math.floor(img.width / 160))) {
              const idx = (y * img.width + x) * 4;
              const lum = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
              if (lum < min) min = lum;
              if (lum > max) max = lum;
            }
            if (max - min > 58) { autoTrim = Math.max(0, y - 2); break; }
          }
        } catch {}
      }

      const usableH = Math.max(1, img.height - autoTrim);
      const cellW = Math.floor(img.width / cols);
      const cellH = Math.floor(usableH / rows);
      const col = frameIndex % cols;
      const row = Math.floor(frameIndex / cols);
      const sx = col * cellW;
      const sy = autoTrim + row * cellH;

      const labelTrim = Math.floor(cellH * 0.035);
      const canvas = document.createElement("canvas");
      canvas.width = cellW;
      canvas.height = Math.max(1, cellH - labelTrim);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy + labelTrim, cellW, cellH - labelTrim, 0, 0, cellW, cellH - labelTrim);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => reject(new Error("Не удалось прочитать grid image"));
    img.src = dataUrl;
  });
}

function copyText(text) {
  try { navigator.clipboard?.writeText(String(text || "")); } catch {}
}

function findScenePrompts(frameLabel) {
  const inspector = document.querySelector("body.route-cartoon .qframe-inspector") || document.querySelector("body.route-cartoon .qcc-root");
  const prompts = Array.from(document.querySelectorAll("body.route-cartoon .qprompt pre"));
  const image = prompts.find((p) => String(p.textContent || "").trim().startsWith("SCENE PRIMARY FOCUS:"));
  const video = prompts.find((p) => String(p.textContent || "").trim().startsWith("ANIMATE CURRENT FRAME:"));
  return {
    image: image?.textContent?.trim() || `SCENE PRIMARY FOCUS: ${frameLabel}. Cartoon production frame. Preserve style DNA, hero identity, clean composition, no text, no watermark.`,
    video: video?.textContent?.trim() || `ANIMATE CURRENT FRAME: ${frameLabel}. Smooth cartoon motion, preserve face lock, outfit lock, color DNA, style continuity. No subtitles, no UI, no watermark.`,
  };
}

function clickFrame(frameIndex) {
  const frames = Array.from(document.querySelectorAll("body.route-cartoon .qframe"));
  const btn = frames[frameIndex];
  if (btn && !btn.classList.contains("empty")) btn.click();
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function ProductionCorePanel() {
  const saved = typeof window !== "undefined" ? readStore() : {};
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState(saved.grid || "");
  const [cols, setCols] = useState(saved.cols || 2);
  const [trim, setTrim] = useState(saved.trim || 0);
  const [frames, setFrames] = useState(saved.frames || {});
  const [selected, setSelected] = useState(saved.selected || 0);
  const [note, setNote] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    writeStore({ grid, cols, trim, frames, selected });
  }, [grid, cols, trim, frames, selected]);

  async function onUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    setGrid(dataUrl);
    setFrames({});
    setSelected(0);
    setNote("Grid загружен");
    event.target.value = "";
  }

  async function cropFrame(index) {
    if (!grid) { setNote("Сначала загрузи 2×2 grid"); return; }
    try {
      const total = Math.max(4, Number(cols) * Math.ceil(4 / Number(cols)));
      const cropped = await cropSmartGridFrame(grid, index, total, Number(cols), Number(trim));
      setFrames((prev) => ({ ...prev, [index]: cropped }));
      setSelected(index);
      clickFrame(index);
      setNote(`F${String(index + 1).padStart(2, "0")} вырезан и выбран`);
    } catch (error) {
      setNote(error.message || "Crop ошибка");
    }
  }

  function clearCore() {
    setGrid("");
    setFrames({});
    setSelected(0);
    setNote("Production core очищен");
    try { window.localStorage.removeItem(STORE_KEY); } catch {}
  }

  const frameLabel = `F${String(Number(selected) + 1).padStart(2, "0")}`;
  const prompts = findScenePrompts(frameLabel);

  if (!open) {
    return (
      <button className="nc-prod-core-fab" type="button" onClick={() => setOpen(true)}>
        ▦ 2×2 Studio<span>grid · frame · prompts</span>
      </button>
    );
  }

  return (
    <div className="nc-prod-core-panel" role="dialog" aria-label="Cartoon Production 2x2 Studio">
      <div className="nc-prod-core-head">
        <div><b>Cartoon 2×2 Studio</b><span>старый storyboard core · cartoon style</span></div>
        <button type="button" onClick={() => setOpen(false)}>×</button>
      </div>

      <div className="nc-prod-core-actions">
        <button type="button" onClick={() => fileRef.current?.click()}>⬆ Grid 2×2</button>
        <button type="button" onClick={() => cropFrame(selected)}>✂ Crop {frameLabel}</button>
        <button type="button" onClick={() => downloadDataUrl(frames[selected], `${frameLabel}.jpg`)} disabled={!frames[selected]}>↓ Frame</button>
        <button type="button" className="danger" onClick={clearCore}>Очистить</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} hidden />
      </div>

      <div className="nc-prod-core-settings">
        <label>Cols <select value={cols} onChange={(e) => setCols(Number(e.target.value))}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
        <label>Header trim <input type="number" value={trim} min="0" max="220" onChange={(e) => setTrim(Number(e.target.value || 0))} /></label>
      </div>

      {grid && <img className="nc-prod-core-grid" src={grid} alt="Uploaded storyboard grid" />}

      <div className="nc-prod-core-frames">
        {[0,1,2,3].map((idx) => (
          <button type="button" key={idx} className={selected === idx ? "on" : ""} onClick={() => { setSelected(idx); clickFrame(idx); }}>
            {frames[idx] ? <img src={frames[idx]} alt={`F${idx + 1}`} /> : <i />}
            <b>F{String(idx + 1).padStart(2, "0")}</b>
          </button>
        ))}
      </div>

      <div className="nc-prod-core-copy">
        <button type="button" onClick={() => copyText(prompts.image)}>COPY IMAGE PROMPT</button>
        <button type="button" onClick={() => copyText(prompts.video)}>COPY VIDEO PROMPT</button>
      </div>

      {note && <div className="nc-prod-core-note">{note}</div>}
    </div>
  );
}

export default function CartoonProductionCoreBridge() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .nc-prod-core-fab{position:fixed;left:14px;bottom:206px;z-index:2147483002;min-width:142px;min-height:50px;padding:8px 12px;border-radius:18px;border:1px solid rgba(45,212,255,.36);background:linear-gradient(135deg,rgba(3,16,45,.94),rgba(25,8,54,.90));color:#eaffff;font-size:12px;font-weight:1000;letter-spacing:.055em;text-align:center;box-shadow:0 16px 42px rgba(0,0,0,.34),0 0 26px rgba(0,212,255,.18),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .nc-prod-core-fab span{display:block;margin-top:2px;font-size:9px;opacity:.78;letter-spacing:.03em}
      .nc-prod-core-panel{position:fixed;left:12px;right:12px;bottom:124px;z-index:2147483004;max-height:66vh;overflow:auto;border-radius:24px;border:1px solid rgba(45,212,255,.24);background:radial-gradient(circle at 0% 0%,rgba(0,212,255,.10),transparent 38%),linear-gradient(180deg,rgba(4,9,26,.96),rgba(8,5,18,.94));box-shadow:0 24px 70px rgba(0,0,0,.54),inset 0 1px 0 rgba(255,255,255,.08);padding:12px;color:#eaffff;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
      .nc-prod-core-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.nc-prod-core-head b{display:block;font-size:14px;letter-spacing:.06em}.nc-prod-core-head span{display:block;color:rgba(146,197,255,.66);font-size:10px;margin-top:3px}.nc-prod-core-head button{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:white;font-size:22px}
      .nc-prod-core-actions,.nc-prod-core-copy{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}.nc-prod-core-actions button,.nc-prod-core-copy button{min-height:38px;border-radius:14px;border:1px solid rgba(45,212,255,.20);background:rgba(2,11,34,.72);color:#dffbff;font-weight:900;font-size:11px;letter-spacing:.04em}.nc-prod-core-actions button.danger{border-color:rgba(255,77,95,.35);color:#ffd6dc;background:rgba(44,8,18,.72)}.nc-prod-core-actions button:disabled{opacity:.35}
      .nc-prod-core-settings{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.nc-prod-core-settings label{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);border-radius:13px;padding:8px;color:rgba(226,232,255,.75);font-size:11px}.nc-prod-core-settings select,.nc-prod-core-settings input{max-width:72px;border-radius:10px;border:1px solid rgba(45,212,255,.20);background:#050b1f;color:#eaffff;padding:4px 6px}
      .nc-prod-core-grid{width:100%;max-height:180px;object-fit:contain;border-radius:15px;border:1px solid rgba(45,212,255,.18);background:#020617;margin-bottom:10px}.nc-prod-core-frames{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}.nc-prod-core-frames button{position:relative;aspect-ratio:9/13;border-radius:14px;border:1px solid rgba(45,212,255,.14);background:radial-gradient(circle at 50% 28%,rgba(45,212,255,.12),transparent 42%),#050b1f;overflow:hidden;color:#67e8f9}.nc-prod-core-frames button.on{border-color:#22d3ee;box-shadow:0 0 20px rgba(34,211,238,.22)}.nc-prod-core-frames img{width:100%;height:100%;object-fit:cover}.nc-prod-core-frames i{position:absolute;left:50%;top:45%;width:10px;height:10px;border-radius:999px;background:#22d3ee;box-shadow:0 0 18px #22d3ee;transform:translate(-50%,-50%)}.nc-prod-core-frames b{position:absolute;left:7px;top:7px;padding:3px 6px;border-radius:999px;background:rgba(2,6,23,.72);font-size:9px;letter-spacing:.08em}.nc-prod-core-note{padding:8px 10px;border-radius:999px;text-align:center;border:1px solid rgba(45,212,255,.16);background:rgba(45,212,255,.07);color:#a5f3fc;font-size:11px;font-weight:900}
      @media(max-width:430px){.nc-prod-core-fab{left:14px;bottom:198px;min-width:128px;font-size:11px}.nc-prod-core-panel{bottom:116px;max-height:68vh}.nc-prod-core-copy button{font-size:10px}}
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return <ProductionCorePanel />;
}
