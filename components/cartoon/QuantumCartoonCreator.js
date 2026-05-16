"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

const CAMS = ["Wide Shot", "Medium Shot", "Close-Up", "Over Shoulder", "Low Angle", "Extreme CU", "Aerial", "POV"];
const CAM_ICO = { "Wide Shot": "🏞", "Medium Shot": "🎭", "Close-Up": "🔍", "Over Shoulder": "🎬", "Low Angle": "⬆️", "Extreme CU": "👁", "Aerial": "🛸", "POV": "👀" };
const MODS = ["beard", "scar", "dirt", "bruises", "sweat", "exhaustion", "pale", "crown", "glasses", "mask"];
const ACT_CLS = { HOOK: "aH", BUILD: "aB", CLIMAX: "aC", OUTRO: "aO" };
const STYLE_PROMPTS = {
  anime: "anime cel-shaded, vibrant quantum colors, detailed linework",
  pixar: "3D premium cartoon, warm volumetric lighting, cinematic composition",
  flat: "2D flat cartoon, bold outlines, bright solid colors",
  cinema: "cinematic animation realism, dramatic quantum lighting",
  pixel: "16-bit pixel art, limited palette, retro quantum aesthetic",
  custom: "",
};
const DEMO_TEXT = {
  ru: "Это история началась в один обычный день. Главный герой шёл по улице, ничего не подозревая. Вдруг перед ним возникло нечто невероятное! Сердце забилось быстрее. Он не мог поверить своим глазам. Мир вокруг изменился навсегда. И он понял — жизнь никогда не будет прежней.",
  en: "The adventure began on an ordinary morning. Our hero discovered something extraordinary. Everything changed in an instant. The impossible became possible. Against all odds, courage prevailed.",
  ua: "Ця пригода почалася звичайного дня. Герой не підозрював що чекає попереду. Раптово все змінилось. Сила духу виявилась сильнішою за страх.",
};

const initialState = {
  step: 1,
  concept: { title: "", format: "shorts", aspect: "9:16", duration: 60, language: "ru" },
  style: { preset: "anime", custom_prompt: "", mood: "light", palette: "AUTO" },
  characters: [],
  script: { text: "", voice_style: "neutral", segments: [] },
  scenes: [],
  selectedSceneIdx: null,
  heroCounter: 0,
  heroWarn: false,
};

function splitScript(text = "") {
  return String(text)
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .slice(0, 18);
}

function getActs(n) {
  return Array.from({ length: n }, (_, i) => {
    const p = i / Math.max(1, n);
    if (p < 0.1) return "HOOK";
    if (p < 0.5) return "BUILD";
    if (p < 0.85) return "CLIMAX";
    return "OUTRO";
  });
}

function reducer(state, action) {
  switch (action.type) {
    case "GOTO": return { ...state, step: action.n };
    case "SET_TITLE": return { ...state, concept: { ...state.concept, title: action.v } };
    case "SET_FORMAT": return { ...state, concept: { ...state.concept, format: action.f, aspect: action.a, duration: action.d } };
    case "SET_DURATION": return { ...state, concept: { ...state.concept, duration: action.v } };
    case "SET_LANG": return { ...state, concept: { ...state.concept, language: action.v } };
    case "SET_STYLE": return { ...state, style: { ...state.style, preset: action.v } };
    case "SET_CUSTOM_PROMPT": return { ...state, style: { ...state.style, custom_prompt: action.v } };
    case "SET_MOOD": return { ...state, style: { ...state.style, mood: action.v } };
    case "SET_PALETTE": return { ...state, style: { ...state.style, palette: action.v } };
    case "SET_VOICE_STYLE": return { ...state, script: { ...state.script, voice_style: action.v } };
    case "SET_SCRIPT_TEXT": return { ...state, script: { ...state.script, text: action.v, segments: splitScript(action.v) }, scenes: [], selectedSceneIdx: null };
    case "ADD_HERO": {
      if (state.characters.length >= 3) return { ...state, heroWarn: true };
      const n = state.heroCounter + 1;
      const id = `neural_${String(n).padStart(2, "0")}`;
      return {
        ...state,
        heroCounter: n,
        heroWarn: state.characters.length + 1 >= 3,
        characters: [...state.characters, { id, name: `NODE_${String(n).padStart(2, "0")}`, role: "main", description: "", reference_preview: null, reference_url: null, face_lock: true, modifiers: [], expanded: true }],
      };
    }
    case "REMOVE_HERO": return { ...state, characters: state.characters.filter((h) => h.id !== action.id), heroWarn: false };
    case "PATCH_HERO": return { ...state, characters: state.characters.map((h) => h.id === action.id ? { ...h, ...action.patch } : h) };
    case "TOGGLE_HERO_EXP": return { ...state, characters: state.characters.map((h) => h.id === action.id ? { ...h, expanded: !h.expanded } : h) };
    case "TOGGLE_HERO_MOD": return { ...state, characters: state.characters.map((h) => {
      if (h.id !== action.id) return h;
      const has = h.modifiers.includes(action.m);
      return { ...h, modifiers: has ? h.modifiers.filter((x) => x !== action.m) : [...h.modifiers, action.m] };
    }) };
    case "BUILD_SCENES": return { ...state, scenes: action.scenes, selectedSceneIdx: action.scenes.length ? 0 : null };
    case "SELECT_SCENE": return { ...state, selectedSceneIdx: action.i };
    case "PATCH_SCENE": return { ...state, scenes: state.scenes.map((sc, i) => i === action.i ? { ...sc, ...action.patch } : sc) };
    default: return state;
  }
}

