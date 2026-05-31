import { STYLE_LOCKS, VIDEO_LOCK, NEGATIVE_LOCK } from "./sceneEngine";

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanSfxText(value = "") {
  return cleanText(value)
    .replace(/\broom tone\b/gi, "near-silence")
    .replace(/\b(background|ambient|electrical|ventilation|low)?\s*hum\b/gi, "isolated material tick")
    .replace(/\bdrone bed\b|\bdrone\b/gi, "sparse silence")
    .replace(/\b(subtle|generic|environmental)?\s*ambience\b/gi, "clean physical SFX")
    .replace(/\bambient sound\b/gi, "clean physical SFX")
    .replace(/фонов(ый|ого|ому|ым)?\s+гул/gi, "точный близкий физический звук")
    .replace(/\bгул\b/gi, "короткий физический щелчок")
    .replace(/\s+/g, " ")
    .trim();
}

function scriptLineFor(frame = {}) {
  return cleanText(frame.vo_ru || frame.script_line_ru || frame.script_line || "");
}

function cellPositionName(index = 0, cols = 2) {
  const col = index % Math.max(1, cols);
  const row = Math.floor(index / Math.max(1, cols));
  const vertical = row === 0 ? "upper" : row === 1 ? "lower" : `row ${row + 1}`;
  const horizontal = col === 0 ? "left" : col === 1 ? "right" : `column ${col + 1}`;
  return `${vertical}-${horizontal} cell`;
}

export const PROJECT_TYPES = {
  film: {
    label: "Фильм / реализм",
    lock: "RAW photograph, NOT CGI, NOT rendered, NOT illustrated — real camera, real location, unposed documentary framing, natural light, physical imperfections, candid human presence"
  },
  animation: {
    label: "Мультфильм / animation",
    lock: "animation production design, clean readable silhouettes, controlled stylization, consistent character model"
  },
  anime: {
    label: "Аниме",
    lock: "cinematic anime direction, dramatic composition, consistent anime character model, controlled lighting"
  },
  comic: {
    label: "Комикс / graphic novel",
    lock: "graphic novel panels, bold composition, illustrated texture, cinematic comic-book framing"
  },
  music: {
    label: "Музыкальный клип",
    lock: "music video visual rhythm, stylized cinematic pacing, dynamic camera energy, strong atmosphere"
  }
};

