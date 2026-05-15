"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getAccountAccess } from "../lib/accountRoles";

function shortDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
  if (isSchemaCacheError(error)) {
    return `${msg}. Запусти supabase/schema_v44_full_cloud_studio.sql и обнови страницу.`;
  }
  return msg;
}

export default function CloudProjectsPanel({ account, projectName, buildSnapshot, applySnapshot, onStatus, autoSaveKey, autoSaveEnabled = true, allowInStudio = false }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const access = getAccountAccess(profile, session);
  const user = session?.user || null;
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

  useEffect(() => {
    setRouteAllowed(Boolean(allowInStudio || isProjectsRoute()));
  }, [allowInStudio]);

  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  }, [buildSnapshot]);

  const canUseCloud = Boolean(routeAllowed && user && isSupabaseConfigured && supabase);
  const projectLimit = Number(access.storageProjects || profile?.cloud_project_limit || 0);
  const used = items.length;
  const full = projectLimit > 0 && used >= projectLimit;

  function setBothStatus(next) {
    setStatus(next);
    onStatus?.(next);
  }

  async function loadList() {
    if (!canUseCloud) return;
    setBusy(true);
    setSchemaWarning("");
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,title,topic,duration,aspect_ratio,style_preset,mode,target,updated_at,created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      const message = explainCloudError(error);
      if (isSchemaCacheError(error)) setSchemaWarning(message);
      setBothStatus(`✗ Cloud Projects: ${message}`);
    } else {
      setItems(data || []);
    }
    setBusy(false);
  }

  useEffect(() => { loadList(); }, [canUseCloud, user?.id]);

  function buildCloudPayload(snapshot) {
    if (!snapshot) throw new Error("Project snapshot пустой");
    const p = snapshot.project || {};
    const sp = snapshot.script_pack || {};
    const sbp = snapshot.storyboard_pack || {};
    const pipe = snapshot.production_pipeline || {};
    const cache = snapshot.production_pack_cache || {};
    return {
      user_id: user.id,
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
      production_pack_cache: cache,
      updated_at: new Date().toISOString(),
    };
  }

  async function updateSelectedCloudProject({ silent = false } = {}) {
    if (!canUseCloud || !selectedId) return false;
    const snapshot = buildSnapshotRef.current?.();
    const payload = buildCloudPayload(snapshot);
    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", selectedId)
      .eq("user_id", user.id);
    if (error) throw error;
    if (!silent) setBothStatus("✓ Project autosaved in Supabase Cloud");
    return true;
  }

  async function saveCloudProject() {
    if (!canUseCloud) {
      setBothStatus("✗ Войдите через Google, чтобы сохранять проекты в облако");
      return;
    }
    if (full && !selectedId) {
      setBothStatus(`✗ Лимит Cloud Projects для ${access.label}: ${projectLimit}`);
      return;
    }
    setBusy(true);
    setSchemaWarning("");
    try {
      const snapshot = buildSnapshotRef.current?.();
      const payload = buildCloudPayload(snapshot);

      let error;
      if (selectedId) {
        ({ error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", selectedId)
          .eq("user_id", user.id));
      } else {
        if (projectLimit > 0 && items.length >= projectLimit) {
          throw new Error(`Лимит Cloud Projects: ${projectLimit}`);
        }
        const res = await supabase
          .from("projects")
          .insert(payload)
          .select("id")
          .single();
        error = res.error;
        if (res.data?.id) setSelectedId(res.data.id);
      }
      if (error) throw error;
      lastAutoSaveKeyRef.current = autoSaveKey || "manual-save";
      setBothStatus("✓ Проект сохранён в Supabase Cloud");
      await loadList();
    } catch (e) {
      const message = explainCloudError(e);
      if (isSchemaCacheError(e)) setSchemaWarning(message);
      setBothStatus(`✗ Cloud Save: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  async function openCloudProject(id) {
    if (!canUseCloud || !id) return;
    setBusy(true);
    setSchemaWarning("");
    const { data, error } = await supabase
      .from("projects")
      .select("id,snapshot,data")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error) {
      const message = explainCloudError(error);
      if (isSchemaCacheError(error)) setSchemaWarning(message);
      setBothStatus(`✗ Cloud Load: ${message}`);
    } else {
      const snapshot = data?.snapshot || data?.data;
      if (snapshot) {
        applySnapshot?.(snapshot);
        setSelectedId(id);
        setBothStatus("✓ Проект загружен из Supabase Cloud");
      } else {
        setBothStatus("✗ Cloud Load: snapshot пустой");
      }
    }
    setBusy(false);
  }

  async function deleteCloudProject(id) {
    if (!canUseCloud || !id) return;
    const ok = typeof window !== "undefined" ? window.confirm("Удалить cloud project?") : true;
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
    if (error) setBothStatus(`✗ Cloud Delete: ${explainCloudError(error)}`);
    else {
      if (selectedId === id) setSelectedId(null);
      setBothStatus("✓ Cloud project удалён");
      await loadList();
    }
    setBusy(false);
  }

  async function renameCloudProject(item) {
    if (!canUseCloud || !item?.id) return;
    const current = item.name || item.title || "NeuroCine Project";
    const next = typeof window !== "undefined" ? window.prompt("Новое имя проекта", current) : current;
    const name = String(next || "").trim();
    if (!name || name === current) return;
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ name, title: name, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("user_id", user.id);
    if (error) setBothStatus(`✗ Cloud Rename: ${explainCloudError(error)}`);
    else { setBothStatus("✓ Project renamed"); await loadList(); }
    setBusy(false);
  }

  async function duplicateCloudProject(item) {
    if (!canUseCloud || !item?.id) return;
    if (full) { setBothStatus(`✗ Лимит Cloud Projects для ${access.label}: ${projectLimit}`); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", item.id)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      const copyName = `${data.name || data.title || "NeuroCine Project"} · copy`;
      const payload = {
        ...data,
        id: undefined,
        user_id: user.id,
        name: copyName,
        title: copyName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      delete payload.id;
      const res = await supabase.from("projects").insert(payload).select("id").single();
      if (res.error) throw res.error;
      if (res.data?.id) setSelectedId(res.data.id);
      setBothStatus("✓ Project duplicated");
      await loadList();
    } catch (e) {
      setBothStatus(`✗ Cloud Duplicate: ${explainCloudError(e)}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoSaveEnabled || !canUseCloud || !selectedId || !autoSaveKey) return;
    if (lastAutoSaveKeyRef.current === autoSaveKey) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      const inFlightKey = autoSaveKey;
      lastAutoSaveKeyRef.current = inFlightKey;
      try {
        await updateSelectedCloudProject({ silent: true });
        setBothStatus("✓ Autosave: проект обновлён в Supabase Cloud");
        await loadList();
      } catch (e) {
        if (lastAutoSaveKeyRef.current === inFlightKey) lastAutoSaveKeyRef.current = "";
        const message = explainCloudError(e);
        if (isSchemaCacheError(e)) setSchemaWarning(message);
        setBothStatus(`✗ Autosave: ${message}`);
      }
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [autoSaveEnabled, canUseCloud, selectedId, autoSaveKey, user?.id]);

  const emptyText = useMemo(() => {
    if (!isSupabaseConfigured) return "Supabase ENV не настроены";
    if (!user) return "Войдите через Google, чтобы включить Cloud Projects";
    if (schemaWarning) return "Нужно выполнить SQL schema v44";
    if (items.length && search.trim()) return "Поиск ничего не нашёл";
    return "Проекты ещё не сохранены";
  }, [user, schemaWarning, items.length, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.name, item.title, item.topic, item.aspect_ratio, item.style_preset, item.mode, item.target]
      .some((value) => String(value || "").toLowerCase().includes(q)));
  }, [items, search]);

  if (!routeAllowed) return null;

  return (
    <section className="cloud-projects-v43" id="cloud-projects">
      <div className="cp-head-v43">
        <div>
          <div className="cp-kicker-v43">Библиотека проектов</div>
          <h2>Мои проекты</h2>
          <p>Cloud-библиотека проектов: сценарий, storyboard, PART pipeline, Production Pack и exports в одном snapshot. Есть поиск, переименование, дублирование и удаление.</p>
        </div>
        <div className="cp-quota-v43"><span>{used}/{projectLimit}</span><b>{access.label}</b></div>
      </div>

      <div className="cp-actions-v43 cp-actions-v57">
        <button onClick={saveCloudProject} disabled={busy || !canUseCloud || (full && !selectedId)} type="button">💾 Сохранить проект</button>
        <button onClick={loadList} disabled={busy || !canUseCloud} type="button">↻ Обновить</button>
        {selectedId && <button onClick={() => setSelectedId(null)} disabled={busy} type="button">＋ Сохранить копией</button>}
        <input className="cp-search-v57" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск проектов" />
      </div>

      {selectedId && <div className="cp-autosave-v45">● Auto Save включён: изменения проекта сохраняются автоматически через 2–3 секунды.</div>}

      {schemaWarning && <div className="cp-status-v43 err">{schemaWarning}</div>}
      {status && <div className={`cp-status-v43 ${status.startsWith("✗") ? "err" : ""}`}>{status}</div>}

      <div className="cp-list-v43">
        {!filteredItems.length ? (
          <div className="cp-empty-v43">{emptyText}</div>
        ) : filteredItems.map((item) => (
          <article key={item.id} className={`cp-item-v43 ${selectedId === item.id ? "active" : ""}`}>
            <div>
              <strong>{item.name || item.title || "NeuroCine Project"}</strong>
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
