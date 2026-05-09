"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccountAccess } from "../lib/accountRoles";

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("ru-RU"); } catch { return "—"; }
}

function fmtDateTime(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
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

function statusClass(status = "") {
  if (String(status).startsWith("err|")) return "err";
  if (String(status).startsWith("ok|")) return "ok";
  if (String(status).startsWith("gen|")) return "gen";
  return "";
}

function statusText(status = "") {
  return String(status || "")
    .replace(/^ok\|?/, "✓ ")
    .replace(/^gen\|?/, "⏳ ")
    .replace(/^err\|?/, "✗ ");
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
  const [verified, setVerified] = useState(null);

  const openrouter = providers?.openrouter || null;
  const connected = Boolean(openrouter?.connected || access.hasOwnApiKeys);
  const liveState = connected ? "live" : isProView ? "pending" : "locked";

  async function refresh() {
    if (!token) return;
    try {
      const r = await fetch("/api/user-keys", { headers: bearerHeaders(token) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) setProviders(d.providers || {});
    } catch {}
  }

  useEffect(() => { refresh(); }, [token]);

  function onKeyChange(value) {
    setApiKey(value);
    if (verified) setVerified(null);
    if (status.startsWith("ok|Ключ проверен")) setStatus("");
  }

  async function testKey() {
    const key = apiKey.trim();
    if (!key) { setStatus("err|Вставьте API key."); return; }
    setBusy(true); setStatus("gen|Проверяю ключ OpenRouter…");
    try {
      const r = await fetch("/api/user-keys/test", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter", apiKey: key }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setVerified(null);
        setStatus(`err|${d.error || d.message || "Ключ не прошёл проверку"}`);
        return;
      }
      const nextVerified = { masked: d.masked || "проверен", models_seen: d.models_seen || null, checked_at: new Date().toISOString() };
      setVerified(nextVerified);
      setStatus(`ok|Ключ проверен · ${nextVerified.masked}. Теперь нажмите “Сохранить”.`);
    } catch (e) {
      setVerified(null);
      setStatus("err|" + (e.message || "Ошибка проверки"));
    } finally { setBusy(false); }
  }

  async function saveKey() {
    const key = apiKey.trim();
    if (!key) { setStatus("err|Вставьте API key."); return; }
    setBusy(true); setStatus("gen|Сохраняю ключ в зашифрованном Vault…");
    try {
      const r = await fetch("/api/user-keys", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter", apiKey: key, keyLabel: "OpenRouter" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("err|" + (d.error || "Не удалось сохранить ключ"));
        return;
      }
      setApiKey("");
      setVerified(null);
      setStatus(`ok|OpenRouter сохранён · ${d.masked || "ключ подключён"}. LIVE для PRO включён.`);
      setProviders(prev => ({
        ...prev,
        openrouter: { connected: true, provider: "openrouter", masked: d.masked, last4: d.last4, status: d.status, updated_at: new Date().toISOString() },
      }));
      onAccountPatch?.(d.profile_patch || { api_keys_connected: true, default_mode: "live" });
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка сохранения"));
    } finally { setBusy(false); }
  }

  async function deleteKey() {
    const ok = typeof window !== "undefined" ? window.confirm("Отключить OpenRouter ключ? PRO останется активен, но LIVE снова будет ждать ключ.") : true;
    if (!ok) return;
    setBusy(true); setStatus("gen|Отключаю OpenRouter…");
    try {
      const r = await fetch("/api/user-keys/delete", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ provider: "openrouter" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("err|" + (d.error || "Не удалось удалить ключ"));
        return;
      }
      setProviders(prev => ({ ...prev, openrouter: null }));
      setVerified(null);
      onAccountPatch?.(d.profile_patch || { api_keys_connected: false });
      setStatus("ok|OpenRouter отключён. LIVE снова ждёт AI-ключ.");
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка удаления"));
    } finally { setBusy(false); }
  }

  if (!canManageKeys) {
    return (
      <div className="ud-card-v43 wide pro-own-keys-v53 key-vault-v54 locked key-vault-final-v621">
        <div className="ud-label-v43">AI-ключи</div>
        <strong className="ud-big-v43">Доступно в PRO</strong>
        <p>FREE подходит для знакомства со студией. В PRO открывается полный production-пайплайн и подключение собственных AI-ключей.</p>
        <div className="kv-steps-v621">
          <span>1 · купить/получить PRO</span>
          <span>2 · подключить OpenRouter</span>
          <span>3 · включить LIVE</span>
        </div>
      </div>
    );
  }

  if (isOwnerView) {
    return (
      <div className="ud-card-v43 wide pro-own-keys-v53 key-vault-v54 owner key-vault-final-v621">
        <div className="ud-label-v43">OWNER API</div>
        <strong className="ud-big-v43">Platform LIVE</strong>
        <p>Служебный режим владельца. OWNER использует ключи из Render ENV. Пользовательские ключи нужны только PRO-аккаунтам.</p>
        <div className="key-vault-status-v54">
          <div className="ud-role-row-v43"><span>Источник</span><b>Render ENV</b></div>
          <div className="ud-role-row-v43"><span>LIVE</span><b>включён</b></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ud-card-v43 wide pro-own-keys-v53 key-vault-v54 key-vault-final-v621 state-${liveState}`}>
      <div className="ud-label-v43">AI API Keys</div>
      <strong className="ud-big-v43">{connected ? "LIVE включён" : "LIVE ждёт AI-ключ"}</strong>
      <p>
        PRO активен. Подключите собственный AI API-ключ, чтобы реальные генерации шли через ваш OpenRouter, а не через platform API владельца.
      </p>

      <div className="kv-live-strip-v621">
        <div className={connected ? "ok" : "wait"}>
          <span>OpenRouter</span>
          <b>{connected ? `подключён ${openrouter?.masked || ""}` : "не подключён"}</b>
        </div>
        <div className={connected ? "ok" : "wait"}>
          <span>LIVE</span>
          <b>{connected ? "готов к генерации" : "ожидает сохранённый ключ"}</b>
        </div>
        <div>
          <span>API source</span>
          <b>{connected ? "user key" : "none"}</b>
        </div>
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
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="sk-or-v1-..."
          autoComplete="off"
        />
        <div className="kv-hint-v621">
          Ключ проверяется через OpenRouter models endpoint, затем сохраняется зашифрованным. Полный ключ обратно в браузер не возвращается.
        </div>
        <div className="key-vault-actions-v54">
          <button className="btn btn-sm btn-ghost" type="button" onClick={testKey} disabled={busy || !apiKey.trim()}>Проверить</button>
          <button className="btn btn-sm" type="button" onClick={saveKey} disabled={busy || !apiKey.trim()}>{verified ? "Сохранить проверенный" : "Проверить и сохранить"}</button>
          {connected && <button className="btn btn-sm btn-ghost" type="button" onClick={deleteKey} disabled={busy}>Отключить</button>}
        </div>
      </div>

      {verified && <div className="kv-verified-v621">✓ Проверен: {verified.masked}{verified.models_seen ? ` · моделей: ${verified.models_seen}` : ""}</div>}
      {openrouter?.updated_at && connected && <div className="kv-verified-v621 muted">Последнее обновление: {fmtDateTime(openrouter.updated_at)}</div>}
      {status && <div className={`status-line ${statusClass(status)}`}>{statusText(status)}</div>}
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
  const proReady = isProView && access.hasOwnApiKeys;

  const liveText = isOwnerView
    ? "LIVE включён для владельца платформы."
    : isProView
      ? (proReady ? "LIVE включён через собственный AI-ключ." : "PRO активен. Подключите AI-ключ, чтобы включить LIVE.")
      : "LIVE-генерация доступна в PRO.";

  const planDescription = isOwnerView
    ? "Служебный режим владельца: полный доступ, управление и тесты."
    : isProView
      ? "PRO — полный рабочий режим NeuroCine Studio с подключением собственных AI API-ключей."
      : "FREE — познакомьтесь с NeuroCine Studio и сохраните до 3 проектов.";

  const generationLabel = isOwnerView
    ? "LIVE OWNER"
    : isProView
      ? (proReady ? "PRO LIVE" : "PRO · ключ нужен")
      : "FREE Preview";

  return (
    <section className="user-dashboard-v43 user-dashboard-final-v621" id="account">
      <div className="ud-head-v43">
        <div>
          <div className="ud-kicker-v43">Account Center {isOwnerView ? "· OWNER" : isProView ? "· PRO" : "· FREE"}</div>
          <h2>Профиль и доступ</h2>
          <p>{isOwnerView ? "Служебный доступ владельца платформы." : "FREE для знакомства. PRO открывает полный production-пайплайн, Cloud workflow и LIVE через собственный AI-ключ."}</p>
        </div>
        <div className={`ud-access-badge-v43 role-${access.role} ${proReady ? "is-live-ready" : ""}`}>
          <span>{isOwnerView ? "OWNER FULL ACCESS" : isProView ? (proReady ? "PRO LIVE READY" : "PRO KEY PENDING") : "FREE PREVIEW"}</span>
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
          <strong className={access.canLive || isProView ? "ud-ok-v43" : "ud-lock-v43"}>{generationLabel}</strong>
          <p>{liveText}</p>
        </div>

        <div className="ud-card-v43">
          <div className="ud-label-v43">Лимиты</div>
          <div className="ud-role-row-v43"><span>Генерации / мес</span><b>{isOwnerView ? "∞" : (profile?.monthly_generation_limit || access.monthlyGenerations)}</b></div>
          <div className="ud-role-row-v43"><span>Cloud Projects</span><b>{isOwnerView ? "∞" : (profile?.cloud_project_limit || access.storageProjects)}</b></div>
          <div className="ud-role-row-v43"><span>API source</span><b>{isOwnerView ? "platform" : proReady ? "user key" : "none"}</b></div>
        </div>

        <div className="ud-card-v43 wide">
          <div className="ud-label-v43">Схема доступа</div>
          <div className="ud-role-row-v43"><span>FREE</span><b>preview + 3 проекта</b></div>
          <div className="ud-role-row-v43"><span>PRO</span><b>полный pipeline + свои AI-ключи</b></div>
          {isOwnerView && <div className="ud-role-row-v43"><span>OWNER</span><b>platform API + Admin Panel</b></div>}
        </div>

        <ApiKeyVault account={account} access={access} onAccountPatch={onAccountPatch} />
      </div>
    </section>
  );
}
