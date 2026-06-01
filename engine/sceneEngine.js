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

  // ── HORROR SUBGENRES (Horror Style Pack) ──
  ghostSupernatural:
    `${ULTRA_REALISM} Nocturnal supernatural ghost horror — single cold practical light source (bare bulb, moonlight through blinds, phone screen glow), hard directional falloff into near-black, thin cold air haze, faint volumetric light shafts, oppressive negative space, an unseen presence implied just outside the light, cold teal-and-black grade with moonlit blue rim, deep readable shadow pockets, no visible CGI ghost, no glowing eyes, no subtitles, no UI, no watermark`,
  foundFootage:
    `${ULTRA_REALISM} Found-footage horror — handheld camcorder realism, slight camera shake and micro motion blur, harsh on-camera light with hot core and total-black falloff, optional night-vision infrared look (monochrome green, only subject retinas catching light), VHS/digicam artifacts: scanlines, chroma bleed, compression blocks, corner date-time stamp, low-resolution charm, heavy shadow grain, cheap-lens vignette, no clean cinematic grade, no tripod-smooth framing, no subtitles, no UI, no watermark`,
  psychologicalDread:
    `${ULTRA_REALISM} Psychological clinical dread — sterile cold interiors, uneasy near-symmetry, subtly wrong geometry, fluorescent overhead light with green-cyan cast, long static framing, excessive empty space around the subject, sickly skin tone, a quiet sense of being watched, desaturated institutional palette, no warm light, no gore, no obvious creature, no subtitles, no UI, no watermark`,
  folkHorror:
    `${ULTRA_REALISM} Folk horror daylight dread — overcast or low golden rural daylight, earthy organic world, weathered wood and wet soil, fog in the tree line, ritual objects, dread hidden inside a calm bright pastoral landscape, isolation and wrongness, muted greens and browns, deep wet natural shadows, restrained saturation, no night scene, no neon, no modern objects, no subtitles, no UI, no watermark`,
  grimeSlasher:
    `${ULTRA_REALISM} Gritty grindhouse slasher realism — dirty derelict interiors, flickering practical bulbs, hard raking light across grime and rust, sweat-soaked terrified subject, dust and debris, claustrophobic tight framing, threat implied through shadow and reaction not explicit gore, dirty amber-and-black grade, deep crushed blacks, no clean set, no glamour, no graphic mutilation, no subtitles, no UI, no watermark`,
  liminalUncanny:
    `${ULTRA_REALISM} Liminal-space uncanny horror — empty mundane interiors (corridors, stairwells, waiting rooms), buzzing fluorescent tubes, wrong sense of scale, repeating patterns, eerie stillness, no people or one tiny distant figure, flat yellow-green fluorescent wash, even near-shadowless light, slight overexposure, dated wallpaper and carpet tones, the feeling of a place that should not be entered, no dramatic lighting, no monster, no subtitles, no UI, no watermark`,

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
    `${ULTRA_REALISM} Brutalist minimal architectural drama — raw concrete texture with form-tie holes, oversized geometric voids, single hard sunlight beam through architectural cutout, monochromatic gray-beige palette with single accent color, human figure dwarfed by structure, no subtitles, no UI, no watermark`,

  hyperreal_8k:
    `RAW unretouched photograph, NOT CGI, NOT film — shot on RED Monstro 8K VV, Canon CN-E 50mm T1.3 prime lens, ISO 100 base. ` +
    `MAXIMUM DIGITAL SHARPNESS: razor-crisp edge definition at pixel level, zero motion blur (1/1000s shutter), ` +
    `zero sensor noise, zero film grain, zero lens vignette, zero chromatic aberration, zero soft focus. ` +
    `Hyperrealistic micro-detail: skin pores individually sharp, every fabric thread in weave visible, ` +
    `dust particles in air, surface scratches and material wear fully resolved at 8K density. ` +
    `Lighting: HDR precision — rich deep blacks with full shadow detail, brilliant peak whites without clipping, ` +
    `vibrant accurate color at maximum color volume. ` +
    `Color science: Rec.2020 wide gamut, DCI-P3 precision, maximum saturation without tonemapping crush, ` +
    `ultra-high contrast ratio as seen on OLED 8K reference display. ` +
    `FORBIDDEN: no film grain, no soft glow, no bokeh haze, no vintage treatment, no noise, no blur, ` +
    `no artistic degradation of any kind. Result: forensically sharp hyperrealistic image — ` +
    `like watching live 8K broadcast on reference display, every detail commercially perfect and crystal clear.`
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
    "static locked frame with tension in background",
    "over-shoulder reveal",
    "macro lens rack focus",
    "slow orbit with natural operator drift"
  ];
  return list[index % list.length];
}

