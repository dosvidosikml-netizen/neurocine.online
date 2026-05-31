"use client";

import { useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { STYLE_PRESETS, getStyleProfile } from "../../engine/directorEngine_v4";
import { splitScenesIntoParts, buildFlowCompactPartPrompt } from "../../engine/autoChainEngine";

const DEFAULT_SCRIPT = `В каждом здании есть этаж, которого не должно существовать.
Ночью, когда офис пустеет...
и последний лифт почему-то стоит открытым...
лучше не заходить внутрь.
Трое сотрудников задержались после работы.
На панели лифта появилась кнопка: -1.
Лифт начал ехать вниз слишком долго.
На дисплее появилась надпись: Не смотрите в угол.
Но они посмотрели.
В углу лифта стоял человек.
Когда двери открылись, перед ними оказался тот же офис.
Но что-то было неправильно.
Коридоры становились длиннее.
На старой фотографии были они сами.
Подпись гласила: Пропали без вести. 2006 год.
Вдалеке снова появился тот человек.
Лифт забирает только тех, кто уже должен был исчезнуть.
Когда двери лифта наконец открылись, внутри не было кабины.
Только чёрная пустота.
Внутри стояла его копия.
Она улыбнулась и сказала: Ты уже нажимал эту кнопку.
Лифт на минус первый.
Следующий этаж... твой.`;

const MIN_TOTAL_DURATION = 2;
const MAX_TOTAL_DURATION = 600;
const MIN_FRAME_SECONDS = 2;
const MAX_FRAME_SECONDS = 10;

const QUICK_PRESETS = [
  { seconds: 60, label: "60с" },
  { seconds: 87, label: "87с" },
  { seconds: 120, label: "2м" },
  { seconds: 180, label: "3м" },
  { seconds: 300, label: "5м" },
  { seconds: 600, label: "10м" },
];

function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function splitScriptBeats(script = "") {
  return String(script || "")
    .split(/\n+|(?<=[.!?…])\s+/)
    .map(cleanText)
    .filter(Boolean);
}

function estimateAutoFrameCount(script, duration, frameSeconds) {
  const safeDuration = clampNumber(duration, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 60);
  const safeFrameSeconds = clampNumber(frameSeconds, MIN_FRAME_SECONDS, MAX_FRAME_SECONDS, 3);
  const beatCount = splitScriptBeats(script).length;
  const preferredFrames = Math.max(1, Math.round(safeDuration / safeFrameSeconds));
  const minFrames = Math.max(1, Math.ceil(safeDuration / MAX_FRAME_SECONDS));
  const maxFrames = Math.max(minFrames, Math.floor(safeDuration / MIN_FRAME_SECONDS));
  const scriptAware = beatCount > 0 ? Math.min(beatCount, preferredFrames) : preferredFrames;
  return clampNumber(scriptAware, minFrames, maxFrames, preferredFrames);
}

function distributeDurations(totalDuration, totalFrames, preferredSeconds) {
  const frames = Math.max(1, Math.round(Number(totalFrames) || 1));
  const preferred = clampNumber(preferredSeconds, MIN_FRAME_SECONDS, MAX_FRAME_SECONDS, 3);
  const minTotal = frames * MIN_FRAME_SECONDS;
  const maxTotal = frames * MAX_FRAME_SECONDS;
  const target = clampNumber(totalDuration, minTotal, maxTotal, frames * preferred);
  const durations = Array.from({ length: frames }, () => preferred);
  let sum = durations.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum !== target && guard < 5000) {
    guard += 1;
    if (sum < target) {
      const idx = durations.findIndex((x) => x < MAX_FRAME_SECONDS);
      if (idx === -1) break;
      durations[idx] += 1;
      sum += 1;
    } else {
      const idx = durations.findIndex((x) => x > MIN_FRAME_SECONDS);
      if (idx === -1) break;
      durations[idx] -= 1;
      sum -= 1;
    }
  }
  return durations;
}

function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  if (value < 60) return `${value}с`;
  const m = Math.floor(value / 60);
  const s = value % 60;
  return s ? `${m}м ${s}с` : `${m}м`;
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function frameId(n) {
  return `frame_${String(n).padStart(2, "0")}`;
}

function frameLabel(scene, index = 0) {
  const n = Number(String(scene?.id || "").match(/\d+/)?.[0] || index + 1);
  return `F${String(n).padStart(2, "0")}`;
}

