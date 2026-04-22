"use client";

import { useMemo, useState } from "react";
import { SYS_SCENE_ENGINE, buildSceneUserPrompt } from "../engine/sceneEngine";
import { SYS_PROMPT_ENGINE, buildPromptUserPrompt } from "../engine/promptEngine";

const T = {
  ru: {
    title: "NeuroCine Studio",
    subtitle: "Сцены и промпты",
    scriptLabel: "Сценарий",
    scriptPlaceholder: "Вставь сценарий или идею...",
    modeLabel: "Режим",
    durationLabel: "Длительность",
    langLabel: "Язык",
    generate: "Сгенерировать сцены",
    generating: "Генерация...",
    buildPrompts: "Сгенерировать промпты",
    buildingPrompts: "Сборка промптов...",
    noScenes: "Сцены пока не сгенерированы",
    noPrompts: "Промпты пока не сгенерированы",
    resultTitle: "Сцены",
    promptsTitle: "Промпты",
    errorTitle: "Ошибка",
    modeShorts: "Шортс",
    modeCinematic: "Кино",
    modeLong: "Длинное",
    dur60: "До 60 сек",
    dur180: "До 3 мин",
    dur600: "До 10 мин",
    goal: "Цель",
    voice: "Озвучка",
    visual: "Визуал",
    camera: "Камера",
    motion: "Движение",
    lighting: "Свет",
    environment: "Среда",
    sfx: "SFX",
    timing: "Тайминг",
    modeGen: "Режим генерации",
    emptyScript: "Вставь сценарий перед генерацией.",
    imgPrompt: "Image prompt",
    vidPrompt: "Video prompt",
    negative: "Negative prompt",
  },
  en: {
    title: "NeuroCine Studio",
    subtitle: "Scenes and prompts",
    scriptLabel: "Script",
    scriptPlaceholder: "Paste your script or idea...",
    modeLabel: "Mode",
    durationLabel: "Duration",
    langLabel: "Language",
    generate: "Generate scenes",
    generating: "Generating...",
    buildPrompts: "Generate prompts",
    buildingPrompts: "Building prompts...",
    noScenes: "No scenes generated yet",
    noPrompts: "No prompts generated yet",
    resultTitle: "Scenes",
    promptsTitle: "Prompts",
    errorTitle: "Error",
    modeShorts: "Shorts",
    modeCinematic: "Cinematic",
    modeLong: "Long",
    dur60: "Up to 60 sec",
    dur180: "Up to 3 min",
    dur600: "Up to 10 min",
    goal: "Goal",
    voice: "Voice",
    visual: "Visual",
    camera: "Camera",
    motion: "Motion",
    lighting: "Lighting",
    environment: "Environment",
    sfx: "SFX",
    timing: "Timing",
    modeGen: "Generation mode",
    emptyScript: "Paste a script before generating.",
    imgPrompt: "Image prompt",
    vidPrompt: "Video prompt",
    negative: "Negative prompt",
  },
};

const MODE_TO_ENGINE = {
  shorts: "shorts",
  cinematic: "cinematic",
  long: "long",
};

const DURATION_MAP = {
  60: 60,
  180: 180,
  600: 600,
};

function cardStyle(border = "rgba(168,85,247,0.22)") {
  return {
    background: "rgba(14,14,24,0.92)",
    border: `1px solid ${border}`,
    borderRadius: 18,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
  };
}

