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

function planTone(user) {
  const plan = String(user?.plan || "demo").toLowerCase();
  if (plan === "admin") return "admin";
  if (plan === "pro") return user?.api_keys_connected ? "pro-live" : "pro";
  return "demo";
}

function planTitle(user) {
  const plan = String(user?.plan || "demo").toLowerCase();
  if (plan === "admin") return "OWNER/ADMIN";
  if (plan === "pro") return user?.api_keys_connected ? "PRO LIVE" : "PRO KEY PENDING";
  return "FREE";
}

export default function AdminPanel({ account }) {
  const access = getAccountAccess(account?.profile, account?.session);
  const token = account?.session?.access_token || "";
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const enabled = Boolean(token && (access.isOwner || access.isAdmin));

  async function loadUsers() {
    if (!enabled) return;
    setBusy(true);
    setStatus("Загружаю пользователей…");
    try {
      const r = await fetch("/api/admin/users", { headers: headers(token) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Admin API error");
      setUsers(d.users || []);
      setEvents(d.billing_events || []);
      setStatus(`✓ Пользователей: ${d.total || 0} · billing-заявок: ${(d.billing_events || []).length}`);
    } catch (e) {
      setStatus("✗ " + (e.message || "Ошибка загрузки"));
    } finally {
      setBusy(false);
    }
  }

  async function setPlan(user, plan) {
    if (!enabled || !user?.id) return;
    const labels = { demo: "FREE", pro: "PRO", admin: "ADMIN" };
    const ok = typeof window !== "undefined" ? window.confirm(`Переключить ${user.email} → ${labels[plan] || plan.toUpperCase()}?`) : true;
    if (!ok) return;
    setBusy(true);
    setStatus(`Обновляю ${user.email}…`);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ user_id: user.id, email: user.email, plan }),
      });
      const d = await r.json().catch(() => ({}));
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

  const stats = useMemo(() => {
    const base = { total: users.length, demo: 0, pro: 0, admin: 0, keys: 0, requests: events.length };
    for (const u of users) {
      const p = String(u.plan || "demo").toLowerCase();
      if (p === "admin") base.admin += 1;
      else if (p === "pro") base.pro += 1;
      else base.demo += 1;
      if (u.api_keys_connected) base.keys += 1;
    }
    return base;
  }, [users, events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      const p = String(u.plan || "demo").toLowerCase();
      const matchesFilter = filter === "all" || (filter === "keys" ? Boolean(u.api_keys_connected) : p === filter);
      if (!matchesFilter) return false;
      if (!q) return true;
      return [u.email, u.full_name, u.plan, u.role, u.billing_status, u.default_mode].some(v => String(v || "").toLowerCase().includes(q));
    });
  }, [users, query, filter]);

  if (!enabled) return null;

  return (
    <section className="admin-panel-v59 admin-panel-v621" id="owner-admin">
      <div className="ap-head-v59">
        <div>
          <div className="ap-kicker-v59">OWNER Admin Panel · v62.1</div>
          <h2>Пользователи и доступы</h2>
          <p>Служебная панель владельца: ручная выдача PRO, проверка AI-ключей, лимитов, billing-заявок и Cloud Projects.</p>
        </div>
        <button className="btn btn-sm" type="button" onClick={loadUsers} disabled={busy}>↻ Обновить</button>
      </div>

      <div className="ap-stat-grid-v621">
        <div><span>Всего</span><b>{stats.total}</b></div>
        <div><span>FREE</span><b>{stats.demo}</b></div>
        <div><span>PRO</span><b>{stats.pro}</b></div>
        <div><span>AI keys</span><b>{stats.keys}</b></div>
        <div><span>Заявки</span><b>{stats.requests}</b></div>
      </div>

      <div className="ap-toolbar-v59 ap-toolbar-v621">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по email / имени / плану / billing" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Все</option>
          <option value="demo">FREE</option>
          <option value="pro">PRO</option>
          <option value="admin">ADMIN</option>
          <option value="keys">С AI-ключом</option>
        </select>
        <span>{filtered.length}/{users.length}</span>
      </div>
      {status && <div className={`status-line ${status.startsWith("✗") ? "err" : status.startsWith("✓") ? "ok" : ""}`}>{status}</div>}

      <div className="ap-events-v621">
        <div className="ap-events-title-v621">Последние billing-заявки</div>
        {events.length > 0 ? events.slice(0, 8).map((ev) => (
          <div className="ap-event-v621" key={ev.id}>
            <b>{ev.email || "no email"}</b>
            <span>{ev.event_type || "event"}</span>
            <em>{ev.status || "pending"} · {dateShort(ev.created_at)}</em>
          </div>
        )) : (
          <div className="ap-event-v621 muted">
            <b>Заявок пока нет</b>
            <span>После клика FREE → Купить PRO они появятся здесь.</span>
            <em>billing_events</em>
          </div>
        )}
      </div>

      <div className="ap-list-v59">
        {filtered.map(user => (
          <article className={`ap-user-v59 ap-user-v621 tone-${planTone(user)}`} key={user.id}>
            <div className="ap-user-main-v59">
              {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <div className="ap-avatar-v59">{String(user.email || "U").slice(0,1).toUpperCase()}</div>}
              <div>
                <strong>{user.email || "no email"}</strong>
                <span>{user.full_name || "—"}</span>
                <em>создан: {dateShort(user.created_at)} · обновлён: {dateShort(user.updated_at)}</em>
              </div>
            </div>
            <div className="ap-badges-v59">
              <b>{planTitle(user)}</b>
              <span>{user.role || "user"}</span>
              <span>{user.default_mode || "demo"}</span>
              <span>projects: {user.project_count || 0}/{user.cloud_project_limit || 3}</span>
              <span>keys: {user.api_keys_connected ? "connected" : "no"}</span>
              <span>billing: {user.billing_status || "none"}</span>
              {user.last_billing_event && <span>request: {user.last_billing_event.status || "pending"} · {dateShort(user.last_billing_event.created_at)}</span>}
              {user.pro_activated_at && <span>PRO: {dateShort(user.pro_activated_at)}</span>}
            </div>
            <div className="ap-actions-v59">
              <button type="button" disabled={busy || String(user.plan).toLowerCase() === "demo"} onClick={() => setPlan(user, "demo")}>Забрать PRO</button>
              <button type="button" disabled={busy || String(user.plan).toLowerCase() === "pro"} onClick={() => setPlan(user, "pro")}>Выдать PRO</button>
              <button type="button" disabled={busy || String(user.plan).toLowerCase() === "admin"} onClick={() => setPlan(user, "admin")}>ADMIN</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
