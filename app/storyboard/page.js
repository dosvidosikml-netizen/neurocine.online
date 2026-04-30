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
  buildAutoVideoPack, buildAutoChainJson
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
function cropGridFrame(dataUrl, frameIndex, totalFrames, cols) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const rows = Math.ceil(totalFrames / cols);
      const cellW = Math.floor(img.width / cols);
      const cellH = Math.floor(img.height / rows);
      const col = frameIndex % cols;
      const row = Math.floor(frameIndex / cols);
      const cv = document.createElement("canvas");
      cv.width = cellW; cv.height = cellH;
      cv.getContext("2d").drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
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
  const [validation, setValidation] = useState(null);

  /* STEP 3 — Pipeline */
  const [gridImg, setGridImg]           = useState(null);
  const [gridColsOverride, setGridColsOverride] = useState(null);
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
  const [autoHeroAnchor, setAutoHeroAnchor] = useState(null);
  const [autoPrevPartAnchor, setAutoPrevPartAnchor] = useState(null);
  const [autoPartPrompt, setAutoPartPrompt] = useState("");
  const [autoVideoPack, setAutoVideoPack] = useState("");

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
  const autoAllPrompts = useMemo(() => buildAutoChainAllParts({ storyboard, styleProfile, partSize: autoPartSize, chainMode: autoChainMode, strictLevel: autoStrictLevel, referenceMode: autoReferenceMode }), [storyboard, styleProfile, autoPartSize, autoChainMode, autoStrictLevel, autoReferenceMode]);

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
      aspectRatio, tone, script, storyboard, jsonIn, sbMode, validation,
      frameIdx, exploreP, selVariant, p2k, videoP, analysis
    });
  }, [hydrated, projectName, topic, projectType, stylePreset, duration, aspectRatio,
      tone, script, storyboard, jsonIn, sbMode, validation, frameIdx, exploreP, selVariant, p2k, videoP, analysis]);

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
  async function doScript() {
    if (!topic.trim()) return;
    setSBusy(true); setSStat("gen");
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, duration })
      });
      const d = await r.json();
      setScript(d.text || d.error || "");
      setSStat(d.text ? "ok" : "err");
    } catch { setSStat("err"); }
    finally { setSBusy(false); }
  }

  async function doStoryboard() {
    let src = script;
    if (jsonIn.trim()) {
      try { const p = JSON.parse(jsonIn); src = p.script || p.text || script; } catch {}
    }
    if (!src.trim()) return;
    setSbBusy(true); setSbStat("gen"); setValidation(null);
    try {
      const r = await fetch("/api/storyboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: src, duration,
          aspect_ratio: aspectRatio,
          style: stylePreset,
          project_name: projectName,
          mode: sbMode
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
        setSbStat(`ok|${sb.scenes?.length || 0} кадров · ${d.mode}${valInfo}`);
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
        body: JSON.stringify({ frame: curFrame, analysis: d1.analysis, storyboard, styleProfile, projectType, stylePreset })
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
      referenceMode: autoReferenceMode
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
    setAutoPartPrompt(prompt + anchorNote);
    setAutoVideoPack(video);
  }

  function nextAutoPart() {
    if (!autoParts.length) return;
    const next = Math.min(autoPartIndex + 1, autoParts.length - 1);
    setAutoPartIndex(next);
    setAutoPartPrompt("");
    setAutoVideoPack("");
  }

  function exportAutoChainJson() {
    const obj = buildAutoChainJson({ storyboard, styleProfile, partSize: autoPartSize, chainMode: autoChainMode, strictLevel: autoStrictLevel, referenceMode: autoReferenceMode });
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
    setScript(""); setSB(null); setTopic(""); setProjectName("NeuroCine Project");
    setGridImg(null); setFrameIdx(null); setGridColsOverride(null);
    setCroppedFrame(null); setExploreP(""); setVariantImg(null);
    setSelVariant(null); setCropped(null); setP2k(""); setFinalImg(null);
    setVideoP(""); setAnalysis(null); setSStat(""); setSbStat(""); setJsonIn("");
    setValidation(null); setSbMode("safe");
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
                <textarea className="inp tall" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Например: Ты бы не выжил в Средневековье — вот почему" />
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
              <button className="btn btn-red btn-full" onClick={doScript} disabled={sBusy || !topic.trim()}>
                {sBusy ? "⏳ Генерация..." : "▶ СОЗДАТЬ СЦЕНАРИЙ"}
              </button>
              {sStat && (
                <div className={`status-line${sStat === "ok" ? " ok" : sStat === "err" ? " err" : ""}`}>
                  {sStat === "ok" ? "✓ Сценарий готов" : sStat === "err" ? "✗ Ошибка генерации" : "⏳ Генерация..."}
                </div>
              )}
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
                <label className="field-label">Вставить JSON вручную (необязательно)</label>
                <textarea className="inp mono" style={{ minHeight: 90 }} value={jsonIn}
                  onChange={e => setJsonIn(e.target.value)}
                  placeholder='{"script": "..."} — или оставь пустым' />
              </div>
              <button className="btn btn-red" onClick={doStoryboard}
                disabled={sbBusy || (!script.trim() && !jsonIn.trim())}>
                {sbBusy ? "⏳ Генерация..." : "▶ СГЕНЕРИРОВАТЬ STORYBOARD"}
              </button>
              {sbStat && (() => {
                const [type, msg] = sbStat.includes("|") ? sbStat.split("|") : ["", sbStat];
                return (
                  <div className={`status-line${type === "ok" ? " ok" : type === "err" ? " err" : ""}`}>
                    {type === "ok" ? `✓ Готово · ${msg}` : type === "err" ? `✗ ${msg}` : "⏳ Генерация..."}
                  </div>
                );
              })()}

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
              {storyGridPrompt || chunkGridPrompt ? (
                <>
                  {/* Chunk controls — only when storyboard has scenes */}
                  {scenes.length > 0 && (
                    <div className="out-box">
                      <div className="out-head">
                        <span className="out-label">Режим сетки</span>
                        <div className="brow">
                          {[4, 5, 6].filter(s => s < scenes.length).map(s => (
                            <button key={s}
                              className={`btn btn-xs${chunkSize === s ? " btn-red" : ""}`}
                              onClick={() => { setChunkSize(s); setActiveChunk(0); }}
                            >по {s} (2×2{s === 6 ? "/3×2" : ""})</button>
                          ))}
                          <button
                            className={`btn btn-xs${chunkSize >= scenes.length ? " btn-red" : ""}`}
                            onClick={() => { setChunkSize(scenes.length); setActiveChunk(0); }}
                          >Всё ({scenes.length})</button>
                        </div>
                      </div>
                      {chunkSize < scenes.length && (
                        <div className="out-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
                          <div className="brow">
                            {chunks.map((ch, i) => (
                              <button key={i}
                                className={`btn btn-xs${activeChunk === i ? " btn-red" : ""}`}
                                onClick={() => setActiveChunk(i)}
                              >
                                Лист {i + 1} · {ch[0]?.id}–{ch[ch.length - 1]?.id}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                            Лист {activeChunk + 1} из {chunks.length} · {activeChunkScenes.length} кадров
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid prompt for active chunk or full */}
                  <OutBox
                    label={chunkSize < scenes.length
                      ? `Story Grid Prompt — Лист ${activeChunk + 1}/${chunks.length} (EN)`
                      : "Story Grid Prompt EN (Flux / Midjourney)"}
                    text={chunkSize < scenes.length ? chunkGridPrompt : storyGridPrompt}
                  />

                  {/* CHAIN CONTINUATION block */}
                  {chunkSize < scenes.length && activeChunk > 0 && (
                    <div className="out-box">
                      <div
                        className="out-head"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowCont(v => !v)}
                      >
                        <span className="out-label">🔗 Chain Continuation — Лист {activeChunk + 1}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{showCont ? "▲ скрыть" : "▼ показать"}</span>
                      </div>
                      {showCont && (
                        <div className="out-body">
                          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                            Загрузи последний лист сетки (Лист {activeChunk}) как anchor — система сгенерирует промт продолжения с привязкой к твоим кадрам.
                          </div>
                          {contAnchorGrid ? (
                            <div>
                              <div className="img-viewer" style={{ marginBottom: 8 }}>
                                <img src={contAnchorGrid} alt="Anchor grid" />
                              </div>
                              <div className="brow" style={{ marginBottom: 10 }}>
                                <button className="btn btn-sm" onClick={() => { setContAnchorGrid(null); setContPrompt(""); }}>
                                  Заменить
                                </button>
                                <button className="btn btn-sm btn-red" onClick={() => {
                                  const anchors = (chunks[activeChunk - 1] || []).slice(-2).map(s => ({ scene: s }));
                                  const p = buildContinuationPrompt(anchors, activeChunkScenes, storyboard, styleProfile, activeChunk);
                                  setContPrompt(p);
                                }}>
                                  ▶ СОЗДАТЬ CONTINUATION PROMPT
                                </button>
                              </div>
                              {contPrompt && (
                                <OutBox label={`Continuation Prompt — Лист ${activeChunk + 1} (EN)`} text={contPrompt} />
                              )}
                            </div>
                          ) : (
                            <UploadZone
                              label={`Загрузи Лист ${activeChunk} (anchor)`}
                              hint="Последний сгенерированный лист сетки"
                              onFile={setContAnchorGrid}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Russian descriptions — collapsible */}
                  <div className="out-box">
                    <div className="out-head" style={{ cursor: "pointer" }} onClick={() => setShowRu(v => !v)}>
                      <span className="out-label">Описания кадров на русском</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{showRu ? "▲ скрыть" : "▼ показать"}</span>
                    </div>
                    {showRu && (
                      <div className="out-body">
                        <pre className="out-pre compact" style={{ color: "var(--muted)", fontSize: 12 }}>{storyGridRu}</pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="upload-zone" style={{ pointerEvents: "none", cursor: "default" }}>
                  <div className="upload-icon">🎬</div>
                  <div className="upload-text">Story Grid Prompt</div>
                  <div className="upload-hint">Промт для генерации сетки всех кадров</div>
                </div>
              )}
            </div>
          </div>

          {scenes.length > 0 && <>
            <hr className="divider" />
            <div className="out-box">
              <div className="out-head">
                <span className="out-label">Все кадры ({scenes.length}) — нажми для выбора</span>
              </div>
              <div className="out-body" style={{ padding: 0 }}>
                <div className="sb-wrap">
                  <table className="sb-t">
                    <thead>
                      <tr>{["Кадр", "Тайм", "Beat", "Energy", "VO", "SFX"].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {scenes.map((s, i) => {
                        const energy = String(s.cut_energy || "").toLowerCase();
                        const eColor = energy === "high" ? "#f87171" : energy === "low" ? "#60a5fa" : "#a78bfa";
                        return (
                          <tr key={s.id} onClick={() => selectFrame(i)}
                            style={{ outline: frameIdx === i ? "2px solid rgba(229,53,53,0.5)" : "none" }}>
                            <td style={{ color: "#fca5a5", fontWeight: 800 }}>{s.id}</td>
                            <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{s.start}–{s.end ?? "?"}s</td>
                            <td style={{ color: "var(--muted)" }}>{s.beat_type}</td>
                            <td>
                              {energy && (
                                <span style={{
                                  fontSize: 9, fontWeight: 900, padding: "2px 6px",
                                  borderRadius: 100, color: eColor,
                                  border: `1px solid ${eColor}33`,
                                  background: `${eColor}18`,
                                  textTransform: "uppercase", letterSpacing: "0.08em"
                                }}>{energy}</span>
                              )}
                            </td>
                            <td style={{ maxWidth: 240 }}>{String(s.vo_ru || "").slice(0, 70)}</td>
                            <td style={{ color: "var(--muted)" }}>{String(s.sfx || "").slice(0, 45)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>}
        </div>
      </section>


      {/* ══ STEP 02B — AUTO-CHAIN STRICT ENGINE ══ */}
      {storyboard && scenes.length > 0 && (
        <section className="step-section">
          <div className="step-header">
            <div className="step-num">02B</div>
            <div className="step-info">
              <div className="step-title">Auto-Chain Strict Engine · Вариант 2.2</div>
              <div className="step-desc">Новый режим рядом со старым: берёт сценарий из 01/02, но держит старый live-action стиль и строит PART-промты строго по кадрам без выдумывания</div>
            </div>
            <span className="step-badge">V2 · {autoParts.length} PART</span>
          </div>
          <div className="step-body">
            <div className="two-col lw">
              <div className="col">
                <div className="frame-card">
                  <div className="frame-card-lbl" style={{ marginBottom: 8 }}>⚙️ Режим V2</div>
                  <div className="frow frow2">
                    <div className="field">
                      <label className="field-label">Логика</label>
                      <select className="inp" value={autoChainMode} onChange={e => { setAutoChainMode(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); }}>
                        <option value="worldHero">World + Hero — мир + главный герой</option>
                        <option value="worldOnly">World Only — разные персонажи, один мир</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label">Строгость</label>
                      <select className="inp" value={autoStrictLevel} onChange={e => { setAutoStrictLevel(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); }}>
                        <option value="hard">Hard — строго по сценарию</option>
                        <option value="maximum">Maximum — буквально, без украшений</option>
                        <option value="soft">Soft — чуть больше кинематографа</option>
                      </select>
                    </div>
                  </div>
                  <div className="frow frow2">
                    <div className="field">
                      <label className="field-label">Reference mode</label>
                      <select className="inp" value={autoReferenceMode} onChange={e => { setAutoReferenceMode(e.target.value); setAutoPartPrompt(""); setAutoVideoPack(""); }}>
                        <option value="heroAndPrevious">Hero anchor + previous PART</option>
                        <option value="previousPart">Previous PART only</option>
                        <option value="heroOnly">Hero anchor only</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label">Кадров в PART</label>
                      <select className="inp" value={autoPartSize} onChange={e => { setAutoPartSize(Number(e.target.value)); setAutoPartIndex(0); setAutoPartPrompt(""); setAutoVideoPack(""); }}>
                        <option value={4}>4 кадра · 2×2</option>
                        <option value={6}>6 кадров · 2×3</option>
                        <option value={8}>8 кадров · 2×4</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Вариант 2 ничего не удаляет и не заменяет. Он использует уже созданный storyboard как источник правды: кадр = только то, что написано в сценарии/scene JSON.
                  </div>
                </div>

                <div className="frame-card" style={{ marginTop: 10 }}>
                  <div className="frame-card-lbl" style={{ marginBottom: 8 }}>🧬 Anchors</div>
                  <div className="two-col">
                    <div className="col">
                      {autoHeroAnchor ? (
                        <>
                          <div className="img-viewer"><img src={autoHeroAnchor} alt="Hero anchor" /></div>
                          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setAutoHeroAnchor(null)}>Заменить</button>
                        </>
                      ) : (
                        <UploadZone label="Hero anchor" hint="Reference card героя" onFile={setAutoHeroAnchor} />
                      )}
                    </div>
                    <div className="col">
                      {autoPrevPartAnchor ? (
                        <>
                          <div className="img-viewer"><img src={autoPrevPartAnchor} alt="Previous PART" /></div>
                          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setAutoPrevPartAnchor(null)}>Заменить</button>
                        </>
                      ) : (
                        <UploadZone label="Previous PART" hint="Для Part 2+ загрузи предыдущую сетку" onFile={setAutoPrevPartAnchor} />
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                    После генерации промта — прикрепи эти изображения в Flow / Midjourney вручную.
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="field">
                  <label className="field-label">PART</label>
                  <div className="chunk-tabs">
                    {autoParts.map((part, i) => (
                      <button key={i}
                        className={`chunk-tab${autoPartIndex === i ? " active" : ""}`}
                        onClick={() => { setAutoPartIndex(i); setAutoPartPrompt(""); setAutoVideoPack(""); }}>
                        PART {i + 1} · {part[0]?.id}–{part[part.length - 1]?.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="brow" style={{ marginBottom: 10 }}>
                  <button className="btn btn-red" onClick={generateAutoChainPart}>▶ СОЗДАТЬ PART PROMPT</button>
                  <button className="btn" onClick={nextAutoPart} disabled={autoPartIndex >= autoParts.length - 1}>NEXT PART →</button>
                </div>

                <div className="brow" style={{ marginBottom: 10 }}>
                  <button className="btn btn-sm" onClick={exportAutoChainTxt}>⬇ Все PART .txt</button>
                  <button className="btn btn-sm" onClick={exportAutoChainJson}>⬇ V2 .json</button>
                </div>

                <div className="frame-card" style={{ marginBottom: 10 }}>
                  <div className="frame-card-lbl" style={{ marginBottom: 8 }}>Кадры в выбранном PART</div>
                  {autoPartScenes.map((s, i) => (
                    <div key={s.id || i} className="frame-card-row">
                      <div className="frame-card-lbl">{s.id || `F${i + 1}`}</div>
                      <div className="frame-card-val" style={{ color: "var(--muted)", fontSize: 12 }}>
                        {(s.description_ru || s.vo_ru || s.image_prompt_en || "").slice(0, 160)}
                      </div>
                    </div>
                  ))}
                </div>

                {autoPartPrompt ? (
                  <>
                    <OutBox label={`AUTO-CHAIN IMAGE PROMPT — PART ${autoPartIndex + 1}`} text={autoPartPrompt} />
                    <OutBox label={`VIDEO PACK — PART ${autoPartIndex + 1}`} text={autoVideoPack} />
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                    Выбери PART и нажми «Создать PART Prompt». Старый pipeline ниже остаётся без изменений.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ STEP 03 — PRODUCTION PIPELINE ══ */}
      <section className="step-section">
        <div className="step-header">
          <div className="step-num">03</div>
          <div className="step-info">
            <div className="step-title">Production Pipeline</div>
            <div className="step-desc">Загрузи сетку → кадр → 4 варианта → 2K prompt → video prompt</div>
          </div>
          {curFrame && <span className="step-badge">{curFrame.id}</span>}
        </div>
        <div className="step-body">

          {/* A: storyboard grid + frame select */}
          <div className={`pipe-step${gridImg && curFrame ? "" : " on"}`}>
            <div className="pipe-head">
              <div className={`pipe-dot${curFrame ? " done" : " act"}`}>A</div>
              <div>
                <div className="pipe-title">Загрузи storyboard сетку · Выбери кадр</div>
                <div className="pipe-sub">Нажми прямо на кадр в сетке или выбери кнопкой ниже</div>
              </div>
            </div>
            <div className="pipe-body">
              <div className="two-col">
                <div className="col">
                  {gridImg ? (
                    <>
                      {/* Columns selector — user tells us how many cols the image actually has */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                          Колонок в сетке:
                        </span>
                        {[2, 3, 4].map(c => {
                          const active = (gridColsOverride ?? gridCols(scenes.length)) === c;
                          const isAuto = gridColsOverride === null && gridCols(scenes.length) === c;
                          return (
                            <button key={c}
                              className={`btn btn-xs${active ? " btn-red" : ""}`}
                              onClick={() => setGridColsOverride(isAuto ? null : c)}
                            >
                              {c}{isAuto ? " (авто)" : ""}
                            </button>
                          );
                        })}
                      </div>

                      {/* Clickable grid overlay */}
                      {scenes.length > 0 ? (() => {
                        const cols = gridColsOverride ?? gridCols(scenes.length);
                        const rows = Math.ceil(scenes.length / cols);
                        return (
                          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                            <img src={gridImg} alt="Storyboard grid" style={{ width: "100%", display: "block" }} />
                            <div style={{
                              position: "absolute", inset: 0,
                              display: "grid",
                              gridTemplateColumns: `repeat(${cols}, 1fr)`,
                              gridTemplateRows: `repeat(${rows}, 1fr)`
                            }}>
                              {scenes.map((s, i) => (
                                <div key={s.id}
                                  onClick={() => selectFrame(i)}
                                  title={`${s.id} — нажми для выбора`}
                                  style={{
                                    cursor: "pointer",
                                    border: frameIdx === i
                                      ? "2px solid var(--red)"
                                      : "1px solid rgba(255,255,255,0.08)",
                                    background: frameIdx === i
                                      ? "rgba(229,53,53,0.15)"
                                      : "transparent",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "flex-start",
                                    padding: 4,
                                    transition: "all 0.1s",
                                    boxSizing: "border-box"
                                  }}
                                  onMouseEnter={e => { if (frameIdx !== i) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                                  onMouseLeave={e => { if (frameIdx !== i) e.currentTarget.style.background = "transparent"; }}
                                >
                                  <span style={{
                                    fontSize: 9, fontWeight: 900,
                                    background: frameIdx === i ? "var(--red)" : "rgba(0,0,0,0.7)",
                                    color: "#fff", borderRadius: 4,
                                    padding: "2px 5px", lineHeight: 1.3,
                                    pointerEvents: "none", flexShrink: 0
                                  }}>
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="img-viewer"><img src={gridImg} alt="Storyboard grid" /></div>
                      )}
                      <button className="btn btn-sm" style={{ marginTop: 8 }}
                        onClick={() => { setGridImg(null); setFrameIdx(null); setGridColsOverride(null); }}>Заменить</button>
                    </>
                  ) : (
                    <UploadZone label="Загрузи storyboard сетку" hint="Сетка кадров всего сценария" onFile={setGridImg} />
                  )}
                </div>
                <div className="col">
                  {scenes.length > 0 ? (
                    <>
                      <div className="field">
                        <label className="field-label">Выбери кадр</label>
                        <div className="frame-btns">
                          {scenes.map((s, i) => (
                            <button key={s.id} className={`fb${frameIdx === i ? " active" : ""}`}
                              onClick={() => selectFrame(i)}>{s.id}</button>
                          ))}
                        </div>
                      </div>
                      {curFrame && (
                        <div className="frame-card">
                          <div className="frame-card-id">{curFrame.id}</div>
                          <div className="frame-card-meta">
                            {curFrame.start}–{curFrame.end ?? "?"}s · {curFrame.beat_type}
                            {curFrame.emotion ? ` · ${curFrame.emotion}` : ""}
                          </div>

                          {/* EN description (visible) */}
                          {curFrame.image_prompt_en && (
                            <div className="frame-card-row">
                              <div className="frame-card-lbl">Visual (EN)</div>
                              <div className="frame-card-val" style={{ fontSize: 12, color: "var(--muted)" }}>
                                {curFrame.image_prompt_en.replace(/^SCENE PRIMARY FOCUS:\s*/i, "").slice(0, 180)}
                              </div>
                            </div>
                          )}

                          {/* RU description — collapsible */}
                          {curFrame.description_ru && (
                            <div className="frame-card-row">
                              <div
                                className="frame-card-lbl"
                                style={{ cursor: "pointer", userSelect: "none" }}
                                onClick={() => setShowFrameRu(v => !v)}
                              >
                                Описание RU {showFrameRu ? "▲" : "▼"}
                              </div>
                              {showFrameRu && (
                                <div className="frame-card-val" style={{ color: "var(--muted)", fontSize: 12 }}>
                                  {curFrame.description_ru}
                                </div>
                              )}
                            </div>
                          )}

                          {/* VO — always RU */}
                          {curFrame.vo_ru && (
                            <div className="frame-card-row">
                              <div className="frame-card-lbl">VO</div>
                              <div className="frame-card-val">{curFrame.vo_ru}</div>
                            </div>
                          )}

                          {/* SFX — EN */}
                          {curFrame.sfx && (
                            <div className="frame-card-row">
                              <div className="frame-card-lbl">SFX</div>
                              <div className="frame-card-val" style={{ color: "var(--muted)" }}>{curFrame.sfx}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "var(--muted)", fontSize: 13, padding: 16, textAlign: "center" }}>
                      Создай storyboard в шаге 02
                    </div>
                  )}

                  {/* Cropped frame preview + download */}
                  {croppedFrame && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>
                        Кадр {curFrame?.id} — кроп
                      </div>
                      <div className="img-viewer" style={{ marginBottom: 8 }}>
                        <img src={croppedFrame} alt={`Cropped ${curFrame?.id}`} />
                      </div>
                      <button
                        className="btn btn-sm btn-red btn-full"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = croppedFrame;
                          a.download = `${curFrame?.id || "frame"}_crop.jpg`;
                          a.click();
                        }}
                      >
                        ⬇ Скачать для апскейла
                      </button>
                    </div>
                  )}

                  {/* Character Lock display */}
                  {storyboard?.character_lock?.length > 0 && (
                    <div className="frame-card" style={{ marginTop: 8 }}>
                      <div className="frame-card-lbl" style={{ marginBottom: 8 }}>🎭 Character Lock</div>
                      {storyboard.character_lock.map((c, i) => (
                        <div key={i} className="frame-card-row">
                          <div className="frame-card-lbl">{c.name || `P${i + 1}`}</div>
                          <div className="frame-card-val" style={{ fontSize: 12, color: "var(--muted)" }}>
                            {[c.age, c.clothing, c.hair, c.face_features, c.physical_condition]
                              .filter(Boolean).join(" · ").slice(0, 160)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* B: explore prompts */}
          {curFrame && (
            <div className={`pipe-step${exploreP ? "" : " on"}`}>
              <div className="pipe-head">
                <div className={`pipe-dot${exploreP ? " done" : " act"}`}>B</div>
                <div>
                  <div className="pipe-title">4 варианта ракурсов — {curFrame.id}</div>
                  <div className="pipe-sub">A extreme close-up · B low angle · C wide · D over-shoulder</div>
                </div>
              </div>
              <div className="pipe-body">
                <div className="col">
                  <button className="btn btn-red" onClick={doExplore} disabled={expBusy}>
                    {expBusy ? "⏳ Генерация..." : "▶ СОЗДАТЬ ПРОМТ 4 ВАРИАНТОВ (2×2)"}
                  </button>
                  {exploreP && <OutBox label="Explore Prompt — Flux / Midjourney / DALL-E" text={exploreP} />}
                </div>
              </div>
            </div>
          )}

          {/* C: upload 4-variant + select */}
          {curFrame && (
            <div className={`pipe-step${croppedVariant ? "" : variantImg ? " on" : ""}`}>
              <div className="pipe-head">
                <div className={`pipe-dot${croppedVariant ? " done" : variantImg ? " act" : ""}`}>C</div>
                <div>
                  <div className="pipe-title">Загрузи сетку 4 вариантов · Выбери лучший</div>
                  <div className="pipe-sub">Нажми A / B / C / D — система выкадрирует и построит точный 2K промт</div>
                </div>
              </div>
              <div className="pipe-body">
                <div className="two-col">

                  {/* left: full grid + overlay */}
                  <div className="col">
                    {variantImg ? (
                      <>
                        <div className="variant-wrap">
                          <img src={variantImg} alt="4 variants" />
                          <div className="variant-overlay">
                            {["A","B","C","D"].map(v => (
                              <div key={v}
                                className={`variant-cell${selVariant === v ? " sel" : ""}`}
                                onClick={() => handleSelectVariant(v)}>
                                <div className="variant-badge">{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="brow" style={{ marginTop: 8 }}>
                          <button className="btn btn-sm" onClick={() => { setVariantImg(null); setSelVariant(null); setCropped(null); setP2k(""); }}>
                            Заменить
                          </button>
                          {p2kBusy && <span style={{ fontSize: 12, color: "var(--muted)" }}>⏳ Анализ варианта...</span>}
                          {selVariant && !p2kBusy && <span style={{ fontSize: 12, color: "var(--muted)" }}>Выбран: <strong style={{ color: "#fff" }}>{selVariant}</strong></span>}
                        </div>
                      </>
                    ) : (
                      <UploadZone label="Загрузи сетку 4 вариантов" hint="2×2 из Midjourney / Flux" onFile={setVariantImg} />
                    )}
                  </div>

                  {/* right: cropped variant + 2K prompt */}
                  <div className="col">
                    {croppedVariant && (
                      <div>
                        <div className="field-label" style={{ marginBottom: 6 }}>Выбранный вариант {selVariant}</div>
                        <div className="img-viewer"><img src={croppedVariant} alt={`Variant ${selVariant}`} /></div>
                      </div>
                    )}
                    {p2kBusy ? (
                      <div style={{ color: "var(--muted)", fontSize: 13, padding: 16 }}>⏳ Анализирую кадр, строю 2K промт...</div>
                    ) : p2k ? (
                      <OutBox label={`2K IMAGE PROMPT — вариант ${selVariant}`} text={p2k} />
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                        {variantImg ? "Нажми на вариант A / B / C / D" : "Загрузи сетку 4 вариантов слева"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* D: final 2K + video prompt */}
          {curFrame && (
            <div className={`pipe-step${videoP ? "" : finalImg ? " on" : ""}`}>
              <div className="pipe-head">
                <div className={`pipe-dot${videoP ? " done" : finalImg ? " act" : ""}`}>D</div>
                <div>
                  <div className="pipe-title">Загрузи финальный 2K кадр → Video Prompt</div>
                  <div className="pipe-sub">Анализ изображения + видео промт для анимации</div>
                </div>
              </div>
              <div className="pipe-body">
                <div className="two-col">
                  <div className="col">
                    {finalImg ? (
                      <>
                        <div className="img-viewer"><img src={finalImg} alt="Final 2K frame" /></div>
                        <div className="brow" style={{ marginTop: 10 }}>
                          <button className="btn btn-sm" onClick={() => { setFinalImg(null); setVideoP(""); setAnalysis(null); }}>Заменить</button>
                          <button className="btn btn-red" onClick={doVideoPrompt} disabled={vidBusy}>
                            {vidBusy ? "⏳ Анализ..." : "▶ VIDEO PROMPT"}
                          </button>
                        </div>
                        {analysis && (
                          <div className="frame-card" style={{ marginTop: 10 }}>
                            <div className="frame-card-lbl" style={{ marginBottom: 8 }}>Анализ кадра</div>
                            {[["Camera", analysis.camera],["Lighting", analysis.lighting],
                              ["Emotion", analysis.emotion],["SFX", analysis.sfx]]
                              .filter(([,v]) => v).map(([k, v]) => (
                              <div key={k} className="frame-card-row">
                                <div className="frame-card-lbl">{k}</div>
                                <div className="frame-card-val" style={{ color: "var(--muted)" }}>{String(v).slice(0, 100)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <UploadZone label="Загрузи финальный 2K кадр" hint="Итоговое изображение для анимации" onFile={setFinalImg} />
                    )}
                  </div>
                  <div className="col">
                    {videoP ? (
                      <>
                        <OutBox label={`VIDEO PROMPT — ${curFrame.id}`} text={videoP} />
                        {analysis?.sfx && <OutBox label="SFX" text={analysis.sfx} compact />}
                      </>
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                        {finalImg ? "Нажми «VIDEO PROMPT»" : "Загрузи финальный 2K кадр"}
                      </div>
                    )}
                  </div>
                </div>

                {videoP && scenes.length > 1 && (
                  <>
                    <hr className="divider" />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        ✓ Кадр {(frameIdx ?? 0) + 1} из {scenes.length} завершён
                      </div>
                      <button className="btn btn-red" onClick={nextFrame}>
                        СЛЕДУЮЩИЙ КАДР → {scenes[(((frameIdx ?? 0) + 1) % scenes.length)]?.id}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!scenes.length && (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)", fontSize: 14 }}>
              Создай storyboard в шаге 02 — пайплайн откроется здесь
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
