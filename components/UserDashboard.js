"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccountAccess } from "../lib/accountRoles";

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("ru-RU"); } catch { return "—"; }
}

function getPublicPlanLabel(access) {
  if (access.isOwner || access.isAdmin) return "OWNER";
  if (access.role === "pro") return "PRO";
  return "FREE";
}

function bearerHeaders(token = "") {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function ApiKeyVault({ account, access, onAccountPatch }) {
  const token = account?.session?.access_token || "";
  const isOwnerView = access.isOwner || access.isAdmin;
  const isProView = access.role === "pro" && !isOwnerView;
  const canManageKeys = isProView || isOwnerView;
  const [providers, setProviders] = useState({});
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const openrouter = providers?.openrouter || null;

  async function refresh() {
    if (!token) return;
    try {
      const r = await fetch("/api/user-keys", { headers: bearerHeaders(token) });
      const d = await r.json();
      if (r.ok) setProviders(d.providers || {});
    } catch {}
  }

  useEffect(() => { refresh(); }, [token]);

  async function testKey() {
    if (!apiKey.trim()) { setStatus("err|Вставьте API key."); return; }
    setBusy(true); setStatus("gen|Проверяю ключ...");
    try {
      const r = await fetch("/api/user-keys/test", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter", apiKey }),
      });
      const d = await r.json();
      setStatus(r.ok ? `ok|Ключ активен · ${d.masked || "проверен"}` : `err|${d.error || d.message || "Ключ не прошёл проверку"}`);
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка проверки"));
    } finally { setBusy(false); }
  }

  async function saveKey() {
    if (!apiKey.trim()) { setStatus("err|Вставьте API key."); return; }
    setBusy(true); setStatus("gen|Сохраняю ключ...");
    try {
      const r = await fetch("/api/user-keys", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter", apiKey, keyLabel: "OpenRouter" }),
      });
      const d = await r.json();
      if (!r.ok) {
        setStatus("err|" + (d.error || "Не удалось сохранить ключ"));
        return;
      }
      setApiKey("");
      setStatus(`ok|OpenRouter подключён · ${d.masked || "ключ сохранён"}`);
      setProviders(prev => ({ ...prev, openrouter: { connected: true, provider: "openrouter", masked: d.masked, last4: d.last4, status: d.status } }));
      onAccountPatch?.(d.profile_patch || { api_keys_connected: true });
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка сохранения"));
    } finally { setBusy(false); }
  }

  async function deleteKey() {
    setBusy(true); setStatus("gen|Удаляю ключ...");
    try {
      const r = await fetch("/api/user-keys/delete", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter" }),
      });
      const d = await r.json();
      if (!r.ok) {
        setStatus("err|" + (d.error || "Не удалось удалить ключ"));
        return;
      }
      setProviders(prev => ({ ...prev, openrouter: null }));
      onAccountPatch?.(d.profile_patch || { api_keys_connected: false });
      setStatus("ok|OpenRouter отключён");
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка удаления"));
    } finally { setBusy(false); }
  }

  if (!canManageKeys) {
    return (
      <div className="ud-card-v43 wide pro-own-keys-v53 key-vault-v54 locked">
        <div className="ud-label-v43">AI-ключи</div>
        <strong className="ud-big-v43">Доступно в PRO</strong>
        <p>FREE подходит для знакомства со студией. В PRO открывается полный рабочий режим и подключение собственных AI-ключей.</p>
        <div className="ud-role-row-v43"><span>Рекомендуемый провайдер</span><b>OpenRouter</b></div>
        <div className="ud-role-row-v43"><span>Что даёт PRO</span><b>полный production-пайплайн</b></div>
      </div>
    );
  }

  if (isOwnerView) {
    return (
      <div className="ud-card-v43 wide pro-own-keys-v53 key-vault-v54 owner">
        <div className="ud-label-v43">OWNER API</div>
        <strong className="ud-big-v43">Platform LIVE</strong>
        <p>Этот служебный блок виден только владельцу. OWNER использует ключи из Render ENV, а пользовательские ключи нужны только PRO-аккаунтам.</p>
        <div className="ud-role-row-v43"><span>Источник</span><b>Render ENV</b></div>
        <div className="ud-role-row-v43"><span>Статус</span><b>Full access</b></div>
      </div>
    );
  }

  return (
    <div className="ud-card-v43 wide pro-own-keys-v53 key-vault-v54">
      <div className="ud-label-v43">AI API Keys</div>
      <strong className="ud-big-v43">Подключение LIVE</strong>
      <p>Добавьте собственный AI API-ключ. В v54 подключён OpenRouter как первый рекомендуемый провайдер: один ключ даёт доступ к GPT, Claude, Gemini и другим моделям через общий роутер.</p>

      <div className="key-vault-status-v54">
        <div className="ud-role-row-v43"><span>OpenRouter</span><b>{openrouter?.connected ? `подключён ${openrouter.masked || ""}` : "не подключён"}</b></div>
        <div className="ud-role-row-v43"><span>LIVE</span><b>{openrouter?.connected ? "готов к генерации" : "ждёт ключ"}</b></div>
      </div>

      <div className="key-vault-form-v54">
        <label>Provider</label>
        <select value="openrouter" disabled>
          <option value="openrouter">OpenRouter · рекомендовано</option>
        </select>
        <label>API key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          autoComplete="off"
        />
        <div className="key-vault-actions-v54">
          <button className="btn btn-sm btn-ghost" type="button" onClick={testKey} disabled={busy || !apiKey.trim()}>Проверить</button>
          <button className="btn btn-sm" type="button" onClick={saveKey} disabled={busy || !apiKey.trim()}>Сохранить</button>
          {openrouter?.connected && <button className="btn btn-sm btn-ghost" type="button" onClick={deleteKey} disabled={busy}>Удалить</button>}
        </div>
      </div>

      {status && <div className={`status-line ${status.startsWith("err") ? "err" : status.startsWith("ok") ? "ok" : ""}`}>{status.replace(/^ok\|?/, "✓ ").replace(/^gen\|?/, "⏳ ").replace(/^err\|?/, "✗ ")}</div>}
    </div>
  );
}

