"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORE_KEY = "neurocine:character-bible:v1";

function safeJson(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function fieldByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((x) => String(x.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
  if (!label) return null;
  const wrap = label.closest(".setup-field-v40, .setup-manual-v40, .setup-main-v40") || label.parentElement;
  return wrap?.querySelector?.("input, textarea") || null;
}

function getSetupValues() {
  return {
    projectName: fieldByLabel("название проекта")?.value || "NeuroCine Project",
    topic: document.querySelector("textarea.setup-topic-v40")?.value || fieldByLabel("тема ролика")?.value || "",
    script: document.querySelector("textarea.setup-script-v40")?.value || fieldByLabel("готовый сценарий")?.value || "",
    tone: fieldByLabel("тон")?.value || "cinematic documentary thriller",
    projectType: "film",
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeCharacter(c = {}, i = 0) {
  return {
    id: c.id || `char_${String(i + 1).padStart(2, "0")}`,
    name: c.name || `Character ${i + 1}`,
    ui_label_ru: c.ui_label_ru || c.name || `Герой ${i + 1}`,
    role: c.role || "character",
    importance: c.importance || (i === 0 ? "main" : "supporting"),
    age_range: c.age_range || "adult",
    gender_presentation: c.gender_presentation || "unspecified",
    face_lock_en: c.face_lock_en || "stable realistic face, natural asymmetry, visible pores",
    body_lock_en: c.body_lock_en || "natural documentary posture and body language",
    clothing_lock_en: c.clothing_lock_en || "costume follows script world and period",
    emotion_lock_en: c.emotion_lock_en || "emotionally believable, not model-like",
    continuity_notes_en: c.continuity_notes_en || "Keep this identity consistent in every frame where this character appears.",
    appears_in: c.appears_in || "derive from storyboard",
    reference_mode: c.reference_image ? "manual" : (c.reference_mode || "auto"),
    reference_image: c.reference_image || null,
  };
}

function emptyBible() {
  return {
    version: "1.0-local",
    mode: "hybrid",
    project_type: "film",
    cast_strategy: "auto_manual_hybrid",
    world_notes_en: "Maintain consistent world, period, lighting, costume logic and documentary realism.",
    characters: [],
  };
}

function loadBible() {
  if (typeof window === "undefined") return emptyBible();
  const parsed = safeJson(localStorage.getItem(STORE_KEY), null);
  if (!parsed || typeof parsed !== "object") return emptyBible();
  return {
    ...emptyBible(),
    ...parsed,
    characters: Array.isArray(parsed.characters) ? parsed.characters.map(normalizeCharacter) : [],
  };
}

function saveBible(bible) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(bible)); } catch {}
  window.dispatchEvent(new CustomEvent("neurocine:character-bible-updated", { detail: bible }));
}

function bibleToPromptBlock(bible) {
  const chars = Array.isArray(bible?.characters) ? bible.characters : [];
  if (!chars.length) return "";
  const rows = chars.slice(0, 12).map((c, i) => {
    const ref = c.reference_image ? "MANUAL REFERENCE IMAGE EXISTS: use it as identity anchor if uploaded to the image model." : "AUTO TEXT IDENTITY: use text lock as identity anchor.";
    return `${c.id || `char_${i + 1}`} / ${c.name || c.ui_label_ru}: ${c.role || "character"}. Importance: ${c.importance || "supporting"}. ${ref}\nFace: ${c.face_lock_en}\nBody: ${c.body_lock_en}\nClothing: ${c.clothing_lock_en}\nEmotion: ${c.emotion_lock_en}\nContinuity: ${c.continuity_notes_en}`;
  }).join("\n\n");
  return `\n\nCHARACTER BIBLE LOCK — USE FOR ALL STORYBOARD GRID FRAMES:\nMode: ${bible.mode || "hybrid"}. World notes: ${bible.world_notes_en || "consistent cinematic world"}.\n${rows}\n\nFRAME CHARACTER RULE:\nFor every frame, identify which Character Bible entries appear. Preserve exact face, body, clothing logic and emotional behavior. If a manual reference exists, the user may upload it to the image model; treat it as the highest-priority identity anchor. Do not invent new faces for recurring heroes. Background people may vary, main heroes may not.\n`;
}

function addCharacterBlockToText(text, bible) {
  const value = String(text || "");
  const block = bibleToPromptBlock(bible);
  if (!block || /CHARACTER BIBLE LOCK — USE FOR ALL STORYBOARD GRID FRAMES/i.test(value)) return value;
  if (/\n\nFRAMES:/i.test(value)) return value.replace(/\n\nFRAMES:/i, `${block}\n\nFRAMES:`);
  if (/\n\nFINAL CHECK:/i.test(value)) return value.replace(/\n\nFINAL CHECK:/i, `${block}\n\nFINAL CHECK:`);
  return `${value}${block}`;
}

function AddManualCharacter({ onAdd }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  return (
    <div className="nc-cast-add">
      <input placeholder="Имя / роль" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Роль в истории" value={role} onChange={(e) => setRole(e.target.value)} />
      <button type="button" onClick={() => {
        if (!name.trim()) return;
        onAdd({ name: name.trim(), ui_label_ru: name.trim(), role: role.trim() || "manual character", reference_mode: "manual" });
        setName(""); setRole("");
      }}>+ Герой</button>
    </div>
  );
}

export function getCharacterBiblePromptBlock() {
  return bibleToPromptBlock(loadBible());
}

export function applyCharacterBibleToPrompt(text = "") {
  return addCharacterBlockToText(text, loadBible());
}

export default function CharacterBiblePatch() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bible, setBible] = useState(emptyBible());

  useEffect(() => {
    setMounted(true);
    setBible(loadBible());
    const onUpdate = () => setBible(loadBible());
    window.addEventListener("storage", onUpdate);
    window.addEventListener("neurocine:character-bible-updated", onUpdate);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("neurocine:character-bible-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    const originalWriteText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (originalWriteText) {
      navigator.clipboard.writeText = (text) => originalWriteText(addCharacterBlockToText(text, loadBible()));
    }
    const OriginalBlob = window.Blob;
    function CharacterBlob(parts = [], options = {}) {
      try {
        const nextParts = Array.isArray(parts)
          ? parts.map((part) => typeof part === "string" ? addCharacterBlockToText(part, loadBible()) : part)
          : parts;
        return new OriginalBlob(nextParts, options);
      } catch {
        return new OriginalBlob(parts, options);
      }
    }
    CharacterBlob.prototype = OriginalBlob.prototype;
    Object.setPrototypeOf(CharacterBlob, OriginalBlob);
    window.Blob = CharacterBlob;
    return () => {
      if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
      window.Blob = OriginalBlob;
    };
  }, []);

  const chars = useMemo(() => Array.isArray(bible.characters) ? bible.characters : [], [bible]);

  function updateBible(next) {
    const normalized = { ...next, characters: (next.characters || []).map(normalizeCharacter) };
    setBible(normalized);
    saveBible(normalized);
  }

  async function generateAuto() {
    const setup = getSetupValues();
    if (!setup.script && !setup.topic) {
      alert("Сначала нужен сценарий или тема.");
      return;
    }
    setBusy(true);
    try {
      let token = "";
      if (isSupabaseConfigured && supabase?.auth?.getSession) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || "";
      }
      const res = await fetch("/api/character-bible", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(setup),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) throw new Error(payload.error || `HTTP ${res.status}`);
      updateBible({ ...emptyBible(), ...(payload.bible || {}), mode: "hybrid" });
    } catch (e) {
      alert(e?.message || "Не удалось создать героев");
    } finally {
      setBusy(false);
    }
  }

  async function uploadRef(index, file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const next = { ...bible, mode: "hybrid", characters: chars.map((c, i) => i === index ? { ...c, reference_image: dataUrl, reference_mode: "manual" } : c) };
    updateBible(next);
  }

  function updateChar(index, patch) {
    updateBible({ ...bible, mode: "hybrid", characters: chars.map((c, i) => i === index ? { ...c, ...patch } : c) });
  }

  function addManual(c) {
    updateBible({ ...bible, mode: "hybrid", characters: [...chars, normalizeCharacter(c, chars.length)] });
  }

  function removeChar(index) {
    updateBible({ ...bible, characters: chars.filter((_, i) => i !== index) });
  }

  function clearBible() {
    if (!confirm("Удалить Character Bible?")) return;
    updateBible(emptyBible());
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <button type="button" className="nc-cast-fab" onClick={() => setOpen(true)}>🎭 Герои</button>
      {open && (
        <div className="nc-cast-modal">
          <div className="nc-cast-panel">
            <div className="nc-cast-head">
              <div>
                <b>Character Bible</b>
                <span>Auto / Manual / Hybrid cast для сериалов, фильмов и клипов</span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="nc-cast-actions">
              <button type="button" onClick={generateAuto} disabled={busy}>{busy ? "Создаю..." : "Auto из сценария"}</button>
              <button type="button" onClick={() => updateBible({ ...bible, mode: "manual" })}>Manual</button>
              <button type="button" onClick={() => updateBible({ ...bible, mode: "hybrid" })}>Hybrid</button>
              <button type="button" onClick={clearBible}>Очистить героев</button>
            </div>

            <div className="nc-cast-mode">Режим: <strong>{bible.mode || "hybrid"}</strong> · героев: <strong>{chars.length}</strong></div>

            <AddManualCharacter onAdd={addManual} />

            <div className="nc-cast-list">
              {chars.length === 0 && <div className="nc-cast-empty">Пока героев нет. Нажми “Auto из сценария” или добавь вручную.</div>}
              {chars.map((c, i) => (
                <div className="nc-cast-card" key={c.id || i}>
                  <div className="nc-cast-avatar">
                    {c.reference_image ? <img src={c.reference_image} alt="ref" /> : <span>{String(c.name || "?").slice(0, 1)}</span>}
                  </div>
                  <div className="nc-cast-body">
                    <div className="nc-cast-row">
                      <input value={c.name || ""} onChange={(e) => updateChar(i, { name: e.target.value, ui_label_ru: e.target.value })} />
                      <select value={c.importance || "supporting"} onChange={(e) => updateChar(i, { importance: e.target.value })}>
                        <option value="main">main</option>
                        <option value="supporting">supporting</option>
                        <option value="background">background</option>
                      </select>
                    </div>
                    <textarea value={c.face_lock_en || ""} onChange={(e) => updateChar(i, { face_lock_en: e.target.value })} placeholder="Face lock" />
                    <textarea value={c.clothing_lock_en || ""} onChange={(e) => updateChar(i, { clothing_lock_en: e.target.value })} placeholder="Clothing lock" />
                    <div className="nc-cast-footer">
                      <label>
                        📎 Ref
                        <input type="file" accept="image/*" onChange={(e) => uploadRef(i, e.target.files?.[0])} />
                      </label>
                      <button type="button" onClick={() => updateChar(i, { reference_image: null, reference_mode: "auto" })}>Убрать ref</button>
                      <button type="button" onClick={() => removeChar(i)}>Удалить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="nc-cast-note">
              Character Bible автоматически добавляется в Frame Grid / Flow Compact prompts при копировании и скачивании. Для manual-ref загрузи это же лицо/костюм в генератор картинки как image reference.
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
