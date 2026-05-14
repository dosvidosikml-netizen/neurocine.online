"use client";

import { useEffect, useMemo, useState } from "react";

const STORE_KEY = "neurocine:series:v1";

function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function newSeriesDraft() {
  return {
    id: `series_${Date.now()}`,
    title: "Новый сериал",
    genre: "cinematic documentary thriller",
    format: "диктор",
    logline: "",
    world: "",
    episodeCount: 5,
    charactersMode: "hybrid",
    episodes: [],
    createdAt: new Date().toISOString(),
  };
}

function loadSeriesList() {
  if (typeof window === "undefined") return [];
  const parsed = safeJson(localStorage.getItem(STORE_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveSeriesList(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
}

export default function SeriesWorkspace() {
  const [mounted, setMounted] = useState(false);
  const [seriesList, setSeriesList] = useState([]);
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setMounted(true);
    setSeriesList(loadSeriesList());
  }, []);

  const hasSeries = seriesList.length > 0;
  const episodesPreview = useMemo(() => {
    const count = Number(draft?.episodeCount || 5);
    return Array.from({ length: Math.max(1, Math.min(20, count)) }, (_, i) => ({
      id: `ep_${String(i + 1).padStart(2, "0")}`,
      title: `Серия ${i + 1}`,
      beat: draft?.episodes?.[i]?.beat || "Ключевое событие серии пока не задано",
    }));
  }, [draft]);

  function startNewSeries() {
    setDraft(newSeriesDraft());
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft(patch) {
    setDraft((d) => ({ ...(d || newSeriesDraft()), ...patch }));
  }

  function saveDraft() {
    if (!draft) return;
    const next = [draft, ...seriesList.filter((x) => x.id !== draft.id)];
    setSeriesList(next);
    saveSeriesList(next);
    setDraft(null);
    setStep(1);
  }

  function openStudioWithSeries() {
    if (!draft) return;
    const payload = {
      projectName: draft.title,
      topic: draft.logline || draft.title,
      tone: draft.genre,
      projectType: "series",
      seriesDraft: draft,
    };
    try { sessionStorage.setItem("neurocine:series-to-studio:v1", JSON.stringify(payload)); } catch {}
    window.location.href = "/storyboard?fromSeries=1";
  }

  if (!mounted) return null;

  return (
    <main className="nc-series-page">
      <header className="nc-series-topbar">
        <button type="button" className="nc-series-menu" onClick={() => window.location.href = "/storyboard"}>← Studio</button>
        <div className="nc-series-brand">N</div>
        <button type="button" className="nc-series-menu" onClick={() => window.location.href = "/"}>Главная</button>
      </header>

      <section className="nc-series-hero">
        <div>
          <p className="nc-series-kicker">NEUROCINE SERIES FACTORY</p>
          <h1>Сериалы</h1>
          <p>Создавай короткие AI-сериалы: идея, герои, мир, эпизоды, storyboard grid и production pack — отдельно от обычной Studio.</p>
        </div>
        <button type="button" onClick={startNewSeries}>＋ Новый сериал</button>
      </section>

      {!draft && (
        <>
          <section className="nc-series-empty">
            <div className="nc-series-empty-icon">▻</div>
            <h2>{hasSeries ? "Мои сериалы" : "Мини-сериалов пока нет"}</h2>
            <p>{hasSeries ? "Выбери сериал или создай новый production-flow." : "Создай первый сериал, чтобы начать собирать героев, эпизоды и storyboard."}</p>
            <button type="button" onClick={startNewSeries}>＋ Начать создание</button>
          </section>

          {hasSeries && (
            <section className="nc-series-list">
              {seriesList.map((item) => (
                <article key={item.id} className="nc-series-card">
                  <div>
                    <span>{item.genre}</span>
                    <h3>{item.title}</h3>
                    <p>{item.logline || "Без описания"}</p>
                  </div>
                  <button type="button" onClick={() => { setDraft(item); setStep(1); }}>Открыть</button>
                </article>
              ))}
            </section>
          )}

          <section className="nc-series-guide">
            <div className="nc-series-guide-icon">✦</div>
            <div>
              <h2>Как создать сценарий сериала с помощью AI?</h2>
              <div className="nc-series-guide-step"><b>Шаг 1 — Общая идея</b><p>Опиши жанр, мир, главных героев и конфликт. NeuroCine сохранит это как основу сериала.</p></div>
              <div className="nc-series-guide-step"><b>Шаг 2 — Герои и референсы</b><p>Используй авто-каст или свои изображения, чтобы серия за серией сохранялась внешность персонажей.</p></div>
              <div className="nc-series-guide-step"><b>Шаг 3 — Эпизоды и storyboard</b><p>Разбей историю на серии, затем отправь выбранную серию в Studio для storyboard grid и production pack.</p></div>
            </div>
          </section>
        </>
      )}

      {draft && (
        <section className="nc-series-wizard">
          <div className="nc-series-wizard-head">
            <div>
              <p className="nc-series-kicker">SERIES CREATE FLOW</p>
              <h2>{draft.title || "Новый сериал"}</h2>
            </div>
            <button type="button" onClick={() => setDraft(null)}>×</button>
          </div>

          <div className="nc-series-steps">
            {["Идея", "Формат", "Герои", "Мир", "Эпизоды", "Storyboard"].map((x, i) => (
              <button key={x} type="button" className={step === i + 1 ? "active" : ""} onClick={() => setStep(i + 1)}>{i + 1}. {x}</button>
            ))}
          </div>

          {step === 1 && <div className="nc-series-form">
            <label>Название сериала<input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} /></label>
            <label>Жанр / тон<input value={draft.genre} onChange={(e) => updateDraft({ genre: e.target.value })} /></label>
            <label>Идея сериала<textarea value={draft.logline} onChange={(e) => updateDraft({ logline: e.target.value })} placeholder="О чём сериал? Кто герой? В чём конфликт?" /></label>
          </div>}

          {step === 2 && <div className="nc-series-choice-grid">
            {["диктор", "диалоги", "смешанный"].map((x) => <button key={x} type="button" className={draft.format === x ? "active" : ""} onClick={() => updateDraft({ format: x })}><b>{x}</b><span>{x === "диктор" ? "История через voice-over" : x === "диалоги" ? "Сцены через реплики" : "Диктор + реплики"}</span></button>)}
          </div>}

          {step === 3 && <div className="nc-series-choice-grid">
            {[{id:"auto",t:"Авто из сценария",d:"NeuroCine сам найдёт героев"},{id:"manual",t:"Свои референсы",d:"Ты сам задаёшь лица и костюмы"},{id:"hybrid",t:"Авто + свои",d:"Лучший режим для сериалов"}].map((x) => <button key={x.id} type="button" className={draft.charactersMode === x.id ? "active" : ""} onClick={() => updateDraft({ charactersMode: x.id })}><b>{x.t}</b><span>{x.d}</span></button>)}
            <button type="button" className="nc-series-wide" onClick={() => alert("Следующий этап: сюда будет встроен полноценный блок героев проекта с ref face/full body/costume.")}>🎭 Открыть героев проекта</button>
          </div>}

          {step === 4 && <div className="nc-series-form">
            <label>Мир / локации<textarea value={draft.world} onChange={(e) => updateDraft({ world: e.target.value })} placeholder="Город, эпоха, правила мира, визуальный стиль, ключевые места" /></label>
          </div>}

          {step === 5 && <div className="nc-series-form">
            <label>Количество серий<input type="number" min="1" max="20" value={draft.episodeCount} onChange={(e) => updateDraft({ episodeCount: Number(e.target.value) })} /></label>
            <div className="nc-episode-grid">{episodesPreview.map((ep) => <div key={ep.id}><b>{ep.title}</b><p>{ep.beat}</p></div>)}</div>
          </div>}

          {step === 6 && <div className="nc-series-final">
            <h3>Готово к storyboard</h3>
            <p>Сохрани сериал или отправь текущую серию в Studio. Следующим этапом подключим генерацию эпизодов и отдельный storyboard grid внутри сериала.</p>
            <div><button type="button" onClick={saveDraft}>Сохранить сериал</button><button type="button" onClick={openStudioWithSeries}>Открыть в Studio</button></div>
          </div>}

          <div className="nc-series-nav"><button type="button" disabled={step <= 1} onClick={() => setStep(step - 1)}>Назад</button><button type="button" disabled={step >= 6} onClick={() => setStep(step + 1)}>Дальше</button></div>
        </section>
      )}
    </main>
  );
}
