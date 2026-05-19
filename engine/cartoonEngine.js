// engine/cartoonEngine.js
// NeuroCine Cartoon Brain v2
// Server-side helpers: script, storyboard, AutoChain, prompt builders, export, snapshot.

export const CARTOON_PIPELINE_VERSION = "cartoon_creator_v2";

export const CARTOON_STYLE_LOCKS = {
  anime:         "anime cel-shaded cartoon, expressive faces, clean linework, vibrant colors, cinematic composition",
  pixar:         "premium 3D cartoon film look, warm volumetric lighting, expressive characters, soft cinematic render",
  flat:          "2D flat cartoon, bold outlines, clean geometric shapes, bright readable colors",
  cinema:        "cinematic animated film, dramatic lighting, emotional framing, high production value",
  pixel:         "16-bit pixel art cartoon, limited palette, crisp silhouettes, retro game animation aesthetic",
  custom:        "custom cartoon style supplied by user",
  // Extended — matches QuantumCartoonCreatorV2 STYLE_PRESETS
  pixar3d:       "premium 3D family cartoon, soft rounded forms, fluffy materials, expressive eyes, warm studio lighting",
  cinematic:     "cinematic animated film look, dramatic key light, realistic atmosphere, high production value",
  storybook_anime:"hand-drawn fairytale anime mood, watercolor backgrounds, gentle nature details, magical atmosphere",
  watercolor:    "soft watercolor cartoon, paper texture, pastel washes, gentle outlines",
  comic:         "comic book cartoon, bold ink outlines, halftone texture, dynamic panels",
  kids_book:     "children picture book illustration, cozy soft colors, simple friendly shapes",
  flat_design:   "flat vector cartoon design, clean geometric forms, bold simple colors",
  clay:          "claymation cartoon, handmade plasticine texture, rounded sculpted characters",
  cyberpunk:     "cyberpunk animated look, neon cyan magenta lights, glowing tech details",
  dark_fantasy:  "dark fantasy animation, moody fog, mystical glow, dramatic shadows",
  anime_manga:   "anime manga cartoon, sharp expressive eyes, cel shading, clean line art",
};

const MOOD_SFX = {
  light:   "playful cartoon ambience, soft musical notes",
  dark:    "mysterious cartoon tension, low moody drone",
  epic:    "epic cartoon fanfare, dramatic percussion",
  cute:    "cheerful cartoon sounds, soft bells and chimes",
  mystery: "eerie cartoon atmosphere, subtle whisper ambience",
};

function cleanText(v = "") { return String(v || "").replace(/\s+/g, " ").trim(); }

// ─── SAFE JSON PARSE ──────────────────────────────────────────────────────────

export function safeJsonParse(raw = "") {
  const text = String(raw || "").trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(text);
}

// ─── NORMALISE INPUT ─────────────────────────────────────────────────────────

