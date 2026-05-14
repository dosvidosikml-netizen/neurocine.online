"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORE_KEY = "neurocine:character-bible:v1";
const BIBLE_RE = /CHARACTER BIBLE LOCK — USE FOR ALL STORYBOARD GRID FRAMES:[\s\S]*?(?=\n\n(?:FRAMES:|FINAL CHECK:|SCRIPT JSON|\{|$))/gi;

function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
function isStudioRoute() { return typeof window !== "undefined" && window.location.pathname === "/storyboard"; }
function isAccountOrModalActive() {
  if (typeof document === "undefined") return false;
  const active = document.querySelector("#account, .user-dashboard-v43, .user-dashboard-final-v621, .nc-create-hub, .nc-drawer-wrap.open, .billing-panel, .cloud-projects-panel, .admin-panel");
  if (!active) return false;
  const rect = active.getBoundingClientRect?.();
  return !rect || rect.height > 40;
}
function isStudioReady() {
  if (typeof document === "undefined") return false;
  const setup = document.querySelector(".setup-v40");
  const storyboard = document.querySelector("#storyboard");
  const status = document.querySelector(".studio-status-bar-v33");
  if (!setup && !storyboard && !status) return false;
  return !isAccountOrModalActive();
}
function isVisualGridPrompt(text = "") { return /STORYBOARD GRID PART|FRAME GRID PROMPT|Generate exactly \d+ live-action cinematic frames|clean \d+×\d+ grid|FLOW COMPACT/i.test(String(text || "")); }
function stripCharacterBible(text = "") { return String(text || "").replace(BIBLE_RE, "").trim(); }

function fieldByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((x) => String(x.textContent || "").toLowerCase().includes(labelText.toLowerCase()));
  if (!label) return null;
  const wrap = label.closest(".setup-field-v40, .setup-manual-v40, .setup-main-v40") || label.parentElement;
  return wrap?.querySelector?.("input, textarea") || null;
}
function setNativeValue(el, value) {
  if (!el) return;
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc?.set) desc.set.call(el, value); else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}
function cleanScriptPollution() {
  const nodes = [document.querySelector("textarea.setup-script-v40"), document.querySelector("textarea.setup-topic-v40"), fieldByLabel("готовый сценарий"), fieldByLabel("тема ролика")].filter(Boolean);
  nodes.forEach((node) => {
    const value = node.value || "";
    const next = stripCharacterBible(value);
    if (next !== value) setNativeValue(node, next);
  });
}
function getSetupValues(maxCharacters = 4) {
  const script = stripCharacterBible(document.querySelector("textarea.setup-script-v40")?.value || fieldByLabel("готовый сценарий")?.value || "");
  const topic = stripCharacterBible(document.querySelector("textarea.setup-topic-v40")?.value || fieldByLabel("тема ролика")?.value || "");
  return {
    projectName: fieldByLabel("название проекта")?.value || "NeuroCine Project",
    topic, script,
    tone: fieldByLabel("тон")?.value || "cinematic documentary thriller",
    projectType: "shorts",
    maxCharacters,
  };
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
}
function ruImportance(v) { return v === "main" ? "главный" : v === "background" ? "фон" : "второстепенный"; }
function enImportance(v) { return v === "главный" ? "main" : v === "фон" ? "background" : v === "второстепенный" ? "supporting" : v; }
function normalizeCharacter(c = {}, i = 0) {
  return {
    id: c.id || `char_${String(i + 1).padStart(2, "0")}`,
    name: c.name || c.ui_label_ru || `Герой ${i + 1}`,
    ui_label_ru: c.ui_label_ru || c.name || `Герой ${i + 1}`,
    role: c.role || "персонаж",
    importance: enImportance(c.importance || (i === 0 ? "main" : "supporting")),
    face_lock_en: c.face_lock_en || "stable realistic face, natural asymmetry, visible pores",
    body_lock_en: c.body_lock_en || "natural documentary posture and body language",
    clothing_lock_en: c.clothing_lock_en || "costume follows script world and period",
    emotion_lock_en: c.emotion_lock_en || "emotionally believable, not model-like",
    continuity_notes_en: c.continuity_notes_en || "Keep this identity consistent in every frame where this character appears.",
    reference_mode: c.reference_image ? "manual" : (c.reference_mode || "auto"),
    reference_image: c.reference_image || null,
  };
}
function emptyBible() {
  return { version: "1.1-local", mode: "hybrid", project_type: "shorts", source_used: "none", source_preview: "", max_characters: 4, world_notes_en: "Maintain consistent world, period, lighting, costume logic and documentary realism.", characters: [] };
}
function loadBible() {
  if (typeof window === "undefined") return emptyBible();
  const parsed = safeJson(localStorage.getItem(STORE_KEY), null);
  if (!parsed || typeof parsed !== "object") return emptyBible();
  return { ...emptyBible(), ...parsed, characters: Array.isArray(parsed.characters) ? parsed.characters.map(normalizeCharacter) : [] };
}
function saveBible(bible) { try { localStorage.setItem(STORE_KEY, JSON.stringify(bible)); } catch {} window.dispatchEvent(new CustomEvent("neurocine:character-bible-updated", { detail: bible })); }
function bibleToPromptBlock(bible) {
  const chars = Array.isArray(bible?.characters) ? bible.characters : [];
  if (!chars.length) return "";
  const rows = chars.slice(0, 12).map((c, i) => {
    const ref = c.reference_image ? "MANUAL REFERENCE IMAGE EXISTS: use it as highest-priority identity anchor if uploaded to the image model." : "AUTO TEXT IDENTITY: use text lock as identity anchor.";
    return `${c.id || `char_${i + 1}`} / ${c.name || c.ui_label_ru}: ${c.role || "character"}. Importance: ${c.importance || "supporting"}. ${ref}\nFace: ${c.face_lock_en}\nBody: ${c.body_lock_en}\nClothing: ${c.clothing_lock_en}\nEmotion: ${c.emotion_lock_en}\nContinuity: ${c.continuity_notes_en}`;
  }).join("\n\n");
  return `\n\nCHARACTER BIBLE LOCK — USE FOR ALL STORYBOARD GRID FRAMES:\nMode: ${bible.mode || "hybrid"}. World notes: ${bible.world_notes_en || "consistent cinematic world"}.\n${rows}\n\nFRAME CHARACTER RULE:\nFor every frame, identify which Character Bible entries appear. Preserve exact face, body, clothing logic and emotional behavior. If a manual reference exists, the user may upload it to the image model; treat it as the highest-priority identity anchor. Do not invent new faces for recurring heroes. Background people may vary, main heroes may not.\n`;
}
function addCharacterBlockToText(text, bible) {
  const value = String(text || "");
  if (!isVisualGridPrompt(value)) return value;
  const block = bibleToPromptBlock(bible);
  if (!block || /CHARACTER BIBLE LOCK — USE FOR ALL STORYBOARD GRID FRAMES/i.test(value)) return value;
  if (/\n\nFRAMES:/i.test(value)) return value.replace(/\n\nFRAMES:/i, `${block}\n\nFRAMES:`);
  if (/\n\nFINAL CHECK:/i.test(value)) return value.replace(/\n\nFINAL CHECK:/i, `${block}\n\nFINAL CHECK:`);
  return `${value}${block}`;
}
export function applyCharacterBibleToPrompt(text = "") { return addCharacterBlockToText(text, loadBible()); }
export function getCharacterBiblePromptBlock() { return bibleToPromptBlock(loadBible()); }
export function cleanCharacterBibleFromText(text = "") { return stripCharacterBible(text); }

