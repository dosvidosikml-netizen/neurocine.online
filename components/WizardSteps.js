"use client";

import { useState, useMemo } from "react";

/* ─────────────────────────────────────────────────────────
   WizardSteps
   Гибридный аккордеон поверх существующей Studio.
   Карточка показывает заголовок + краткий статус + контент при раскрытии.
   Контент каждой карточки — это якорь-ссылка на соответствующий
   блок основной Studio (которая остаётся ниже как расширенный режим).
   Никакой реальной логики дублирования — это навигационная обёртка.
───────────────────────────────────────────────────────── */

function StatusDot({ state }) {
  if (state === "done") return <span className="wiz-dot wiz-dot-done">✓</span>;
  if (state === "active") return <span className="wiz-dot wiz-dot-active">●</span>;
  return <span className="wiz-dot wiz-dot-idle">○</span>;
}

export default function WizardSteps({
  topic,
  script,
  storyboard,
  curFrame,
  finalImg,
  duration,
  aspectRatio,
  stylePreset,
  stylePresets,
  onJumpTo,
}) {
  const [open, setOpen] = useState("step1");

  const hasIdea = Boolean(topic?.trim());
  const hasScript = Boolean(script?.trim());
  const hasStoryboard = Boolean(storyboard?.scenes?.length);
  const hasFrame = Boolean(curFrame);
  const hasFinalImg = Boolean(finalImg);

  const styleLabel = useMemo(
    () => stylePresets?.[stylePreset]?.label || stylePreset || "—",
    [stylePresets, stylePreset]
  );

  const steps = [
    {
      id: "step1",
      num: "01",
      title: "Идея и настройки",
      state: hasIdea ? "done" : "active",
      summary: hasIdea
        ? `«${(topic || "").slice(0, 40)}${(topic || "").length > 40 ? "…" : ""}» · ${duration}с · ${aspectRatio} · ${styleLabel}`
        : "Опиши идею, выбери длину, формат и стиль",
      anchor: "setup",
      cta: "Перейти к настройкам",
    },
    {
      id: "step2",
      num: "02",
      title: "Сценарий",
      state: hasScript ? "done" : hasIdea ? "active" : "idle",
      summary: hasScript
        ? `Сценарий готов · ${(script || "").trim().split(/\s+/).length} слов`
        : "Сначала зафиксируй идею в первом шаге",
      anchor: "script",
      cta: "К сценарию",
      locked: !hasIdea,
    },
    {
      id: "step3",
      num: "03",
      title: "Storyboard",
      state: hasStoryboard ? "done" : hasScript ? "active" : "idle",
      summary: hasStoryboard
        ? `${storyboard.scenes.length} сцен сгенерировано`
        : "Нужен сценарий — потом раскадровка",
      anchor: "storyboard",
      cta: "К раскадровке",
      locked: !hasScript,
    },
    {
      id: "step4",
      num: "04",
      title: "Grid Prompt · кадры A/B/C/D",
      state: hasFinalImg ? "done" : hasFrame ? "active" : "idle",
      summary: hasFrame
        ? hasFinalImg
          ? `Финальный кадр выбран · video prompt готов`
          : `Активный кадр: ${curFrame?.scene_id || ""} · выбери вариант`
        : "Сначала storyboard, потом выбор кадров",
      anchor: "production",
      cta: "К Grid Prompt",
      locked: !hasStoryboard,
    },
    {
      id: "step5",
      num: "05",
      title: "Production Pack",
      state: hasFinalImg ? "active" : "idle",
      summary: "VO · SFX · обложка · музыка · SEO · хэштеги",
      anchor: "pack",
      cta: "К Production Pack",
      locked: !hasStoryboard,
    },
  ];

  function toggle(stepId) {
    setOpen(prev => (prev === stepId ? null : stepId));
  }

  function jump(anchor) {
    onJumpTo?.(anchor);
  }

  return (
    <section className="wiz-shell">
      <div className="wiz-head">
        <span className="wiz-kicker">WIZARD · 5 ШАГОВ</span>
        <h2>Этапы продакшена</h2>
        <p>Карточки сворачиваются. Тапни любую — раскроется и подскажет, что делать. Под ними — расширенная Studio со всеми деталями.</p>
      </div>

      <ol className="wiz-list">
        {steps.map(step => {
          const isOpen = open === step.id;
          return (
            <li
              key={step.id}
              className={
                "wiz-card" +
                (isOpen ? " is-open" : "") +
                (step.state === "done" ? " is-done" : "") +
                (step.state === "active" ? " is-active" : "") +
                (step.locked ? " is-locked" : "")
              }
            >
              <button
                type="button"
                className="wiz-card-head"
                onClick={() => toggle(step.id)}
                aria-expanded={isOpen}
              >
                <StatusDot state={step.state} />
                <span className="wiz-card-num">{step.num}</span>
                <div className="wiz-card-info">
                  <span className="wiz-card-title">{step.title}</span>
                  <span className="wiz-card-summary">{step.summary}</span>
                </div>
                <span className="wiz-card-chevron" aria-hidden>{isOpen ? "▴" : "▾"}</span>
              </button>
              {isOpen && (
                <div className="wiz-card-body">
                  <p className="wiz-card-hint">
                    {step.locked
                      ? "Этот шаг зависит от предыдущего — но ты всё равно можешь его открыть и посмотреть."
                      : step.state === "done"
                      ? "Шаг завершён. Можно вернуться и поправить или перейти дальше."
                      : "Это текущий шаг — открой соответствующий блок Studio ниже и заполни."}
                  </p>
                  <div className="wiz-card-actions">
                    <button
                      type="button"
                      className="wiz-btn wiz-btn-primary"
                      onClick={() => jump(step.anchor)}
                    >
                      {step.cta} ↓
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