export function inferSceneCount(script = "", totalDuration = 60) {
  const beats = splitScript(script);
  const plan = getDurationPlan(totalDuration);
  return Math.max(3, Math.min(plan.targetScenes, beats.length || plan.targetScenes));
}

function frameDuration(totalDuration, count) {
  const seconds = Number(totalDuration) || 60;
  const base = Math.max(2, Math.round(seconds / Math.max(1, count)));
  return Math.min(seconds <= 180 ? 6 : 10, base);
}

function fallbackStoryboard({
  topic = "",
  script = "",
  duration = 60,
  aspectRatio = "9:16",
  style = "cinematic",
  genre = "history"
} = {}) {
  const beats = splitScript(script);
  const count = Math.max(3, Math.min(getDurationPlan(duration).targetScenes, beats.length || 8));
  const sourceBeats = beats.length ? beats : [topic || "Opening mystery", "Evidence appears", "Final twist"];
  const lock = STYLE_LOCKS[style] || STYLE_LOCKS.cinematic;
  const d = frameDuration(duration, count);

  const scenes = Array.from({ length: count }).map((_, i) => {
    const beat = sourceBeats[i % sourceBeats.length];
    const bt = beatType(i, count);
    const shot = shotType(i);
    const camera = cameraMove(i);
    const emotion = emotionTag(beat, i);
    const imagePrompt = cleanText([
      `SCENE PRIMARY FOCUS: ${beat}`,
      `Shot: ${shot}`,
      `STYLE LOCK: ${lock}`,
      `Composition: documentary realism, ${aspectRatio}, subject in natural environment, no text overlay`,
      `NEGATIVE: ${NEGATIVE_LOCK}`
    ].join("\n"));
    const videoPrompt = ensureCharacterContinuityLine(cleanText([
      `ANIMATE CURRENT FRAME: ${beat}`,
      `Camera: ${camera}`,
      `Motion: subtle physical movement only, no scene change, no new characters` ,
      `VIDEO LOCK: ${VIDEO_LOCK}`,
      `SFX: natural room tone, cloth movement, environmental ambience, no music, no voiceover`
    ].join("\n")));

    return {
      id: pad(i),
      index: i + 1,
      beat_type: bt,
      duration: d,
      vo_ru: beat,
      description_ru: beat,
      description_en: beat,
      shot_type: shot,
      camera,
      emotion,
      sfx: "natural ambience, cloth rustle, footsteps, room tone",
      image_prompt_en: imagePrompt,
      video_prompt_en: videoPrompt,
      negative_prompt: NEGATIVE_LOCK,
      style_lock: lock,
      video_lock: VIDEO_LOCK,
      continuity: "same character identity, costume, lighting and environment across frames"
    };
  });

  return {
    title: topic || "NeuroCine Storyboard",
    topic,
    genre,
    aspect_ratio: aspectRatio,
    style,
    style_lock: lock,
    negative_lock: NEGATIVE_LOCK,
    video_lock: VIDEO_LOCK,
    scenes,
    frames: scenes,
    duration_plan: getDurationPlan(duration),
    export_meta: { target: "veo3", aspect_ratio: aspectRatio }
  };
}

