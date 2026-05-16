"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const UI = {
  ru: {
    logoSub: "Quantum Cartoon Intelligence · v1",
    backStudio: "← Studio",
    ru: "RU · Рус",
    en: "EN · Eng",
    next: "ДАЛЕЕ →",
    back: "← НАЗАД",
    launch: "ОТПРАВИТЬ В PIPELINE →",
    copied: "✓ JSON скопирован",
    sent: "✓ ОТПРАВЛЕНО В PIPELINE",
    step: ["INIT", "STYLE", "HERO", "SCRIPT", "BOARD", "EXPORT"],
    typeLines: [
      "Collapsing wave functions into scenes...",
      "Neural pathways → storyboard nodes...",
      "Quantum superposition of creativity...",
      "Entangling characters across dimensions...",
    ],
    s1k: "Quantum Init · Step 01", s1a: "Initialize", s1b: "your project",
    s1p: "Задай параметры мультфильма. Каждый выбор становится частью JSON-паспорта проекта.",
    title: "Название мультфильма", titlePh: "Например: Кот, который нашёл портал",
    format: "Формат", duration: "Probability Wave · Duration", scenes: "сцен",
    s2k: "Visual Matrix · Step 02", s2a: "Mind's eye", s2b: "visual field",
    s2p: "Выбери визуальный стиль, настроение и палитру. Это станет style lock для всех сцен.",
    renderStyle: "Render Style · Eigenstate", mood: "Mood · Quantum Entanglement", palette: "Color Wavefunction",
    custom: "Custom Prompt Vector", customPh: "watercolor, dreamy, soft particle glow...",
    s3k: "Neural Signatures · Step 03", s3a: "Character", s3b: "entanglement",
    s3p: "До 3 нейросигнатур. Face Lock сохраняет визуальное ДНК во всех кадрах.",
    addHero: "⊕ INIT NEW CHARACTER NODE", heroName: "Name", heroDesc: "Appearance / personality", heroRole: "Role",
    faceLock: "Face Lock", faceSub: "зафиксировать лицо / силуэт",
    s4k: "Consciousness Stream · Step 04", s4a: "Narrator", s4b: "mind stream",
    s4p: "Поток сознания диктора. Каждое предложение становится нейронным узлом в раскадровке.",
    buildDemo: "✦ GENERATE VIA QUANTUM MIND", voice: "Voice Waveform", script: "Consciousness Text Stream",
    scriptPh: "// каждое предложение → синаптический узел...",
    words: "WORDS", nodes: "NODES",
    s5k: "Synaptic Map · Step 05", s5a: "Storyboard", s5b: "neural grid",
    s5p: "Проверь сцены, камеру и characters in scene. Это основа для image/video prompts.",
    rewire: "↺ REWIRE", sceneVoice: "Voice Signal", imagePrompt: "Image Prompt Vector", camera: "Camera · Photon Path",
    s6k: "Wave Collapse · Step 06", s6a: "Quantum", s6b: "collapse · export",
    s6p: "Итоговый JSON проекта. Позже он будет отправляться в настоящий cartoonEngine NeuroCine.",
    project: "PROJECT", characters: "CHARACTERS", storyboard: "STORYBOARD", copy: "⊕ COPY",
  },
  en: {
    logoSub: "Quantum Cartoon Intelligence · v1",
    backStudio: "← Studio",
    ru: "RU · Rus",
    en: "EN · Eng",
    next: "NEXT →",
    back: "← BACK",
    launch: "SEND TO PIPELINE →",
    copied: "✓ JSON copied",
    sent: "✓ SENT TO PIPELINE",
    step: ["INIT", "STYLE", "HERO", "SCRIPT", "BOARD", "EXPORT"],
    typeLines: [
      "Collapsing wave functions into scenes...",
      "Neural pathways → storyboard nodes...",
      "Quantum superposition of creativity...",
      "Entangling characters across dimensions...",
    ],
    s1k: "Quantum Init · Step 01", s1a: "Initialize", s1b: "your project",
    s1p: "Set cartoon parameters. Every choice becomes part of the project JSON passport.",
    title: "Cartoon title", titlePh: "Example: The cat who found a portal",
    format: "Format", duration: "Probability Wave · Duration", scenes: "scenes",
    s2k: "Visual Matrix · Step 02", s2a: "Mind's eye", s2b: "visual field",
    s2p: "Choose visual style, mood and palette. This becomes the style lock across scenes.",
    renderStyle: "Render Style · Eigenstate", mood: "Mood · Quantum Entanglement", palette: "Color Wavefunction",
    custom: "Custom Prompt Vector", customPh: "watercolor, dreamy, soft particle glow...",
    s3k: "Neural Signatures · Step 03", s3a: "Character", s3b: "entanglement",
    s3p: "Up to 3 neural signatures. Face Lock keeps visual DNA consistent across frames.",
    addHero: "⊕ INIT NEW CHARACTER NODE", heroName: "Name", heroDesc: "Appearance / personality", heroRole: "Role",
    faceLock: "Face Lock", faceSub: "lock face / silhouette",
    s4k: "Consciousness Stream · Step 04", s4a: "Narrator", s4b: "mind stream",
    s4p: "Narrator stream. Every sentence becomes a neural storyboard node.",
    buildDemo: "✦ GENERATE VIA QUANTUM MIND", voice: "Voice Waveform", script: "Consciousness Text Stream",
    scriptPh: "// each sentence → synaptic node...",
    words: "WORDS", nodes: "NODES",
    s5k: "Synaptic Map · Step 05", s5a: "Storyboard", s5b: "neural grid",
    s5p: "Review scenes, camera and characters in scene. This is the base for image/video prompts.",
    rewire: "↺ REWIRE", sceneVoice: "Voice Signal", imagePrompt: "Image Prompt Vector", camera: "Camera · Photon Path",
    s6k: "Wave Collapse · Step 06", s6a: "Quantum", s6b: "collapse · export",
    s6p: "Final project JSON. Later it will be sent to the real NeuroCine cartoonEngine.",
    project: "PROJECT", characters: "CHARACTERS", storyboard: "STORYBOARD", copy: "⊕ COPY",
  },
};

