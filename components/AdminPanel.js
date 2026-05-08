"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccountAccess } from "../lib/accountRoles";

function headers(token = "") {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function dateShort(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

export default function AdminPanel({ account }) {
  const access = getAccountAccess(account?.profile, account?.session);
  const token = account?.session?.access_token || "";
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const enabled = Boolean(token && (access.isOwner || access.isAdmin));

  async function loadUsers() {
    if (!enabled) return;
    setBusy(true);
    setStatus("Загружаю пользователей…");
    try {
      const r = await fetch("/api/admin/users", { headers: headers(token) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Admin API error");
      setUsers(d.users || []);
      setStatus(`✓ Пользователей: ${d.total || 0}`);
    } catch (e) {
      setStatus("✗ " + (e.message || "Ошибка загрузки"));
    } finally {
      setBusy(false);
    }
  }

  async function setPlan(user, plan) {
    if (!enabled || !user?.id) return;
    const ok = typeof window !== "undefined" ? window.confirm(`Переключить ${user.email} → ${plan.toUpperCase()}?`) : true;
    if (!ok) return;
    setBusy(true);
    setStatus(`Обновляю ${user.email}…`);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ user_id: user.id, email: user.email, plan }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Update failed");
      setStatus(`✓ ${user.email} → ${d.user?.plan}/${d.user?.role}`);
      await loadUsers();
    } catch (e) {
      setStatus("✗ " + (e.message || "Ошибка обновления"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadUsers(); }, [enabled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => [u.email, u.full_name, u.plan, u.role].some(v => String(v || "").toLowerCase().includes(q)));
  }, [users, query]);

  if (!enabled) return null;

  return (
    <section className="admin-panel-v59" id="owner-admin">
      <div className="ap-head-v59">
        <div>
          <div className="ap-kicker-v59">OWNER Admin Panel · v59 basic</div>
          <h2>Пользователи и доступы</h2>
          <p>Служебная панель видна только владельцу. Можно быстро проверить роли и вручную выдать FREE / PRO / ADMIN.</p>
        </div>
        <button className="btn btn-sm" type="button" onClick={loadUsers} disabled={busy}>↻ Обновить</button>
      </div>

      <div className="ap-toolbar-v59">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по email / имени / плану" />
        <span>{filtered.length}/{users.length}</span>
      </div>
      {status && <div className={`status-line ${status.startsWith("✗") ? "err" : status.startsWith("✓") ? "ok" : ""}`}>{status}</div>}

      <div className="ap-list-v59">
        {filtered.map(user => (
          <article className="ap-user-v59" key={user.id}>
            <div className="ap-user-main-v59">
              {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <div className="ap-avatar-v59">{String(user.email || "U").slice(0,1).toUpperCase()}</div>}
              <div>
                <strong>{user.email || "no email"}</strong>
                <span>{user.full_name || "—"}</span>
                <em>создан: {dateShort(user.created_at)} · обновлён: {dateShort(user.updated_at)}</em>
              </div>
            </div>
            <div className="ap-badges-v59">
              <b>{String(user.plan || "demo").toUpperCase()}</b>
              <span>{user.role || "user"}</span>
              <span>{user.default_mode || "demo"}</span>
              <span>projects: {user.project_count || 0}/{user.cloud_project_limit || 3}</span>
              <span>keys: {user.api_keys_connected ? "yes" : "no"}</span>
            </div>
            <div className="ap-actions-v59">
              <button type="button" disabled={busy} onClick={() => setPlan(user, "demo")}>FREE</button>
              <button type="button" disabled={busy} onClick={() => setPlan(user, "pro")}>PRO</button>
              <button type="button" disabled={busy} onClick={() => setPlan(user, "admin")}>ADMIN</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
