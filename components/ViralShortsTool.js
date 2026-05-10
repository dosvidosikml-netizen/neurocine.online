"use client";

import { useMemo, useState } from "react";

const PLATFORMS = ["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"];
const NICHES = ["История", "True Crime", "Мистика", "Кино", "Наука", "Военная документалистика", "Шок-контент"];

function buildViralPack({ idea, niche, platform, duration, intensity }) {
  const topic = idea.trim() || "Что если ты оказался в месте, где обычная ошибка стоит жизни";
  const hook = intensity === "hard"
    ? `Ты бы не выжил здесь и десяти минут. ${topic}.`
    : `Ты не знал, что за этим фактом скрывается настоящая тьма. ${topic}.`;
  return [
    `VIRAL SHORTS PACK — ${platform}`,
    `Ниша: ${niche}`,
    `Длительность: ${duration} сек`,
    "",
    "HOOK:",
    hook,
    "",
    "SCRIPT STRUCTURE:",
    "1. Хук 0–3 сек: резкий вопрос или опасность.",
    "2. Контекст 3–12 сек: где мы и почему это страшно.",
    "3. Эскалация 12–40 сек: 2–3 факта с визуальным нарастанием.",
    "4. Финальный удар: короткий вывод + вопрос зрителю.",
    "",
    "VISUAL STYLE:",
    "cinematic documentary realism, 9:16, tense lighting, strong texture, no subtitles, no UI, no watermark",
    "",
    "COVER TEXT OPTIONS:",
    "— ТЫ БЫ НЕ ВЫЖИЛ",
    "— ОНИ НЕ ВЫХОДИЛИ ЖИВЫМИ",
    "— ЭТО СКРЫВАЛИ ГОДАМИ",
    "",
    "TTS:",
    "низкий документальный голос, напряжение, медленный темп, драматические паузы",
    "",
    "MUSIC:",
    "dark cinematic drone, low pulse, rising tension, no vocals",
    "",
    "SEO TITLES:",
    `— ${topic} — ты бы выдержал?`,
    `— Самая тёмная история: ${topic}`,
    "",
    "HASHTAGS:",
    "#shorts #история #интересныефакты #neurocine #documentary #reels #tiktok"
  ].join("\n");
}

export default function ViralShortsTool({
  setTopic,
  setScript,
  setDuration,
  setAspect,
  setTone,
  setStylePreset,
  setProjectType,
  onStatus,
}) {
  const [idea, setIdea] = useState("");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [niche, setNiche] = useState("История");
  const [duration, setDurationLocal] = useState(60);
  const [intensity, setIntensity] = useState("hard");

  const pack = useMemo(() => buildViralPack({ idea, niche, platform, duration, intensity }), [idea, niche, platform, duration, intensity]);

  function applyViralPack() {
    const cleanIdea = idea.trim() || "Что если ты оказался в месте, где обычная ошибка стоит жизни";
    setTopic(cleanIdea);
    setScript(pack);
    setDuration(Number(duration) || 60);
    setAspect("9:16");
    setProjectType("film");
    setStylePreset(niche === "True Crime" ? "dark" : niche === "Военная документалистика" ? "war" : "cinematic");
    setTone(`viral ${platform} ${niche}, cinematic documentary realism, strong hook, high retention, ${intensity === "hard" ? "shock opening" : "mysterious intrigue"}`);
    onStatus?.("Viral Shorts pack вставлен как сценарий · можно генерировать storyboard");
  }

  return (
    <section className="quick-tool-card viral-shorts-card">
      <div className="quick-tool-head">
        <div>
          <span className="quick-kicker hot">VIRAL SHORTS</span>
          <h2>Виральный Shorts Generator</h2>
          <p>Быстрая заготовка для ролика: hook, структура, cover text, TTS, музыка, SEO и hashtags.</p>
        </div>
        <div className="quick-tool-badge red">Retention</div>
      </div>

      <label className="quick-field full">
        <span>Тема ролика</span>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Напр. Что если тебя отправили на Остров Дьявола"
          rows={3}
        />
      </label>

      <div className="quick-grid-2">
        <label className="quick-field">
          <span>Платформа</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            {PLATFORMS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="quick-field">
          <span>Ниша</span>
          <select value={niche} onChange={e => setNiche(e.target.value)}>
            {NICHES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>

      <div className="quick-grid-2">
        <label className="quick-field">
          <span>Длина</span>
          <select value={duration} onChange={e => setDurationLocal(Number(e.target.value))}>
            <option value={30}>30 сек</option>
            <option value={60}>60 сек</option>
            <option value={90}>90 сек</option>
            <option value={180}>3 мин</option>
          </select>
        </label>
        <label className="quick-field">
          <span>Подача</span>
          <select value={intensity} onChange={e => setIntensity(e.target.value)}>
            <option value="hard">Жёсткий hook</option>
            <option value="mystery">Мистика / интрига</option>
          </select>
        </label>
      </div>

      <div className="viral-pack-preview">
        <pre>{pack}</pre>
      </div>

      <div className="quick-actions">
        <button type="button" className="btn btn-primary" onClick={applyViralPack}>Вставить в сценарий</button>
      </div>
    </section>
  );
}
