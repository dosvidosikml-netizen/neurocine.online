"use client";

import { useEffect, useMemo, useState } from "react";

const DURATIONS = [30, 60, 90, 120, 180];
const LS_KEY = "neurocine_storyboard_result";
const LS_SCRIPT = "neurocine_storyboard_script";
const sample = `Восемьсот лет люди платили за билеты. Смотреть, как умирает человек. Казнь называлась лин чи — тысяча порезов. Палач работал методично: сначала пальцы, потом плечи, потом грудь. Каждый надрез — отдельная цена в прейскуранте. Богатые семьи платили БОЛЬШЕ — чтобы смерть пришла быстрее. Бедные платили меньше — и человек умирал часами. Последняя публичная казнь зафиксирована в 1905 году. Фотограф стоял в трёх метрах. Снимки попали в Европу — шок был не от крови, а от детей на заднем плане, которые смеялись. Китай запретил лин чи в том же году. Эти фотографии существуют до сих пор. Вопрос один: вы хотите их видеть — или уже боитесь ответа?`;

const GOOGLE_VOICES = [
  { id: "Algenib",  desc: "Gravelly · Lower pitch",         best: ["ИСТОРИЯ","ВОЙНА","КРИМИНАЛ"] },
  { id: "Algieba",  desc: "Smooth · Lower pitch",           best: ["ТАЙНА","ПСИХОЛОГИЯ"] },
  { id: "Alnilam",  desc: "Firm · Lower middle pitch",      best: ["НАУКА","ИСТОРИЯ"] },
  { id: "Charon",   desc: "Informative · Lower pitch",      best: ["НАУКА","ВОЙНА","ИСТОРИЯ"] },
  { id: "Iapetus",  desc: "Calm · Lower middle pitch",      best: ["ПСИХОЛОГИЯ","ТАЙНА"] },
  { id: "Orus",     desc: "Firm · Lower middle pitch",      best: ["КРИМИНАЛ"] },
  { id: "Kore",     desc: "Firm · Middle pitch",            best: ["ПСИХОЛОГИЯ","ТАЙНА"] },
  { id: "Fenrir",   desc: "Excitable · Lower middle pitch", best: ["КРИМИНАЛ"] },
  { id: "Aoede",    desc: "Breezy · Middle pitch",          best: ["ПРИРОДА"] },
  { id: "Sulafat",  desc: "Warm · Higher middle pitch",     best: ["ПСИХОЛОГИЯ"] },
  { id: "Autonoe",  desc: "Bright · Middle pitch",          best: ["НАУКА"] },
  { id: "Puck",     desc: "Upbeat · Middle pitch",          best: [] },
];

