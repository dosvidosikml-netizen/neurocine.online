"use client";

import { useMemo, useState } from "react";
import TopNav from "../../components/TopNav";
import StoryboardTable from "../../components/StoryboardTable";
import FrameList from "../../components/FrameList";
import FrameInspector from "../../components/FrameInspector";
import CopyBlock from "../../components/CopyBlock";
import { buildLocalStoryboard, normalizeStoryboard, storyboardToProjectJson } from "../../engine/sceneEngine";
import { downloadTextFile, safeFileName } from "../../lib/download";

export default function StoryboardPage() {
  const [projectName, setProjectName] = useState("NeuroCine Project");
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(60);
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [storyboard, setStoryboard] = useState(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [tab, setTab] = useState("script");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Готово");

  const scenes = storyboard?.scenes || [];
  const currentFrame = scenes[activeFrame];

  const projectJson = useMemo(() => {
    if (!storyboard) return null;
    return storyboardToProjectJson(storyboard, { script });
  }, [storyboard, script]);

  async function makeVideo() {
    setBusy(true);
    setStatus("Создаю storyboard...");
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration, style, aspect_ratio: aspectRatio, project_name: projectName })
      });

      const data = await res.json();
      const normalized = normalizeStoryboard(data.storyboard || data, {
        script,
        duration,
        style,
        aspectRatio,
        projectName
      });

      setStoryboard(normalized);
      setActiveFrame(0);
      setTab("frames");
      setStatus(`Готово: ${normalized.scenes.length} кадров`);
    } catch (e) {
      const fallback = buildLocalStoryboard({ script, duration, style, aspectRatio, projectName });
      setStoryboard(fallback);
      setActiveFrame(0);
      setTab("frames");
      setStatus("API не ответил — создан локальный fallback storyboard");
    } finally {
      setBusy(false);
    }
  }

  function exportProject() {
    const data = projectJson || storyboardToProjectJson(buildLocalStoryboard({ script, duration, style, aspectRatio, projectName }), { script });
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
    downloadTextFile(text, `${safeFileName(projectName)}_prompts.txt`);
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const sb = data.storyboard || data;
        const normalized = normalizeStoryboard(sb, { script: data.script || "", duration, style, aspectRatio, projectName: data.name || projectName });
        setProjectName(data.name || normalized.project_name || "Imported Project");
        setScript(data.script || "");
        setStoryboard(normalized);
        setActiveFrame(0);
        setTab("frames");
        setStatus("JSON импортирован");
      } catch (e) {
        setStatus("Ошибка импорта JSON");
      }
    };
    reader.readAsText(file);
  }

  const tabs = [
    ["script", "Сценарий"],
    ["storyboard", "Storyboard"],
    ["frames", "Кадры"],
    ["json", "JSON"],
    ["tts", "TTS"]
  ];

  return (
    <main className="page">
      <div className="wrap">
        <header className="header">
          <div className="brand">
            <div>
              <div className="kicker">NeuroCine Storyboard Studio</div>
              <h1>Production Pipeline</h1>
              <p className="subtitle">Сценарий → Storyboard → IMAGE → VIDEO → VO → SFX → JSON</p>
            </div>
            <div className="actions">
              <label className="btn">
                Импорт .json
                <input type="file" accept=".json,application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
              </label>
              <button className="btn" onClick={exportProject}>Экспорт JSON</button>
              <button className="btn" onClick={exportTxt}>Экспорт TXT</button>
              <button className="btn red" onClick={makeVideo} disabled={busy}>
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

          <div className="status">Статус: {status}</div>
        </header>

        {tab === "script" && (
          <section className="grid two mt">
            <div className="card">
              <h2>1. Вставь сценарий</h2>
              <textarea
                className="big"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Вставь сценарий целиком. Потом нажми СДЕЛАТЬ ВИДЕО."
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
              <h2>2. Настройки пайплайна</h2>
              <label className="label">Визуальный стиль</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="cinematic">Cinematic Documentary</option>
                <option value="dark">Dark History Thriller</option>
                <option value="truecrime">True Crime</option>
                <option value="war">War Documentary</option>
              </select>

              <div className="mt">
                <label className="label">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                  <option value="9:16">9:16 Shorts / Reels / TikTok</option>
                  <option value="16:9">16:9 YouTube</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>

              <div className="mt drop">
                <strong>Что генерируется:</strong>
                <div className="mt row">
                  <span className="pill">Storyboard</span>
                  <span className="pill">IMAGE prompts</span>
                  <span className="pill">VIDEO prompts</span>
                  <span className="pill">VO</span>
                  <span className="pill">SFX</span>
                  <span className="pill">JSON</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "storyboard" && (
          <section className="card mt">
            <h2>Storyboard Grid</h2>
            <StoryboardTable scenes={scenes} onSelect={(i) => { setActiveFrame(i); setTab("frames"); }} />
          </section>
        )}

        {tab === "frames" && (
          <section className="grid side mt">
            <aside className="card">
              <h2>Кадры</h2>
              <FrameList scenes={scenes} active={activeFrame} onSelect={setActiveFrame} />
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
            {projectJson ? (
              <CopyBlock title="Полный JSON проекта" text={JSON.stringify(projectJson, null, 2)} />
            ) : (
              <div className="drop">Пока нет JSON. Нажми «СДЕЛАТЬ ВИДЕО».</div>
            )}
          </section>
        )}

        {tab === "tts" && (
          <section className="grid two mt">
            <div className="card">
              <h2>TTS Studio</h2>
              <div className="drop">
                <strong>Рекомендуемые настройки:</strong>
                <pre>{`Voice: Russian cinematic documentary narrator
Pace: medium-fast
Emotion: dark, tense, controlled
Audio: clean voice, no hum, no background noise
Subtitles: off`}</pre>
              </div>
            </div>
            <div className="card">
              <h2>VO Lines</h2>
              <CopyBlock
                title="Текст диктора"
                text={scenes.map((s) => s.vo_ru).filter(Boolean).join("\n")}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