function buildImagePrompt(state, scene, allScenes) {
  const styleBase = state.style.preset === "custom" ? state.style.custom_prompt : STYLE_PROMPTS[state.style.preset];
  const characters = state.characters
    .filter((h) => scene.characters_in_scene.includes(h.id))
    .map((h) => `${h.name}: ${h.description || "cartoon character"}${h.face_lock ? ", face lock enabled" : ""}${h.modifiers.length ? ", modifiers: " + h.modifiers.join(", ") : ""}`)
    .join("; ");
  return [
    `SCENE PRIMARY FOCUS: ${scene.voice_line.slice(0, 92)}`,
    `${styleBase || "high quality cartoon animation"}`,
    `mood: ${state.style.mood}; palette: ${state.style.palette}; act: ${scene.act}`,
    characters ? `Characters: ${characters}.` : "No locked character selected.",
    `Camera: ${scene.camera}. Vertical ${state.concept.aspect}. Clean animation frame, no text, no watermark.`,
    allScenes ? "Maintain visual DNA, style lock and character continuity across the whole cartoon." : "",
  ].filter(Boolean).join(" ");
}

function buildScenesFromScript(state) {
  const segments = state.script.segments.length ? state.script.segments : splitScript(state.script.text);
  if (!segments.length) return [];
  const acts = getActs(segments.length);
  const duration = Math.max(2, Math.round(Number(state.concept.duration || 60) / segments.length));
  const primary = state.characters[0]?.id;
  const scenes = segments.map((line, i) => ({
    id: `node_${String(i + 1).padStart(2, "0")}`,
    order: i + 1,
    act: acts[i],
    voice_line: line,
    duration_sec: duration,
    camera: CAMS[i % CAMS.length],
    characters_in_scene: primary ? [primary] : [],
    image_prompt_en: "",
    video_prompt_en: "",
  }));
  return scenes.map((scene, i) => {
    const image = buildImagePrompt(state, scene, scenes);
    return { ...scene, image_prompt_en: image, video_prompt_en: `ANIMATE CURRENT FRAME: ${image} Smooth expressive cartoon motion for ${scene.duration_sec}s. Preserve exact character identity, outfit, colors, face proportions and world continuity. SFX: soft cartoon ambience. No subtitles, no UI, no watermark.` };
  });
}

