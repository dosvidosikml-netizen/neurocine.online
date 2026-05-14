// NeuroCine Scene Engine
// Local fallback + normalization for storyboard JSON.

// ─── ULTRA REALISM CORE ──────────────────────────────────────────────────────
// Единый набор инструкций для максимального фотореализма.
// Внедрён во все стили. Запрещённые слова убраны из всех промтов.

const ULTRA_REALISM =
  "RAW unretouched photograph, NOT CGI, NOT rendering, NOT illustration — " +
  "shot on ARRI Alexa 65, Zeiss Master Prime 85mm T1.5, natural available light only. " +
  "Optical imperfections: chromatic aberration on high-contrast edges, slight barrel distortion, natural lens vignette, " +
  "real bokeh from f/1.4 aperture — background physically blurred by optics not post-processing, " +
  "foreground subject in sharp critical focus with micro-texture visible: skin pores, fabric weave, surface grain. Lens: ARRI Alexa 65 Zeiss Master Prime — anamorphic bokeh, oval lens flares in specular highlights, horizontal lens breathing. " +
  "Sensor characteristics: ISO 1600 luminance noise, color noise in shadows, micro-motion blur on fast edges. " +
  "Lighting physics: single natural key light source with defined angle, soft fill from ground bounce, " +
  "realistic shadow falloff with penumbra, subsurface scattering on skin and thin fabric. " +

  // ── SKIN MICRO-DETAIL ──
  "SKIN REALISM (mandatory): visible open pores on nose bridge, cheeks and forehead, " +
  "individual pore shadows under raking light, fine facial hair follicle dots on jaw and upper lip, " +
  "dry cracked lip texture with vertical micro-fissures and desaturated lip edges, " +
  "visible capillaries and slight redness in eye whites (sclera), natural tear film gloss on cornea, " +
  "under-eye darkness with faint blue-gray vascular tone, nasolabial fold shadow with skin texture preserved, " +
  "cheekbone subsurface flush, forehead sebum micro-sheen in key light zone, " +
  "ear cartilage fine detail with translucent rim lighting, " +
  "neck skin with horizontal compression creases when head is down, " +
  "eyebrow individual hair shafts visible, eyelid crease skin texture, " +
  "NO smooth airbrushed skin, NO plastic surface, NO porcelain finish. " +

  // ── FABRIC MICRO-DETAIL ──
  "FABRIC REALISM (mandatory): individual thread weave visible on all fabric surfaces in focus zone, " +
  "tension wrinkles radiating from stress points (elbows, shoulders, belt line), " +
  "worn fabric edges with loose thread fray, fabric color variation from soil and wear, " +
  "natural gravity drape on sleeves and collar, micro-lint and fiber on dark surfaces, " +
  "button hole stress marks, seam ridge casting micro-shadow, " +
  "fabric breathing — subtle compression where body presses against it. " +

  "Subject physicality: realistic body weight distribution, clothes obeying gravity, fabric drape and tension, " +
  "unposed candid posture, micro-expressions, hair responding to environment. " +
  "Color science: Kodak Portra 400 color response — slightly warm highlights, desaturated shadows, " +
  "lifted blacks, natural skin tone rendering, no crushed blacks, no HDR tonemapping. " +
  "Forbidden rendering artifacts: NO plastic skin, NO specular blobs, NO perfect symmetry, " +
  "NO clean edges, NO game engine materials, NO smooth gradients on organic surfaces.";

const PHOTO_NEGATIVE =
  "plastic skin, porcelain skin finish, airbrushed skin, oversmoothed skin, beauty retouching, " +
  "smooth featureless lips, perfect lip symmetry, glass-smooth eye whites, " +
  "specular blob highlights, CGI render, 3D game engine look, Unreal Engine, " +
  "perfect symmetry, artificial bokeh blur, fake depth of field, " +
  "HDR tonemapping, oversaturated colors, lens flare abuse, post-processed glow, " +
  "illustration, painting, concept art, anime, cartoon, comic style, " +
  "watermark, subtitle, UI overlay, text, modern objects out of context";

