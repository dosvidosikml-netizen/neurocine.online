"use client";

import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function makeId(index) {
  return `char_${String(index + 1).padStart(2, "0")}`;
}

function normalizeCharacter(c = {}, index = 0) {
  const refs = c.reference_images || {};
  return {
    id: c.id || makeId(index),
    name: c.name || c.ui_label_ru || `Герой ${index + 1}`,
    ui_label_ru: c.ui_label_ru || c.name || `Герой ${index + 1}`,
    role: c.role || "герой сериала",
    importance: c.importance || (index === 0 ? "main" : "supporting"),
    face_lock_en: c.face_lock_en || "stable realistic face, natural asymmetry, visible pores, cinematic documentary realism",
    body_lock_en: c.body_lock_en || "natural documentary posture and body language",
    clothing_lock_en: c.clothing_lock_en || "costume follows series world and role",
    emotion_lock_en: c.emotion_lock_en || "emotionally believable, not model-like",
    continuity_notes_en: c.continuity_notes_en || "Keep the same identity in every episode and storyboard frame where this character appears.",
    appears_in_episodes: Array.isArray(c.appears_in_episodes) ? c.appears_in_episodes : [],
    reference_mode: c.reference_image || refs.face || refs.full_body || refs.costume ? "manual" : (c.reference_mode || "auto"),
    reference_image: c.reference_image || refs.face || null,
    reference_images: {
      face: refs.face || c.reference_image || null,
      full_body: refs.full_body || null,
      costume: refs.costume || null,
    },
  };
}

function ruImportance(v) {
  if (v === "main") return "главный";
  if (v === "background") return "фон";
  return "второстепенный";
}

function enImportance(v) {
  if (v === "главный") return "main";
  if (v === "фон") return "background";
  return "supporting";
}

async function getAccessToken() {
  if (isSupabaseConfigured && supabase?.auth?.getSession) {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  }
  return "";
}

function buildSeriesCastSource(draft, episodes) {
  const episodeText = (episodes || []).map((ep, i) => `Серия ${i + 1}: ${ep.title || ""}. ${ep.beat || ep.storyboard_seed_ru || ""}`).join("\n");
  return [
    draft?.title ? `Название: ${draft.title}` : "",
    draft?.logline ? `Идея: ${draft.logline}` : "",
    draft?.world ? `Мир: ${draft.world}` : "",
    episodeText,
  ].filter(Boolean).join("\n\n");
}

