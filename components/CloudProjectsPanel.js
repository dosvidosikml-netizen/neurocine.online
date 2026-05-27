"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getAccountAccess } from "../lib/accountRoles";

function shortDate(value) {
  try {
    return value ? new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  } catch {
    return "—";
  }
}

function isProjectsRoute() {
  if (typeof window === "undefined") return false;
  const path = window.location?.pathname || "";
  return path === "/projects" || path.startsWith("/projects/");
}

function isSchemaCacheError(error) {
  const msg = String(error?.message || "");
  return msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("Could not find the table");
}

function explainCloudError(error) {
  const msg = String(error?.message || "ошибка");
  if (isSchemaCacheError(error)) return `${msg}. Supabase schema/table projects не готова.`;
  return msg;
}

function safeJson(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function storageKey(userId = "guest") {
  return `neurocine:projects-local:v2:${String(userId || "guest")}`;
}

function readLocal(userId) {
  if (typeof window === "undefined") return [];
  try { return safeJson(window.localStorage.getItem(storageKey(userId)), []); } catch { return []; }
}

function writeLocal(userId, items) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(storageKey(userId), JSON.stringify(items || [])); } catch {}
}

function localId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isLocal(id) {
  return String(id || "").startsWith("local_");
}

export default function CloudProjectsPanel({ account, projectName, buildSnapshot, applySnapshot, onStatus, autoSaveKey, autoSaveEnabled = true, allowInStudio = false }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const user = session?.user || null;
  const userId = user?.id || user?.email || "guest";
  const access = getAccountAccess(profile, session);

  const [routeAllowed, setRouteAllowed] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("");
  const [schemaWarning, setSchemaWarning] = useState("");
  const [search, setSearch] = useState("");
  const buildSnapshotRef = useRef(buildSnapshot);
  const autoSaveTimerRef = useRef(null);
  const lastAutoSaveKeyRef = useRef("");

  useEffect(() => { setRouteAllowed(Boolean(allowInStudio || isProjectsRoute())); }, [allowInStudio]);
  useEffect(() => { buildSnapshotRef.current = buildSnapshot; }, [buildSnapshot]);

  const canUseCloud = Boolean(routeAllowed && user && isSupabaseConfigured && supabase);
  const projectLimit = Number(access.storageProjects || profile?.cloud_project_limit || 9999);
  const used = items.length;
  const full = projectLimit > 0 && used >= projectLimit;

  function setBothStatus(next) {
    setStatus(next);
    onStatus?.(next);
  }

  function makePayload(snapshot) {
    if (!snapshot) throw new Error("Project snapshot пустой");
    const p = snapshot.project || {};
    const sp = snapshot.script_pack || {};
    const sbp = snapshot.storyboard_pack || {};
    const pipe = snapshot.production_pipeline || {};
    return {
      user_id: user?.id || userId,
      name: projectName || p.projectName || "NeuroCine Project",
      title: projectName || p.projectName || "NeuroCine Project",
      topic: p.topic || snapshot.topic || "",
      script: sp.script || snapshot.script || "",
      duration: Number(p.duration || 60),
      aspect_ratio: p.aspectRatio || "9:16",
      project_type: p.projectType || "film",
      style_preset: p.stylePreset || "cinematic",
      tone: p.tone || "cinematic documentary thriller",
      mode: sbp.sbMode || "safe",
      target: sbp.target || "veo3",
      storyboard: sbp.storyboard || null,
      settings: {
        frameIdx: pipe.frameIdx ?? null,
        autoPartIndex: pipe.autoPartIndex ?? 0,
        autoPartSize: pipe.autoPartSize ?? 4,
        videoPromptMode: pipe.videoPromptMode || "cheap",
        videoConsistency: pipe.videoConsistency || "ultra",
      },
      snapshot,
      data: snapshot,
      production_pack_cache: snapshot.production_pack_cache || {},
      updated_at: new Date().toISOString(),
    };
  }

  function saveLocal(snapshot, wantedId = null) {
    const now = new Date().toISOString();
    const list = readLocal(userId);
    const id = wantedId && isLocal(wantedId) ? wantedId : localId();
    const old = list.find(x => x.id === id);
    const item = {
      ...makePayload(snapshot),
      id,
      __local: true,
      created_at: old?.created_at || now,
      updated_at: now,
    };
    const next = [item, ...list.filter(x => x.id !== id)].slice(0, Math.max(projectLimit || 9999, 50));
    writeLocal(userId, next);
    setSelectedId(id);
    setItems(prev => [item, ...prev.filter(x => x.id !== id)]);
    return item;
  }

  async function loadList() {
    if (!routeAllowed) return;
    setBusy(true);
    setSchemaWarning("");
    const local = readLocal(userId);

    if (!canUseCloud) {
      setItems(local);
      setBusy(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id,name,title,topic,duration,aspect_ratio,style_preset,mode,target,updated_at,created_at,snapshot,data")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      const msg = explainCloudError(error);
      if (isSchemaCacheError(error)) setSchemaWarning(msg);
      setBothStatus(`⚠ Cloud недоступен, локальный режим: ${msg}`);
      setItems(local);
    } else {
      setItems([...(data || []), ...local]);
    }
    setBusy(false);
  }

  useEffect(() => { loadList(); }, [routeAllowed, canUseCloud, user?.id]);

  async function saveCloudProject() {
    if (full && !selectedId) {
      setBothStatus(`✗ Лимит проектов для ${access.label}: ${projectLimit}`);
      return;
    }

    setBusy(true);
    setSchemaWarning("");
    try {
      const snapshot = buildSnapshotRef.current?.();
      const payload = makePayload(snapshot);

      if (!canUseCloud || isLocal(selectedId)) {
        saveLocal(snapshot, selectedId);
        setBothStatus(canUseCloud ? "✓ Проект сохранён локально" : "✓ Проект сохранён локально: Cloud недоступен");
        await loadList();
        return;
      }

      let error;
      if (selectedId) {
        ({ error } = await supabase.from("projects").update(payload).eq("id", selectedId).eq("user_id", user.id));
      } else {
        const res = await supabase.from("projects").insert(payload).select("id").single();
        error = res.error;
        if (res.data?.id) setSelectedId(res.data.id);
      }
      if (error) throw error;
      lastAutoSaveKeyRef.current = autoSaveKey || "manual-save";
      setBothStatus("✓ Проект сохранён в Supabase Cloud");
      await loadList();
    } catch (e) {
      const snapshot = buildSnapshotRef.current?.();
      saveLocal(snapshot, isLocal(selectedId) ? selectedId : null);
      const msg = explainCloudError(e);
      if (isSchemaCacheError(e)) setSchemaWarning(msg);
      setBothStatus(`✓ Проект сохранён локально. Cloud ошибка: ${msg}`);
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function openCloudProject(id) {
    if (!id) return;
    setBusy(true);
    if (isLocal(id) || !canUseCloud) {
      const item = readLocal(userId).find(x => x.id === id);
      const snapshot = item?.snapshot || item?.data;
      if (snapshot) { applySnapshot?.(snapshot); setSelectedId(id); setBothStatus("✓ Локальный проект загружен"); }
      else setBothStatus("✗ Local Load: snapshot пустой");
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.from("projects").select("id,snapshot,data").eq("id", id).eq("user_id", user.id).single();
    if (error) setBothStatus(`✗ Cloud Load: ${explainCloudError(error)}`);
    else {
      const snapshot = data?.snapshot || data?.data;
      if (snapshot) { applySnapshot?.(snapshot); setSelectedId(id); setBothStatus("✓ Проект загружен из Supabase Cloud"); }
      else setBothStatus("✗ Cloud Load: snapshot пустой");
    }
    setBusy(false);
  }

  async function deleteCloudProject(id) {
    if (!id) return;
    const ok = typeof window !== "undefined" ? window.confirm("Удалить project?") : true;
    if (!ok) return;
    setBusy(true);
    if (isLocal(id) || !canUseCloud) {
      writeLocal(userId, readLocal(userId).filter(x => x.id !== id));
      if (selectedId === id) setSelectedId(null);
      setBothStatus("✓ Local project удалён");
      await loadList();
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
    if (error) setBothStatus(`✗ Cloud Delete: ${explainCloudError(error)}`);
    else { if (selectedId === id) setSelectedId(null); setBothStatus("✓ Cloud project удалён"); await loadList(); }
    setBusy(false);
  }

  async function renameCloudProject(item) {
    if (!item?.id) return;
    const current = item.name || item.title || "NeuroCine Project";
    const next = typeof window !== "undefined" ? window.prompt("Новое имя проекта", current) : current;
    const name = String(next || "").trim();
    if (!name || name === current) return;
    setBusy(true);
    if (isLocal(item.id) || !canUseCloud) {
      const list = readLocal(userId).map(x => x.id === item.id ? { ...x, name, title: name, updated_at: new Date().toISOString() } : x);
      writeLocal(userId, list);
      setBothStatus("✓ Project renamed locally");
      await loadList();
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("projects").update({ name, title: name, updated_at: new Date().toISOString() }).eq("id", item.id).eq("user_id", user.id);
    if (error) setBothStatus(`✗ Cloud Rename: ${explainCloudError(error)}`);
    else { setBothStatus("✓ Project renamed"); await loadList(); }
    setBusy(false);
  }

  async function duplicateCloudProject(item) {
    const snapshot = item?.snapshot || item?.data;
    if (!snapshot) { setBothStatus("✗ Duplicate: snapshot пустой"); return; }
    const copy = saveLocal(snapshot, null);
    const list = readLocal(userId).map(x => x.id === copy.id ? { ...x, name: `${item.name || item.title || "NeuroCine Project"} · copy`, title: `${item.name || item.title || "NeuroCine Project"} · copy` } : x);
    writeLocal(userId, list);
    setBothStatus("✓ Project duplicated locally");
    await loadList();
  }

  useEffect(() => {
    if (!autoSaveEnabled || !routeAllowed || !selectedId || !autoSaveKey) return;
    if (lastAutoSaveKeyRef.current === autoSaveKey) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      lastAutoSaveKeyRef.current = autoSaveKey;
      try {
        const snapshot = buildSnapshotRef.current?.();
        if (!canUseCloud || isLocal(selectedId)) saveLocal(snapshot, selectedId);
        else await supabase.from("projects").update(makePayload(snapshot)).eq("id", selectedId).eq("user_id", user.id);
        setBothStatus("✓ Autosave: проект обновлён");
        await loadList();
      } catch (e) {
        lastAutoSaveKeyRef.current = "";
        setBothStatus(`✓ Autosave локально. Cloud ошибка: ${explainCloudError(e)}`);
      }
    }, 2500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [autoSaveEnabled, routeAllowed, canUseCloud, selectedId, autoSaveKey, user?.id]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => [item.name, item.title, item.topic, item.aspect_ratio, item.style_preset, item.mode, item.target]
      .some(value => String(value || "").toLowerCase().includes(q)));
  }, [items, search]);

  const emptyText = items.length && search.trim() ? "Поиск ничего не нашёл" : "Проекты ещё не сохранены";
  if (!routeAllowed) return null;

  return (
    <section className="cloud-projects-v43" id="cloud-projects">
      <div className="cp-head-v43">
        <div>
          <div className="cp-kicker-v43">Библиотека проектов</div>
          <h2>Мои проекты</h2>
          <p>Cloud-библиотека проектов. Если Cloud временно недоступен, проект сохраняется локально и не пропадает.</p>
        </div>
        <div className="cp-quota-v43"><span>{used}/{projectLimit || 9999}</span><b>{access.label}</b></div>
      </div>

      <div className="cp-actions-v43 cp-actions-v57">
        <button onClick={saveCloudProject} disabled={busy || (full && !selectedId)} type="button">💾 Сохранить проект</button>
        <button onClick={loadList} disabled={busy} type="button">↻ Обновить</button>
        {selectedId && <button onClick={() => setSelectedId(null)} disabled={busy} type="button">＋ Сохранить копией</button>}
        <input className="cp-search-v57" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск проектов" />
      </div>

      {selectedId && <div className="cp-autosave-v45">● Auto Save включён: изменения проекта сохраняются автоматически.</div>}
      {schemaWarning && <div className="cp-status-v43 err">{schemaWarning}</div>}
      {status && <div className={`cp-status-v43 ${status.startsWith("✗") ? "err" : ""}`}>{status}</div>}

      <div className="cp-list-v43">
        {!filteredItems.length ? <div className="cp-empty-v43">{emptyText}</div> : filteredItems.map(item => (
          <article key={item.id} className={`cp-item-v43 ${selectedId === item.id ? "active" : ""}`}>
            <div>
              <strong>{item.name || item.title || "NeuroCine Project"}{item.__local ? " · local" : ""}</strong>
              <span>{item.topic || "без темы"}</span>
              <em>{item.duration || 60}s · {item.aspect_ratio || "9:16"} · {shortDate(item.updated_at || item.created_at)}</em>
            </div>
            <div className="cp-item-actions-v43">
              <button onClick={() => openCloudProject(item.id)} disabled={busy} type="button">Открыть</button>
              <button onClick={() => renameCloudProject(item)} disabled={busy} type="button">Переименовать</button>
              <button onClick={() => duplicateCloudProject(item)} disabled={busy || full} type="button">Дублировать</button>
              <button onClick={() => deleteCloudProject(item.id)} disabled={busy} type="button">Удалить</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