function CopyButton({ text, label = "Copy" }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text || "")}
      style={{
        border: "1px solid rgba(148,163,184,.25)",
        background: "rgba(15,23,42,.75)",
        color: "#c4b5fd",
        borderRadius: 10,
        padding: "7px 10px",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Field({ title, children, color = "#a78bfa" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ color, fontSize: 10, fontWeight: 950, letterSpacing: 1.2, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

export default function StoryboardPage() {
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState("safe");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [upscaleInput, setUpscaleInput] = useState("");
  const [upscaleFactor, setUpscaleFactor] = useState("x2");
  const [upscaleLoading, setUpscaleLoading] = useState(false);
  const [upscaleError, setUpscaleError] = useState("");
  const [upscaleResult, setUpscaleResult] = useState(null);

  // ── TTS STUDIO STATE ──────────────────────────────────────────────────────
  const [ttsData, setTtsData] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [activeTTSTab, setActiveTTSTab] = useState("google");
  const [ttsCopied, setTtsCopied] = useState("");

  // Загружаем сохранённые данные при монтировании
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem(LS_KEY);
      const savedScript = localStorage.getItem(LS_SCRIPT);
      if (savedResult) setResult(JSON.parse(savedResult));
      if (savedScript) setScript(savedScript);
    } catch (e) {}
  }, []);

  // Автосохранение сценария
  useEffect(() => {
    try { localStorage.setItem(LS_SCRIPT, script); } catch (e) {}
  }, [script]);

  function clearAll() {
    if (!confirm("Удалить раскадровку и сценарий? Это действие необратимо.")) return;
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_SCRIPT);
    } catch (e) {}
    setResult(null);
    setScript("");
    setError("");
  }

  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script]);
  const targetScenes = Math.round(duration / 3);

  async function generateStoryboard() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, duration, mode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Ошибка генерации");
      setResult(data);
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
    } catch (e) {
      setError(e.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.project_name || "neurocine_storyboard"}.json`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── TTS STUDIO ────────────────────────────────────────────────────────────
  // Собираем VO из всех сцен раскадровки
  const voScript = useMemo(
    () => (result?.scenes || []).map(s => s.vo_ru).filter(Boolean).join(" "),
    [result]
  );

  async function generateTTS() {
    if (!voScript.trim()) return;
    setTtsLoading(true);
    setTtsError("");
    setTtsData(null);
    const voiceList = GOOGLE_VOICES.map(v => `${v.id} (${v.desc})`).join(", ");
    const sys = `You are a PRO TTS Director for multi-platform voice production. Analyze the script and output ONLY valid JSON (no markdown, no text outside JSON):
{
  "scene": "Short location/atmosphere for TTS booth — 5-8 words, English.",
  "context": "Directing note — pacing and emotional arc in English, 1-2 sentences.",
  "voice_id": "Pick the single best voice from: ${voiceList}. Match to mood.",
  "voice_reason": "1 sentence in Russian why this voice fits.",
  "script_google": "Rewrite the FULL script with Google AI Studio emotion tags. Available: [intrigue] [desire] [shock] [information] [inspiration] [confident] [sad] [whisper] [aggressive] [calm]. Tag every 1-3 sentences. Preserve EXACT original language. Do NOT cut or summarize.",
  "script_elevenlabs": "Rewrite the FULL script with ElevenLabs SSML-style tags: <break time='0.5s'/>, <prosody rate='slow'>, <emphasis level='strong'>. Preserve ALL original text.",
  "script_clean": "The FULL script completely clean — no tags, no markdown. Ready to paste into any TTS.",
  "pacing_tips": "3 short Russian tips for recording this specific script."
}`;
    try {
      const res = await fetch("/api/check-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-6",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: `Сценарий:\n${voScript}` },
          ],
          max_tokens: 2000,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Ошибка TTS");
      const raw = String(data.text || "").replace(/```json/gi, "").replace(/```/gi, "").trim();
      const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
      const parsed = JSON.parse(raw.slice(start, end + 1));
      setTtsData(parsed);
      setActiveTTSTab("google");
    } catch (e) {
      setTtsError(e.message || "Ошибка TTS Studio");
    } finally {
      setTtsLoading(false);
    }
  }

  function copyTTS(text, key) {
    try { navigator.clipboard?.writeText(text || ""); } catch {}
    setTtsCopied(key);
    setTimeout(() => setTtsCopied(""), 2000);
  }

  async function upscaleImage(imageOverride = "") {
    const image = String(imageOverride || upscaleInput || "").trim();
    if (!image) {
      setUpscaleError("Вставь URL картинки или загрузи файл.");
      return;
    }
    setUpscaleLoading(true);
    setUpscaleError("");
    setUpscaleResult(null);
    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, upscale_factor: upscaleFactor, compression_quality: 95 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Ошибка upscale");
      setUpscaleResult(data);
    } catch (e) {
      setUpscaleError(e.message || "Ошибка upscale");
    } finally {
      setUpscaleLoading(false);
    }
  }

  function handleUpscaleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUpscaleError("Файл больше 10MB. Для Replicate google/upscaler нужен файл до 10MB или URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUpscaleInput(String(reader.result || ""));
      setUpscaleError("");
    };
    reader.onerror = () => setUpscaleError("Не удалось прочитать файл.");
    reader.readAsDataURL(file);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "#e5e7eb", padding: "28px 18px 70px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <style>{`
        @media (max-width: 767px) {
          .sb-grid { grid-template-columns: 1fr !important; }
          .sb-aside { position: static !important; }
          .sb-header { flex-direction: column !important; align-items: flex-start !important; }
          .sb-model-badge { min-width: unset !important; width: 100% !important; box-sizing: border-box; }
          .sb-meta-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 0%, rgba(168,85,247,.18), transparent 32%), radial-gradient(circle at 100% 12%, rgba(14,165,233,.14), transparent 28%), linear-gradient(180deg,#020617 0%,#05030a 100%)" }} />
      <section style={{ position: "relative", maxWidth: 1480, margin: "0 auto" }}>
        <header className="sb-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <a href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← На главную</a>
            <h1 style={{ fontSize: "clamp(22px,5vw,58px)", margin: "10px 0 6px", letterSpacing: "-.05em", lineHeight: 1 }}>NeuroCine Storyboard Engine</h1>
            <p style={{ color: "#94a3b8", maxWidth: 760, margin: 0, lineHeight: 1.55, fontSize: "clamp(12px,3vw,15px)" }}>GPT‑5.4 через OpenRouter. Storyboard Engine v2: clean image prompts → physical realism → cut energy → SAFE→GROK → upscale metadata → строгий JSON.</p>
          </div>
          <div className="sb-model-badge" style={{ border: "1px solid rgba(168,85,247,.32)", background: "rgba(15,23,42,.75)", borderRadius: 18, padding: "14px 16px", minWidth: 220 }}>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 950, letterSpacing: 1.2, textTransform: "uppercase" }}>Model</div>
            <div style={{ fontSize: 18, fontWeight: 950 }}>openai/gpt-5.4</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 5 }}>OpenRouter API · {mode === "safe" ? "GPT SAFE" : "GROK RAW"}</div>
          </div>
        </header>

        <div className="sb-grid" style={{ display: "grid", gridTemplateColumns: "minmax(300px, 430px) 1fr", gap: 18, alignItems: "start" }}>
          <aside className="sb-aside" style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(15,23,42,.7)", backdropFilter: "blur(16px)", borderRadius: 24, padding: 18, position: "sticky", top: 18 }}>
            <Field title="Длительность">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setDuration(d)} style={{ padding: "11px 0", borderRadius: 14, border: d === duration ? "1px solid #a78bfa" : "1px solid rgba(148,163,184,.2)", background: d === duration ? "rgba(168,85,247,.18)" : "rgba(2,6,23,.75)", color: d === duration ? "#fff" : "#94a3b8", fontWeight: 900, cursor: "pointer" }}>{d}</button>
                ))}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 9 }}>Цель: ~{targetScenes} кадров, сумма duration = {duration} сек.</div>
            </Field>

            <div style={{ height: 18 }} />
            <Field title="Режим генерации">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  onClick={() => setMode("safe")}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 14,
                    border: mode === "safe" ? "1px solid #34d399" : "1px solid rgba(148,163,184,.2)",
                    background: mode === "safe" ? "rgba(16,185,129,.18)" : "rgba(2,6,23,.75)",
                    color: mode === "safe" ? "#bbf7d0" : "#94a3b8",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  SAFE / GPT
                </button>
                <button
                  onClick={() => setMode("raw")}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 14,
                    border: mode === "raw" ? "1px solid #fb7185" : "1px solid rgba(148,163,184,.2)",
                    background: mode === "raw" ? "rgba(244,63,94,.16)" : "rgba(2,6,23,.75)",
                    color: mode === "raw" ? "#fecdd3" : "#94a3b8",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  GROK / RAW
                </button>
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 9 }}>
                {mode === "safe" ? "Для сайта и GPT API: безопасные формулировки, стабильный JSON, меньше блокировок." : "Для усиленных video prompts: больше камеры, движения и напряжения, но без эротизации и инструкционного насилия."}
              </div>
            </Field>

            <div style={{ height: 18 }} />
            <Field title="Upscale Pipeline · Replicate">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {["x2", "x4"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setUpscaleFactor(f)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 12,
                      border: upscaleFactor === f ? "1px solid #38bdf8" : "1px solid rgba(148,163,184,.2)",
                      background: upscaleFactor === f ? "rgba(14,165,233,.16)" : "rgba(2,6,23,.75)",
                      color: upscaleFactor === f ? "#bae6fd" : "#94a3b8",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                value={upscaleInput.startsWith("data:") ? "Файл загружен как data URL" : upscaleInput}
                onChange={(e) => setUpscaleInput(e.target.value)}
                placeholder="URL картинки для upscale..."
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(148,163,184,.18)", background: "rgba(2,6,23,.78)", color: "#e5e7eb", padding: 10, outline: "none", fontSize: 12, boxSizing: "border-box" }}
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUpscaleFile(e.target.files?.[0])}
                style={{ width: "100%", marginTop: 8, fontSize: 11, color: "#94a3b8" }}
              />
              <button
                onClick={() => upscaleImage()}
                disabled={upscaleLoading || !upscaleInput}
                style={{ width: "100%", marginTop: 9, padding: "12px 14px", border: 0, borderRadius: 14, background: upscaleLoading || !upscaleInput ? "#334155" : "linear-gradient(135deg,#0284c7,#22c55e)", color: "white", fontWeight: 950, cursor: upscaleLoading || !upscaleInput ? "not-allowed" : "pointer" }}
              >
                {upscaleLoading ? "Upscale…" : `Upscale ${upscaleFactor.toUpperCase()}`}
              </button>
              {upscaleError && <div style={{ marginTop: 9, color: "#fecaca", fontSize: 11 }}>{upscaleError}</div>}
              {upscaleResult?.output && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href={upscaleResult.output} target="_blank" rel="noreferrer" style={{ color: "#86efac", fontSize: 12, fontWeight: 900 }}>Открыть улучшенное изображение ↗</a>
                  <CopyButton text={upscaleResult.output} label="Копировать URL upscale" />
                </div>
              )}
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 9 }}>Replicate google/upscaler: x2/x4, compression 95. Ключ хранится на сервере как REPLICATE_API_TOKEN.</div>
            </Field>

            <div style={{ height: 18 }} />
            <Field title="Сценарий">
              <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Вставь сценарий сюда..." style={{ width: "100%", minHeight: 260, resize: "vertical", borderRadius: 18, border: "1px solid rgba(148,163,184,.18)", background: "rgba(2,6,23,.78)", color: "#e5e7eb", padding: 15, outline: "none", lineHeight: 1.55 }} />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 11, marginTop: 8 }}>
                <span>{wordCount} слов</span>
                <button onClick={() => setScript(sample)} style={{ background: "transparent", border: 0, color: "#a78bfa", cursor: "pointer", fontWeight: 800 }}>Вставить тест</button>
              </div>
            </Field>

            <button disabled={loading || !script.trim()} onClick={generateStoryboard} style={{ width: "100%", marginTop: 18, padding: "15px 18px", border: 0, borderRadius: 18, background: loading || !script.trim() ? "#334155" : "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 950, cursor: loading || !script.trim() ? "not-allowed" : "pointer", boxShadow: "0 18px 50px rgba(124,58,237,.28)" }}>
              {loading ? "Генерация раскадровки…" : "Сделать раскадровку"}
            </button>

            {error && <div style={{ marginTop: 14, padding: 12, borderRadius: 14, color: "#fecaca", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", fontSize: 12 }}>{error}</div>}
          </aside>

          <section style={{ minWidth: 0 }}>
            {!result && (
              <div style={{ border: "1px dashed rgba(148,163,184,.2)", borderRadius: 28, minHeight: 420, display: "grid", placeItems: "center", background: "rgba(15,23,42,.42)", textAlign: "center", padding: 34 }}>
                <div>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>🎬</div>
                  <h2 style={{ margin: 0, fontSize: 28 }}>Ждёт сценарий</h2>
                  <p style={{ color: "#94a3b8", maxWidth: 520, lineHeight: 1.55 }}>Выбери длительность, вставь сценарий и получи production-board как в агенте: кадры, промты, VO, SFX, camera и continuity.</p>
                </div>
              </div>
            )}

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="sb-meta-grid" style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(15,23,42,.72)", borderRadius: 24, padding: 18, display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 12 }}>
                  <Field title="Project"><b>{result.project_name}</b></Field>
                  <Field title="Duration"><b>{result.total_duration}s</b></Field>
                  <Field title="Scenes"><b>{result.scenes?.length || 0}</b></Field>
                  <Field title="Mode"><b>{result.export_meta?.mode || mode}</b></Field>
                  <Field title="Model"><b>{result.model_used || "openai/gpt-5.4"}</b></Field>
                  <div style={{ gridColumn: "1 / -1", color: "#94a3b8", fontSize: 12, lineHeight: 1.55 }}><b style={{ color: "#c4b5fd" }}>GLOBAL STYLE LOCK:</b> {result.global_style_lock}</div>
                  <div style={{ gridColumn: "1 / -1", color: "#94a3b8", fontSize: 12, lineHeight: 1.55 }}><b style={{ color: "#38bdf8" }}>GLOBAL VIDEO LOCK:</b> {result.global_video_lock || "grounded physical realism, realistic inertia, organic camera behavior"}</div>
                  <div style={{ gridColumn: "1 / -1", color: "#94a3b8", fontSize: 12, lineHeight: 1.55 }}><b style={{ color: "#86efac" }}>POSTPROCESS:</b> upscale {result.postprocess?.upscale || "x2"} · final {result.postprocess?.final_upscale || "x4"} · {result.postprocess?.model || "real-esrgan"} / {result.postprocess?.provider || "replicate"}</div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <CopyButton text={JSON.stringify(result, null, 2)} label="Копировать JSON" />
                    <button onClick={downloadJson} style={{ border: "1px solid rgba(52,211,153,.35)", background: "rgba(16,185,129,.12)", color: "#86efac", borderRadius: 10, padding: "7px 10px", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>Скачать JSON</button>
                    <button onClick={clearAll} style={{ border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.12)", color: "#fca5a5", borderRadius: 10, padding: "7px 10px", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>🗑 Очистить всё</button>
                  </div>
                </div>

                {result.validation && !result.validation.ok && (
                  <div style={{ border: "1px solid rgba(251,191,36,.3)", background: "rgba(251,191,36,.08)", color: "#fde68a", borderRadius: 18, padding: 14, fontSize: 12 }}>
                    <b>Validation warnings:</b> {result.validation.errors?.join(" · ")}
                  </div>
                )}

                <div style={{ overflowX: "auto", border: "1px solid rgba(148,163,184,.16)", borderRadius: 24, background: "rgba(2,6,23,.84)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1240 }}>
                    <thead>
                      <tr style={{ background: "rgba(15,23,42,.92)" }}>
                        {['ID / TIME','BEAT','CUT ENERGY','DESCRIPTION (RU)','IMAGE PROMPT (EN)','VIDEO PROMPT (EN)','GROK IMAGE (AUTO)','GROK VIDEO (AUTO)','VO (RU)','SFX','CAMERA','CONTINUITY / SAFETY'].map((h) => <th key={h} style={{ padding: 12, borderBottom: "1px solid rgba(148,163,184,.16)", borderRight: "1px solid rgba(148,163,184,.1)", textAlign: "left", fontSize: 10, color: "#c4b5fd", letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(result.scenes || []).map((s) => (
                        <tr key={s.id} style={{ verticalAlign: "top" }}>
                          <td style={tdStyle}><b>{s.id}</b><br/><span style={muted}>{s.start}s / {s.duration}s</span></td>
                          <td style={tdStyle}><span style={{ color: "#f0abfc", fontWeight: 900 }}>{s.beat_type}</span></td>
                          <td style={tdStyle}><span style={{ color: s.cut_energy === "high" ? "#fb7185" : s.cut_energy === "low" ? "#93c5fd" : "#fbbf24", fontWeight: 950 }}>{s.cut_energy || "medium"}</span></td>
                          <td style={tdStyle}>{s.description_ru}</td>
                          <td style={{ ...tdStyle, width: 280 }}><div style={mono}>{s.image_prompt_en}</div><CopyButton text={s.image_prompt_en} label="IMG" /></td>
                          <td style={{ ...tdStyle, width: 320 }}><div style={mono}>{s.video_prompt_en}</div><CopyButton text={s.video_prompt_en} label="VID" /></td>
                          <td style={{ ...tdStyle, width: 300 }}><div style={mono}>{s.image_prompt_grok_en || s.image_prompt_en}</div><CopyButton text={s.image_prompt_grok_en || s.image_prompt_en} label="G-IMG" /></td>
                          <td style={{ ...tdStyle, width: 340 }}><div style={mono}>{s.video_prompt_grok_en || s.video_prompt_en}</div><CopyButton text={s.video_prompt_grok_en || s.video_prompt_en} label="G-VID" /></td>
                          <td style={tdStyle}>{s.vo_ru}</td>
                          <td style={tdStyle}>{s.sfx}</td>
                          <td style={tdStyle}>{s.camera}</td>
                          <td style={tdStyle}><b>Continuity:</b> {s.continuity_note}<br/><br/><b>Safety:</b> {s.safety_note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TTS STUDIO ──────────────────────────────────────────────── */}
            {result && (
              <div style={{ marginTop: 18, border: "1px solid rgba(14,165,233,.3)", borderRadius: 24, background: "rgba(2,6,23,.84)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(14,165,233,.15)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: 1.5, color: "#38bdf8", textTransform: "uppercase", marginBottom: 4 }}>🎙 TTS Studio · Google AI</div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                      {voScript ? `VO собран из ${result.scenes?.length || 0} сцен · ${voScript.split(/\s+/).filter(Boolean).length} слов` : "Сначала сгенерируйте раскадровку"}
                    </div>
                  </div>
                  {ttsData && (
                    <button onClick={() => setTtsData(null)} style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                  )}
                </div>

                <div style={{ padding: 18 }}>
                  {/* Generate button */}
                  {!ttsData && (
                    <button
                      onClick={generateTTS}
                      disabled={ttsLoading || !voScript.trim()}
                      style={{ width: "100%", padding: "14px", border: 0, borderRadius: 14, background: ttsLoading || !voScript.trim() ? "#1e293b" : "linear-gradient(135deg,#0ea5e9,#0284c7)", color: ttsLoading || !voScript.trim() ? "#475569" : "#fff", fontWeight: 950, cursor: ttsLoading || !voScript.trim() ? "not-allowed" : "pointer", fontSize: 14, letterSpacing: 0.5, boxShadow: voScript.trim() && !ttsLoading ? "0 4px 20px rgba(14,165,233,.3)" : "none", transition: "all .2s" }}
                    >
                      {ttsLoading ? "⏳ Анализируем диктора..." : "🎙 СГЕНЕРИРОВАТЬ TTS НАСТРОЙКИ"}
                    </button>
                  )}
                  {ttsError && <div style={{ marginTop: 10, color: "#fca5a5", fontSize: 12, padding: "10px 14px", background: "rgba(239,68,68,.1)", borderRadius: 10 }}>{ttsError}</div>}

                  {/* Results */}
                  {ttsData && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Scene + Context */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "rgba(14,165,233,.07)", border: "1px solid rgba(14,165,233,.25)", borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 9, fontWeight: 950, color: "#38bdf8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>🎬 SCENE</div>
                          <div style={{ fontSize: 12, color: "#e0f2fe", fontWeight: 700, lineHeight: 1.4, fontFamily: "monospace" }}>{ttsData.scene}</div>
                        </div>
                        <div style={{ background: "rgba(168,85,247,.07)", border: "1px solid rgba(168,85,247,.25)", borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 9, fontWeight: 950, color: "#c084fc", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>📋 CONTEXT</div>
                          <div style={{ fontSize: 11, color: "#e9d5ff", lineHeight: 1.5 }}>{ttsData.context}</div>
                        </div>
                      </div>

                      {/* Voice */}
                      <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 950, color: "#34d399", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🎤 ГОЛОС</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div style={{ fontSize: 20, fontWeight: 950, color: "#fff", fontFamily: "monospace" }}>{ttsData.voice_id}</div>
                          <div style={{ fontSize: 10, color: "#6ee7b7", background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.25)", padding: "2px 8px", borderRadius: 20 }}>
                            {GOOGLE_VOICES.find(v => v.id === ttsData.voice_id)?.desc || ""}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#a7f3d0" }}>{ttsData.voice_reason}</div>
                      </div>

                      {/* Pacing tips */}
                      {ttsData.pacing_tips && (
                        <div style={{ background: "rgba(251,191,36,.05)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 9, fontWeight: 950, color: "#fbbf24", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>🎯 СОВЕТЫ ПО ТЕМПУ</div>
                          <div style={{ fontSize: 12, color: "#fef3c7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{ttsData.pacing_tips}</div>
                        </div>
                      )}

                      {/* Script tabs */}
                      {(() => {
                        const tabs = {
                          google:     { label: "🔵 Google AI",  color: "#38bdf8", text: ttsData.script_google     || "" },
                          elevenlabs: { label: "🟣 ElevenLabs", color: "#a78bfa", text: ttsData.script_elevenlabs || "" },
                          clean:      { label: "⚪ Чистый",     color: "#94a3b8", text: ttsData.script_clean       || "" },
                        };
                        const active = tabs[activeTTSTab];
                        return (
                          <div style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, overflow: "hidden" }}>
                            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                              {Object.entries(tabs).map(([k, v]) => (
                                <button key={k} onClick={() => setActiveTTSTab(k)} style={{ flex: 1, padding: "10px 4px", background: activeTTSTab === k ? "rgba(255,255,255,.06)" : "transparent", border: "none", color: activeTTSTab === k ? v.color : "#475569", fontSize: 10, fontWeight: 950, cursor: "pointer", transition: "all .2s", letterSpacing: 0.5 }}>
                                  {v.label}
                                </button>
                              ))}
                            </div>
                            <div style={{ padding: 14 }}>
                              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#fef3c7", lineHeight: 1.8, background: "rgba(0,0,0,.4)", padding: 12, borderRadius: 10, whiteSpace: "pre-wrap", maxHeight: 220, overflowY: "auto" }}>
                                {active.text || <span style={{ color: "#475569", fontStyle: "italic" }}>Нет данных</span>}
                              </div>
                              <button
                                onClick={() => copyTTS(active.text, activeTTSTab)}
                                style={{ marginTop: 10, width: "100%", background: ttsCopied === activeTTSTab ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.05)", border: `1px solid ${ttsCopied === activeTTSTab ? "#4ade80" : "rgba(255,255,255,.1)"}`, borderRadius: 8, padding: "8px 0", fontSize: 11, color: ttsCopied === activeTTSTab ? "#4ade80" : "rgba(255,255,255,.7)", cursor: "pointer", fontWeight: 800, transition: "all .2s" }}
                              >
                                {ttsCopied === activeTTSTab ? "✓ СКОПИРОВАНО" : `📋 СКОПИРОВАТЬ — ${active.label}`}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Reset */}
                      <button onClick={() => setTtsData(null)} style={{ width: "100%", padding: "9px", background: "transparent", border: "1px dashed rgba(255,255,255,.1)", borderRadius: 10, color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        🔄 Сгенерировать заново
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

const tdStyle = { padding: 12, borderBottom: "1px solid rgba(148,163,184,.12)", borderRight: "1px solid rgba(148,163,184,.08)", fontSize: 12, lineHeight: 1.55, color: "#dbeafe" };
const muted = { color: "#64748b", fontSize: 11 };
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", whiteSpace: "pre-wrap", color: "#cbd5e1", marginBottom: 8 };
