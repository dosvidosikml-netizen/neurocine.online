"use client";

import { useMemo, useState } from "react";

const STYLE_OPTIONS = [
  { id: "cinematic", label: "Cinematic", tone: "cinematic documentary realism, tense pacing, strong visual continuity" },
  { id: "dark", label: "Dark True Crime", tone: "dark true crime documentary, suspense, restrained horror mood" },
  { id: "war", label: "War Doc", tone: "war documentary realism, handheld camera, physical tension" },
  { id: "historical", label: "Historical", tone: "historical documentary realism, accurate period details, cinematic drama" },
];

const SCENE_PRESETS = ["Авто", "6", "9", "12", "20"];

function buildSceneHint(sceneCount, duration) {
  if (sceneCount === "Авто") {
    if (duration <= 30) return "6–9 сцен";
    if (duration <= 60) return "12–20 сцен";
    if (duration <= 180) return "30–45 сцен";
    return "chunk mode";
  }
  return `${sceneCount} сцен`;
}

export default function QuickStorygridTool({
  topic,
  setTopic,
  setDuration,
  setAspect,
  setStylePreset,
  setTone,
  setProjectType,
  setSbMode,
  setTarget,
  doScript,
  doStoryboard,
  onStatus,
}) {
  const [idea, setIdea] = useState(topic || "");
  const [durationSec, setDurationSec] = useState(60);
  const [aspect, setAspectLocal] = useState("9:16");
  const [sceneCount, setSceneCount] = useState("Авто");
  const [language, setLanguage] = useState("RU");
  const [style, setStyle] = useState("cinematic");
  const [detailed, setDetailed] = useState(true);

  const selectedStyle = useMemo(() => STYLE_OPTIONS.find(s => s.id === style) || STYLE_OPTIONS[0], [style]);
  const sceneHint = useMemo(() => buildSceneHint(sceneCount, durationSec), [sceneCount, durationSec]);

  function applySetup(status = "Quick Storygrid настройки применены") {
    const cleanIdea = idea.trim() || topic || "Новая история NeuroCine";
    setTopic(cleanIdea);
    setDuration(Number(durationSec) || 60);
    setAspect(aspect);
    setStylePreset(style);
    setProjectType("film");
    setTone(`${selectedStyle.tone}. ${detailed ? "Use detailed cinematic prompts for image/video generation." : "Use compact clean prompts without prompt bloat."} Language: ${language}. Scene plan: ${sceneHint}.`);
    setSbMode("safe");
    setTarget("veo3");
    onStatus?.(status);
  }

  function applyAndRunScript() {
    applySetup("Quick Storygrid применён · запускаю сценарий");
    setTimeout(() => doScript?.(), 120);
  }

  function applyAndRunStoryboard() {
    applySetup("Quick Storygrid применён · запускаю storyboard");
    setTimeout(() => doStoryboard?.(), 140);
  }

  return (
    <section className="quick-tool-card quick-storygrid-card">
      <div className="quick-tool-head">
        <div>
          <span className="quick-kicker">QUICK STORYGRID</span>
          <h2>Быстрый Storygrid</h2>
          <p>Идея → настройки → storyboard/prompts. Это лёгкий вход в твой основной NeuroCine pipeline.</p>
        </div>
        <div className="quick-tool-badge">AI Storyboard</div>
      </div>

      <label className="quick-field full">
        <span>Ваша идея видео</span>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Напр. Что если ты проснулся в городе, где все умирают от чумы"
          rows={4}
        />
      </label>

      <div className="quick-grid-2">
        <label className="quick-field">
          <span>Длина видео</span>
          <select value={durationSec} onChange={e => setDurationSec(Number(e.target.value))}>
            <option value={20}>20 секунд</option>
            <option value={30}>30 секунд</option>
            <option value={60}>60 секунд</option>
            <option value={180}>3 минуты</option>
            <option value={600}>10 минут</option>
          </select>
        </label>
        <label className="quick-field">
          <span>Формат</span>
          <select value={aspect} onChange={e => setAspectLocal(e.target.value)}>
            <option value="9:16">Вертикальный · 9:16</option>
            <option value="16:9">Горизонтальный · 16:9</option>
            <option value="1:1">Квадрат · 1:1</option>
          </select>
        </label>
      </div>

      <div className="quick-grid-3">
        <label className="quick-field">
          <span>Сцен</span>
          <select value={sceneCount} onChange={e => setSceneCount(e.target.value)}>
            {SCENE_PRESETS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="quick-field">
          <span>Язык</span>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="RU">RU</option>
            <option value="EN">EN</option>
            <option value="AUTO">Auto</option>
          </select>
        </label>
        <label className="quick-field">
          <span>Стиль</span>
          <select value={style} onChange={e => setStyle(e.target.value)}>
            {STYLE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="quick-style-row" aria-label="style presets">
        {STYLE_OPTIONS.map(s => (
          <button key={s.id} type="button" className={style === s.id ? "active" : ""} onClick={() => setStyle(s.id)}>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <label className="quick-toggle">
        <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} />
        <span>Подробные prompts для Flow / Veo / Kling</span>
      </label>

      <div className="quick-preview-note">
        <strong>План:</strong> {durationSec} сек · {aspect} · {sceneHint} · {selectedStyle.label} · {detailed ? "Detailed" : "Compact"}
      </div>

      <div className="quick-actions">
        <button type="button" className="btn btn-ghost" onClick={() => applySetup()}>Применить настройки</button>
        <button type="button" className="btn" onClick={applyAndRunScript}>Создать сценарий</button>
        <button type="button" className="btn btn-primary" onClick={applyAndRunStoryboard}>Создать storyboard</button>
      </div>
    </section>
  );
}