export default function SeriesCharacterStudio({ draft, updateDraft, episodes }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const cast = Array.isArray(draft?.cast) ? draft.cast.map(normalizeCharacter) : [];

  function setCast(nextCast, patch = {}) {
    updateDraft({ ...patch, cast: nextCast.map(normalizeCharacter), charactersMode: patch.charactersMode || draft?.charactersMode || "hybrid" });
  }

  function updateCharacter(index, patch) {
    setCast(cast.map((c, i) => i === index ? normalizeCharacter({ ...c, ...patch }, i) : c));
  }

  function removeCharacter(index) {
    const removed = cast[index];
    const nextCast = cast.filter((_, i) => i !== index).map(normalizeCharacter);
    const nextEpisodes = (episodes || []).map((ep) => ({
      ...ep,
      characters_present: Array.isArray(ep.characters_present) ? ep.characters_present.filter((x) => x !== removed?.ui_label_ru && x !== removed?.name) : [],
    }));
    setCast(nextCast, { episodes: nextEpisodes });
  }

  function addManual() {
    if (!name.trim()) {
      alert("Введите имя или роль героя");
      return;
    }
    const character = normalizeCharacter({
      name: name.trim(),
      ui_label_ru: name.trim(),
      role: role.trim() || "герой сериала",
      reference_mode: "manual",
    }, cast.length);
    setCast([...cast, character], { charactersMode: "hybrid" });
    setName("");
    setRole("");
  }

  async function uploadRef(index, kind, file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const c = cast[index];
    updateCharacter(index, {
      reference_mode: "manual",
      reference_image: kind === "face" ? dataUrl : c.reference_image,
      reference_images: { ...(c.reference_images || {}), [kind]: dataUrl },
    });
  }

  function toggleEpisode(index, episodeIndex) {
    const c = cast[index];
    const label = c.ui_label_ru || c.name;
    const current = Array.isArray(c.appears_in_episodes) ? c.appears_in_episodes : [];
    const has = current.includes(episodeIndex);
    const nextAppears = has ? current.filter((x) => x !== episodeIndex) : [...current, episodeIndex].sort((a, b) => a - b);

    const nextEpisodes = (episodes || []).map((ep, i) => {
      const list = Array.isArray(ep.characters_present) ? ep.characters_present : [];
      if (i !== episodeIndex) return ep;
      return { ...ep, characters_present: has ? list.filter((x) => x !== label) : Array.from(new Set([...list, label])) };
    });

    const nextCast = cast.map((item, i) => i === index ? { ...item, appears_in_episodes: nextAppears } : item);
    setCast(nextCast, { episodes: nextEpisodes });
  }

  async function generateAutoCast() {
    const source = buildSeriesCastSource(draft, episodes);
    if (!source.trim()) {
      alert("Сначала заполни идею сериала или эпизоды.");
      return;
    }
    setBusy(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/character-bible", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          script: source,
          topic: draft?.title || "Сериал",
          tone: draft?.genre || "cinematic documentary thriller",
          projectType: "series",
          maxCharacters: 8,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) throw new Error(payload.error || `HTTP ${res.status}`);
      const chars = Array.isArray(payload.bible?.characters) ? payload.bible.characters : [];
      setCast(chars.map(normalizeCharacter), { charactersMode: "hybrid" });
    } catch (e) {
      alert(e?.message || "Не удалось найти героев");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nc-series-cast-studio">
      <div className="nc-series-cast-head">
        <div>
          <p className="nc-series-kicker">SERIES CHARACTER STUDIO</p>
          <h3>Герои сериала</h3>
          <p>Задай лица, полный рост, костюм и серии появления. Эти данные попадут в Character Bible и storyboard.</p>
        </div>
        <button type="button" onClick={generateAutoCast} disabled={busy}>{busy ? "Ищу героев..." : "⚡ Найти героев из сериала"}</button>
      </div>

      <div className="nc-series-choice-grid">
        {[{id:"auto",t:"Авто",d:"AI сам найдёт героев"},{id:"manual",t:"Свои",d:"Только ручные герои"},{id:"hybrid",t:"Авто + референсы",d:"Лучший режим для сериалов"}].map((x) => (
          <button key={x.id} type="button" className={draft?.charactersMode === x.id ? "active" : ""} onClick={() => updateDraft({ charactersMode: x.id })}>
            <b>{x.t}</b><span>{x.d}</span>
          </button>
        ))}
      </div>

      <div className="nc-series-cast-add-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя / роль героя" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Роль в истории" />
        <button type="button" onClick={addManual}>＋ Добавить вручную</button>
      </div>

      {!cast.length && <div className="nc-series-story-empty">Героев пока нет. Нажми “Найти героев из сериала” или добавь вручную.</div>}

      <div className="nc-series-cast-grid">
        {cast.map((c, index) => (
          <article key={c.id || index} className="nc-series-character-card">
            <div className="nc-series-character-top">
              <div className="nc-series-character-avatar">{c.reference_images?.face ? <img src={c.reference_images.face} alt="face" /> : <span>{String(c.ui_label_ru || c.name || "?").slice(0, 1)}</span>}</div>
              <div>
                <input value={c.ui_label_ru || c.name || ""} onChange={(e) => updateCharacter(index, { name: e.target.value, ui_label_ru: e.target.value })} />
                <select value={ruImportance(c.importance)} onChange={(e) => updateCharacter(index, { importance: enImportance(e.target.value) })}>
                  <option value="главный">главный</option>
                  <option value="второстепенный">второстепенный</option>
                  <option value="фон">фон</option>
                </select>
              </div>
              <button type="button" onClick={() => removeCharacter(index)}>Удалить</button>
            </div>

            <label>Роль<input value={c.role || ""} onChange={(e) => updateCharacter(index, { role: e.target.value })} /></label>
            <label>Лицо / identity lock<textarea value={c.face_lock_en || ""} onChange={(e) => updateCharacter(index, { face_lock_en: e.target.value })} /></label>
            <label>Полный рост / body lock<textarea value={c.body_lock_en || ""} onChange={(e) => updateCharacter(index, { body_lock_en: e.target.value })} /></label>
            <label>Костюм / clothing lock<textarea value={c.clothing_lock_en || ""} onChange={(e) => updateCharacter(index, { clothing_lock_en: e.target.value })} /></label>
            <label>Continuity notes<textarea value={c.continuity_notes_en || ""} onChange={(e) => updateCharacter(index, { continuity_notes_en: e.target.value })} /></label>

            <div className="nc-series-ref-row">
              {[
                ["face", "Лицо"],
                ["full_body", "Полный рост"],
                ["costume", "Костюм"],
              ].map(([kind, label]) => (
                <label key={kind} className={c.reference_images?.[kind] ? "has-ref" : ""}>
                  {c.reference_images?.[kind] ? <img src={c.reference_images[kind]} alt={label} /> : <span>{label}</span>}
                  <input type="file" accept="image/*" onChange={(e) => uploadRef(index, kind, e.target.files?.[0])} />
                </label>
              ))}
            </div>

            {!!episodes?.length && <div className="nc-series-appear-grid">
              <b>Появляется в сериях:</b>
              <div>{episodes.map((ep, epIndex) => <button type="button" key={ep.id || epIndex} className={c.appears_in_episodes?.includes(epIndex) ? "active" : ""} onClick={() => toggleEpisode(index, epIndex)}>{epIndex + 1}</button>)}</div>
            </div>}
          </article>
        ))}
      </div>
    </div>
  );
}
