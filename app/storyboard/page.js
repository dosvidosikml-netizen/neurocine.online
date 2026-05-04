"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
import { downloadTextFile, safeFileName } from "../../lib/download";

/* ─── autosave keys ─── */
const KEY_TEXT  = "nc_text_v3";
const KEY_IMGS  = "nc_imgs_v3";

/* ─── grid cols helper ─── */
function gridCols(n) { return n <= 8 ? 2 : 3; }

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
  return (
    <div className="out-box">
      <div className="out-head">
        <span className="out-label">{label}</span>
        <CopyBtn text={text} />
      </div>
      <div className="out-body">
        {text
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

  const [hydrated, setHydrated]         = useState(false);
  const [showRu, setShowRu]             = useState(false);
  const [showFrameRu, setShowFrameRu]   = useState(false);

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
  const autoPartScenes = autoParts[autoPartIndex] || [];
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

  const autoAllPrompts = useMemo(() => buildAutoChainAllParts({ storyboard, styleProfile, partSize: autoPartSize, chainMode: autoChainMode, strictLevel: autoStrictLevel, referenceMode: autoReferenceMode, appearanceMode: autoAppearanceMode }), [storyboard, styleProfile, autoPartSize, autoChainMode, autoStrictLevel, autoReferenceMode, autoAppearanceMode]);

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

  const scriptJson = script
    ? JSON.stringify({ project_name: projectName, script, topic, duration, aspect_ratio: aspectRatio, style: stylePreset, project_type: projectType, tone }, null, 2)
    : "";

  /* ── AUTOSAVE LOAD ── */
  useEffect(() => {
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
      if (text.analysis)    setAnalysis(text.analysis);
    }

    if (imgs) {
      if (imgs.gridImg)    setGridImg(imgs.gridImg);
      if (imgs.variantImg) setVariantImg(imgs.variantImg);
      if (imgs.croppedVariant) setCropped(imgs.croppedVariant);
      if (imgs.finalImg)   setFinalImg(imgs.finalImg);
    }

    setHydrated(true);
  }, []);

  /* ── AUTOSAVE WRITE (text) ── */
  useEffect(() => {
    if (!hydrated) return;
    tryLsSave(KEY_TEXT, {
      projectName, topic, projectType, stylePreset, duration,
      aspectRatio, tone, script, storyboard, jsonIn, sbMode, target, validation,
      frameIdx, exploreP, selVariant, p2k, videoP, analysis
    });
  }, [hydrated, projectName, topic, projectType, stylePreset, duration, aspectRatio,
      tone, script, storyboard, jsonIn, sbMode, target, validation, frameIdx, exploreP, selVariant, p2k, videoP, analysis]);

  /* ── AUTOSAVE WRITE (images — separate key, с защитой от quota) ── */
  useEffect(() => {
    if (!hydrated) return;
    // limit: skip images > 2MB to avoid localStorage quota
    const maxSize = 2_000_000;
    const safe = (v) => (v && v.length <= maxSize ? v : null);
    tryLsSave(KEY_IMGS, {
      gridImg: safe(gridImg),
      variantImg: safe(variantImg),
      croppedVariant: safe(croppedVariant),
      finalImg: safe(finalImg)
    });
  }, [hydrated, gridImg, variantImg, croppedVariant, finalImg]);

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
    if (!keepAnchors) { setAutoHeroAnchor(null); setAutoPrevPartAnchor(null); }
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
    // Готовый сценарий — пропускаем генерацию
    if (script.trim() && !topic.trim()) { setSStat("ok"); return; }
    if (!topic.trim()) return;
    resetStoryboardOutputs({ keepAnchors: true });
    setJsonIn("");
    setSBusy(true); setSStat("gen");
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, duration })
      });
      const d = await r.json();
      if (d.apiError || (!d.text && d.error)) {
        setSStat("err|" + (d.error || "Ошибка API"));
      } else {
        setScript(d.text || "");
        setSStat(d.text ? "ok" : "err|Пустой ответ от модели");
      }
    } catch (e) { setSStat("err|" + (e.message || "Сетевая ошибка")); }
    finally { setSBusy(false); }
  }

  async function doStoryboard() {
    let src = script.trim();
    // New script always wins. Manual JSON is used only when script is empty.
    if (!src && jsonIn.trim()) {
      try { const p = JSON.parse(jsonIn); src = String(p.script || p.text || "").trim(); } catch {}
    }
    if (!src.trim()) return;
    setAutoPartIndex(0); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText("");
    setGridImg(null); setFrameIdx(null); setCroppedFrame(null);
    setSbBusy(true); setSbStat("gen"); setValidation(null);
    try {
      const r = await fetch("/api/storyboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: src, duration,
          aspect_ratio: aspectRatio,
          style: stylePreset,
          project_name: projectName,
          mode: sbMode,
          target
        })
      });
      const d = await r.json();
      if (d.storyboard) {
        // inject aspect_ratio from request into storyboard
        const sb = { ...d.storyboard, aspect_ratio: aspectRatio };
        setSB(sb);
        setValidation(d.validation || null);
        const valInfo = d.validation
          ? (d.validation.ok ? " · ✓ valid" : ` · ⚠ ${d.validation.errors?.length} issues`)
          : "";
        const modeLabel = String(d.mode || "");
        const fallbackWarn = modeLabel.includes("fallback") ? " · ⚠ FALLBACK: API не списал баланс" : "";
        setSbStat(`ok|${sb.scenes?.length || 0} кадров · ${modeLabel}${fallbackWarn}${valInfo}`);
      } else {
        setSbStat("err|" + (d.error || "unknown"));
      }
    } catch (e) { setSbStat("err|" + e.message); }
    finally { setSbBusy(false); }
  }

  async function doExplore() {
    if (!curFrame) return;
    setExpBusy(true); setExploreP("");
    try {
      // Build locally from engine — richer CHARACTER LOCK + full EN image_prompt_en
      const localPrompt = buildExplorePrompt(curFrame, storyboard, styleProfile);
      // Also try API for enhanced version
      const r = await fetch("/api/explore", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: curFrame, storyboard, styleProfile, projectType, stylePreset })
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
    if (!variantImg || !curFrame) return;
    setSelVariant(variant);
    setCropped(null);
    setP2k("");
    setP2kBusy(true);

    try {
      // 1. Crop the selected quadrant from the 2×2 grid
      const cropped = await cropQuadrant(variantImg, variant);
      setCropped(cropped);

      // 2. Analyze the cropped image to get real visual description
      const rA = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
  }, [variantImg, curFrame, storyboard, styleProfile, projectType, stylePreset]);

  async function doVideoPrompt() {
    if (!curFrame || !finalImg) return;
    setVidBusy(true); setVideoP(""); setAnalysis(null);
    try {
      const r1 = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: curFrame, variant: selVariant || "A", imageDataUrl: finalImg, styleProfile, projectType, stylePreset })
      });
      const d1 = await r1.json();
      setAnalysis(d1.analysis);

      const r2 = await fetch("/api/video", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: curFrame, analysis: d1.analysis, storyboard, styleProfile, projectType, stylePreset, target })
      });
      const d2 = await r2.json();
      setVideoP(d2.video_prompt_en || "");
    } catch (e) { setVideoP("Ошибка: " + e.message); }
    finally { setVidBusy(false); }
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

    const video = buildAutoVideoPack({ storyboard, styleProfile, partScenes: autoPartScenes, chainMode: autoChainMode });
    setAutoPartPrompt(prompt + charOverrideBlock + anchorNote);
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
    const next = Math.min(autoPartIndex + 1, autoParts.length - 1);
    setAutoPartIndex(next);
    setAutoPartPrompt("");
    setAutoVideoPack("");
  }

  function exportAutoChainJson() {
    const obj = buildAutoChainJson({ storyboard, styleProfile, partSize: autoPartSize, chainMode: autoChainMode, strictLevel: autoStrictLevel, referenceMode: autoReferenceMode, appearanceMode: autoAppearanceMode, includeVo: autoIncludeVo });
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
    setSStat(""); setSbMode("safe");
    resetStoryboardOutputs({ keepAnchors: false });
  }

  /* ── RENDER ── */
  return (
    <div className="studio">

      {/* NAV */}
      <nav className="studio-nav">
        <div className="nav-brand">
          <div className="nav-kicker">NeuroCine Online</div>
          <div className="nav-title">Director Studio</div>
        </div>
        <div className="nav-links">
          <Link href="/" className="nav-btn">Главная</Link>
          <Link href="/chat" className="nav-btn">Chat</Link>
          <Link href="/storyboard" className="nav-btn active">Studio</Link>
          {storyboard && <>
            <button className="nav-btn" onClick={exportJson}>⬇ JSON</button>
            <button className="nav-btn" onClick={exportTxt}>⬇ TXT</button>
            <button className="nav-btn" onClick={exportFlow}>⬇ Flow/VEO</button>
          </>}
          <button className="nav-btn danger" onClick={clearAll}>Очистить</button>
        </div>
      </nav>

      {/* ══ STEP 01 — SCRIPT ══ */}
      <section className="step-section">
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
            <div className="col">
              <div className="field">
                <label className="field-label">Название проекта</label>
                <input className="inp" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="NeuroCine Project" />
              </div>
              <div className="field">
                <label className="field-label">Тема / задание</label>
                <textarea className="inp" style={{ minHeight: 72 }} value={topic} onChange={e => handleTopicChange(e.target.value)}
                  placeholder="Например: Ты бы не выжил в Средневековье — вот почему" />
              </div>

              {/* Блок для готового сценария */}
              <div className="field">
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Готовый сценарий</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)", letterSpacing: "0.05em" }}>
                    — уже есть текст? Вставь сюда → сразу получишь розкадровку
                  </span>
                </label>
                <textarea className="inp" style={{ minHeight: 110 }} value={script} onChange={e => setScript(e.target.value)}
                  placeholder="Вставь готовый текст диктора — AI разобьёт на кадры без генерации сценария..." />
                {script.trim() && !topic.trim() && (
                  <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
                    ✓ Готовый сценарий — нажми «Создать сторибоард» напрямую
                  </div>
                )}
              </div>
              <div className="frow frow2">
                <div className="field">
                  <label className="field-label">Тип проекта</label>
                  <select className="inp" value={projectType} onChange={e => setProjectType(e.target.value)}>
                    {Object.entries(PROJECT_TYPES).map(([k, v]) =>
                      <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Стиль / пресет</label>
                  <select className="inp" value={stylePreset} onChange={e => setStylePreset(e.target.value)}>
                    {Object.entries(STYLE_PRESETS).map(([k, v]) =>
                      <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="frow frow3">
                <div className="field">
                  <label className="field-label">Длительность</label>
                  <select className="inp" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                    <option value={30}>30 сек</option>
                    <option value={60}>60 сек</option>
                    <option value={90}>90 сек</option>
                    <option value={120}>2 мин</option>
                    <option value={180}>3 мин</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Формат</label>
                  <select className="inp" value={aspectRatio} onChange={e => setAspect(e.target.value)}>
                    <option value="9:16">9:16 Shorts</option>
                    <option value="16:9">16:9 YouTube</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:5">4:5 Instagram</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Тон / жанр</label>
                  <input className="inp" value={tone} onChange={e => setTone(e.target.value)} placeholder="thriller, dark..." />
                </div>
              </div>
              <button className="btn btn-red btn-full" onClick={doScript} disabled={sBusy || (!topic.trim() && !script.trim())}>
                {sBusy ? "⏳ Генерация..." : script.trim() && !topic.trim() ? "▶ СОЗДАТЬ СТОРИБОАРД" : "▶ СОЗДАТЬ СЦЕНАРИЙ"}
              </button>
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
                onClick={() => setCharOverrideEnabled(v => !v)}
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
                    onChange={e => setCharFaceLock(e.target.value)}
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
                          onClick={() => setCharModifiers(prev => ({ ...prev, [mod.key]: !prev[mod.key] }))}
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
                        onClick={() => setCharModifiers(prev => ({ ...prev, [mod.key]: !prev[mod.key] }))}
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
                        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setAutoHeroAnchor(null); setAutoPartPrompt(""); setAutoAllPromptText(""); }}>Заменить hero anchor</button>
                      </>
                    ) : (
                      <UploadZone label="Hero anchor" hint="Главный герой / style DNA" onFile={(url) => { setAutoHeroAnchor(url); setAutoPartPrompt(""); setAutoAllPromptText(""); }} />
                    )}
                  </div>
                  <div className="col">
                    {autoPrevPartAnchor ? (
                      <>
                        <div className="img-viewer"><img src={autoPrevPartAnchor} alt="Previous PART" /></div>
                        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { setAutoPrevPartAnchor(null); setAutoPartPrompt(""); setAutoAllPromptText(""); }}>Заменить previous PART</button>
                      </>
                    ) : (
                      <UploadZone label="Previous PART" hint="Для PART 2+ загрузи последнюю готовую сетку" onFile={(url) => { setAutoPrevPartAnchor(url); setAutoPartPrompt(""); setAutoAllPromptText(""); }} />
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
                    <select className="inp" value={autoChainMode} onChange={e => { setAutoChainMode(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}>
                      <option value="worldHero">World + Hero — мир + главный герой</option>
                      <option value="worldOnly">World Only — разные персонажи, один мир</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Строгость</label>
                    <select className="inp" value={autoStrictLevel} onChange={e => { setAutoStrictLevel(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}>
                      <option value="hard">Hard — строго по сценарию</option>
                      <option value="maximum">Maximum — буквально, без украшений</option>
                      <option value="soft">Soft — чуть больше кинематографа</option>
                    </select>
                  </div>
                </div>
                <div className="frow frow2">
                  <div className="field">
                    <label className="field-label">Reference mode</label>
                    <select className="inp" value={autoReferenceMode} onChange={e => { setAutoReferenceMode(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}>
                      <option value="heroAndPrevious">Hero anchor + previous PART</option>
                      <option value="previousPart">Previous PART only</option>
                      <option value="heroOnly">Hero anchor only</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Кадров в PART</label>
                    <select className="inp" value={autoPartSize} onChange={e => { setAutoPartSize(Number(e.target.value)); setAutoPartIndex(0); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}>
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
                      onClick={() => { setAutoAppearanceMode("full"); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}
                    >
                      🧬 Полная
                    </button>
                    <button
                      className={"btn btn-sm" + (autoAppearanceMode === "minimal" ? " btn-red" : "")}
                      onClick={() => { setAutoAppearanceMode("minimal"); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}
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
                      onClick={() => { setAutoIncludeVo(true); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}
                    >
                      ✓ Включить
                    </button>
                    <button
                      className={"btn btn-sm" + (!autoIncludeVo ? " btn-red" : "")}
                      onClick={() => { setAutoIncludeVo(false); setAutoPartPrompt(""); setAutoVideoPack(""); setAutoAllPromptText(""); }}
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
                      Дальше не запускай второй генератор: переходи в блок 03 — там FRAME GRID PROMPT, PART-сетка 2×2, A/B/C/D, кроп и video prompt.
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
      <section className="step-section">
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
                      Дальше работа идёт в блоке 03: FRAME GRID PROMPT → PART-сетка 2×2 → A/B/C/D → video prompt из JSON.
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


      {/* ══ STEP 03 — PRODUCTION PIPELINE · CLEAN PART FLOW ══ */}
      <section className="step-section">
        <div className="step-header">
          <div className="step-num">03</div>
          <div className="step-info">
            <div className="step-title">Production Pipeline</div>
            <div className="step-desc">FRAME GRID PROMPT → PART-сетка 2×2 → A/B/C/D → кроп → video prompt из JSON</div>
          </div>
          {curFrame && <span className="step-badge">{curFrame.id}</span>}
        </div>

        <div className="step-body">
          {!scenes.length ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
              Создай storyboard JSON в шаге 02 — пайплайн откроется здесь.
            </div>
          ) : (
            <>
              {/* PART SELECT + FRAME GRID PROMPT */}
              <div className="pipe-step on">
                <div className="pipe-head">
                  <div className="pipe-dot act">A</div>
                  <div>
                    <div className="pipe-title">Выбери PART · скопируй FRAME GRID PROMPT</div>
                    <div className="pipe-sub">Этот prompt вставляй в Flow / Nano Banana / VEO для генерации PART-сетки 2×2.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  <div className="frame-card" style={{ marginBottom: 14 }}>
                    <div className="frame-card-lbl" style={{ marginBottom: 10 }}>Текущий PART</div>
                    <div className="part-tabs">
                      {autoParts.map((part, i) => {
                        const first = part[0]?.id || `frame_${String(i * autoPartSize + 1).padStart(2, "0")}`;
                        const last = part[part.length - 1]?.id || first;
                        return (
                          <button
                            key={i}
                            className={`part-tab${autoPartIndex === i ? " active" : ""}`}
                            onClick={() => {
                              setAutoPartIndex(i);
                              setFrameIdx(null);
                              setGridImg(null);
                              setCroppedFrame(null);
                              setFinalImg(null);
                              setVideoP("");
                              setAnalysis(null);
                              setShowFrameRu(false);
                            }}
                          >
                            PART {i + 1} · {first}–{last}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
                      Загружай ниже сетку именно для выбранного PART. Кадры A/B/C/D будут соответствовать кадрам этого PART.
                    </div>
                  </div>

                  <OutBox
                    label={`FRAME GRID PROMPT · FLOW COMPACT · PART ${autoPartIndex + 1}`}
                    text={frameGridPrompt}
                    empty="Сначала создай storyboard JSON"
                  />
                </div>
              </div>

              {/* UPLOAD PART GRID + SELECT CELL */}
              <div className={`pipe-step${gridImg ? "" : " on"}`}>
                <div className="pipe-head">
                  <div className={`pipe-dot${gridImg ? " done" : " act"}`}>B</div>
                  <div>
                    <div className="pipe-title">Загрузи PART-сетку 2×2 · выбери кадр</div>
                    <div className="pipe-sub">Нажми A/B/C/D — система выкадрирует выбранный кадр и покажет video prompt из storyboard JSON.</div>
                  </div>
                </div>
                <div className="pipe-body">
                  <div className="two-col">
                    <div className="col">
                      {gridImg ? (
                        <>
                          <div className="grid-wrap">
                            <img src={gridImg} alt="PART grid 2x2" />
                            <div className="grid-overlay" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                              {autoPartScenes.map((s, localIdx) => {
                                const label = ["A", "B", "C", "D"][localIdx] || String(localIdx + 1);
                                const globalIdx = autoPartIndex * autoPartSize + localIdx;
                                const selected = frameIdx === globalIdx;
                                return (
                                  <div
                                    key={s.id || localIdx}
                                    onClick={() => {
                                      setFrameIdx(globalIdx);
                                      setShowFrameRu(false);
                                      setVideoP("");
                                      setAnalysis(null);
                                      setFinalImg(null);
                                      cropGridFrame(gridImg, localIdx, autoPartScenes.length, 2)
                                        .then(url => setCroppedFrame(url))
                                        .catch(() => setCroppedFrame(null));
                                    }}
                                    style={{
                                      outline: selected ? "3px solid rgba(229,53,53,0.95)" : "1px solid rgba(255,255,255,0.08)",
                                      cursor: "pointer",
                                      position: "relative",
                                      minHeight: 80,
                                    }}
                                  >
                                    <span style={{
                                      position: "absolute",
                                      left: 8,
                                      top: 8,
                                      background: selected ? "var(--red)" : "rgba(0,0,0,0.72)",
                                      color: "#fff",
                                      borderRadius: 10,
                                      padding: "4px 8px",
                                      fontSize: 12,
                                      fontWeight: 900,
                                    }}>{label} · {s.id}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="brow" style={{ marginTop: 10 }}>
                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                setGridImg(null);
                                setFrameIdx(null);
                                setCroppedFrame(null);
                                setFinalImg(null);
                                setVideoP("");
                                setAnalysis(null);
                              }}
                            >
                              Заменить сетку
                            </button>
                          </div>
                        </>
                      ) : (
                        <UploadZone
                          label="Загрузи PART-сетку 2×2"
                          hint={`Текущий PART: ${autoPartScenes[0]?.id || "frame_01"}–${autoPartScenes[autoPartScenes.length - 1]?.id || "frame_04"}`}
                          onFile={(url) => {
                            setGridImg(url);
                            setFrameIdx(null);
                            setCroppedFrame(null);
                            setFinalImg(null);
                            setVideoP("");
                            setAnalysis(null);
                          }}
                        />
                      )}
                    </div>

                    <div className="col">
                      <div className="field-label" style={{ marginBottom: 8 }}>Выбери кадр текущего PART</div>
                      <div className="frame-buttons" style={{ marginBottom: 12 }}>
                        {autoPartScenes.map((s, localIdx) => {
                          const globalIdx = autoPartIndex * autoPartSize + localIdx;
                          const label = ["A", "B", "C", "D"][localIdx] || String(localIdx + 1);
                          return (
                            <button
                              key={s.id || localIdx}
                              className={`fb${frameIdx === globalIdx ? " active" : ""}`}
                              onClick={() => {
                                setFrameIdx(globalIdx);
                                setShowFrameRu(false);
                                setVideoP("");
                                setAnalysis(null);
                                setFinalImg(null);
                                if (gridImg) {
                                  cropGridFrame(gridImg, localIdx, autoPartScenes.length, 2)
                                    .then(url => setCroppedFrame(url))
                                    .catch(() => setCroppedFrame(null));
                                }
                              }}
                            >
                              {label} · {s.id}
                            </button>
                          );
                        })}
                      </div>

                      {curFrame ? (
                        <div className="frame-card">
                          <div className="frame-card-title">{curFrame.id}</div>
                          <div className="frame-card-meta">{curFrame.start ?? "?"}–{curFrame.end ?? "?"}s · {curFrame.beat_type || "frame"}</div>
                          <div className="frame-card-row">
                            <div className="frame-card-lbl">VISUAL (EN)</div>
                            <div className="frame-card-val">{String(curFrame.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS:\s*/i, "").slice(0, 420)}</div>
                          </div>
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
                      ) : (
                        <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                          Выбери A/B/C/D после загрузки PART-сетки.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CROP + VIDEO PROMPT FROM JSON */}
              {curFrame && (
                <div className="pipe-step on">
                  <div className="pipe-head">
                    <div className={`pipe-dot${croppedFrame ? " done" : " act"}`}>C</div>
                    <div>
                      <div className="pipe-title">Кроп кадра · скачать или сразу взять VIDEO PROMPT</div>
                      <div className="pipe-sub">Картинка нужна для апскейла/видео. Video prompt берётся из JSON выбранного frame.</div>
                    </div>
                  </div>
                  <div className="pipe-body">
                    <div className="two-col">
                      <div className="col">
                        {croppedFrame ? (
                          <>
                            <div className="field-label" style={{ marginBottom: 6 }}>Кадр {curFrame.id} — кроп из PART-сетки</div>
                            <div className="img-viewer" style={{ marginBottom: 8 }}><img src={croppedFrame} alt={curFrame.id} /></div>
                            <button
                              className="btn btn-red btn-full"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = croppedFrame;
                                a.download = `${curFrame.id}_crop.jpg`;
                                a.click();
                              }}
                            >
                              ⬇ Скачать для апскейла
                            </button>
                          </>
                        ) : (
                          <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            Загрузите PART-сетку 2×2 и выберите A/B/C/D — здесь появится кроп.
                          </div>
                        )}
                      </div>

                      <div className="col">
                        <OutBox
                          label={`VIDEO PROMPT — ${curFrame.id}`}
                          text={[curFrame.video_prompt_en, curFrame.sfx ? `
SFX: ${curFrame.sfx}` : ""].join("")}
                          empty="В storyboard JSON нет video_prompt_en для этого кадра"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