export function normalizeCartoonProject(input = {}) {
  const concept = input.concept || input.project || input || {};
  const style   = input.style   || concept.style   || {};
  const chain   = input.chain   || concept.chain   || {};
  const settings = input.settings || {};
  const characters = Array.isArray(input.characters) ? input.characters
    : Array.isArray(input.heroes) ? input.heroes : [];
  const script    = input.script    || {};
  const storyboard = input.storyboard || {};

  return {
    project: (() => {
      const rawDuration = Number(concept.duration_sec || concept.duration || input.timing?.duration_sec || input.duration_sec || 60);
      const rawFrameSec = Number(concept.frame_duration_sec || input.timing?.frame_duration_sec || input.frame_duration_sec || 3);
      const safeDuration  = Math.max(15, Math.min(600, rawDuration));
      const safeFrameSec  = Math.max(2, Math.min(4, rawFrameSec));
      const targetScenes  = Number(concept.target_scene_count || input.timing?.target_scene_count || input.target_scene_count) || Math.round(safeDuration / safeFrameSec);
      return {
      id:           String(concept.id   || input.id   || `cartoon_${Date.now()}`),
      title:        String(concept.title || input.title || "Untitled Cartoon").slice(0, 160),
      created_at:   concept.created_at  || new Date().toISOString(),
      format:       String(concept.format || input.format || "shorts"),
      duration_sec: safeDuration,
      frame_duration_sec: safeFrameSec,
      target_scene_count: Math.max(1, targetScenes),
      aspect_ratio: String(concept.aspect_ratio  || concept.aspect  || input.aspect_ratio || "9:16"),
      language:     String(concept.language || concept.lang || input.language || "ru"),
      timing: { duration_sec: safeDuration, frame_duration_sec: safeFrameSec, target_scene_count: Math.max(1, targetScenes) },
      style: {
        preset:        String(style.preset || style.style || input.stylePreset || "anime"),
        custom_prompt: style.custom_prompt || style.custom || input.custom_prompt || null,
        mood:          String(style.mood   || input.mood   || "light"),
        palette:       String(style.palette || input.palette || "AUTO"),
        dna:           style.dna || null,
      },
      chain: {
        mode:           String(chain.mode          || input.chainMode      || "styleDNA"),
        strictLevel:    String(chain.strictLevel    || input.strictLevel    || "hard"),
        referenceMode:  String(chain.referenceMode  || input.referenceMode  || "heroAndPrevious"),
        appearanceMode: String(chain.appearanceMode || input.appearanceMode || "full"),
        partSize:       Number(chain.partSize       || input.partSize       || 4),
      },
    };
    })(),
    characters: characters.slice(0, 3).map((c, i) => ({
      id:                  String(c.id   || `char_${i + 1}`),
      name:                String(c.name || `Hero ${i + 1}`).slice(0, 80),
      role:                String(c.role || "main"),
      description:         String(c.description || c.prompt || "").slice(0, 1200),
      face_lock:           c.face_lock !== false,
      face_lock_description: String(c.face_lock_description || c.charFaceLock || "").slice(0, 400),
      modifiers:           Array.isArray(c.modifiers) ? c.modifiers.slice(0, 12) : [],
      reference_url:       c.reference_url || null,
    })),
    script: {
      full_text:   String(script.full_text || script.text || input.scriptText || ""),
      voice_style: String(script.voice_style || input.voice || "neutral"),
      language:    String(script.language || concept.language || input.language || "ru"),
    },
    storyboard: {
      scenes: Array.isArray(storyboard.scenes) ? storyboard.scenes
        : Array.isArray(input.scenes) ? input.scenes : [],
    },
    settings: {
      voToggle:         settings.voToggle !== false && input.voToggle !== false,
      videoConsistency: String(settings.videoConsistency || input.videoConsistency || "ultra"),
    },
  };
}

// ─── SCRIPT HELPERS ──────────────────────────────────────────────────────────

export function splitCartoonScript(text = "") {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 24);
}

export function inferAct(index, total) {
  const p = index / Math.max(1, total);
  if (p < 0.12) return "HOOK";
  if (p < 0.55) return "BUILD";
  if (p < 0.86) return "CLIMAX";
  return "OUTRO";
}

// ─── CHARACTER & CONTINUITY BUILDERS ─────────────────────────────────────────

export function buildHeroAnchor(characters = []) {
  if (!characters.length) return "No locked character supplied.";
  return characters.map((c) => {
    const mods    = Array.isArray(c.modifiers) && c.modifiers.length ? ` Modifiers: ${c.modifiers.join(", ")}.` : "";
    const faceDsc = c.face_lock_description ? ` Face reference: ${c.face_lock_description}.` : "";
    const lock    = c.face_lock !== false ? " FACE LOCK ON: preserve face geometry, silhouette, outfit, proportions and color DNA across every scene." : "";
    return `${c.name} (${c.role || "main"}): ${c.description || "cartoon character"}.${mods}${faceDsc}${lock}`;
  }).join("\n");
}

export function buildCartoonContinuityContract(project) {
  const style   = project.project.style || {};
  const preset  = style.preset || "anime";
  const styleDNA = style.dna || (preset === "custom" ? style.custom_prompt || CARTOON_STYLE_LOCKS.custom : CARTOON_STYLE_LOCKS[preset] || CARTOON_STYLE_LOCKS.anime);
  return [
    "CARTOON CONTINUITY CONTRACT:",
    `Style Lock: ${styleDNA}.`,
    `Mood: ${style.mood || "light"}. Palette: ${style.palette || "AUTO"}.`,
    `Aspect ratio: ${project.project.aspect_ratio || "9:16"}.`,
    "Every frame must preserve character identity, readable silhouettes, outfit, face proportions, color DNA and world continuity.",
    "No subtitles, no UI, no watermark, no logo, no random text inside image/video frames.",
    "Family-safe cartoon action unless user requests darker mood. Avoid graphic injury.",
    buildHeroAnchor(project.characters),
  ].filter(Boolean).join("\n");
}

