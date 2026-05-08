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

  const isOwner = access.isOwner || access.isAdmin;
  const isPro = access.role === "pro" && !isOwner;
  const isFree = !isOwner && !isPro;

  async function startCheckout() {
    if (!token) {
      setStatus("✗ Нужно войти через Google.");
      return;
    }
    setBusy(true);
    setStatus("⏳ Готовлю PRO checkout…");
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: bearerHeaders(token),
        body: JSON.stringify({ plan: "pro" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Checkout недоступен");
      if (d.checkout_url) {
        setStatus("✓ Перехожу к оплате PRO…");
        window.location.href = d.checkout_url;
        return;
      }
      setStatus(d.message || "✓ Заявка на PRO создана. Платёжный провайдер пока не подключён — OWNER может выдать PRO вручную.");
    } catch (e) {
      setStatus("✗ " + (e.message || "Ошибка checkout"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="billing-panel-v61" id="billing">
      <div className="billing-head-v61">
        <div>
          <div className="billing-kicker-v61">Billing · PRO activation · v61</div>
          <h2>Тариф и оплата</h2>
          <p>
            FREE подходит для знакомства. PRO открывает полный рабочий режим NeuroCine Studio и LIVE через собственные AI-ключи.
          </p>
        </div>
        <div className={`billing-plan-badge-v61 ${isOwner ? "owner" : isPro ? "pro" : "free"}`}>
          <span>Текущий тариф</span>
          <strong>{planLabel(access)}</strong>
        </div>
      </div>

      <div className="billing-grid-v61">
        <article className="billing-card-v61 free">
          <div className="billing-card-top-v61">
            <span>FREE</span>
            <strong>$0</strong>
          </div>
          <p>Познакомиться со студией, сохранить первые проекты и пройти workflow без риска расходов.</p>
          <ul>
            <li>Preview-доступ к Studio</li>
            <li>Cloud Projects: {isOwner ? "∞" : 3}</li>
            <li>LIVE-генерация закрыта</li>
          </ul>
        </article>

        <article className={`billing-card-v61 pro ${isPro ? "active" : ""}`}>
          <div className="billing-card-top-v61">
            <span>PRO Studio</span>
            <strong>own AI keys</strong>
          </div>
          <p>Полный production-пайплайн: сценарий, storyboard, pipeline, Production Pack и LIVE через ключи пользователя.</p>
          <ul>
            <li>Полный Studio workflow</li>
            <li>Cloud Projects: 100</li>
            <li>LIVE после подключения AI-ключа</li>
          </ul>
          {isFree && (
            <button className="btn" type="button" onClick={startCheckout} disabled={busy}>
              Купить / активировать PRO
            </button>
          )}
          {isPro && <div className="billing-note-v61 ok">✓ PRO активен. Подключите AI-ключ, чтобы включить LIVE.</div>}
        </article>

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
          {isOwner && <div className="billing-note-v61 ok">✓ OWNER billing bypass активен.</div>}
        </article>
      </div>

      {status && <div className={`status-line ${status.startsWith("✗") ? "err" : status.startsWith("✓") ? "ok" : ""}`}>{status}</div>}
    </section>
  );
}