function AddManualCharacter({ onAdd }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const canAdd = !!name.trim();
  return <div className="nc-cast-add">
    <input placeholder="Имя или роль героя" value={name} onChange={(e) => setName(e.target.value)} />
    <input placeholder="Роль в истории" value={role} onChange={(e) => setRole(e.target.value)} />
    <button type="button" disabled={!canAdd} onClick={() => { if (!canAdd) { alert("Введите имя или роль героя"); return; } onAdd({ name: name.trim(), ui_label_ru: name.trim(), role: role.trim() || "ручной герой", reference_mode: "manual" }); setName(""); setRole(""); }}>Добавить героя вручную</button>
  </div>;
}

export default function CharacterBiblePatch() {
  const [mounted, setMounted] = useState(false);
  const [studioReady, setStudioReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [maxCharacters, setMaxCharacters] = useState(4);
  const [bible, setBible] = useState(emptyBible());

  useEffect(() => {
    setMounted(true); setBible(loadBible()); cleanScriptPollution();
    const check = () => {
      const ready = isStudioRoute() && isStudioReady();
      setStudioReady(ready);
      if (!ready) setOpen(false);
    };
    check(); const timer = setInterval(check, 450);
    const obs = new MutationObserver(() => { check(); cleanScriptPollution(); });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onUpdate = () => setBible(loadBible());
    const onRoute = () => window.setTimeout(check, 0);
    window.addEventListener("storage", onUpdate); window.addEventListener("neurocine:character-bible-updated", onUpdate);
    window.addEventListener("popstate", onRoute); window.addEventListener("hashchange", onRoute);
    return () => { clearInterval(timer); obs.disconnect(); window.removeEventListener("storage", onUpdate); window.removeEventListener("neurocine:character-bible-updated", onUpdate); window.removeEventListener("popstate", onRoute); window.removeEventListener("hashchange", onRoute); };
  }, []);

  const chars = useMemo(() => Array.isArray(bible.characters) ? bible.characters : [], [bible]);
  function updateBible(next) { const normalized = { ...next, characters: (next.characters || []).map(normalizeCharacter) }; setBible(normalized); saveBible(normalized); }
  async function generateAuto() {
    const setup = getSetupValues(maxCharacters);
    if (!setup.script && !setup.topic) { alert("Сначала нужен сценарий или тема."); return; }
    if (!confirm(`Найти героев из ${setup.script ? "текущего сценария" : "текущей темы"}? Максимум: ${maxCharacters}`)) return;
    setBusy(true);
    try {
      let token = "";
      if (isSupabaseConfigured && supabase?.auth?.getSession) { const { data } = await supabase.auth.getSession(); token = data?.session?.access_token || ""; }
      const res = await fetch("/api/character-bible", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(setup) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) throw new Error(payload.error || `HTTP ${res.status}`);
      updateBible({ ...emptyBible(), ...(payload.bible || {}), mode: "hybrid" });
    } catch (e) { alert(e?.message || "Не удалось создать героев"); } finally { setBusy(false); }
  }
  async function uploadRef(index, file) { if (!file) return; const dataUrl = await readFileAsDataUrl(file); updateBible({ ...bible, mode: "hybrid", characters: chars.map((c, i) => i === index ? { ...c, reference_image: dataUrl, reference_mode: "manual" } : c) }); }
  function updateChar(index, patch) { updateBible({ ...bible, mode: "hybrid", characters: chars.map((c, i) => i === index ? { ...c, ...patch } : c) }); }
  function addManual(c) { updateBible({ ...bible, mode: "hybrid", characters: [...chars, normalizeCharacter(c, chars.length)] }); }
  function removeChar(index) { updateBible({ ...bible, characters: chars.filter((_, i) => i !== index) }); }
  function clearBible() { if (confirm("Удалить героев проекта?")) updateBible(emptyBible()); }

  if (!mounted || !studioReady) return null;
  return createPortal(<>
    <button type="button" className="nc-cast-fab" onClick={() => setOpen(true)}>🎭 Герои</button>
    {open && <div className="nc-cast-modal"><div className="nc-cast-panel">
      <div className="nc-cast-head"><div><b>Герои проекта</b><span>Авто / свои герои / авто + референсы для сериалов, фильмов и клипов</span></div><button type="button" onClick={() => setOpen(false)}>×</button></div>
      <div className="nc-cast-actions">
        <button type="button" onClick={generateAuto} disabled={busy}>{busy ? "Ищу героев..." : "Найти героев в сценарии"}</button>
        <button type="button" onClick={() => updateBible({ ...bible, mode: "manual" })}>Свои герои</button>
        <button type="button" onClick={() => updateBible({ ...bible, mode: "hybrid" })}>Авто + референсы</button>
        <button type="button" onClick={clearBible}>Очистить героев</button>
      </div>
      <div className="nc-cast-mode">Режим: <strong>{bible.mode === "manual" ? "свои герои" : bible.mode === "hybrid" ? "авто + референсы" : "авто"}</strong> · героев: <strong>{chars.length}</strong> · источник: <strong>{bible.source_used === "script" ? "сценарий" : bible.source_used === "topic" ? "тема" : "не задан"}</strong></div>
      <div className="nc-cast-mode">Сколько искать: <select value={maxCharacters} onChange={(e) => setMaxCharacters(Number(e.target.value))}><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option><option value={8}>8</option><option value={12}>12</option></select></div>
      {bible.source_preview && <div className="nc-cast-note">Источник: {String(bible.source_preview).slice(0, 180)}...</div>}
      <AddManualCharacter onAdd={addManual} />
      <div className="nc-cast-list">
        {chars.length === 0 && <div className="nc-cast-empty">Пока героев нет. Нажми “Найти героев в сценарии” или добавь вручную.</div>}
        {chars.map((c, i) => <div className="nc-cast-card" key={c.id || i}>
          <div className="nc-cast-avatar">{c.reference_image ? <img src={c.reference_image} alt="ref" /> : <span>{String(c.ui_label_ru || c.name || "?").slice(0, 1)}</span>}</div>
          <div className="nc-cast-body">
            <div className="nc-cast-row"><input value={c.ui_label_ru || c.name || ""} onChange={(e) => updateChar(i, { name: e.target.value, ui_label_ru: e.target.value })} /><select value={ruImportance(c.importance)} onChange={(e) => updateChar(i, { importance: enImportance(e.target.value) })}><option value="главный">главный</option><option value="второстепенный">второстепенный</option><option value="фон">фон</option></select></div>
            <textarea value={c.face_lock_en || ""} onChange={(e) => updateChar(i, { face_lock_en: e.target.value })} placeholder="Описание лица для генератора" />
            <textarea value={c.clothing_lock_en || ""} onChange={(e) => updateChar(i, { clothing_lock_en: e.target.value })} placeholder="Костюм / одежда / силуэт" />
            <div className="nc-cast-footer"><label>Загрузить референс героя<input type="file" accept="image/*" onChange={(e) => uploadRef(i, e.target.files?.[0])} /></label><button type="button" onClick={() => updateChar(i, { reference_image: null, reference_mode: "auto" })}>Убрать ref</button><button type="button" onClick={() => removeChar(i)}>Удалить</button></div>
          </div></div>)}
      </div>
      <div className="nc-cast-note">Герои добавляются только в Frame Grid / Flow Compact prompts. В текст диктора они больше не попадают.</div>
    </div></div>}
  </>, document.body);
}