// ─── VEO3 PROMPT BUILDERS (server-side, optimised) ───────────────────────────

function resolveStyleDNA(style = {}) {
  const preset = style.preset || "anime";
  return style.dna
    || (preset === "custom" ? style.custom_prompt || CARTOON_STYLE_LOCKS.custom : CARTOON_STYLE_LOCKS[preset] || CARTOON_STYLE_LOCKS.anime);
}

function resolveSFX(scene = {}, mood = "light") {
  return cleanText(scene.sfx || scene.audio || MOOD_SFX[mood] || MOOD_SFX.light);
}

export function buildCartoonImagePromptVeo3({ scene = {}, project = {}, characters = [] } = {}) {
  const style   = project.style || project.project?.style || {};
  const styleDNA = resolveStyleDNA(style);
  const mood    = style.mood    || "light";
  const palette = style.palette || "AUTO";
  const aspect  = project.aspect_ratio || project.project?.aspect_ratio || "9:16";
  const primaryChar = characters[0];
  const charRef = primaryChar
    ? `Character: ${primaryChar.name}. ${primaryChar.description || ""}. Face Lock: preserve face, silhouette, outfit, color DNA.`
    : "";
  const sceneDesc = cleanText(
    String(scene.image_prompt_en || scene.voice_line || "")
      .replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "")
  );
  const camera = cleanText(scene.camera || "Medium Shot");

  return `SCENE PRIMARY FOCUS: ${[
    sceneDesc,
    `STYLE: ${styleDNA}. Mood: ${mood}. Palette: ${palette}.`,
    charRef,
    `Camera: ${camera}.`,
    `Format: ${aspect} cartoon frame. Clean composition, strong focal point, no text, no watermark.`,
  ].filter(Boolean).join(" ")}`;
}

export function buildCartoonVideoPromptVeo3({
  scene = {}, project = {}, characters = [],
  includeVo = true, consistency = "ultra", duration = 4,
} = {}) {
  const style   = project.style || project.project?.style || {};
  const styleDNA = resolveStyleDNA(style);
  const mood    = style.mood    || "light";
  const palette = style.palette || "AUTO";
  const primaryChar = characters[0];
  const charLock = primaryChar
    ? `${primaryChar.name}: preserve face, silhouette, outfit, proportions, color DNA.`
    : "";
  const action = cleanText(
    String(scene.voice_line || scene.action || "subtle expressive cartoon motion")
      .split(/(?<=[.!?])/)[0]
  ) || "subtle expressive cartoon motion";
  const camera = cleanText(scene.camera || "Medium Shot");
  const sfx    = resolveSFX(scene, mood);
  const voLine = includeVo && scene.voice_line ? `VO: ${scene.voice_line}.` : "";
  const continuityLine = consistency === "ultra"
    ? "Ultra continuity: same face, outfit, color DNA, style across all scenes."
    : "Keep visual continuity.";

  return `ANIMATE CURRENT FRAME: ${[
    `STYLE: ${styleDNA}. Mood: ${mood}. Palette: ${palette}.`,
    charLock,
    `Action: ${action}.`,
    `Camera: ${camera}.`,
    `SFX: ${sfx}.`,
    voLine,
    continuityLine,
    "No subtitles, no UI, no watermark.",
    `${duration}s smooth cartoon motion.`,
  ].filter(Boolean).join(" ")}`;
}

// ─── AUTO-CHAIN (server-side) ─────────────────────────────────────────────────

export function splitCartoonScenesIntoParts(scenes = [], partSize = 4) {
  const size  = Math.max(1, Number(partSize) || 4);
  const parts = [];
  for (let i = 0; i < scenes.length; i += size) parts.push(scenes.slice(i, i + size));
  return parts;
}

