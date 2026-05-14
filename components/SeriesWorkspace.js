"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORE_KEY = "neurocine:series:v1";
const CAST_KEY = "neurocine:character-bible:v1";

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
    cast: [],
    selectedEpisodeIndex: 0,
    createdAt: new Date().toISOString(),
  };
}

function emptyCastBible(draft) {
  return {
    version: "1.1-series",
    mode: draft?.charactersMode || "hybrid",
    project_type: "series",
    source_used: draft?.logline ? "series" : "none",
    source_preview: draft?.logline || draft?.title || "",
    max_characters: 8,
    world_notes_en: draft?.world || "Maintain consistent world, period, lighting, costume logic and documentary realism.",
    characters: draft?.cast || [],
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

function saveCastForStudio(draft) {
  try {
    const bible = emptyCastBible(draft);
    localStorage.setItem(CAST_KEY, JSON.stringify(bible));
    window.dispatchEvent(new CustomEvent("neurocine:character-bible-updated", { detail: bible }));
  } catch {}
}

function episodeToStudioTopic(draft, episode, index) {
  return [
    `Сериал: ${draft.title}`,
    draft.logline ? `Идея сериала: ${draft.logline}` : "",
    draft.world ? `Мир: ${draft.world}` : "",
    `Серия ${index + 1}: ${episode?.title || `Серия ${index + 1}`}`,
    episode?.hook ? `Хук: ${episode.hook}` : "",
    episode?.beat ? `Событие: ${episode.beat}` : "",
    episode?.conflict ? `Конфликт: ${episode.conflict}` : "",
    episode?.visual_promise ? `Визуальный образ: ${episode.visual_promise}` : "",
    episode?.cliffhanger ? `Клиффхэнгер: ${episode.cliffhanger}` : "",
    episode?.storyboard_seed_ru ? `ТЗ для storyboard: ${episode.storyboard_seed_ru}` : "",
    Array.isArray(draft.cast) && draft.cast.length ? `Герои сериала: ${draft.cast.map((c) => c.ui_label_ru || c.name).join(", ")}` : "",
  ].filter(Boolean).join("\n\n");
}

export default function SeriesWorkspace() {
  const [mounted, setMounted] = useState(false);
  const [seriesList, setSeriesList] = useState([]);
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSeriesList(loadSeriesList());
  }, []);

  const hasSeries = seriesList.length > 0;
  const episodesPreview = useMemo(() => {
    const count = Number(draft?.episodeCount || 5);
    return Array.from({ length: Math.max(1, Math.min(20, count)) }, (_, i) => {
      const saved = draft?.episodes?.[i] || {};
      return {
        id: saved.id || `ep_${String(i + 1).padStart(2, "0")}`,
        title: saved.title || `Серия ${i + 1}`,
        hook: saved.hook || "",
        beat: saved.beat || "Ключевое событие серии пока не задано",
        conflict: saved.conflict || "",
        visual_promise: saved.visual_promise || "",
        cliffhanger: saved.cliffhanger || "",
        characters_present: saved.characters_present || [],
        storyboard_seed_ru: saved.storyboard_seed_ru || saved.beat || "",
      };
    });
  }, [draft]);

  function startNewSeries() {
    setDraft(newSeriesDraft());
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft(patch) {
    setDraft((d) => ({ ...(d || newSeriesDraft()), ...patch }));
  }

  function currentDraftWithEpisodes() {
    return { ...(draft || newSeriesDraft()), episodes: episodesPreview };
  }

  function saveDraft() {
    if (!draft) return;
    const finalDraft = currentDraftWithEpisodes();
    const next = [finalDraft, ...seriesList.filter((x) => x.id !== finalDraft.id)];
    setSeriesList(next);
    saveSeriesList(next);
    saveCastForStudio(finalDraft);
    setDraft(null);
    setStep(1);
  }

  function openEpisodeInStudio(index = draft?.selectedEpisodeIndex || 0) {
    if (!draft) return;
    const finalDraft = currentDraftWithEpisodes();
    const epIndex = Math.max(0, Math.min(episodesPreview.length - 1, Number(index) || 0));
    const episode = episodesPreview[epIndex];
    const payload = {
      projectName: `${finalDraft.title} — ${episode?.title || `Серия ${epIndex + 1}`}`,
      topic: episodeToStudioTopic(finalDraft, episode, epIndex),
      tone: finalDraft.genre,
      projectType: "series",
      episodeIndex: epIndex,
      episode,
      seriesDraft: finalDraft,
    };
    saveCastForStudio(finalDraft);
    try { sessionStorage.setItem("neurocine:series-to-studio:v1", JSON.stringify(payload)); } catch {}
    window.location.href = "/storyboard?fromSeries=1";
  }

  async function generateEpisodes() {
    if (!draft) return;
    if (!draft.logline?.trim() && !draft.title?.trim()) {
      alert("Сначала заполни идею сериала.");
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      let token = "";
      if (isSupabaseConfigured && supabase?.auth?.getSession) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || "";
      }
      const res = await fetch("/api/series-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(currentDraftWithEpisodes()),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) throw new Error(payload.error || `HTTP ${res.status}`);
      const outline = payload.outline || {};
      updateDraft({
        title: outline.series_title || draft.title,
        logline: outline.season_logline || draft.logline,
        episodes: Array.isArray(outline.episodes) ? outline.episodes : episodesPreview,
      });
      setStep(5);
    } catch (e) {
      alert(e?.message || "Не удалось сгенерировать серии");
    } finally {
      setBusy(false);
    }
  }

  function addCast() {
    const name = prompt("Имя или роль героя");
    if (!name?.trim()) return;
    const role = prompt("Роль в истории", "главный герой") || "герой";
    const character = {
      id: `char_${String((draft?.cast?.length || 0) + 1).padStart(2, "0")}`,
      name: name.trim(),
      ui_label_ru: name.trim(),
      role,
      importance: (draft?.cast?.length || 0) === 0 ? "main" : "supporting",
      face_lock_en: "stable realistic face, natural asymmetry, visible pores, cinematic documentary realism",
      body_lock_en: "natural documentary posture and body language",
      clothing_lock_en: "costume follows series world and role",
      emotion_lock_en: "emotionally believable, not model-like",
      continuity_notes_en: "Keep the same identity in every episode and storyboard frame where this character appears.",
      reference_mode: "manual",
      reference_image: null,
    };
    updateDraft({ cast: [...(draft?.cast || []), character], charactersMode: "hybrid" });
  }

  function updateEpisode(index, patch) {
    const next = episodesPreview.map((ep, i) => i === index ? { ...ep, ...patch } : ep);
    updateDraft({ episodes: next });
  }

  if (!mounted) return null;

  return (
    <main className="nc-series-page">
      <header className="nc-series-topbar">
        <button type="button" className="nc-series-menu" onClick={() => window.location.href = "/storyboard"}>← Обычная Studio</button>
        <div className="nc-series-brand">N</div>
        <button type="button" className="nc-series-menu" onClick={() => window.location.href = "/"}>Главная</button>
      </header>

      <section className="nc-series-hero">
        <div>
          <p className="nc-series-kicker">NEUROCINE SERIES STUDIO</p>
          <h1>Сериалы</h1>
          <p>Отдельная студия для AI-сериалов: идея, герои, мир, эпизоды, storyboard серии и production pack.</p>
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
                  <button type="button" onClick={() => { setDraft(item); setStep(1); }}>Открыть Series Studio</button>
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
              <div className="nc-series-guide-step"><b>Шаг 3 — Эпизоды и storyboard</b><p>Сгенерируй план серий, затем отправляй выбранную серию в storyboard.</p></div>
            </div>
          </section>
        </>
      )}

      {draft && (
        <section className="nc-series-wizard">
          <div className="nc-series-wizard-head">
            <div>
              <p className="nc-series-kicker">SERIES STUDIO</p>
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
            <button type="button" className="nc-series-wide" onClick={addCast}>＋ Добавить героя сериала</button>
            {(draft.cast || []).map((c) => <div className="nc-series-cast-mini" key={c.id}><b>{c.ui_label_ru || c.name}</b><span>{c.role} · {c.importance === "main" ? "главный" : "второстепенный"}</span></div>)}
          </div>}

          {step === 4 && <div className="nc-series-form">
            <label>Мир / локации<textarea value={draft.world} onChange={(e) => updateDraft({ world: e.target.value })} placeholder="Город, эпоха, правила мира, визуальный стиль, ключевые места" /></label>
          </div>}

          {step === 5 && <div className="nc-series-form">
            <label>Количество серий<input type="number" min="1" max="20" value={draft.episodeCount} onChange={(e) => updateDraft({ episodeCount: Number(e.target.value) })} /></label>
            <button type="button" className="nc-series-generate" onClick={generateEpisodes} disabled={busy}>{busy ? "Генерирую серии..." : "⚡ Сгенерировать серии"}</button>
            <div className="nc-episode-grid">{episodesPreview.map((ep, index) => <div key={ep.id} className={draft.selectedEpisodeIndex === index ? "active" : ""}><input value={ep.title} onChange={(e) => updateEpisode(index, { title: e.target.value })} /><textarea value={ep.beat} onChange={(e) => updateEpisode(index, { beat: e.target.value, storyboard_seed_ru: e.target.value })} /><button type="button" onClick={() => updateDraft({ selectedEpisodeIndex: index })}>Выбрать</button><button type="button" onClick={() => openEpisodeInStudio(index)}>Открыть эту серию в обычной Studio</button></div>)}</div>
          </div>}

          {step === 6 && <div className="nc-series-final">
            <h3>Series Studio готова</h3>
            <p>Выбери серию и отправь её в обычную Studio как временный fallback. Следующий большой этап — storyboard grid прямо внутри Series Studio.</p>
            <div><button type="button" onClick={saveDraft}>Сохранить сериал</button><button type="button" onClick={() => openEpisodeInStudio(draft.selectedEpisodeIndex || 0)}>Открыть выбранную серию в обычной Studio</button></div>
          </div>}

          <div className="nc-series-nav"><button type="button" disabled={step <= 1} onClick={() => setStep(step - 1)}>Назад</button><button type="button" disabled={step >= 6} onClick={() => setStep(step + 1)}>Дальше</button></div>
        </section>
      )}
    </main>
  );
}
