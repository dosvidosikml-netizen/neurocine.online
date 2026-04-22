"use client";

import { useMemo, useState } from "react";
import { SYS_SCENE_ENGINE, buildSceneUserPrompt } from "../engine/sceneEngine";
import { SYS_PROMPT_ENGINE, buildPromptUserPrompt } from "../engine/promptEngine";
import { SYS_REFERENCE_ENGINE, buildReferenceUserPrompt } from "../engine/referenceEngine";
import { buildCharacterDNA, injectCharactersIntoScript } from "../engine/characterEngine";

const TEXT = {
  ru: {
    appTitle: "NeuroCine Studio",
    appSub: "AI видео-студия",
    script: "Сценарий",
    scriptPlaceholder: "Вставь сценарий или идею...",
    character: "Персонаж",
    reference: "Reference",
    scenes: "Сцены",
    prompts: "Промпты",
    noReference: "Reference пока не создан",
    noScenes: "Сцен пока нет",
    noPrompts: "Промптов пока нет",
    btnScenes: "Сгенерировать сцены",
    btnReference: "Сгенерировать reference",
    btnPrompts: "Сгенерировать промпты",
    loading: "Генерация...",
    name: "Имя",
    gender: "Пол",
    age: "Возраст",
    style: "Стиль",
    identityLock: "Identity lock",
    outfitLock: "Outfit lock",
    goal: "Цель",
    voice: "Озвучка",
    visual: "Визуал",
    camera: "Камера",
    motion: "Движение",
    lighting: "Свет",
    environment: "Среда",
    sfx: "SFX",
    mode: "Режим",
    tabStudio: "Студия",
    tabScenes: "Сцены",
    tabPrompts: "Промпты",
    tabReference: "Reference",
    male: "Мужской",
    female: "Женский",
    saveCharacter: "Обновить персонажа",
  },
  en: {
    appTitle: "NeuroCine Studio",
    appSub: "AI video studio",
    script: "Script",
    scriptPlaceholder: "Paste your script or idea...",
    character: "Character",
    reference: "Reference",
    scenes: "Scenes",
    prompts: "Prompts",
    noReference: "Reference not created yet",
    noScenes: "No scenes yet",
    noPrompts: "No prompts yet",
    btnScenes: "Generate scenes",
    btnReference: "Generate reference",
    btnPrompts: "Generate prompts",
    loading: "Generating...",
    name: "Name",
    gender: "Gender",
    age: "Age",
    style: "Style",
    identityLock: "Identity lock",
    outfitLock: "Outfit lock",
    goal: "Goal",
    voice: "Voice",
    visual: "Visual",
    camera: "Camera",
    motion: "Motion",
    lighting: "Lighting",
    environment: "Environment",
    sfx: "SFX",
    mode: "Mode",
    tabStudio: "Studio",
    tabScenes: "Scenes",
    tabPrompts: "Prompts",
    tabReference: "Reference",
    male: "Male",
    female: "Female",
    saveCharacter: "Update character",
  },
};