export function buildCartoonAutoChainPartPrompt({
  project = {}, characters = [], scenes = [], partScenes = [], partIndex = 0,
  partSize = 4, chainMode = "styleDNA", strictLevel = "hard",
  referenceMode = "heroAndPrevious", appearanceMode = "full",
  heroAnchorUploaded = false,
} = {}) {
  if (!partScenes.length) return "";
  const style    = project.style || project.project?.style || {};
  const styleDNA = resolveStyleDNA(style);
  const mood     = style.mood    || "light";
  const palette  = style.palette || "AUTO";
  const aspect   = project.aspect_ratio || project.project?.aspect_ratio || "9:16";
  const charBlock = buildHeroAnchor(characters);
  const totalScenes = scenes.length || partScenes.length;
  const cols   = Math.min(2, partScenes.length);
  const rows   = Math.ceil(partScenes.length / cols);
  const labels = partScenes.map((_, i) => `F${String(partIndex * partSize + i + 1).padStart(2, "0")}`);
  const isFirst = partIndex === 0;

  const refText = isFirst
    ? (heroAnchorUploaded
        ? "PART 1: Use uploaded HERO ANCHOR as face and style reference only. Do not copy its composition."
        : "PART 1: No previous PART. Establish the cartoon style from scratch based on Style Lock below.")
    : ({
        heroAndPrevious: "Use uploaded HERO ANCHOR for face/identity lock and PREVIOUS PART for world/style continuity. Do not copy compositions.",
        heroOnly:        "Use uploaded HERO ANCHOR for face/identity lock only.",
        previousOnly:    "Use uploaded PREVIOUS PART image for world/style continuity only.",
      }[referenceMode] || "Use uploaded references for style continuity.");

  const strictText = { hard: "HARD — follow scene descriptions literally; cinematic cartoon composition allowed.", soft: "SOFT — cartoon cinematic polish allowed; never contradict scene descriptions.", maximum: "MAXIMUM — literal execution only; no decorative narrative expansion." }[strictLevel] || "HARD";
  const chainText  = chainMode === "styleDNA"
    ? "STYLE DNA — every frame must share the same cartoon visual universe, color family and style lock."
    : "WORLD + HERO — world and recurring character identity stay locked across all frames.";

  const frameBlocks = partScenes.map((sc, i) => {
    const label = labels[i];
    const sceneText = appearanceMode === "minimal"
      ? cleanText(sc.voice_line || "")
      : cleanText((sc.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "") || sc.voice_line || "");
    const contLink = i === 0
      ? "CONTINUITY LINK: establish the first visual state of this PART. Maintain style lock from previous parts if any."
      : `CONTINUITY LINK: continue from ${labels[i - 1]}. Preserve same world, style and characters. Change only camera angle and composition.`;
    return `${label} [${sc.act || "BUILD"}]:\n${contLink}\nSCENE: ${sceneText}\nCamera: ${sc.camera || "Medium Shot"}.`;
  }).join("\n\n");

  return `CARTOON STORYBOARD GRID — PART ${partIndex + 1}
Frames: ${labels.join(", ")} of ${totalScenes} total

REFERENCE INPUT:
${refText}

FORMAT:
${cols} columns × ${rows} rows — exactly ${partScenes.length} cartoon cells.
Each cell: ${aspect} portrait cartoon frame.
Thin black separators between cells. Frame labels only in small white text (top-left corner).
NO other text, no subtitles, no UI, no watermark inside frames.

CARTOON STYLE LOCK — MUST APPEAR IN EVERY FRAME:
${styleDNA}
Mood: ${mood}. Palette: ${palette}.
All frames share the SAME cartoon style, color family, lighting mood and character visual language.
NO realistic photography. NO live-action realism. NO 3D render (unless pixar3d style).
NO parchment, NO paper texture, NO illustration sketch, NO storyboard board look.

CHAIN MODE: ${chainText}
STRICTNESS: ${strictText}

CHARACTER LOCK:
${charBlock}
Preserve face geometry, silhouette, outfit, color DNA in EVERY frame the character appears.

FRAMES IN THIS PART:
${frameBlocks}

FINAL CHECK:
Exactly ${partScenes.length} frames. Labels: ${labels.join(", ")}.
Same cartoon style across ALL cells. Character identity stable wherever they appear.
Every frame matches its SCENE description. No new plot events, characters or objects.`;
}

export function buildCartoonAutoChainAllParts({
  project = {}, characters = [], scenes = [], partSize = 4,
  chainMode = "styleDNA", strictLevel = "hard",
  referenceMode = "heroAndPrevious", appearanceMode = "full",
} = {}) {
  const parts = splitCartoonScenesIntoParts(scenes, partSize);
  return parts.map((partScenes, i) =>
    buildCartoonAutoChainPartPrompt({ project, characters, scenes, partScenes, partIndex: i, partSize, chainMode, strictLevel, referenceMode, appearanceMode })
  );
}

// ─── LOCAL STORYBOARD BUILDER (uses new prompt builders) ─────────────────────

