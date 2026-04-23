"use client";

import React, { useState } from "react";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);

  async function generate() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>NeuroCine Generator</h1>

      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Введи тему..."
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
          borderRadius: 8,
          border: "1px solid #444",
          background: "#111",
          color: "#fff"
        }}
      />

      <button
        onClick={generate}
        style={{
          marginTop: 10,
          padding: 12,
          width: "100%",
          borderRadius: 8,
          background: "#fff",
          color: "#000",
          fontWeight: "bold"
        }}
      >
        Сгенерировать
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Хуки</h3>
          <ul>
            {result.hooks?.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          <h3>Кадры</h3>
          {result.frames?.map((f, i) => (
            <div key={i} style={{ marginTop: 10 }}>
              <strong>{f.time}</strong>
              <p>{f.visual}</p>
              <p>{f.image_prompt}</p>
              <p>{f.video_prompt}</p>
              <p>{f.vo}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