export const STYLE_PRESETS = {
  cinematic: {
    label: "Cinematic documentary",
    family: "film",
    lock: STYLE_LOCKS.cinematic,
    accent: "#7c5cff",
    tagline: "Кинореализм · Veo / Kling / Sora baseline"
  },
  dark: {
    label: "Dark history thriller",
    family: "film",
    lock: STYLE_LOCKS.dark,
    accent: "#b35cff",
    tagline: "Историческая мрачность, тревога"
  },
  truecrime: {
    label: "True crime",
    family: "film",
    lock: STYLE_LOCKS.truecrime,
    accent: "#ff5b6c",
    tagline: "Forensic-документалистика"
  },
  war: {
    label: "War documentary",
    family: "film",
    lock: STYLE_LOCKS.war,
    accent: "#c79b5c",
    tagline: "Грязь, длиннофокус, репортажный взгляд"
  },
  // === 2026 PREMIUM ===
  neonNoir: {
    label: "Neon Noir",
    family: "film",
    lock: STYLE_LOCKS.neonNoir,
    accent: "#ff45e2",
    tagline: "Blade Runner · мокрый асфальт · неон"
  },
  synthwave80s: {
    label: "Synthwave 80s",
    family: "film",
    lock: STYLE_LOCKS.synthwave80s,
    accent: "#ff3eb5",
    tagline: "Retrowave grid · закат · хром"
  },
  cyberpunk: {
    label: "Cyberpunk megacity",
    family: "film",
    lock: STYLE_LOCKS.cyberpunk,
    accent: "#3ee0ff",
    tagline: "Голограммы · мегаполис · ночь"
  },
  vhsRetro: {
    label: "VHS / Super 8",
    family: "film",
    lock: STYLE_LOCKS.vhsRetro,
    accent: "#ff8a5c",
    tagline: "Зерно, тёплая ламповая ностальгия"
  },
  analogFilm: {
    label: "Analog film Kodak",
    family: "film",
    lock: STYLE_LOCKS.analogFilm,
    accent: "#e9b35c",
    tagline: "Portra 400 · золотой час"
  },
  mysticHorror: {
    label: "Mystic horror",
    family: "film",
    lock: STYLE_LOCKS.mysticHorror,
    accent: "#5cffd3",
    tagline: "Туман, свечи, сдержанный ужас"
  },
  // === HORROR SUBGENRES ===
  ghostSupernatural: {
    label: "Ghost / привидения",
    family: "film",
    lock: STYLE_LOCKS.ghostSupernatural,
    accent: "#6cd9ff",
    tagline: "Ночь, холодный свет, присутствие в темноте"
  },
  foundFootage: {
    label: "Found footage",
    family: "film",
    lock: STYLE_LOCKS.foundFootage,
    accent: "#7dff8a",
    tagline: "Найденная плёнка · IR · VHS-артефакты"
  },
  psychologicalDread: {
    label: "Psychological dread",
    family: "film",
    lock: STYLE_LOCKS.psychologicalDread,
    accent: "#9affd6",
    tagline: "Двойники, безумие, стерильная тревога"
  },
  folkHorror: {
    label: "Folk horror",
    family: "film",
    lock: STYLE_LOCKS.folkHorror,
    accent: "#a8c46a",
    tagline: "Деревня, ритуал, страх при свете дня"
  },
  grimeSlasher: {
    label: "Grime / slasher",
    family: "film",
    lock: STYLE_LOCKS.grimeSlasher,
    accent: "#ff7a4a",
    tagline: "Грязный реализм, подвал, погоня"
  },
  liminalUncanny: {
    label: "Liminal / backrooms",
    family: "film",
    lock: STYLE_LOCKS.liminalUncanny,
    accent: "#e8e06a",
    tagline: "Пустые коридоры, люминесцент, тишина"
  },
  scifiAtmospheric: {
    label: "Sci-Fi atmospheric",
    family: "film",
    lock: STYLE_LOCKS.scifiAtmospheric,
    accent: "#5c9aff",
    tagline: "Hard sci-fi · лаборатория · анаморф"
  },
  fantasyEpic: {
    label: "Fantasy epic",
    family: "film",
    lock: STYLE_LOCKS.fantasyEpic,
    accent: "#ffb05c",
    tagline: "Эпос · золотой свет · масштаб"
  },
  westernGritty: {
    label: "Western gritty",
    family: "film",
    lock: STYLE_LOCKS.westernGritty,
    accent: "#d97a4a",
    tagline: "Пыль, солнце, пот"
  },
  apocalyptic: {
    label: "Post-apocalypse",
    family: "film",
    lock: STYLE_LOCKS.apocalyptic,
    accent: "#7a8a5c",
    tagline: "Зарастающий бетон, ржавчина"
  },
  filmNoir: {
    label: "Film Noir B&W",
    family: "film",
    lock: STYLE_LOCKS.filmNoir,
    accent: "#a8a8a8",
    tagline: "1940s · контрастный ч/б · жалюзи"
  },
  brutalistMinimal: {
    label: "Brutalist minimal",
    family: "film",
    lock: STYLE_LOCKS.brutalistMinimal,
    accent: "#a39a8a",
    tagline: "Бетон, объёмы, минимализм"
  },
  hyperreal_8k: {
    label: "Hyperreal 8K",
    family: "film",
    lock: STYLE_LOCKS.hyperreal_8k,
    accent: "#00e5ff",
    tagline: "Максимальная чёткость · без мыла · 8K"
  },
  // === ANIMATION FAMILY ===
  animation2d: {
    label: "2D animation",
    family: "animation",
    lock: "2D cinematic animation, hand-painted backgrounds, expressive but grounded acting, clean shapes, consistent character sheet, no live-action photo realism",
    accent: "#7cd6ff",
    tagline: "Кадровая анимация, чистые формы"
  },
  animation25d: {
    label: "2.5D layered animation",
    family: "animation",
    lock: "2.5D animation, layered parallax-ready backgrounds, cinematic depth, painted textures, controlled character model, clean readable motion",
    accent: "#9ee0ff",
    tagline: "Параллакс, живопись, объём"
  },
  animation3d: {
    label: "3D cartoon premium",
    family: "animation",
    lock: "high-end 3D animated film look, stylized realistic materials, cinematic lighting, consistent character model, expressive posing",
    accent: "#ffb960",
    tagline: "Pixar-уровень кинематографии"
  },
  stopmotion: {
    label: "Stop motion craft",
    family: "animation",
    lock: "stop-motion miniature set look, handmade tactile materials, real fabric texture, imperfect physical puppets, cinematic tabletop lighting",
    accent: "#b88a5c",
    tagline: "Хендмейд, ткань, миниатюра"
  },
  cutoutPaper: {
    label: "Cutout paper craft",
    family: "animation",
    lock: "cutout paper craft animation, scanned paper and cardboard textures, hand-drawn elements, simple flat shadows, layered collage feel, magazine clipping motion, playful handmade pacing",
    accent: "#ff9966",
    tagline: "Бумага, коллаж, ножницы"
  },
  // === ANIME FAMILY ===
  animeDark: {
    label: "Dark anime",
    family: "anime",
    lock: "dark cinematic anime, dramatic shadows, detailed backgrounds, mature tone, consistent character sheet, filmic composition",
    accent: "#c84cff",
    tagline: "Мрачное аниме, кинокомпозиция"
  },
  animeShonenAction: {
    label: "Shonen action",
    family: "anime",
    lock: "high-energy shonen action anime, dynamic motion lines, intense impact frames, vibrant saturated palette, dramatic angles, consistent character sheet, expressive eyes",
    accent: "#ff5c4c",
    tagline: "Динамика, импакт-кадры, экшен"
  },
  animeSliceOfLife: {
    label: "Slice-of-life anime",
    family: "anime",
    lock: "soft pastel slice-of-life anime, warm key light, painterly background detail, gentle character acting, consistent character sheet, no aggressive shadows",
    accent: "#ffb6c8",
    tagline: "Тёплая повседневность, пастель"
  },
  ghibliInspired: {
    label: "Ghibli-inspired",
    family: "anime",
    lock: "Studio-Ghibli-influenced painterly anime, lush hand-painted nature, soft warm lighting, watercolor cloud detail, expressive subtle character animation, consistent character sheet",
    accent: "#8fd9b6",
    tagline: "Живописная природа, мягкость"
  },
  // === COMIC FAMILY ===
  graphicNovel: {
    label: "Graphic novel",
    family: "comic",
    lock: "dark graphic novel illustration, inked cinematic panels, textured shadows, strong silhouettes, controlled panel composition",
    accent: "#a8a8a8",
    tagline: "Чернильная графика, силуэты"
  },
  comicHalftone: {
    label: "Comic halftone pop",
    family: "comic",
    lock: "classic comic halftone print style, Ben-Day dot texture, bold ink outlines, flat saturated color fills, dynamic action posing, pop-art panel framing",
    accent: "#ffd23e",
    tagline: "Pop-art, точки, плакат"
  },
  // === MUSIC FAMILY ===
  musicVideo: {
    label: "Music video drive",
    family: "music",
    lock: "music-video visual rhythm, stylized cinematic pacing, dynamic camera energy, strong atmosphere, controlled color grade",
    accent: "#ff5c9e",
    tagline: "Клиповая динамика и грейд"
  }
};