const formats = [
  { id: "shorts", ket: "|shorts⟩", label: "SHORTS · REELS", aspect: "9:16", duration: 60, spec: "≤90s" },
  { id: "tiktok", ket: "|tiktok⟩", label: "TIKTOK", aspect: "9:16", duration: 45, spec: "≤60s" },
  { id: "youtube", ket: "|youtube⟩", label: "YOUTUBE", aspect: "16:9", duration: 300, spec: "≤10min" },
  { id: "custom", ket: "|ψ⟩ superposition", label: "CUSTOM", aspect: "1:1", duration: 120, spec: "any ratio" },
];
const styles = [
  { id: "anime", icon: "🌸", label: "ANIME" }, { id: "pixar", icon: "🎪", label: "3D PIXAR" },
  { id: "flat", icon: "🎨", label: "2D FLAT" }, { id: "cinema", icon: "🎬", label: "CINEMA" },
  { id: "pixel", icon: "👾", label: "PIXEL" }, { id: "custom", icon: "⚛️", label: "CUSTOM" },
];
const moods = ["light", "dark", "epic", "cute", "mystery"];
const palettes = ["auto", "cool", "warm", "mono", "vivid"];
const voices = ["neutral", "dramatic", "kids", "doc"];
const roles = ["hero", "friend", "villain", "guide"];
const cameras = ["Wide Shot", "Medium Shot", "Close-Up", "Low Angle", "POV"];

function splitSentences(text) {
  return String(text || "").split(/(?<=[.!?…])\s+|\n+/).map(s => s.trim()).filter(Boolean).slice(0, 18);
}

