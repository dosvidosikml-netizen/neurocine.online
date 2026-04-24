"use client";

import { useEffect, useState } from "react";

const BILLING_KEY = "ds_billing";

function today() {
  return new Date().toLocaleDateString("ru-RU");
}

function readBilling() {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    if (!raw) return { tokens: 10, date: today() };
    const data = JSON.parse(raw);
    return {
      tokens: Number.isFinite(Number(data.tokens)) ? Number(data.tokens) : 10,
      date: data.date || today(),
    };
  } catch {
    return { tokens: 10, date: today() };
  }
}

function writeBilling(next) {
  localStorage.setItem(BILLING_KEY, JSON.stringify(next));
  return next;
}

export default function AdminPage() {
  const [billing, setBilling] = useState({ tokens: 10, date: today() });
  const [amount, setAmount] = useState(100);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBilling(readBilling());
  }, []);

  async function apply(action) {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount: Number(amount) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка операции");

      const current = readBilling();
      const value = Number(data.amount);
      let nextTokens = current.tokens;
      if (action === "set") nextTokens = value;
      if (action === "add") nextTokens = current.tokens + value;
      if (action === "subtract") nextTokens = Math.max(0, current.tokens - value);
      if (action === "reset") nextTokens = 3;

      const next = writeBilling({ tokens: nextTokens, date: today() });
      setBilling(next);
      setStatus(`Готово: ${action}. Баланс: ${next.tokens}`);
    } catch (err) {
      setStatus(`Ошибка: ${err?.message || "попробуй ещё раз"}`);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin-auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  return (
    <main style={{ minHeight: "100vh", background: "#070711", color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <section style={{ maxWidth: 760, margin: "0 auto", border: "1px solid rgba(168,85,247,.35)", background: "linear-gradient(180deg, rgba(24,24,37,.96), rgba(9,9,16,.96))", borderRadius: 26, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,.45)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>NeuroCine Admin</div>
            <h1 style={{ margin: "10px 0 8px", fontSize: 34, lineHeight: 1.05 }}>Управление звёздами</h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Текущая версия управляет балансом этого браузера через защищённую админ-сессию.</p>
          </div>
          <button onClick={logout} style={{ border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "#fff", borderRadius: 12, padding: "10px 14px", fontWeight: 850, cursor: "pointer" }}>Выйти</button>
        </div>

        <div style={{ marginTop: 24, padding: 22, borderRadius: 20, background: "rgba(124,58,237,.14)", border: "1px solid rgba(167,139,250,.25)" }}>
          <div style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 900 }}>Баланс</div>
          <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1, marginTop: 8 }}>⭐ {billing.tokens}</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>Дата записи: {billing.date}</div>
        </div>

        <label style={{ display: "block", marginTop: 24, color: "#cbd5e1", fontSize: 13, fontWeight: 850 }}>Количество</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" style={{ width: "100%", marginTop: 8, boxSizing: "border-box", background: "#0f1020", border: "1px solid rgba(255,255,255,.12)", color: "#fff", borderRadius: 14, padding: "14px 16px", fontSize: 16, outline: "none" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
          <button disabled={busy} onClick={() => apply("add")} style={btn("linear-gradient(135deg,#16a34a,#22c55e)")}>+ Начислить</button>
          <button disabled={busy} onClick={() => apply("set")} style={btn("linear-gradient(135deg,#2563eb,#7c3aed)")}>Установить</button>
          <button disabled={busy} onClick={() => apply("subtract")} style={btn("linear-gradient(135deg,#d97706,#f97316)")}>− Списать</button>
          <button disabled={busy} onClick={() => apply("reset")} style={btn("linear-gradient(135deg,#be123c,#ef4444)")}>Сбросить</button>
        </div>

        {status && <div style={{ marginTop: 18, color: status.startsWith("Ошибка") ? "#f87171" : "#4ade80", fontWeight: 850 }}>{status}</div>}
        <a href="/" style={{ display: "inline-block", marginTop: 22, color: "#c4b5fd", textDecoration: "none", fontWeight: 850 }}>← Вернуться на сайт</a>
      </section>
    </main>
  );
}

function btn(background) {
  return {
    border: 0,
    borderRadius: 14,
    padding: "14px 16px",
    fontWeight: 950,
    cursor: "pointer",
    color: "white",
    background,
  };
}
