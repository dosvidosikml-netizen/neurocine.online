"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BACKEND_KEY = "neurocine.factory.backendUrl.v1";
const DEFAULT_BACKEND = "http://127.0.0.1:8788";

const ASPECTS = ["9:16", "16:9", "1:1"];
const DURATIONS = [30, 60, 90, 120, 180, 300, 600];
const STYLES = [
  "cinematic realism",
  "documentary rescue drama",
  "psychological horror",
  "hyperreal survival thriller",
  "warm emotional short film",
  "dark folk mystery",
];

function safeJson(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "";
  }
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

function imageUrl(backendUrl, item) {
  if (!item?.url) return "";
  if (/^https?:\/\//i.test(item.url)) return item.url;
  return `${backendUrl.replace(/\/+$/, "")}${item.url}`;
}

async function apiFetch(backendUrl, path, options = {}) {
  const res = await fetch(`${backendUrl.replace(/\/+$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  }
  return data;
}

export default function LocalFactoryPage() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND);
  const [health, setHealth] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({
    title: "",
    topic: "",
    aspect_ratio: "9:16",
    duration_sec: 60,
    style: "cinematic realism",
    image_workflow: "custom_api",
  });
  const eventSourceRef = useRef(null);

  const mixedContentWarning = typeof window !== "undefined"
    && window.location.protocol === "https:"
    && backendUrl.startsWith("http://");

  useEffect(() => {
    const saved = localStorage.getItem(BACKEND_KEY);
    if (saved) setBackendUrl(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(BACKEND_KEY, backendUrl);
  }, [backendUrl]);

  const refreshProjects = useCallback(async () => {
    const data = await apiFetch(backendUrl, "/api/projects");
    setProjects(data.projects || []);
  }, [backendUrl]);

  const refreshComfy = useCallback(async (workflowPreset = "custom_api") => {
    const selected = workflowPreset || "custom_api";
    const data = await apiFetch(backendUrl, `/api/comfyui/status?workflow_preset=${encodeURIComponent(selected)}`);
    setWorkflowStatus(data.comfyui);
    return data.comfyui;
  }, [backendUrl]);

  const refreshStatus = useCallback(async (id = project?.id) => {
    if (!id) return;
    const data = await apiFetch(backendUrl, `/api/projects/${id}/status`);
    setProject(data.project);
    setJobs(data.jobs || []);
    setEvents(data.events || []);
  }, [backendUrl, project?.id]);

  const refreshHealth = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch(backendUrl, "/api/health");
      setHealth(data);
      setNotice("Локальный backend отвечает.");
      await refreshComfy(data.image_workflow_preset || form.image_workflow);
      await refreshProjects();
    } catch (e) {
      setHealth(null);
      setError(`Backend не отвечает: ${e.message}`);
    }
  }, [backendUrl, form.image_workflow, refreshComfy, refreshProjects]);

  useEffect(() => {
    refreshHealth().catch(() => {});
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [refreshHealth]);

  useEffect(() => {
    if (!project?.id) return undefined;
    if (eventSourceRef.current) eventSourceRef.current.close();
    const url = `${backendUrl.replace(/\/+$/, "")}/api/projects/${project.id}/progress`;
    const source = new EventSource(url);
    eventSourceRef.current = source;
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data || "{}");
        if (data.project) setProject(data.project);
        if (Array.isArray(data.events) && data.events.length) {
          setEvents((current) => {
            const byId = new Map(current.map((item) => [item.id, item]));
            data.events.forEach((item) => byId.set(item.id, item));
            return Array.from(byId.values()).sort((a, b) => b.id - a.id).slice(0, 80);
          });
        }
      } catch {}
    };
    source.onerror = () => {
      refreshStatus(project.id).catch(() => {});
    };
    return () => source.close();
  }, [backendUrl, project?.id, refreshStatus]);

  async function createProject() {
    setBusy("create");
    setError("");
    setNotice("");
    try {
      const data = await apiFetch(backendUrl, "/api/projects", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setProject(data.project);
      setJobs([]);
      setEvents([]);
      setNotice("Проект создан.");
      await refreshProjects();
      await refreshStatus(data.project.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function openProject(id) {
    setBusy("open");
    setError("");
    try {
      const data = await apiFetch(backendUrl, `/api/projects/${id}/status`);
      setProject(data.project);
      setJobs(data.jobs || []);
      setEvents(data.events || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function runStage(stage) {
    if (!project?.id) return;
    setBusy(stage);
    setError("");
    setNotice("");
    try {
      const path = stage === "script"
        ? "generate-script"
        : stage === "images"
          ? "generate-images"
          : "generate-storyboard";
      if (stage === "images") {
        const status = await refreshComfy(project.image_workflow);
        if (!status?.ready) {
          throw new Error(status?.error || "ComfyUI workflow не готов. Проверь файл workflow, ноды и модели.");
        }
      }
      await apiFetch(backendUrl, `/api/projects/${project.id}/${path}`, { method: "POST" });
      setNotice(stage === "script"
        ? "Генерация сценария запущена."
        : stage === "images"
          ? "Генерация изображений запущена через ComfyUI."
          : "Генерация storyboard JSON запущена.");
      await refreshStatus(project.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function saveEditedScript() {
    if (!project?.id) return;
    setBusy("save-script");
    setError("");
    try {
      const data = await apiFetch(backendUrl, `/api/projects/${project.id}/script`, {
        method: "POST",
        body: JSON.stringify({ script_text: project.script_text }),
      });
      setProject(data.project);
      setNotice("Сценарий сохранён.");
      await refreshStatus(project.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function saveProjectWorkflow(imageWorkflow) {
    if (!project?.id) return;
    setBusy("save-workflow");
    setError("");
    try {
      const data = await apiFetch(backendUrl, `/api/projects/${project.id}/settings`, {
        method: "POST",
        body: JSON.stringify({ image_workflow: imageWorkflow }),
      });
      setProject(data.project);
      await refreshComfy(imageWorkflow);
      setNotice("Workflow проекта обновлён.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  const progress = Math.max(0, Math.min(100, Number(project?.progress || 0)));
  const storyboardText = useMemo(() => safeJson(project?.storyboard_json), [project?.storyboard_json]);
  const refsText = useMemo(() => safeJson(project?.reference_map_json), [project?.reference_map_json]);
  const imagePromptsText = useMemo(() => safeJson(project?.image_prompts_json), [project?.image_prompts_json]);
  const videoPromptsText = useMemo(() => safeJson(project?.video_prompts_json), [project?.video_prompts_json]);
  const imagesText = useMemo(() => safeJson(project?.images_json), [project?.images_json]);
  const images = Array.isArray(project?.images_json) ? project.images_json : [];
  const workflowPresets = workflowStatus?.presets || [];
  const selectedWorkflowStatus = workflowStatus?.selected_preset;
  const workflowReady = Boolean(workflowStatus?.ready);

  return (
    <main className="factory-page">
      <section className="hero">
        <div>
          <p className="eyebrow">NEUROCINE LOCAL FACTORY</p>
          <h1>Локальная AI Content Factory</h1>
          <p>Панель управления для локального пайплайна: Ollama, ComfyUI, TTS, Whisper и FFmpeg. MVP сейчас делает проект, сценарий, storyboard JSON и прогресс.</p>
        </div>
        <div className={`health ${health?.ok ? "ok" : "bad"}`}>
          <b>{health?.ok ? "Backend online" : "Backend offline"}</b>
          <span>{health?.ollama_model || "Ollama не проверен"}</span>
        </div>
      </section>

      <section className="panel">
        <h2>01 · Подключение</h2>
        <label>
          Адрес локального backend
          <input value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
        </label>
        <div className="actions">
          <button onClick={refreshHealth} disabled={busy}>Проверить backend</button>
          <button onClick={() => refreshComfy(project?.image_workflow || form.image_workflow)} disabled={!health?.ok || busy}>Проверить ComfyUI workflow</button>
          <button onClick={refreshProjects} disabled={!health?.ok || busy}>Обновить проекты</button>
        </div>
        {mixedContentWarning ? (
          <div className="notice warn">HTTPS-страница может блокировать запросы к http://127.0.0.1. Для MVP надёжнее открыть сайт локально через `npm run dev` и `http://localhost:3000/factory`.</div>
        ) : null}
        {workflowStatus ? (
          <div className={`workflow-status ${workflowReady ? "ready" : "blocked"}`}>
            <div>
              <b>{workflowReady ? "ComfyUI workflow готов" : "ComfyUI workflow не готов"}</b>
              <span>{selectedWorkflowStatus?.name || "workflow не выбран"}</span>
            </div>
            <div className="workflow-grid">
              <span>Preset: {selectedWorkflowStatus?.id || "-"}</span>
              <span>Файл: {selectedWorkflowStatus?.workflow_path || "inline"}</span>
              <span>Ноды: {(workflowStatus.workflow_nodes || []).length}</span>
              <span>Модели: {(workflowStatus.workflow_models || []).join(", ") || selectedWorkflowStatus?.model_hint || "не определены"}</span>
            </div>
            {workflowStatus.error ? <small>{workflowStatus.error}</small> : null}
            {workflowStatus.missing_nodes?.length ? <small>Нет нод: {workflowStatus.missing_nodes.join(", ")}</small> : null}
            {workflowStatus.missing_models?.length ? <small>Нет моделей: {workflowStatus.missing_models.join(", ")}</small> : null}
            {workflowStatus.warnings?.map((item) => <small key={item}>{item}</small>)}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>02 · Новый проект</h2>
        <label>
          Название
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="можно оставить пустым" />
        </label>
        <label>
          Тема
          <textarea value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Например: лосёнок застрял в болоте — спасательная операция на рассвете" />
        </label>
        <div className="grid3">
          <label>
            Формат
            <select value={form.aspect_ratio} onChange={(e) => setForm({ ...form, aspect_ratio: e.target.value })}>
              {ASPECTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Длительность
            <select value={form.duration_sec} onChange={(e) => setForm({ ...form, duration_sec: Number(e.target.value) })}>
              {DURATIONS.map((item) => <option key={item} value={item}>{item} сек</option>)}
            </select>
          </label>
          <label>
            Стиль
            <select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>
              {STYLES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label>
          Workflow изображений
          <select
            value={form.image_workflow}
            onChange={(e) => {
              setForm({ ...form, image_workflow: e.target.value });
              refreshComfy(e.target.value).catch(() => {});
            }}
          >
            {workflowPresets.length ? workflowPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.production ? "Production" : "Диагностика"} · {item.name}
              </option>
            )) : <option value="custom_api">Custom ComfyUI API workflow</option>}
          </select>
        </label>
        <button className="primary" onClick={createProject} disabled={!health?.ok || busy || form.topic.trim().length < 3}>
          {busy === "create" ? "Создаю..." : "Создать проект"}
        </button>
      </section>

      <section className="panel">
        <h2>03 · Проекты</h2>
        <div className="project-list">
          {projects.map((item) => (
            <button key={item.id} className={project?.id === item.id ? "selected" : ""} onClick={() => openProject(item.id)}>
              <b>{item.title}</b>
              <span>{item.status} · {item.progress}% · {formatTime(item.updated_at)}</span>
            </button>
          ))}
          {!projects.length ? <p className="muted">Пока нет проектов.</p> : null}
        </div>
      </section>

      {project ? (
        <section className="panel project-panel">
          <div className="project-head">
            <div>
              <h2>04 · Текущий проект</h2>
              <p>{project.title}</p>
            </div>
            <span>{project.status} · {project.current_stage}</span>
          </div>
          <div className="progress"><span style={{ width: `${progress}%` }} /></div>
          <label>
            Workflow изображений этого проекта
            <select
              value={project.image_workflow || "custom_api"}
              onChange={(e) => saveProjectWorkflow(e.target.value)}
              disabled={busy === "save-workflow"}
            >
              {workflowPresets.length ? workflowPresets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.production ? "Production" : "Диагностика"} · {item.name}
                </option>
              )) : <option value={project.image_workflow || "custom_api"}>{project.image_workflow || "custom_api"}</option>}
            </select>
          </label>
          <div className="actions">
            <button className="primary" onClick={() => runStage("script")} disabled={busy}>Сгенерировать сценарий</button>
            <button onClick={saveEditedScript} disabled={busy || !project.script_text?.trim()}>Сохранить сценарий</button>
            <button className="primary" onClick={() => runStage("storyboard")} disabled={busy || !project.script_text?.trim()}>Сгенерировать storyboard JSON</button>
            <button className="primary" onClick={() => runStage("images")} disabled={busy || !project.image_prompts_json?.length || !workflowReady}>Сгенерировать изображения</button>
            <button onClick={() => refreshStatus(project.id)} disabled={busy}>Обновить статус</button>
          </div>
          {!workflowReady ? (
            <div className="notice warn">Изображения заблокированы до готового ComfyUI workflow. Нужен реальный API workflow JSON, доступный ComfyUI и установленные ноды/модели.</div>
          ) : null}
          {project.error ? <div className="notice error">{project.error}</div> : null}
          <label>
            Сценарий
            <textarea className="script" value={project.script_text || ""} onChange={(e) => setProject({ ...project, script_text: e.target.value })} />
          </label>
          <div className="json-grid">
            <label>
              Storyboard JSON
              <textarea readOnly value={storyboardText} />
            </label>
            <label>
              Reference map
              <textarea readOnly value={refsText} />
            </label>
            <label>
              Image prompts
              <textarea readOnly value={imagePromptsText} />
            </label>
            <label>
              Video prompts
              <textarea readOnly value={videoPromptsText} />
            </label>
            <label>
              Images
              <textarea readOnly value={imagesText} />
            </label>
          </div>
          {images.length ? (
            <div className="image-grid">
              {images.map((item) => (
                <a key={`${item.scene_id}-${item.file}`} href={imageUrl(backendUrl, item)} target="_blank" rel="noreferrer">
                  <img src={imageUrl(backendUrl, item)} alt={item.scene_id || item.file || "generated frame"} />
                  <span>{item.scene_id} · {item.width}×{item.height}</span>
                </a>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel">
        <h2>05 · Прогресс</h2>
        {notice ? <div className="notice ok">{notice}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
        <div className="jobs">
          {jobs.map((job) => (
            <div key={job.id} className={`job ${job.status}`}>
              <b>{job.stage}</b>
              <span>{job.status} · {job.progress}%</span>
              <small>{job.message || job.error || formatTime(job.updated_at)}</small>
            </div>
          ))}
        </div>
        <div className="events">
          {events.slice(0, 12).map((event) => (
            <div key={event.id}>
              <b>{event.stage}</b>
              <span>{event.status} · {event.progress}% · {event.message}</span>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .factory-page{min-height:100vh;background:#090b10;color:#f5f2ea;padding:22px;display:grid;gap:16px;font-family:Inter,Arial,sans-serif}
        .hero{display:flex;justify-content:space-between;gap:18px;align-items:stretch;background:linear-gradient(135deg,#251019,#111827);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:22px}
        .hero h1{margin:4px 0 10px;font-size:34px;line-height:1.05}
        .hero p{max-width:820px;color:rgba(245,242,234,.72);line-height:1.45}
        .eyebrow{font-size:12px;letter-spacing:2px;color:#ff7890;font-weight:800}
        .health{min-width:210px;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:14px;display:grid;align-content:center;gap:6px;background:rgba(255,255,255,.04)}
        .health.ok{border-color:rgba(117,255,194,.45)}
        .health.bad{border-color:rgba(255,99,125,.45)}
        .health span,.muted{color:rgba(245,242,234,.62)}
        .workflow-status{border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:14px;display:grid;gap:10px;background:#0d1017}
        .workflow-status.ready{border-color:rgba(117,255,194,.40);background:rgba(20,74,54,.20)}
        .workflow-status.blocked{border-color:rgba(255,196,112,.42);background:rgba(74,50,17,.20)}
        .workflow-status div:first-child{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .workflow-status span,.workflow-status small{color:rgba(245,242,234,.68);line-height:1.35}
        .workflow-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;font-size:12px}
        .panel{border:1px solid rgba(255,255,255,.10);background:#11141c;border-radius:8px;padding:18px;display:grid;gap:14px}
        h2{font-size:22px;margin:0}
        label{display:grid;gap:8px;color:rgba(245,242,234,.72);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.5px}
        input,textarea,select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);background:#0b0e15;color:#f5f2ea;border-radius:6px;padding:13px 14px;font:inherit;font-size:15px;text-transform:none;letter-spacing:0}
        textarea{min-height:120px;resize:vertical;line-height:1.45}
        textarea.script{min-height:260px}
        .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .actions{display:flex;flex-wrap:wrap;gap:10px}
        button{border:1px solid rgba(255,255,255,.12);background:#202637;color:#f5f2ea;border-radius:6px;padding:12px 16px;font-weight:800;font-size:15px;cursor:pointer}
        button.primary{background:#e3344f;border-color:#ff6279}
        button:disabled{opacity:.45;cursor:not-allowed}
        .project-list{display:grid;gap:8px}
        .project-list button{text-align:left;display:grid;gap:5px}
        .project-list button.selected{border-color:#ff6279;background:#301521}
        .project-list span{color:rgba(245,242,234,.62);font-size:13px}
        .project-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
        .project-head p{margin:4px 0 0;color:rgba(245,242,234,.70)}
        .project-head span{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:8px 10px;color:#b7ffe3}
        .progress{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
        .progress span{display:block;height:100%;background:linear-gradient(90deg,#e3344f,#ffdca6,#9ee8c9)}
        .json-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .json-grid textarea{min-height:240px;font-family:Consolas,monospace;font-size:12px}
        .image-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
        .image-grid a{display:grid;gap:8px;border:1px solid rgba(255,255,255,.10);border-radius:6px;padding:8px;background:#0d1017;color:#f5f2ea;text-decoration:none}
        .image-grid img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:4px;background:#05070b}
        .image-grid span{font-size:12px;color:rgba(245,242,234,.65)}
        .notice{border-radius:6px;padding:12px 14px;border:1px solid rgba(255,255,255,.12);line-height:1.4}
        .notice.ok{background:rgba(20,74,54,.35);border-color:rgba(117,255,194,.35)}
        .notice.warn{background:rgba(74,50,17,.30);border-color:rgba(255,196,112,.38)}
        .notice.error{background:rgba(74,17,31,.35);border-color:rgba(255,99,125,.45);color:#ffc2cc}
        .jobs,.events{display:grid;gap:8px}
        .job,.events div{border:1px solid rgba(255,255,255,.10);border-radius:6px;padding:10px;display:grid;gap:4px;background:#0d1017}
        .job.done{border-color:rgba(117,255,194,.35)}
        .job.failed{border-color:rgba(255,99,125,.45)}
        .job.running{border-color:rgba(255,196,112,.40)}
        .job span,.events span,.job small{color:rgba(245,242,234,.65)}
        @media(max-width:760px){
          .factory-page{padding:12px}
          .hero,.project-head{display:grid}
          .hero h1{font-size:28px}
          .grid3,.json-grid,.workflow-grid{grid-template-columns:1fr}
          .health{min-width:0}
        }
      `}</style>
    </main>
  );
}
