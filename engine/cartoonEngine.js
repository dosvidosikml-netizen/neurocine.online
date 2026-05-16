// engine/cartoonEngine.js
// NeuroCine Cartoon Brain v1
// Server-side helpers for the /cartoon pipeline: script, storyboard, continuity and export JSON.

export const CARTOON_PIPELINE_VERSION = "cartoon_creator_v1";

export const CARTOON_STYLE_LOCKS = {
  anime: "anime cel-shaded cartoon, expressive faces, clean linework, vibrant colors, cinematic composition",
  pixar: "premium 3D cartoon film look, warm volumetric lighting, expressive characters, soft cinematic render",
  flat: "2D flat cartoon, bold outlines, clean geometric shapes, bright readable colors",
  cinema: "cinematic animated film, dramatic lighting, emotional framing, high production value",
  pixel: "16-bit pixel art cartoon, limited palette, crisp silhouettes, retro game animation aesthetic",
  custom: "custom cartoon style supplied by user",
};

export function safeJsonParse(raw = "") {
  const text = String(raw || "").trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(text);
}

export function normalizeCartoonProject(input = {}) {
  const concept = input.concept || input.project || input || {};
  const style = input.style || concept.style || {};
  const characters = Array.isArray(input.characters) ? input.characters : Array.isArray(input.heroes) ? input.heroes : [];
  const script = input.script || {};
  const storyboard = input.storyboard || {};

  return {
    project: {
      id: String(concept.id || input.id || `cartoon_${Date.now()}`),
      title: String(concept.title || input.title || "Untitled Cartoon").slice(0, 160),
      created_at: concept.created_at || new Date().toISOString(),
      format: String(concept.format || input.format || "shorts"),
      duration_sec: Number(concept.duration_sec || concept.duration || input.duration_sec || input.duration || 60),
      aspect_ratio: String(concept.aspect_ratio || concept.aspect || input.aspect_ratio || "9:16"),
      language: String(concept.language || concept.lang || input.language || "ru"),
      style: {
        preset: String(style.preset || style.style || input.stylePreset || "anime"),
        custom_prompt: style.custom_prompt || style.custom || input.custom_prompt || null,
        mood: String(style.mood || input.mood || "light"),
        palette: String(style.palette || input.palette || "AUTO"),
      },
    },
    characters: characters.slice(0, 3).map((character, index) => ({
      id: String(character.id || `char_${index + 1}`),
      name: String(character.name || `Hero ${index + 1}`).slice(0, 80),
      role: String(character.role || "main"),
      description: String(character.description || character.prompt || "").slice(0, 1200),
      face_lock: character.face_lock !== false,
      modifiers: Array.isArray(character.modifiers) ? character.modifiers.slice(0, 12) : [],
      reference_url: character.reference_url || null,
    })),
    script: {
      full_text: String(script.full_text || script.text || input.scriptText || input.text || ""),
      voice_style: String(script.voice_style || input.voice || "neutral"),
      language: String(script.language || concept.language || input.language || "ru"),
    },
    storyboard: {
      scenes: Array.isArray(storyboard.scenes) ? storyboard.scenes : Array.isArray(input.scenes) ? input.scenes : [],
    },
  };
}

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

export function buildHeroAnchor(characters = []) {
  if (!characters.length) return "No locked character supplied.";
  return characters.map((c) => {
    const mods = Array.isArray(c.modifiers) && c.modifiers.length ? ` Modifiers: ${c.modifiers.join(", ")}.` : "";
    const lock = c.face_lock !== false ? " Face Lock ON: preserve face geometry, silhouette, outfit, proportions and color DNA across every scene." : "";
    return `${c.name} (${c.role || "main"}): ${c.description || "cartoon character"}.${mods}${lock}`;
  }).join("\n");
}

