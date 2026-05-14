"use client";

import { useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const REF_SLOTS = [
  ["face", "Лицо"],
  ["full_body", "Полный рост"],
  ["costume", "Костюм"],
  ["three_quarter", "3/4 ракурс"],
  ["left_profile", "Левый профиль"],
  ["right_profile", "Правый профиль"],
  ["back_view", "Вид сзади"],
  ["extra_angle", "Доп. ракурс"],
];

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

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function countRefs(c = {}) {
  const refs = c.reference_images || {};
  return REF_SLOTS.filter(([key]) => !!refs[key]).length;
}

function buildPromptPack(c = {}, draft = {}) {
  const name = cleanText(c.ui_label_ru || c.name || "series character");
  const role = cleanText(c.role || "important character in the series");
  const tone = cleanText(draft?.genre || "cinematic documentary thriller");
  const world = cleanText(draft?.world || draft?.logline || "consistent cinematic series world");
  const face = cleanText(c.face_lock_en || "stable realistic face, natural asymmetry, visible pores, human imperfections");
  const body = cleanText(c.body_lock_en || "natural body language and documentary posture");
  const clothes = cleanText(c.clothing_lock_en || "costume follows the story world and stays consistent");
  const emotion = cleanText(c.emotion_lock_en || "emotionally believable, restrained cinematic behavior");
  const continuity = cleanText(c.continuity_notes_en || "Keep the same identity, face, body, costume logic and emotional truth in every episode.");
  const negative = "NEGATIVE PROMPT: doll face, wax skin, plastic skin, model posing, fashion shoot, anime, cartoon, over-smoothed face, extra fingers, deformed hands, different person, inconsistent costume, random age change, random hair change, random body type, glossy CGI, low realism, generic stock photo look, costume drift, age drift, face drift.";

  return {
    face: `FACE REFERENCE for ${name}: ${role}. ${tone}. Close realistic portrait, ${face}. Natural skin texture, visible pores, slight asymmetry, believable eyes, no beauty filter, no plastic skin. World context: ${world}. Use as identity anchor for all future storyboard frames.`,
    full_body: `FULL BODY REFERENCE for ${name}: ${role}. ${tone}. Full-length realistic character reference, ${body}. Neutral readable pose, head-to-toe silhouette, proportional body, natural posture, production design consistent with: ${world}. Keep face identity aligned with face reference.`,
    costume: `COSTUME REFERENCE for ${name}: ${role}. ${tone}. Detailed wardrobe sheet, ${clothes}. Show fabric, age, wear, color logic, accessories, shoes, practical story details. Must stay usable across episodes and frame grid continuity.`,
    three_quarter: `THREE QUARTER REFERENCE for ${name}: ${role}. Realistic 3/4 view, same face identity as portrait, ${face}. Show head, shoulders and upper body with readable silhouette. ${tone}.`,
    left_profile: `LEFT PROFILE REFERENCE for ${name}: strict left side profile, same person, same skull shape, nose line, jawline, ear placement, hairline and age. ${face}. Cinematic neutral lighting, no beauty retouch.`,
    right_profile: `RIGHT PROFILE REFERENCE for ${name}: strict right side profile, same person, same skull shape, nose line, jawline, ear placement, hairline and age. ${face}. Cinematic neutral lighting, no beauty retouch.`,
    back_view: `BACK VIEW REFERENCE for ${name}: back view full body, same body type and costume logic. Show hair shape, shoulders, silhouette, clothing back details, shoes and posture. ${clothes}.`,
    extra_angle: `EXTRA ANGLE REFERENCE for ${name}: cinematic reference angle for continuity, same face, age, body, costume and emotional baseline. ${face}. ${body}.`,
    quick_card: `QUICK CHARACTER REFERENCE CARD for ${name}: create a clean 2x2 model sheet on one image: 1) close portrait, 2) half body, 3) full body front, 4) costume detail. ${tone}. ${face}. ${body}. ${clothes}. Neutral readable lighting, consistent identity across all panels, no random changes.`,
    turnaround: `FULL 360 CHARACTER TURNAROUND SHEET for ${name}: one clean model sheet with front view, 3/4 left, left profile, back view, right profile, 3/4 right, full body front, full body back, and one neutral expression sample. Same face structure, same age, same body type, same costume, same hairline, same skin tone in every panel. ${tone}. ${world}.`,
    costume_sheet: `COSTUME SHEET for ${name}: detailed wardrobe reference sheet, front/back costume, fabric closeups, shoes, accessories, wear and aging, color palette, practical story logic. ${clothes}. Keep same identity and body type.`,
    expression_sheet: `EXPRESSION SHEET for ${name}: same face identity across neutral, fear, anger, sadness, suspicion, exhaustion, determination. ${emotion}. Natural human micro-expressions, visible pores, no cartoon exaggeration, no face drift.`,
    continuity: `CHARACTER CONTINUITY LOCK: ${name} is ${role}. ${continuity} Maintain EXACT same identity, face structure, age, body type, clothing logic, hairline, skin tone, silhouette and emotional realism across every episode and frame.`,
    negative,
  };
}

function normalizeCharacter(c = {}, index = 0, draft = {}) {
  const refs = c.reference_images || {};
  const base = {
    id: c.id || makeId(index),
    name: c.name || c.ui_label_ru || `Герой ${index + 1}`,
    ui_label_ru: c.ui_label_ru || c.name || `Герой ${index + 1}`,
    role: c.role || "герой сериала",
    importance: c.importance || (index === 0 ? "main" : "supporting"),
    age_range: c.age_range || "adult",
    face_lock_en: c.face_lock_en || "stable realistic face, natural asymmetry, visible pores, cinematic documentary realism",
    body_lock_en: c.body_lock_en || "natural documentary posture and body language",
    clothing_lock_en: c.clothing_lock_en || "costume follows series world and role",
    emotion_lock_en: c.emotion_lock_en || "emotionally believable, not model-like",
    continuity_notes_en: c.continuity_notes_en || "Keep the same identity in every episode and storyboard frame where this character appears.",
    appears_in_episodes: Array.isArray(c.appears_in_episodes) ? c.appears_in_episodes : [],
    reference_mode: c.reference_image || Object.values(refs).some(Boolean) ? "manual" : (c.reference_mode || "auto"),
    reference_image: c.reference_image || refs.face || null,
    reference_images: {
      face: refs.face || c.reference_image || null,
      full_body: refs.full_body || null,
      costume: refs.costume || null,
      three_quarter: refs.three_quarter || null,
      left_profile: refs.left_profile || null,
      right_profile: refs.right_profile || null,
      back_view: refs.back_view || null,
      extra_angle: refs.extra_angle || null,
    },
  };
  return { ...base, reference_prompts: { ...buildPromptPack(base, draft), ...(c.reference_prompts || {}) } };
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

async function copyText(text) {
  await navigator.clipboard.writeText(String(text || ""));
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

export default function SeriesCharacterStudio({ draft, updateDraft, episodes }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [copied, setCopied] = useState("");

  const cast = useMemo(() => Array.isArray(draft?.cast) ? draft.cast.map((c, i) => normalizeCharacter(c, i, draft)) : [], [draft]);
  const totalRefs = cast.reduce((sum, c) => sum + countRefs(c), 0);

  function setCast(nextCast, patch = {}) {
    updateDraft({ ...patch, cast: nextCast.map((c, i) => normalizeCharacter(c, i, draft)), charactersMode: patch.charactersMode || draft?.charactersMode || "hybrid" });
  }

  function updateCharacter(index, patch) {
    setCast(cast.map((c, i) => i === index ? normalizeCharacter({ ...c, ...patch }, i, draft) : c));
  }

  function removeCharacter(index) {
    const removed = cast[index];
    const nextCast = cast.filter((_, i) => i !== index).map((c, i) => normalizeCharacter(c, i, draft));
    const nextEpisodes = (episodes || []).map((ep) => ({
      ...ep,
      characters_present: Array.isArray(ep.characters_present) ? ep.characters_present.filter((x) => x !== removed?.ui_label_ru && x !== removed?.name) : [],
    }));
    setCast(nextCast, { episodes: nextEpisodes });
  }

  function duplicateCharacter(index) {
    const c = cast[index];
    const next = normalizeCharacter({ ...c, id: makeId(cast.length), name: `${c.name} copy`, ui_label_ru: `${c.ui_label_ru || c.name} copy` }, cast.length, draft);
    setCast([...cast, next]);
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
    }, cast.length, draft);
    setCast([...cast, character], { charactersMode: "hybrid" });
    setName("");
    setRole("");
  }

  function autoFillCharacter(index) {
    const c = cast[index];
    const nameText = cleanText(c.ui_label_ru || c.name || `Герой ${index + 1}`);
    const roleText = cleanText(c.role || "герой сериала");
    const world = cleanText(draft?.world || draft?.logline || "series world");
    const next = normalizeCharacter({
      ...c,
      face_lock_en: `${nameText}: realistic human face for ${roleText}; stable bone structure, natural asymmetry, visible pores, tired eyes, believable skin texture, not model-like.`,
      body_lock_en: `${nameText}: body language matches role (${roleText}); natural posture, practical movement, realistic proportions, readable silhouette for vertical cinema.`,
      clothing_lock_en: `${nameText}: costume must reflect ${world}; consistent fabric, wear, color palette, accessories and social status across episodes.`,
      emotion_lock_en: `${nameText}: emotions are restrained, cinematic, believable; no exaggerated acting unless the scene demands it.`,
      continuity_notes_en: `${nameText}: keep EXACT same face identity, age, body type, costume logic and emotional baseline across every episode and storyboard frame.`,
      reference_mode: c.reference_mode || "auto",
    }, index, draft);
    updateCharacter(index, { ...next, reference_prompts: buildPromptPack(next, draft) });
  }

  function autoFillAllProfiles() {
    if (!cast.length) {
      alert("Сначала найди героев из сериала или добавь вручную.");
      return;
    }
    const next = cast.map((c, index) => {
      const nameText = cleanText(c.ui_label_ru || c.name || `Герой ${index + 1}`);
      const roleText = cleanText(c.role || "герой сериала");
      const world = cleanText(draft?.world || draft?.logline || "series world");
      const character = normalizeCharacter({
        ...c,
        face_lock_en: c.face_lock_en?.includes("stable realistic face") ? `${nameText}: realistic human face for ${roleText}; stable bone structure, natural asymmetry, visible pores, tired eyes, believable skin texture, not model-like.` : c.face_lock_en,
        body_lock_en: c.body_lock_en?.includes("natural documentary") ? `${nameText}: body language matches role (${roleText}); natural posture, practical movement, realistic proportions, readable silhouette for vertical cinema.` : c.body_lock_en,
        clothing_lock_en: c.clothing_lock_en?.includes("costume follows") ? `${nameText}: costume must reflect ${world}; consistent fabric, wear, color palette, accessories and social status across episodes.` : c.clothing_lock_en,
        continuity_notes_en: c.continuity_notes_en?.includes("Keep the same identity") ? `${nameText}: keep EXACT same face identity, age, body type, costume logic and emotional baseline across every episode and storyboard frame.` : c.continuity_notes_en,
      }, index, draft);
      return { ...character, reference_prompts: buildPromptPack(character, draft) };
    });
    setCast(next, { charactersMode: "hybrid" });
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

  function removeRef(index, kind) {
    const c = cast[index];
    updateCharacter(index, {
      reference_images: { ...(c.reference_images || {}), [kind]: null },
      reference_image: kind === "face" ? null : c.reference_image,
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
      const next = chars.map((c, i) => normalizeCharacter(c, i, draft)).map((c) => ({ ...c, reference_prompts: buildPromptPack(c, draft) }));
      setCast(next, { charactersMode: "hybrid" });
    } catch (e) {
      alert(e?.message || "Не удалось найти героев");
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt(label, text) {
    await copyText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function copyContinuityPack(c, index) {
    const pack = normalizeCharacter(c, index, draft);
    return copyPrompt(`${c.id}-pack`, JSON.stringify({
      id: pack.id,
      name: pack.ui_label_ru || pack.name,
      role: pack.role,
      importance: pack.importance,
      face_lock_en: pack.face_lock_en,
      body_lock_en: pack.body_lock_en,
      clothing_lock_en: pack.clothing_lock_en,
      emotion_lock_en: pack.emotion_lock_en,
      continuity_notes_en: pack.continuity_notes_en,
      reference_slots_ready: countRefs(pack),
      appears_in_episodes: pack.appears_in_episodes,
      reference_prompts: pack.reference_prompts,
    }, null, 2));
  }

  return (
    <div className="nc-series-cast-studio">
      <div className="nc-series-cast-head">
        <div>
          <p className="nc-series-kicker">CHARACTER REFERENCE STUDIO</p>
          <h3>Герои сериала и reference pack</h3>
          <p>AI создаёт героев, DNA, промты, 360-card и continuity. Ты можешь загрузить свои референсы, если нужно жёстко зафиксировать образ.</p>
          <div className="nc-series-cast-status">{cast.length} героев · {draft?.charactersMode || "hybrid"} mode · refs: {totalRefs}/{Math.max(1, cast.length * REF_SLOTS.length)} · continuity ready</div>
        </div>
        <div className="nc-series-cast-head-actions">
          <button type="button" onClick={generateAutoCast} disabled={busy}>{busy ? "Ищу героев..." : "⚡ Авто-герои"}</button>
          <button type="button" onClick={autoFillAllProfiles} disabled={!cast.length}>🧠 Авто DNA + промты</button>
        </div>
      </div>

      <div className="nc-series-character-help">
        <b>Как это работает:</b>
        <span>Авто — NeuroCine сам создаёт героев, роли, внешний вид и prompt pack.</span>
        <span>Свои refs — ты загружаешь лицо, полный рост, костюм и ракурсы.</span>
        <span>Hybrid — AI пишет промты, а ты фиксируешь внешность своими изображениями.</span>
      </div>

      <div className="nc-series-choice-grid">
        {[{id:"auto",t:"Авто",d:"AI сам найдёт героев и заполнит профили"},{id:"manual",t:"Свои refs",d:"Ты загружаешь референсы вручную"},{id:"hybrid",t:"Hybrid",d:"Промты от AI + твои изображения"}].map((x) => (
          <button key={x.id} type="button" className={draft?.charactersMode === x.id ? "active" : ""} onClick={() => updateDraft({ charactersMode: x.id })}>
            <b>{x.t}</b><span>{x.d}</span>
          </button>
        ))}
      </div>

      <div className="nc-series-cast-add-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя / роль героя для ручной правки" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Роль в истории, если знаешь" />
        <button type="button" onClick={addManual}>＋ Добавить вручную</button>
      </div>

      {!cast.length && <div className="nc-series-story-empty">Героев пока нет. Нажми “Авто-герои” — сайт сам создаст героев, DNA и промты для референс-карт.</div>}

      <div className="nc-series-cast-grid">
        {cast.map((c, index) => {
          const prompts = { ...buildPromptPack(c, draft), ...(c.reference_prompts || {}) };
          const readyRefs = countRefs(c);
          return (
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
                  <small>refs: {readyRefs}/{REF_SLOTS.length} · prompt pack ready</small>
                </div>
                <div className="nc-series-character-card-actions"><button type="button" onClick={() => duplicateCharacter(index)}>Дублировать</button><button type="button" onClick={() => removeCharacter(index)}>Удалить</button></div>
              </div>

              <div className="nc-series-dna-grid">
                <label>Роль<input value={c.role || ""} onChange={(e) => updateCharacter(index, { role: e.target.value })} /></label>
                <label>Возрастной диапазон<input value={c.age_range || "adult"} onChange={(e) => updateCharacter(index, { age_range: e.target.value })} /></label>
                <label>Лицо / identity lock<textarea value={c.face_lock_en || ""} onChange={(e) => updateCharacter(index, { face_lock_en: e.target.value, reference_prompts: buildPromptPack({ ...c, face_lock_en: e.target.value }, draft) })} /></label>
                <label>Тело / силуэт<textarea value={c.body_lock_en || ""} onChange={(e) => updateCharacter(index, { body_lock_en: e.target.value, reference_prompts: buildPromptPack({ ...c, body_lock_en: e.target.value }, draft) })} /></label>
                <label>Костюм<textarea value={c.clothing_lock_en || ""} onChange={(e) => updateCharacter(index, { clothing_lock_en: e.target.value, reference_prompts: buildPromptPack({ ...c, clothing_lock_en: e.target.value }, draft) })} /></label>
                <label>Эмоция / поведение<textarea value={c.emotion_lock_en || ""} onChange={(e) => updateCharacter(index, { emotion_lock_en: e.target.value, reference_prompts: buildPromptPack({ ...c, emotion_lock_en: e.target.value }, draft) })} /></label>
                <label className="nc-series-dna-wide">Continuity notes<textarea value={c.continuity_notes_en || ""} onChange={(e) => updateCharacter(index, { continuity_notes_en: e.target.value, reference_prompts: buildPromptPack({ ...c, continuity_notes_en: e.target.value }, draft) })} /></label>
                <button type="button" onClick={() => autoFillCharacter(index)}>🧠 Пересобрать DNA автоматически</button>
              </div>

              <div className="nc-series-ref-title"><b>REFERENCE SLOTS</b><span>{readyRefs}/{REF_SLOTS.length} загружено</span></div>
              <div className="nc-series-ref-row nc-series-ref-row-v3">
                {REF_SLOTS.map(([kind, label]) => (
                  <div key={kind} className={`nc-series-ref-slot ${c.reference_images?.[kind] ? "has-ref" : ""}`}>
                    <label>
                      {c.reference_images?.[kind] ? <img src={c.reference_images[kind]} alt={label} /> : <span>{label}<small>загрузить</small></span>}
                      <input type="file" accept="image/*" onChange={(e) => uploadRef(index, kind, e.target.files?.[0])} />
                    </label>
                    <div><button type="button" onClick={() => copyPrompt(`${c.id}-${kind}`, prompts[kind] || prompts.extra_angle)}>{copied === `${c.id}-${kind}` ? "✓" : "Промт"}</button>{c.reference_images?.[kind] && <button type="button" onClick={() => removeRef(index, kind)}>×</button>}</div>
                  </div>
                ))}
              </div>

              <details className="nc-series-prompt-box" open>
                <summary>🎴 Reference Card Generator</summary>
                {[
                  ["quick_card", "Quick Reference Card", prompts.quick_card],
                  ["turnaround", "Full 360 Card", prompts.turnaround],
                  ["costume_sheet", "Costume Sheet", prompts.costume_sheet],
                  ["expression_sheet", "Expression Sheet", prompts.expression_sheet],
                ].map(([key, label, text]) => (
                  <div key={key} className="nc-series-prompt-item">
                    <b>{label}</b>
                    <p>{text}</p>
                    <button type="button" onClick={() => copyPrompt(`${c.id}-${key}`, text)}>{copied === `${c.id}-${key}` ? "Скопировано" : "Копировать"}</button>
                  </div>
                ))}
              </details>

              <details className="nc-series-prompt-box">
                <summary>🎨 Prompt Pack</summary>
                {[
                  ["face", "Face reference prompt", prompts.face],
                  ["full_body", "Full body prompt", prompts.full_body],
                  ["costume", "Costume prompt", prompts.costume],
                  ["continuity", "Continuity lock", prompts.continuity],
                  ["negative", "Negative prompt", prompts.negative],
                ].map(([key, label, text]) => (
                  <div key={key} className="nc-series-prompt-item">
                    <b>{label}</b>
                    <p>{text}</p>
                    <button type="button" onClick={() => copyPrompt(`${c.id}-${key}`, text)}>{copied === `${c.id}-${key}` ? "Скопировано" : "Копировать"}</button>
                  </div>
                ))}
              </details>

              {!!episodes?.length && <div className="nc-series-appear-grid">
                <b>Появляется в сериях:</b>
                <div>{episodes.map((ep, epIndex) => <button type="button" key={ep.id || epIndex} className={c.appears_in_episodes?.includes(epIndex) ? "active" : ""} onClick={() => toggleEpisode(index, epIndex)}>{epIndex + 1}</button>)}</div>
              </div>}

              <details className="nc-series-continuity-pack">
                <summary>🧬 CHARACTER CONTINUITY PACK</summary>
                <p>{prompts.continuity}</p>
                <div><button type="button" onClick={() => copyContinuityPack(c, index)}>{copied === `${c.id}-pack` ? "Скопировано" : "Скопировать pack"}</button><button type="button" onClick={() => downloadJson(`${c.id || "character"}-continuity-pack.json`, normalizeCharacter(c, index, draft))}>Скачать JSON</button></div>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