export default function Page() {
  const [lang, setLang] = useState("ru");
  const [activeTab, setActiveTab] = useState("studio");

  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [reference, setReference] = useState(null);

  const [loadingScenes, setLoadingScenes] = useState(false);
  const [loadingReference, setLoadingReference] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [error, setError] = useState("");

  const [characterForm, setCharacterForm] = useState({
    name: "Alex",
    gender: "male",
    age: 28,
    style: "black tactical jacket, cinematic look",
  });

  const [characters, setCharacters] = useState([
    buildCharacterDNA({
      name: "Alex",
      gender: "male",
      age: 28,
      style: "black tactical jacket, cinematic look",
    }),
  ]);

  const t = useMemo(() => TEXT[lang], [lang]);

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
      if (match) return JSON.parse(match[0]);
      return {};
    }
  }

  function updateCharacter() {
    const next = buildCharacterDNA({
      name: characterForm.name,
      gender: characterForm.gender,
      age: Number(characterForm.age),
      style: characterForm.style,
    });

    setCharacters([next]);
    setReference(null);
    setScenes([]);
    setPrompts([]);
  }

  async function generateScenes() {
    try {
      setLoadingScenes(true);
      setError("");
      setScenes([]);
      setPrompts([]);

      const scriptWithChars = injectCharactersIntoScript(script, characters);

      const prompt = buildSceneUserPrompt({
        script: scriptWithChars,
        mode: "shorts",
        total: 60,
        characters,
      });

      const raw = await callAPI(prompt, SYS_SCENE_ENGINE);
      const data = cleanJSON(raw);

      setScenes(data.scenes || []);
      setActiveTab("scenes");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingScenes(false);
    }
  }

  async function generateReference() {
    try {
      setLoadingReference(true);
      setError("");

      const prompt = buildReferenceUserPrompt({ characters });
      const raw = await callAPI(prompt, SYS_REFERENCE_ENGINE);
      const data = cleanJSON(raw);

      setReference(data.reference || null);
      setActiveTab("reference");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingReference(false);
    }
  }

  async function generatePrompts() {
    try {
      setLoadingPrompts(true);
      setError("");
      setPrompts([]);

      const prompt = buildPromptUserPrompt({
        scenes,
        reference,
      });

      const raw = await callAPI(prompt, SYS_PROMPT_ENGINE);
      const data = cleanJSON(raw);

      setPrompts(data.prompts || []);
      setActiveTab("prompts");
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoadingPrompts(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>🎬 {t.appTitle}</div>
            <div style={styles.subtitle}>{t.appSub}</div>
          </div>

          <div style={styles.langWrap}>
            <button
              onClick={() => setLang("ru")}
              style={{
                ...styles.langBtn,
                ...(lang === "ru" ? styles.langBtnActive : {}),
              }}
            >
              RU
            </button>
            <button
              onClick={() => setLang("en")}
              style={{
                ...styles.langBtn,
                ...(lang === "en" ? styles.langBtnActive : {}),
              }}
            >
              EN
            </button>
          </div>
        </header>

        <nav style={styles.tabs}>
          <button
            onClick={() => setActiveTab("studio")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "studio" ? styles.tabBtnActive : {}),
            }}
          >
            {t.tabStudio}
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "reference" ? styles.tabBtnActive : {}),
            }}
          >
            {t.tabReference}
          </button>
          <button
            onClick={() => setActiveTab("scenes")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "scenes" ? styles.tabBtnActive : {}),
            }}
          >
            {t.tabScenes}
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "prompts" ? styles.tabBtnActive : {}),
            }}
          >
            {t.tabPrompts}
          </button>
        </nav>

        {error ? (
          <div style={styles.errorBox}>
            <b>Error:</b> {error}
          </div>
        ) : null}

        {activeTab === "studio" && (
          <section style={styles.grid}>
            <div style={styles.cardLarge}>
              <div style={styles.cardTitle}>{t.script}</div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={t.scriptPlaceholder}
                style={styles.textarea}
              />

              <div style={styles.actions}>
                <button onClick={generateScenes} style={styles.primaryBtn}>
                  {loadingScenes ? `⏳ ${t.loading}` : `🚀 ${t.btnScenes}`}
                </button>
                <button onClick={generateReference} style={styles.secondaryBtn}>
                  {loadingReference ? `⏳ ${t.loading}` : `🖼 ${t.btnReference}`}
                </button>
                <button onClick={generatePrompts} style={styles.secondaryBlueBtn}>
                  {loadingPrompts ? `⏳ ${t.loading}` : `🎥 ${t.btnPrompts}`}
                </button>
              </div>
            </div>

            <div style={styles.cardSide}>
              <div style={styles.cardTitle}>{t.character}</div>

              <div style={styles.formGrid}>
                <label style={styles.label}>
                  <span>{t.name}</span>
                  <input
                    value={characterForm.name}
                    onChange={(e) =>
                      setCharacterForm((p) => ({ ...p, name: e.target.value }))
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <span>{t.gender}</span>
                  <select
                    value={characterForm.gender}
                    onChange={(e) =>
                      setCharacterForm((p) => ({ ...p, gender: e.target.value }))
                    }
                    style={styles.input}
                  >
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                  </select>
                </label>

                <label style={styles.label}>
                  <span>{t.age}</span>
                  <input
                    type="number"
                    value={characterForm.age}
                    onChange={(e) =>
                      setCharacterForm((p) => ({ ...p, age: e.target.value }))
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  <span>{t.style}</span>
                  <textarea
                    value={characterForm.style}
                    onChange={(e) =>
                      setCharacterForm((p) => ({ ...p, style: e.target.value }))
                    }
                    style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                  />
                </label>

                <button onClick={updateCharacter} style={styles.secondaryBtn}>
                  🧬 {t.saveCharacter}
                </button>
              </div>

              <div style={styles.metaPreview}>
                {characters.map((c, i) => (
                  <div key={i} style={styles.metaBlock}>
                    <div><b>{t.name}:</b> {c.name}</div>
                    <div><b>{t.gender}:</b> {c.gender}</div>
                    <div><b>{t.age}:</b> {c.age}</div>
                    <div><b>{t.style}:</b> {c.style}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "reference" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.reference}</div>
            {!reference ? (
              <div style={styles.empty}>{t.noReference}</div>
            ) : (
              <div style={styles.stack}>
                <div><b>Character:</b> {reference.character_name}</div>
                <div><b>{t.identityLock}:</b> {reference.identity_lock}</div>
                <div><b>{t.outfitLock}:</b> {reference.outfit_lock}</div>
                <div style={styles.codeBlock}>{reference.reference_prompt_EN}</div>
              </div>
            )}
          </section>
        )}

        {activeTab === "scenes" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.scenes}</div>
            {!scenes.length ? (
              <div style={styles.empty}>{t.noScenes}</div>
            ) : (
              <div style={styles.stack}>
                {scenes.map((s, i) => (
                  <div key={i} style={styles.sceneBox}>
                    <div style={styles.sceneHead}>
                      <div style={styles.sceneId}>{s.id}</div>
                      <div style={styles.badge}>{t.mode}: {s.generation_mode}</div>
                    </div>
                    <div><b>{t.goal}:</b> {s.scene_goal}</div>
                    <div><b>{t.voice}:</b> {s.voice}</div>
                    <div><b>{t.visual}:</b> {s.visual}</div>
                    <div><b>{t.camera}:</b> {s.camera}</div>
                    <div><b>{t.motion}:</b> {s.motion}</div>
                    <div><b>{t.lighting}:</b> {s.lighting}</div>
                    <div><b>{t.environment}:</b> {s.environment}</div>
                    <div><b>{t.sfx}:</b> {s.sfx}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "prompts" && (
          <section style={styles.cardFull}>
            <div style={styles.cardTitle}>{t.prompts}</div>
            {!prompts.length ? (
              <div style={styles.empty}>{t.noPrompts}</div>
            ) : (
              <div style={styles.stack}>
                {prompts.map((p, i) => (
                  <div key={i} style={styles.sceneBox}>
                    <div style={styles.sceneHead}>
                      <div style={styles.sceneId}>{p.scene_id}</div>
                      <div style={styles.badge}>{t.mode}: {p.generation_mode_final}</div>
                    </div>
                    <div style={styles.codeBlock}>{p.imgPrompt_EN}</div>
                    <div style={styles.codeBlock}>{p.vidPrompt_EN}</div>
                    <div style={styles.codeBlock}>{p.negative_prompt}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#06070d",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "20px 14px 50px",
  },
  bgGlowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 500,
    height: 500,
    background: "radial-gradient(circle, rgba(124,58,237,0.22), transparent 65%)",
    pointerEvents: "none",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: -180,
    right: -80,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 65%)",
    pointerEvents: "none",
  },
  shell: {
    maxWidth: 1100,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  title: {
    fontSize: 40,
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },
  subtitle: {
    color: "#a1a1aa",
    marginTop: 4,
  },
  langWrap: {
    display: "flex",
    gap: 8,
  },
  langBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontWeight: 700,
  },
  langBtnActive: {
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    border: "1px solid rgba(168,85,247,0.7)",
  },
  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  tabBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontWeight: 700,
  },
  tabBtnActive: {
    background: "rgba(124,58,237,0.18)",
    border: "1px solid rgba(168,85,247,0.45)",
  },
  errorBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.35)",
    color: "#fca5a5",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 16,
  },
  cardLarge: {
    background: "rgba(14,14,24,0.92)",
    border: "1px solid rgba(168,85,247,0.22)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  },
  cardSide: {
    background: "rgba(14,14,24,0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  },
  cardFull: {
    background: "rgba(14,14,24,0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 14,
  },
  textarea: {
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
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
  primaryBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid rgba(168,85,247,0.45)",
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
  },
  secondaryBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
  },
  secondaryBlueBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid rgba(59,130,246,0.45)",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
  },
  formGrid: {
    display: "grid",
    gap: 12,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 14,
    color: "#d4d4d8",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    boxSizing: "border-box",
  },
  metaPreview: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  metaBlock: {
    display: "grid",
    gap: 8,
    color: "#e4e4e7",
  },
  empty: {
    padding: 16,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    color: "#a1a1aa",
  },
  stack: {
    display: "grid",
    gap: 14,
  },
  sceneBox: {
    padding: 14,
    borderRadius: 14,
    background: "#0f172a",
    border: "1px solid #334155",
    display: "grid",
    gap: 8,
  },
  sceneHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  sceneId: {
    fontSize: 18,
    fontWeight: 900,
  },
  badge: {
    fontSize: 12,
    color: "#c4b5fd",
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.35)",
    padding: "6px 10px",
    borderRadius: 999,
  },
  codeBlock: {
    marginTop: 6,
    padding: 12,
    borderRadius: 10,
    background: "#020617",
    border: "1px solid #334155",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    color: "#e4e4e7",
  },
};