export function buildCartoonContinuityContract(project) {
  const style = project.project.style || {};
  const preset = style.preset || "anime";
  const styleLock = preset === "custom" ? style.custom_prompt || CARTOON_STYLE_LOCKS.custom : CARTOON_STYLE_LOCKS[preset] || CARTOON_STYLE_LOCKS.anime;
  return [
    "CARTOON CONTINUITY CONTRACT:",
    `Style Lock: ${styleLock}.`,
    `Mood: ${style.mood || "light"}. Palette: ${style.palette || "AUTO"}.`,
    `Aspect ratio: ${project.project.aspect_ratio || "9:16"}.`,
    "Every frame must preserve character identity, readable silhouettes, outfit, face proportions, color DNA and world continuity.",
    "No subtitles, no UI, no watermark, no logo, no random text inside image/video frames.",
    "Use family-safe cartoon action unless the user explicitly asks for darker mood; avoid graphic injury.",
    buildHeroAnchor(project.characters),
  ].filter(Boolean).join("\n");
}

export function buildLocalStoryboard(projectInput = {}) {
  const project = normalizeCartoonProject(projectInput);
  const parts = splitCartoonScript(project.script.full_text);
  const total = parts.length || 1;
  const duration = Math.max(2, Math.round(Number(project.project.duration_sec || 60) / total));
  const cameras = ["Wide Shot", "Medium Shot", "Close-Up", "POV", "Low Angle", "Aerial"];
  const contract = buildCartoonContinuityContract(project);
  const primaryCharacters = project.characters.slice(0, 2).map((c) => c.name);

  const scenes = parts.map((line, index) => {
    const act = inferAct(index, total);
    const camera = cameras[index % cameras.length];
    const imagePrompt = [
      `SCENE PRIMARY FOCUS: ${line}`,
      contract,
      `Camera: ${camera}. Scene act: ${act}.`,
      `Characters in scene: ${primaryCharacters.join(", ") || "none"}.`,
      "Create one clean cinematic cartoon frame. Strong composition, clear focal point, emotional readability.",
    ].join("\n");

    return {
      id: `scene_${String(index + 1).padStart(2, "0")}`,
      index: index + 1,
      act,
      duration_sec: duration,
      voice_line: line,
      camera,
      characters_in_scene: primaryCharacters,
      image_prompt_en: imagePrompt,
      video_prompt_en: `ANIMATE CURRENT FRAME: ${imagePrompt}\nSmooth expressive cartoon motion for ${duration}s. Preserve exact identity and continuity. SFX: soft cartoon ambience. No subtitles, no UI, no watermark.`,
      continuity_note: "Use the same Style Lock, Hero Anchor and world rules as previous scenes.",
    };
  });

  return {
    ...project,
    storyboard: {
      total_scenes: scenes.length,
      total_duration_sec: scenes.reduce((sum, scene) => sum + Number(scene.duration_sec || 0), 0),
      scenes,
    },
    generation: {
      target: "veo3",
      mode: "safe",
      pipeline: CARTOON_PIPELINE_VERSION,
      engine: "cartoonEngine.local",
    },
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
      target: "veo3",
      mode: "safe",
      model_script: "gpt-5.4",
      model_storyboard: "gpt-5.4",
      model_image_analysis: "claude-sonnet-4-6",
      model_video_prompt: "claude-haiku-4-5",
      estimated_cost_usd: 0.04,
      pipeline: CARTOON_PIPELINE_VERSION,
    },
  };
}

export const CARTOON_SCRIPT_SYSTEM = `You are NeuroCine Cartoon Writer.
Output ONLY valid JSON. No markdown.
Write a short, highly visual cartoon script in the requested language.
Rules:
- Simple readable sentences for voiceover.
- Strong hook in the first sentence.
- Clear beginning, escalation, emotional turn, satisfying ending.
- Keep it safe for cartoon production.
- Respect duration and format.
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
        "video_prompt_en": "ANIMATE CURRENT FRAME: ...",
        "continuity_note": "..."
      }
    ]
  }
}`;