export const STYLE_LOCKS = {
  cinematic:
    `${ULTRA_REALISM} Documentary physical reality, historical accuracy, handheld micro-drift, natural overcast light, Kodak Vision3 500T grain response, no subtitles, no UI, no watermark`,
  dark:
    `${ULTRA_REALISM} Dark historical documentary thriller — tense atmosphere, gritty surface texture, smoke and moisture in air, mud with cracked dried edges, damp stone with mineral deposits, cold overcast key light, deep shadows with visible detail, no subtitles, no UI, no watermark`,
  truecrime:
    `${ULTRA_REALISM} Premium true crime reconstruction — low-key natural lighting, forensic atmosphere, controlled shadow depth, realistic crime scene texture, unposed documentary framing, no subtitles, no UI, no watermark`,
  war:
    `${ULTRA_REALISM} Gritty war documentary — long lens compression, 200mm f/2.8 telephoto, mud splatter with realistic drying patterns, smoke volumetric density, cold diffused natural light, handheld urgent tension, Kodak Vision3 grain, no subtitles, no UI, no watermark`,
  neonNoir:
    `${ULTRA_REALISM} Neon Noir cinematic atmosphere — rain-soaked asphalt with high-contrast neon reflections, magenta and cyan light scatter through haze, deep shadow silhouettes against glowing storefront signs, wet surfaces with mirror-grade specular, Blade Runner-style smoke and steam volumetrics, anamorphic lens streaks, no subtitles, no UI, no watermark`,
  synthwave80s:
    `${ULTRA_REALISM} 80s synthwave retrofuturism — neon grid horizon, oversized retro sunset with horizontal stripe gradient magenta-to-amber, chrome reflections, VHS chromatic aberration on edges, slight scan-line texture, hot pink and electric cyan dominant palette, palm tree silhouettes, no subtitles, no UI, no watermark`,
  cyberpunk:
    `${ULTRA_REALISM} Dense cyberpunk megacity at night — towering holographic billboards casting colored light on faces, layered light pollution, vertical wet alley reflections, rim lights from neon kanji and Cyrillic signage, atmospheric particulate, low-angle architectural compression, no subtitles, no UI, no watermark`,
  vhsRetro:
    `${ULTRA_REALISM} Retro VHS/Super 8 home-video aesthetic — film grain heavy, slight tape jitter, soft chromatic bleed, faded warm tungsten color palette, light leaks at frame edges, slight overexposure on highlights, lifted shadow detail, 4:3-feeling crop tension even in wide aspect, no subtitles, no UI, no watermark`,
  analogFilm:
    `${ULTRA_REALISM} Analog Kodak Portra 400 film grain — warm highlights, desaturated shadows, natural skin tones, soft halation on light sources, slight gate weave, organic imperfection, golden-hour key light, no subtitles, no UI, no watermark`,
  mysticHorror:
    `${ULTRA_REALISM} Atmospheric horror documentary — fog dense enough to obscure mid-ground, candle and oil-lamp practical key lights flickering, deep cold blue ambient shadow fill, faces partially obscured, breath visible, damp stone and mossy wood texture, restrained framing avoiding direct shock, no subtitles, no UI, no watermark`,
  scifiAtmospheric:
    `${ULTRA_REALISM} Hard sci-fi atmospheric realism — practical lab and spacecraft lighting with cool teal LED accents, volumetric haze in beam paths, brushed metal and matte composite surface texture, condensation on cold surfaces, slightly desaturated palette, anamorphic flare on bright sources, no subtitles, no UI, no watermark`,
  fantasyEpic:
    `${ULTRA_REALISM} Epic fantasy realism — golden-hour rim light through atmospheric haze, weathered leather and chainmail with individual link detail, dust motes in shafts of light, painterly cloud formations, deep valley compression, naturalistic costume aged with use, no subtitles, no UI, no watermark`,
  westernGritty:
    `${ULTRA_REALISM} Gritty western frontier realism — sun-bleached wood and bone-dry earth, harsh midday sun with deep shadow contrast, dust kicked into air, sweat-stained fabric with salt crystals, weathered hands with sun damage, warm amber dust palette, no subtitles, no UI, no watermark`,
  apocalyptic:
    `${ULTRA_REALISM} Post-apocalyptic realism — overgrown urban decay with plant intrusion through concrete, oxidized rust patina with realistic flaking, ash fall in air, abandoned vehicles with weathered paint, low overcast cold ambient light, muted desaturated palette with occasional rust orange accent, no subtitles, no UI, no watermark`,
  filmNoir:
    `${ULTRA_REALISM} Classic film noir — black-and-white high-contrast Venetian blind shadows across faces, hard side key light at 45 degrees, cigarette smoke volumetric in shaft of light, fedora-shadowed eyes, wet street with reflective puddles, 1940s wardrobe texture, no subtitles, no UI, no watermark`,
  brutalistMinimal:
    `${ULTRA_REALISM} Brutalist minimal architectural drama — raw concrete texture with form-tie holes, oversized geometric voids, single hard sunlight beam through architectural cutout, monochromatic gray-beige palette with single accent color, human figure dwarfed by structure, no subtitles, no UI, no watermark`
};

