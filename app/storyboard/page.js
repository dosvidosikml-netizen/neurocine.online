"use client";

import { useMemo, useState } from "react";
import TopNav from "../../components/TopNav";
import StoryboardTable from "../../components/StoryboardTable";
import FrameList from "../../components/FrameList";
import FrameInspector from "../../components/FrameInspector";
import CopyBlock from "../../components/CopyBlock";
import { buildLocalStoryboard, normalizeStoryboard, storyboardToProjectJson } from "../../engine/sceneEngine";
import {
  PROJECT_TYPES,
  STYLE_PRESETS,
  build2KPrompt,
  buildScenarioLock,
  buildStoryGridPrompt,
  getStyleProfile
} from "../../engine/directorEngine_v4";
import { downloadTextFile, safeFileName } from "../../lib/download";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function shortText(value = "", max = 120) {
  const t = String(value || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

function CopyBox({ title, text, onClear }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  }
  return (
    <div className="director-output">
      <div className="director-output-head">
        <strong>{title}</strong>
        <div className="row compact">
          <button className={`mini-btn ${copied ? "ok" : ""}`} onClick={copy} disabled={!text}>{copied ? "Скопировано" : "Копировать"}</button>
          <button className="mini-btn" onClick={onClear} disabled={!text}>Удалить</button>
        </div>
      </div>
      <pre>{text || "Пока пусто"}</pre>
    </div>
  );
}

export default function StoryboardPage() {
  const [projectName, setProjectName] = useState("NeuroCine Project");
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(60);
  const [style, setStyle] = useState("cinematic");
  const [projectType, setProjectType] = useState("film");
  const [stylePreset, setStylePreset] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [storyboard, setStoryboard] = useState(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [tab, setTab] = useState("script");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Готово");
  const [working, setWorking] = useState("");

  const [storyGridPrompt, setStoryGridPrompt] = useState("");
  const [explorePrompt, setExplorePrompt] = useState("");
  const [gridImage, setGridImage] = useState(null);
  const [lockedImage, setLockedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState("A");
  const [lockedPrompt, setLockedPrompt] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisText, setAnalysisText] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");

  const scenes = storyboard?.scenes || [];
  const currentFrame = scenes[activeFrame];

  const styleProfile = useMemo(() => getStyleProfile(projectType, stylePreset || style), [projectType, stylePreset, style]);

  const scenarioLock = useMemo(() => {
    if (!storyboard) return null;
    return buildScenarioLock(storyboard, script, styleProfile);
  }, [storyboard, script, styleProfile]);

  const projectJson = useMemo(() => {
    if (!storyboard) return null;
    return storyboardToProjectJson(storyboard, { script, director: { styleProfile, scenarioLock } });
  }, [storyboard, script, styleProfile, scenarioLock]);

  async function makeVideo() {
    setBusy(true);
    setStatus("Создаю storyboard через OpenRouter...");
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          duration,
          style: stylePreset || style,
          project_type: projectType,
          style_profile: styleProfile,
          aspect_ratio: aspectRatio,
          project_name: projectName
        })
      });

      const data = await res.json();
      const normalized = normalizeStoryboard(data.storyboard || data, {
        script,
        duration,
        style: stylePreset || style,
        aspectRatio,
        projectName
      });

      setStoryboard(normalized);
      setActiveFrame(0);
      setTab("director");
      setStatus(`Готово: ${normalized.scenes.length} кадров`);
      setStoryGridPrompt(buildStoryGridPrompt(normalized, styleProfile));
    } catch (e) {
      const fallback = buildLocalStoryboard({ script, duration, style: stylePreset || style, aspectRatio, projectName });
      setStoryboard(fallback);
      setActiveFrame(0);
      setTab("director");
      setStatus("API не ответил — создан локальный fallback storyboard");
      setStoryGridPrompt(buildStoryGridPrompt(fallback, styleProfile));
    } finally {
      setBusy(false);
    }
  }

  function exportProject() {
    const data = projectJson || storyboardToProjectJson(buildLocalStoryboard({ script, duration, style: stylePreset || style, aspectRatio, projectName }), { script });
    downloadTextFile(JSON.stringify(data, null, 2), `${safeFileName(projectName)}.json`, "application/json;charset=utf-8");
  }

  function exportTxt() {
    const text = scenes.map((s) => [
      `[${s.id}] ${s.start}-${s.end}s`,
      `IMAGE: ${s.image_prompt_en}`,
      `VIDEO: ${s.video_prompt_en}`,
      `VO: ${s.vo_ru}`,
      `SFX: ${s.sfx}`
    ].join("\n")).join("\n\n---\n\n");
    const directorText = [
      "=== STORY GRID PROMPT ===",
      storyGridPrompt,
      "\n=== EXPLORE PROMPT ===",
      explorePrompt,
      "\n=== LOCKED 2K PROMPT ===",
      lockedPrompt,
      "\n=== ANALYSIS ===",
      analysisText,
      "\n=== VIDEO PROMPT ===",
      videoPrompt
    ].join("\n");
    downloadTextFile(`${text}\n\n${directorText}`, `${safeFileName(projectName)}_prompts.txt`);
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const sb = data.storyboard || data;
        const normalized = normalizeStoryboard(sb, { script: data.script || "", duration, style: stylePreset || style, aspectRatio, projectName: data.name || projectName });
        setProjectName(data.name || normalized.project_name || "Imported Project");
        setScript(data.script || "");
        setStoryboard(normalized);
        setActiveFrame(0);
        setTab("director");
        setStatus("JSON импортирован");
        setStoryGridPrompt(buildStoryGridPrompt(normalized, styleProfile));
      } catch (e) {
        setStatus("Ошибка импорта JSON");
      }
    };
    reader.readAsText(file);
  }

  function selectFrame(index) {
    setActiveFrame(index);
    setExplorePrompt("");
    setGridImage(null);
    setLockedImage(null);
    setLockedPrompt("");
    setAnalysis(null);
    setAnalysisText("");
    setVideoPrompt("");
  }

  async function generateStoryGridPrompt() {
    if (!storyboard) return setStatus("Сначала создай storyboard");
    setStoryGridPrompt(buildStoryGridPrompt(storyboard, styleProfile));
    setStatus("Prompt для общей storyboard grid готов");
  }

  async function exploreFrame() {
    if (!currentFrame) return setStatus("Сначала выбери кадр");
    setWorking("explore");
    setStatus(`Создаю prompt 2x2 для ${currentFrame.id}...`);
    try {
      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: currentFrame, storyboard, styleProfile, variantCount: 4 })
      });
      const data = await res.json();
      setExplorePrompt(data.prompt || "");
      setStatus(data.notes_ru || "Explore prompt готов");
    } catch (e) {
      setStatus("Ошибка Explore API");
    } finally {
      setWorking("");
    }
  }

  async function uploadGrid(file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setGridImage({ dataUrl, fileName: file.name });
    setStatus("Сетка вариантов загружена. Выбери A/B/C/D.");
  }

  async function uploadLocked(file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setLockedImage({ dataUrl, fileName: file.name });
    setStatus("Финальный 2K кадр загружен. Можно анализировать.");
  }

  function lockVariant() {
    if (!currentFrame) return setStatus("Сначала выбери кадр");
    const prompt = build2KPrompt(currentFrame, selectedVariant, storyboard, styleProfile);
    setLockedPrompt(prompt);
    setStatus(`Variant ${selectedVariant} зафиксирован. 2K prompt готов.`);
  }

  async function analyzeImage() {
    if (!currentFrame) return setStatus("Сначала выбери кадр");
    if (!lockedImage?.dataUrl && !gridImage?.dataUrl) return setStatus("Загрузи сетку или финальный кадр для анализа");
    setWorking("analyze");
    setStatus("Сканирую изображение через Vision...");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame: currentFrame,
          variant: selectedVariant,
          imageDataUrl: lockedImage?.dataUrl || gridImage?.dataUrl,
          styleProfile
        })
      });
      const data = await res.json();
      setAnalysis(data.analysis || null);
      setAnalysisText(JSON.stringify(data.analysis || {}, null, 2));
      setStatus("Анализ готов. Теперь можно создать video prompt.");
    } catch (e) {
      setStatus("Ошибка анализа изображения");
    } finally {
      setWorking("");
    }
  }

  async function generateVideoPrompt() {
    if (!currentFrame) return setStatus("Сначала выбери кадр");
    setWorking("video");
    setStatus("Создаю video prompt строго по locked frame...");
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: currentFrame, analysis: analysis || {}, storyboard, styleProfile })
      });
      const data = await res.json();
      setVideoPrompt(data.video_prompt_en || "");
      setStatus(data.notes_ru || "Video prompt готов");
    } catch (e) {
      setStatus("Ошибка Video API");
    } finally {
      setWorking("");
    }
  }

  const tabs = [
    ["script", "Сценарий"],
    ["director", "Director Mode"],
    ["storyboard", "Storyboard"],
    ["frames", "Кадры"],
    ["json", "JSON"],
    ["tts", "TTS"]
  ];

  return (
    <main className="page">
      <div className="wrap">
        <header className="header studio-header">
          <div className="brand">
            <div>
              <div className="kicker">NeuroCine Director Studio</div>
              <h1>Production Pipeline</h1>
              <p className="subtitle">Сценарий → стиль → lock → story grid → explore → frame lock → video prompt → export</p>
            </div>
            <div className="actions">
              <label className="btn">
                Импорт .json
                <input type="file" accept=".json,application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
              </label>
              <button className="btn" onClick={exportProject}>Экспорт JSON</button>
              <button className="btn" onClick={exportTxt}>Экспорт TXT</button>
              <button className="btn red" onClick={makeVideo} disabled={busy || !script.trim()}>
                {busy ? "ГЕНЕРИРУЮ..." : "СДЕЛАТЬ ВИДЕО"}
              </button>
            </div>
          </div>

          <TopNav active="storyboard" />

          <div className="nav">
            {tabs.map(([id, label]) => (
              <button key={id} className={`btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="status"><span className={working || busy ? "status-dot pulse" : "status-dot"}></span>Статус: {status}</div>
        </header>

        {tab === "script" && (
          <section className="grid two mt">
            <div className="card">
              <div className="section-head">
                <h2>1. Сценарий</h2>
                <div className="row compact">
                  <button className="mini-btn" onClick={() => navigator.clipboard.writeText(script)} disabled={!script}>Копировать</button>
                  <button className="mini-btn" onClick={() => setScript("")} disabled={!script}>Удалить</button>
                </div>
              </div>
              <textarea
                className="big"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Вставь сценарий целиком. Сначала выбери тип проекта и стиль, потом нажми СДЕЛАТЬ ВИДЕО."
              />
              <div className="grid two mt">
                <div>
                  <label className="label">Название проекта</label>
                  <input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Длительность</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                    <option value={30}>30 сек</option>
                    <option value={60}>60 сек</option>
                    <option value={90}>90 сек</option>
                    <option value={120}>2 минуты</option>
                    <option value={180}>3 минуты</option>
                    <option value={600}>10 минут</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>2. Стиль и Lock</h2>
              <label className="label">Тип проекта</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {Object.entries(PROJECT_TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>

              <div className="mt">
                <label className="label">Стиль</label>
                <select value={stylePreset} onChange={(e) => { setStylePreset(e.target.value); setStyle(e.target.value); }}>
                  {Object.entries(STYLE_PRESETS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
              </div>

              <div className="mt">
                <label className="label">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                  <option value="9:16">9:16 Shorts / Reels / TikTok</option>
                  <option value="16:9">16:9 YouTube</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>

              <div className="mt drop lock-box">
                <strong>Style Lock:</strong>
                <p>{styleProfile.style_lock}</p>
                <div className="row mt">
                  <span className="pill">Scenario Lock</span>
                  <span className="pill">Character Lock</span>
                  <span className="pill">No subtitles</span>
                  <span className="pill">No UI</span>
                  <span className="pill">No watermark</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "director" && (
          <section className="director-layout mt">
            <aside className="card director-rail">
              <div className="section-head">
                <h2>Story Grid</h2>
                <button className="mini-btn" onClick={generateStoryGridPrompt} disabled={!storyboard}>Prompt</button>
              </div>
              {!scenes.length ? <div className="drop">Сначала создай storyboard или импортируй JSON.</div> : (
                <div className="director-frames">
                  {scenes.map((s, i) => (
                    <button key={s.id || i} className={`director-frame ${activeFrame === i ? "active" : ""}`} onClick={() => selectFrame(i)}>
                      <span>{s.id || `frame_${i + 1}`}</span>
                      <small>{shortText(s.description_ru || s.vo_ru, 86)}</small>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="card frame-studio">
              <div className="section-head">
                <div>
                  <h2>{currentFrame ? `${currentFrame.id} — Frame Studio` : "Frame Studio"}</h2>
                  <p className="muted">Ручной контроль кадра: explore → загрузка сетки → выбор варианта → 2K prompt → анализ → video prompt.</p>
                </div>
                <div className="row compact">
                  <button className="mini-btn" onClick={() => setActiveFrame(Math.max(0, activeFrame - 1))} disabled={!scenes.length || activeFrame === 0}>Назад</button>
                  <button className="mini-btn" onClick={() => setActiveFrame(Math.min(scenes.length - 1, activeFrame + 1))} disabled={!scenes.length || activeFrame >= scenes.length - 1}>Дальше</button>
                </div>
              </div>

              {!currentFrame ? <div className="drop">Кадр не выбран.</div> : (
                <>
                  <div className="locked-frame-card">
                    <div>
                      <div className="label">Сюжет кадра</div>
                      <strong>{currentFrame.description_ru}</strong>
                      <p className="muted">VO: {currentFrame.vo_ru}</p>
                      <p className="muted">SFX: {currentFrame.sfx}</p>
                    </div>
                    <div className="lock-tags">
                      <span>STYLE LOCK</span>
                      <span>SCENARIO LOCK</span>
                      <span>CHARACTER LOCK</span>
                    </div>
                  </div>

                  <div className="director-actions-grid">
                    <button className={`director-action ${working === "explore" ? "loading" : ""}`} onClick={exploreFrame} disabled={working === "explore"}>1. Получить сетку 2x2</button>
                    <label className="director-action upload">2. Загрузить сетку
                      <input type="file" accept="image/*" hidden onChange={(e) => uploadGrid(e.target.files?.[0])} />
                    </label>
                    <button className="director-action" onClick={lockVariant}>3. Lock вариант → 2K prompt</button>
                    <label className="director-action upload">4. Загрузить финальный кадр
                      <input type="file" accept="image/*" hidden onChange={(e) => uploadLocked(e.target.files?.[0])} />
                    </label>
                    <button className={`director-action ${working === "analyze" ? "loading" : ""}`} onClick={analyzeImage} disabled={working === "analyze"}>5. Скан кадра</button>
                    <button className={`director-action primary ${working === "video" ? "loading" : ""}`} onClick={generateVideoPrompt} disabled={working === "video"}>6. Video prompt</button>
                  </div>

                  <div className="variant-row">
                    <span>Выбранный вариант:</span>
                    {["A", "B", "C", "D"].map((v) => (
                      <button key={v} className={`variant-btn ${selectedVariant === v ? "active" : ""}`} onClick={() => setSelectedVariant(v)}>{v}</button>
                    ))}
                  </div>

                  <div className="preview-grid">
                    <div className="preview-card">
                      <div className="label">Загруженная сетка вариантов</div>
                      {gridImage ? <img src={gridImage.dataUrl} alt="variation grid" /> : <div className="drop">Загрузи картинку 2x2 из Nano Banana / Flow.</div>}
                    </div>
                    <div className="preview-card">
                      <div className="label">Финальный locked frame</div>
                      {lockedImage ? <img src={lockedImage.dataUrl} alt="locked frame" /> : <div className="drop">После 2K генерации загрузи финальный кадр сюда.</div>}
                    </div>
                  </div>

                  <CopyBox title="Prompt для сетки 2x2" text={explorePrompt} onClear={() => setExplorePrompt("")} />
                  <CopyBox title="2K image prompt для выбранного варианта" text={lockedPrompt} onClear={() => setLockedPrompt("")} />
                  <CopyBox title="Анализ изображения / Visual DNA" text={analysisText} onClear={() => { setAnalysis(null); setAnalysisText(""); }} />
                  <CopyBox title="Video prompt для анимации" text={videoPrompt} onClear={() => setVideoPrompt("")} />
                </>
              )}
            </section>
          </section>
        )}

        {tab === "storyboard" && (
          <section className="card mt">
            <h2>Storyboard Grid</h2>
            <StoryboardTable scenes={scenes} onSelect={(i) => { selectFrame(i); setTab("director"); }} />
          </section>
        )}

        {tab === "frames" && (
          <section className="grid side mt">
            <aside className="card">
              <h2>Кадры</h2>
              <FrameList scenes={scenes} active={activeFrame} onSelect={selectFrame} />
            </aside>
            <div className="card">
              <FrameInspector
                frame={currentFrame}
                onPrev={() => setActiveFrame(Math.max(0, activeFrame - 1))}
                onNext={() => setActiveFrame(Math.min(scenes.length - 1, activeFrame + 1))}
              />
            </div>
          </section>
        )}

        {tab === "json" && (
          <section className="card mt">
            <h2>Project JSON</h2>
            {projectJson ? <CopyBlock title="Полный JSON проекта" text={JSON.stringify(projectJson, null, 2)} /> : <div className="drop">Пока нет JSON. Нажми «СДЕЛАТЬ ВИДЕО».</div>}
          </section>
        )}

        {tab === "tts" && (
          <section className="card mt">
            <h2>TTS Studio</h2>
            <div className="grid two">
              <CopyBlock title="VO Script" text={scenes.map((s) => s.vo_ru).join("\n")} />
              <CopyBlock title="TTS настройки" text={`Voice: Russian cinematic documentary narrator\nPace: medium-fast\nEmotion: dark, tense, controlled\nAudio: clean voice, no hum, no background noise\nSync: ${duration}s target`} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