const STYLE_FORMULA_LOCK = "STYLE FORMULA: style preset controls lens, camera behavior, color grade, contrast, grain, texture and lighting quality only; it must not introduce characters, props, locations, era, weather, costumes, signs or plot events";

export function getStyleProfile(projectType = "film", stylePreset = "cinematic") {
  const type = PROJECT_TYPES[projectType] || PROJECT_TYPES.film;
  const preset = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.cinematic;
  return {
    project_type: projectType,
    project_type_label: type.label,
    style_preset: stylePreset,
    style_label: preset.label,
    style_lock: `${type.lock}. ${preset.lock}. ${STYLE_FORMULA_LOCK}`,
    negative_lock: NEGATIVE_LOCK
  };
}

export function buildScenarioLock(storyboard = {}, script = "", styleProfile = {}) {
  const scenes = storyboard?.scenes || [];
  return {
    script,
    project_name: storyboard?.project_name || "NeuroCine Project",
    total_duration: storyboard?.total_duration || 60,
    aspect_ratio: storyboard?.aspect_ratio || "9:16",
    global_style_lock: styleProfile.style_lock || storyboard?.global_style_lock || STYLE_LOCKS.cinematic,
    global_video_lock: storyboard?.global_video_lock || VIDEO_LOCK,
    character_lock: storyboard?.character_lock || [],
    rules: [
      "Сценарий является законом: нельзя менять событие кадра, порядок истории или смысл VO.",
      "SOURCE OF TRUTH = script line / vo_ru: объекты, локации, действия, погода и эпоха должны иметь опору в строке сценария.",
      "Нельзя добавлять новых персонажей, новую эпоху, новую локацию или новый сюжетный поворот.",
      "Можно менять только операторский язык: ракурс, крупность, линзу, перспективу, композицию, глубину резкости.",
      "Style preset работает как формула камеры/света/цвета/фактуры и не может добавлять предметы, эпоху, локации, костюмы или персонажей.",
      "Reference/anchor images фиксируют визуальную непрерывность, но не добавляют новые сюжетные детали.",
      "Image prompts всегда на английском и начинаются с SCENE PRIMARY FOCUS:",
      "Video prompts всегда на английском и начинаются с ANIMATE CURRENT FRAME:",
      "SFX должен быть внутри video prompt и отдельно в поле sfx.",
      "Без субтитров, UI, watermark, надписей и современных объектов, если их нет в сценарии."
    ],
    frames: scenes.map((s) => ({
      id: s.id,
      start: s.start,
      duration: s.duration,
      action: s.description_ru,
      vo_ru: s.vo_ru,
      script_line_ru: scriptLineFor(s),
      sfx: s.sfx,
      image_prompt_en: s.image_prompt_en,
      video_prompt_en: s.video_prompt_en,
      continuity_note: s.continuity_note
    }))
  };
}