export function buildLocalStoryboard(projectInput = {}) {
  const project = normalizeCartoonProject(projectInput);
  const parts   = splitCartoonScript(project.script.full_text);
  const total   = parts.length || 1;
  const dur     = Math.max(2, Math.round(Number(project.project.duration_sec || 60) / total));
  const cameras = ["Wide Shot", "Medium Shot", "Close-Up", "POV", "Low Angle", "Aerial"];
  const primaryChars = project.characters.slice(0, 2).map((c) => c.name);
  const includeVo  = project.settings.voToggle !== false;
  const consistency = project.settings.videoConsistency || "ultra";

  const scenes = parts.map((line, index) => {
    const act    = inferAct(index, total);
    const camera = cameras[index % cameras.length];

    const imagePrompt = buildCartoonImagePromptVeo3({
      scene: { voice_line: line, camera, image_prompt_en: line },
      project: project.project,
      characters: project.characters,
    });
    const videoPrompt = buildCartoonVideoPromptVeo3({
      scene: { voice_line: line, camera, act },
      project: project.project,
      characters: project.characters,
      includeVo,
      consistency,
      duration: dur,
    });

    return {
      id: `scene_${String(index + 1).padStart(2, "0")}`,
      index: index + 1,
      act,
      duration_sec: dur,
      voice_line: line,
      camera,
      characters_in_scene: primaryChars,
      image_prompt_en: imagePrompt,
      video_prompt_en: videoPrompt,
      continuity_note: "Maintain Style Lock, Hero Anchor and world rules from previous scenes.",
    };
  });

  return {
    ...project,
    storyboard: {
      total_scenes: scenes.length,
      total_duration_sec: scenes.reduce((s, sc) => s + Number(sc.duration_sec || 0), 0),
      scenes,
    },
    generation: { target: "veo3", mode: "safe", pipeline: CARTOON_PIPELINE_VERSION, engine: "cartoonEngine.local.v2" },
  };
}

export function buildCartoonExport(projectInput = {}) {
  const local = buildLocalStoryboard(projectInput);
  return {
    project: local.project,
    characters: local.characters,
    script: {
      ...local.script,
      word_count: local.script.full_text.trim() ? local.script.full_text.trim().split(/\s+/).length : 0,
      estimated_duration_sec: local.project.duration_sec,
    },
    storyboard: local.storyboard,
    generation: {
      target: "veo3", mode: "safe",
      model_script: "gpt-5.4", model_storyboard: "gpt-5.4",
      model_image_analysis: "claude-sonnet-4-6", model_video_prompt: "claude-haiku-4-5",
      estimated_cost_usd: 0.04, pipeline: CARTOON_PIPELINE_VERSION,
    },
  };
}

// ─── EXPORT BUILDERS ─────────────────────────────────────────────────────────

export function buildCartoonExportTxt(projectData = {}) {
  const { project = {}, characters = [], script = {}, storyboard = {} } = projectData;
  const scenes = storyboard.scenes || [];
  const lines  = [
    `NEUROCINE CARTOON — ${project.title || "Untitled"}`,
    `Format: ${project.format || "shorts"} | ${project.aspect_ratio || "9:16"} | ${project.duration_sec || 60}s`,
    `Style: ${project.style?.preset || "anime"} | Mood: ${project.style?.mood || "light"} | Palette: ${project.style?.palette || "AUTO"}`,
    `Language: ${project.language || "ru"}`,
    "",
    "═══ СЦЕНАРИЙ ═══",
    script.full_text || "",
    "",
    "═══ ПЕРСОНАЖИ ═══",
    ...characters.map((c) =>
      `[${c.name}] ${c.role} | Face Lock: ${c.face_lock ? "ON" : "OFF"}\n${c.description || ""}${c.face_lock_description ? "\nFace Ref: " + c.face_lock_description : ""}`
    ),
    "",
    "═══ STORYBOARD ═══",
    `Total scenes: ${scenes.length} | Total duration: ${storyboard.total_duration_sec || 0}s`,
    "",
    ...scenes.flatMap((sc) => [
      `[${sc.id}] ${sc.act} | ${sc.duration_sec}s | Camera: ${sc.camera}`,
      `VO: ${sc.voice_line || ""}`,
      `IMAGE: ${sc.image_prompt_en || ""}`,
      `VIDEO: ${sc.video_prompt_en || ""}`,
      "",
    ]),
  ];
  return lines.join("\n");
}