export function normalizeStoryboard(raw = {}, options = {}) {
  const storyboard = raw?.storyboard || raw;
  const scenesRaw = storyboard?.scenes || storyboard?.frames || [];
  if (!Array.isArray(scenesRaw) || scenesRaw.length === 0) return fallbackStoryboard(options);
  const style = options.style || storyboard.style || "cinematic";
  const lock = STYLE_LOCKS[style] || storyboard.style_lock || STYLE_LOCKS.cinematic;

  const scenes = scenesRaw.map((scene, index) => {
    const beat = scene.vo_ru || scene.description_ru || scene.description_en || scene.action || scene.text || `Scene ${index + 1}`;
    const img = scene.image_prompt_en || scene.image_prompt || cleanText([
      `SCENE PRIMARY FOCUS: ${beat}`,
      `STYLE LOCK: ${lock}`,
      `NEGATIVE: ${NEGATIVE_LOCK}`
    ].join("\n"));
    const vid = ensureCharacterContinuityLine(scene.video_prompt_en || scene.video_prompt || cleanText([
      `ANIMATE CURRENT FRAME: ${beat}`,
      `Camera: ${scene.camera || cameraMove(index)}`,
      `Motion: subtle physical movement only, preserve uploaded frame`,
      `VIDEO LOCK: ${VIDEO_LOCK}`,
      `SFX: ${scene.sfx || "natural ambience, cloth rustle, footsteps"}`
    ].join("\n")));
    return {
      ...scene,
      id: scene.id || pad(index),
      index: scene.index || index + 1,
      duration: scene.duration || frameDuration(options.duration || storyboard.duration || 60, scenesRaw.length),
      beat_type: scene.beat_type || beatType(index, scenesRaw.length),
      vo_ru: beat,
      description_ru: scene.description_ru || beat,
      description_en: scene.description_en || beat,
      shot_type: scene.shot_type || shotType(index),
      camera: scene.camera || cameraMove(index),
      emotion: scene.emotion || emotionTag(beat, index),
      sfx: scene.sfx || "natural ambience, cloth rustle, footsteps",
      image_prompt_en: img,
      video_prompt_en: vid,
      negative_prompt: scene.negative_prompt || NEGATIVE_LOCK,
      style_lock: scene.style_lock || lock,
      video_lock: scene.video_lock || VIDEO_LOCK,
      continuity: scene.continuity || "same character identity, costume, lighting and environment across frames"
    };
  });

  return {
    ...storyboard,
    title: storyboard.title || options.topic || "NeuroCine Storyboard",
    topic: storyboard.topic || options.topic || "",
    aspect_ratio: storyboard.aspect_ratio || options.aspectRatio || "9:16",
    style,
    style_lock: lock,
    negative_lock: NEGATIVE_LOCK,
    video_lock: VIDEO_LOCK,
    scenes,
    frames: scenes,
    duration_plan: storyboard.duration_plan || getDurationPlan(options.duration || storyboard.duration || 60),
    export_meta: storyboard.export_meta || { target: "veo3", aspect_ratio: options.aspectRatio || "9:16" }
  };
}

export function buildLocalStoryboard(options = {}) {
  return fallbackStoryboard(options);
}

export function storyboardToProjectJson(storyboard = {}, extras = {}) {
  const scenes = Array.isArray(storyboard?.scenes)
    ? storyboard.scenes
    : Array.isArray(storyboard?.frames)
      ? storyboard.frames
      : [];
  return {
    neurocine_project_snapshot: true,
    version: "sceneEngine-project-export-v1",
    exported_at: new Date().toISOString(),
    project_name: storyboard?.project_name || storyboard?.title || extras?.projectName || "NeuroCine Project",
    script: extras?.script || storyboard?.script || storyboard?.full_script || "",
    storyboard: {
      ...storyboard,
      scenes,
    },
    director: extras?.director || {},
    export_meta: {
      ...(storyboard?.export_meta || {}),
      ...(extras?.export_meta || {}),
    },
  };
}

export default {
  STYLE_LOCKS,
  VIDEO_LOCK,
  NEGATIVE_LOCK,
  splitScript,
  getDurationPlan,
  inferSceneCount,
  normalizeStoryboard,
  buildLocalStoryboard,
  storyboardToProjectJson
};