export const VIDEO_LOCK =
  "grounded physical realism, real inertia and weight, cloth physics responding to movement, " +
  "organic handheld camera operator behavior — micro-drift only, no stabilized floaty motion, " +
  "documentary authenticity, no speed ramps, no artificial transitions, no VFX overlays";

export const NEGATIVE_LOCK =
  `${PHOTO_NEGATIVE}, no modern objects, no modern clothes, no text overlay, no subtitles, no watermark, no cartoon, no anime, no UI`;

export function cleanText(value = "") {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureCharacterContinuityLine(video = "", continuity = "Preserve the same character identity, costume, lighting, historical texture and scene-to-scene continuity.") {
  const raw = cleanText(video);
  const line = `CHARACTER CONTINUITY: ${continuity}`;
  if (!raw) return line;
  if (/CHARACTER\s+CONTINUITY\s*:/i.test(raw)) return raw;
  if (/SFX\s*:/i.test(raw)) return raw.replace(/\n*\s*SFX\s*:/i, `\n${line}\n\nSFX:`);
  return `${raw}\n${line}`;
}

export function splitScript(script = "") {
  const text = cleanText(script);
  if (!text) return [];

  let parts = text
    .split(/(?<=[.!?…])\s+|\n+/g)
    .map((x) => x.trim())
    .filter(Boolean);

  if (parts.length < 8) {
    parts = text
      .split(/[,;:—]+/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  const beats = [];
  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    if (current.length < 28 && parts[i + 1]) {
      beats.push(`${current} ${parts[i + 1]}`.trim());
      i++;
    } else {
      beats.push(current);
    }
  }
  return beats.filter(Boolean);
}

export function getDurationPlan(totalDuration = 60) {
  const seconds = Number(totalDuration) || 60;
  const targetScenes = Math.max(6, Math.round(seconds / 3));
  return {
    seconds,
    targetScenes,
    minShot: 2,
    maxShot: seconds <= 180 ? 6 : 10,
    averageShotDuration: Math.max(2, Math.round(seconds / targetScenes))
  };
}

function pad(n) {
  return `frame_${String(n + 1).padStart(2, "0")}`;
}

function beatType(index, total) {
  if (index === 0) return "hook";
  if (index === total - 1) return "ending";
  if (index > total * 0.78) return "climax";
  if (index % 5 === 0) return "reaction";
  if (index % 4 === 0) return "evidence";
  return "escalation";
}

function emotionTag(text, index) {
  const t = String(text).toLowerCase();
  if (index === 0) return "shock";
  if (/смерт|умер|кров|казн|чума|труп|голод|боль|страх|ужас|гнил|убив/i.test(t)) return "shock";
  if (/почему|зачем|вопрос|представь|ты/i.test(t)) return "intrigue";
  if (/год|факт|истор|люди|город|врач|вода/i.test(t)) return "information";
  return "calm";
}

function shotType(index) {
  const list = ["extreme close-up", "wide establishing shot", "medium close-up", "tracking shot", "low angle shot", "over-shoulder shot", "macro detail", "handheld close-up"];
  return list[index % list.length];
}

function cameraMove(index) {
  const list = [
    "slow push-in with micro handheld shake",
    "handheld tracking through the environment",
    "fast cut into a tense close-up",
    "low tracking shot with parallax",
    "slow dolly around the primary subject",
    "sharp whip-pan into reaction",
    "macro push toward the key detail",
    "slow pullback revealing scale"
  ];
  return list[index % list.length];
}

function sfxFromText(text, index) {
  const t = String(text).toLowerCase();
  if (/вода|пить|гряз/i.test(t)) return "flies buzzing, dirty water dripping, low drone";
  if (/врач|леч|зуб|операц|кровопуск/i.test(t)) return "metal tools clinking, tense breathing, candle crackle";
  if (/чума|кры|паразит|болез/i.test(t)) return "rats squeaking, straw rustle, distant plague bell";
  if (/толп|казн|площад/i.test(t)) return "crowd murmur, wooden platform creak, cold wind";
  if (index === 0) return "deep impact hit, heartbeat, low rumble";
  return "cold wind, distant bell, low cinematic tension";
}

function visualFromText(vo, index, style) {
  const base = String(vo).replace(/[«»"]/g, "").trim();
  const templates = [
    `SCENE PRIMARY FOCUS: terrified medieval survivor waking in a dark filthy room, rotten wood, cold breath, oppressive atmosphere. Visual meaning: "${base}".`,
    `SCENE PRIMARY FOCUS: narrow medieval street packed with mud, waste, smoke, rats and sick townspeople. Visual meaning: "${base}".`,
    `SCENE PRIMARY FOCUS: dirty hands holding a rough wooden cup near questionable water, flies crossing the frame. Visual meaning: "${base}".`,
    `SCENE PRIMARY FOCUS: medieval barber-surgeon preparing primitive tools beside a frightened patient, non-graphic medical dread. Visual meaning: "${base}".`,
    `SCENE PRIMARY FOCUS: crowded public square, rough wooden barriers, tense faces watching a dangerous spectacle, documentary framing. Visual meaning: "${base}".`,
    `SCENE PRIMARY FOCUS: lonely figure walking through fog near city walls, bells in the distance, mortality and pressure. Visual meaning: "${base}".`
  ];
  return `${templates[index % templates.length]} STYLE LOCK: ${style}.`;
}

export function buildLocalStoryboard({
  script,
  duration = 60,
  aspectRatio = "9:16",
  style = "cinematic",
  projectName = "NeuroCine Project"
} = {}) {
  const plan = getDurationPlan(duration);
  let beats = splitScript(script);
  if (!beats.length) beats = ["Вставьте сценарий, чтобы создать storyboard."];

  const styleLock = STYLE_LOCKS[style] || STYLE_LOCKS.cinematic;
  const count = beats.length;
  let rest = plan.seconds;
  let cursor = 0;

  const scenes = beats.map((vo, index) => {
    const remaining = count - index;
    let dur = index === count - 1 ? rest : Math.max(2, Math.min(6, Math.round(rest / remaining)));
    rest -= dur;

    const sfx = sfxFromText(vo, index);
    const visual = visualFromText(vo, index, styleLock);
    const imagePrompt =
      `SCENE PRIMARY FOCUS: ${visual}\n` +
      `SHOT TYPE: ${shotType(index)}. COMPOSITION: foreground — key survival detail; midground — primary subject; background — atmospheric historical environment. ` +
      `ASPECT RATIO: ${aspectRatio}. NEGATIVE: ${NEGATIVE_LOCK}.`;

    const continuity = "Preserve the same subject identity, costume logic, lighting, historical texture and continuity across the full sequence.";
    const videoPrompt = ensureCharacterContinuityLine(
      `ANIMATE CURRENT FRAME: ${cameraMove(index)}. Preserve the same subject, costume logic, lighting, historical texture and continuity. ` +
      `${VIDEO_LOCK}. No subtitles, no UI, no watermark.\n\nSFX: ${sfx}`,
      continuity
    );

    const item = {
      id: pad(index),
      start: cursor,
      duration: dur,
      end: cursor + dur,
      beat_type: beatType(index, count),
      emotion: emotionTag(vo, index),
      description_ru: visual,
      image_prompt_en: imagePrompt,
      video_prompt_en: videoPrompt,
      vo_ru: vo,
      sfx,
      camera: cameraMove(index),
      transition: index === 0 ? "smash cut" : index % 4 === 0 ? "archival flicker" : "cut",
      continuity_note: continuity,
      safety_note: "Non-graphic documentary framing; intensity through camera, atmosphere, sound and reactions."
    };
    cursor += dur;
    return item;
  });

  return {
    project_name: projectName,
    language: "ru",
    format: "shorts_reels_tiktok",
    aspect_ratio: aspectRatio,
    total_duration: plan.seconds,
    global_style_lock: styleLock,
    global_video_lock: VIDEO_LOCK,
    character_lock: [],
    scenes,
    export_meta: {
      engine_target: "neurocine_local_fallback",
      version: "neurocine_full_site_v2",
      created_by: "NeuroCine Studio"
    }
  };
}

export function normalizeStoryboard(input = {}, fallback = {}) {
  const source = input.storyboard || input;
  if (!source || !Array.isArray(source.scenes)) {
    return buildLocalStoryboard(fallback);
  }

  const aspectRatio = source.aspect_ratio || fallback.aspectRatio || "9:16";
  const arLabel = {
    "9:16": "9:16 vertical portrait — tall framing, subject centered vertically",
    "16:9": "16:9 wide horizontal — cinematic widescreen framing",
    "1:1":  "1:1 square — centered balanced framing",
    "4:5":  "4:5 portrait — near-portrait framing",
  }[aspectRatio] || "9:16 vertical portrait";

  let cursor = 0;
  const scenes = source.scenes.map((s, i) => {
    const duration = Math.max(2, Math.min(10, Number(s.duration || 3)));
    const vo = s.vo_ru || s.vo || s.voice || "";
    const image = s.image_prompt_en || s.image?.prompt || s.image || "";
    const video = s.video_prompt_en || s.video?.prompt || s.video || "";
    const continuity = s.continuity_note || "Preserve the same character identity, costume, lighting, historical texture and scene-to-scene continuity.";
    const out = {
      id: s.id || pad(i),
      start: Number.isFinite(Number(s.start)) ? Number(s.start) : cursor,
      duration,
      end: Number.isFinite(Number(s.end)) ? Number(s.end) : cursor + duration,
      beat_type: s.beat_type || beatType(i, source.scenes.length),
      emotion: s.emotion || emotionTag(vo, i),
      description_ru: s.description_ru || s.visual || "",
      image_prompt_en: (() => {
        const base = image.startsWith("SCENE PRIMARY FOCUS:") ? image : `SCENE PRIMARY FOCUS: ${image}`;
        return base.includes("ASPECT RATIO:") ? base : `${base}. ASPECT RATIO: ${arLabel}`;
      })(),
      video_prompt_en: (() => {
        const sfxLine = s.sfx ? `\n\nSFX: ${s.sfx}` : "";
        const baseVideo = video.startsWith("ANIMATE CURRENT FRAME:")
          ? (video.includes("SFX:") ? video : video + sfxLine)
          : `ANIMATE CURRENT FRAME: ${video}${sfxLine}`;
        return ensureCharacterContinuityLine(baseVideo, continuity);
      })(),
      vo_ru: vo,
      sfx: s.sfx || s.sound || "",
      camera: s.camera || cameraMove(i),
      transition: s.transition || "cut",
      continuity_note: continuity,
      safety_note: s.safety_note || "Non-graphic documentary framing."
    };
    cursor = out.end;
    return out;
  });

  return {
    project_name: source.project_name || fallback.projectName || "NeuroCine Project",
    language: source.language || "ru",
    format: source.format || "shorts_reels_tiktok",
    aspect_ratio: source.aspect_ratio || fallback.aspectRatio || "9:16",
    total_duration: Number(source.total_duration || cursor || fallback.duration || 60),
    global_style_lock: source.global_style_lock || STYLE_LOCKS.cinematic,
    global_video_lock: source.global_video_lock || VIDEO_LOCK,
    character_lock: source.character_lock || [],
    scenes,
    export_meta: source.export_meta || {
      engine_target: "normalized",
      version: "neurocine_full_site_v2",
      created_by: "NeuroCine Studio"
    }
  };
}

export function storyboardToProjectJson(storyboard, extra = {}) {
  return {
    name: storyboard.project_name || "NeuroCine Project",
    lang: "ru",
    script: extra.script || "",
    storyboard,
    scenes: storyboard.scenes || [],
    prompts: (storyboard.scenes || []).map((s) => ({
      id: s.id,
      image_prompt: s.image_prompt_en,
      video_prompt: s.video_prompt_en,
      vo: s.vo_ru,
      sfx: s.sfx
    })),
    reference: extra.reference || null,
    refImage: extra.refImage || { dataUrl: "", fileName: "", mimeType: "", useAsAnchor: true },
    cover: extra.cover || null,
    seo: extra.seo || null,
    tts: extra.tts || {
      voice: "Russian cinematic documentary narrator",
      pace: "medium-fast",
      emotion: "dark, tense, controlled",
      audio: "clean voice, no hum, no background noise"
    },
    characters: storyboard.character_lock || [],
    created_at: new Date().toISOString()
  };
}