function makeScene(sentence, index, state) {
  const styleText = state.style.preset === "custom" ? state.style.custom_prompt : state.style.preset;
  const chars = state.characters.slice(0, Math.max(1, Math.min(2, state.characters.length))).map(c => c.name || c.id);
  const act = index === 0 ? "HOOK" : index < 3 ? "BUILD" : index < 6 ? "CLIMAX" : "OUTRO";
  const camera = cameras[index % cameras.length];
  return {
    id: `scene_${String(index + 1).padStart(2, "0")}`,
    index: index + 1,
    act,
    duration_sec: Math.max(3, Math.round(state.project.duration / Math.max(1, splitSentences(state.script.text).length))),
    voice_line: sentence,
    camera,
    characters_in_scene: chars,
    image_prompt_en: `SCENE PRIMARY FOCUS: Cartoon scene in ${styleText} style, ${state.style.mood} mood, ${state.style.palette} palette. Visualize: ${sentence}. Keep character identity, clean silhouette, no text, no watermark.`,
    video_prompt_en: `ANIMATE CURRENT FRAME: ${sentence}. ${camera}. Preserve cartoon style, character identity, outfit, proportions and world continuity. Smooth expressive animation. No subtitles, no UI, no watermark. SFX: soft cartoon ambience.`,
    continuity_note: "Keep global cartoon style lock and character visual DNA consistent.",
  };
}

function initialState() {
  return {
    step: 1,
    project: { id: `cartoon_${Date.now()}`, title: "", created_at: new Date().toISOString(), format: "shorts", duration: 60, aspect: "9:16", language: "ru" },
    style: { preset: "anime", custom_prompt: "", mood: "light", palette: "auto" },
    characters: [],
    script: { text: "", voice_style: "neutral" },
    scenes: [],
    selectedScene: null,
    status: "",
  };
}

function makeProjectJson(state) {
  const scenes = state.scenes.length ? state.scenes : splitSentences(state.script.text).map((x, i) => makeScene(x, i, state));
  return {
    project: { id: state.project.id, title: state.project.title || "Untitled Cartoon", created_at: state.project.created_at, format: state.project.format, duration_sec: Number(state.project.duration), aspect_ratio: state.project.aspect, language: state.project.language, style: state.style },
    characters: state.characters,
    script: { full_text: state.script.text, voice_style: state.script.voice_style, word_count: state.script.text.trim() ? state.script.text.trim().split(/\s+/).length : 0, estimated_duration_sec: Number(state.project.duration), language: state.project.language },
    storyboard: { total_scenes: scenes.length, total_duration_sec: scenes.reduce((a, s) => a + Number(s.duration_sec || 0), 0), scenes },
    generation: { target: "veo3", mode: "safe", model_script: "gpt-5.4", model_storyboard: "gpt-5.4", model_image_analysis: "claude-sonnet-4-6", model_video_prompt: "claude-haiku-4-5", estimated_cost_usd: 0.04, pipeline: "cartoon_creator_v1" },
  };
}

