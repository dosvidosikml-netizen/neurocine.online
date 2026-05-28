// lib/scenarioContext.js
// NeuroCine — единый контекст сценария для TTS / SEO / Music.
// Берёт выбранный режим (project_type), стиль (styleProfile) и storyboard,
// и собирает компактный блок, который прокидывается в LLM-промт каждого пакета,
// чтобы они НЕ жили своей жизнью, а следовали выбранному сценарию.

function clean(v = "") {
  return String(v || "").replace(/\s+/g, " ").trim();
}

// Короткая "суть" визуального стиля без realism-болванки и хвоста "no subtitles...".
export function styleEssence(styleProfile = null) {
  const lock = clean(styleProfile?.style_lock || "");
  if (!lock) return "";
  const meaningful = lock
    .split(/\.\s+/)
    .map((s) => clean(s))
    .filter((s) =>
      s &&
      !/^RAW\b/i.test(s) &&
      !/photoreal|documentary photorealism|camera-photographed/i.test(s) &&
      !/no subtitles|no ui|no watermark|not illustration|not painting/i.test(s)
    )
    .sort((a, b) => b.length - a.length); // самый описательный сегмент = сигнал стиля
  return clean((meaningful[0] || "").replace(/,?\s*(no subtitles[\s\S]*)$/i, "")).slice(0, 180);
}

function scenesOf(storyboard = null) {
  return (storyboard?.scenes || storyboard?.frames || []).filter(Boolean);
}

function durationOf(storyboard = null) {
  const explicit = Number(storyboard?.total_duration || 0);
  if (explicit > 0) return Math.round(explicit);
  const sum = scenesOf(storyboard).reduce((a, s) => a + Number(s?.duration || 0), 0);
  return sum > 0 ? Math.round(sum) : 0;
}

function hookOf(storyboard = null, script = "") {
  const direct = clean(storyboard?.hook || storyboard?.title || "");
  if (direct) return direct.slice(0, 140);
  const firstScene = scenesOf(storyboard)[0];
  const sceneLine = clean(firstScene?.vo_ru || firstScene?.description_ru || firstScene?.visual || "");
  if (sceneLine) return sceneLine.slice(0, 140);
  return clean(script).split(/(?<=[.!?])\s+/)[0]?.slice(0, 140) || "";
}

function arcOf(storyboard = null) {
  const beats = scenesOf(storyboard)
    .map((s) => clean(s?.beat_type || s?.phase || ""))
    .filter(Boolean);
  return [...new Set(beats)].slice(0, 8).join(" → ");
}

function atmosphereOf(storyboard = null) {
  return scenesOf(storyboard)
    .slice(0, 6)
    .map((s) => clean(s?.sfx || s?.description_ru || s?.visual || ""))
    .filter(Boolean)
    .map((x) => x.slice(0, 80))
    .slice(0, 5)
    .join("; ");
}

// Главная функция: нормализует все сигналы и собирает готовый блок-строку.
export function buildScenarioContext({ topic = "", script = "", genre = "", storyboard = null, styleProfile = null } = {}) {
  const projectTypeLabel = clean(styleProfile?.project_type_label || storyboard?.project_type_label || "");
  const styleLabel = clean(styleProfile?.style_label || storyboard?.selected_style_label || "");
  const essence = styleEssence(styleProfile) || clean(storyboard?.global_style_lock || "").slice(0, 160);
  const durationSec = durationOf(storyboard);
  const sceneCount = scenesOf(storyboard).length;
  const hook = hookOf(storyboard, script);
  const arc = arcOf(storyboard);
  const atmosphere = atmosphereOf(storyboard);

  const lines = [
    "SCENARIO CONTEXT — выровняй весь результат под него (не отклоняйся):",
    `- Тема: ${clean(topic) || "(не задана)"}`,
    `- Режим/жанр: ${[projectTypeLabel, clean(genre)].filter(Boolean).join(" / ") || "(не задан)"}`,
    styleLabel || essence ? `- Визуальный стиль: ${[styleLabel, essence].filter(Boolean).join(" — ")}` : null,
    durationSec ? `- Длительность: ${durationSec}с${sceneCount ? `, сцен: ${sceneCount}` : ""}` : null,
    hook ? `- Хук/завязка: ${hook}` : null,
    arc ? `- Эмоциональная арка: ${arc}` : null,
    atmosphere ? `- Атмосфера/звук сцен: ${atmosphere}` : null,
  ].filter(Boolean);

  return {
    projectTypeLabel,
    styleLabel,
    styleEssence: essence,
    durationSec,
    sceneCount,
    hook,
    arc,
    atmosphere,
    contextBlock: lines.join("\n"),
  };
}

export default buildScenarioContext;