export function buildStoryGridPrompt(storyboard = {}, styleProfile = {}) {
  const scenes = storyboard?.scenes || [];
  const n = scenes.length || 12;
  const cols = n <= 8 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const aspect = storyboard?.aspect_ratio || "9:16";

  // Calculate overall image orientation
  // Cell aspect ratio: 9:16 = 0.5625 (tall), 16:9 = 1.777 (wide)
  const [aw, ah] = aspect.split(":").map(Number);
  const cellRatio = aw / ah;
  const gridRatio = (cols * cellRatio) / rows;
  // gridRatio < 1 = overall image is taller than wide (vertical)
  // gridRatio > 1 = overall image is wider than tall (horizontal)
  const overallOrientation = gridRatio < 1
    ? `tall vertical image (${cols} wide × ${rows} tall grid of ${aspect} cells)`
    : gridRatio < 1.3
    ? `near-square image (${cols}×${rows} grid of ${aspect} cells)`
    : `wide horizontal image (${cols} wide × ${rows} tall grid of ${aspect} cells)`;

  const charLock = (storyboard?.character_lock || [])
    .map(c => {
      const parts = [
        c.name,
        c.age ? `${c.age}y` : null,
        c.description || c.face_features || null,
        c.hair || null,
        c.clothing || null,
        c.physical_condition || null,
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join("\n");

  const framesEN = scenes.map((s, i) => {
    const en = (s.image_prompt_en || "")
      .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
      .trim();
    const sourceLine = scriptLineFor(s);
    const cellName = cellPositionName(i, cols);
    // Inject anti-2D style into every frame description
    const styleEnforce = "camera-photographed live-action image, shot on ARRI Alexa 65 Zeiss Master Prime T2.8, NOT CGI, NOT rendered, NOT illustrated, NOT cartoon, NOT anime, NOT painting — real camera, real location, real physics —";
    return `${cellName.toUpperCase()} — SOURCE LINE: ${sourceLine || "use storyboard frame only; do not invent missing details"} | ${styleEnforce} ${en || sourceLine || ""}`;
  }).join("\n");

  // Text inside generated image is forbidden.
const labelInstruction = `
TEXT RULE:
- Do NOT place any text inside the generated image.
- Do NOT add visible cell identifiers.
- Do NOT add frame-number text.
- Do NOT add captions, subtitles, UI, watermarks, or decorative text.
`;

  return `STORYBOARD GRID — ${storyboard.project_name || "NeuroCine Project"}

OVERALL IMAGE FORMAT: ${overallOrientation}
TOTAL FRAMES: ${n}
GRID LAYOUT: ${cols} columns × ${rows} rows — exactly ${n} equal cells

GRID GEOMETRY LOCK (CRITICAL — NON-NEGOTIABLE):
- If aspect is 9:16, the FINAL OUTPUT must be ONE SINGLE vertical 9:16 image.
- All frames must exist INSIDE that single 9:16 canvas.
- For 4 frames, use a strict 2×2 collage: two scenes on top, two scenes below.
- Internal cells are collage regions inside the vertical poster, not separate 9:16 pages.
- Use thin black separators only.
- No white margins.
- No storyboard sheet.
- No contact sheet.
- No film strip.
- No visible cell identifiers.
- No text.

CRITICAL LAYOUT RULES:
- Generate EXACTLY ${n} frames. Not ${n - 1}, not ${n + 1}. Exactly ${n}.
- Arrange in strict ${cols}×${rows} grid, equal-size cells, left-to-right top-to-bottom
- Every cell shows a different scene from the story in order
- Each cell is ${aspect} — ${aspect === "9:16" ? "portrait/vertical" : "landscape/horizontal"}
- No subtitles, no UI, no watermark, no visible cell identifiers, no frame-number text, no decorative text anywhere
${labelInstruction}

CRITICAL STYLE RULE — APPLY TO EVERY SINGLE CELL:
Every frame must be: camera-photographed live-action image, cinematic realism, film photography, NOT illustration, NOT 2D art, NOT cartoon, NOT anime, NOT painting, NOT sketch, NOT digital art style.
If any cell looks like illustration or 2D — the whole generation is REJECTED.

STYLE LOCK:
${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}

${charLock ? `CHARACTER LOCK — FACE MATCH PRIORITY: 1.0 (HARD LOCK)\nIDENTITY CONSISTENCY: EXACT MATCH REQUIRED — not approximated, not averaged.\nThe uploaded reference is a mandatory identity template, NOT a style suggestion.\n${charLock}\n` : ""}SCENARIO LOCK:
Do not change story order. Preserve same characters, locations, chronology, emotional logic and visual continuity across all ${n} cells.
Each cell content must follow its SOURCE LINE first. Do not add objects, locations, weather, era details or actions absent from that line.

FRAMES (in order, left-to-right, top-to-bottom):
${framesEN}`;
}

export function buildExplorePrompt(frame = {}, storyboard = {}, styleProfile = {}, variantCount = 4) {
  const base = (frame.image_prompt_en || "")
    .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
    .trim() || frame.description_ru || frame.vo_ru || "selected storyboard frame";
  const sourceLine = scriptLineFor(frame);

  const charLock = (storyboard?.character_lock || [])
    .map(c => `${c.name}: ${c.description}`)
    .join("\n");

  return `ULTRA CINEMATIC VARIATION GRID — DIRECTOR MODE

Create a single vertical 9:16 image arranged as a strict 2x2 grid containing 4 clearly distinct shot variations of the exact same locked storyboard frame: ${frame.id || "frame"}. Preserve the identical story event, character identity, wardrobe, location, time of day, emotional meaning, chronology, historical logic and genre across all four cells. Do not introduce new plot information or story-changing objects.

LOCKED FRAME ID: ${frame.id || "frame"}
TIME: ${frame.start ?? "?"}–${frame.end ?? "?"}s
SOURCE OF TRUTH SCRIPT LINE:
${sourceLine || "Use the locked storyboard frame only; do not invent missing story details."}

BASE SCENE (reproduce this exact visual in all 4 cells — only camera changes):
${base}

${charLock ? `CHARACTER LOCK — FACE MATCH PRIORITY: 1.0 (HARD LOCK) — MANDATORY IN ALL 4 CELLS\nIDENTITY: EXACT MATCH REQUIRED — reproduce exact face, bone structure, skin tone in every cell.\n${charLock}\n` : ""}STYLE LOCK: ${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}

SCENARIO LOCK — NON-NEGOTIABLE:
- same story event and props
- same character identity, face, age, wardrobe as described in CHARACTER LOCK above
- same location and time of day
- same emotional meaning
- same historical / genre logic
- no new characters, no new plot, no new objects that change the story
- no objects, weather, locations, actions or era details absent from SOURCE OF TRUTH SCRIPT LINE

ALLOWED VARIATION AXES ONLY:
- camera angle, camera height, lens feeling, framing, composition, camera distance, depth of field

MANDATORY VARIATIONS:
A — EXTREME CLOSE-UP: intimate detail-driven composition focused on the key element or tense facial detail; very shallow depth of field; emotional tension.
B — LOW / GROUND ANGLE: low camera position with strong foreground texture, emphasizing physical presence and perspective weight; same event and layout.
C — WIDE ENVIRONMENTAL: wider spatial view showing the full location geometry, all characters and props in context; isolation and readable environment.
D — OBSTRUCTED / OVER-SHOULDER: layered composition with partial foreground obstruction or over-shoulder framing, documentary voyeuristic feeling, deeper spatial layering.

OUTPUT: one single image, strict 2x2 grid, four compositions visibly different only through cinematography choices, no text, no subtitles, no UI, no watermark, no labels.

NEGATIVE: ${NEGATIVE_LOCK}`;
}

export function build2KPrompt(frame = {}, variant = "A", storyboard = {}, styleProfile = {}) {
  const sourceLine = scriptLineFor(frame);
  return `SCENE PRIMARY FOCUS: recreate the selected Variant ${variant} as ONE final high-quality 2K frame.\n\nLOCKED FRAME ID: ${frame.id || "frame"}\nLOCKED STORY ACTION: ${frame.description_ru || "Preserve selected storyboard action."}\nLOCKED VO MEANING: ${frame.vo_ru || "Preserve the original meaning."}\nSOURCE OF TRUTH SCRIPT LINE:\n${sourceLine || "Use the locked storyboard frame only; do not invent missing story details."}\n\nUSE THE UPLOADED SELECTED VARIANT AS THE VISUAL REFERENCE. Preserve its camera angle, composition, lens feeling, lighting direction, atmosphere, character pose and emotional tone.\n\nSTYLE LOCK:\n${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}\n\nSTRICT CONTINUITY:\n- do not change the character identity\n- do not change costume / character model\n- do not change location, time, story event or emotion\n- do not add objects, locations, weather, era details or actions absent from the script line\n- do not add text, subtitles, UI or watermark\n- keep the frame ready for image-to-video animation\n\nQUALITY:\n2K clean cinematic frame, sharp subject focus where appropriate, realistic material textures, natural imperfections, film-level detail, controlled grain.\n\nNEGATIVE:\n${NEGATIVE_LOCK}`;
}

export function buildLocalImageAnalysis(frame = {}, variant = "A", styleProfile = {}) {
  return {
    frame_id: frame.id || "frame",
    variant,
    camera: "preserve the uploaded frame angle, framing and lens feeling",
    lighting: "preserve the uploaded frame lighting and atmosphere",
    subject_motion: "micro-movements only, matching the locked story action",
    environment_motion: "subtle physical movement in air, cloth, dust, smoke or weather where relevant",
    emotion: frame.emotion || "preserve the original emotional meaning",
    continuity: "same character, same location, same story event, same style lock",
    sfx: cleanSfxText(frame.sfx || "clean close physical SFX, breath, fabric movement, silence between cues"),
    notes_ru: "Локальный анализ: изображение не было разобрано Vision-моделью, но video prompt будет построен строго по выбранному кадру и сценарию."
  };
}

export function buildVideoPrompt(frame = {}, analysis = {}, storyboard = {}, styleProfile = {}) {
  const sfx = cleanSfxText(analysis.sfx || frame.sfx || "clean close physical SFX, silence between cues");
  const sourceLine = scriptLineFor(frame);
  return `ANIMATE CURRENT FRAME:\n\nLOCKED FRAME ID: ${frame.id || "frame"}\n\nAnimate the uploaded locked frame according to the original storyboard action only.\n\nSOURCE OF TRUTH SCRIPT LINE:\n${sourceLine || "Use the locked storyboard frame only; do not invent missing story details."}\n\nSTORY ACTION LOCK:\n${frame.description_ru || "Preserve the selected frame story action."}\n\nVO MEANING LOCK:\n${frame.vo_ru || "Preserve the original voiceover meaning."}\n\nVISUAL LOCK FROM IMAGE ANALYSIS:\nCamera: ${analysis.camera || "preserve uploaded composition and lens feeling"}.\nLighting: ${analysis.lighting || "preserve uploaded lighting"}.\nEmotion: ${analysis.emotion || frame.emotion || "preserve emotional tone"}.\nContinuity: ${analysis.continuity || "same character, same location, same story event"}.\n\nMOTION DESIGN:\n${analysis.subject_motion || "Add restrained realistic micro-movements matching the locked script action."}\n${analysis.environment_motion || "Animate only environmental elements already visible in the uploaded frame; if none are visible, keep the environment still."}\n\nCAMERA BEHAVIOR:\nOrganic handheld micro-drift only unless the frame requires a slow push-in. No floaty movement, no sudden invented action, no scene change.\n\nSTYLE LOCK:\n${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}\n\nPHYSICAL REALISM:\n${storyboard.global_video_lock || VIDEO_LOCK}. Weight, inertia, friction, contact points and material response must feel real.\n\nSOUND LOCK:\nClean close-mic diegetic ASMR only. Use exact visible physical SFX and silence between cues. No background hum, drone, room tone, music bed or generic ambience.\n\nFORBIDDEN:\nDo not change character, face, costume, location, timeline, emotion, story event, VO meaning, style, era. Do not add objects, locations, weather, actions or characters absent from the script line. No subtitles, no UI, no watermark, no visible cell identifiers, no frame-number text, no decorative text.\n\nSFX: ${sfx}`;
}

/**
 * buildChunkGridPrompt — builds a story grid prompt for a CHUNK of scenes (e.g. frames 1–5 of 20)
 * Used when splitting 20 frames into 4 grids of 5.
 */
export function buildChunkGridPrompt(scenes = [], storyboard = {}, styleProfile = {}, chunkIndex = 0) {
  const n = scenes.length;
  const cols = n <= 4 ? 2 : n <= 6 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const aspect = storyboard?.aspect_ratio || "9:16";
  const totalScenes = storyboard?.scenes?.length || n;

  const [aw, ah] = aspect.split(":").map(Number);
  const cellRatio = aw / ah;
  const gridRatio = (cols * cellRatio) / rows;
  const overallOrientation = gridRatio < 1
    ? `tall vertical image (${cols}×${rows} grid of ${aspect} cells)`
    : `wide image (${cols}×${rows} grid of ${aspect} cells)`;

  const charLock = (storyboard?.character_lock || [])
    .map(c => {
      const parts = [
        c.name,
        c.age ? `${c.age}y` : null,
        c.description || c.face_features || null,
        c.hair || null,
        c.clothing || null,
        c.physical_condition || null,
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join("\n");

  const framesEN = scenes.map((s, i) => {
    const en = (s.image_prompt_en || "")
      .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
      .trim();
    const sourceLine = scriptLineFor(s);
    const cellName = cellPositionName(i, cols);
    const styleEnforce = "camera-photographed live-action image, NOT illustration, NOT 2D art, NOT cartoon —";
    return `${cellName.toUpperCase()} — SOURCE LINE: ${sourceLine || "use storyboard frame only; do not invent missing details"} | ${styleEnforce} ${en || sourceLine || ""}`;
  }).join("\n");

  return `STORYBOARD GRID PART ${chunkIndex + 1} — ${storyboard.project_name || "NeuroCine Project"}
FRAME COUNT: ${n} of ${totalScenes} total

OVERALL IMAGE FORMAT: ${overallOrientation}
GRID LAYOUT: ${cols} columns × ${rows} rows — exactly ${n} equal cells

IMPORTANT — TWO SEPARATE FORMAT RULES:
1. EACH CELL format: ${aspect} — every individual frame must be ${aspect === "9:16" ? "tall vertical (portrait)" : aspect}
2. ${aspect === "9:16" && n === 4 ? "OVERALL IMAGE: one single vertical 9:16 canvas with a strict 2×2 collage inside it" : `OVERALL IMAGE: one single ${cols}×${rows} grid canvas made of equal photographic cells`}

CRITICAL: This is PART ${chunkIndex + 1} of a multi-part storyboard. Visual style, characters, and world must be IDENTICAL to all other parts.

CRITICAL LAYOUT RULES:
- Generate EXACTLY ${n} frames. Exactly ${n}.
- Strict ${cols}×${rows} grid, equal-size cells, each cell ${aspect}

TEXT RULE:
- No text inside image.
- No visible cell identifiers.
- No frame-number text.

CRITICAL STYLE RULE — EVERY CELL:
Every frame must be: camera-photographed live-action image, cinematic realism, NOT illustration, NOT 2D art, NOT cartoon, NOT anime, NOT painting. Any cell that looks like illustration = REJECTED.

STYLE LOCK (must match ALL other grid parts exactly):
${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}

${charLock ? `CHARACTER LOCK — FACE MATCH PRIORITY: 1.0 (HARD LOCK) — IDENTICAL IN ALL PARTS\nIDENTITY CONSISTENCY: EXACT MATCH REQUIRED — same face bone structure skin tone distinguishing features in every part.\n${charLock}\n` : ""}SCENARIO LOCK:
Continuous story — preserve character identity, location logic, emotional arc and visual continuity across ALL grid parts.
SOURCE LINE is the highest authority for each cell. Do not add objects, locations, weather, era details or actions absent from that frame's source line.

FRAMES IN THIS PART (in order, left-to-right, top-to-bottom):
${framesEN}`;
}

/**
 * buildContinuationPrompt — CHAIN CONTINUATION
 * Takes the last 1–3 anchor frames from the previous grid and generates
 * a continuation prompt for the next grid chunk.
 * anchorFrames = array of { scene, croppedDataUrl } from the previous grid
 */
export function buildContinuationPrompt(anchorFrames = [], nextScenes = [], storyboard = {}, styleProfile = {}, chunkIndex = 1) {
  const n = nextScenes.length;
  const cols = n <= 4 ? 2 : n <= 6 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const aspect = storyboard?.aspect_ratio || "9:16";
  const totalScenes = storyboard?.scenes?.length || n;
  const globalOffset = chunkIndex * (totalScenes / Math.ceil(totalScenes / n) || n);

  const charLock = (storyboard?.character_lock || [])
    .map(c => {
      const parts = [
        c.name,
        c.age ? `${c.age}y` : null,
        c.description || c.face_features || null,
        c.hair || null,
        c.clothing || null,
        c.physical_condition || null,
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join("\n");

  const anchorDesc = anchorFrames.map((a, i) =>
    `Anchor ${i + 1} — ${a.scene?.id || `frame`}: ${
      (a.scene?.image_prompt_en || "").replace(/^SCENE PRIMARY FOCUS:\s*/i, "").trim().slice(0, 120)
    }`
  ).join("\n");

  const framesEN = nextScenes.map((s, i) => {
    const en = (s.image_prompt_en || "")
      .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
      .trim();
    const sourceLine = scriptLineFor(s);
    const cellName = cellPositionName(i, cols);
    return `${cellName.toUpperCase()} — SOURCE LINE: ${sourceLine || "use storyboard frame only; do not invent missing details"} | ${en || sourceLine || ""}`;
  }).join("\n");

  return `CHAIN CONTINUATION — STORYBOARD GRID PART ${chunkIndex + 1}
PROJECT: ${storyboard.project_name || "NeuroCine Project"}
FRAMES: next ${n} frames of ${totalScenes} total
FORMAT: Vertical ${aspect}
GRID LAYOUT: ${cols} columns × ${rows} rows — exactly ${n} equal cells

⚠️ THIS IS A DIRECT CONTINUATION — NOT A NEW SCENE, NOT A NEW STORY.

ANCHOR REFERENCE (the images attached are your visual anchor — the last frames of the previous grid):
${anchorDesc || "Use the attached reference images as your visual anchor."}

CONTINUATION RULES — NON-NEGOTIABLE:
- Use the provided anchor images as the PRIMARY visual reference
- PRESERVE exactly: character identity, faces, clothing, hair, age, body build
- PRESERVE exactly: lighting direction, color temperature, film grain, lens character
- PRESERVE exactly: location logic, time of day, environmental atmosphere
- PRESERVE exactly: cinematic style and mood
- This is frame ${Math.round(globalOffset) + 1} onward — the story continues from where the anchor left off
- No new characters unless logically introduced in the script
- No style reset, no new world, no new visual language
- Next-frame content must follow each SOURCE LINE; anchor images preserve continuity only

STYLE LOCK (must be identical to previous grid):
${styleProfile.style_lock || storyboard.global_style_lock || STYLE_LOCKS.cinematic}

${charLock ? `CHARACTER LOCK — FACE MATCH PRIORITY: 1.0 (HARD LOCK) — MUST MATCH PREVIOUS GRID EXACTLY\nIDENTITY CONSISTENCY: EXACT MATCH REQUIRED — reference image is law, not suggestion.\n${charLock}\n` : ""}CRITICAL LAYOUT RULES:
- Generate EXACTLY ${n} frames. Exactly ${n}.
- Arrange in strict ${cols}×${rows} grid, equal-size cells, each cell ${aspect}
- No visible cell identifiers, no frame-number text, no captions, no subtitles, no UI, no watermark

NEXT FRAMES TO GENERATE (in order):
${framesEN}

FORBIDDEN:
- New visual style or new color grade
- New character design or face
- Scene that contradicts the attached anchor images
- Scene content absent from the current frame SOURCE LINE
- Any reset of lighting, environment or mood`;
}

export function compactFrameForModel(frame = {}) {
  return {
    id: frame.id,
    start: frame.start,
    duration: frame.duration,
    beat_type: frame.beat_type,
    emotion: frame.emotion,
    description_ru: frame.description_ru,
    image_prompt_en: frame.image_prompt_en,
    video_prompt_en: frame.video_prompt_en,
    vo_ru: frame.vo_ru,
    script_line_ru: scriptLineFor(frame),
    sfx: frame.sfx,
    camera: frame.camera,
    continuity_note: frame.continuity_note,
    safety_note: frame.safety_note
  };
}