function formatDialogueLine(line) {
  if (typeof line === "string") return line;
  if (!line || typeof line !== "object") return "";
  const speaker = line.speaker || line.character || "";
  const voice = line.voice_id ? ` [${line.voice_id}]` : "";
  const text = line.text || line.line || line.dialogue || "";
  const delivery = line.delivery ? ` (${line.delivery})` : "";
  return [speaker ? `${speaker}${voice}` : "", text ? `${text}${delivery}` : ""].filter(Boolean).join(": ");
}

function lockLine(item, fallback = "Lock") {
  if (!item || typeof item !== "object") return "";
  const id = item.id || item.role || item.character || item.name || fallback;
  return [
    id,
    item.visual_identity || item.must_appear_as || item.description || item.voice_profile,
    item.wardrobe || item.delivery_arc,
    item.forbidden_changes ? `forbidden: ${item.forbidden_changes}` : "",
  ].filter(Boolean).map(cleanText).join(" — ");
}

function buildLocalTrailerStoryboard({ script, duration, aspectRatio, stylePreset, target, targetFrames, frameSeconds, timingMode }) {
  const lines = splitScriptBeats(script);
  const totalFrames = Math.max(1, Math.round(Number(targetFrames) || estimateAutoFrameCount(script, duration, frameSeconds)));
  const frameDurations = distributeDurations(duration, totalFrames, frameSeconds);
  const style = STYLE_PRESETS[stylePreset]?.lock || STYLE_PRESETS.cinematic.lock;
  let runningStart = 0;
  const scenes = Array.from({ length: totalFrames }, (_, i) => {
    const source = lines[i] || lines[Math.min(lines.length - 1, Math.floor((i / totalFrames) * Math.max(1, lines.length)))] || "Trailer beat";
    const isDialogue = /сказал|сказала|ш[её]пот|говорит|крик|крич/i.test(source);
    const dialogueText = source.match(/(?:сказал(?:а)?|говорит|ш[её]пот[^:]*|крик[^:]*)[:—-]\s*(.+)$/i)?.[1] || "";
    const sceneDuration = frameDurations[i] || frameSeconds || 3;
    const sceneStart = runningStart;
    runningStart += sceneDuration;
    return {
      id: frameId(i + 1),
      start: sceneStart,
      duration: sceneDuration,
      description_ru: source,
      script_line_ru: source,
      source_of_truth: "script_line",
      image_prompt_en: `SCENE PRIMARY FOCUS: locked horror trailer frame, source line: ${source}. Same office elevator film, same cast identity, same location design. ASPECT RATIO: ${aspectRatio}`,
      video_prompt_en: `ANIMATE CURRENT FRAME: SOURCE OF TRUTH: script line. Script: "${source}". Preserve uploaded frame. Animate only the described action. No new characters, locations or objects. Camera: restrained handheld. SFX: scene-matched ambience. Photorealistic 24fps. ${sceneDuration}s --motion 4`,
      vo_ru: source,
      dialogue: isDialogue && dialogueText ? [{ speaker: "Offscreen voice", voice_id: "voice_04", text: dialogueText, delivery: "low supernatural whisper" }] : [],
      on_screen_text: /надпись|подпись|экран|диспле|название/i.test(source) ? [source.replace(/^.*(?:надпись|подпись|дисплее?)[:—-]?\s*/i, "").trim()].filter(Boolean) : [],
      blocking: "Actors and camera positions continue from the same locked trailer geography.",
      shot_role: i < 3 ? "establishing" : i > totalFrames - 4 ? "final_sting" : i % 5 === 0 ? "reveal" : i % 3 === 0 ? "insert" : "trailer_beat",
      sfx: "fluorescent flicker, elevator metal vibration, restrained room tone",
      camera: i % 3 === 0 ? "close-up insert" : "handheld medium shot",
      transition: "cut",
      cut_energy: i > totalFrames * 0.7 ? "high" : i < 4 ? "low" : "medium",
      continuity_note: "Keep same film cast, wardrobe, location, lighting and production design.",
      safety_note: "Trailer mode safe visual framing",
      target,
    };
  });

  return {
    project_name: "Trailer Storyboard Local Preview",
    language: "ru",
    format: "trailer_storyboard",
    aspect_ratio: aspectRatio,
    total_duration: frameDurations.reduce((a, b) => a + b, 0),
    global_style_lock: style,
    global_video_lock: "same film trailer continuity, locked cast, locked elevator-office geography, no redesign between PART grids",
    character_lock: [
      { name: "Employee group", description: "same three office employees throughout the trailer, tired late-night office look, no actor redesign" },
      { name: "Corner man", description: "same silent man from elevator corner, motionless presence, no redesign" },
    ],
    voice_lock: [
      { character: "Narrator", voice_id: "voice_01", voice_profile: "low tense trailer narration", delivery_arc: "controlled dread to final whisper" },
      { character: "Offscreen voice", voice_id: "voice_04", voice_profile: "near-whisper supernatural voice", delivery_arc: "appears only for curse/rule lines" },
    ],
    cast_lock: [
      { id: "CHAR_01", role: "three employees", visual_identity: "same three late-night office employees from first appearance to disappearance", wardrobe: "office clothes, tired after-work look", forbidden_changes: "no new actors, no age drift, no costume redesign" },
      { id: "CHAR_02", role: "corner man", visual_identity: "same silent man in elevator corner and corridor distance", wardrobe: "dark indistinct office-era clothing", forbidden_changes: "no monster redesign, no different face/body each PART" },
    ],
    location_lock: {
      main: "old empty office, impossible elevator, long fluorescent corridors",
      materials: "dirty metal elevator, glass partitions, green-grey office walls, worn floors",
      lighting: "night office fluorescent light, red elevator light, sections going dark",
      spatial_rules: "elevator, corridor, glass office and photo wall remain one connected impossible office geography",
      forbidden: "no luxury building, no daylight modern lobby, no new unrelated location",
    },
    style_bible: style,
    grid_continuity: "PART 1 establishes cast/location/style. PART 2+ continues same film using cast_lock, location_lock, style_bible and previous PART visual DNA. Any final PART size is valid; never add filler frames just to make a perfect grid.",
    scenes,
    export_meta: { mode: "trailer", target, trailer_mode: true, local_preview: true, target_scene_count: totalFrames, frame_seconds: frameSeconds, timing_mode: timingMode },
  };
}