export default function QuantumCartoonCreator() {
  const [lang, setLang] = useState("ru");
  const [s, setS] = useState(initialState);
  const [tagline, setTagline] = useState("");
  const waveRef = useRef(null);
  const t = UI[lang];
  const segments = useMemo(() => splitSentences(s.script.text), [s.script.text]);
  const json = useMemo(() => makeProjectJson(s), [s]);
  const jsonText = useMemo(() => JSON.stringify(json, null, 2), [json]);
  const selected = s.selectedScene ? s.scenes.find(x => x.id === s.selectedScene) : null;

  useEffect(() => {
    let line = 0, char = 0, stop = false, timer = 0;
    const tick = () => {
      if (stop) return;
      const current = t.typeLines[line % t.typeLines.length];
      if (char <= current.length) {
        setTagline(current.slice(0, char) + "_");
        char += 1;
        timer = window.setTimeout(tick, 38);
      } else {
        timer = window.setTimeout(() => { char = 0; line += 1; tick(); }, 1700);
      }
    };
    tick();
    return () => { stop = true; window.clearTimeout(timer); };
  }, [lang, t.typeLines]);

  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let phase = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(220, rect.width || 320);
      const h = 42;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      phase += 0.04;
      const pts = [];
      const f = Number(s.project.duration || 60) / 600;
      for (let x = 0; x <= w; x += 2) {
        const y = h / 2 + Math.sin(x * 0.045 + phase) * 8 * f + Math.sin(x * 0.09 - phase * 1.5) * 4 * f + Math.sin(x * 0.02 + phase * 0.7) * 6 * f;
        pts.push({ x, y });
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(0,180,255,.24)");
      g.addColorStop(1, "rgba(0,80,255,.03)");
      ctx.beginPath(); ctx.moveTo(0, h); pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = "rgba(0,212,255,.72)"; ctx.lineWidth = 1.5; ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [s.project.duration]);

  function patch(path, value) {
    setS(prev => {
      const next = { ...prev, project: { ...prev.project }, style: { ...prev.style }, script: { ...prev.script } };
      const [a, b] = path.split(".");
      next[a] = { ...next[a], [b]: value };
      return next;
    });
  }
  function buildScenes(src = s) { return splitSentences(src.script.text).map((x, i) => makeScene(x, i, src)); }
  function goStep(n) {
    setS(prev => ({ ...prev, step: Math.min(6, Math.max(1, n)), scenes: n >= 5 ? buildScenes(prev) : prev.scenes }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function addHero() {
    setS(prev => prev.characters.length >= 3 ? prev : ({ ...prev, characters: [...prev.characters, { id: `char_${prev.characters.length + 1}`, name: `Hero ${prev.characters.length + 1}`, description: "", role: "hero", face_lock: true, modifiers: [] }] }));
  }
  function patchHero(i, key, value) { setS(prev => ({ ...prev, characters: prev.characters.map((c, idx) => idx === i ? { ...c, [key]: value } : c) })); }
  function deleteHero(i) { setS(prev => ({ ...prev, characters: prev.characters.filter((_, idx) => idx !== i) })); }
  function demoScript() {
    patch("script.text", lang === "ru"
      ? "Однажды маленький робот проснулся на Луне. Он увидел светящийся след между кратерами. След привёл его к двери, которой вчера не было. За дверью жил потерянный солнечный зайчик. Робот понял, что должен вернуть его на небо. И когда зайчик прыгнул вверх, вся Луна впервые засветилась тёплым светом."
      : "One day a tiny robot woke up on the Moon. He saw a glowing trail between the craters. The trail led him to a door that had not existed yesterday. Behind the door lived a lost sunbeam. The robot knew he had to return it to the sky. When the sunbeam jumped up, the Moon glowed with warm light for the first time.");
  }
  async function copyJson() {
    await navigator.clipboard.writeText(jsonText);
    setS(prev => ({ ...prev, status: t.copied }));
    setTimeout(() => setS(prev => ({ ...prev, status: "" })), 1500);
  }

  return <main className="qc-page">
    <div className="qc-wrap">
      <div className="qc-top"><a className="qc-back" href="/studio">{t.backStudio}</a><div className="qc-lang"><button className={lang === "ru" ? "on" : ""} onClick={() => { setLang("ru"); patch("project.language", "ru"); }}>{t.ru}</button><button className={lang === "en" ? "on" : ""} onClick={() => { setLang("en"); patch("project.language", "en"); }}>{t.en}</button></div></div>
      <header className="q-header"><div className="q-logo"><div className="q-orb"><i /></div><div className="q-logo-text">NEUROCINE</div></div><div className="q-sub">{t.logoSub}</div><div className="q-tag">{tagline}</div></header>
      <div className="q-stepbar">{t.step.map((label, i) => <div className="q-node" key={label}><button className={`q-dot ${s.step === i + 1 ? "on" : ""} ${s.step > i + 1 ? "done" : ""}`} onClick={() => goStep(i + 1)}>{s.step > i + 1 ? "✓" : String(i + 1).padStart(2, "0")}</button>{i < 5 && <div className={`q-wire ${s.step > i + 1 ? "done" : ""}`} />}</div>)}</div>
      <section className="q-panel">
        {s.step === 1 && <><Head k={t.s1k} a={t.s1a} b={t.s1b} p={t.s1p} /><Field label={t.title}><input className="q-inp" value={s.project.title} placeholder={t.titlePh} onChange={e => patch("project.title", e.target.value)} /></Field><Field label={t.format}><div className="fmt-grid">{formats.map(f => <button key={f.id} className={`fmt-card ${s.project.format === f.id ? "on" : ""}`} onClick={() => setS(prev => ({ ...prev, project: { ...prev.project, format: f.id, aspect: f.aspect, duration: f.duration } }))}><span className="collapse-wave" /><div className="fmt-ket">{f.ket}</div><div className="fmt-name">{f.label}</div><div className="fmt-spec">{f.aspect} · {f.spec}</div></button>)}</div></Field><Field label={t.duration}><div className="dur-panel"><div className="dur-display"><div><span className="dur-num">{s.project.duration}</span><span className="dur-s">s</span></div><div className="dur-sc">≈ {Math.max(1, Math.round(s.project.duration / 7))} {t.scenes}</div></div><canvas ref={waveRef} className="wave-canvas" height="42" /><input type="range" min="15" max="600" step="5" value={s.project.duration} onChange={e => patch("project.duration", Number(e.target.value))} /></div></Field></>}
        {s.step === 2 && <><Head k={t.s2k} a={t.s2a} b={t.s2b} p={t.s2p} /><Field label={t.renderStyle}><div className="sty-grid">{styles.map(st => <button className={`sty-card ${s.style.preset === st.id ? "on" : ""}`} key={st.id} onClick={() => patch("style.preset", st.id)}><div className="sty-ico">{st.icon}</div><div className="sty-name">{st.label}</div></button>)}</div></Field>{s.style.preset === "custom" && <Field label={t.custom}><textarea className="q-inp" placeholder={t.customPh} value={s.style.custom_prompt} onChange={e => patch("style.custom_prompt", e.target.value)} /></Field>}<Field label={t.mood}><div className="chip-row">{moods.map(m => <button key={m} className={`q-chip ${s.style.mood === m ? "on" : ""}`} onClick={() => patch("style.mood", m)}>{m.toUpperCase()}</button>)}</div></Field><Field label={t.palette}><div className="chip-row">{palettes.map(p => <button key={p} className={`q-chip ${s.style.palette === p ? "on" : ""}`} onClick={() => patch("style.palette", p)}>{p.toUpperCase()}</button>)}</div></Field></>}
        {s.step === 3 && <><Head k={t.s3k} a={t.s3a} b={t.s3b} p={t.s3p} /><div className="neural-list">{s.characters.map((c, i) => <div className="neural-card" key={c.id}><div className="nc-head"><div className="nc-orb">{i + 1}</div><div><div className="nc-name">{c.name || c.id}</div><div className="nc-id">{c.role} · {c.face_lock ? "FACE_LOCK" : "FREE"}</div></div></div><div className="nc-grid"><Field label={t.heroName}><input className="q-inp" value={c.name} onChange={e => patchHero(i, "name", e.target.value)} /></Field><Field label={t.heroDesc}><textarea className="q-inp" value={c.description} onChange={e => patchHero(i, "description", e.target.value)} /></Field><Field label={t.heroRole}><div className="role-row">{roles.map(r => <button key={r} className={`role-b ${c.role === r ? "on" : ""}`} onClick={() => patchHero(i, "role", r)}>{r.toUpperCase()}</button>)}</div></Field><div className="entangle-row"><div><div className="ent-title">{t.faceLock}</div><div className="ent-sub">{t.faceSub}</div></div><button className={`ent-toggle ${c.face_lock ? "on" : ""}`} onClick={() => patchHero(i, "face_lock", !c.face_lock)}><i /></button></div><button className="q-del" onClick={() => deleteHero(i)}>DELETE NODE</button></div></div>)}</div><button className="add-neural" onClick={addHero}>{t.addHero}</button></>}
        {s.step === 4 && <><Head k={t.s4k} a={t.s4a} b={t.s4b} p={t.s4p} /><button className="mind-btn" onClick={demoScript}>{t.buildDemo}</button><Field label={t.voice}><div className="v-row">{voices.map(v => <button key={v} className={`v-b ${s.script.voice_style === v ? "on" : ""}`} onClick={() => patch("script.voice_style", v)}>{v.toUpperCase()}</button>)}</div></Field><Field label={t.script}><textarea className="q-inp" rows={7} value={s.script.text} placeholder={t.scriptPh} onChange={e => patch("script.text", e.target.value)} /></Field><div className="meta-strip"><div className="q-meta">{t.words}: <span>{s.script.text.trim() ? s.script.text.trim().split(/\s+/).length : 0}</span></div><div className="q-meta">{t.nodes}: <span>{segments.length}</span></div><div className="q-meta">~<span>{Math.min(s.project.duration, segments.length * 7)}</span>s</div></div><div className="seg-list">{segments.map((x, i) => <div className="seg-row" key={i}>#{String(i + 1).padStart(2, "0")} · {x}</div>)}</div></>}
        {s.step === 5 && <><Head k={t.s5k} a={t.s5a} b={t.s5b} p={t.s5p} /><div className="sb-toolbar"><div className="q-meta">NODES: <span>{s.scenes.length}</span></div><button className="regen-q" onClick={() => setS(prev => ({ ...prev, scenes: buildScenes(prev) }))}>{t.rewire}</button></div>{selected && <div className="sc-det"><Field label={t.sceneVoice}><textarea className="q-inp" value={selected.voice_line} onChange={e => setS(prev => ({ ...prev, scenes: prev.scenes.map(sc => sc.id === selected.id ? { ...sc, voice_line: e.target.value } : sc) }))} /></Field><div className="q-label">{t.imagePrompt}</div><div className="det-pmt">{selected.image_prompt_en}</div><Field label={t.camera}><div className="cam-row">{cameras.map(cam => <button key={cam} className={`cam-b ${selected.camera === cam ? "on" : ""}`} onClick={() => setS(prev => ({ ...prev, scenes: prev.scenes.map(sc => sc.id === selected.id ? { ...sc, camera: cam } : sc) }))}>{cam}</button>)}</div></Field></div>}<div className="syn-grid">{s.scenes.map(sc => <button key={sc.id} className={`syn-card ${s.selectedScene === sc.id ? "sel" : ""}`} onClick={() => setS(prev => ({ ...prev, selectedScene: sc.id }))}><div className="syt"><div className="pulse" /><div className="sy-act">{sc.act}</div><div className="sy-num">{String(sc.index).padStart(2, "0")}</div></div><div className="sy-info"><div className="sy-voice">{sc.voice_line}</div></div></button>)}</div></>}
        {s.step === 6 && <><Head k={t.s6k} a={t.s6a} b={t.s6b} p={t.s6p} /><div className="exp-stats"><div className="exp-s"><span className="exp-v">1</span>{t.project}</div><div className="exp-s"><span className="exp-v">{s.characters.length}</span>{t.characters}</div><div className="exp-s"><span className="exp-v">{json.storyboard.total_scenes}</span>{t.storyboard}</div></div><div className="json-wrap"><div className="json-bar"><span className="json-fn">◈ cartoon_project.quantum.json</span><button className="json-cp" onClick={copyJson}>{t.copy}</button></div><pre className="json-body">{jsonText}</pre></div>{s.status && <div className="qc-status">{s.status}</div>}</>}
      </section>
    </div>
    <div className="q-nav"><button className="nav-back" onClick={() => goStep(s.step - 1)} disabled={s.step <= 1}>{t.back}</button><button className={`nav-next ${s.step === 6 ? "launch" : ""}`} onClick={() => s.step === 6 ? setS(prev => ({ ...prev, status: t.sent })) : goStep(s.step + 1)}>{s.step === 6 ? t.launch : t.next}</button></div>
  </main>;
}

function Head({ k, a, b, p }) { return <><div className="q-eye">{k}</div><h1 className="q-title"><span className="glow">{a}</span><span className="dim">{b}</span></h1><p className="q-body">{p}</p></>; }
function Field({ label, children }) { return <div className="q-field"><label className="q-label">{label}</label>{children}</div>; }