export default function Page() {
  const [uiLanguage, setUiLanguage] = useState("ru");
  const [script, setScript] = useState("");
  const [projectMode, setProjectMode] = useState("shorts");
  const [durationTotal, setDurationTotal] = useState(60);
  const [scenes, setScenes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [error, setError] = useState("");

  const t = useMemo(() => T[uiLanguage] || T.ru, [uiLanguage]);

  async function callAPI(content, system) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "API error");
    }

    return data?.text || "";
  }

  function cleanJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      const match = String(str).match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return {};
    }
  }

  async function generateScenes() {
    if (!script.trim()) {
      setError(t.emptyScript);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setScenes([]);
      setPrompts([]);

      const prompt = buildSceneUserPrompt({
        script,
        mode: MODE_TO_ENGINE[projectMode],
        total: DURATION_MAP[durationTotal],
        characters: [],
      });

      const raw = await callAPI(prompt, SYS_SCENE_ENGINE);
      const data = cleanJSON(raw);

      setScenes(Array.isArray(data?.scenes) ? data.scenes : []);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function generatePrompts() {
    if (!scenes.length) return;

    try {
      setLoadingPrompts(true);
      setError("");
      setPrompts([]);

      const prompt = buildPromptUserPrompt({ scenes });
      const raw = await callAPI(prompt, SYS_PROMPT_ENGINE);
      const data = cleanJSON(raw);

      setPrompts(Array.isArray(data?.prompts) ? data.prompts : []);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingPrompts(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(88,28,135,0.28), transparent 30%), #06070d",
        color: "#f5f5f7",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "20px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle("rgba(168,85,247,0.25)"),
            padding: 18,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              🎬 {t.title}
            </div>
            <div style={{ color: "#a1a1aa", marginTop: 4 }}>{t.subtitle}</div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#a1a1aa", fontSize: 13 }}>{t.langLabel}</span>
            <button
              onClick={() => setUiLanguage("ru")}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: uiLanguage === "ru" ? "#7c3aed" : "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              RU
            </button>
            <button
              onClick={() => setUiLanguage("en")}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: uiLanguage === "en" ? "#7c3aed" : "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              EN
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ ...cardStyle(), padding: 16 }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#c4b5fd",
                    marginBottom: 8,
                  }}
                >
                  {t.scriptLabel}
                </div>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={t.scriptPlaceholder}
                  style={{
                    width: "100%",
                    minHeight: 180,
                    resize: "vertical",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#fff",
                    padding: 16,
                    fontSize: 16,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#c4b5fd",
                      marginBottom: 8,
                    }}
                  >
                    {t.modeLabel}
                  </div>
                  <select
                    value={projectMode}
                    onChange={(e) => setProjectMode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <option value="shorts" style={{ color: "#000" }}>
                      {t.modeShorts}
                    </option>
                    <option value="cinematic" style={{ color: "#000" }}>
                      {t.modeCinematic}
                    </option>
                    <option value="long" style={{ color: "#000" }}>
                      {t.modeLong}
                    </option>
                  </select>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#c4b5fd",
                      marginBottom: 8,
                    }}
                  >
                    {t.durationLabel}
                  </div>
                  <select
                    value={durationTotal}
                    onChange={(e) => setDurationTotal(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <option value={60} style={{ color: "#000" }}>
                      {t.dur60}
                    </option>
                    <option value={180} style={{ color: "#000" }}>
                      {t.dur180}
                    </option>
                    <option value={600} style={{ color: "#000" }}>
                      {t.dur600}
                    </option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={generateScenes}
                  disabled={loading}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(168,85,247,0.45)",
                    background: loading
                      ? "rgba(168,85,247,0.3)"
                      : "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  {loading ? `⏳ ${t.generating}` : `🚀 ${t.generate}`}
                </button>

                <button
                  onClick={generatePrompts}
                  disabled={loadingPrompts || !scenes.length}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(59,130,246,0.45)",
                    background:
                      loadingPrompts || !scenes.length
                        ? "rgba(59,130,246,0.2)"
                        : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: loadingPrompts || !scenes.length ? "default" : "pointer",
                  }}
                >
                  {loadingPrompts ? `⏳ ${t.buildingPrompts}` : `🎥 ${t.buildPrompts}`}
                </button>
              </div>

              {error ? (
                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#fca5a5",
                    fontSize: 14,
                  }}
                >
                  <b>{t.errorTitle}:</b> {error}
                </div>
              ) : null}
            </div>
          </section>

          <section style={{ ...cardStyle(), padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>
              {t.resultTitle}
            </div>

            {!scenes.length ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  color: "#a1a1aa",
                }}
              >
                {t.noScenes}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {scenes.map((scene, index) => (
                  <div
                    key={scene.id || index}
                    style={{
                      ...cardStyle("rgba(255,255,255,0.1)"),
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800 }}>
                        {scene.id || `scene_${index + 1}`}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#c4b5fd",
                          background: "rgba(124,58,237,0.15)",
                          border: "1px solid rgba(124,58,237,0.35)",
                          padding: "6px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {t.timing}: {scene.start}s → {scene.end}s
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                      <div><b>{t.goal}:</b> {scene.scene_goal || "-"}</div>
                      <div><b>{t.voice}:</b> {scene.voice || "-"}</div>
                      <div><b>{t.visual}:</b> {scene.visual || "-"}</div>
                      <div><b>{t.camera}:</b> {scene.camera || "-"}</div>
                      <div><b>{t.motion}:</b> {scene.motion || "-"}</div>
                      <div><b>{t.lighting}:</b> {scene.lighting || "-"}</div>
                      <div><b>{t.environment}:</b> {scene.environment || "-"}</div>
                      <div><b>{t.sfx}:</b> {scene.sfx || "-"}</div>
                      <div><b>{t.modeGen}:</b> {scene.generation_mode || "-"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ ...cardStyle(), padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>
              {t.promptsTitle}
            </div>

            {!prompts.length ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  color: "#a1a1aa",
                }}
              >
                {t.noPrompts}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {prompts.map((item, index) => (
                  <div
                    key={item.scene_id || index}
                    style={{
                      ...cardStyle("rgba(59,130,246,0.18)"),
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
                      {item.scene_id || `prompt_${index + 1}`}
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div>
                        <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: 6 }}>
                          {t.imgPrompt}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {item.imgPrompt_EN || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: 6 }}>
                          {t.vidPrompt}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {item.vidPrompt_EN || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: 6 }}>
                          {t.negative}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {item.negative_prompt || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
