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

export default function CloudProjectsPanel({ account, projectName, buildSnapshot, applySnapshot, onStatus, autoSaveKey, autoSaveEnabled = true }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const access = getAccountAccess(profile, session);
  const user = session?.user || null;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("");
  const [schemaWarning, setSchemaWarning] = useState("");
  const buildSnapshotRef = useRef(buildSnapshot);
  const autoSaveTimerRef = useRef(null);
  const lastAutoSaveKeyRef = useRef("");

  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  }, [buildSnapshot]);

  const canUseCloud = Boolean(user && isSupabaseConfigured && supabase);
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

  useEffect(() => {
    if (!autoSaveEnabled || !canUseCloud || !selectedId || !autoSaveKey) return;
    if (lastAutoSaveKeyRef.current === autoSaveKey) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateSelectedCloudProject({ silent: true });
        lastAutoSaveKeyRef.current = autoSaveKey;
        setBothStatus("✓ Autosave: проект обновлён в Supabase Cloud");
        await loadList();
      } catch (e) {
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
    return "Проекты ещё не сохранены";
  }, [user, schemaWarning]);

  return (
    <section className="cloud-projects-v43" id="cloud-projects">
      <div className="cp-head-v43">
        <div>
          <div className="cp-kicker-v43">Supabase Cloud Projects · v44</div>
          <h2>Мои проекты</h2>
          <p>Сохраняет весь NeuroCine snapshot: тема, сценарий, storyboard, PART pipeline, prompts, Production Pack cache.</p>
        </div>
        <div className="cp-quota-v43"><span>{used}/{projectLimit}</span><b>{access.label}</b></div>
      </div>

      <div className="cp-actions-v43">
        <button onClick={saveCloudProject} disabled={busy || !canUseCloud || (full && !selectedId)} type="button">💾 Сохранить в Cloud</button>
        <button onClick={loadList} disabled={busy || !canUseCloud} type="button">↻ Обновить список</button>
        {selectedId && <button onClick={() => setSelectedId(null)} disabled={busy} type="button">＋ Сохранить как новый</button>}
      </div>

      {selectedId && <div className="cp-autosave-v45">● Auto Save включён: изменения проекта сохраняются автоматически через 2–3 секунды.</div>}

      {schemaWarning && <div className="cp-status-v43 err">{schemaWarning}</div>}
      {status && <div className={`cp-status-v43 ${status.startsWith("✗") ? "err" : ""}`}>{status}</div>}

      <div className="cp-list-v43">
        {!items.length ? (
          <div className="cp-empty-v43">{emptyText}</div>
        ) : items.map((item) => (
          <article key={item.id} className={`cp-item-v43 ${selectedId === item.id ? "active" : ""}`}>
            <div>
              <strong>{item.name || item.title || "NeuroCine Project"}</strong>
              <span>{item.topic || "без темы"}</span>
              <em>{item.duration || 60}s · {item.aspect_ratio || "9:16"} · {shortDate(item.updated_at || item.created_at)}</em>
            </div>
            <div className="cp-item-actions-v43">
              <button onClick={() => openCloudProject(item.id)} disabled={busy} type="button">Открыть</button>
              <button onClick={() => deleteCloudProject(item.id)} disabled={busy} type="button">Удалить</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
