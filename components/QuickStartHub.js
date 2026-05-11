"use client";

import { useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────
   QuickStartHub
   Один блок вместо двух разных тулов (Quick Storygrid + Viral Shorts).
   Берёт topic/script/duration/aspect/tone/stylePreset из общего
   state главной Studio. Один режим работы → одна конфигурация.
───────────────────────────────────────────────────────── */

const MODES = [
  {
    id: "cinematic",
    label: "Cinematic",
    tagline: "Кино / документалка / повествование",
    accent: "#7c5cff",
    stylePreset: "cinematic",
    aspect: "9:16",
    duration: 60,
    tone: "cinematic documentary realism, tense pacing, strong visual continuity",
    projectType: "film"
  },
  {
    id: "viral",
    label: "Viral Shorts",
    tagline: "Hook + retention + cover text + SEO",
    accent: "#ff5b6c",
    stylePreset: "neonNoir",
    aspect: "9:16",
    duration: 30,
    tone: "viral short-form, strong hook, high retention, cinematic documentary realism, shock opening",
    projectType: "film"
  },
  {
    id: "darkCrime",
    label: "Dark / True Crime",
    tagline: "Сдержанный horror / forensic",
    accent: "#c84cff",
    stylePreset: "truecrime",
    aspect: "9:16",
    duration: 60,
    tone: "dark true crime documentary, suspense, restrained horror mood, forensic atmosphere",
    projectType: "film"
  },
  {
    id: "anime",
    label: "Anime / Animation",
    tagline: "Анимационный нарратив",
    accent: "#ff5c9e",
    stylePreset: "animeDark",
    aspect: "9:16",
    duration: 60,
    tone: "cinematic anime direction, dramatic composition, controlled lighting, consistent character sheet",
    projectType: "anime"
  },
  {
    id: "neon",
    label: "Neon / Cyberpunk",
    tagline: "Megacity · holograms · rain",
    accent: "#3ee0ff",
    stylePreset: "cyberpunk",
    aspect: "9:16",
    duration: 60,
    tone: "cyberpunk megacity neon noir, holographic billboards, wet reflections, atmospheric haze",
    projectType: "film"
  },
  {
    id: "retro",
    label: "VHS / Retro",
    tagline: "Аналоговое тепло, плёнка, ностальгия",
    accent: "#ff8a5c",
    stylePreset: "vhsRetro",
    aspect: "9:16",
    duration: 30,
    tone: "VHS retro home-video aesthetic, warm tungsten, grain, light leaks, nostalgic mood",
    projectType: "film"
  }
];

const DURATION_OPTIONS = [
  { value: 20, label: "20с" },
  { value: 30, label: "30с" },
  { value: 60, label: "60с" },
  { value: 180, label: "3м" },
  { value: 600, label: "10м" }
];

const ASPECT_OPTIONS = [
  { value: "9:16", label: "9:16 vertical" },
  { value: "16:9", label: "16:9 horizontal" },
  { value: "1:1", label: "1:1 square" }
];

const SCENE_PRESETS = ["Авто", "6", "9", "12", "20"];

const LANGUAGES = [
  { value: "RU", label: "RU" },
  { value: "EN", label: "EN" },
  { value: "AUTO", label: "Auto" }
];

function buildSceneHint(sceneCount, duration) {
  if (sceneCount === "Авто") {
    if (duration <= 30) return "6–9 сцен";
    if (duration <= 60) return "12–20 сцен";
    if (duration <= 180) return "30–45 сцен";
    return "chunk mode";
  }
  return `${sceneCount} сцен`;
}

function buildViralPack({ topic, mode, duration }) {
  const idea = topic?.trim() || "Что если ты оказался в месте, где обычная ошибка стоит жизни";
  const hook = mode.id === "darkCrime"
    ? `Ты не знал, что за этим фактом скрывается настоящая тьма. ${idea}.`
    : mode.id === "viral"
    ? `Ты бы не выжил здесь и десяти минут. ${idea}.`
    : `${idea}.`;
  return [
    `${mode.label.toUpperCase()} PACK — short-form (${duration}s)`,
    `Стиль: ${mode.label}`,
    "",
    "HOOK:",
    hook,
    "",
    "SCRIPT STRUCTURE:",
    "1. Hook 0–3 сек: резкий вопрос или опасность.",
    "2. Контекст 3–12 сек: где мы и почему это важно.",
    "3. Эскалация 12–40 сек: 2–3 факта с визуальным нарастанием.",
    "4. Финальный удар: короткий вывод + вопрос зрителю.",
    "",
    "VISUAL STYLE:",
    mode.tone,
    "",
    "COVER TEXT OPTIONS:",
    "— ТЫ БЫ НЕ ВЫЖИЛ",
    "— ЭТО СКРЫВАЛИ ГОДАМИ",
    "— ОНИ НЕ ВЫХОДИЛИ ЖИВЫМИ",
    "",
    "TTS:",
    "низкий документальный голос, напряжение, медленный темп, драматические паузы",
    "",
    "MUSIC:",
    "dark cinematic drone, low pulse, rising tension, no vocals",
    "",
    "SEO TITLES:",
    `— ${idea} — ты бы выдержал?`,
    `— Самая тёмная история: ${idea}`,
    "",
    "HASHTAGS:",
    "#shorts #история #интересныефакты #neurocine #documentary #reels #tiktok"
  ].join("\n");
}

export default function QuickStartHub({
  topic,
  setTopic,
  setScript,
  setDuration,
  setAspect,
  setStylePreset,
  setTone,
  setProjectType,
  setSbMode,
  setTarget,
  doScript,
  doStoryboard,
  onScrollToPack,
  onScrollToStudio,
  onStatus
}) {
  const [idea, setIdea] = useState(topic || "");
  const [modeId, setModeId] = useState("cinematic");
  const [durationSec, setDurationSec] = useState(60);
  const [aspect, setAspectLocal] = useState("9:16");
  const [sceneCount, setSceneCount] = useState("Авто");
  const [language, setLanguage] = useState("RU");
  const [detailed, setDetailed] = useState(true);
  const [withViralPack, setWithViralPack] = useState(false);
  const [pendingRun, setPendingRun] = useState(null);

  const mode = useMemo(() => MODES.find(m => m.id === modeId) || MODES[0], [modeId]);
  const sceneHint = useMemo(() => buildSceneHint(sceneCount, durationSec), [sceneCount, durationSec]);

  function selectMode(nextId) {
    const next = MODES.find(m => m.id === nextId) || MODES[0];
    setModeId(nextId);
    setDurationSec(next.duration);
    setAspectLocal(next.aspect);
    setWithViralPack(next.id === "viral");
  }

  function applySetup(statusText) {
    const cleanIdea = idea.trim() || topic || "Новая история NeuroCine";
    setTopic(cleanIdea);
    setDuration(Number(durationSec) || 60);
    setAspect(aspect);
    setStylePreset(mode.stylePreset);
    setProjectType(mode.projectType);
    setTone(`${mode.tone}. ${detailed ? "Use detailed cinematic prompts for image/video generation." : "Use compact clean prompts without prompt bloat."} Language: ${language}. Scene plan: ${sceneHint}.`);
    setSbMode("safe");
    setTarget("veo3");
    if (withViralPack) {
      setScript(buildViralPack({ topic: cleanIdea, mode, duration: durationSec }));
    }
    onStatus?.(statusText || `Применён режим: ${mode.label}`);
  }

  useEffect(() => {
    if (!pendingRun) return;
    const action = pendingRun;
    setPendingRun(null);
    window.requestAnimationFrame(() => {
      if (action === "script") doScript?.();
      if (action === "storyboard") doStoryboard?.();
    });
  }, [pendingRun, doScript, doStoryboard]);

  function applyAndRunScript() {
    applySetup(`${mode.label} · запускаю сценарий`);
    setPendingRun("script");
  }

  function applyAndRunStoryboard() {
    applySetup(`${mode.label} · запускаю storyboard`);
    setPendingRun("storyboard");
  }

  function applyAndOpenStudio() {
    applySetup(`${mode.label} применён · открываю Studio`);
    setTimeout(() => onScrollToStudio?.(), 120);
  }

  function applyAndOpenPack() {
    applySetup(`${mode.label} применён · открываю Production Pack`);
    setTimeout(() => onScrollToPack?.(), 120);
  }

  return (
    <section className="qsh-card" style={{ "--qsh-accent": mode.accent }}>
      <div className="qsh-head">
        <div className="qsh-head-info">
          <span className="qsh-kicker">AI VIDEO FACTORY · БЫСТРЫЙ СТАРТ</span>
          <h2>Один блок, один pipeline</h2>
          <p>Выбери режим, опиши идею, и весь конвейер NeuroCine (сценарий → storyboard → grid → production pack) подхватит общие настройки.</p>
        </div>
        <div className="qsh-mode-badge">{mode.label}</div>
      </div>

      <div className="qsh-mode-grid">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            className={"qsh-mode-card" + (modeId === m.id ? " is-active" : "")}
            style={{ "--card-accent": m.accent }}
            onClick={() => selectMode(m.id)}
          >
            <span className="qsh-mode-card-label">{m.label}</span>
            <span className="qsh-mode-card-tag">{m.tagline}</span>
          </button>
        ))}
      </div>

      <label className="qsh-field qsh-field-full">
        <span>Идея видео</span>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Напр. Как выглядело утро римлянина 2000 лет назад"
          rows={3}
        />
      </label>

      <div className="qsh-grid-3">
        <label className="qsh-field">
          <span>Длина</span>
          <select value={durationSec} onChange={e => setDurationSec(Number(e.target.value))}>
            {DURATION_OPTIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="qsh-field">
          <span>Формат</span>
          <select value={aspect} onChange={e => setAspectLocal(e.target.value)}>
            {ASPECT_OPTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>
        <label className="qsh-field">
          <span>Сцен</span>
          <select value={sceneCount} onChange={e => setSceneCount(e.target.value)}>
            {SCENE_PRESETS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>

      <div className="qsh-grid-2">
        <label className="qsh-field">
          <span>Язык</span>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </label>
        <label className="qsh-toggle">
          <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} />
          <span>Подробные prompts для Flow / Veo / Kling</span>
        </label>
      </div>

      <label className="qsh-toggle qsh-toggle-block">
        <input type="checkbox" checked={withViralPack} onChange={e => setWithViralPack(e.target.checked)} />
        <span>Сгенерировать виральный шаблон (hook + cover + SEO) и вставить как сценарий</span>
      </label>

      <div className="qsh-preview">
        <span><b>Режим:</b> {mode.label}</span>
        <span><b>Стиль:</b> {mode.stylePreset}</span>
        <span><b>{durationSec}с · {aspect}</b></span>
        <span><b>Сценарный план:</b> {sceneHint}</span>
      </div>

      <div className="qsh-actions">
        <button type="button" className="qsh-btn qsh-btn-ghost" onClick={() => applySetup()}>
          1. Применить настройки
        </button>
        <button type="button" className="qsh-btn" onClick={applyAndRunScript}>
          2. Создать сценарий
        </button>
        <button type="button" className="qsh-btn qsh-btn-primary" onClick={applyAndRunStoryboard}>
          3. Создать Storyboard
        </button>
        <button type="button" className="qsh-btn qsh-btn-ghost" onClick={applyAndOpenStudio}>
          4. Открыть Studio (Grid)
        </button>
        <button type="button" className="qsh-btn qsh-btn-ghost" onClick={applyAndOpenPack}>
          5. Production Pack
        </button>
      </div>
    </section>
  );
}
