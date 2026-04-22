"use client";

import { useState } from "react";
import { SYS_SCENE_ENGINE, buildSceneUserPrompt } from "../engine/sceneEngine";
import { SYS_PROMPT_ENGINE, buildPromptUserPrompt } from "../engine/promptEngine";
import { SYS_REFERENCE_ENGINE, buildReferenceUserPrompt } from "../engine/referenceEngine";
import { buildCharacterDNA, injectCharactersIntoScript } from "../engine/characterEngine";

export default function Page() {
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [reference, setReference] = useState(null);

  const [loadingScenes, setLoadingScenes] = useState(false);
  const [loadingReference, setLoadingReference] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const [characters] = useState([
    buildCharacterDNA({
      name: "Alex",
      gender: "male",
      age: 28,
      style: "black tactical jacket, cinematic look"
    })
  ]);

  async function callAPI(content, system) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content }
        ]
      })
    });

    const data = await res.json();
    return data?.text || "";
  }

  function cleanJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      const match = String(str).match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return {};
    }
  }

  async function generateScenes() {
    try {
      setLoadingScenes(true);
      setScenes([]);
      setPrompts([]);

      const scriptWithChars = injectCharactersIntoScript(script, characters);

      const prompt = buildSceneUserPrompt({
        script: scriptWithChars,
        mode: "shorts",
        total: 60,
        characters
      });

      const raw = await callAPI(prompt, SYS_SCENE_ENGINE);
      const data = cleanJSON(raw);

      setScenes(data.scenes || []);
    } finally {
      setLoadingScenes(false);
    }
  }

  async function generateReference() {
    try {
      setLoadingReference(true);

      const prompt = buildReferenceUserPrompt({ characters });
      const raw = await callAPI(prompt, SYS_REFERENCE_ENGINE);
      const data = cleanJSON(raw);

      setReference(data.reference || null);
    } finally {
      setLoadingReference(false);
    }
  }

  async function generatePrompts() {
    try {
      setLoadingPrompts(true);
      setPrompts([]);

      const prompt = buildPromptUserPrompt({
        scenes,
        reference
      });

      const raw = await callAPI(prompt, SYS_PROMPT_ENGINE);
      const data = cleanJSON(raw);

      setPrompts(data.prompts || []);
    } finally {
      setLoadingPrompts(false);
    }
  }

  return (
    <main style={{ padding: 20, background: "#0b0b12", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ marginBottom: 20 }}>🎬 NeuroCine PRO</h1>

      <div style={{ marginBottom: 20 }}>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Вставь сценарий..."
          style={{
            width: "100%",
            height: 140,
            padding: 14,
            borderRadius: 12,
            border: "1px solid #333",
            background: "#111827",
            color: "#fff"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <button onClick={generateScenes} style={btnStyle}>
          {loadingScenes ? "..." : "🚀 Сцены"}
        </button>

        <button onClick={generateReference} style={btnStyle}>
          {loadingReference ? "..." : "🖼 Reference"}
        </button>

        <button onClick={generatePrompts} style={btnStyle}>
          {loadingPrompts ? "..." : "🎥 Промпты"}
        </button>
      </div>

      <section style={card}>
        <h2>Персонаж</h2>
        {characters.map((c, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div><b>Имя:</b> {c.name}</div>
            <div><b>Пол:</b> {c.gender}</div>
            <div><b>Возраст:</b> {c.age}</div>
            <div><b>Стиль:</b> {c.style}</div>
          </div>
        ))}
      </section>

      <section style={card}>
        <h2>Reference</h2>
        {!reference ? (
          <p style={{ opacity: 0.7 }}>Reference пока не создан</p>
        ) : (
          <>
            <p><b>Character:</b> {reference.character_name}</p>
            <p><b>Identity lock:</b> {reference.identity_lock}</p>
            <p><b>Outfit lock:</b> {reference.outfit_lock}</p>
            <div style={codeBlock}>{reference.reference_prompt_EN}</div>
          </>
        )}
      </section>

      <section style={card}>
        <h2>Сцены</h2>
        {!scenes.length ? (
          <p style={{ opacity: 0.7 }}>Сцен пока нет</p>
        ) : (
          scenes.map((s, i) => (
            <div key={i} style={sceneBox}>
              <p><b>{s.id}</b></p>
              <p><b>Goal:</b> {s.scene_goal}</p>
              <p><b>Voice:</b> {s.voice}</p>
              <p><b>Visual:</b> {s.visual}</p>
              <p><b>Camera:</b> {s.camera}</p>
              <p><b>Motion:</b> {s.motion}</p>
              <p><b>Lighting:</b> {s.lighting}</p>
              <p><b>Environment:</b> {s.environment}</p>
              <p><b>SFX:</b> {s.sfx}</p>
              <p><b>Mode:</b> {s.generation_mode}</p>
            </div>
          ))
        )}
      </section>

      <section style={card}>
        <h2>Промпты</h2>
        {!prompts.length ? (
          <p style={{ opacity: 0.7 }}>Промптов пока нет</p>
        ) : (
          prompts.map((p, i) => (
            <div key={i} style={sceneBox}>
              <p><b>{p.scene_id}</b></p>
              <p><b>MODE:</b> {p.generation_mode_final}</p>
              <div style={codeBlock}>{p.imgPrompt_EN}</div>
              <div style={codeBlock}>{p.vidPrompt_EN}</div>
              <div style={codeBlock}>{p.negative_prompt}</div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

const btnStyle = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #444",
  background: "#1f2937",
  color: "#fff",
  cursor: "pointer"
};

const card = {
  marginBottom: 20,
  padding: 16,
  borderRadius: 14,
  background: "#111827",
  border: "1px solid #2b3548"
};

const sceneBox = {
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  background: "#0f172a",
  border: "1px solid #334155"
};

const codeBlock = {
  marginTop: 10,
  padding: 12,
  borderRadius: 10,
  background: "#020617",
  border: "1px solid #334155",
  whiteSpace: "pre-wrap"
};
