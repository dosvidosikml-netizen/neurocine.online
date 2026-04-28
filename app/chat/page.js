"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChatPage() {
  const [topic, setTopic]   = useState("");
  const [tone, setTone]     = useState("cinematic documentary thriller");
  const [duration, setDur]  = useState("60");
  const [result, setResult] = useState("");
  const [busy, setBusy]     = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setBusy(true); setResult("");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, duration: Number(duration) })
      });
      const d = await r.json();
      setResult(d.text || d.error || "");
    } catch (e) {
      setResult("Ошибка: " + e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="studio">
      <nav className="studio-nav">
        <div className="nav-brand">
          <div className="nav-kicker">NeuroCine Online</div>
          <div className="nav-title">Chat Generator</div>
        </div>
        <div className="nav-links">
          <Link href="/" className="nav-btn">Главная</Link>
          <Link href="/chat" className="nav-btn active">Chat</Link>
          <Link href="/storyboard" className="nav-btn">Studio</Link>
        </div>
      </nav>

      <section className="step-section">
        <div className="step-header">
          <div className="step-num">✍</div>
          <div className="step-info">
            <div className="step-title">Быстрый генератор сценария</div>
            <div className="step-desc">Тема → текст диктора · Полный пайплайн — в Studio</div>
          </div>
        </div>
        <div className="step-body">
          <div className="two-col">
            <div className="col">
              <div className="field">
                <label className="field-label">Тема</label>
                <textarea className="inp tall" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Ты бы не выжил в Средневековье — вот почему" />
              </div>
              <div className="frow frow2">
                <div className="field">
                  <label className="field-label">Тон</label>
                  <input className="inp" value={tone} onChange={e => setTone(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Длительность</label>
                  <select className="inp" value={duration} onChange={e => setDur(e.target.value)}>
                    <option value="30">30 сек</option>
                    <option value="60">60 сек</option>
                    <option value="90">90 сек</option>
                    <option value="180">3 мин</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-red btn-full" onClick={generate} disabled={busy || !topic.trim()}>
                {busy ? "⏳ Генерация..." : "▶ СГЕНЕРИРОВАТЬ"}
              </button>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Нужен полный пайплайн?{" "}
                <Link href="/storyboard" style={{ color: "var(--red)" }}>Открыть Studio →</Link>
              </div>
            </div>
            <div className="col">
              {result ? (
                <div className="out-box">
                  <div className="out-head">
                    <span className="out-label">Сценарий</span>
                    <button className="btn btn-sm btn-ghost" onClick={async () => {
                      await navigator.clipboard.writeText(result);
                    }}>Копировать</button>
                  </div>
                  <div className="out-body">
                    <pre className="out-pre">{result}</pre>
                  </div>
                </div>
              ) : (
                <div className="upload-zone" style={{ pointerEvents: "none", cursor: "default" }}>
                  <div className="upload-icon">📝</div>
                  <div className="upload-text">Сценарий появится здесь</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
