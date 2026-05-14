// engine/neurocineDirectorBrain.js
// NeuroCine Unified Director Brain v1
// One reasoning core for shorts, series, clips, animation, anime, comics and live action.

function clean(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasAny(text = "", list = []) {
  const lower = String(text || "").toLowerCase();
  return list.some((w) => lower.includes(String(w).toLowerCase()));
}

const FORMAT_RULES = {
  short: {
    label: "Short / Reels / TikTok",
    narrative: "hook-first short-form structure: immediate visual question, fast escalation, one clear payoff, final retention question",
    shot_logic: "2-4 second shots, one primary focus per frame, high clarity, no slow filler",
  },
  series: {
    label: "Series / episodic",
    narrative: "episodic logic: season promise, episode hook, escalation, cliffhanger, continuity memory across episodes",
    shot_logic: "episode continuity first; reuse character DNA, world rules and visual motifs across every episode",
  },
  music_clip: {
    label: "Music clip",
    narrative: "rhythm-first montage: motif repetition, beat-synced visual escalation, chorus/payoff images, less explanatory narration",
    shot_logic: "dynamic shot size variation, rhythm cuts, visual hooks tied to music energy and repeated symbols",
  },
  film: {
    label: "Film / scene",
    narrative: "scene-driven dramatic logic: setup, pressure, reversal, emotional consequence",
    shot_logic: "coverage logic: establishing, medium, close-up, inserts, reaction, motivated camera movement",
  },
  documentary: {
    label: "Documentary",
    narrative: "evidence-first documentary logic: claim, physical proof, observed detail, consequence",
    shot_logic: "observational camera, concrete objects, real locations, restraint, no over-staged acting",
  },
  explainer: {
    label: "Explainer",
    narrative: "clear teaching logic: problem, mechanism, example, consequence, takeaway",
    shot_logic: "readable visual metaphors, clean diagrams/objects, no chaotic staging",
  },
};

const VISUAL_RULES = {
  live_action: {
    label: "Live action realism",
    style_family: "film",
    style_lock: "camera-photographed live-action realism, practical location, real lens behavior, natural light, human imperfections, tactile surfaces, documentary physical truth",
    continuity: "same face structure, age, body type, costume logic, lighting direction, era and environment physics across every frame",
    visual_logic: "photographic depth layers, motivated lens choice, realistic blocking, weight, inertia and physical contact",
    negative: "CGI, render, plastic skin, wax face, beauty filter, cartoon, anime, illustration, random different person, age drift, costume drift, face drift, subtitles, watermark, UI",
  },
  documentary_raw: {
    label: "Raw documentary",
    style_family: "film",
    style_lock: "RAW unretouched documentary photograph, practical available light, visible pores, fabric weave, dirt, grain, lens vignette, imperfect real surfaces",
    continuity: "identity and clothing stay exact; dirt, damage, fatigue and world texture remain consistent",
    visual_logic: "observational framing, rough realism, physical evidence in frame, no glamour posing",
    negative: "glossy CGI, smooth skin, fashion shoot, studio beauty light, fake bokeh, random costume, random face, clean stock-photo look, subtitles, watermark",
  },
  animation_2d: {
    label: "2D animation",
    style_family: "animation",
    style_lock: "2D cinematic animation, clean readable silhouettes, consistent character model sheet, clear shape language, hand-painted backgrounds, controlled linework, expressive but grounded acting",
    continuity: "same character sheet proportions, face shape, hair shape, costume design, color palette and silhouette in every shot",
    visual_logic: "stage the action through readable silhouettes, clean foreground/midground/background separation, expressive poses and animation-friendly camera angles",
    negative: "photorealistic skin pores, live-action camera photograph, wax skin, CGI plastic, random redesign, inconsistent line style, face drift, costume drift, unreadable silhouette, over-detailed noisy background",
  },
  animation_25d: {
    label: "2.5D layered animation",
    style_family: "animation",
    style_lock: "2.5D layered animation, parallax-ready painted backgrounds, clean separated planes, consistent character model, cinematic depth without photorealism",
    continuity: "same model sheet, same layer style, same palette groups, same costume and silhouette across all layers and frames",
    visual_logic: "build shots as animation layers: foreground occluder, character plane, background plane, parallax camera path",
    negative: "live-action photo, CGI realism, random character redesign, cluttered unreadable layers, inconsistent scale, face drift, costume drift",
  },
  animation_3d: {
    label: "3D stylized animation",
    style_family: "animation",
    style_lock: "premium stylized 3D animated film look, consistent character rig, clean expressive posing, readable materials, cinematic lighting, not live-action",
    continuity: "same rig proportions, same face rig, same costume mesh, same material palette and stylized physics",
    visual_logic: "animation blocking, strong poses, staged camera, readable arcs, clean character/environment separation",
    negative: "live-action photograph, uncanny skin realism, random rig redesign, morphing face, costume drift, cheap plastic render, broken hands",
  },
  anime: {
    label: "Anime",
    style_family: "anime",
    style_lock: "cinematic anime direction, consistent anime character sheet, expressive eyes, controlled linework, dramatic composition, detailed painted backgrounds",
    continuity: "same anime face model, eye shape, hair silhouette, costume design and palette across every frame",
    visual_logic: "anime staging with impact frames where needed, readable emotional beats, stylized camera angles and strong silhouettes",
    negative: "live-action photograph, photoreal skin pores, CGI plastic, random anime redesign, inconsistent hair, inconsistent eyes, costume drift, muddy linework",
  },
  comic: {
    label: "Graphic novel / comic",
    style_family: "comic",
    style_lock: "graphic novel panel language, bold silhouettes, controlled ink or halftone texture, readable panel composition, strong shape design",
    continuity: "same drawn model, same costume symbols, same face shape, same line weight logic across panels",
    visual_logic: "panel-first framing, strong negative space, bold readable action, clear focal hierarchy",
    negative: "live-action photo, CGI render, inconsistent line weight, random character redesign, costume drift, muddy composition, unreadable panel",
  },
  stop_motion: {
    label: "Stop motion",
    style_family: "animation",
    style_lock: "stop-motion miniature set look, tactile handmade puppets, fabric, clay, paper, small imperfections, tabletop cinematic lighting",
    continuity: "same puppet build, same miniature costume, same material texture and scale across every shot",
    visual_logic: "physical puppet staging, practical miniature camera, small tactile motions, handmade charm",
    negative: "smooth CGI, live-action humans, random puppet redesign, plastic mass-production look, face drift, costume drift",
  },
  cutout_paper: {
    label: "Cutout paper animation",
    style_family: "animation",
    style_lock: "cutout paper craft animation, scanned paper texture, cardboard layers, flat shadows, collage edges, handmade motion language",
    continuity: "same paper shapes, same cut edges, same palette, same character silhouette and costume pieces across shots",
    visual_logic: "flat layered staging, graphic readability, tactile paper parallax, simple expressive movement",
    negative: "live-action photo, glossy CGI, random paper redesign, inconsistent cutout shapes, noisy over-detail, face drift",
  },
};

export function inferDirectorBrainProfile(input = {}) {
  const text = clean([
    input.title,
    input.topic,
    input.script,
    input.logline,
    input.world,
    input.genre,
    input.tone,
    input.format,
    input.style,
    input.stylePreset,
    input.projectType,
  ].filter(Boolean).join(" "));

  let format_mode = "short";
  if (hasAny(text, ["series", "сериал", "эпизод", "season", "episode"])) format_mode = "series";
  else if (hasAny(text, ["music video", "клип", "song", "track", "beat", "chorus", "музык"])) format_mode = "music_clip";
  else if (hasAny(text, ["documentary", "документ", "true crime", "расследование"])) format_mode = "documentary";
  else if (hasAny(text, ["explainer", "объясни", "обуч", "урок", "how it works"])) format_mode = "explainer";
  else if (hasAny(text, ["film", "фильм", "scene", "сцена"])) format_mode = "film";

  let visual_mode = "live_action";
  if (hasAny(text, ["2.5d", "2,5d", "parallax", "параллакс"])) visual_mode = "animation_25d";
  else if (hasAny(text, ["2d", "мульт", "мультфильм", "cartoon", "рисован", "hand drawn", "hand-drawn"])) visual_mode = "animation_2d";
  else if (hasAny(text, ["3d", "pixar", "dreamworks", "stylized 3d"])) visual_mode = "animation_3d";
  else if (hasAny(text, ["anime", "аниме", "ghibli", "shonen", "slice of life"])) visual_mode = "anime";
  else if (hasAny(text, ["comic", "комикс", "graphic novel", "halftone", "манга"])) visual_mode = "comic";
  else if (hasAny(text, ["stop motion", "stop-motion", "стоп моушн", "кукольн"])) visual_mode = "stop_motion";
  else if (hasAny(text, ["cutout", "paper", "бумаж", "коллаж", "cardboard"])) visual_mode = "cutout_paper";
  else if (format_mode === "documentary" || hasAny(text, ["raw", "realism", "реализм", "документал"])) visual_mode = "documentary_raw";

  const format = FORMAT_RULES[format_mode] || FORMAT_RULES.short;
  const visual = VISUAL_RULES[visual_mode] || VISUAL_RULES.live_action;
  const continuity_level = input.continuity_level || (format_mode === "series" ? "strict_series" : visual_mode === "live_action" ? "strict_identity" : "strict_model_sheet");

  return {
    brain_version: "unified_director_brain_v1",
    format_mode,
    format_label: format.label,
    visual_mode,
    visual_label: visual.label,
    style_family: visual.style_family,
    target_platform: input.targetPlatform || input.target || "veo3",
    aspect_ratio: input.aspectRatio || input.aspect_ratio || "9:16",
    continuity_level,
    narrative_logic: format.narrative,
    shot_logic: format.shot_logic,
    visual_logic: visual.visual_logic,
    style_lock: visual.style_lock,
    continuity_lock: visual.continuity,
    negative_lock: visual.negative,
  };
}

export function buildDirectorBrainPromptBlock(profile = {}) {
  const p = profile.brain_version ? profile : inferDirectorBrainProfile(profile);
  const isLive = p.visual_mode === "live_action" || p.visual_mode === "documentary_raw";
  return `
NEUROCINE UNIFIED DIRECTOR BRAIN — ACTIVE PROFILE
Brain version: ${p.brain_version || "unified_director_brain_v1"}
Format mode: ${p.format_mode} / ${p.format_label}
Visual mode: ${p.visual_mode} / ${p.visual_label}
Style family: ${p.style_family}
Aspect ratio: ${p.aspect_ratio}
Target platform: ${p.target_platform}
Continuity level: ${p.continuity_level}

HOW TO THINK:
- First decide what is being directed: ${p.format_label} in ${p.visual_label} language.
- Do NOT use a generic prompt recipe. Adapt story, shots, continuity and motion to this exact format.
- Narrative logic: ${p.narrative_logic}.
- Shot logic: ${p.shot_logic}.
- Visual logic: ${p.visual_logic}.

STYLE LOCK FOR THIS PROJECT:
${p.style_lock}

CONTINUITY LOCK:
${p.continuity_lock}

${isLive ? "LIVE-ACTION NOTE: photographic/raw realism is allowed and expected." : "NON-LIVE-ACTION OVERRIDE: do NOT use live-action skin pores, ARRI camera realism, documentary photo language or RAW photography rules as the main style. Use the visual language of the selected animation/comic/anime format instead."}

NEGATIVE LOCK:
${p.negative_lock}
`;
}

export function buildDirectorOutputRules(profile = {}) {
  const p = profile.brain_version ? profile : inferDirectorBrainProfile(profile);
  if (p.format_mode === "music_clip") return "Output must think in rhythm: beat, motif, chorus image, repeated visual symbol, shot energy and transitions. Avoid explanatory filler.";
  if (p.format_mode === "series") return "Output must think in episodes: episode hook, continuity memory, recurring visual motifs, cliffhanger, character DNA across episodes.";
  if (p.visual_mode === "animation_2d") return "Output must think like 2D animation: silhouette readability, shape consistency, model sheet continuity, clear staging and expression poses.";
  if (p.visual_mode === "anime") return "Output must think like anime direction: character sheet consistency, expressive eyes, impact frames when useful, stylized composition and painted backgrounds.";
  return "Output must preserve one-focus cinematic logic, clear physical image translation and strict continuity.";
}

export function getDirectorStyleLock(input = {}) {
  return inferDirectorBrainProfile(input).style_lock;
}

export function getDirectorNegativeLock(input = {}) {
  return inferDirectorBrainProfile(input).negative_lock;
}

export function buildDirectorFrameGridLock(input = {}) {
  const p = input.brain_version ? input : inferDirectorBrainProfile(input);
  return `FORMAT MODE: ${p.format_mode}. VISUAL MODE: ${p.visual_mode}. STYLE FAMILY: ${p.style_family}.\nSTYLE LOCK: ${p.style_lock}\nSHOT LOGIC: ${p.shot_logic}\nVISUAL LOGIC: ${p.visual_logic}\nCONTINUITY: ${p.continuity_lock}\nNEGATIVE: ${p.negative_lock}`;
}