function buildExportJSON(state) {
  const scenes = state.scenes.length ? state.scenes : buildScenesFromScript(state);
  return {
    project: {
      id: `quantum_${Date.now()}`,
      title: state.concept.title || "Untitled Cartoon",
      created_at: new Date().toISOString(),
      format: state.concept.format,
      duration_sec: Number(state.concept.duration),
      aspect_ratio: state.concept.aspect,
      language: state.concept.language,
      style: state.style,
    },
    characters: state.characters,
    script: {
      full_text: state.script.text,
      voice_style: state.script.voice_style,
      word_count: state.script.text.trim() ? state.script.text.trim().split(/\s+/).length : 0,
      segments: state.script.segments,
    },
    storyboard: {
      total_nodes: scenes.length,
      total_duration_sec: scenes.reduce((a, s) => a + Number(s.duration_sec || 0), 0),
      scenes,
    },
    generation: {
      target: "veo3",
      mode: "safe",
      model_script: "gpt-5.4",
      model_storyboard: "gpt-5.4",
      model_image_analysis: "claude-sonnet-4-6",
      model_video_prompt: "claude-haiku-4-5",
      pipeline: "cartoon_creator_v1",
    },
    quantum_metadata: {
      creator_ui: "quantum_cartoon_creator_packaged",
      estimated_cost_usd: 0.04,
    },
  };
}

function syntaxHL(json) {
  return String(json)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      if (/^"/.test(m)) return /:$/.test(m) ? `<span class="jk">${m}</span>` : `<span class="js">${m}</span>`;
      if (/true|false|null/.test(m)) return `<span class="jb">${m}</span>`;
      return `<span class="jn">${m}</span>`;
    });
}

