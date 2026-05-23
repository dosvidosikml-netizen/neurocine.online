"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PROJECT_TYPES, STYLE_PRESETS,
  build2KPrompt, buildStoryGridPrompt, buildChunkGridPrompt,
  buildContinuationPrompt, buildExplorePrompt, getStyleProfile
} from "../../engine/directorEngine_v4";
import {
  storyboardToProjectJson
} from "../../engine/sceneEngine";
import {
  splitScenesIntoParts, buildAutoChainPartPrompt, buildAutoChainAllParts,
  buildAutoVideoPack, buildAutoChainJson, buildFlowCompactPartPrompt
} from "../../engine/autoChainEngine";
import { downloadTextFile, downloadJsonFile, safeFileName } from "../../lib/download";
import { validateScript } from "../../lib/scriptValidator";
import ProductionPack from "../../components/ProductionPack";
import AuthPanel from "../../components/AuthPanel";
import StudioFlowPanel from "../../components/StudioFlowPanel";
import TopActionBar from "../../components/TopActionBar";
import MobileBottomNav from "../../components/MobileBottomNav";
import SideDrawer from "../../components/SideDrawer";
import CreateHub from "../../components/CreateHub";
import QuickStartHub from "../../components/QuickStartHub";
import WizardSteps from "../../components/WizardSteps";
import { getAccountAccess, shouldForceLiveForAccount } from "../../lib/accountRoles";
import { MOCK_SCRIPT_RU, buildMockScript, buildMockStoryboard, buildMockVideoPrompt } from "../../lib/mockData";

/* ─── browser draft keys ───
   v49: drafts are scoped by Supabase user id.
   This prevents one Google account from seeing another account's local browser draft. */
const BASE_KEY_TEXT  = "nc_text_v3";
const BASE_KEY_IMGS  = "nc_imgs_v3";
function scopedDraftKey(base, ownerId) {
  return ownerId ? `${base}:user:${ownerId}` : `${base}:guest`;
}

/* ─── grid cols helper ─── */
function gridCols(n) { return n <= 8 ? 2 : 3; }
function partGridCols(n) { const count = Math.max(1, Number(n) || 1); return count <= 2 ? count : 2; }
function gridRows(n, cols = gridCols(n)) { return Math.max(1, Math.ceil(Math.max(1, Number(n) || 1) / Math.max(1, cols))); }
function partCellLabel(i) { return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] || String(i + 1); }

/* ─── Flow/VEO TXT export ─── */
function buildFlowTxt(storyboard, styleProfile) {
  if (!storyboard) return "";
  const sb = storyboard;
  const chars = (sb.character_lock || [])
    .map(c => `${c.name} — ${c.description}`)
    .join("\n");
  const lines = [
    `STORYBOARD GRID — ${sb.project_name || "NeuroCine Project"}`,
    `FORMAT: Vertical ${sb.aspect_ratio || "9:16"}`,
    `STYLE LOCK: ${styleProfile?.style_lock || sb.global_style_lock || ""}`,
    "",
    chars ? `CHARACTER LOCK:\n${chars}` : "",
    "",
  ].filter(l => l !== null);

  (sb.scenes || []).forEach(s => {
    const vis = (s.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS:\s*/i, "").trim();
    // strip SFX from video_prompt_en for ANIMATION field
    const anim = (s.video_prompt_en || "")
      .replace(/^ANIMATE CURRENT FRAME:\s*/i, "")
      .replace(/\s*SFX:.*$/is, "")
      .trim();
    lines.push(
      `FRAME ${String(s.id || "").replace("frame_", "").padStart(2, "0")} / ${s.start ?? "?"}–${s.end ?? "?"}s`,
      `VISUAL: ${vis}`,
      `ANIMATION: ${anim}`,
      `VO: ${s.vo_ru || ""}`,
      `SFX: ${s.sfx || ""}`,
      ""
    );
  });
  return lines.join("\n");
}

/* ─── helpers ─── */
function readAsDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* crop one frame from a storyboard grid by index */
function cropGridFrame(dataUrl, frameIndex, totalFrames, cols, topTrimPx = 0) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const rows  = Math.ceil(totalFrames / cols);

      // Auto-detect header: scan top pixels for a solid dark/light header bar
      // If topTrimPx not provided, try to auto-detect by finding first row
      // where image content starts (non-uniform color row)
      let autoTrim = topTrimPx;
      if (autoTrim === 0) {
        const probe = document.createElement("canvas");
        probe.width = img.width; probe.height = Math.min(80, img.height);
        const pctx = probe.getContext("2d");
        pctx.drawImage(img, 0, 0, img.width, 80, 0, 0, img.width, 80);
        const pd = pctx.getImageData(0, 0, img.width, 80).data;
        // Scan rows top-down, find first row with high variance (real content)
        for (let y = 0; y < 80; y++) {
          let min = 255, max = 0;
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const lum = (pd[idx] + pd[idx+1] + pd[idx+2]) / 3;
            if (lum < min) min = lum;
            if (lum > max) max = lum;
          }
          // High variance row = real image content
          if (max - min > 60) { autoTrim = y; break; }
        }
      }

      const usableH = img.height - autoTrim;
      const cellW   = Math.floor(img.width / cols);
      const cellH   = Math.floor(usableH / rows);
      const col     = frameIndex % cols;
      const row     = Math.floor(frameIndex / cols);
      const sx      = col * cellW;
      const sy      = autoTrim + row * cellH;

      // Also trim label strip inside cell (top ~3% of cell)
      const labelH  = Math.floor(cellH * 0.03);
      const cv      = document.createElement("canvas");
      cv.width      = cellW;
      cv.height     = cellH - labelH;
      cv.getContext("2d").drawImage(img, sx, sy + labelH, cellW, cellH - labelH, 0, 0, cellW, cellH - labelH);
      res(cv.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}
function cropQuadrant(dataUrl, variant) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const w2 = Math.floor(img.width / 2);
      const h2 = Math.floor(img.height / 2);
      const cv = document.createElement("canvas");
      cv.width = w2; cv.height = h2;
      const sx = (variant === "B" || variant === "D") ? w2 : 0;
      const sy = (variant === "C" || variant === "D") ? h2 : 0;
      cv.getContext("2d").drawImage(img, sx, sy, w2, h2, 0, 0, w2, h2);
      res(cv.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}

function safeJson(v) { try { return JSON.parse(v); } catch { return null; } }

function tryLsSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch { return false; }
}

function collectProductionCache(ownerId = "guest") {
  const out = {};
  const ownerKey = String(ownerId || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
  const prefix = `neurocine:production:v49:${ownerKey}:`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(prefix)) out[key] = localStorage.getItem(key);
    }
  } catch {}
  return out;
}

function restoreProductionCache(cache = {}, ownerId = "guest") {
  const ownerKey = String(ownerId || "guest").replace(/[^a-zA-Z0-9_-]/g, "_");
  const prefix = `neurocine:production:v49:${ownerKey}:`;
  try {
    Object.entries(cache || {}).forEach(([key, value]) => {
      if (key.startsWith(prefix) && value != null) {
        localStorage.setItem(key, String(value));
      }
    });
  } catch {}
}

/* ─── tiny components ─── */
function CopyBtn({ text, label = "Копировать" }) {
  const [ok, setOk] = useState(false);
  async function go() {
    if (!text) return;
    await navigator.clipboard.writeText(String(text));
    setOk(true); setTimeout(() => setOk(false), 1400);
  }
  return (
    <button className="btn btn-sm btn-ghost" onClick={go} disabled={!text}>
      {ok ? "✓ Скопировано" : label}
    </button>
  );
}

function OutBox({ label, text, empty = "Пусто", compact = false, mono = false }) {
  const [open, setOpen] = useState(!compact && String(text || "").length < 900);
  const hasText = !!text;
  return (
    <div className={`out-box prompt-card-v33 ${open ? "is-open" : "is-closed"}`}>
      <div className="out-head">
        <span className="out-label">{label}</span>
        <div className="out-actions-v33">
          {hasText && (
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(v => !v)}>
              {open ? "Свернуть" : "Открыть"}
            </button>
          )}
          <CopyBtn text={text} />
        </div>
      </div>
      <div className="out-body">
        {hasText
          ? <pre className={`out-pre${compact ? " compact" : ""}${mono ? " mono" : ""}`}>{text}</pre>
          : <div className="out-empty">{empty}</div>}
      </div>
    </div>
  );
}

function UploadZone({ label, hint, onFile, accept = "image/*" }) {
  return (
    <div className="upload-zone">
      <input type="file" accept={accept} onChange={async e => {
        const f = e.target.files?.[0];
        if (f) { const url = await readAsDataUrl(f); onFile(url); e.target.value = ""; }
      }} />
      <div className="upload-icon">📎</div>
      <div className="upload-text">{label}</div>
      {hint && <div className="upload-hint">{hint}</div>}
    </div>
  );
}



const UI_TEXT = {
  ru: {
    lang: "RU", otherLang: "EN", ready: "READY", waiting: "WAITING", generating: "GENERATING", active: "ACTIVE", locked: "LOCKED", frames: "FRAMES",
    dashboard: "NeuroCine Studio Dashboard V35", titleA: "Cinematic", titleB: "Control Room",
    desc: "Единый production-пульт: сценарий, storyboard, PART grid, video prompts, cover, social export и visual explainer в одном рабочем потоке.",
    project: "PROJECT", emptyTopic: "Введи тему или вставь готовый сценарий",
    style: "Style", target: "Model target", scenes: "Scenes",
    navHome: "Главная", navChat: "Chat", navStudio: "Studio", save: "💾 Project", load: "⬆ Project", clear: "Очистить",
    railScript: "Script", railStoryboard: "Storyboard", railPipeline: "Pipeline", railPack: "Pack",
    statusScript: "SCRIPT", statusStoryboard: "STORYBOARD", statusPart: "PART", statusVideo: "VIDEO", statusCover: "COVER", statusSave: "SAVE",
    ok: "✓", no: "—", focus: "Focus", compact: "Compact", open: "Открыть", close: "Свернуть", copy: "Копировать", copied: "✓ Скопировано", empty: "Пусто", devMode: "DEMO", liveMode: "PRO", devHint: "FREE Preview · попробуйте Studio и сохраните до 3 проектов"
  },
  en: {
    lang: "EN", otherLang: "RU", ready: "READY", waiting: "WAITING", generating: "GENERATING", active: "ACTIVE", locked: "LOCKED", frames: "FRAMES",
    dashboard: "NeuroCine Studio Dashboard V35", titleA: "Cinematic", titleB: "Control Room",
    desc: "A unified production console for script, storyboard, PART grid, video prompts, covers, social export and visual explainers in one workflow.",
    project: "PROJECT", emptyTopic: "Enter a topic or paste a finished script",
    style: "Style", target: "Model target", scenes: "Scenes",
    navHome: "Home", navChat: "Chat", navStudio: "Studio", save: "💾 Project", load: "⬆ Project", clear: "Clear",
    railScript: "Script", railStoryboard: "Storyboard", railPipeline: "Pipeline", railPack: "Pack",
    statusScript: "SCRIPT", statusStoryboard: "STORYBOARD", statusPart: "PART", statusVideo: "VIDEO", statusCover: "COVER", statusSave: "SAVE",
    ok: "✓", no: "—", focus: "Focus", compact: "Compact", open: "Open", close: "Collapse", copy: "Copy", copied: "✓ Copied", empty: "Empty", devMode: "DEMO", liveMode: "PRO", devHint: "FREE Preview · try the Studio and save up to 3 projects"
  }
};

