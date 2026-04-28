"use client";
import { useMemo, useState } from "react";

const projectTypes = {
  film: ["Cinematic realism", "Netflix documentary", "Historical reconstruction", "Dark thriller", "Gritty handheld realism", "True crime", "War documentary"],
  animation: ["2D animation", "2.5D animation", "3D cartoon", "Dark adult animation", "Stop motion", "Watercolor animation", "Paper cutout"],
  anime: ["Cinematic anime", "Dark anime realism", "Historical anime", "Painterly anime"],
  comic: ["Graphic novel", "Dark comic book", "Ink wash comic"],
  commercial: ["Premium ad", "Music video", "Fashion film"]
};

const typeLabels = { film: "Фильм", animation: "Мультфильм", anime: "Аниме", comic: "Комикс", commercial: "Реклама / клип" };

function classNames(...items) { return items.filter(Boolean).join(" "); }

export default function Page() {
  const [script, setScript] = useState("");
  const [projectType, setProjectType] = useState("film");
  const [stylePreset, setStylePreset] = useState("Cinematic realism");
  const [duration, setDuration] = useState(60);
  const [storyboard, setStoryboard] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [explorePrompt, setExplorePrompt] = useState("");
  const [exploreGrid, setExploreGrid] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [lockedPrompt, setLockedPrompt] = useState("");
  const [lockedImage, setLockedImage] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [activeAction, setActiveAction] = useState("");
  const [status, setStatus] = useState("Готов к работе");
  const [error, setError] = useState("");

  const frames = storyboard?.scenes || [];
  const selectedFrame = useMemo(() => frames.find((f) => f.id === selectedFrameId) || frames[0] || null, [frames, selectedFrameId]);

  function setType(type) {
    setProjectType(type);
    setStylePreset(projectTypes[type][0]);
  }

  async function copy(text) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus("Скопировано");
    setTimeout(() => setStatus("Готов к работе"), 1200);
  }

  function clearValue(setter) { setter(""); }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function loadProjectFile(file) {
    if (!file) return;
    setActiveAction("import");
    setError("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const scenes = Array.isArray(data.scenes) ? data.scenes : [];
      const normalized = { ...data, scenes };
      setStoryboard(normalized);
      setSelectedFrameId(scenes[0]?.id || null);
      setStatus("JSON проекта загружен");
    } catch (e) {
      setError("Не удалось прочитать JSON. Проверь файл.");
    } finally {
      setActiveAction("");
    }
  }

  async function createStoryboard() {
    if (!script.trim()) { setError("Сначала вставь сценарий или JSON."); return; }
    setActiveAction("storyboard");
    setError("");
    setStatus("Генерирую storyboard через Director Core...");
    try {
      let body;
      try {
        const parsed = JSON.parse(script);
        body = { script: JSON.stringify(parsed, null, 2), projectType, stylePreset, duration };
      } catch (_) {
        body = { script, projectType, stylePreset, duration };
      }
      const res = await fetch("/api/storyboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storyboard error");
      setStoryboard(data.storyboard);
      setSelectedFrameId(data.storyboard?.scenes?.[0]?.id || null);
      setExplorePrompt(""); setExploreGrid(null); setSelectedVariant(null); setLockedPrompt(""); setLockedImage(null); setAnalysis(""); setVideoPrompt("");
      setStatus("Storyboard готов");
    } catch (e) {
      setError(e.message || "Ошибка storyboard");
    } finally {
      setActiveAction("");
    }
  }

  async function createExplorePrompt() {
    if (!selectedFrame) { setError("Выбери кадр."); return; }
    setActiveAction("explore"); setError(""); setStatus("Собираю промт сетки 2×2...");
    try {
      const res = await fetch("/api/explore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frame: selectedFrame, project: storyboard }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Explore error");
      setExplorePrompt(data.prompt);
      setStatus("Explore промт готов");
    } catch (e) { setError(e.message || "Ошибка Explore"); }
    finally { setActiveAction(""); }
  }

  async function create2KPrompt() {
    if (!selectedFrame) { setError("Выбери кадр."); return; }
    if (!selectedVariant) { setError("Выбери вариант A/B/C/D."); return; }
    setActiveAction("lock"); setError(""); setStatus("Фиксирую выбранный вариант...");
    try {
      const res = await fetch("/api/explore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "2k", frame: selectedFrame, variant: selectedVariant, project: storyboard }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "2K prompt error");
      setLockedPrompt(data.prompt);
      setStatus("2K image prompt готов");
    } catch (e) { setError(e.message || "Ошибка LOCK"); }
    finally { setActiveAction(""); }
  }

  async function analyzeLockedImage() {
    if (!lockedImage?.dataUrl) { setError("Загрузи финальный 2K кадр для анализа."); return; }
    if (!selectedFrame) { setError("Выбери кадр."); return; }
    setActiveAction("analyze"); setError(""); setStatus("Сканирую изображение через Vision...");
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: lockedImage.dataUrl, frame: selectedFrame, project: storyboard }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyze error");
      setAnalysis(data.analysis);
      setStatus("Анализ готов");
    } catch (e) { setError(e.message || "Ошибка анализа"); }
    finally { setActiveAction(""); }
  }

  async function createVideoPrompt() {
    if (!selectedFrame) { setError("Выбери кадр."); return; }
    setActiveAction("video"); setError(""); setStatus("Собираю video prompt строго по сценарию...");
    try {
      const res = await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frame: selectedFrame, analysis, project: storyboard }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video prompt error");
      setVideoPrompt(data.prompt);
      setStatus("Video prompt готов");
    } catch (e) { setError(e.message || "Ошибка video prompt"); }
    finally { setActiveAction(""); }
  }

  function exportProject() {
    const payload = { ...storyboard, director_v4: { projectType, stylePreset, selectedFrameId, selectedVariant, explorePrompt, lockedPrompt, analysis, videoPrompt } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "neurocine_director_project.json"; a.click(); URL.revokeObjectURL(url);
  }

  function exportTxt() {
    const text = [`PROJECT: ${storyboard?.project_name || "NeuroCine"}`, `STYLE: ${stylePreset}`, "", "EXPLORE PROMPT:", explorePrompt, "", "2K IMAGE PROMPT:", lockedPrompt, "", "ANALYSIS:", analysis, "", "VIDEO PROMPT:", videoPrompt].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "neurocine_prompts.txt"; a.click(); URL.revokeObjectURL(url);
  }

  async function handleExploreGrid(file) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setExploreGrid({ name: file.name, dataUrl });
    setStatus("Сетка вариантов загружена");
  }
  async function handleLockedImage(file) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setLockedImage({ name: file.name, dataUrl });
    setStatus("Финальный кадр загружен");
  }

  const isBusy = Boolean(activeAction);

  return <main className="page">
    <style jsx global>{`
      *{box-sizing:border-box} body{margin:0;background:#090a0f;color:#f5f7fb;font-family:Inter,Arial,sans-serif} button,input,textarea,select{font:inherit} textarea{resize:vertical}
      .page{min-height:100vh;padding:24px;background:radial-gradient(circle at 10% 0%,#222048 0,#090a0f 34%,#07080c 100%)}
      .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.brand h1{margin:0;font-size:28px}.brand p{margin:6px 0 0;color:#a8afc0}.status{padding:10px 14px;border:1px solid #2b3145;border-radius:14px;background:#111522;color:#cfd6e8}.error{padding:10px 14px;border:1px solid #6b2631;border-radius:14px;background:#2b1117;color:#ffbac5;margin-bottom:14px}
      .grid{display:grid;grid-template-columns:minmax(320px,0.95fr) minmax(360px,1.15fr) minmax(320px,0.95fr);gap:16px}.card{background:rgba(17,20,31,.88);border:1px solid #283045;border-radius:22px;padding:16px;box-shadow:0 18px 60px rgba(0,0,0,.22)}.card h2{font-size:16px;margin:0 0 12px}.label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8f98ad;margin:12px 0 8px}.textarea{width:100%;min-height:170px;border:1px solid #30384f;border-radius:16px;padding:12px;background:#0b0e16;color:#f5f7fb;outline:none}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.btn{border:1px solid #3b4563;background:#151a28;color:#e8ecf7;border-radius:12px;padding:10px 12px;cursor:pointer;transition:.15s}.btn:hover{background:#20283a}.btn.primary{background:#6d4cff;border-color:#8066ff;color:white}.btn.active,.btn.busy{background:#ff9f2d;border-color:#ffc06d;color:#160e04;box-shadow:0 0 0 3px rgba(255,159,45,.16)}.btn.selected{background:#4cdb8f;border-color:#8ef0b8;color:#07130d}.btn.danger{background:#2a151a;border-color:#6d2635;color:#ffbdc7}.pill{padding:9px 11px;border:1px solid #323a54;border-radius:999px;background:#0d111b;color:#cfd6e8;cursor:pointer}.pill.active{background:#6d4cff;color:white;border-color:#8a74ff}.input{width:100%;border:1px solid #30384f;border-radius:13px;padding:10px;background:#0b0e16;color:#f5f7fb}.frames{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:540px;overflow:auto;padding-right:4px}.frame{border:1px solid #2b334b;background:#0d111b;border-radius:14px;padding:10px;text-align:left;cursor:pointer;min-height:92px}.frame.active{border-color:#8a74ff;background:#1d1741}.frame b{display:block;color:#fff;margin-bottom:5px}.frame span{display:block;color:#aab2c4;font-size:12px;line-height:1.35}.tool{border:1px solid #283045;background:#0c101a;border-radius:18px;padding:12px;margin-bottom:12px}.toolbar{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;align-items:center}.toolbar small{color:#8f98ad}.output{white-space:pre-wrap;background:#080a10;border:1px solid #242b3d;border-radius:14px;padding:12px;min-height:92px;color:#dce3f4;font-size:12px;line-height:1.45;overflow:auto;max-height:300px}.preview{width:100%;border-radius:14px;border:1px solid #30384f;margin-top:10px;display:block}.variants{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.variant{height:48px;border-radius:14px;border:1px solid #30384f;background:#111827;color:#fff;cursor:pointer}.variant.active{background:#4cdb8f;color:#07130d;border-color:#8ef0b8}.hint{color:#9aa3b8;font-size:12px;line-height:1.45}.split{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:1100px){.grid{grid-template-columns:1fr}.top{display:block}.status{margin-top:12px}.frames{grid-template-columns:1fr}.split{grid-template-columns:1fr}}
    `}</style>

    <section className="top">
      <div className="brand"><h1>🎬 NeuroCine Director v4</h1><p>Ручной режиссёрский pipeline: сценарий → кадр → 4 варианта → лучший кадр → Vision анализ → video prompt.</p></div>
      <div className="status">{isBusy ? `В процессе: ${activeAction}` : status}</div>
    </section>
    {error && <div className="error">{error}</div>}

    <section className="grid">
      <div className="card">
        <h2>1. Сценарий и стиль</h2>
        <div className="toolbar"><small>Сценарий / JSON</small><div><button className="btn" onClick={() => copy(script)}>Копировать</button><button className="btn danger" onClick={() => setScript("")}>Удалить</button></div></div>
        <textarea className="textarea" value={script} onChange={(e)=>setScript(e.target.value)} placeholder="Вставь сценарий или storyboard JSON..." />
        <div className="label">Или загрузить JSON</div><input className="input" type="file" accept="application/json,.json" onChange={(e)=>loadProjectFile(e.target.files?.[0])}/>
        <div className="label">Тип проекта</div><div className="row">{Object.keys(projectTypes).map(t=><button key={t} onClick={()=>setType(t)} className={classNames("pill", projectType===t&&"active")}>{typeLabels[t]}</button>)}</div>
        <div className="label">Стиль</div><div className="row">{projectTypes[projectType].map(s=><button key={s} onClick={()=>setStylePreset(s)} className={classNames("pill", stylePreset===s&&"active")}>{s}</button>)}</div>
        <div className="split"><div><div className="label">Длительность</div><input className="input" type="number" min="15" max="600" value={duration} onChange={(e)=>setDuration(e.target.value)}/></div><div><div className="label">Scenario Lock</div><div className="hint">Сюжет, персонажи, локации, таймлайн и эмоция заблокированы. Меняются только ракурс/камера/композиция.</div></div></div>
        <div className="row" style={{marginTop:14}}><button className={classNames("btn primary",activeAction==="storyboard"&&"busy")} disabled={isBusy} onClick={createStoryboard}>Создать Storyboard</button>{storyboard&&<><button className="btn" onClick={exportProject}>Экспорт JSON</button><button className="btn" onClick={exportTxt}>Экспорт TXT</button></>}</div>
      </div>

      <div className="card">
        <h2>2. Storyboard Grid</h2>
        {!frames.length && <p className="hint">После генерации здесь появятся кадры. Клик по кадру выбирает его для Explore.</p>}
        <div className="frames">{frames.map((f)=><button key={f.id} onClick={()=>{setSelectedFrameId(f.id); setSelectedVariant(null);}} className={classNames("frame", selectedFrame?.id===f.id&&"active")}><b>{f.id} · {f.start ?? 0}s</b><span>{f.description_ru || f.locked_story_action}</span></button>)}</div>
      </div>

      <div className="card">
        <h2>3. Frame Control</h2>
        {selectedFrame ? <div className="tool"><b>{selectedFrame.id}</b><p className="hint">{selectedFrame.description_ru}</p><p className="hint"><b>VO:</b> {selectedFrame.vo_ru || "—"}</p><p className="hint"><b>SFX:</b> {selectedFrame.sfx || "—"}</p></div> : <p className="hint">Выбери кадр.</p>}

        <div className="tool">
          <div className="toolbar"><small>Explore 2×2 prompt</small><div><button className="btn" onClick={()=>copy(explorePrompt)}>Копировать</button><button className="btn danger" onClick={()=>clearValue(setExplorePrompt)}>Удалить</button></div></div>
          <button className={classNames("btn primary",activeAction==="explore"&&"busy")} disabled={isBusy||!selectedFrame} onClick={createExplorePrompt}>Получить сетку 4 вариантов</button>
          <div className="output">{explorePrompt || "Здесь появится промт для NanoBanana / image model: 2×2 сетка одного кадра."}</div>
        </div>

        <div className="tool">
          <div className="toolbar"><small>Загрузка сетки вариантов</small><button className="btn danger" onClick={()=>setExploreGrid(null)}>Удалить</button></div>
          <input className="input" type="file" accept="image/*" onChange={(e)=>handleExploreGrid(e.target.files?.[0])}/>
          {exploreGrid?.dataUrl && <img className="preview" src={exploreGrid.dataUrl} alt="Explore grid"/>}
          <div className="label">Выбери лучший вариант</div><div className="variants">{["A","B","C","D"].map(v=><button key={v} onClick={()=>setSelectedVariant(v)} className={classNames("variant", selectedVariant===v&&"active")}>{v}</button>)}</div>
        </div>
      </div>
    </section>

    <section className="grid" style={{marginTop:16}}>
      <div className="card">
        <h2>4. Lock → 2K Image Prompt</h2>
        <div className="toolbar"><small>Промт финального кадра</small><div><button className="btn" onClick={()=>copy(lockedPrompt)}>Копировать</button><button className="btn danger" onClick={()=>clearValue(setLockedPrompt)}>Удалить</button></div></div>
        <button className={classNames("btn primary",activeAction==="lock"&&"busy")} disabled={isBusy||!selectedVariant} onClick={create2KPrompt}>Зафиксировать выбранный кадр</button>
        <div className="output">{lockedPrompt || "После выбора A/B/C/D здесь появится точный image prompt для генерации кадра в 2K."}</div>
      </div>
      <div className="card">
        <h2>5. Загрузка финального 2K кадра</h2>
        <div className="toolbar"><small>Кадр для Vision анализа</small><button className="btn danger" onClick={()=>setLockedImage(null)}>Удалить</button></div>
        <input className="input" type="file" accept="image/*" onChange={(e)=>handleLockedImage(e.target.files?.[0])}/>
        {lockedImage?.dataUrl && <img className="preview" src={lockedImage.dataUrl} alt="Locked frame"/>}
        <button style={{marginTop:12}} className={classNames("btn primary",activeAction==="analyze"&&"busy")} disabled={isBusy||!lockedImage} onClick={analyzeLockedImage}>Сканировать кадр</button>
      </div>
      <div className="card">
        <h2>6. Анализ + Video Prompt</h2>
        <div className="tool"><div className="toolbar"><small>Анализ кадра</small><div><button className="btn" onClick={()=>copy(analysis)}>Копировать</button><button className="btn danger" onClick={()=>clearValue(setAnalysis)}>Удалить</button></div></div><div className="output">{analysis || "Здесь появится точечный разбор: камера, композиция, свет, движение, атмосфера."}</div></div>
        <div className="tool"><div className="toolbar"><small>Video prompt</small><div><button className="btn" onClick={()=>copy(videoPrompt)}>Копировать</button><button className="btn danger" onClick={()=>clearValue(setVideoPrompt)}>Удалить</button></div></div><button className={classNames("btn primary",activeAction==="video"&&"busy")} disabled={isBusy||!selectedFrame} onClick={createVideoPrompt}>Собрать video prompt</button><div className="output">{videoPrompt || "Video prompt будет строго по выбранному кадру и сценарию."}</div></div>
      </div>
    </section>
  </main>;
}
