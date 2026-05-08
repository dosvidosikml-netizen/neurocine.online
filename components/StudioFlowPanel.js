"use client";

function stepState(active) {
  if (active === "done") return "done";
  if (active === "active") return "active";
  return "idle";
}

export default function StudioFlowPanel({
  topic = "",
  script = "",
  storyboard = null,
  frameGridPrompt = "",
  videoPrompt = "",
  productionReady = false,
  access = null,
  devMode = true,
  liveAllowed = false,
}) {
  const hasTopic = Boolean(String(topic || "").trim());
  const hasScript = Boolean(String(script || "").trim());
  const hasStoryboard = Boolean(storyboard?.scenes?.length);
  const hasPartPrompt = Boolean(String(frameGridPrompt || "").trim());
  const hasVideoPrompt = Boolean(String(videoPrompt || "").trim());
  const isOwner = Boolean(access?.isOwner || access?.isAdmin);
  const isPro = access?.role === "pro" && !isOwner;

  const liveLabel = isOwner
    ? "OWNER LIVE"
    : isPro
      ? (liveAllowed ? "PRO LIVE" : "PRO ждёт AI-ключ")
      : "FREE Preview";

  const steps = [
    { n: "01", title: "Сценарий", desc: "хук, диктор, структура", state: hasScript ? "done" : hasTopic ? "active" : "idle" },
    { n: "02", title: "Storyboard", desc: "JSON, кадры, VO/SFX", state: hasStoryboard ? "done" : hasScript ? "active" : "idle" },
    { n: "03", title: "Pipeline", desc: "PART grid, Flow/VEO", state: hasVideoPrompt ? "done" : hasPartPrompt ? "active" : hasStoryboard ? "active" : "idle" },
    { n: "04", title: "Production Pack", desc: "Cover, TTS, Music, SEO", state: productionReady ? "done" : hasScript || hasStoryboard ? "active" : "idle" },
    { n: "05", title: "Export", desc: "Cloud snapshot + файлы", state: hasScript || hasStoryboard ? "active" : "idle" },
  ];

  return (
    <section className="studio-flow-v62" aria-label="NeuroCine workflow status">
      <div className="sf-head-v62">
        <div>
          <div className="sf-kicker-v62">Studio Flow</div>
          <h2>Production workflow</h2>
          <p>Чистая цепочка проекта: от темы до экспортного пакета. Всё, что создано ниже, попадает в Cloud snapshot проекта.</p>
        </div>
        <div className={`sf-access-v62 ${liveAllowed ? "live" : devMode ? "demo" : "pending"}`}>
          <span>Доступ</span>
          <strong>{liveLabel}</strong>
        </div>
      </div>
      <div className="sf-steps-v62">
        {steps.map((s) => (
          <a key={s.n} className={`sf-step-v62 ${stepState(s.state)}`} href={s.n === "01" ? "#script" : s.n === "02" ? "#storyboard" : s.n === "03" ? "#production" : s.n === "04" ? "#pack" : "#cloud-projects"}>
            <span>{s.n}</span>
            <strong>{s.title}</strong>
            <em>{s.desc}</em>
          </a>
        ))}
      </div>
    </section>
  );
}