async function getAuthToken() {
  if (!isSupabaseConfigured || !supabase?.auth?.getSession) return "";
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  } catch {
    return "";
  }
}

function parseSseBlock(block) {
  const event = block.match(/^event:\s*(\S+)/m)?.[1] || "message";
  const dataRaw = block.match(/^data:\s*(.+)$/m)?.[1] || "{}";
  try {
    return { event, data: JSON.parse(dataRaw) };
  } catch {
    return { event, data: {} };
  }
}

export default function TrailerStoryboardPage() {
  const [projectName, setProjectName] = useState("Лифт на минус первый");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [duration, setDuration] = useState(87);
  const [frameSeconds, setFrameSeconds] = useState(3);
  const [autoTiming, setAutoTiming] = useState(true);
  const [customFrameCount, setCustomFrameCount] = useState(27);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [target, setTarget] = useState("grok");
  const [stylePreset, setStylePreset] = useState("mysticHorror");
  const [partSize, setPartSize] = useState(4);
  const [activePart, setActivePart] = useState(0);
  const [storyboard, setStoryboard] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const styleProfile = useMemo(() => getStyleProfile("film", stylePreset), [stylePreset]);
  const scenes = useMemo(() => (Array.isArray(storyboard?.scenes) ? storyboard.scenes : []), [storyboard]);
  const parts = useMemo(() => splitScenesIntoParts(scenes, partSize), [scenes, partSize]);
  const safePart = Math.max(0, Math.min(activePart, Math.max(0, parts.length - 1)));
  const partScenes = useMemo(() => parts[safePart] || [], [parts, safePart]);
  const selectedPrompt = useMemo(() => {
    if (!storyboard || !partScenes.length) return "";
    return buildFlowCompactPartPrompt({
      storyboard,
      styleProfile,
      partScenes,
      partIndex: safePart,
      totalScenes: scenes.length,
      partSize,
      chainMode: "worldHero",
      strictLevel: "maximum",
      referenceMode: safePart === 0 ? "heroOnly" : "heroAndPrevious",
      appearanceMode: "full",
    });
  }, [storyboard, styleProfile, partScenes, safePart, scenes.length, partSize]);
  const maxManualFrames = Math.max(1, Math.floor(MAX_TOTAL_DURATION / Math.max(1, Number(frameSeconds) || 3)));
  const manualFrames = clampNumber(customFrameCount, 1, maxManualFrames, 27);
  const autoFrames = estimateAutoFrameCount(script, duration, frameSeconds);
  const expectedFrames = autoTiming ? autoFrames : manualFrames;
  const effectiveDuration = autoTiming
    ? clampNumber(duration, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 87)
    : clampNumber(manualFrames * frameSeconds, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION, 81);
  const timingMode = autoTiming ? "auto" : "manual";

  async function generateTrailer() {
    setBusy(true);
    setError("");
    setStatus("Preparing trailer storyboard request...");
    setStoryboard(null);
    setActivePart(0);

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          project_name: projectName,
          script,
          duration: effectiveDuration,
          target_scene_count: expectedFrames,
          frame_seconds: frameSeconds,
          timing_mode: timingMode,
          auto_analyze_script: autoTiming,
          aspect_ratio: aspectRatio,
          style: stylePreset,
          mode: "trailer",
          target,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok && !contentType.includes("text/event-stream")) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Storyboard API failed (${res.status})`);
      }

      if (!res.body || !contentType.includes("text/event-stream")) {
        const payload = await res.json();
        if (!payload.storyboard) throw new Error(payload.error || "No storyboard returned");
        setStoryboard(payload.storyboard);
        setStatus(`Done: ${payload.storyboard.scenes?.length || 0} frames`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          if (!block.trim()) continue;
          const { event, data } = parseSseBlock(block);
          if (event === "done" && data.storyboard) {
            setStoryboard(data.storyboard);
            setStatus(`Done: ${data.storyboard.scenes?.length || 0} frames`);
          } else if (event === "error" || event === "chunk_failed") {
            throw new Error(data.error || "Trailer generation failed");
          } else if (data.message) {
            setStatus(data.message);
          } else if (event === "chunk_started") {
            setStatus(`Generating chunk ${data.chunk_number}/${data.total_chunks}...`);
          } else if (event === "chunk_completed") {
            setStatus(`Chunk ${data.chunk_number}/${data.total_chunks} complete`);
          } else {
            setStatus(event);
          }
        }
      }
    } catch (e) {
      setError(e.message || "Trailer generation failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function buildLocalPreview() {
    setError("");
    setBusy(false);
    setActivePart(0);
    const sb = buildLocalTrailerStoryboard({ script, duration: effectiveDuration, aspectRatio, stylePreset, target, targetFrames: expectedFrames, frameSeconds, timingMode });
    setStoryboard(sb);
    setStatus(`Local preview: ${sb.scenes.length} frames, ${splitScenesIntoParts(sb.scenes, partSize).length} PARTS`);
  }

  async function copyPrompt() {
    if (!selectedPrompt) return;
    await navigator.clipboard.writeText(selectedPrompt);
    setStatus(`PART ${safePart + 1} prompt copied`);
  }

  function downloadJson() {
    if (!storyboard) return;
    const blob = new Blob([JSON.stringify(storyboard, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "trailer-storyboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="trailer-page">
      <style jsx>{`
        .trailer-page{min-height:100vh;background:#090b10;color:#f7f3ea;padding:18px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .wrap{max-width:1280px;margin:0 auto;display:grid;gap:16px}
        .hero{display:grid;gap:12px;padding:18px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(135deg,rgba(180,31,54,.2),rgba(20,24,34,.95));border-radius:10px}
        .kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ffb3bd;font-weight:900}
        h1{margin:0;font-size:clamp(28px,6vw,62px);line-height:.95;letter-spacing:0}
        .hero p{margin:0;max-width:820px;color:rgba(247,243,234,.72);line-height:1.55}
        .hero-links{display:flex;gap:10px;flex-wrap:wrap}
        .hero-links a{border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:10px 12px;color:#f7f3ea;text-decoration:none;font-size:13px;font-weight:900;background:rgba(255,255,255,.055)}
        .grid{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:16px;align-items:start}
        .panel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);border-radius:8px;padding:14px;display:grid;gap:12px}
        .panel h2{margin:0;font-size:16px}
        label{display:grid;gap:6px;font-size:12px;color:rgba(247,243,234,.66);font-weight:800;text-transform:uppercase;letter-spacing:.06em}
        input,textarea,select{width:100%;box-sizing:border-box;background:#10131b;color:#f7f3ea;border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:11px;font:inherit}
        input[type="range"]{accent-color:#e3344f;padding:0}
        input[type="checkbox"]{width:auto}
        textarea{min-height:320px;resize:vertical;line-height:1.45}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .range-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .range-head strong{color:#fff;font-size:13px;letter-spacing:0;text-transform:none}
        .quick{display:flex;gap:7px;flex-wrap:wrap}
        .quick button{padding:7px 9px;font-size:11px;background:#151a24}
        .check{display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);border-radius:8px;padding:10px;color:#f7f3ea;text-transform:none;letter-spacing:0}
        .buttons{display:flex;gap:10px;flex-wrap:wrap}
        button{border:0;border-radius:6px;padding:11px 13px;background:#242936;color:#f7f3ea;font-weight:900;cursor:pointer}
        button.primary{background:#e3344f;color:white}
        button:disabled{opacity:.55;cursor:not-allowed}
        .pills{display:flex;gap:8px;flex-wrap:wrap}
        .pill{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.04);padding:8px 10px;border-radius:999px;font-size:12px}
        .pill.active{border-color:#e3344f;background:rgba(227,52,79,.18);color:#ffd6dc}
        .status{font-size:13px;color:#9ee8c9}.error{font-size:13px;color:#ff9aa8}
        .parts{display:flex;gap:8px;flex-wrap:wrap}.part{border:1px solid rgba(255,255,255,.14);background:#11151f}.part.active{background:#e3344f}
        .locks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .lockbox{border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);border-radius:8px;padding:11px;display:grid;gap:8px}
        .lockbox h3{margin:0;font-size:12px;text-transform:uppercase;color:#ffb3bd}
        .lockbox div,.frame{font-size:13px;color:rgba(247,243,234,.76);line-height:1.45}
        .frames{display:grid;gap:8px}.frame{border-left:3px solid #e3344f;background:rgba(255,255,255,.04);padding:10px;border-radius:6px}
        .mono{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.45;max-height:420px;overflow:auto}
        @media(max-width:900px){.grid{grid-template-columns:1fr}.row,.locks{grid-template-columns:1fr}.trailer-page{padding:10px}textarea{min-height:260px}}
      `}</style>

      <div className="wrap">
        <section className="hero">
          <div className="kicker">NeuroCine Trailer Storyboard</div>
          <h1>Отдельный трейлерный storyboard</h1>
          <p>Новая рабочая зона: полный frame plan, cast lock, location lock, style bible, voice lock и PART prompts. Старый storyboard здесь не используется.</p>
          <div className="pills">
            <span className="pill active">mode: trailer</span>
            <span className="pill">odd frames supported</span>
            <span className="pill">long format up to 10m</span>
            <span className="pill">Grok/Veo prompt packs</span>
          </div>
          <div className="hero-links">
            <a href="/studio">Studio menu</a>
            <a href="/storyboard">Classic storyboard</a>
          </div>
        </section>

        <section className="grid">
          <div className="panel">
            <h2>01 · Script Setup</h2>
            <label>Project name<input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
            <label>Scenario<textarea value={script} onChange={(e) => setScript(e.target.value)} /></label>
            <label className="check">
              <input type="checkbox" checked={autoTiming} onChange={(e) => setAutoTiming(e.target.checked)} />
              Авто: ИИ сканирует сценарий и сам раскладывает его на биты
            </label>
            <label>
              <span className="range-head"><span>Total duration</span><strong>{formatDuration(effectiveDuration)}</strong></span>
              <input type="range" min={MIN_TOTAL_DURATION} max={MAX_TOTAL_DURATION} step="1" value={duration} disabled={!autoTiming} onChange={(e) => setDuration(Number(e.target.value))} />
              <div className="quick">
                {QUICK_PRESETS.map((x) => <button key={x.seconds} type="button" disabled={!autoTiming} onClick={() => setDuration(x.seconds)}>{x.label}</button>)}
              </div>
            </label>
            <label>
              <span className="range-head"><span>Seconds per frame</span><strong>{frameSeconds}с</strong></span>
              <input type="range" min={MIN_FRAME_SECONDS} max={MAX_FRAME_SECONDS} step="1" value={frameSeconds} onChange={(e) => setFrameSeconds(Number(e.target.value))} />
            </label>
            <div className="row">
              <label>Custom frames<input type="number" min="1" max={maxManualFrames} value={manualFrames} disabled={autoTiming} onChange={(e) => setCustomFrameCount(clampNumber(e.target.value, 1, maxManualFrames, manualFrames))} /></label>
              <label>Aspect<select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option></select></label>
            </div>
            <div className="row">
              <label>Target<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="grok">Grok</option><option value="veo3">Veo 3</option></select></label>
              <label>PART size<select value={partSize} onChange={(e) => { setPartSize(Number(e.target.value)); setActivePart(0); }}><option value={4}>4 frames</option><option value={6}>6 frames</option><option value={8}>8 frames</option></select></label>
            </div>
            <label>Style<select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}>{Object.entries(STYLE_PRESETS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</select></label>
            <div className="buttons">
              <button className="primary" disabled={busy || script.trim().length < 10} onClick={generateTrailer}>{busy ? "Generating..." : "Generate AI Trailer JSON"}</button>
              <button disabled={busy || script.trim().length < 10} onClick={buildLocalPreview}>Local test plan</button>
              <button disabled={!storyboard} onClick={downloadJson}>Download JSON</button>
            </div>
            <div className="pills">
              <span className="pill active">{expectedFrames} frames expected</span>
              <span className="pill">{formatDuration(effectiveDuration)} total</span>
              <span className="pill">{timingMode}</span>
              <span className="pill">{parts.length || 0} PARTS ready</span>
              <span className="pill">{partSize} per PART</span>
            </div>
            {status && <div className="status">{status}</div>}
            {error && <div className="error">{error}</div>}
          </div>

          <div className="panel">
            <h2>02 · Trailer Structure</h2>
            {!storyboard ? (
              <div className="frame">Generate AI Trailer JSON or use Local test plan to verify custom frames, odd counts and long-format PART behavior.</div>
            ) : (
              <>
                <div className="pills">
                  <span className="pill active">{storyboard.scenes?.length || 0} frames</span>
                  <span className="pill">{storyboard.total_duration || 0}s</span>
                  <span className="pill">{storyboard.export_meta?.target || target}</span>
                  <span className="pill">{storyboard.export_meta?.local_preview ? "local preview" : "AI storyboard"}</span>
                </div>
                <div className="locks">
                  <div className="lockbox"><h3>Cast Lock</h3>{(storyboard.cast_lock || []).map((x, i) => <div key={i}>{lockLine(x, `Cast ${i + 1}`)}</div>)}</div>
                  <div className="lockbox"><h3>Location Lock</h3><div>{Object.entries(storyboard.location_lock || {}).map(([k, v]) => v ? `${k}: ${v}` : "").filter(Boolean).join("; ") || "No location lock"}</div></div>
                  <div className="lockbox"><h3>Voice Lock</h3>{(storyboard.voice_lock || []).map((x, i) => <div key={i}>{lockLine(x, `Voice ${i + 1}`)}</div>)}</div>
                  <div className="lockbox"><h3>Grid Continuity</h3><div>{storyboard.grid_continuity || "No grid continuity"}</div></div>
                </div>

                <div>
                  <h2>03 · PARTS</h2>
                  <div className="parts">
                    {parts.map((part, i) => (
                      <button key={i} className={`part${safePart === i ? " active" : ""}`} onClick={() => setActivePart(i)}>
                        PART {i + 1} · {frameLabel(part[0], 0)}-{frameLabel(part[part.length - 1], 0)} · {part.length}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="frames">
                  {partScenes.map((scene, i) => (
                    <div className="frame" key={scene.id || i}>
                      <strong>{frameLabel(scene, i)} · {scene.shot_role || scene.beat_type || "frame"}</strong><br />
                      Source: {scene.script_line_ru || scene.vo_ru || scene.description_ru}<br />
                      {Array.isArray(scene.dialogue) && scene.dialogue.length > 0 ? <>Dialogue: {scene.dialogue.map(formatDialogueLine).join(" / ")}<br /></> : null}
                      SFX: {scene.sfx || ""}
                    </div>
                  ))}
                </div>

                <div className="panel" style={{ padding: 0, border: 0, background: "transparent" }}>
                  <div className="buttons"><button disabled={!selectedPrompt} onClick={copyPrompt}>Copy selected PART prompt</button></div>
                  <div className="mono">{selectedPrompt || "Select/generate PART to see prompt."}</div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
