"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getAccountAccess } from "../lib/accountRoles";

function shortDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

export default function CloudProjectsPanel({ account, projectName, buildSnapshot, applySnapshot, onStatus }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const access = getAccountAccess(profile, session);
  const user = session?.user || null;
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState("");

  const canUseCloud = Boolean(user && isSupabaseConfigured && supabase);
  const projectLimit = access.storageProjects || 0;
  const used = items.length;
  const full = used >= projectLimit;

  function setBothStatus(next) {
    setStatus(next);
    onStatus?.(next);
  }

  async function loadList() {
    if (!canUseCloud) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,topic,duration,aspect_ratio,mode,updated_at,created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) setBothStatus(`✗ Cloud Projects: ${error.message}`);
    else setItems(data || []);
    setBusy(false);
  }

  useEffect(() => { loadList(); }, [canUseCloud, user?.id]);

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
    try {
      const snapshot = buildSnapshot?.();
      if (!snapshot) throw new Error("Project snapshot пустой");
      const p = snapshot.project || {};
      const payload = {
        user_id: user.id,
        name: projectName || p.projectName || "NeuroCine Project",
        topic: p.topic || snapshot.topic || "",
        duration: Number(p.duration || 60),
        aspect_ratio: p.aspectRatio || "9:16",
        style_preset: p.stylePreset || "cinematic",
        mode: snapshot?.storyboard_pack?.sbMode || "safe",
        snapshot,
        updated_at: new Date().toISOString(),
      };
      let error;
      if (selectedId) {
        ({ error } = await supabase.from("projects").update(payload).eq("id", selectedId).eq("user_id", user.id));
      } else {
        const res = await supabase.from("projects").insert(payload).select("id").single();
        error = res.error;
        if (res.data?.id) setSelectedId(res.data.id);
      }
      if (error) throw error;
      setBothStatus("✓ Проект сохранён в Supabase Cloud");
      await loadList();
    } catch (e) {
      setBothStatus(`✗ Cloud Save: ${e.message || "ошибка"}`);
    } finally {
      setBusy(false);
    }
  }

  async function openCloudProject(id) {
    if (!canUseCloud || !id) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id,snapshot")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error) setBothStatus(`✗ Cloud Load: ${error.message}`);
    else if (data?.snapshot) {
      applySnapshot?.(data.snapshot);
      setSelectedId(id);
      setBothStatus("✓ Проект загружен из Supabase Cloud");
    }
    setBusy(false);
  }

  async function deleteCloudProject(id) {
    if (!canUseCloud || !id) return;
    const ok = typeof window !== "undefined" ? window.confirm("Удалить cloud project?") : true;
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
    if (error) setBothStatus(`✗ Cloud Delete: ${error.message}`);
    else {
      if (selectedId === id) setSelectedId(null);
      setBothStatus("✓ Cloud project удалён");
      await loadList();
    }
    setBusy(false);
  }

  const emptyText = useMemo(() => {
    if (!isSupabaseConfigured) return "Supabase ENV не настроены";
    if (!user) return "Войдите через Google, чтобы включить Cloud Projects";
    return "Проекты ещё не сохранены";
  }, [user]);

  return (
    <section className="cloud-projects-v43" id="cloud-projects">
      <div className="cp-head-v43">
        <div>
          <div className="cp-kicker-v43">Supabase Cloud Projects · v43</div>
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

      {status && <div className={`cp-status-v43 ${status.startsWith("✗") ? "err" : ""}`}>{status}</div>}

      <div className="cp-list-v43">
        {!items.length ? (
          <div className="cp-empty-v43">{emptyText}</div>
        ) : items.map((item) => (
          <article key={item.id} className={`cp-item-v43 ${selectedId === item.id ? "active" : ""}`}>
            <div>
              <strong>{item.name || "NeuroCine Project"}</strong>
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