export default function QuantumCartoonCreator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fieldRef = useRef(null);
  const waveRef = useRef(null);
  const tagRef = useRef(null);
  const waveCtrlRef = useRef(null);
  const jsonBodyRef = useRef(null);
  const jsonTextRef = useRef("");
  const revealTimer = useRef(null);

  useEffect(() => {
    document.body.classList.add("route-cartoon");
    return () => document.body.classList.remove("route-cartoon");
  }, []);

  useEffect(() => {
    let destroyField = () => {};
    let destroyType = () => {};
    let waveCtrl = { destroy: () => {}, setDuration: () => {} };
    import("/cartoon/quantum-anim.js").then((mod) => {
      destroyField = mod.initQuantumField?.(fieldRef.current) || destroyField;
      waveCtrl = mod.initWaveCanvas?.(waveRef.current) || waveCtrl;
      destroyType = mod.initTypewriter?.(tagRef.current) || destroyType;
      waveCtrlRef.current = waveCtrl;
      waveCtrl.setDuration(Number(state.concept.duration));
    }).catch((err) => console.warn("[QCC] quantum-anim load failed", err));
    return () => {
      try { destroyField(); } catch {}
      try { waveCtrl.destroy(); } catch {}
      try { destroyType(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    waveCtrlRef.current?.setDuration?.(Number(state.concept.duration));
  }, [state.concept.duration]);

  useEffect(() => {
    if (state.step === 5 && state.scenes.length === 0) {
      dispatch({ type: "BUILD_SCENES", scenes: buildScenesFromScript(state) });
    }
    if (state.step === 6) {
      const json = JSON.stringify(buildExportJSON(state), null, 2);
      jsonTextRef.current = json;
      revealJson(json);
    }
    if (typeof window !== "undefined") {
      window.qPulse?.(window.innerWidth / 2, Math.min(window.innerHeight * 0.45, 420), "#00d4ff");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  function revealJson(text) {
    const body = jsonBodyRef.current;
    if (!body) return;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    let i = 0;
    const full = syntaxHL(text);
    function tick() {
      if (i >= text.length) { body.innerHTML = full; return; }
      body.textContent = text.slice(0, i) + "▋";
      i += Math.floor(Math.random() * 7) + 3;
      revealTimer.current = setTimeout(tick, 8);
    }
    tick();
  }

  const goStep = useCallback((n) => {
    if (n < 1 || n > 6) return;
    dispatch({ type: "GOTO", n });
  }, []);

  function handleHeroUpload(id, files) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => dispatch({ type: "PATCH_HERO", id, patch: { reference_preview: e.target.result, reference_url: `[signal:${file.name}]` } });
    reader.readAsDataURL(file);
  }

  function aiGenerate() {
    const txt = DEMO_TEXT[state.concept.language] || DEMO_TEXT.ru;
    dispatch({ type: "SET_SCRIPT_TEXT", v: txt });
  }

  function copyJson() {
    const text = jsonTextRef.current || JSON.stringify(buildExportJSON(state), null, 2);
    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.querySelector(".qcc-root .json-cp");
      if (btn) {
        const old = btn.textContent;
        btn.textContent = "✓ COPIED";
        setTimeout(() => { btn.textContent = old; }, 1600);
      }
    });
  }

  function launch() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => window.qPulse?.(Math.random() * window.innerWidth, Math.random() * window.innerHeight, "#8b00ff"), i * 180);
    }
  }

  return (
    <div className="qcc-root">
      <canvas id="qc" ref={fieldRef} />
      <div className="hex-grid" />
      <div className="vignette" />
      <div className="wrap">
        <header className="q-header">
          <div className="q-logo">
            <div className="q-logo-icon"><div className="orb" /></div>
            <div className="q-logo-text">NEUROCINE</div>
          </div>
          <div className="q-sub">Quantum Cartoon Intelligence · v∞</div>
          <div className="q-tagline" ref={tagRef} />
        </header>
        <StepBar step={state.step} onJump={(i) => i <= state.step && goStep(i)} />
        {state.step === 1 && <Step1 state={state} dispatch={dispatch} waveRef={waveRef} />}
        {state.step === 2 && <Step2 state={state} dispatch={dispatch} />}
        {state.step === 3 && <Step3 state={state} dispatch={dispatch} onUpload={handleHeroUpload} />}
        {state.step === 4 && <Step4 state={state} dispatch={dispatch} onAi={aiGenerate} />}
        {state.step === 5 && <Step5 state={state} dispatch={dispatch} />}
        {state.step === 6 && <Step6 stats={getStats(state)} jsonBodyRef={jsonBodyRef} onCopy={copyJson} />}
      </div>
      <div className="nav">
        {state.step > 1 && <button className="nav-back" onClick={() => goStep(state.step - 1)}>← BACK</button>}
        <button className={`nav-next${state.step === 6 ? " launch" : ""}`} onClick={state.step === 6 ? launch : () => goStep(state.step + 1)}>
          {state.step === 5 ? "EXPORT →" : state.step === 6 ? "⚡ LAUNCH" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}

function StepBar({ step, onJump }) {
  return <div className="q-stepbar">{Array.from({ length: 6 }, (_, idx) => { const i = idx + 1; return <div className="qb-node" key={i}><button className={`qb-qubit${i < step ? " done" : i === step ? " active" : ""}`} onClick={() => onJump(i)}><span className="ring" /><span className="sphere">{i < step ? "✓" : String(i).padStart(2, "0")}</span></button>{i < 6 && <div className={`qb-wire${i < step ? " done" : ""}`} />}</div>; })}</div>;
}

function Step1({ state, dispatch, waveRef }) {
  const formats = [
    { f: "shorts", a: "9:16", d: 60, ket: "|shorts⟩", name: "SHORTS · REELS", spec: "9:16 · ≤90s" },
    { f: "tiktok", a: "9:16", d: 45, ket: "|tiktok⟩", name: "TIKTOK", spec: "9:16 · ≤60s" },
    { f: "youtube", a: "16:9", d: 300, ket: "|youtube⟩", name: "YOUTUBE", spec: "16:9 · ≤10min" },
    { f: "custom", a: "1:1", d: 120, ket: "|ψ⟩ superposition", name: "CUSTOM", spec: "any ratio" },
  ];
  return <section className="step-panel on"><Header eyebrow="Quantum Init · Step 01" a="Initialize" b="your project" body="Задай параметры мультфильма. Каждый выбор становится частью JSON-паспорта проекта." /><Field label="Project Identity"><input className="q-inp" value={state.concept.title} placeholder="Название мультфильма..." onChange={(e) => dispatch({ type: "SET_TITLE", v: e.target.value })} /></Field><Field label="Quantum State · Format"><div className="fmt-grid">{formats.map((f) => <button key={f.f} className={`fmt-card${state.concept.format === f.f ? " on" : ""}`} onClick={() => dispatch({ type: "SET_FORMAT", f: f.f, a: f.a, d: f.d })}><span className="collapse-wave" /><span className="fmt-ket">{f.ket}</span><strong className="fmt-name">{f.name}</strong><span className="fmt-spec">{f.spec}</span></button>)}</div></Field><Field label="Interface / Project Language"><div className="lang-row">{["ru", "en", "ua"].map((l) => <button key={l} className={`lang-b${state.concept.language === l ? " on" : ""}`} onClick={() => dispatch({ type: "SET_LANG", v: l })}>{l.toUpperCase()}</button>)}</div></Field><Field label="Probability Wave · Duration"><div className="dur-panel"><div className="dur-display"><div><span className="dur-num">{state.concept.duration}</span><span className="dur-s">s</span></div><div className="dur-sc">≈ {Math.max(1, Math.round(state.concept.duration / 7))} scenes</div></div><canvas ref={waveRef} className="wave-canvas" /><input type="range" min="15" max="600" step="5" value={state.concept.duration} onChange={(e) => dispatch({ type: "SET_DURATION", v: Number(e.target.value) })} /></div></Field></section>;
}

function Step2({ state, dispatch }) {
  const styles = [["anime", "🌸", "ANIME"], ["pixar", "🎪", "3D PIXAR"], ["flat", "🎨", "2D FLAT"], ["cinema", "🎬", "CINEMA"], ["pixel", "👾", "PIXEL"], ["custom", "⚛️", "CUSTOM"]];
  return <section className="step-panel on"><Header eyebrow="Visual Matrix · Step 02" a="Mind's eye" b="visual field" body="Выбери визуальный стиль, настроение и палитру. Это станет style lock для всех сцен." /><Field label="Render Style · Eigenstate"><div className="sty-grid">{styles.map(([id, icon, label]) => <button key={id} className={`sty-card${state.style.preset === id ? " on" : ""}`} onClick={() => dispatch({ type: "SET_STYLE", v: id })}><span className="sty-ico">{icon}</span><strong className="sty-name">{label}</strong></button>)}</div></Field>{state.style.preset === "custom" && <Field label="Custom Prompt Vector"><textarea className="q-inp" value={state.style.custom_prompt} placeholder="watercolor, dreamy, soft particle glow..." onChange={(e) => dispatch({ type: "SET_CUSTOM_PROMPT", v: e.target.value })} /></Field>}<Field label="Mood · Quantum Entanglement"><div className="mood-row">{["light", "dark", "epic", "cute", "mystery"].map((m) => <button key={m} className={`mood-chip${state.style.mood === m ? " on" : ""}`} onClick={() => dispatch({ type: "SET_MOOD", v: m })}>{m.toUpperCase()}</button>)}</div></Field><Field label="Color Wavefunction"><div className="mood-row">{["AUTO", "COOL", "WARM", "MONO", "VIVID"].map((p) => <button key={p} className={`mood-chip${state.style.palette === p ? " on" : ""}`} onClick={() => dispatch({ type: "SET_PALETTE", v: p })}>{p}</button>)}</div></Field></section>;
}

function Step3({ state, dispatch, onUpload }) {
  return <section className="step-panel on"><Header eyebrow="Neural Signatures · Step 03" a="Character" b="entanglement" body="До 3 нейросигнатур. Face Lock сохраняет визуальное ДНК героя во всех кадрах." /><div className="neural-list">{state.characters.map((hero, idx) => <div key={hero.id} className={`neural-card${hero.expanded ? " on" : ""}`}><div className="nc-head" onClick={() => dispatch({ type: "TOGGLE_HERO_EXP", id: hero.id })}><div className="nc-orb">{String(idx + 1).padStart(2, "0")}</div><div className="nc-title"><strong>{hero.name}</strong><span>{hero.role} · {hero.face_lock ? "FACE_LOCK" : "FREE"}</span></div><button className="nc-arr">⌄</button></div>{hero.expanded && <div className="nc-body"><Field label="Name"><input className="q-inp" value={hero.name} onChange={(e) => dispatch({ type: "PATCH_HERO", id: hero.id, patch: { name: e.target.value } })} /></Field><Field label="Role"><div className="role-grid">{["main", "friend", "villain", "guide"].map((r) => <button key={r} className={`role-b${hero.role === r ? " on" : ""}`} onClick={() => dispatch({ type: "PATCH_HERO", id: hero.id, patch: { role: r } })}>{r.toUpperCase()}</button>)}</div></Field><Field label="Appearance / Personality"><textarea className="q-inp" value={hero.description} placeholder="blue hoodie, brave but shy, big expressive eyes..." onChange={(e) => dispatch({ type: "PATCH_HERO", id: hero.id, patch: { description: e.target.value } })} /></Field><div className="entangle-row"><div><strong>Face Lock</strong><span>зафиксировать лицо / силуэт</span></div><button className={`ent-toggle${hero.face_lock ? " on" : ""}`} onClick={() => dispatch({ type: "PATCH_HERO", id: hero.id, patch: { face_lock: !hero.face_lock } })}><i /></button></div><Field label="Reference Signal"><label className={`ref-zone${hero.reference_preview ? " has" : ""}`}>{hero.reference_preview ? <img src={hero.reference_preview} alt="reference" /> : <span>UPLOAD REFERENCE IMAGE</span>}<input type="file" accept="image/*" onChange={(e) => onUpload(hero.id, e.target.files)} /></label></Field><Field label="Quantum Modifiers"><div className="q-mods">{MODS.map((m) => <button key={m} className={`q-mod${hero.modifiers.includes(m) ? " on" : ""}`} onClick={() => dispatch({ type: "TOGGLE_HERO_MOD", id: hero.id, m })}>{m}</button>)}</div></Field><button className="q-del" onClick={() => dispatch({ type: "REMOVE_HERO", id: hero.id })}>DELETE NODE</button></div>}</div>)}</div><button className="add-neural" onClick={() => dispatch({ type: "ADD_HERO" })}>⊕ INIT NEW CHARACTER NODE</button>{state.heroWarn && <div className="warn-line">maximum 3 neural signatures for this creator mode</div>}</section>;
}

function Step4({ state, dispatch, onAi }) {
  const words = state.script.text.trim() ? state.script.text.trim().split(/\s+/).length : 0;
  const acts = getActs(state.script.segments.length);
  return <section className="step-panel on"><Header eyebrow="Consciousness Stream · Step 04" a="Narrator" b="mind stream" body="Поток сознания диктора. Каждое предложение становится нейронным узлом в раскадровке." /><button className="mind-btn" onClick={onAi}>✦ GENERATE VIA QUANTUM MIND</button><Field label="Voice Waveform"><div className="v-row">{["neutral", "dramatic", "kids", "doc"].map((v) => <button key={v} className={`v-b${state.script.voice_style === v ? " on" : ""}`} onClick={() => dispatch({ type: "SET_VOICE_STYLE", v })}>{v.toUpperCase()}</button>)}</div></Field><Field label="Consciousness Text Stream"><textarea className="q-inp" rows={7} value={state.script.text} placeholder="// каждое предложение → синаптический узел..." onChange={(e) => dispatch({ type: "SET_SCRIPT_TEXT", v: e.target.value })} /></Field><div className="meta-strip"><div className="q-meta">WORDS: <span>{words}</span></div><div className="q-meta">NODES: <span>{state.script.segments.length}</span></div><div className="q-meta">~<span>{Math.round(words / 2.5) || 0}</span>s</div></div>{state.script.segments.length > 0 && <div className="seg-wrap"><div className="seg-lbl">synaptic node preview</div><div className="seg-list">{state.script.segments.slice(0, 12).map((seg, i) => <div className="seg-row" key={i}><span className="si-n">{String(i + 1).padStart(2, "0")}</span><span className="si-t">{seg}</span><span className={`si-a ${ACT_CLS[acts[i]]}`}>{acts[i]}</span></div>)}</div></div>}</section>;
}

function Step5({ state, dispatch }) {
  const selected = state.selectedSceneIdx != null ? state.scenes[state.selectedSceneIdx] : null;
  const regen = () => dispatch({ type: "BUILD_SCENES", scenes: buildScenesFromScript(state) });
  function patchScene(i, patch) { const next = { ...state.scenes[i], ...patch }; const image = buildImagePrompt(state, next, state.scenes); dispatch({ type: "PATCH_SCENE", i, patch: { ...patch, image_prompt_en: image, video_prompt_en: `ANIMATE CURRENT FRAME: ${image} Smooth expressive cartoon motion. Preserve exact continuity. No subtitles, no UI, no watermark.` } }); }
  return <section className="step-panel on"><Header eyebrow="Synaptic Map · Step 05" a="Storyboard" b="neural grid" body="Проверь сцены, камеру и characters in scene. Это основа для image/video prompts." /><div className="sb-toolbar"><div className="sb-data">NODES: <span>{state.scenes.length}</span> · <span>{state.scenes.reduce((a, s) => a + s.duration_sec, 0)}</span>s</div><button className="regen-q" onClick={regen}>↺ REWIRE</button></div>{selected && <div className="sc-det on"><div className="det-head"><div className="det-ttl">{selected.id} · {selected.act}</div><button className="det-x" onClick={() => dispatch({ type: "SELECT_SCENE", i: null })}>×</button></div><Field label="Voice Signal"><textarea className="q-inp" rows={2} value={selected.voice_line} onChange={(e) => patchScene(state.selectedSceneIdx, { voice_line: e.target.value })} /></Field><div className="q-label">Image Prompt Vector</div><div className="det-pmt">{selected.image_prompt_en}</div><div className="q-label">Camera · Photon Path</div><div className="cam-row">{CAMS.map((c) => <button key={c} className={`cam-b${selected.camera === c ? " on" : ""}`} onClick={() => patchScene(state.selectedSceneIdx, { camera: c })}>{c}</button>)}</div><div className="q-label">Entangled Nodes</div><div className="chars-row">{state.characters.length === 0 && <span className="empty-signal">// no nodes entangled</span>}{state.characters.map((h) => { const on = selected.characters_in_scene.includes(h.id); return <button key={h.id} className={`ch-ch${on ? " on" : ""}`} onClick={() => patchScene(state.selectedSceneIdx, { characters_in_scene: on ? selected.characters_in_scene.filter((x) => x !== h.id) : [...selected.characters_in_scene, h.id] })}>{h.name}</button>; })}</div></div>}<div className="synapse-grid">{state.scenes.length === 0 && <div className="no-signal">// NO_SIGNAL_INPUT → initialize step 04</div>}{state.scenes.map((sc, i) => <button key={sc.id} className={`syn-card${state.selectedSceneIdx === i ? " sel" : ""}`} onClick={() => dispatch({ type: "SELECT_SCENE", i })}><div className="syt"><div className="syt-field" /><div className="syt-interference" /><div className="syt-pulse" /><div className={`sy-act ${ACT_CLS[sc.act]}`}>{sc.act}</div><div className="sy-cam">{CAM_ICO[sc.camera] || "🎬"}</div><div className="sy-num">{sc.id}</div></div><div className="sy-info"><div className="sy-voice">{sc.voice_line}</div><div className="sy-meta"><span>{sc.camera}</span><span>{sc.duration_sec}s</span></div></div></button>)}</div></section>;
}

function Step6({ stats, jsonBodyRef, onCopy }) {
  return <section className="step-panel on"><Header eyebrow="Wave Collapse · Step 06" a="Quantum" b="collapse · export" body="Итоговый JSON проекта. Позже он будет отправляться в настоящий cartoonEngine NeuroCine." /><div className="exp-stats">{stats.map((s) => <div className="exp-s" key={s.l}><span className="exp-v" style={{ color: s.c }}>{s.v}</span><span className="exp-l">{s.l}</span></div>)}</div><div className="json-wrap"><div className="json-bar"><span className="json-fn">◈ cartoon_project.quantum.json</span><button className="json-cp" onClick={onCopy}>⊕ COPY</button></div><pre className="json-body" ref={jsonBodyRef} /></div></section>;
}

function Header({ eyebrow, a, b, body }) { return <><div className="q-eyebrow">{eyebrow}</div><h1 className="q-title"><span className="t-line t-glow">{a}</span><span className="t-line t-dim">{b}</span></h1><p className="q-body">{body}</p></>; }
function Field({ label, children }) { return <div className="q-field"><label className="q-label">{label}</label>{children}</div>; }
function getStats(state) { const data = buildExportJSON(state); return [{ v: data.storyboard.total_nodes, l: "NODES", c: "var(--cyan)" }, { v: data.characters.length, l: "AGENTS", c: "var(--purple)" }, { v: "$" + data.quantum_metadata.estimated_cost_usd, l: "COST", c: "var(--gold)" }]; }