export default function UserDashboard({ account, devMode, onAccountPatch }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const user = session?.user || null;
  const access = getAccountAccess(profile, session);
  const email = profile?.email || user?.email || "guest";
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const publicPlan = getPublicPlanLabel(access);

  const isOwnerView = access.isOwner || access.isAdmin;
  const isProView = access.role === "pro" && !isOwnerView;
  const liveText = isOwnerView
    ? "LIVE включён для владельца платформы"
    : isProView
      ? (access.hasOwnApiKeys ? "LIVE включён" : "Подключите AI-ключ для LIVE")
      : "LIVE-генерация доступна в PRO";

  const planDescription = isOwnerView
    ? "Служебный режим владельца: полный доступ, управление и тесты."
    : isProView
      ? "PRO — полный рабочий режим NeuroCine Studio с подключением собственных AI API-ключей."
      : "FREE — познакомьтесь с NeuroCine Studio и сохраните до 3 проектов.";

  return (
    <section className="user-dashboard-v43" id="account">
      <div className="ud-head-v43">
        <div>
          <div className="ud-kicker-v43">User Control Center · v55 {isOwnerView ? "· OWNER" : ""}</div>
          <h2>Профиль и доступ</h2>
          <p>{isOwnerView ? "Служебный доступ владельца платформы." : "FREE для знакомства. PRO для полного production-пайплайна и LIVE-генерации."}</p>
        </div>
        <div className={`ud-access-badge-v43 role-${access.role}`}>
          <span>{isOwnerView ? "OWNER FULL ACCESS" : isProView ? "PRO STUDIO" : "FREE PREVIEW"}</span>
          <strong>{publicPlan}</strong>
        </div>
      </div>

      <div className="ud-grid-v43">
        <div className="ud-card-v43 user">
          <div className="ud-user-row-v43">
            {avatar ? <img src={avatar} alt="" /> : <div className="ud-avatar-v43">{String(name || "U").slice(0, 1).toUpperCase()}</div>}
            <div>
              <strong>{user ? name : "Гость"}</strong>
              <span>{user ? email : "Войдите через Google"}</span>
            </div>
          </div>
          <div className="ud-mini-v43"><span>Создан</span><b>{fmtDate(profile?.created_at)}</b></div>
          <div className="ud-mini-v43"><span>ID</span><b>{user?.id ? `${user.id.slice(0, 8)}…` : "—"}</b></div>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Тариф</div>
          <strong className="ud-big-v43">{publicPlan}</strong>
          <p>{planDescription}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Доступ генерации</div>
          <strong className={access.canLive || isProView ? "ud-ok-v43" : "ud-lock-v43"}>
            {isOwnerView ? "LIVE OWNER" : isProView ? (access.hasOwnApiKeys ? "LIVE включён" : "PRO активен") : "FREE Preview"}
          </strong>
          <p>{liveText}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Лимиты</div>
          <div className="ud-limit-v43"><span>Генерации / мес</span><b>{isOwnerView ? "∞" : access.monthlyGenerations}</b></div>
          <div className="ud-limit-v43"><span>Cloud Projects</span><b>{isOwnerView ? "∞" : access.storageProjects}</b></div>
        </div>

        <div className="ud-card-v43 wide">
          <div className="ud-label-v43">Схема доступа</div>
          {isOwnerView ? (
            <>
              <div className="ud-role-row-v43"><span>OWNER</span><b>{devMode ? "Preview" : "LIVE"}</b></div>
              <div className="ud-role-row-v43"><span>Platform</span><b>Render ENV</b></div>
              <div className="ud-role-row-v43"><span>Лимиты</span><b>безлимит для владельца</b></div>
            </>
          ) : isProView ? (
            <>
              <div className="ud-role-row-v43"><span>PRO Studio</span><b>полный pipeline</b></div>
              <div className="ud-role-row-v43"><span>LIVE</span><b>{access.hasOwnApiKeys ? "включён" : "подключите AI-ключ"}</b></div>
              <div className="ud-role-row-v43"><span>Cloud</span><b>{access.storageProjects} проектов</b></div>
            </>
          ) : (
            <>
              <div className="ud-role-row-v43"><span>FREE</span><b>попробовать студию</b></div>
              <div className="ud-role-row-v43"><span>PRO</span><b>полный доступ и LIVE</b></div>
              <div className="ud-role-row-v43"><span>Cloud</span><b>{access.storageProjects} проекта</b></div>
            </>
          )}
        </div>

        <ApiKeyVault account={account} access={access} onAccountPatch={onAccountPatch} />
      </div>
    </section>
  );
}
