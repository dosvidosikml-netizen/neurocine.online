
"use client";

import { useState } from "react";
import { SYS_SCENE_ENGINE, buildSceneUserPrompt } from "../engine/sceneEngine";
import { SYS_PROMPT_ENGINE, buildPromptUserPrompt } from "../engine/promptEngine";
import { buildCharacterDNA, injectCharactersIntoScript } from "../engine/characterEngine";

export default function Page() {
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const match = str.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return {};
    }
  }

  async function generateScenes() {
    setLoading(true);
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
    setLoading(false);
  }

  async function generatePrompts() {
    setLoadingPrompts(true);

    const prompt = buildPromptUserPrompt({ scenes });
    const raw = await callAPI(prompt, SYS_PROMPT_ENGINE);
    const data = cleanJSON(raw);

    setPrompts(data.prompts || []);
    setLoadingPrompts(false);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>🎬 NeuroCine PRO</h1>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Вставь сценарий..."
        style={{ width: "100%", height: 120 }}
      />

      <br /><br />

      <button onClick={generateScenes}>
        {loading ? "Генерация..." : "🚀 Сцены"}
      </button>

      <button onClick={generatePrompts} style={{ marginLeft: 10 }}>
        {loadingPrompts ? "..." : "🎥 Промпты"}
      </button>

      <h2>Сцены:</h2>
      {scenes.map((s, i) => (
        <div key={i}>
          <b>{s.id}</b> {s.visual}
        </div>
      ))}

      <h2>Промпты:</h2>
      {prompts.map((p, i) => (
        <div key={i}>
          <p><b>{p.scene_id}</b></p>
          <p>{p.imgPrompt_EN}</p>
          <p>{p.vidPrompt_EN}</p>
          <p><b>MODE:</b> {p.generation_mode_final}</p>
        </div>
      ))}
    </main>
  );
}