export function buildCartoonExportFlow(projectData = {}) {
  const { project = {}, characters = [], script = {}, storyboard = {} } = projectData;
  const scenes   = storyboard.scenes || [];
  const style    = project.style || {};
  const styleDNA = style.dna || CARTOON_STYLE_LOCKS[style.preset || "anime"] || CARTOON_STYLE_LOCKS.anime;

  return [
    `# NEUROCINE CARTOON FLOW — ${project.title || "Untitled"}`,
    `# ${project.format} | ${project.aspect_ratio} | ${project.duration_sec}s | ${style.preset}`,
    "",
    `GLOBAL STYLE LOCK: ${styleDNA}. Mood: ${style.mood}. Palette: ${style.palette}.`,
    "",
    "CHARACTER DNA:",
    ...characters.map((c) => `- ${c.name}: ${c.description || "cartoon character"}. Face Lock: ${c.face_lock ? "ON" : "OFF"}.${c.face_lock_description ? " Ref: " + c.face_lock_description : ""}`),
    "",
    "VO SCRIPT:",
    script.full_text || "",
    "",
    "---",
    "",
    ...scenes.flatMap((sc, i) => [
      `## SCENE ${i + 1} — ${sc.act} [${sc.duration_sec}s]`,
      `VO: ${sc.voice_line || ""}`,
      "",
      "IMAGE PROMPT:",
      sc.image_prompt_en || "",
      "",
      "VIDEO PROMPT (VEO3):",
      sc.video_prompt_en || "",
      "",
      "---",
      "",
    ]),
  ].join("\n");
}

// ─── PROJECT SNAPSHOT ────────────────────────────────────────────────────────

export function buildCartoonSnapshot(projectData = {}) {
  return {
    neurocine_cartoon_snapshot: true,
    version: CARTOON_PIPELINE_VERSION,
    saved_at: new Date().toISOString(),
    ...projectData,
  };
}

// ─── AI SYSTEM PROMPTS ────────────────────────────────────────────────────────

export const CARTOON_SCRIPT_SYSTEM = `You are NeuroCine Cartoon Writer.
Output ONLY valid JSON. No markdown.
Write a cartoon voiceover script in the requested language matching the project duration.
Rules:
- Simple readable sentences for voiceover (3-8 words each).
- Strong hook in the first sentence.
- For 60s duration: write 14-18 short sentences (~150 words total).
- For 30s duration: write 8-10 short sentences (~75 words total).
- Each sentence = 1 scene of 3-4 seconds.
- Clear beginning, escalation, emotional turn, satisfying ending.
- Keep it safe for cartoon production.
- Strictly use the project title and theme — do NOT invent an unrelated story.
JSON schema:
{
  "title": "...",
  "logline": "...",
  "voice_style": "neutral|dramatic|kids|doc",
  "full_text": "...",
  "beats": ["..."],
  "visual_dna": "short style continuity note"
}`;

export const CARTOON_STORYBOARD_SYSTEM = `You are NeuroCine Cartoon Storyboard Director.
Output ONLY valid JSON. No markdown.
Create a production-ready cartoon storyboard from the project JSON.
Hard rules:
- image_prompt_en MUST start with: SCENE PRIMARY FOCUS:
- video_prompt_en MUST start with: ANIMATE CURRENT FRAME:
- video_prompt_en MUST begin with STYLE: [style DNA] to lock the cartoon look for every scene.
- video_prompt_en must be SHORT (60-90 words max). DO NOT write long cinematic blocks.
- English prompts for image/video generation.
- Voice line may remain in project language.
- Preserve Style Lock, Hero Anchor, Face Lock, outfit, silhouette, world continuity.
- No subtitles, no UI, no watermark, no logo.
- Use safe cartoon action and readable visual storytelling.
JSON schema:
{
  "storyboard": {
    "total_scenes": 0,
    "total_duration_sec": 0,
    "scenes": [
      {
        "id": "scene_01",
        "index": 1,
        "act": "HOOK|BUILD|CLIMAX|OUTRO",
        "duration_sec": 4,
        "voice_line": "...",
        "camera": "Wide Shot",
        "characters_in_scene": ["Hero"],
        "image_prompt_en": "SCENE PRIMARY FOCUS: ...",
        "video_prompt_en": "ANIMATE CURRENT FRAME: STYLE: [style DNA]. ...",
        "continuity_note": "..."
      }
    ]
  }
}`;
