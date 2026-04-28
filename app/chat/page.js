"use client";

import { useState } from "react";
import TopNav from "../../components/TopNav";
import CopyBlock from "../../components/CopyBlock";

export default function ChatPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("cinematic documentary thriller");
  const [duration, setDuration] = useState("60");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, duration })
      });
      const data = await res.json();
      setResult(data.text || data.error || "");
    } catch (e) {
      setResult("Ошибка: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="wrap">
        <header className="header">
          <div className="brand">
            <div>
              <div className="kicker">NeuroCine Chat</div>
              <h1>Сценарии и хуки</h1>
              <p className="subtitle">Генерируй сценарий, потом отправляй его в Storyboard Studio.</p>
            </div>
            <button className="btn red" onClick={generate} disabled={busy}>
              {busy ? "ГЕНЕРАЦИЯ..." : "СГЕНЕРИРОВАТЬ"}
            </button>
          </div>
          <TopNav active="chat" />
        </header>

        <section className="grid two mt">
          <div className="card">
            <h2>Задача</h2>
            <label className="label">Тема</label>
            <textarea
              className="big"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Ты бы не выжил в средневековье — вот почему"
            />

            <div className="grid two mt">
              <div>
                <label className="label">Тон</label>
                <input value={tone} onChange={(e) => setTone(e.target.value)} />
              </div>
              <div>
                <label className="label">Длительность</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="30">30 сек</option>
                  <option value="60">60 сек</option>
                  <option value="90">90 сек</option>
                  <option value="180">3 минуты</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Результат</h2>
            {result ? <CopyBlock title="Сценарий" text={result} /> : <div className="drop">Здесь появится готовый сценарий.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
