"use client";

import { useMemo, useState } from "react";

const PROJECT_TYPES = {
  film: { label: "Фильм", styles: [
    ["cinematic_realism", "Cinematic Realism"],
    ["historical_doc", "Historical Documentary"],
    ["dark_thriller", "Dark Thriller"],
    ["true_crime", "True Crime"],
    ["war_doc", "War Documentary"]
  ]},
  animation: { label: "Мультфильм", styles: [
    ["two_d", "2D"],
    ["two_point_five_d", "2.5D"],
    ["three_d_cartoon", "3D Cartoon"],
    ["dark_adult_animation", "Dark Adult"],
    ["stop_motion", "Stop Motion"]
  ]},
  anime: { label: "Аниме", styles: [
    ["cinematic_anime", "Cinematic Anime"],
    ["dark_anime", "Dark Anime"]
  ]},
  comic: { label: "Комикс", styles: [
    ["graphic_novel", "Graphic Novel"],
    ["european_comic", "European Comic"]
  ]}
};

function cls(active, busy) {
  if (busy) return "btn busy";
  return active ? "btn active" : "btn";
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Page() {
  const [script, setScript] = useState("");
  const [projectType, setProjectType] = useState("film");
  const [stylePreset, setStylePreset] = useState("cinematic_realism");
  const [duration, setDuration] = useState(60);
  const [project, setProject] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState("A");
  const [explorePrompt, setExplorePrompt] = useState("");
  const [gridImage, setGridImage] = useState("");
  const [lockedPrompt, setLockedPrompt] = useState("");
  const [lockedImage, setLockedImage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("Готов к работе");
  const [error, setError] = useState("");

  const frames = project?.scenes || [];
  const selectedFrame = useMemo(() => frames.find((f) => f.id === selectedFrameId) || frames[0] || null, [frames, selectedFrameId]);

  function copy(text) {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    setStatus("Скопировано");
  }

  function clearSetter(setter) {
    setter("");
    setStatus("Блок очищен");
  }

  async function api(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Ошибка API");
    return data;
  }

  async function generateStoryboard() {
    try {
      setError("");
      setBusy("storyboard");
      setStatus("Генерирую storyboard через Director Core...");
      const data = await api("/api/storyboard", { script, projectType, stylePreset, duration });
      setProject(data);
      setSelectedFrameId(data?.scenes?.[0]?.id || null);
      setExplorePrompt("");
      setGridImage("");
      setLockedPrompt("");
      setLockedImage("");
      setAnalysis(null);
      setVideoPrompt("");
      setStatus("Storyboard готов. Выбери кадр и нажми Explore.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function importProjectJson(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setProject(data);
      setScript(data.script || script);
      setProjectType(data.project_type || "film");
      setStylePreset(data.style_preset || "cinematic_realism");
      setSelectedFrameId(data?.scenes?.[0]?.id || null);
      setStatus("JSON storyboard загружен");
    } catch (e) {
      setError("Не удалось прочитать JSON: " + e.message);
    }
  }

  async function exploreFrame() {
    if (!selectedFrame) return setError("Сначала выбери кадр");
    try {
      setError("");
      setBusy("explore");
      setStatus("Создаю промт для сетки 2x2 выбранного кадра...");
      const data = await api("/api/explore", { frame: selectedFrame, projectType, stylePreset });
      setExplorePrompt(data.prompt || "");
      setStatus("Explore prompt готов. Скопируй его и сгенерируй сетку в Nano Banana Pro.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function uploadGrid(file) {
    if (!file) return;
    setGridImage(await toDataUrl(file));
    setStatus("Сетка загружена. Выбери лучший вариант A/B/C/D.");
  }

  async function lockVariant() {
    if (!selectedFrame) return setError("Сначала выбери кадр");
    try {
      setError("");
      setBusy("lock");
      setStatus("Фиксирую выбранный вариант и готовлю 2K prompt...");
      const data = await api("/api/explore", { mode: "2k", frame: selectedFrame, selectedVariant, projectType, stylePreset });
      setLockedPrompt(data.prompt || "");
      setStatus("2K prompt готов. Сгенерируй финальный кадр и загрузи его ниже.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function uploadLocked(file) {
    if (!file) return;
    setLockedImage(await toDataUrl(file));
    setStatus("Финальный кадр загружен. Теперь можно сканировать для video prompt.");
  }

  async function analyzeImage() {
    if (!lockedImage) return setError("Сначала загрузи финальный 2K кадр");
    try {
      setError("");
      setBusy("analyze");
      setStatus("Сканирую кадр через Vision и вытаскиваю Visual DNA...");
      const data = await api("/api/analyze", { imageDataUrl: lockedImage, frame: selectedFrame, selectedVariant });
      setAnalysis(data);
      setStatus("Анализ готов. Можно сгенерировать финальный video prompt.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function generateVideo() {
    if (!selectedFrame) return setError("Сначала выбери кадр");
    try {
      setError("");
      setBusy("video");
      setStatus("Генерирую video prompt строго по сценарию и выбранному кадру...");
      const data = await api("/api/video", { frame: selectedFrame, selectedVariant, visualDna: analysis?.visual_dna || null });
      setVideoPrompt(data.video_prompt_en || "");
      setStatus("Video prompt готов");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  function exportProject() {
    const payload = { ...project, script, selectedFrameId, selectedVariant, explorePrompt, lockedPrompt, analysis, videoPrompt };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neurocine-director-project.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">NeuroCine Director Studio v4</p>
          <h1>Режиссёрский пайплайн кадр за кадром</h1>
          <p className="sub">Сценарий фиксируется как закон. Меняются только ракурс, линза, композиция и движение камеры.</p>
        </div>
        <div className="statusBox">
          <span className={busy ? "dot pulse" : "dot"}></span>
          <b>{busy ? "Работает" : "Готово"}</b>
          <p>{status}</p>
          {error && <p className="err">{error}</p>}
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="cardHead"><h2>1. Сценарий</h2><div><button onClick={() => copy(script)}>Копировать</button><button onClick={() => clearSetter(setScript)}>Удалить</button></div></div>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Вставь сценарий или описание ролика..." />
          <div className="row">
            <label className="upload">Импорт JSON<input type="file" accept=".json" onChange={(e) => importProjectJson(e.target.files?.[0])} /></label>
            <button className={cls(false, busy === "storyboard")} onClick={generateStoryboard}>{busy === "storyboard" ? "Генерирую..." : "Создать storyboard"}</button>
          </div>
        </div>

        <div className="card">
          <h2>2. Стиль проекта</h2>
          <div className="chips">{Object.entries(PROJECT_TYPES).map(([key, val]) => <button key={key} className={projectType === key ? "chip on" : "chip"} onClick={() => { setProjectType(key); setStylePreset(val.styles[0][0]); }}>{val.label}</button>)}</div>
          <div className="chips">{PROJECT_TYPES[projectType].styles.map(([key, label]) => <button key={key} className={stylePreset === key ? "chip on" : "chip"} onClick={() => setStylePreset(key)}>{label}</button>)}</div>
          <label className="smallLabel">Длительность, сек.</label>
          <input className="number" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value || 60))} />
          <div className="lockBox">SCENARIO LOCK: включён. Сюжет, персонажи, локации, VO и хронология не меняются.</div>
        </div>
      </section>

      <section className="grid layout">
        <div className="card storyboard">
          <div className="cardHead"><h2>3. Storyboard Grid</h2><button onClick={exportProject} disabled={!project}>Export JSON</button></div>
          {!frames.length && <div className="empty">Пока нет кадров. Создай storyboard или загрузи JSON.</div>}
          <div className="frames">{frames.map((frame, i) => <button key={frame.id || i} className={selectedFrame?.id === frame.id ? "frame selected" : "frame"} onClick={() => setSelectedFrameId(frame.id)}><b>{frame.id || `frame_${i + 1}`}</b><span>{frame.description_ru || frame.locked_story_action || "Кадр"}</span></button>)}</div>
        </div>

        <aside className="card side">
          <h2>4. Контроль кадра</h2>
          <div className="selectedInfo"><b>{selectedFrame?.id || "Кадр не выбран"}</b><p>{selectedFrame?.description_ru || "Выбери кадр из storyboard."}</p></div>
          <button className={cls(false, busy === "explore")} onClick={exploreFrame}>{busy === "explore" ? "Генерирую..." : "Explore 2×2 variants"}</button>
          <button className={cls(false, busy === "lock")} onClick={lockVariant}>{busy === "lock" ? "Фиксирую..." : "Lock variant → 2K prompt"}</button>
          <button className={cls(false, busy === "analyze")} onClick={analyzeImage}>{busy === "analyze" ? "Сканирую..." : "Analyze image → video options"}</button>
          <button className={cls(false, busy === "video")} onClick={generateVideo}>{busy === "video" ? "Генерирую..." : "Generate video prompt"}</button>
          <div className="variants"><span>Вариант:</span>{["A", "B", "C", "D"].map((v) => <button key={v} className={selectedVariant === v ? "var on" : "var"} onClick={() => setSelectedVariant(v)}>{v}</button>)}</div>
        </aside>
      </section>

      <section className="grid two">
        <TextBlock title="5. Prompt для сетки 2×2" value={explorePrompt} onCopy={copy} onClear={() => clearSetter(setExplorePrompt)} />
        <ImageBlock title="6. Загрузка сетки вариантов" image={gridImage} onUpload={uploadGrid} />
        <TextBlock title="7. 2K prompt выбранного варианта" value={lockedPrompt} onCopy={copy} onClear={() => clearSetter(setLockedPrompt)} />
        <ImageBlock title="8. Загрузка финального кадра" image={lockedImage} onUpload={uploadLocked} />
        <JsonBlock title="9. Скан кадра / Visual DNA" value={analysis} onCopy={copy} onClear={() => setAnalysis(null)} />
        <TextBlock title="10. Финальный video prompt" value={videoPrompt} onCopy={copy} onClear={() => clearSetter(setVideoPrompt)} />
      </section>

      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0;background:#070912;color:#f7f1ff;font-family:Inter,Arial,sans-serif} button{font:inherit} .page{min-height:100vh;padding:22px;background:radial-gradient(circle at top left,#45206e 0,#101526 34%,#06191b 100%)} .hero{display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:end;margin-bottom:18px}.eyebrow{color:#b68cff;font-weight:800;letter-spacing:.08em;text-transform:uppercase}h1{font-size:clamp(30px,6vw,62px);line-height:.95;margin:8px 0}.sub{color:#c9bddb;max-width:820px}.statusBox,.card{border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));box-shadow:0 20px 60px rgba(0,0,0,.35);border-radius:28px;padding:20px;backdrop-filter:blur(14px)}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#35f7b2;margin-right:8px}.pulse{background:#ffb44d;box-shadow:0 0 20px #ffb44d}.err{color:#ff9ba8;font-weight:800}.grid{display:grid;gap:18px;margin-bottom:18px}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.layout{grid-template-columns:1fr 340px}.cardHead{display:flex;justify-content:space-between;gap:12px;align-items:center}.cardHead div{display:flex;gap:8px}h2{margin:0 0 14px}textarea{width:100%;min-height:220px;border:1px solid rgba(255,255,255,.16);background:#0b0e18;color:#fff;border-radius:20px;padding:16px;resize:vertical}.row{display:flex;gap:12px;align-items:center;margin-top:12px}.btn,.card button,.upload{border:none;border-radius:18px;padding:13px 16px;background:rgba(255,255,255,.09);color:#fff;font-weight:850;cursor:pointer;border:1px solid rgba(255,255,255,.1);transition:.18s}.btn.active,.card button:hover,.upload:hover,.chip.on,.var.on{background:linear-gradient(135deg,#b94cff,#6e35ff);box-shadow:0 0 24px rgba(185,76,255,.4)}.btn.busy{background:linear-gradient(135deg,#ffb84d,#ff4dcc);box-shadow:0 0 28px rgba(255,184,77,.5)}.upload input{display:none}.chips{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.chip{padding:10px 13px}.smallLabel{color:#bcb2cc;font-size:13px}.number{width:120px;padding:12px;border-radius:14px;background:#0b0e18;color:#fff;border:1px solid rgba(255,255,255,.16);display:block;margin:8px 0 12px}.lockBox{padding:14px;border-radius:18px;background:rgba(53,247,178,.09);border:1px solid rgba(53,247,178,.22);color:#bfffe8}.frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-height:680px;overflow:auto}.frame{text-align:left;min-height:120px;display:flex;flex-direction:column;gap:8px}.frame span{font-size:13px;color:#d3c8dd}.frame.selected{background:linear-gradient(135deg,#923cff,#244cff);box-shadow:0 0 25px rgba(146,60,255,.45)}.empty{color:#bcb2cc;padding:30px;border:1px dashed rgba(255,255,255,.18);border-radius:22px}.side{position:sticky;top:18px;align-self:start}.side .btn,.side>button{width:100%;margin:7px 0}.selectedInfo{background:rgba(0,0,0,.26);padding:14px;border-radius:18px;margin-bottom:10px}.selectedInfo p{color:#d7cce2}.variants{display:flex;align-items:center;gap:10px;margin-top:10px}.var{width:48px;height:48px;border-radius:50%}.textOut{white-space:pre-wrap;min-height:240px;max-height:460px;overflow:auto;background:#080b13;border-radius:20px;padding:16px;border:1px solid rgba(255,255,255,.12);color:#e9def5}.imagePreview{width:100%;border-radius:22px;border:1px solid rgba(255,255,255,.14);display:block;margin-top:14px}.imageEmpty{height:260px;border-radius:22px;border:1px dashed rgba(255,255,255,.18);display:grid;place-items:center;color:#bcb2cc;margin-top:14px}@media(max-width:900px){.hero,.two,.layout{grid-template-columns:1fr}.side{position:relative;top:0}.page{padding:14px}h1{font-size:38px}}
      `}</style>
    </main>
  );
}

function TextBlock({ title, value, onCopy, onClear }) {
  return <div className="card"><div className="cardHead"><h2>{title}</h2><div><button onClick={() => onCopy(value)}>Копировать</button><button onClick={onClear}>Удалить</button></div></div><div className="textOut">{value || "Пока пусто"}</div></div>;
}

function JsonBlock({ title, value, onCopy, onClear }) {
  return <div className="card"><div className="cardHead"><h2>{title}</h2><div><button onClick={() => onCopy(value)}>Копировать</button><button onClick={onClear}>Удалить</button></div></div><div className="textOut">{value ? JSON.stringify(value, null, 2) : "Пока пусто"}</div></div>;
}

function ImageBlock({ title, image, onUpload }) {
  return <div className="card"><div className="cardHead"><h2>{title}</h2><label className="upload">Загрузить<input type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(e) => onUpload(e.target.files?.[0])} /></label></div>{image ? <img className="imagePreview" src={image} alt="uploaded" /> : <div className="imageEmpty">Загрузи изображение</div>}</div>;
}
