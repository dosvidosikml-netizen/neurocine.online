"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import SeriesCharacterStudio from "./SeriesCharacterStudio";

const STORE_KEY = "neurocine:series:v1";
const CAST_KEY = "neurocine:character-bible:v1";
const REF_SLOT_LABELS = {
  face: "face",
  full_body: "full body",
  costume: "costume",
  three_quarter: "3/4",
  left_profile: "left profile",
  right_profile: "right profile",
  back_view: "back view",
  extra_angle: "extra angle",
};

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
    duration: 60,
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

function storyboardFrames(storyboard) {
  if (!storyboard || typeof storyboard !== "object") return [];
  return Array.isArray(storyboard.scenes) ? storyboard.scenes : [];
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadText(filename, text) {
  const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function characterLabel(c) {
  return String(c?.ui_label_ru || c?.name || "").trim();
}

function selectedCharactersForEpisode(draft, episode, episodeIndex) {
  const cast = Array.isArray(draft?.cast) ? draft.cast : [];
  const present = Array.isArray(episode?.characters_present) ? episode.characters_present.map(String) : [];
  const explicit = cast.filter((c) => {
    const label = characterLabel(c);
    const appears = Array.isArray(c.appears_in_episodes) ? c.appears_in_episodes.includes(episodeIndex) : false;
    return appears || present.includes(label) || present.includes(c?.name);
  });
  if (explicit.length) return explicit;
  return cast.filter((c) => c.importance !== "background").slice(0, 6);
}

function characterReferenceLock(c, index) {
  const refs = c?.reference_images || {};
  const readyRefs = Object.entries(REF_SLOT_LABELS).filter(([key]) => !!refs[key]).map(([, label]) => label);
  const promptPack = c?.reference_prompts || {};
  return [
    `CHARACTER ${index + 1}: ${characterLabel(c) || `Character ${index + 1}`}`,
    `Role: ${c?.role || "series character"}. Importance: ${c?.importance || "supporting"}. Age: ${c?.age_range || "adult"}.`,
    `FACE LOCK: ${c?.face_lock_en || "stable realistic face, same identity"}`,
    `BODY LOCK: ${c?.body_lock_en || "same body type and silhouette"}`,
    `COSTUME LOCK: ${c?.clothing_lock_en || "same costume logic"}`,
    `EMOTION LOCK: ${c?.emotion_lock_en || "believable restrained human emotion"}`,
    `CONTINUITY: ${c?.continuity_notes_en || promptPack.continuity || "Maintain exact same identity across all frames."}`,
    readyRefs.length ? `REFERENCE SLOTS AVAILABLE: ${readyRefs.join(", ")}. Use these as visual DNA anchors.` : "REFERENCE SLOTS AVAILABLE: none uploaded yet; use the text lock as visual DNA.",
    promptPack.negative ? `NEGATIVE LOCK: ${promptPack.negative}` : "NEGATIVE LOCK: no face drift, no age drift, no costume drift, no plastic skin, no glossy CGI, no random different person.",
  ].join("\n");
}

function buildSeriesFrameGridPrompt(draft, episode, episodeIndex) {
  const frames = storyboardFrames(episode?.storyboard);
  const frameCount = Math.max(1, Math.min(frames.length || 12, 24));
  const chars = selectedCharactersForEpisode(draft, episode, episodeIndex);
  const characterLock = chars.length
    ? chars.map((c, i) => characterReferenceLock(c, i)).join("\n\n")
    : "No character reference pack attached. Create visually consistent documentary people only if needed.";
  const frameLines = frames.slice(0, frameCount).map((f, i) => [
    `FRAME ${String(i + 1).padStart(2, "0")}`,
    `Beat: ${f.beat_type || "story beat"}`,
    `RU description: ${f.description_ru || ""}`,
    `Visual prompt: ${f.image_prompt_en || f.camera || ""}`,
    `Camera: ${f.camera || ""}`,
    `Duration: ${f.duration || 3}s`,
  ].join(" | ")).join("\n");

  return `STORYBOARD GRID PART — SERIES EPISODE VISUAL PROMPT\n\nPROJECT: ${draft?.title || "NeuroCine Series"}\nEPISODE ${episodeIndex + 1}: ${episode?.title || `Episode ${episodeIndex + 1}`}\nGENRE / TONE: ${draft?.genre || "cinematic documentary thriller"}\nWORLD: ${draft?.world || draft?.logline || "series world"}\nASPECT RATIO: 9:16 vertical frames\nGRID COUNT: Generate exactly ${frameCount} live-action cinematic frames in one clean storyboard grid.\n\nCHARACTER REFERENCE LOCK — DO NOT BREAK:\n${characterLock}\n\nSERIES CONTINUITY RULES:\n- Use ONLY characters listed in the episode unless the frame clearly needs background people.\n- Maintain exact same face, age, body type, hair, costume logic and emotional baseline across every frame.\n- If a character has uploaded reference slots, treat them as the visual source of truth.\n- No character drift between frames. No random replacement faces. No age drift. No costume drift.\n\nRAW VISUAL QUALITY LOCK:\nRAW unretouched live-action documentary photograph, not CGI, not illustration, not plastic. Natural skin pores, individual hair strands, fabric weave, dirty real surfaces, practical available light, micro-contrast, lens vignette, natural grain, believable human asymmetry. No beauty filter. No wax faces. No AI smoothness. No blurry faces. No sterile stock-photo look.\n\nGRID COMPOSITION:\n- Clean storyboard grid, readable separation between frames.\n- Each frame has ONE primary focus.\n- Keep cinematic continuity from frame to frame.\n- Use varied shot sizes: close-up, medium, wide, POV, over-the-shoulder, detail insert.\n- Preserve the emotional escalation of the episode.\n\nEPISODE STORY BEATS:\n${episodeToStudioTopic(draft, episode, episodeIndex)}\n\nFRAME PLAN:\n${frameLines || "Create a coherent frame plan from the episode story beats."}\n\nNEGATIVE PROMPT:\nplastic skin, wax face, over-smoothed face, doll face, generic stock photo, CGI, render, cartoon, anime, inconsistent identity, different person, age drift, costume drift, random hairstyle, bad hands, deformed fingers, unreadable grid, text captions, watermark, logo, heavy blur, face smearing, beauty retouching.`;
}

export default function SeriesWorkspace() {
  const [mounted, setMounted] = useState(false);
  const [seriesList, setSeriesList] = useState([]);
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [storyBusy, setStoryBusy] = useState(false);

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
        storyboard: saved.storyboard || null,
        storyboardMeta: saved.storyboardMeta || null,
        frameGridPrompt: saved.frameGridPrompt || "",
        frameGridMeta: saved.frameGridMeta || null,
      };
    });
  }, [draft]);

  const selectedIndex = Math.max(0, Math.min(episodesPreview.length - 1, Number(draft?.selectedEpisodeIndex || 0)));
  const selectedEpisode = episodesPreview[selectedIndex];
  const selectedFrames = storyboardFrames(selectedEpisode?.storyboard);
  const selectedFrameGridPrompt = selectedEpisode?.frameGridPrompt || "";
  const selectedCharacters = selectedCharactersForEpisode(draft, selectedEpisode, selectedIndex);

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

  function persistDraft(finalDraft) {
    const next = [finalDraft, ...seriesList.filter((x) => x.id !== finalDraft.id)];
    setSeriesList(next);
    saveSeriesList(next);
    saveCastForStudio(finalDraft);
  }

  function saveDraft({ close = true } = {}) {
    if (!draft) return;
    const finalDraft = currentDraftWithEpisodes();
    persistDraft(finalDraft);
    if (close) {
      setDraft(null);
      setStep(1);
    }
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

  async function getToken() {
    if (isSupabaseConfigured && supabase?.auth?.getSession) {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || "";
    }
    return "";
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
      const token = await getToken();
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

  async function generateStoryboardForEpisode(index = selectedIndex) {
    if (!draft) return;
    const epIndex = Math.max(0, Math.min(episodesPreview.length - 1, Number(index) || 0));
    const episode = episodesPreview[epIndex];
    const script = episodeToStudioTopic(currentDraftWithEpisodes(), episode, epIndex);

    if (!script || script.length < 20) {
      alert("Недостаточно данных серии для storyboard.");
      return;
    }

    setStoryBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          project_name: `${draft.title} — ${episode.title || `Серия ${epIndex + 1}`}`,
          script,
          duration: Number(draft.duration || 60),
          aspect_ratio: "9:16",
          style: "cinematic documentary thriller",
          mode: "safe",
          target: "veo3",
          stream: false,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) throw new Error(payload.error || `HTTP ${res.status}`);
      const storyboard = payload.storyboard || payload;
      updateEpisode(epIndex, {
        storyboard,
        frameGridPrompt: "",
        frameGridMeta: null,
        storyboardMeta: {
          generatedAt: new Date().toISOString(),
          mode: payload.mode || "api",
          target: payload.target || "veo3",
          validation: payload.validation || null,
          frameCount: storyboardFrames(storyboard).length,
        },
      });
      updateDraft({ selectedEpisodeIndex: epIndex });
      setStep(6);
    } catch (e) {
      alert(e?.message || "Не удалось сгенерировать storyboard серии");
    } finally {
      setStoryBusy(false);
    }
  }

  function generateFrameGridForEpisode(index = selectedIndex) {
    if (!draft) return;
    const epIndex = Math.max(0, Math.min(episodesPreview.length - 1, Number(index) || 0));
    const episode = episodesPreview[epIndex];
    if (!episode?.storyboard) {
      alert("Сначала сгенерируй storyboard серии.");
      return;
    }
    const prompt = buildSeriesFrameGridPrompt(currentDraftWithEpisodes(), episode, epIndex);
    updateEpisode(epIndex, {
      frameGridPrompt: prompt,
      frameGridMeta: {
        generatedAt: new Date().toISOString(),
        frameCount: Math.min(storyboardFrames(episode.storyboard).length || 12, 24),
        characterCount: selectedCharactersForEpisode(draft, episode, epIndex).length,
        source: "series_frame_grid_v1",
      },
    });
    updateDraft({ selectedEpisodeIndex: epIndex });
  }

  function updateEpisode(index, patch) {
    const next = episodesPreview.map((ep, i) => i === index ? { ...ep, ...patch } : ep);
    updateDraft({ episodes: next });
  }

  async function copySelectedStoryboard() {
    if (!selectedEpisode?.storyboard) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedEpisode.storyboard, null, 2));
    alert("Storyboard JSON скопирован");
  }

  async function copySelectedFrameGrid() {
    if (!selectedFrameGridPrompt) return;
    await navigator.clipboard.writeText(selectedFrameGridPrompt);
    alert("Frame Grid prompt скопирован");
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
              <div className="nc-series-guide-step"><b>Шаг 3 — Эпизоды, storyboard и Frame Grid</b><p>Сгенерируй серии, создай storyboard, затем собери Frame Grid prompt с reference DNA героев.</p></div>
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
            <label>Длительность серии, сек.<input type="number" min="30" max="180" value={draft.duration || 60} onChange={(e) => updateDraft({ duration: Number(e.target.value) })} /></label>
            <label>Идея сериала<textarea value={draft.logline} onChange={(e) => updateDraft({ logline: e.target.value })} placeholder="О чём сериал? Кто герой? В чём конфликт?" /></label>
          </div>}

          {step === 2 && <div className="nc-series-choice-grid">
            {["диктор", "диалоги", "смешанный"].map((x) => <button key={x} type="button" className={draft.format === x ? "active" : ""} onClick={() => updateDraft({ format: x })}><b>{x}</b><span>{x === "диктор" ? "История через voice-over" : x === "диалоги" ? "Сцены через реплики" : "Диктор + реплики"}</span></button>)}
          </div>}

          {step === 3 && <SeriesCharacterStudio draft={draft} updateDraft={updateDraft} episodes={episodesPreview} />}

          {step === 4 && <div className="nc-series-form">
            <label>Мир / локации<textarea value={draft.world} onChange={(e) => updateDraft({ world: e.target.value })} placeholder="Город, эпоха, правила мира, визуальный стиль, ключевые места" /></label>
          </div>}

          {step === 5 && <div className="nc-series-form">
            <label>Количество серий<input type="number" min="1" max="20" value={draft.episodeCount} onChange={(e) => updateDraft({ episodeCount: Number(e.target.value) })} /></label>
            <button type="button" className="nc-series-generate" onClick={generateEpisodes} disabled={busy}>{busy ? "Генерирую серии..." : "⚡ Сгенерировать серии"}</button>
            <div className="nc-episode-grid">{episodesPreview.map((ep, index) => <div key={ep.id} className={draft.selectedEpisodeIndex === index ? "active" : ""}><input value={ep.title} onChange={(e) => updateEpisode(index, { title: e.target.value })} /><textarea value={ep.beat} onChange={(e) => updateEpisode(index, { beat: e.target.value, storyboard_seed_ru: e.target.value })} /><button type="button" onClick={() => updateDraft({ selectedEpisodeIndex: index })}>Выбрать</button><button type="button" onClick={() => { updateDraft({ selectedEpisodeIndex: index }); setStep(6); }}>Storyboard серии</button>{ep.storyboard && <small>✓ Storyboard готов · {storyboardFrames(ep.storyboard).length} кадров</small>}{ep.frameGridPrompt && <small>✓ Frame Grid prompt готов</small>}</div>)}</div>
          </div>}

          {step === 6 && <div className="nc-series-storyboard">
            <div className="nc-series-storyboard-head">
              <div>
                <p className="nc-series-kicker">EPISODE STORYBOARD + FRAME GRID</p>
                <h3>{selectedEpisode?.title || `Серия ${selectedIndex + 1}`}</h3>
                <p>{selectedEpisode?.beat}</p>
                <div className="nc-series-grid-character-chip">{selectedCharacters.length ? `Герои в серии: ${selectedCharacters.map(characterLabel).join(", ")}` : "Герои не привязаны — будет использован общий visual lock"}</div>
              </div>
              <select value={selectedIndex} onChange={(e) => updateDraft({ selectedEpisodeIndex: Number(e.target.value) })}>
                {episodesPreview.map((ep, i) => <option key={ep.id} value={i}>{i + 1}. {ep.title}</option>)}
              </select>
            </div>

            <div className="nc-series-story-actions">
              <button type="button" onClick={() => generateStoryboardForEpisode(selectedIndex)} disabled={storyBusy}>{storyBusy ? "Генерирую storyboard..." : selectedEpisode?.storyboard ? "Перегенерировать storyboard" : "🎬 Сгенерировать storyboard серии"}</button>
              <button type="button" disabled={!selectedEpisode?.storyboard} onClick={() => generateFrameGridForEpisode(selectedIndex)}>{selectedFrameGridPrompt ? "🧩 Пересобрать Frame Grid" : "🧩 Создать Frame Grid"}</button>
              <button type="button" onClick={() => openEpisodeInStudio(selectedIndex)}>Открыть в обычной Studio</button>
              <button type="button" disabled={!selectedEpisode?.storyboard} onClick={copySelectedStoryboard}>Копировать JSON</button>
              <button type="button" disabled={!selectedEpisode?.storyboard} onClick={() => downloadJson(`${draft.title || "series"}-episode-${selectedIndex + 1}-storyboard.json`, selectedEpisode.storyboard)}>Скачать JSON</button>
              <button type="button" disabled={!selectedEpisode?.storyboard} onClick={() => updateEpisode(selectedIndex, { storyboard: null, storyboardMeta: null, frameGridPrompt: "", frameGridMeta: null })}>Очистить</button>
            </div>

            {!selectedEpisode?.storyboard && <div className="nc-series-story-empty">Storyboard этой серии ещё не создан. Нажми “Сгенерировать storyboard серии” — результат сохранится прямо внутри сериала.</div>}

            {selectedEpisode?.storyboard && <div className="nc-series-story-result">
              <div className="nc-series-story-meta"><b>✓ Storyboard готов</b><span>{selectedFrames.length} кадров · {selectedEpisode.storyboard?.total_duration || draft.duration || 60} сек.</span></div>
              <div className="nc-series-frame-list">
                {selectedFrames.slice(0, 30).map((frame, i) => <article key={frame.id || i}><b>{frame.id || `frame_${i + 1}`}</b><p>{frame.description_ru || frame.camera || "Кадр storyboard"}</p><span>{frame.duration || 3} сек · {frame.beat_type || "beat"}</span></article>)}
              </div>
            </div>}

            {selectedEpisode?.storyboard && <div className="nc-series-framegrid-box">
              <div className="nc-series-framegrid-head"><div><p className="nc-series-kicker">SERIES FRAME GRID</p><h4>Frame Grid prompt серии</h4></div><span>{selectedFrameGridPrompt ? "готов" : "ещё не создан"}</span></div>
              {!selectedFrameGridPrompt && <div className="nc-series-story-empty">Нажми “Создать Frame Grid”. Промт соберётся из storyboard, героев серии, reference slots, 360 locks и visual quality lock.</div>}
              {selectedFrameGridPrompt && <>
                <textarea value={selectedFrameGridPrompt} onChange={(e) => updateEpisode(selectedIndex, { frameGridPrompt: e.target.value })} />
                <div className="nc-series-framegrid-actions"><button type="button" onClick={copySelectedFrameGrid}>Копировать prompt</button><button type="button" onClick={() => downloadText(`${draft.title || "series"}-episode-${selectedIndex + 1}-frame-grid.txt`, selectedFrameGridPrompt)}>Скачать TXT</button><button type="button" onClick={() => updateEpisode(selectedIndex, { frameGridPrompt: "", frameGridMeta: null })}>Очистить Frame Grid</button></div>
              </>}
            </div>}

            <div className="nc-series-final"><div><button type="button" onClick={() => saveDraft({ close: false })}>Сохранить сериал</button><button type="button" onClick={() => setStep(5)}>К эпизодам</button></div></div>
          </div>}

          <div className="nc-series-nav"><button type="button" disabled={step <= 1} onClick={() => setStep(step - 1)}>Назад</button><button type="button" disabled={step >= 6} onClick={() => setStep(step + 1)}>Дальше</button></div>
        </section>
      )}
    </main>
  );
}