function ProductionStatusBar({ t, script, storyboard, autoPartIndex, videoP, finalImg }) {
  const scenes = storyboard?.scenes || [];
  const cells = [
    { label: t.statusScript, value: script?.trim() ? t.ok : t.no, ok: !!script?.trim() },
    { label: t.statusStoryboard, value: storyboard ? `${scenes.length}` : t.no, ok: !!storyboard },
    { label: t.statusPart, value: storyboard ? `#${Number(autoPartIndex || 0) + 1}` : t.no, ok: !!storyboard },
    { label: t.statusVideo, value: videoP ? t.ready : t.no, ok: !!videoP },
    { label: t.statusCover, value: script?.trim() || storyboard ? t.active : t.locked, ok: !!(script?.trim() || storyboard) },
    { label: t.statusSave, value: t.ready, ok: true },
  ];
  return (
    <div className="studio-status-bar-v33">
      {cells.map((c) => (
        <div key={c.label} className={`studio-status-cell-v33 ${c.ok ? "ok" : ""}`}>
          <span>{c.label}</span>
          <strong>{c.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StudioDashboardHero({ projectName, topic, script, storyboard, scenes, duration, aspectRatio, target, stylePreset, sbBusy, sBusy, lang, onLang }) {
  const t = UI_TEXT[lang] || UI_TEXT.ru;
  const progress = [
    { id: "#script", n: "01", title: t.railScript, value: script?.trim() ? t.ready : t.waiting, ok: !!script?.trim() },
    { id: "#storyboard", n: "02", title: t.railStoryboard, value: storyboard ? `${scenes?.length || 0} ${t.frames}` : t.waiting, ok: !!storyboard },
    { id: "#production", n: "03", title: t.railPipeline, value: target?.toUpperCase?.() || "VEO3", ok: !!storyboard },
    { id: "#pack", n: "04", title: t.railPack, value: script?.trim() || storyboard ? t.active : t.locked, ok: !!(script?.trim() || storyboard) }
  ];
  return (
    <section className="studio-control-room">
      <div className="control-glow" />
      <div className="control-left">
        <div className="control-kicker">{t.dashboard}</div>
        <h1 className="control-title">{t.titleA}<br /><span>{t.titleB}</span></h1>
        <p className="control-desc">{t.desc}</p>
        <div className="control-topic">
          <span>{t.project}</span>
          <strong>{projectName || "NeuroCine Project"}</strong>
          <em>{topic?.trim() || t.emptyTopic}</em>
        </div>
      </div>
      <div className="control-right">
        <div className="control-status-card">
          <div className="control-status-head">
            <span>{sBusy || sbBusy ? t.generating : t.ready}</span>
            <b>{duration}s · {aspectRatio}</b>
            <button className="lang-toggle-v33" onClick={onLang} type="button">{t.otherLang}</button>
          </div>
          <div className="control-progress-grid">
            {progress.map((x) => (
              <a href={x.id} key={x.n} className={`control-step ${x.ok ? "ok" : ""}`}>
                <span>{x.n}</span>
                <strong>{x.title}</strong>
                <em>{x.value}</em>
              </a>
            ))}
          </div>
          <div className="control-micro-row">
            <span>{t.style}: {stylePreset}</span>
            <span>{t.target}: {target}</span>
            <span>{t.scenes}: {scenes?.length || 0}</span>
          </div>
        </div>
      </div>
    </section>
  );
}


function ProjectSetupPanelV40({
  projectName, setProjectName,
  topic, handleTopicChange,
  script, setScript,
  projectType, setProjectType,
  stylePreset, setStylePreset,
  duration, setDuration,
  aspectRatio, setAspect,
  tone, setTone,
  target, setTarget,
  sbMode, setSbMode,
  devMode, modeLabel, accountAccess,
  sBusy, sbBusy, doScript, doStoryboard,
  sStat, sbStat, storyboard,
  clearTopicOnly, clearScriptOnly, clearSetupText, clearEverything,
  authLocked = false,
}) {
  const durationOptions = [30, 60, 90, 120, 180, 300, 600];
  const formatOptions = ["9:16", "16:9", "1:1", "4:5"];
  const modeOptions = [
    { id: "safe", label: "Safe", hint: "документально, без жёстких кадров" },
    { id: "raw", label: "Raw", hint: "меньше смягчения, больше фактуры" },
  ];
  const targetOptions = [
    { id: "veo3", label: "Veo 3", hint: "native audio, 8s shot logic" },
    { id: "grok", label: "Grok Imagine", hint: "короткий визуальный prompt" },
  ];
  const styleCards = [
    "cinematic", "dark", "truecrime", "war",
    "neonNoir", "synthwave80s", "cyberpunk",
    "vhsRetro", "analogFilm",
    "mysticHorror", "scifiAtmospheric", "fantasyEpic",
    "westernGritty", "apocalyptic", "filmNoir", "brutalistMinimal",
    "animation2d", "animation25d", "animation3d", "stopmotion", "cutoutPaper",
    "animeDark", "animeShonenAction", "animeSliceOfLife", "ghibliInspired",
    "graphicNovel", "comicHalftone", "musicVideo"
  ].filter((k) => STYLE_PRESETS[k]);
  const estimatedScenes = Math.max(1, Math.round(Number(duration || 60) / 3));
  const readyForStoryboard = !!script?.trim() || devMode;
  const busy = sBusy || sbBusy;
  const statusText = sbStat || sStat || (devMode ? "FREE Preview" : "LIVE генерация");

  return (
    <section id="setup" className="setup-v40">
      <div className="setup-bg-v40" />
      <div className="setup-head-v40">
        <div>
          <div className="setup-kicker-v40">NeuroCine v40 · нормальный запуск</div>
          <h1>Настрой свой ролик</h1>
          <p>Сначала тема и параметры. Потом сценарий, storyboard, PART grid, video prompt и Production Pack — без старого мусорного меню.</p>
        </div>
        <div className="setup-status-v40">
          <span className={devMode ? "is-demo" : "is-live"}>{modeLabel}</span>
          <strong>{duration}s · {aspectRatio}</strong>
          <em>{estimatedScenes} кадров</em>
        </div>
      </div>

      <div className="setup-grid-v40">
        <div className="setup-main-v40">
          <label className="setup-label-v40">Тема ролика</label>
          <textarea
            className="setup-topic-v40"
            value={topic}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={authLocked}
            placeholder="Например: Ты бы не выжил в Средневековье — вот почему"
          />
          <div className="setup-mini-actions-v41">
            <button type="button" onClick={clearTopicOnly} disabled={authLocked || !topic?.trim()}>Очистить тему</button>
            <button type="button" onClick={clearSetupText} disabled={authLocked || (!topic?.trim() && !script?.trim())}>Очистить тему + сценарий</button>
          </div>

          <div className="setup-row-v40">
            <div className="setup-field-v40">
              <label className="setup-label-v40">Название проекта</label>
              <input className="setup-input-v40" value={projectName} onChange={(e) => setProjectName(e.target.value)} disabled={authLocked} placeholder="NeuroCine Project" />
            </div>
            <div className="setup-field-v40">
              <label className="setup-label-v40">Тон / жанр</label>
              <input className="setup-input-v40" value={tone} onChange={(e) => setTone(e.target.value)} disabled={authLocked} placeholder="cinematic documentary thriller" />
            </div>
          </div>

          <div className="setup-manual-v40">
            <label className="setup-label-v40">Готовый сценарий</label>
            <textarea
              className="setup-script-v40"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              disabled={authLocked}
              placeholder="Если текст уже есть — вставь сюда и сразу жми «Создать storyboard»."
            />
            <div className="setup-mini-actions-v41">
              <button type="button" onClick={clearScriptOnly} disabled={authLocked || !script?.trim()}>Очистить сценарий</button>
              <button type="button" onClick={clearEverything} disabled={authLocked}>Сбросить всё</button>
            </div>
          </div>
        </div>

        <div className="setup-options-v40">
          <div className="setup-block-v40">
            <div className="setup-label-v40">Длительность</div>
            <div className="setup-pills-v40">
              {durationOptions.map((v) => (
                <button key={v} className={Number(duration) === v ? "active" : ""} onClick={() => setDuration(v)} disabled={authLocked} type="button">
                  {v < 60 ? `${v}с` : v === 60 ? "60с" : v < 300 ? `${v / 60}м` : `${v / 60}м`}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-block-v40">
            <div className="setup-label-v40">Формат</div>
            <div className="setup-pills-v40">
              {formatOptions.map((v) => (
                <button key={v} className={aspectRatio === v ? "active" : ""} onClick={() => setAspect(v)} disabled={authLocked} type="button">{v}</button>
              ))}
            </div>
          </div>

          <div className="setup-block-v40">
            <div className="setup-label-v40">Видео-модель</div>
            <div className="setup-cards-v40 two">
              {targetOptions.map((x) => (
                <button key={x.id} className={target === x.id ? "active" : ""} onClick={() => setTarget(x.id)} disabled={authLocked} type="button">
                  <strong>{x.label}</strong><span>{x.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-block-v40">
            <div className="setup-label-v40">Режим контента</div>
            <div className="setup-cards-v40 two">
              {modeOptions.map((x) => (
                <button key={x.id} className={sbMode === x.id ? "active" : ""} onClick={() => setSbMode(x.id)} disabled={authLocked} type="button">
                  <strong>{x.label}</strong><span>{x.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-block-v40">
            <div className="setup-label-v40">Стиль</div>
            <div className="setup-style-grid-v40">
              {styleCards.map((key) => (
                <button key={key} className={stylePreset === key ? "active" : ""} onClick={() => setStylePreset(key)} disabled={authLocked} type="button">
                  {STYLE_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="setup-actions-v40">
        <div className="setup-summary-v40">
          <span>Тема: <b>{topic?.trim() || "не задана"}</b></span>
          <span>Стиль: <b>{STYLE_PRESETS[stylePreset]?.label || stylePreset}</b></span>
          <span>Модель: <b>{String(target || "veo3").toUpperCase()}</b></span>
          <span>Режим: <b>{String(sbMode || "safe").toUpperCase()}</b></span>
        </div>
        <div className="setup-buttons-v40">
          <button className="setup-btn-v40 ghost" onClick={clearEverything} disabled={authLocked} type="button">Очистить всё</button>
          <button className="setup-btn-v40 secondary" onClick={doScript} disabled={authLocked || busy || (!topic.trim() && !script.trim() && !devMode)} type="button">
            {sBusy ? "Генерация..." : "01 · Создать сценарий"}
          </button>
          <button className="setup-btn-v40 primary" onClick={doStoryboard} disabled={authLocked || busy || !readyForStoryboard} type="button">
            {sbBusy ? "Storyboard..." : "02 · Создать storyboard"}
          </button>
        </div>
      </div>

      <div className={`setup-statusline-v40 ${String(statusText).startsWith("err") ? "err" : ""}`}>{String(statusText).replace(/^ok\|?/, "✓ ").replace(/^gen\|?/, "⏳ ").replace(/^err\|?/, "✗ ")}</div>
    </section>
  );
}

/* ─── main page ─── */
export default function StudioPage() {

  /* STEP 1 — Script */
  const [projectName, setProjectName] = useState("NeuroCine Project");
  const [topic, setTopic]             = useState("");
  const [projectType, setProjectType] = useState("film");
  const [stylePreset, setStylePreset] = useState("cinematic");
  const [duration, setDuration]       = useState(60);
  const [aspectRatio, setAspect]      = useState("9:16");
  const [tone, setTone]               = useState("cinematic documentary thriller");
  const [script, setScript]           = useState("");
  const [sBusy, setSBusy]             = useState(false);
  const [sStat, setSStat]             = useState("");
  const [scriptValidation, setScriptValidation] = useState(null);

  /* STEP 2 — Storyboard */
  const [storyboard, setSB]   = useState(null);
  const [sbBusy, setSbBusy]   = useState(false);
  const [sbStat, setSbStat]   = useState("");
  const [jsonIn, setJsonIn]   = useState("");
  const [sbMode, setSbMode]   = useState("safe");
  const [target, setTarget]   = useState("veo3"); // "veo3" | "grok" — целевая видео-модель
  const [validation, setValidation] = useState(null);

  /* STEP 3 — Pipeline */
  const [gridImg, setGridImg]           = useState(null);
  const [gridColsOverride, setGridColsOverride] = useState(null);
  const [gridManualFrames, setGridManualFrames] = useState(null); // кол-во кадров когда нет storyboard
  const [croppedFrame, setCroppedFrame] = useState(null); // cropped single frame from grid
  const [frameIdx, setFrameIdx]         = useState(null);
  const [exploreP, setExploreP]         = useState("");
  const [expBusy, setExpBusy]           = useState(false);

  /* variant selection */
  const [variantImg, setVariantImg]     = useState(null);
  const [selVariant, setSelVariant]     = useState(null);
  const [croppedVariant, setCropped]    = useState(null); // cropped quadrant
  const [p2k, setP2k]                   = useState("");
  const [p2kBusy, setP2kBusy]           = useState(false);

  /* final */
  const [finalImg, setFinalImg]         = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [videoP, setVideoP]             = useState("");
  const [vidBusy, setVidBusy]           = useState(false);
  const [videoPromptMode, setVideoPromptMode] = useState("cheap");
  const [videoConsistency, setVideoConsistency] = useState("ultra");

  const [hydrated, setHydrated]         = useState(false);
  const [snapshotStatus, setSnapshotStatus] = useState("");
  const [productionCacheTick, setProductionCacheTick] = useState(0);
  const snapshotInputRef = useRef(null);
  const [uiLang, setUiLang] = useState("ru");
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [devMode, setDevMode] = useState(true);
  const accountAccess = getAccountAccess(account?.profile, account?.session);
  const isSignedIn = Boolean(account?.session?.user);
  const forceLiveForAdmin = shouldForceLiveForAccount(account?.profile, account?.session);
  const liveAllowed = isSignedIn && accountAccess.canLive;
  const effectiveDevMode = forceLiveForAdmin ? false : (!liveAllowed ? true : devMode);
  const canToggleLiveMode = isSignedIn && liveAllowed && !forceLiveForAdmin;
  const modeLabel = !isSignedIn
    ? "AUTH REQUIRED"
    : forceLiveForAdmin
      ? "LIVE OWNER"
      : accountAccess.role === "pro" && !liveAllowed
        ? "PRO · KEY NEEDED"
        : accountAccess.role === "pro" && liveAllowed
          ? (effectiveDevMode ? "PRO PREVIEW" : "PRO LIVE")
          : !liveAllowed
            ? "FREE PREVIEW"
            : effectiveDevMode
              ? "PREVIEW"
              : "LIVE";
  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(account?.session?.access_token ? { Authorization: `Bearer ${account.session.access_token}` } : {}),
  }), [account?.session?.access_token]);
  const patchAccountProfile = useCallback((patch = {}) => {
    setAccount(prev => prev ? { ...prev, profile: { ...(prev.profile || {}), ...patch } } : prev);
  }, []);
  const storageOwnerId = account?.session?.user?.id || (account ? "guest" : "");
  const KEY_TEXT = useMemo(() => storageOwnerId ? scopedDraftKey(BASE_KEY_TEXT, storageOwnerId) : "", [storageOwnerId]);
  const KEY_IMGS = useMemo(() => storageOwnerId ? scopedDraftKey(BASE_KEY_IMGS, storageOwnerId) : "", [storageOwnerId]);
  const t = UI_TEXT[uiLang] || UI_TEXT.ru;
  const [showRu, setShowRu]             = useState(false);
  const [showFrameRu, setShowFrameRu]   = useState(false);

  useEffect(() => {
    if (forceLiveForAdmin && devMode) setDevMode(false);
    if (isSignedIn && !liveAllowed && !devMode) setDevMode(true);
  }, [forceLiveForAdmin, liveAllowed, isSignedIn, devMode]);

  // Chunk / continuation state
  const [chunkSize, setChunkSize]       = useState(4);
  const [activeChunk, setActiveChunk]   = useState(0);
  const [contAnchorImgs, setContAnchor] = useState([]); // [{scene, croppedDataUrl}]
  const [contAnchorGrid, setContAnchorGrid] = useState(null); // uploaded prev grid img
  const [contPrompt, setContPrompt]     = useState("");
  const [showCont, setShowCont]         = useState(false);

  /* STEP 02B — Auto-Chain Strict Engine v2 */
  const [autoPartSize, setAutoPartSize] = useState(4);
  const [autoPartIndex, setAutoPartIndex] = useState(0);
  const [autoChainMode, setAutoChainMode] = useState("worldHero");
  const [autoStrictLevel, setAutoStrictLevel] = useState("hard");
  const [autoReferenceMode, setAutoReferenceMode] = useState("heroAndPrevious");
  const [autoAppearanceMode, setAutoAppearanceMode] = useState("full");
  const [autoIncludeVo, setAutoIncludeVo] = useState(true);
  const [autoHeroAnchor, setAutoHeroAnchor] = useState(null);

  /* CHARACTER OVERRIDE — лицо из anchor + костюм/модификаторы из роли */
  const [charOverrideEnabled, setCharOverrideEnabled] = useState(false);
  const [charFaceLock, setCharFaceLock]   = useState(""); // описание лица из reference card
  const [charModifiers, setCharModifiers] = useState({
    beard:      false,
    scar:       false,
    dirt:       false,
    bruises:    false,
    sweat:      false,
    exhaustion: false,
    pale:       false,
    blood:      false,
  });

  // Авто-предложение модификаторов по теме/стилю
  const suggestedMods = (() => {
    const t = (topic + " " + tone + " " + stylePreset).toLowerCase();
    const s = [];
    if (/средневеков|медиев|medieval|раб|prison|тюрьм|узник|slave|serf/.test(t))
      s.push({ key: "dirt", label: "Грязь", reason: "историческая достоверность" },
              { key: "exhaustion", label: "Истощение", reason: "тяжёлый труд/заключение" },
              { key: "beard", label: "Щетина", reason: "нет бритья" });
    if (/war|войн|combat|battle|солдат|soldier/.test(t))
      s.push({ key: "dirt", label: "Грязь", reason: "боевые условия" },
              { key: "scar", label: "Шрам", reason: "боевое ранение" },
              { key: "bruises", label: "Синяки", reason: "контактный бой" });
    if (/prison|тюрьм|jail|заключ|камера/.test(t))
      s.push({ key: "pale", label: "Бледность", reason: "отсутствие солнца" },
              { key: "bruises", label: "Синяки", reason: "тюремная жизнь" },
              { key: "exhaustion", label: "Истощение", reason: "плохое питание" });
    if (/surviv|выживан|wild|jungle|джунгли|дикий/.test(t))
      s.push({ key: "dirt", label: "Грязь", reason: "дикая природа" },
              { key: "sweat", label: "Пот", reason: "физическая нагрузка" },
              { key: "scar", label: "Царапины", reason: "ветки/камни" });
    if (/космос|space|sci.fi|фантаст/.test(t))
      s.push({ key: "pale", label: "Бледность", reason: "космический стресс" },
              { key: "exhaustion", label: "Истощение", reason: "длительный полёт" });
    // Дефолт если ничего не подошло
    if (s.length === 0)
      s.push({ key: "sweat", label: "Пот", reason: "физическое напряжение" },
              { key: "exhaustion", label: "Истощение", reason: "эмоциональная нагрузка" });
    return s;
  })();
  const [autoPrevPartAnchor, setAutoPrevPartAnchor] = useState(null);
  const [autoPrevPartBrief, setAutoPrevPartBrief] = useState("");
  const [autoPrevPartBriefStatus, setAutoPrevPartBriefStatus] = useState("");
  const [autoPartPrompt, setAutoPartPrompt] = useState("");
  const [autoVideoPack, setAutoVideoPack] = useState("");
  const [autoAllPromptText, setAutoAllPromptText] = useState("");

  const styleProfile = useMemo(() => getStyleProfile(projectType, stylePreset), [projectType, stylePreset]);
  const scenes       = storyboard?.scenes || [];
  const curFrame     = frameIdx !== null ? scenes[frameIdx] : null;

  // Chunk logic — split scenes into pages
  const chunks = useMemo(() => {
    if (!scenes.length) return [];
    const result = [];
    for (let i = 0; i < scenes.length; i += chunkSize) {
      result.push(scenes.slice(i, i + chunkSize));
    }
    return result;
  }, [scenes, chunkSize]);

  const activeChunkScenes = chunks[activeChunk] || [];

  const autoParts = useMemo(() => splitScenesIntoParts(scenes, autoPartSize), [scenes, autoPartSize]);
  const autoPartScenes = useMemo(() => scenes.slice(autoPartIndex * autoPartSize, autoPartIndex * autoPartSize + autoPartSize), [scenes, autoPartIndex, autoPartSize]);
  // Собираем CHARACTER OVERRIDE блок для движка
  const charOverrideBlock = charOverrideEnabled ? (() => {
    const mods = Object.entries(charModifiers).filter(([,v])=>v).map(([k]) => {
      const labels = { beard:"beard/stubble", scar:"visible scar tissue", dirt:"mud and dirt on skin and clothing",
        bruises:"visible bruising", sweat:"sweat-soaked skin and fabric", exhaustion:"extreme exhaustion — hollow eyes, slack posture",
        pale:"abnormal pallor — pale skin, dark under-eyes", blood:"restrained blood traces (safe framing)" };
      return labels[k] || k;
    });
    const lines = [];
    if (charFaceLock.trim()) {
      lines.push(`FACE IDENTITY LOCK (from hero anchor — do NOT change): ${charFaceLock.trim()}`);
    }
    if (mods.length) {
      lines.push(`CHARACTER APPEARANCE MODIFIERS (apply to all frames): ${mods.join(", ")}`);
    }
    return lines.length ? `

${lines.join("\n")}` : "";
  })() : "";

  const autoPartCols = partGridCols(autoPartScenes.length || autoPartSize);
  const autoPartRows = gridRows(autoPartScenes.length || autoPartSize, autoPartCols);
  const autoPartGridLabel = `${autoPartCols}×${autoPartRows}`;
  const autoPartCellLabels = autoPartScenes.map((_, i) => partCellLabel(i));

  const autoAllPrompts = useMemo(() => {
    return buildAutoChainAllParts({
      storyboard, styleProfile, partSize: autoPartSize,
      chainMode: autoChainMode, strictLevel: autoStrictLevel,
      referenceMode: autoReferenceMode, appearanceMode: autoAppearanceMode
    }).map((prompt) => `${prompt}${charOverrideBlock}`);
  }, [storyboard, styleProfile, autoPartSize, autoChainMode, autoStrictLevel, autoReferenceMode, autoAppearanceMode, charOverrideBlock]);

  const chunkGridPrompt = useMemo(() => {
    if (!activeChunkScenes.length) return "";
    return buildChunkGridPrompt(activeChunkScenes, storyboard, styleProfile, activeChunk);
  }, [activeChunkScenes, storyboard, styleProfile, activeChunk]);

  // Story grid prompt with English frame descriptions (for AI generators)
  const storyGridPrompt = useMemo(() => {
    if (!storyboard) return "";
    const base = buildStoryGridPrompt(storyboard, styleProfile);
    const sc = storyboard.scenes || [];
    // Use image_prompt_en (English) — strip the "SCENE PRIMARY FOCUS: " prefix for cleaner grid prompt
    const enFrames = sc.map((s, i) =>
      `${i + 1}. ${(s.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS:\s*/i, "") || s.description_ru || s.vo_ru}`
    ).join("\n");
    return base.replace(/FRAMES:\n[\s\S]*$/, `FRAMES:\n${enFrames}`);
  }, [storyboard, styleProfile]);

  // Russian frame descriptions for reference (hidden by default)
  const storyGridRu = useMemo(() => {
    if (!storyboard) return "";
    return (storyboard.scenes || []).map((s, i) =>
      `${i + 1}. [${s.id}] ${s.description_ru || s.vo_ru || ""}`
    ).join("\n");
  }, [storyboard]);

  const frameGridPrompt = useMemo(() => {
    if (!storyboard || !autoPartScenes.length) return "";
    return buildFlowCompactPartPrompt({
      storyboard,
      styleProfile,
      partScenes: autoPartScenes,
      partIndex: autoPartIndex,
      totalScenes: scenes.length,
      partSize: autoPartSize,
      chainMode: autoChainMode,
      strictLevel: autoStrictLevel,
      referenceMode: autoReferenceMode,
      appearanceMode: autoAppearanceMode,
    });
  }, [storyboard, styleProfile, autoPartScenes, autoPartIndex, scenes.length, autoPartSize, autoChainMode, autoStrictLevel, autoReferenceMode, autoAppearanceMode]);

  const autoAnchorPromptNote = useMemo(() => {
    if (!storyboard || !autoPartScenes.length) return "";
    const usesHero = autoReferenceMode !== "previousPart";
    const usesPrev = autoPartIndex > 0 && autoReferenceMode !== "heroOnly";
    const lines = [
      "ANCHOR ATTACHMENT STATUS:",
      `Hero Anchor: ${usesHero ? (autoHeroAnchor ? "uploaded in NeuroCine — attach this same image to the generator request" : "selected by Reference mode, but not uploaded yet") : "not used by current Reference mode"}.`,
      `Previous PART: ${usesPrev ? (autoPrevPartAnchor ? "uploaded in NeuroCine — attach this same image to the generator request" : "needed for PART 2+ continuity, but not uploaded yet") : autoPartIndex === 0 ? "not needed for PART 1" : "not used by current Reference mode"}.`,
      "If an anchor is marked uploaded here, the prompt expects you to attach that image manually in Flow / VEO / image generator."
    ];
    return `\n\n${lines.join("\n")}`;
  }, [storyboard, autoPartScenes.length, autoReferenceMode, autoPartIndex, autoHeroAnchor, autoPrevPartAnchor]);

  const autoPrevPartVisualDnaBlock = useMemo(() => {
    if (!storyboard || !autoPartScenes.length) return "";
    if (autoPartIndex === 0 || autoReferenceMode === "heroOnly" || !autoPrevPartAnchor) return "";
    const brief = String(autoPrevPartBrief || "").trim();
    const body = brief || "Previous PART image is uploaded and must be attached to the generator request. Read the uploaded grid as the continuity source for palette, lighting, world texture, object materials and character/body silhouette. Do not copy exact compositions.";
    return `\n\nPREVIOUS PART VISUAL DNA:\n${body}\nUse this uploaded grid only as continuity/style DNA for PART ${autoPartIndex + 1}. Keep the same world, lighting family, palette, material grime and tactile realism, but create new compositions for the new frames.`;
  }, [storyboard, autoPartScenes.length, autoPartIndex, autoReferenceMode, autoPrevPartAnchor, autoPrevPartBrief]);

  const frameGridPromptWithDirectives = useMemo(() => {
    if (!frameGridPrompt) return "";
    return `${frameGridPrompt}${autoPrevPartVisualDnaBlock}${charOverrideBlock}${autoAnchorPromptNote}`;
  }, [frameGridPrompt, autoPrevPartVisualDnaBlock, charOverrideBlock, autoAnchorPromptNote]);

  const scriptJson = script
    ? JSON.stringify({ project_name: projectName, script, topic, duration, aspect_ratio: aspectRatio, style: stylePreset, project_type: projectType, tone }, null, 2)
    : "";

  const cloudAutoSaveKey = useMemo(() => {
    if (!hydrated) return "";
    return JSON.stringify({
      projectName, topic, projectType, stylePreset, duration, aspectRatio, tone,
      script, storyboard, jsonIn, sbMode, target, validation,
      frameIdx, gridColsOverride, gridManualFrames, exploreP, selVariant, p2k,
      videoP, videoPromptMode, videoConsistency, analysis,
      autoPartSize, autoPartIndex, autoChainMode, autoStrictLevel, autoReferenceMode,
      autoAppearanceMode, autoIncludeVo, charOverrideEnabled, charFaceLock, charModifiers,
      autoPrevPartBrief, autoPrevPartBriefStatus, autoPartPrompt, autoVideoPack, autoAllPromptText,
      production_cache_tick: productionCacheTick,
      production_pack_cache: collectProductionCache(storageOwnerId || "guest"),
      image_state: {
        gridImg: Boolean(gridImg), croppedFrame: Boolean(croppedFrame),
        variantImg: Boolean(variantImg), croppedVariant: Boolean(croppedVariant), finalImg: Boolean(finalImg),
      }
    });
  }, [
    hydrated, projectName, topic, projectType, stylePreset, duration, aspectRatio, tone,
    script, storyboard, jsonIn, sbMode, target, validation,
    frameIdx, gridColsOverride, gridManualFrames, exploreP, selVariant, p2k,
    videoP, videoPromptMode, videoConsistency, analysis,
    autoPartSize, autoPartIndex, autoChainMode, autoStrictLevel, autoReferenceMode,
    autoAppearanceMode, autoIncludeVo, charOverrideEnabled, charFaceLock, charModifiers,
    autoPrevPartBrief, autoPrevPartBriefStatus, autoPartPrompt, autoVideoPack, autoAllPromptText, productionCacheTick,
    gridImg, croppedFrame, variantImg, croppedVariant, finalImg
  ]);

  /* ── LOCAL DRAFT LOAD — v49 user-scoped ── */
  useEffect(() => {
    if (!storageOwnerId || !KEY_TEXT || !KEY_IMGS) return;

    setHydrated(false);

    // Always reset visible workspace before loading the draft for the current account.
    // This prevents admin/user/browser-account leakage after logout/login.
    setProjectName("NeuroCine Project");
    setTopic("");
    setProjectType("film");
    setStylePreset("cinematic");
    setDuration(60);
    setAspect("9:16");
    setTone("cinematic documentary thriller");
    setScript("");
    setScriptValidation(null);
    setSB(null);
    setSbBusy(false);
    setSbStat("");
    setJsonIn("");
    setSbMode("safe");
    setTarget("veo3");
    setValidation(null);
    setSBusy(false);
    setSStat("");
    resetStoryboardOutputs({ keepAnchors: false });

    const text = safeJson(localStorage.getItem(KEY_TEXT));
    const imgs = safeJson(localStorage.getItem(KEY_IMGS));

    if (text) {
      if (text.projectName) setProjectName(text.projectName);
      if (text.topic)       setTopic(text.topic);
      if (text.projectType) setProjectType(text.projectType);
      if (text.stylePreset) setStylePreset(text.stylePreset);
      if (text.duration)    setDuration(text.duration);
      if (text.aspectRatio) setAspect(text.aspectRatio);
      if (text.tone)        setTone(text.tone);
      if (text.script)      setScript(text.script);
      if (text.storyboard)  setSB(text.storyboard);
      if (text.jsonIn)      setJsonIn(text.jsonIn);
      if (text.sbMode)      setSbMode(text.sbMode);
      if (text.target)      setTarget(text.target);
      if (text.validation)  setValidation(text.validation);
      if (text.frameIdx !== undefined && text.frameIdx !== null) setFrameIdx(text.frameIdx);
      if (text.exploreP)    setExploreP(text.exploreP);
      if (text.selVariant)  setSelVariant(text.selVariant);
      if (text.p2k)         setP2k(text.p2k);
      if (text.videoP)      setVideoP(text.videoP);
      if (text.videoPromptMode) setVideoPromptMode(text.videoPromptMode);
      if (text.videoConsistency) setVideoConsistency(text.videoConsistency);
      if (typeof text.devMode === "boolean") setDevMode(liveAllowed ? text.devMode : true);
      if (text.analysis)    setAnalysis(text.analysis);
      if (text.autoPartSize) setAutoPartSize(text.autoPartSize);
      if (text.autoPartIndex !== undefined && text.autoPartIndex !== null) setAutoPartIndex(text.autoPartIndex);
      if (text.autoChainMode) setAutoChainMode(text.autoChainMode);
      if (text.autoStrictLevel) setAutoStrictLevel(text.autoStrictLevel);
      if (text.autoReferenceMode) setAutoReferenceMode(text.autoReferenceMode);
      if (text.autoAppearanceMode) setAutoAppearanceMode(text.autoAppearanceMode);
      if (text.autoIncludeVo !== undefined) setAutoIncludeVo(Boolean(text.autoIncludeVo));
      if (text.autoPrevPartBrief) setAutoPrevPartBrief(text.autoPrevPartBrief);
      if (text.autoPrevPartBriefStatus && text.autoPrevPartBriefStatus !== "analyzing") setAutoPrevPartBriefStatus(text.autoPrevPartBriefStatus);
    }

    if (imgs) {
      if (imgs.gridImg)    setGridImg(imgs.gridImg);
      if (imgs.variantImg) setVariantImg(imgs.variantImg);
      if (imgs.croppedVariant) setCropped(imgs.croppedVariant);
      if (imgs.finalImg)   setFinalImg(imgs.finalImg);
      if (imgs.autoHeroAnchor) setAutoHeroAnchor(imgs.autoHeroAnchor);
      if (imgs.autoPrevPartAnchor) setAutoPrevPartAnchor(imgs.autoPrevPartAnchor);
    }

    setSnapshotStatus(text ? "✓ Локальный черновик этого аккаунта загружен" : "");
    setHydrated(true);
  }, [storageOwnerId, KEY_TEXT, KEY_IMGS]);

  /* ── AUTOSAVE WRITE (text) ── */
  useEffect(() => {
    if (!hydrated || !KEY_TEXT) return;
    tryLsSave(KEY_TEXT, {
      projectName, topic, projectType, stylePreset, duration,
      aspectRatio, tone, script, storyboard, jsonIn, sbMode, target, validation,
      frameIdx, exploreP, selVariant, p2k, videoP, videoPromptMode, videoConsistency, analysis, devMode,
      autoPartSize, autoPartIndex, autoChainMode, autoStrictLevel, autoReferenceMode,
      autoAppearanceMode, autoIncludeVo, autoPrevPartBrief, autoPrevPartBriefStatus
    });
  }, [hydrated, KEY_TEXT, projectName, topic, projectType, stylePreset, duration, aspectRatio,
      tone, script, storyboard, jsonIn, sbMode, target, validation, frameIdx, exploreP, selVariant, p2k, videoP, videoPromptMode, videoConsistency, analysis, devMode,
      autoPartSize, autoPartIndex, autoChainMode, autoStrictLevel, autoReferenceMode, autoAppearanceMode, autoIncludeVo, autoPrevPartBrief, autoPrevPartBriefStatus]);

  /* ── AUTOSAVE WRITE (images — separate key, с защитой от quota) ── */
  useEffect(() => {
    if (!hydrated || !KEY_IMGS) return;
    // limit: skip images > 2MB to avoid localStorage quota
    const maxSize = 2_000_000;
    const safe = (v) => (v && v.length <= maxSize ? v : null);
    tryLsSave(KEY_IMGS, {
      gridImg: safe(gridImg),
      variantImg: safe(variantImg),
      croppedVariant: safe(croppedVariant),
      finalImg: safe(finalImg),
      autoHeroAnchor: safe(autoHeroAnchor),
      autoPrevPartAnchor: safe(autoPrevPartAnchor)
    });
  }, [hydrated, KEY_IMGS, gridImg, variantImg, croppedVariant, finalImg, autoHeroAnchor, autoPrevPartAnchor]);

  /* Re-crop if cols override changes while frame is selected */
  useEffect(() => {
    if (gridImg && frameIdx !== null && scenes.length > 0) {
      const cols = gridColsOverride ?? gridCols(scenes.length);
      cropGridFrame(gridImg, frameIdx, scenes.length, cols)
        .then(url => setCroppedFrame(url))
        .catch(() => {});
    }
  }, [gridColsOverride]);
  function resetStoryboardOutputs({ keepAnchors = true } = {}) {
    setSB(null); setValidation(null); setSbStat(""); setFrameIdx(null);
    setGridImg(null); setGridColsOverride(null); setGridManualFrames(null); setCroppedFrame(null);
    setExploreP(""); setVariantImg(null); setSelVariant(null); setCropped(null);
    setP2k(""); setFinalImg(null); setVideoP(""); setAnalysis(null);
    setActiveChunk(0); setContAnchor([]); setContAnchorGrid(null); setContPrompt(""); setShowCont(false);
    setAutoPartIndex(0); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText("");
    if (!keepAnchors) {
      setAutoHeroAnchor(null);
      setAutoPrevPartAnchor(null);
      setAutoPrevPartBrief("");
      setAutoPrevPartBriefStatus("");
    }
  }

  function clearTopicOnly() {
    setTopic("");
    setSStat("");
    resetStoryboardOutputs({ keepAnchors: true });
  }

  function clearScriptOnly() {
    setScript("");
    setScriptValidation(null);
    setSStat("");
    resetStoryboardOutputs({ keepAnchors: true });
  }

  function clearSetupText() {
    setTopic("");
    setScript("");
    setScriptValidation(null);
    setSStat("");
    resetStoryboardOutputs({ keepAnchors: true });
  }

  function clearEverything() {
    setProjectName("NeuroCine Project");
    setTopic("");
    setTone("cinematic documentary thriller");
    setProjectType("film");
    setStylePreset("cinematic");
    setDuration(60);
    setAspect("9:16");
    setTarget("veo3");
    setSbMode("safe");
    setScript("");
    setScriptValidation(null);
    setJsonIn("");
    setSStat("");
    resetStoryboardOutputs({ keepAnchors: true });
  }

  function handleModeToggle() {
    if (!canToggleLiveMode) return;
    setSBusy(false);
    setSbBusy(false);
    setSStat("");
    setSbStat("");
    setDevMode(v => !v);
  }

  function handleTopicChange(value) {
    setTopic(value);
    if (storyboard || autoPartPrompt || autoAllPromptText) resetStoryboardOutputs({ keepAnchors: true });
  }

  function handleManualJsonChange(value) {
    setJsonIn(value);
    if (storyboard || autoPartPrompt || autoAllPromptText) resetStoryboardOutputs({ keepAnchors: true });
  }

  async function doScript() {
    if (!isSignedIn) {
      setSStat("err|Войдите через Google. Гостевой запуск сценария отключён.");
      return;
    }
    // Готовый сценарий — пропускаем генерацию (но валидируем!)
    if (script.trim() && !topic.trim()) {
      setScriptValidation(validateScript(script));
      setSStat("ok");
      return;
    }
    if (!topic.trim() && !effectiveDevMode) return;
    if (effectiveDevMode) {
      setSBusy(false);
      setSbBusy(false);
      resetStoryboardOutputs({ keepAnchors: true });
      setJsonIn("");
      const mockScript = buildMockScript(topic || projectName || "DEMO topic");
      setScript(mockScript);
      setScriptValidation(validateScript(mockScript));
      setSStat("ok|FREE Preview · пример сценария");
      return;
    }
    if (!liveAllowed) {
      setSStat("err|LIVE-генерация доступна в PRO после подключения AI-ключа.");
      return;
    }
    resetStoryboardOutputs({ keepAnchors: true });
    setJsonIn("");
    setSBusy(true); setSStat("gen"); setScriptValidation(null);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ topic, tone, duration, generationMode: "live" })
      });
      const d = await r.json();
      if (d.apiError || (!d.text && d.error)) {
        setSStat("err|" + (d.error || "Ошибка API"));
      } else {
        setScript(d.text || "");
        // Используем validation от сервера (после ретраев) или локально валидируем
        setScriptValidation(d.validation || (d.text ? validateScript(d.text) : null));
        setSStat(d.text ? "ok" : "err|Пустой ответ от модели");
      }
    } catch (e) { setSStat("err|" + (e.message || "Сетевая ошибка")); }
    finally { setSBusy(false); }
  }

  // Авто-валидация если пользователь сам редактирует/вставляет сценарий вручную
  useEffect(() => {
    if (!hydrated) return;
    if (script.trim() && script.trim().length >= 30) {
      // Дебаунсим валидацию чтобы не дёргать на каждый символ
      const t = setTimeout(() => setScriptValidation(validateScript(script)), 400);
      return () => clearTimeout(t);
    } else {
      setScriptValidation(null);
    }
  }, [hydrated, script]);

  async function doStoryboard() {
    if (!isSignedIn) {
      setSbStat("err|Войдите через Google. Гостевой storyboard отключён.");
      return;
    }
    let src = script.trim();
    // New script always wins. Manual JSON is used only when script is empty.
    if (!src && jsonIn.trim()) {
      try { const p = JSON.parse(jsonIn); src = String(p.script || p.text || "").trim(); } catch {}
    }
    if (!src.trim() && !effectiveDevMode) return;
    setAutoPartIndex(0); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText("");
    setGridImg(null); setFrameIdx(null); setCroppedFrame(null);
    if (effectiveDevMode) {
      setSBusy(false);
      setSbBusy(false);
      const effectiveTopic = topic || projectName || "DEMO Sample Story";
      const sb = buildMockStoryboard({ projectName, topic: effectiveTopic, duration, aspectRatio, style: stylePreset });
      setScript(prev => prev?.trim() ? prev : buildMockScript(effectiveTopic));
      setSB(sb);
      setValidation({ ok: true, errors: [], warnings: ["FREE Preview: пример storyboard для знакомства со студией"] });
      setSbStat(`ok|${sb.scenes?.length || 0} кадров · FREE Preview`);
      return;
    }
    if (!liveAllowed) {
      setSbStat("err|LIVE-генерация доступна в PRO после подключения AI-ключа.");
      return;
    }
    setSbBusy(true); setSbStat("gen"); setValidation(null);
    try {
      // stream: true — SSE-режим. Заголовки уходят мгновенно, Render/Railway не рвут соединение.
      const r = await fetch("/api/storyboard", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          script: src, duration,
          aspect_ratio: aspectRatio,
          style: stylePreset,
          project_name: projectName,
          mode: sbMode,
          target,
          stream: true,
        })
      });

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setSbStat("err|" + (d.error || `HTTP ${r.status}`));
        return;
      }

      // Читаем SSE-поток
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const processEvent = (eventName, data) => {
        if (eventName === "started") {
          setSbStat("gen|" + (data.message || "Генерация..."));
        } else if (eventName === "chunk_started") {
          setSbStat(`gen|Chunk ${data.chunk_number}/${data.total_chunks} · ${data.chunk_duration}с...`);
        } else if (eventName === "chunk_completed") {
          setSbStat(`gen|Chunk ${data.chunk_number}/${data.total_chunks} готов · ${data.scenes_in_chunk} кадров`);
        } else if (eventName === "merging") {
          setSbStat("gen|Склейка chunks...");
        } else if (eventName === "done") {
          if (data.storyboard) {
            const sb = { ...data.storyboard, aspect_ratio: aspectRatio };
            setSB(sb);
            setValidation(data.validation || null);
            const valInfo = data.validation
              ? (data.validation.ok ? " · ✓ valid" : ` · ⚠ ${data.validation.errors?.length} issues`)
              : "";
            const modeLabel = String(data.mode || "");
            const isFallback = modeLabel.includes("fallback");
            const fallbackReason = data.error ? ` — ${data.error}` : " — API не ответил или вернул невалидный JSON";
            const fallbackWarn = isFallback ? ` · ⚠ FALLBACK${fallbackReason}` : "";
            setSbStat(`ok|${sb.scenes?.length || 0} кадров · ${modeLabel}${fallbackWarn}${valInfo}`);
          } else {
            setSbStat("err|" + (data.error || "Пустой ответ от сервера"));
          }
        } else if (eventName === "error") {
          setSbStat("err|" + (data.message || "Ошибка генерации"));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE: события разделены двойным переносом
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const evMatch = part.match(/^event:\s*(\S+)/m);
          const dtMatch = part.match(/^data:\s*(.+)$/m);
          if (!evMatch || !dtMatch) continue;
          try { processEvent(evMatch[1], JSON.parse(dtMatch[1])); } catch {}
        }
      }
    } catch (e) { setSbStat("err|" + e.message); }
    finally { setSbBusy(false); }
  }

  async function doExplore() {
    if (!isSignedIn) { setExploreP("Ошибка: войдите через Google."); return; }
    if (!curFrame) return;
    if (effectiveDevMode) { setExploreP(buildExplorePrompt(curFrame, storyboard, styleProfile)); return; }
    if (!liveAllowed) { setExploreP("Ошибка: LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setExpBusy(true); setExploreP("");
    try {
      // Build locally from engine — richer CHARACTER LOCK + full EN image_prompt_en
      const localPrompt = buildExplorePrompt(curFrame, storyboard, styleProfile);
      // Also try API for enhanced version
      const r = await fetch("/api/explore", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ frame: curFrame, storyboard, styleProfile, projectType, stylePreset, generationMode: "live" })
      });
      const d = await r.json();
      setExploreP(d.prompt || localPrompt);
    } catch {
      // fallback to local build
      setExploreP(buildExplorePrompt(curFrame, storyboard, styleProfile));
    } finally { setExpBusy(false); }
  }

  /* ── SELECT VARIANT: crop → analyze → build accurate 2K prompt ── */
  const handleSelectVariant = useCallback(async (variant) => {
    if (!isSignedIn) { setP2k("Ошибка: войдите через Google."); return; }
    if (!variantImg || !curFrame) return;
    setSelVariant(variant);
    setCropped(null);
    setP2k("");
    setP2kBusy(true);

    try {
      // 1. Crop the selected quadrant from the 2×2 grid
      const cropped = await cropQuadrant(variantImg, variant);
      setCropped(cropped);

      if (effectiveDevMode || !liveAllowed) {
        setP2k(build2KPrompt(curFrame, variant, storyboard, styleProfile));
        return;
      }

      // 2. Analyze the cropped image to get real visual description
      const rA = await fetch("/api/analyze", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          frame: curFrame, variant,
          imageDataUrl: cropped,
          styleProfile, projectType, stylePreset
        })
      });
      const dA = await rA.json();
      const vis = dA.analysis || {};

      // 3. Build 2K prompt that DESCRIBES the visual (no vague "use uploaded" instructions)
      const base = build2KPrompt(curFrame, variant, storyboard, styleProfile);

      // Inject real visual data into the prompt
      const visual_insert = [
        vis.camera    ? `CAMERA & COMPOSITION: ${vis.camera}` : "",
        vis.lighting  ? `LIGHTING: ${vis.lighting}` : "",
        vis.emotion   ? `EMOTION: ${vis.emotion}` : "",
        vis.environment_motion ? `ENVIRONMENT: ${vis.environment_motion}` : "",
      ].filter(Boolean).join("\n");

      // Replace the generic reference line with the actual visual description
      const enhanced = base
        .replace(
          "USE THE UPLOADED SELECTED VARIANT AS THE VISUAL REFERENCE. Preserve its camera angle, composition, lens feeling, lighting direction, atmosphere, character pose and emotional tone.",
          `VISUAL REFERENCE FROM SELECTED VARIANT ${variant}:\n${visual_insert || "Preserve the composition, lighting, and atmosphere of the selected variant."}`
        );

      setP2k(enhanced);
    } catch {
      // fallback: use base prompt without enhancement
      setP2k(build2KPrompt(curFrame, variant, storyboard, styleProfile));
    } finally {
      setP2kBusy(false);
    }
  }, [isSignedIn, devMode, liveAllowed, variantImg, curFrame, storyboard, styleProfile, projectType, stylePreset]);

  async function doVideoPrompt() {
    if (!isSignedIn) { setVideoP("Ошибка: войдите через Google."); return; }
    if (!curFrame || !finalImg) return;
    if (effectiveDevMode) {
      setVideoP(buildMockVideoPrompt(curFrame));
      setAnalysis({ sfx: "Sample SFX: low drone, wind, distant rumble" });
      return;
    }
    if (!liveAllowed) { setVideoP("Ошибка: LIVE-генерация доступна в PRO после подключения AI-ключа."); return; }
    setVidBusy(true); setVideoP(""); setAnalysis(null);
    try {
      const r2 = await fetch("/api/video", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          frame: curFrame,
          analysis: null,
          storyboard,
          styleProfile,
          projectType,
          stylePreset,
          target,
          promptMode: videoPromptMode,
          consistency: videoConsistency,
          includeVo: autoIncludeVo,
          generationMode: effectiveDevMode ? "demo" : "live"
        })
      });
      const d2 = await r2.json();
      if (!r2.ok || d2.error) throw new Error(d2.error || "Video API error");
      setVideoP(d2.video_prompt_en || "");
      if (d2.sfx) setAnalysis({ sfx: d2.sfx });
    } catch (e) {
      setVideoP("Ошибка: " + (e.message || "Video prompt error"));
    } finally { setVidBusy(false); }
  }

  /* ── FRAME SELECT + CLEAR DOWNSTREAM ── */
  function selectFrame(idx) {
    setFrameIdx(idx);
    setShowFrameRu(false);
    setCroppedFrame(null);
    setExploreP(""); setVariantImg(null); setSelVariant(null);
    setCropped(null); setP2k(""); setFinalImg(null); setVideoP(""); setAnalysis(null);
    // Auto-crop the selected frame from the grid image
    if (gridImg && scenes.length > 0) {
      const cols = gridColsOverride ?? gridCols(scenes.length);
      cropGridFrame(gridImg, idx, scenes.length, cols)
        .then(url => setCroppedFrame(url))
        .catch(() => {});
    }
  }

  function nextFrame() {
    if (!scenes.length) return;
    selectFrame(((frameIdx ?? -1) + 1) % scenes.length);
  }

  function clearAutoChainOutputs({ clearGrid = false, clearVideo = false } = {}) {
    setAutoPartPrompt("");
    setAutoVideoPack("");
    setAutoAllPromptText("");
    if (clearVideo) {
      setVideoP("");
      setAnalysis(null);
    }
    if (clearGrid) {
      setGridImg(null);
      setFrameIdx(null);
      setCroppedFrame(null);
      setFinalImg(null);
      setVideoP("");
      setAnalysis(null);
      setShowFrameRu(false);
    }
  }

  async function analyzePreviousPartAnchor(url) {
    if (!url) return;
    setAutoPrevPartBrief("");
    setAutoPrevPartBriefStatus("analyzing");
    try {
      const r = await fetch("/api/analyze-anchor", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ image: url, task: "grid_style" })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        throw new Error(data.error || "Previous PART analysis failed");
      }
      setAutoPrevPartBrief(String(data.description || "").trim());
      setAutoPrevPartBriefStatus("ready");
    } catch (e) {
      setAutoPrevPartBriefStatus(`error: ${e.message || "analysis failed"}`);
    }
  }

  function setPreviousPartAnchor(url, { clearGrid = false } = {}) {
    if (!url) return;
    setAutoPrevPartAnchor(url);
    clearAutoChainOutputs({ clearGrid, clearVideo: true });
    analyzePreviousPartAnchor(url);
  }

  function clearPreviousPartAnchor({ clearGrid = false } = {}) {
    setAutoPrevPartAnchor(null);
    setAutoPrevPartBrief("");
    setAutoPrevPartBriefStatus("");
    clearAutoChainOutputs({ clearGrid, clearVideo: true });
  }

  function switchAutoPart(nextIndex) {
    if (!autoParts.length) return;
    const safeIndex = Math.max(0, Math.min(Number(nextIndex) || 0, autoParts.length - 1));
    if (safeIndex === autoPartIndex) return;

    if (gridImg && safeIndex === autoPartIndex + 1) {
      setPreviousPartAnchor(gridImg);
    }

    setAutoPartIndex(safeIndex);
    clearAutoChainOutputs({ clearGrid: true, clearVideo: true });
  }

  function generateAutoChainPart() {
    if (!storyboard || !autoPartScenes.length) return;
    const prompt = buildAutoChainPartPrompt({
      storyboard, styleProfile,
      partScenes: autoPartScenes,
      partIndex: autoPartIndex,
      totalScenes: scenes.length,
      partSize: autoPartSize,
      chainMode: autoChainMode,
      strictLevel: autoStrictLevel,
      referenceMode: autoReferenceMode,
      appearanceMode: autoAppearanceMode
    });

    // Build anchor attachment instructions
    const anchorLines = [];
    if (autoHeroAnchor && autoReferenceMode !== "previousPart") {
      anchorLines.push("📎 ПРИКРЕПИ К ЗАПРОСУ: Hero anchor (reference card героя) — загружен в поле выше");
    }
    if (autoPrevPartAnchor && autoReferenceMode !== "heroOnly") {
      anchorLines.push("📎 ПРИКРЕПИ К ЗАПРОСУ: Previous PART (последняя сгенерированная сетка) — загружен в поле выше");
    }

    const anchorNote = anchorLines.length
      ? `\n\n━━━ ИНСТРУКЦИЯ ПО ЗАГРУЗКЕ ЯКОРЕЙ ━━━\nДля этого PART нужно прикрепить изображения к запросу в генераторе:\n${anchorLines.join("\n")}\n\nСайт сформировал промт — якоря нужно загрузить в Flow/Midjourney/DALL-E вручную.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      : "";

    const video = buildAutoVideoPack({ storyboard, styleProfile, partScenes: autoPartScenes, chainMode: autoChainMode, includeVo: autoIncludeVo });
    setAutoPartPrompt(prompt + autoPrevPartVisualDnaBlock + charOverrideBlock + anchorNote);
    setAutoVideoPack(video);
  }

  function generateAllAutoChainPrompts() {
    if (!storyboard || !autoParts.length) return;
    const all = buildAutoChainAllParts({
      storyboard, styleProfile, partSize: autoPartSize,
      chainMode: autoChainMode, strictLevel: autoStrictLevel,
      referenceMode: autoReferenceMode, appearanceMode: autoAppearanceMode
    }).map((p, i) => `===== AUTO-CHAIN PART ${i + 1} =====\n\n${p}${charOverrideBlock}`).join("\n\n");
    setAutoAllPromptText(all);
    setAutoPartPrompt("");
    setAutoVideoPack("");
  }

  function nextAutoPart() {
    if (!autoParts.length) return;
    switchAutoPart(autoPartIndex + 1);
  }

  function exportAutoChainJson() {
    const obj = buildAutoChainJson({ storyboard, styleProfile, partSize: autoPartSize, chainMode: autoChainMode, strictLevel: autoStrictLevel, referenceMode: autoReferenceMode, appearanceMode: autoAppearanceMode, includeVo: autoIncludeVo });
    if (charOverrideBlock) {
      obj.character_override = {
        enabled: charOverrideEnabled,
        face_lock: charFaceLock,
        modifiers: Object.entries(charModifiers).filter(([, v]) => v).map(([k]) => k),
      };
      obj.parts = (obj.parts || []).map((part) => ({ ...part, image_prompt: `${part.image_prompt}${charOverrideBlock}` }));
    }
    downloadTextFile(JSON.stringify(obj, null, 2), safeFileName(projectName) + "-auto-chain-v2.json", "application/json;charset=utf-8");
  }

  function exportAutoChainTxt() {
    const txt = autoAllPrompts.map((p, i) => `===== AUTO-CHAIN PART ${i + 1} =====\n\n${p}`).join("\n\n");
    downloadTextFile(txt, safeFileName(projectName) + "-auto-chain-v2.txt");
  }

  /* ── EXPORT ── */
  function exportJson() {
    const obj = storyboardToProjectJson(storyboard, { script, director: { styleProfile } });
    downloadTextFile(JSON.stringify(obj, null, 2), safeFileName(projectName) + ".json", "application/json;charset=utf-8");
  }
  function exportTxt() {
    const lines = [`NEUROCINE — ${projectName}\n\nСЦЕНАРИЙ:\n${script}\n\n--- STORYBOARD ---\n`];
    scenes.forEach(s => {
      lines.push(`\n[${s.id}] ${s.start}s–${s.end ?? "?"}s | ${s.beat_type}\nVO: ${s.vo_ru}\nIMAGE: ${s.image_prompt_en}\nVIDEO: ${s.video_prompt_en}\nSFX: ${s.sfx}\n`);
    });
    downloadTextFile(lines.join(""), safeFileName(projectName) + ".txt");
  }
  function exportFlow() {
    const txt = buildFlowTxt(storyboard, styleProfile);
    downloadTextFile(txt, safeFileName(projectName) + "-flow-veo.txt");
  }
  function copyAllVo() {
    const all = scenes.map(s => `[${s.id}] ${s.vo_ru || ""}`).join("\n\n");
    navigator.clipboard.writeText(all);
  }

  function clearAll() {
    localStorage.removeItem(KEY_TEXT); localStorage.removeItem(KEY_IMGS);
    setScript(""); setTopic(""); setProjectName("NeuroCine Project"); setJsonIn("");
    setSStat(""); setSbMode("safe"); setScriptValidation(null);
    setSnapshotStatus("");
    resetStoryboardOutputs({ keepAnchors: false });
  }

  function buildProjectSnapshot() {
    return {
      neurocine_project_snapshot: true,
      version: "v62_63_studio_ui_production_pack_polish",
      exported_at: new Date().toISOString(),
      app: "NeuroCine Studio",
      project: { projectName, topic, projectType, stylePreset, duration, aspectRatio, tone },
      script_pack: { script, scriptValidation },
      storyboard_pack: { storyboard, jsonIn, sbMode, target, validation },
      production_pipeline: {
        frameIdx, gridColsOverride, gridManualFrames, exploreP, selVariant, p2k, videoP,
        videoPromptMode, videoConsistency, analysis,
        autoPartSize, autoPartIndex, autoChainMode, autoStrictLevel, autoReferenceMode,
        autoAppearanceMode, autoIncludeVo, charOverrideEnabled, charFaceLock, charModifiers,
        autoPrevPartBrief, autoPrevPartBriefStatus, autoPartPrompt, autoVideoPack, autoAllPromptText
      },
      images: { gridImg, croppedFrame, variantImg, croppedVariant, finalImg },
      production_pack_cache: collectProductionCache(storageOwnerId || "guest")
    };
  }

  function applyProjectSnapshot(data) {
    const p = data?.project || {};
    const sp = data?.script_pack || {};
    const sbp = data?.storyboard_pack || {};
    const pipe = data?.production_pipeline || {};
    const imgs = data?.images || {};

    setProjectName(p.projectName || data?.projectName || "Imported NeuroCine Project");
    setTopic(p.topic || data?.topic || "");
    setProjectType(p.projectType || data?.projectType || "film");
    setStylePreset(p.stylePreset || data?.stylePreset || "cinematic");
    setDuration(Number(p.duration || data?.duration || 60));
    setAspect(p.aspectRatio || data?.aspectRatio || "9:16");
    setTone(p.tone || data?.tone || "cinematic documentary thriller");

    setScript(sp.script || data?.script || "");
    setScriptValidation(sp.scriptValidation || null);
    setSB(sbp.storyboard || data?.storyboard || null);
    setJsonIn(sbp.jsonIn || data?.jsonIn || "");
    setSbMode(sbp.sbMode || data?.sbMode || "safe");
    setTarget(sbp.target || data?.target || "veo3");
    setValidation(sbp.validation || data?.validation || null);

    setFrameIdx(pipe.frameIdx ?? null);
    setGridColsOverride(pipe.gridColsOverride ?? null);
    setGridManualFrames(pipe.gridManualFrames ?? null);
    setExploreP(pipe.exploreP || "");
    setSelVariant(pipe.selVariant || null);
    setP2k(pipe.p2k || "");
    setVideoP(pipe.videoP || "");
    setVideoPromptMode(pipe.videoPromptMode || "cheap");
    setVideoConsistency(pipe.videoConsistency || "ultra");
    setAnalysis(pipe.analysis || null);

    setAutoPartSize(pipe.autoPartSize || 4);
    setAutoPartIndex(pipe.autoPartIndex || 0);
    setAutoChainMode(pipe.autoChainMode || "worldHero");
    setAutoStrictLevel(pipe.autoStrictLevel || "hard");
    setAutoReferenceMode(pipe.autoReferenceMode || "heroAndPrevious");
    setAutoAppearanceMode(pipe.autoAppearanceMode || "full");
    setAutoIncludeVo(pipe.autoIncludeVo ?? true);
    setCharOverrideEnabled(Boolean(pipe.charOverrideEnabled));
    setCharFaceLock(pipe.charFaceLock || "");
    setCharModifiers(pipe.charModifiers || { beard:false, scar:false, dirt:false, bruises:false, sweat:false, exhaustion:false, pale:false, blood:false });
    setAutoPrevPartBrief(pipe.autoPrevPartBrief || "");
    setAutoPrevPartBriefStatus(pipe.autoPrevPartBriefStatus || "");
    setAutoPartPrompt(pipe.autoPartPrompt || "");
    setAutoVideoPack(pipe.autoVideoPack || "");
    setAutoAllPromptText(pipe.autoAllPromptText || "");

    setGridImg(imgs.gridImg || null);
    setCroppedFrame(imgs.croppedFrame || null);
    setVariantImg(imgs.variantImg || null);
    setCropped(imgs.croppedVariant || null);
    setFinalImg(imgs.finalImg || null);

    restoreProductionCache(data?.production_pack_cache, storageOwnerId || "guest");
    setSnapshotStatus("✓ Project Snapshot загружен");
  }

  function exportProjectSnapshot() {
    const snapshot = buildProjectSnapshot();
    downloadJsonFile(snapshot, safeFileName(projectName || "neurocine-project") + ".neurocine.json");
    setSnapshotStatus("✓ Project Snapshot скачан");
  }

  function importProjectSnapshot(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (!data.neurocine_project_snapshot && !data.storyboard && !data.script) {
          throw new Error("Это не NeuroCine project snapshot");
        }
        applyProjectSnapshot(data);
      } catch (e) {
        setSnapshotStatus("✗ Не удалось загрузить Project Snapshot");
        alert(e.message || "Не удалось загрузить Project Snapshot");
      } finally {
        if (snapshotInputRef.current) snapshotInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  const navigateToStudioAnchor = useCallback((anchor = "setup") => {
    const id = String(anchor || "setup").replace(/^#/, "");
    setSideDrawerOpen(false);
    setCreateHubOpen(false);
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        try { window.history.replaceState(null, "", `#${id}`); } catch {}
      }
    });
  }, []);

  const handleCreateToolSelect = useCallback((tool) => {
    if (!tool) return;
    const anchor = tool.anchor || String(tool.route || "").split("#")[1] || "setup";
    navigateToStudioAnchor(anchor);
    const label = tool.status === "active"
      ? `Открыт модуль: ${tool.title}`
      : tool.status === "ready_ui"
        ? `${tool.title}: интерфейс подготовлен, полный AI-provider подключим в следующих версиях`
        : `${tool.title}: добавлено в карту будущих инструментов NeuroCine`;
    setSnapshotStatus(label);
    setTimeout(() => setSnapshotStatus(""), 3600);
  }, [navigateToStudioAnchor]);


  /* ── RENDER ── */
  return (
    <div className="studio">
      <div className="nc-mobile-shell" id="tools">
        <TopActionBar
          account={account}
          access={accountAccess}
          uiLang={uiLang}
          onToggleLang={() => setUiLang(v => v === "ru" ? "en" : "ru")}
          onOpenMenu={() => setSideDrawerOpen(true)}
          onOpenCreate={() => setCreateHubOpen(true)}
          onNavigate={navigateToStudioAnchor}
        />
        <SideDrawer
          open={sideDrawerOpen}
          onClose={() => setSideDrawerOpen(false)}
          onNavigate={navigateToStudioAnchor}
          onSelectTool={handleCreateToolSelect}
          access={accountAccess}
        />
        <CreateHub
          open={createHubOpen}
          onClose={() => setCreateHubOpen(false)}
          onSelectTool={handleCreateToolSelect}
          access={accountAccess}
        />
        <MobileBottomNav
          onCreate={() => setCreateHubOpen(true)}
          onNavigate={navigateToStudioAnchor}
        />
      </div>

      {/* TOP BAR */}
      <nav className="studio-topbar-v40">
        <div className="topbrand-v40">
          <div className="topbrand-kicker-v40">NeuroCine Online</div>
          <div className="topbrand-title-v40">Director Studio</div>
        </div>
        <div className="top-actions-v40">
          <a href="#setup" className="top-pill-v40 active">00 Настройка</a>
          <a href="#script" className="top-pill-v40">01 Сценарий</a>
          <a href="#storyboard" className="top-pill-v40">02 Storyboard</a>
          <a href="#production" className="top-pill-v40">03 Pipeline</a>
          <button className={`top-pill-v40 mode ${effectiveDevMode ? "demo" : "live"}`} onClick={handleModeToggle} type="button" disabled={!canToggleLiveMode}>
            {modeLabel}
          </button>
          <button className="top-pill-v40" onClick={() => setUiLang(v => v === "ru" ? "en" : "ru")} type="button">🌐 {uiLang.toUpperCase()}</button>
        </div>
      </nav>
      <input
        ref={snapshotInputRef}
        type="file"
        accept=".json,.neurocine.json,application/json"
        style={{ display: "none" }}
        onChange={e => importProjectSnapshot(e.target.files?.[0])}
      />

      <AuthPanel devMode={effectiveDevMode} onModeToggle={handleModeToggle} onAccountChange={setAccount} />

      {!isSignedIn && (
        <section className="auth-required-v46">
          <div className="auth-required-kicker-v46">NeuroCine Access Gate</div>
          <h2>Вход обязателен</h2>
          <p>Без Google-аккаунта рабочая зона закрыта: вход нужен для проектов, сценариев и storyboard.</p>
          <p><b>FREE Preview</b> открывается после входа. PRO включает полный рабочий режим.</p>
        </section>
      )}

      {isSignedIn && (
        <StudioFlowPanel
          topic={topic}
          script={script}
          storyboard={storyboard}
          frameGridPrompt={frameGridPromptWithDirectives}
          videoPrompt={videoP}
          productionReady={Boolean(script.trim() || storyboard)}
          access={accountAccess}
          devMode={effectiveDevMode}
          liveAllowed={liveAllowed}
        />
      )}

      {effectiveDevMode && <div className="demo-banner-v35">{t.devHint}</div>}
      {snapshotStatus && (
        <div className="snapshot-status">{snapshotStatus}</div>
      )}

      {isSignedIn ? (
        <>
      <ProjectSetupPanelV40
        projectName={projectName}
        setProjectName={setProjectName}
        topic={topic}
        handleTopicChange={handleTopicChange}
        script={script}
        setScript={setScript}
        projectType={projectType}
        setProjectType={setProjectType}
        stylePreset={stylePreset}
        setStylePreset={setStylePreset}
        duration={duration}
        setDuration={setDuration}
        aspectRatio={aspectRatio}
        setAspect={setAspect}
        tone={tone}
        setTone={setTone}
        target={target}
        setTarget={setTarget}
        sbMode={sbMode}
        setSbMode={setSbMode}
        devMode={effectiveDevMode}
        modeLabel={modeLabel}
        accountAccess={accountAccess}
        sBusy={sBusy}
        sbBusy={sbBusy}
        doScript={doScript}
        doStoryboard={doStoryboard}
        sStat={sStat}
        sbStat={sbStat}
        storyboard={storyboard}
        clearTopicOnly={clearTopicOnly}
        clearScriptOnly={clearScriptOnly}
        clearSetupText={clearSetupText}
        clearEverything={clearEverything}
        authLocked={!isSignedIn}
      />

      <ProductionStatusBar
        t={t}
        script={script}
        storyboard={storyboard}
        autoPartIndex={autoPartIndex}
        videoP={videoP}
        finalImg={finalImg}
      />

      <section id="quick-tools" className="nc-quick-tools-anchor">
        <QuickStartHub
          topic={topic}
          setTopic={handleTopicChange}
          setScript={setScript}
          setDuration={setDuration}
          setAspect={setAspect}
          setStylePreset={setStylePreset}
          setTone={setTone}
          setProjectType={setProjectType}
          setSbMode={setSbMode}
          setTarget={setTarget}
          doScript={doScript}
          doStoryboard={doStoryboard}
          onScrollToPack={() => {
            if (typeof document !== "undefined") {
              document.getElementById("pack")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          onScrollToStudio={() => {
            if (typeof document !== "undefined") {
              document.getElementById("production")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          onStatus={setSnapshotStatus}
        />

        <WizardSteps
          topic={topic}
          script={script}
          storyboard={storyboard}
          curFrame={curFrame}
          finalImg={finalImg}
          duration={duration}
          aspectRatio={aspectRatio}
          stylePreset={stylePreset}
          stylePresets={STYLE_PRESETS}
          onJumpTo={(anchor) => {
            if (typeof document !== "undefined") {
              document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />
      </section>

      <div className="studio-flow-shell">
        <aside className="studio-rail" aria-label="Production steps">
          <a href="#script"><span>01</span> {t.railScript}</a>
          <a href="#storyboard"><span>02</span> {t.railStoryboard}</a>
          <a href="#production"><span>03</span> {t.railPipeline}</a>
          <a href="#pack"><span>04</span> {t.railPack}</a>
        </aside>
        <main className="studio-flow-main">

      {/* ══ STEP 01 — SCRIPT ══ */}
      <section className="step-section studio-step-card" id="script">
        <div className="step-header">
          <div className="step-num">01</div>
          <div className="step-info">
            <div className="step-title">Сценарий</div>
            <div className="step-desc">Тема → настройки → текст диктора + JSON</div>
          </div>
          {script && <span className="step-badge">✓ Готов</span>}
        </div>
        <div className="step-body">
          <div className="two-col lw">
            <div className="col script-control-v41">
              <div className="compact-step-note-v41">
                <strong>Настройки теперь сверху.</strong>
                <span>Этот блок больше не дублирует тему, стиль, длительность и готовый сценарий. Здесь только управление сценарием и результат.</span>
              </div>
              <div className="script-actions-v41">
                <button className="btn btn-red btn-full" onClick={doScript} disabled={!isSignedIn || sBusy || (!topic.trim() && !script.trim() && !devMode)}>
                  {sBusy ? "⏳ Генерация..." : script.trim() && !topic.trim() ? "▶ ПРОВЕРИТЬ СЦЕНАРИЙ" : "▶ СОЗДАТЬ СЦЕНАРИЙ"}
                </button>
                <button className="btn btn-soft btn-full" onClick={clearTopicOnly} disabled={!topic.trim()} type="button">Очистить тему</button>
                <button className="btn btn-soft btn-full" onClick={clearScriptOnly} disabled={!script.trim()} type="button">Очистить сценарий</button>
                <button className="btn btn-soft-danger btn-full" onClick={clearSetupText} disabled={!topic.trim() && !script.trim()} type="button">Очистить тему + сценарий</button>
              </div>
              {sStat && (() => {
                const [sType, sMsg] = sStat.includes("|") ? sStat.split("|") : [sStat, ""];
                const isErr = sType === "err";
                return (
                  <div className={`status-line${sStat === "ok" ? " ok" : isErr ? " err" : ""}`}>
                    {sStat === "ok" ? "✓ Сценарий готов" : isErr ? `✗ ${sMsg || "Ошибка генерации"}` : "⏳ Генерация..."}
                  </div>
                );
              })()}
            </div>

            <div className="col">
              <OutBox label="Текст диктора (VO)" text={script} empty="Сценарий появится здесь" />

              {/* SCRIPT QUALITY INDICATOR */}
              {script && scriptValidation && (
                <div className="out-box">
                  <div className="out-head">
                    <span className="out-label">Качество сценария</span>
                    <span style={{
                      fontSize: 12, fontWeight: 900, padding: "3px 12px", borderRadius: 100,
                      background: scriptValidation.score >= 90
                        ? "rgba(34,197,94,0.18)"
                        : scriptValidation.score >= 70
                          ? "rgba(245,158,11,0.18)"
                          : "rgba(229,53,53,0.18)",
                      color: scriptValidation.score >= 90
                        ? "#22c55e"
                        : scriptValidation.score >= 70
                          ? "#f59e0b"
                          : "#fca5a5",
                      border: `1px solid ${scriptValidation.score >= 90
                        ? "rgba(34,197,94,0.35)"
                        : scriptValidation.score >= 70
                          ? "rgba(245,158,11,0.35)"
                          : "rgba(229,53,53,0.35)"}`
                    }}>
                      {scriptValidation.score}/100
                    </span>
                  </div>
                  <div className="out-body" style={{ paddingTop: 10 }}>
                    {/* Чек-лист */}
                    <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
                      {[
                        { key: "hook_strong", okText: "Хук сильный", failText: "Хук слабый — год/дата/«это история»" },
                        { key: "has_you_address", okText: "Обращение к зрителю «ты» есть", failText: "Нет «ты» — зритель не вовлечён" },
                        { key: "rhythm_varied", okText: "Ритм пульсирует", failText: "Монотонный ритм — нет коротких ударных фраз" },
                        { key: "climax_isolated", okText: "Climax изолирован", failText: "Climax растворён в абзаце" },
                        { key: "outro_strong", okText: "Концовка сильная", failText: "Банальная концовка" },
                        { key: "no_filler_words", okText: "Нет слов-паразитов", failText: "Есть слова-паразиты (вообще/типа/как бы)" },
                        { key: "no_long_lists", okText: "Нет сухих перечислений", failText: "Сухой список через запятую — заменить на 1 яркий образ" },
                        { key: "storyboard_spine", okText: "Storyboard spine есть", failText: "Мало опор для раскадровки" },
                        { key: "final_frame_grounded", okText: "Финальный кадр есть", failText: "Нет финального кадра перед вопросом" },
                      ].map(({ key, okText, failText }) => {
                        const ok = scriptValidation.checks?.[key];
                        return (
                          <div key={key} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            color: ok ? "#22c55e" : "#fca5a5",
                            opacity: ok ? 0.9 : 1,
                            fontWeight: ok ? 500 : 700,
                          }}>
                            <span style={{
                              width: 16, textAlign: "center",
                              fontSize: 12, fontWeight: 900,
                            }}>{ok ? "✓" : "✗"}</span>
                            <span>{ok ? okText : failText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Issues + статистика */}
                    {scriptValidation.issues?.length > 0 && (
                      <div style={{
                        marginTop: 12, paddingTop: 10,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        fontSize: 11, color: "var(--muted)", lineHeight: 1.55,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: "#fca5a5" }}>
                          Подробности:
                        </div>
                        {scriptValidation.issues.slice(0, 3).map((iss, i) => (
                          <div key={i} style={{ marginBottom: 2 }}>· {iss}</div>
                        ))}
                      </div>
                    )}

                    {scriptValidation.stats && (
                      <div style={{
                        marginTop: 10, paddingTop: 8,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        fontSize: 10, color: "var(--muted2)",
                        display: "flex", gap: 12, flexWrap: "wrap",
                      }}>
                        <span>Предложений: {scriptValidation.stats.sentences}</span>
                        <span>Ср. слов: {scriptValidation.stats.avg_words_per_sentence}</span>
                        <span>Коротких фраз: {scriptValidation.stats.short_sentences}</span>
                        <span>«ты»-обращений: {scriptValidation.stats.you_address_count}</span>
                        <span>Кадровых действий: {scriptValidation.stats.storyboard_actions ?? 0}</span>
                        <span>Предметных деталей: {scriptValidation.stats.storyboard_anchors ?? 0}</span>
                      </div>
                    )}

                    {/* Подсказка регенерировать если плохо */}
                    {!scriptValidation.ok && topic.trim() && (
                      <div style={{
                        marginTop: 12, padding: "10px 12px",
                        background: "rgba(229,53,53,0.08)",
                        border: "1px solid rgba(229,53,53,0.25)",
                        borderRadius: 10,
                        fontSize: 11, color: "#fca5a5",
                      }}>
                        💡 Сценарий не прошёл проверку ({scriptValidation.score}/100) — нажми «Создать сценарий» ещё раз: AI попробует переписать с учётом проблем.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {script && (
                <div className="out-box">
                  <div className="out-head">
                    <span className="out-label">Script JSON</span>
                    <div className="brow">
                      <CopyBtn text={scriptJson} label="Копировать JSON" />
                      <button className="btn btn-sm" onClick={() => downloadTextFile(scriptJson, safeFileName(projectName) + "-script.json", "application/json;charset=utf-8")}>⬇ .json</button>
                      <button className="btn btn-sm" onClick={() => downloadTextFile(script, safeFileName(projectName) + "-script.txt")}>⬇ .txt</button>
                    </div>
                  </div>
                  <div className="json-box"><pre>{scriptJson}</pre></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP 02B — AUTO-CHAIN STRICT ENGINE (BEFORE CLASSIC GENERATION) ══ */}
      <section className="step-section">
        <div className="step-header">
          <div className="step-num">02B</div>
          <div className="step-info">
            <div className="step-title">Auto-Chain Strict Engine · Вариант 2.6</div>
            <div className="step-desc">Отдельный режим ДО старого Storyboard: сначала якоря и PART, потом storyboard JSON и PART-prompts. Старый режим ниже не трогаем.</div>
          </div>
          <span className="step-badge">V2.6 · {autoParts.length || 0} PART</span>
        </div>
        <div className="step-body">
          {/* CHARACTER OVERRIDE BLOCK */}
          <div className="frame-card" style={{ marginBottom: 14 }}>
            <div className="frame-card-lbl" style={{ marginBottom: 10 }}>
              🎭 Character Override — лицо из anchor, образ из роли
            </div>

            {/* Toggle */}
            <div className="brow" style={{ marginBottom: 10 }}>
              <button
                className={"btn btn-sm" + (charOverrideEnabled ? " btn-red" : "")}
                onClick={() => { setCharOverrideEnabled(v => !v); clearAutoChainOutputs({ clearGrid: true }); }}
              >
                {charOverrideEnabled ? "✓ Включён" : "Включить"}
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {charOverrideEnabled
                  ? "Лицо из anchor — одежда и модификаторы из роли"
                  : "Отключён — character_lock целиком из стории"}
              </span>
            </div>

            {charOverrideEnabled && (
              <div>
                {/* Face lock */}
                <div className="field" style={{ marginBottom: 12 }}>
                  <label className="field-label">Описание лица (из reference card)</label>
                  <textarea className="inp" rows={2} style={{ minHeight: 60 }}
                    value={charFaceLock}
                    onChange={e => { setCharFaceLock(e.target.value); clearAutoChainOutputs({ clearGrid: true }); }}
                    placeholder="round face shape, brown eyes, light olive skin, buzz cut dark hair, calm expression, slight under-eye shadows, Eastern European features"
                  />
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                    Скопируй из reference card или опиши вручную — это лицо будет заблокировано во всех кадрах
                  </div>
                </div>

                {/* Suggested modifiers */}
                {suggestedMods.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                      ✦ Рекомендуется для этой темы
                    </div>
                    <div className="brow" style={{ flexWrap: "wrap", gap: 6 }}>
                      {suggestedMods.map(mod => (
                        <button key={mod.key}
                          className={"btn btn-xs" + (charModifiers[mod.key] ? " btn-red" : "")}
                          onClick={() => { setCharModifiers(prev => ({ ...prev, [mod.key]: !prev[mod.key] })); clearAutoChainOutputs({ clearGrid: true }); }}
                          title={mod.reason}
                        >
                          {charModifiers[mod.key] ? "✓ " : ""}{mod.label}
                          <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 4 }}>— {mod.reason}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All modifiers */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Все модификаторы
                  </div>
                  <div className="brow" style={{ flexWrap: "wrap", gap: 5 }}>
                    {[
                      { key: "beard",      label: "🧔 Борода / щетина" },
                      { key: "scar",       label: "⚔️ Шрамы" },
                      { key: "dirt",       label: "🟫 Грязь" },
                      { key: "bruises",    label: "🟣 Синяки" },
                      { key: "sweat",      label: "💧 Пот" },
                      { key: "exhaustion", label: "😮 Истощение" },
                      { key: "pale",       label: "🤍 Бледность" },
                      { key: "blood",      label: "🔴 Кровь (безоп.)" },
                    ].map(mod => (
                      <button key={mod.key}
                        className={"btn btn-xs" + (charModifiers[mod.key] ? " btn-red" : "")}
                        onClick={() => { setCharModifiers(prev => ({ ...prev, [mod.key]: !prev[mod.key] })); clearAutoChainOutputs({ clearGrid: true }); }}
                      >
                        {charModifiers[mod.key] ? "✓ " : ""}{mod.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {(charFaceLock.trim() || Object.values(charModifiers).some(Boolean)) && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(229,53,53,0.06)", borderRadius: 8, border: "1px solid rgba(229,53,53,0.15)", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--accent)" }}>Face lock:</strong> {charFaceLock || "не задано"}<br/>
                    <strong style={{ color: "var(--accent)" }}>Модификаторы:</strong> {Object.entries(charModifiers).filter(([,v])=>v).map(([k])=>k).join(", ") || "нет"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="out-box" style={{ marginBottom: 14 }}>
            <div className="out-head">
              <span className="out-label">Что делает V2.6</span>
            </div>
            <div className="out-body" style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.55 }}>
              1) Hero Anchor / Previous PART загружаются здесь ДО подготовки PART-prompts.<br />
              2) Сначала нужно получить storyboard JSON из сценария — кнопка ниже использует новый сценарий. Старый ручной JSON не перебивает новый сценарий.<br />
              3) NeuroCine создаёт строгий prompt для Flow/VEO. Саму картинку-сетку всё ещё генерирует Flow/VEO, поэтому загруженные якоря нужно прикрепить в Flow вручную вместе с prompt.
            </div>
          </div>

          <div className="two-col lw">
            <div className="col">
              <div className="frame-card">
                <div className="frame-card-lbl" style={{ marginBottom: 8 }}>🧬 Anchors — вход до генерации</div>
                <div className="two-col">
                  <div className="col">
                    {autoHeroAnchor ? (
                      <>
                        <div className="img-viewer"><img src={autoHeroAnchor} alt="Hero anchor" /></div>
                        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setAutoHeroAnchor(null); clearAutoChainOutputs({ clearGrid: true }); }}>Заменить hero anchor</button>
                      </>
                    ) : (
                      <UploadZone label="Hero anchor" hint="Главный герой / style DNA" onFile={(url) => { setAutoHeroAnchor(url); clearAutoChainOutputs({ clearGrid: true }); }} />
                    )}
                  </div>
                  <div className="col">
                    {autoPrevPartAnchor ? (
                      <>
                        <div className="img-viewer"><img src={autoPrevPartAnchor} alt="Previous PART" /></div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.45 }}>
                          {autoPrevPartBriefStatus === "analyzing"
                            ? "Анализирую визуальную ДНК сетки..."
                            : autoPrevPartBriefStatus === "ready"
                              ? "✓ Visual DNA добавлена в PART prompt"
                              : autoPrevPartBriefStatus
                                ? "Анализ не прошёл, но сетка будет работать как ручной reference в Flow/VEO"
                                : "Сетка будет использоваться как Previous PART reference"}
                        </div>
                        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => clearPreviousPartAnchor({ clearGrid: true })}>Заменить previous PART</button>
                      </>
                    ) : (
                      <UploadZone label="Previous PART" hint="Для PART 2+ загрузи последнюю готовую сетку" onFile={(url) => setPreviousPartAnchor(url, { clearGrid: true })} />
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  PART 1 может работать только с Hero Anchor. Для PART 2+ Previous PART нужен как continuity anchor, если предыдущая сетка была сделана во Flow/VEO.
                </div>
              </div>

              <div className="frame-card" style={{ marginTop: 10 }}>
                <div className="frame-card-lbl" style={{ marginBottom: 8 }}>⚙️ Настройки V2</div>
                <div className="frow frow2">
                  <div className="field">
                    <label className="field-label">Логика</label>
                    <select className="inp" value={autoChainMode} onChange={e => { setAutoChainMode(e.target.value); clearAutoChainOutputs({ clearGrid: true }); }}>
                      <option value="worldHero">World + Hero — мир + главный герой</option>
                      <option value="worldOnly">World Only — разные персонажи, один мир</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Строгость</label>
                    <select className="inp" value={autoStrictLevel} onChange={e => { setAutoStrictLevel(e.target.value); clearAutoChainOutputs({ clearGrid: true }); }}>
                      <option value="hard">Hard — строго по сценарию</option>
                      <option value="maximum">Maximum — буквально, без украшений</option>
                      <option value="soft">Soft — чуть больше кинематографа</option>
                    </select>
                  </div>
                </div>
                <div className="frow frow2">
                  <div className="field">
                    <label className="field-label">Reference mode</label>
                    <select className="inp" value={autoReferenceMode} onChange={e => { setAutoReferenceMode(e.target.value); clearAutoChainOutputs({ clearGrid: true }); }}>
                      <option value="heroAndPrevious">Hero anchor + previous PART</option>
                      <option value="previousPart">Previous PART only</option>
                      <option value="heroOnly">Hero anchor only</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Кадров в PART</label>
                    <select className="inp" value={autoPartSize} onChange={e => { setAutoPartSize(Number(e.target.value)); setAutoPartIndex(0); clearAutoChainOutputs({ clearGrid: true }); }}>
                      <option value={4}>4 кадра · 2×2</option>
                      <option value={6}>6 кадров · 2×3</option>
                      <option value={8}>8 кадров · 2×4</option>
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">Внешность персонажей в промте</label>
                  <div className="brow">
                    <button
                      className={"btn btn-sm" + (autoAppearanceMode === "full" ? " btn-red" : "")}
                      onClick={() => { setAutoAppearanceMode("full"); clearAutoChainOutputs({ clearGrid: true }); }}
                    >
                      🧬 Полная
                    </button>
                    <button
                      className={"btn btn-sm" + (autoAppearanceMode === "minimal" ? " btn-red" : "")}
                      onClick={() => { setAutoAppearanceMode("minimal"); clearAutoChainOutputs({ clearGrid: true }); }}
                    >
                      🖼 Только действие
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {autoAppearanceMode === "minimal"
                      ? "Лицо берётся из Hero Anchor — промт содержит только действие и локацию"
                      : "AI описывает внешность в промте — подходит если якорь не загружен"}
                  </div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">VO в видеопромте</label>
                  <div className="brow">
                    <button
                      className={"btn btn-sm" + (autoIncludeVo ? " btn-red" : "")}
                      onClick={() => { setAutoIncludeVo(true); clearAutoChainOutputs({ clearVideo: true }); }}
                    >
                      ✓ Включить
                    </button>
                    <button
                      className={"btn btn-sm" + (!autoIncludeVo ? " btn-red" : "")}
                      onClick={() => { setAutoIncludeVo(false); clearAutoChainOutputs({ clearVideo: true }); }}
                    >
                      ✕ Убрать
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {autoIncludeVo
                      ? "VO MEANING LOCK присутствует — генератор держит эмоцию"
                      : "VO убран — только визуал и движение"}
                  </div>
                </div>
              </div>

              <div className="brow" style={{ marginTop: 10 }}>
                <button className="btn btn-red" onClick={doStoryboard} disabled={sbBusy || (!script.trim() && !jsonIn.trim())}>
                  {sbBusy ? "⏳ Генерация..." : storyboard ? "↻ Обновить storyboard JSON" : "▶ Создать storyboard JSON для V2"}
                </button>
              </div>

              {/* Warning если scriptValidation плохой */}
              {scriptValidation && !scriptValidation.ok && script.trim() && !sbBusy && (
                <div style={{
                  marginTop: 10, padding: "10px 12px",
                  background: "rgba(245,158,11,0.10)",
                  border: "1px solid rgba(245,158,11,0.30)",
                  borderRadius: 10,
                  fontSize: 11, color: "#f59e0b", lineHeight: 1.5,
                }}>
                  ⚠ Сценарий не прошёл проверку ({scriptValidation.score}/100). Storyboard унаследует слабые места.
                  Рекомендуем сначала улучшить сценарий: вернись к шагу 01 и нажми «СОЗДАТЬ СЦЕНАРИЙ» снова.
                </div>
              )}

              {sbStat && (() => {
                const [type, msg] = sbStat.includes("|") ? sbStat.split("|") : ["", sbStat];
                const isFallback = String(msg || "").includes("fallback") || String(msg || "").includes("FALLBACK");
                return (
                  <div className={`status-line${type === "ok" ? " ok" : type === "err" ? " err" : ""}`} style={isFallback ? { color: "#fca5a5" } : undefined}>
                    {type === "ok" ? `✓ Storyboard JSON готов · ${msg}` : type === "err" ? `✗ ${msg}` : "⏳ Генерация..."}
                  </div>
                );
              })()}
            </div>

            <div className="col">
              <div className="out-box">
                <div className="out-head"><span className="out-label">V2 Status</span></div>
                <div className="out-body" style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
                  {storyboard ? (
                    <>
                      <div style={{ color: "#22c55e", fontWeight: 900, marginBottom: 8 }}>✓ Storyboard JSON готов · {scenes.length} кадров</div>
                      Дальше не запускай второй генератор: переходи в блок 03 — там FRAME GRID PROMPT, PART-сетка {autoPartGridLabel}, {autoPartCellLabels.join("/") || "выбор кадра"}, кроп и video prompt.
                    </>
                  ) : (
                    <>После нажатия верхней кнопки V2 здесь появится статус. Все PART-prompts перенесены в блок 03 как FRAME GRID PROMPT · FLOW COMPACT.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP 02 — STORYBOARD ══ */}
      <section className="step-section studio-step-card" id="storyboard">
        <div className="step-header">
          <div className="step-num">02</div>
          <div className="step-info">
            <div className="step-title">Storyboard</div>
            <div className="step-desc">Разбивка на кадры + промт для генерации сетки</div>
          </div>
          {storyboard && <span className="step-badge">✓ {scenes.length} кадров</span>}
        </div>
        <div className="step-body">
          <div className="two-col lw">
            <div className="col">
              <div className="field">
                <label className="field-label">Режим генерации</label>
                <div className="brow">
                  <button
                    className={`btn${sbMode === "safe" ? " btn-red" : ""}`}
                    onClick={() => setSbMode("safe")}
                    style={{ flex: 1 }}
                  >
                    🛡 Safe
                  </button>
                  <button
                    className={`btn${sbMode === "raw" ? " btn-red" : ""}`}
                    onClick={() => setSbMode("raw")}
                    style={{ flex: 1 }}
                  >
                    ⚡ Raw
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                  {sbMode === "safe" ? "Safe — документальный стиль, без жёсткого контента" : "Raw — сильная камера, интенсивная атмосфера, кинематографичнее"}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Целевая видео-модель</label>
                <div className="brow">
                  <button
                    className={`btn${target === "veo3" ? " btn-red" : ""}`}
                    onClick={() => setTarget("veo3")}
                    style={{ flex: 1 }}
                  >
                    🎬 Veo 3
                  </button>
                  <button
                    className={`btn${target === "grok" ? " btn-red" : ""}`}
                    onClick={() => setTarget("grok")}
                    style={{ flex: 1 }}
                  >
                    🚀 Grok
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                  {target === "veo3"
                    ? "Veo 3 — длинные промты с native audio, явное тайминг камеры, до 8с"
                    : "Grok Imagine — компактные промты с visual hook, стилевые референсы, до 6с"}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Вставить JSON вручную (необязательно)</label>
                <textarea className="inp mono" style={{ minHeight: 90 }} value={jsonIn}
                  onChange={e => handleManualJsonChange(e.target.value)}
                  placeholder='{"script": "..."} — или оставь пустым' />
              </div>
              <div className="out-box">
                <div className="out-head"><span className="out-label">Manual mode</span></div>
                <div className="out-body" style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
                  Генерация storyboard запускается только верхней кнопкой V2. Этот блок хранит настройки Safe/Raw, Veo/Grok и ручной JSON — без второго запуска.
                </div>
              </div>

              {/* Validation badge */}
              {validation && (
                <div className="out-box">
                  <div className="out-head">
                    <span className="out-label">Validation</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 100,
                      background: validation.ok ? "rgba(34,197,94,0.15)" : "rgba(229,53,53,0.15)",
                      color: validation.ok ? "#22c55e" : "#fca5a5",
                      border: `1px solid ${validation.ok ? "rgba(34,197,94,0.3)" : "rgba(229,53,53,0.3)"}`
                    }}>
                      {validation.ok ? "✓ Всё верно" : `⚠ ${validation.errors?.length} issue${validation.errors?.length !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {!validation.ok && validation.errors?.length > 0 && (
                    <div className="out-body">
                      {validation.errors.slice(0, 5).map((e, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#fca5a5", marginBottom: 3 }}>· {e}</div>
                      ))}
                      {validation.errors.length > 5 && (
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>...ещё {validation.errors.length - 5}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {storyboard && (
                <div className="brow">
                  <button className="btn btn-sm" onClick={exportJson}>⬇ .json</button>
                  <button className="btn btn-sm" onClick={exportTxt}>⬇ .txt</button>
                  <button className="btn btn-sm btn-red" onClick={exportFlow}>⬇ Flow/VEO</button>
                  <button className="btn btn-sm" onClick={copyAllVo} title="Копировать все VO для TTS">📋 Все VO</button>
                </div>
              )}
            </div>
            <div className="col">
              <div className="out-box">
                <div className="out-head"><span className="out-label">V2 Status</span></div>
                <div className="out-body" style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
                  {storyboard ? (
                    <>
                      <div style={{ color: "#22c55e", fontWeight: 900, marginBottom: 8 }}>✓ Storyboard JSON готов · {scenes.length} кадров</div>
                      Дальше работа идёт в блоке 03: FRAME GRID PROMPT → PART-сетка {autoPartGridLabel} → {autoPartCellLabels.join("/") || "кадр"} → video prompt из JSON.
                    </>
                  ) : (
                    <>Сначала создай storyboard JSON верхней кнопкой V2. После этого сразу переходи к блоку 03.</>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ══ STEP 03 — PRODUCTION PIPELINE · FINAL CLEAN PART GRID ══ */}
      <section className="step-section studio-step-card" id="production">
        <div className="step-header">
          <div className="step-num">03</div>
          <div className="step-info">
            <div className="step-title">Production Pipeline</div>
            <div className="step-desc">FRAME GRID PROMPT → PART-сетка {autoPartGridLabel} → {autoPartCellLabels.join("/") || "кадр"} → кроп → 2K → VIDEO PROMPT</div>
          </div>
          {curFrame && <span className="step-badge">{curFrame.id}</span>}
        </div>

        <div className="step-body">
          {!scenes.length ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
              Сначала создай storyboard JSON в шаге 02 — здесь появится FRAME GRID PROMPT и загрузка PART-сетки.
            </div>
          ) : (
            <>
              {/* A — PART + FRAME GRID PROMPT */}
              <div className="pipe-step on">
                <div className="pipe-head">
                  <div className="pipe-dot act">A</div>
                  <div>
                    <div className="pipe-title">FRAME GRID PROMPT · выбери PART</div>
                    <div className="pipe-sub">Prompt пересобирается автоматически под выбранный PART, anchors и reference mode. Скопируй его в Flow / Nano Banana / VEO, получи PART-сетку {autoPartGridLabel} и загрузи её ниже.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  <div className="frame-card" style={{ marginBottom: 14 }}>
                    <div className="frame-card-lbl" style={{ marginBottom: 10 }}>Текущий PART</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {autoParts.map((part, i) => {
                        const first = part[0]?.id || `frame_${String(i * autoPartSize + 1).padStart(2, "0")}`;
                        const last = part[part.length - 1]?.id || first;
                        const active = autoPartIndex === i;
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => switchAutoPart(i)}
                            style={{
                              width: "100%",
                              border: active ? "1px solid var(--red)" : "1px solid var(--border)",
                              background: active ? "var(--redglow)" : "rgba(0,0,0,0.28)",
                              color: active ? "#fff" : "var(--muted)",
                              borderRadius: 14,
                              padding: "11px 12px",
                              fontSize: 13,
                              fontWeight: 900,
                              textAlign: "left",
                              cursor: "pointer",
                              boxShadow: active ? "inset 0 0 0 1px rgba(229,53,53,0.25)" : "none"
                            }}
                          >
                            PART {i + 1} · {first}–{last}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
                      Сейчас выбран PART {autoPartIndex + 1}. {autoPartCellLabels.join("/") || "Кадры"} будут соответствовать кадрам: <b>{autoPartScenes.map(s => s.id).join(" / ") || "—"}</b>.
                    </div>
                  </div>

                  <OutBox
                    label={`FRAME GRID PROMPT · FLOW COMPACT · PART ${autoPartIndex + 1}`}
                    text={frameGridPromptWithDirectives}
                    empty="Сначала создай storyboard JSON"
                  />
                </div>
              </div>

              {/* B — UPLOAD PART GRID AND SELECT CELL */}
              <div className="pipe-step on">
                <div className="pipe-head">
                  <div className={`pipe-dot${gridImg ? " done" : " act"}`}>B</div>
                  <div>
                    <div className="pipe-title">Загрузи PART-сетку {autoPartGridLabel} · выбери {autoPartCellLabels.join("/") || "кадр"}</div>
                    <div className="pipe-sub">Нажми прямо на кадр в сетке. Красная рамка покажет выбранную ячейку.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  {gridImg ? (
                    <>
                      <div
                        style={{
                          position: "relative",
                          borderRadius: 16,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(0,0,0,0.35)",
                          marginBottom: 12
                        }}
                      >
                        <img src={gridImg} alt={`PART grid ${autoPartGridLabel}`} style={{ width: "100%", display: "block", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${autoPartCols}, 1fr)`, gridTemplateRows: `repeat(${autoPartRows}, 1fr)` }}>
                          {autoPartScenes.map((s, localIdx) => {
                            const label = partCellLabel(localIdx);
                            const globalIdx = autoPartIndex * autoPartSize + localIdx;
                            const selected = frameIdx === globalIdx;
                            return (
                              <button
                                type="button"
                                key={s.id || localIdx}
                                onClick={() => {
                                  setFrameIdx(globalIdx);
                                  setShowFrameRu(false);
                                  setVideoP("");
                                  setAnalysis(null);
                                  setFinalImg(null);
                                  cropGridFrame(gridImg, localIdx, autoPartScenes.length, autoPartCols)
                                    .then(url => setCroppedFrame(url))
                                    .catch(() => setCroppedFrame(null));
                                }}
                                style={{
                                  position: "relative",
                                  cursor: "pointer",
                                  border: selected ? "3px solid var(--red)" : "1px solid rgba(255,255,255,0.10)",
                                  background: selected ? "rgba(229,53,53,0.12)" : "rgba(0,0,0,0.01)",
                                  padding: 8,
                                  outline: "none"
                                }}
                              >
                                <span style={{
                                  position: "absolute",
                                  left: 8,
                                  top: 8,
                                  minWidth: 28,
                                  height: 28,
                                  borderRadius: 999,
                                  background: selected ? "var(--red)" : "rgba(0,0,0,0.78)",
                                  color: "#fff",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 950
                                }}>{label}</span>
                                <span style={{
                                  position: "absolute",
                                  left: 42,
                                  top: 9,
                                  padding: "5px 8px",
                                  borderRadius: 999,
                                  background: "rgba(0,0,0,0.72)",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 950
                                }}>{s.id}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="brow" style={{ marginBottom: 12 }}>
                        {autoPartScenes.map((s, localIdx) => {
                          const label = partCellLabel(localIdx);
                          const globalIdx = autoPartIndex * autoPartSize + localIdx;
                          const selected = frameIdx === globalIdx;
                          return (
                            <button
                              type="button"
                              key={s.id || localIdx}
                              className={`btn btn-sm${selected ? " btn-red" : ""}`}
                              onClick={() => {
                                setFrameIdx(globalIdx);
                                setShowFrameRu(false);
                                setVideoP("");
                                setAnalysis(null);
                                setFinalImg(null);
                                cropGridFrame(gridImg, localIdx, autoPartScenes.length, autoPartCols)
                                  .then(url => setCroppedFrame(url))
                                  .catch(() => setCroppedFrame(null));
                              }}
                            >
                              {label} · {s.id}
                            </button>
                          );
                        })}
                      </div>

                      <div className="brow">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            setGridImg(null);
                            setFrameIdx(null);
                            setCroppedFrame(null);
                            setFinalImg(null);
                            setVideoP("");
                            setAnalysis(null);
                            setShowFrameRu(false);
                          }}
                        >
                          Заменить PART-сетку
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setPreviousPartAnchor(gridImg)}
                        >
                          Использовать как Previous PART
                        </button>
                        {autoPartIndex < autoParts.length - 1 && (
                          <button
                            type="button"
                            className="btn btn-red btn-sm"
                            onClick={nextAutoPart}
                          >
                            → PART {autoPartIndex + 2} prompt
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <UploadZone
                      label={`Загрузи PART-сетку ${autoPartGridLabel}`}
                      hint={`Текущий PART: ${autoPartScenes[0]?.id || "frame_01"}–${autoPartScenes[autoPartScenes.length - 1]?.id || "frame_04"}`}
                      onFile={(url) => {
                        setGridImg(url);
                        setFrameIdx(null);
                        setCroppedFrame(null);
                        setFinalImg(null);
                        setVideoP("");
                        setAnalysis(null);
                        setShowFrameRu(false);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* C — FRAME IMAGE PROMPT + CROP */}
              <div className={`pipe-step${curFrame ? " on" : ""}`}>
                <div className="pipe-head">
                  <div className={`pipe-dot${croppedFrame ? " done" : curFrame ? " act" : ""}`}>C</div>
                  <div>
                    <div className="pipe-title">FRAME · IMAGE PROMPT + кроп</div>
                    <div className="pipe-sub">Здесь берёшь image prompt выбранного кадра и скачиваешь кроп для апскейла.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  {!curFrame ? (
                    <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                      Выбери {autoPartCellLabels.join("/") || "кадр"} на PART-сетке выше — здесь появится окно FRAME с image prompt.
                    </div>
                  ) : (
                    <div className="two-col">
                      <div className="col">
                        <OutBox
                          label={`FRAME IMAGE PROMPT — ${curFrame.id}`}
                          text={curFrame.image_prompt_en || curFrame.description_en || ""}
                          empty="У выбранного кадра нет image_prompt_en"
                          compact
                        />
                        <div className="frame-card" style={{ marginTop: 12 }}>
                          <div className="frame-card-title">{curFrame.id}</div>
                          <div className="frame-card-meta">PART {autoPartIndex + 1} · {curFrame.start ?? "?"}–{curFrame.end ?? "?"}s · {curFrame.beat_type || "frame"}</div>
                          <button className="mini-toggle" onClick={() => setShowFrameRu(v => !v)}>
                            Описание RU {showFrameRu ? "▲" : "▼"}
                          </button>
                          {showFrameRu && (
                            <div className="frame-card-row">
                              <div className="frame-card-lbl">Описание</div>
                              <div className="frame-card-val">{curFrame.description_ru || curFrame.vo_ru || "—"}</div>
                            </div>
                          )}
                          {curFrame.sfx && (
                            <div className="frame-card-row">
                              <div className="frame-card-lbl">SFX</div>
                              <div className="frame-card-val">{curFrame.sfx}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col">
                        {croppedFrame ? (
                          <>
                            <div className="field-label" style={{ marginBottom: 6 }}>Кроп из PART-сетки — {curFrame.id}</div>
                            <div className="img-viewer" style={{ marginBottom: 8 }}><img src={croppedFrame} alt={curFrame.id} /></div>
                            <div className="brow">
                              <button
                                type="button"
                                className="btn btn-red btn-full"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = croppedFrame;
                                  a.download = `${curFrame.id}_crop.jpg`;
                                  a.click();
                                }}
                              >
                                ⬇ Скачать кадр
                              </button>
                              <button type="button" className="btn btn-sm" onClick={() => { setFinalImg(croppedFrame); setVideoP(""); setAnalysis(null); }}>
                                Использовать кроп как 2K/final
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            Кроп появится после выбора {autoPartCellLabels.join("/") || "кадра"}.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* D — FINAL 2K + VIDEO PROMPT */}
              <div className={`pipe-step${curFrame ? " on" : ""}`}>
                <div className="pipe-head">
                  <div className={`pipe-dot${videoP ? " done" : finalImg ? " act" : ""}`}>D</div>
                  <div>
                    <div className="pipe-title">Загрузи финальный 2K кадр → VIDEO PROMPT</div>
                    <div className="pipe-sub">Video prompt появляется только после нажатия кнопки VIDEO PROMPT.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  {!curFrame ? (
                    <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                      Сначала выбери кадр {autoPartCellLabels.join("/") || "из PART-сетки"}.
                    </div>
                  ) : (
                    <div className="two-col">
                      <div className="col">
                        {finalImg ? (
                          <>
                            <div className="img-viewer"><img src={finalImg} alt="Final 2K frame" /></div>
                            <div className="frame-card" style={{ marginTop: 10, marginBottom: 10 }}>
                              <div className="frame-card-lbl" style={{ marginBottom: 8 }}>🎬 VIDEO PROMPT ENGINE V2.8</div>
                              <div className="field-label">PROMPT MODE</div>
                              <div className="brow" style={{ marginTop: 6, marginBottom: 10 }}>
                                <button className={`btn btn-sm ${videoPromptMode === "cheap" ? "btn-red" : ""}`} onClick={() => { setVideoPromptMode("cheap"); setVideoP(""); }}>Cheap</button>
                                <button className={`btn btn-sm ${videoPromptMode === "pro" ? "btn-red" : ""}`} onClick={() => { setVideoPromptMode("pro"); setVideoP(""); }}>Pro</button>
                              </div>
                              <div className="field-label">CONSISTENCY</div>
                              <div className="brow" style={{ marginTop: 6 }}>
                                <button className={`btn btn-sm ${videoConsistency === "normal" ? "btn-red" : ""}`} onClick={() => { setVideoConsistency("normal"); setVideoP(""); }}>Normal</button>
                                <button className={`btn btn-sm ${videoConsistency === "ultra" ? "btn-red" : ""}`} onClick={() => { setVideoConsistency("ultra"); setVideoP(""); }}>Ultra</button>
                              </div>
                              <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
                                Cheap — короткий I2V-lock для Grok/Flow. Pro — подробный кинематографичный prompt. Ultra фиксирует лицо/одежду/свет без копирования композиции.
                              </div>
                            </div>
                            <div className="brow" style={{ marginTop: 10 }}>
                              <button className="btn btn-sm" onClick={() => { setFinalImg(null); setVideoP(""); setAnalysis(null); }}>Заменить final</button>
                              <button className="btn btn-red" onClick={doVideoPrompt} disabled={vidBusy}>
                                {vidBusy ? "⏳ Генерация..." : "▶ VIDEO PROMPT"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <UploadZone label="Загрузи финальный 2K кадр" hint="Итоговое изображение для анимации. Можно сначала скачать кроп и апскейлить." onFile={(url) => { setFinalImg(url); setVideoP(""); setAnalysis(null); }} />
                        )}
                      </div>
                      <div className="col">
                        {videoP ? (
                          <OutBox label={`VIDEO PROMPT — ${curFrame.id}`} text={videoP} />
                        ) : (
                          <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            {finalImg ? "Нажми «VIDEO PROMPT» — промт появится здесь." : "Загрузи финальный 2K кадр, затем нажми VIDEO PROMPT."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── 04 PRODUCTION PACK V30 ──────────────────────── */}
      <section id="pack" className="studio-pack-anchor">
        {isSignedIn && (script.trim() || storyboard) ? (
          <ProductionPack
            topic={topic}
            script={script}
            genre={projectType}
            storyboard={storyboard}
            lang={uiLang}
            devMode={effectiveDevMode}
            isSignedIn={isSignedIn}
            liveAllowed={liveAllowed}
            userId={account?.session?.user?.id || "guest"}
            accessToken={account?.session?.access_token || ""}
            onCacheChange={() => setProductionCacheTick(v => v + 1)}
          />
        ) : (
          <div className="step-section studio-step-card">
            <div className="step-header">
              <div className="step-num">04</div>
              <div className="step-info">
                <div className="step-title">Production Pack</div>
                <div className="step-desc">Cover Director, Social PNG, Music/SEO и Visual Explainer появятся после сценария или storyboard.</div>
              </div>
            </div>
          </div>
        )}
      </section>

          <div className="floating-dock-v33" aria-label="Studio quick actions">
            <button onClick={exportProjectSnapshot}>💾 {uiLang === "en" ? "Save" : "Сохранить"}</button>
            <button onClick={() => snapshotInputRef.current?.click()}>⬆ {uiLang === "en" ? "Load" : "Загрузить"}</button>
            {storyboard && <button onClick={exportFlow}>⬇ Flow</button>}
            {storyboard && <button onClick={exportJson}>JSON</button>}
          </div>
        </main>
      </div>
        </>
      ) : (
        <section className="auth-required-v46 studio-locked-workspace-v52">
          <div className="auth-required-kicker-v46">Workspace locked</div>
          <h2>Рабочая зона заблокирована</h2>
          <p>Storyboard, ручной JSON, Production Pack, экспорт, импорт и локальные черновики доступны только после входа через Google.</p>
          <p><b>DEMO</b> также работает только после входа: гость не может вводить тему, писать JSON или запускать генерацию.</p>
        </section>
      )}
    </div>
  );
}
