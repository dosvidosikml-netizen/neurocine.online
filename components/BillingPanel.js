"use client";

import { useMemo, useState } from "react";
import { getAccountAccess } from "../lib/accountRoles";

function bearerHeaders(token = "") {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function planLabel(access) {
  if (access.isOwner || access.isAdmin) return "OWNER";
  if (access.role === "pro") return "PRO";
  return "FREE";
}

export default function BillingPanel({ account }) {
  const session = account?.session || null;
  const profile = account?.profile || null;
  const token = session?.access_token || "";
  const access = useMemo(() => getAccountAccess(profile, session), [profile, session]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [requested, setRequested] = useState(false);

  const isOwner = access.isOwner || access.isAdmin;
  const isPro = access.role === "pro" && !isOwner;
  const isFree = !isOwner && !isPro;

  async function startCheckout() {
    if (!token) {
      setStatus("err|Нужно войти через Google.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setStatus("gen|Отправляю заявку на PRO…");
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ plan: "pro" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Checkout недоступен");
      if (d.checkout_url) {
        setStatus("ok|Открываю страницу оплаты PRO…");
        window.location.href = d.checkout_url;
        return;
      }
      setRequested(true);
      setStatus(`ok|Заявка на PRO записана${d.event?.id ? ` · ID ${String(d.event.id).slice(0, 8)}` : ""}. OWNER увидит её в Admin Panel.`);
    } catch (e) {
      setStatus("err|" + (e.message || "Ошибка checkout"));
    } finally {
      setBusy(false);
    }
  }

  const statusKind = status.startsWith("err|") ? "err" : status.startsWith("ok|") ? "ok" : "";
  const cleanStatus = status.replace(/^ok\|?/, "✓ ").replace(/^gen\|?/, "⏳ ").replace(/^err\|?/, "✗ ");

  return (
    <section className="billing-panel-v61" id="billing">
      <div className="billing-head-v61">
        <div>
          <div className="billing-kicker-v61">Billing · PRO access</div>
          <h2>Тариф и доступ</h2>
          <p>
            FREE — чтобы познакомиться со студией. PRO открывает полный production-пайплайн и LIVE после подключения собственного AI-ключа.
          </p>
        </div>
        <div className={`billing-plan-badge-v61 ${isOwner ? "owner" : isPro ? "pro" : "free"}`}>
          <span>Текущий тариф</span>
          <strong>{planLabel(access)}</strong>
        </div>
      </div>

      <div className={`billing-grid-v61 ${isOwner ? "owner-view" : "public-view"}`}>
        <article className="billing-card-v61 free">
          <div className="billing-card-top-v61">
            <span>FREE</span>
            <strong>$0</strong>
          </div>
          <p>Попробовать NeuroCine Studio, сохранить первые проекты и пройти основной workflow.</p>
          <ul>
            <li>Preview-доступ к Studio</li>
            <li>Cloud Projects: {isOwner ? "∞" : 3}</li>
            <li>LIVE-генерация доступна в PRO</li>
          </ul>
        </article>

        <article className={`billing-card-v61 pro ${isPro ? "active" : ""}`}>
          <div className="billing-card-top-v61">
            <span>PRO Studio</span>
            <strong>own AI keys</strong>
          </div>
          <p>Полный рабочий режим: сценарий, storyboard, pipeline, Production Pack, Cloud Library и LIVE через собственный AI-ключ.</p>
          <ul>
            <li>Полный Studio workflow</li>
            <li>Cloud Projects: 100</li>
            <li>LIVE после подключения AI-ключа</li>
          </ul>
          {isFree && (
            <div className="billing-action-box-v61">
              <button className="btn" type="button" onClick={startCheckout} disabled={busy || requested}>
                {busy ? "Отправляю…" : requested ? "Заявка отправлена" : "Купить / активировать PRO"}
              </button>
              {requested && <div className="billing-note-v61 ok">✓ Заявка записана. Владелец активирует PRO вручную.</div>}
            </div>
          )}
          {isPro && <div className="billing-note-v61 ok">✓ PRO активен. Подключите AI-ключ, чтобы включить LIVE.</div>}
        </article>

        {isOwner && (
          <article className="billing-card-v61 owner">
            <div className="billing-card-top-v61">
              <span>OWNER</span>
              <strong>platform</strong>
            </div>
            <p>Служебный доступ владельца: platform API, Admin Panel, тесты и управление пользователями.</p>
            <ul>
              <li>Видно только владельцу</li>
              <li>PRO можно выдать вручную</li>
              <li>Будущие webhook-платежи готовы</li>
            </ul>
            <div className="billing-note-v61 ok">✓ OWNER billing bypass активен.</div>
          </article>
        )}
      </div>

      {status && <div className={`status-line ${statusKind}`}>{cleanStatus}</div>}
    </section>
  );
}
