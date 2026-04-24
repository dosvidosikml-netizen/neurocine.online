"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Login failed");
      window.location.href = nextPath.startsWith("/admin") ? nextPath : "/admin";
    } catch (err) {
      setStatus(err?.message === "Forbidden" ? "Неверный PIN" : `Ошибка входа: ${err?.message || "попробуй ещё раз"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#070711", color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", padding: 24, display: "grid", placeItems: "center" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 460, border: "1px solid rgba(168,85,247,.35)", background: "linear-gradient(180deg, rgba(24,24,37,.96), rgba(9,9,16,.96))", borderRadius: 24, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,.45)" }}>
        <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>NeuroCine Admin</div>
        <h1 style={{ margin: "10px 0 8px", fontSize: 34, lineHeight: 1.05 }}>Вход в админку</h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>После входа сервер создаст защищённую httpOnly cookie-сессию. PIN не хранится в браузере.</p>

        <label style={{ display: "block", marginTop: 24, color: "#cbd5e1", fontSize: 13, fontWeight: 800 }}>Admin PIN</label>
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" autoFocus placeholder="Введи PIN" style={{ width: "100%", marginTop: 8, boxSizing: "border-box", background: "#0f1020", border: "1px solid rgba(255,255,255,.12)", color: "#fff", borderRadius: 14, padding: "14px 16px", fontSize: 16, outline: "none" }} />

        <button disabled={busy || !pin.trim()} type="submit" style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 14, padding: "14px 16px", fontWeight: 950, cursor: busy ? "wait" : "pointer", color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)", opacity: busy || !pin.trim() ? 0.65 : 1 }}>{busy ? "Проверяю..." : "Войти"}</button>
        {status && <div style={{ marginTop: 16, color: "#f87171", fontWeight: 800 }}>{status}</div>}
        <a href="/" style={{ display: "inline-block", marginTop: 20, color: "#c4b5fd", textDecoration: "none", fontWeight: 800 }}>← На сайт</a>
      </form>
    </main>
  );
}
