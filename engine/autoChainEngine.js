// NeuroCine Auto-Chain Strict Engine v2.2 — Legacy Live-Action Lock
// Separate optional engine: does not replace storyboard/director engines.
// Purpose: build chained storyboard PART prompts and video prompt packs strictly from existing storyboard scenes.
// V2.2 fix: the visual core is forced back to the old successful live-action / camera-photographed style.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripPromptPrefix(value = "") {
  return cleanText(value)
    .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
    .replace(/^ANIMATE CURRENT FRAME:\s*/i, "");
}

function frameNumber(scene, index = 0) {
  const raw = String(scene?.id || "").match(/\d+/)?.[0];
  return raw ? Number(raw) : index + 1;
}

function frameLabel(scene, index = 0) {
  return `F${String(frameNumber(scene, index)).padStart(2, "0")}`;
}

// ── Appearance stripping ─────────────────────────────────────────────────────
// Action triggers — слова с которых начинается ДЕЙСТВИЕ персонажа
// (всё до них = внешность, всё после = действие + локация)
// Триггеры — слова с которых начинается ДЕЙСТВИЕ персонажа (всё до них = внешность)
const ACTION_TRIGGERS = [
  // Present participles
  "lying ", "kneeling ", "standing ", "sitting ", "running ", "walking ",
  "crouching ", "reaching ", "carrying ", "dropping ", "staring ",
  "pushing ", "pulling ", "dragging ", "watching ", "facing ",
  "frozen ", "freezing ", "hunched ", "hunching ", "collapses ", "collapsing ",
  "leaning ", "gazing ", "holding ", "moving ", "crossing ", "entering ",
  "following ", "pressing ", "gripping ", "recoiling ", "stumbling ",
  "turning ", "looking ", "waiting ", "kneeling ", "bowing ", "rising ",
  "stepping ", "walking ", "climbing ", "descending ", "working ", "carrying ",
  "lifting ", "dragging ", "digging ", "hauling ", "straining ",
  // Simple present / other forms
  "stands ", "sits ", "lies ", "kneels ", "faces ",
  "enters ", "turns ", "moves ", "grips ", "freezes ", "recoils ",
  "appears ", "appear ", "reaches ", "looks on", "bends ",
  // Descriptive action phrases
  "bent ", "seated ", "crouched ", "hunched ", "in final ",
  // Edge cases
  "mid-step", "mid-stride", "mid-motion", "in position",
];

// Простая транслитерация кириллицы → латиница для поиска имён в промтах
function translitName(str) {
  const map = {
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z",
    "и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r",
    "с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh",
    "щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
    "А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ё":"Yo","Ж":"Zh","З":"Z",
    "И":"I","Й":"Y","К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","Р":"R",
    "С":"S","Т":"T","У":"U","Ф":"F","Х":"Kh","Ц":"Ts","Ч":"Ch","Ш":"Sh",
    "Щ":"Shch","Ъ":"","Ы":"Y","Ь":"","Э":"E","Ю":"Yu","Я":"Ya"
  };
  return str.split("").map(c => map[c] !== undefined ? map[c] : c).join("");
}

function stripCharacterAppearance(text, characterLock = []) {
  if (!characterLock.length || !text) return text;
  let result = text;
  for (const char of characterLock) {
    const name = cleanText(char.name || "");
    if (!name) continue;

    // Ищем имя и его транслит-вариант (для кириллических имён в латинских промтах)
    const nameTranslit = translitName(name);
    const candidates = [name];
    if (nameTranslit !== name) candidates.push(nameTranslit);
    // Также пробуем только первое слово (имя без фамилии) на случай частичного совпадения
    const firstName = name.split(" ")[0];
    const firstNameTranslit = translitName(firstName);
    if (!candidates.includes(firstName)) candidates.push(firstName);
    if (!candidates.includes(firstNameTranslit)) candidates.push(firstNameTranslit);

    let nameIdx = -1;
    let foundName = "";
    for (const candidate of candidates) {
      const idx = result.indexOf(candidate);
      if (idx !== -1 && (nameIdx === -1 || idx < nameIdx)) {
        nameIdx = idx;
        foundName = candidate;
      }
    }
    if (nameIdx === -1) continue;

    const afterName = result.slice(nameIdx + foundName.length);

    // Если сразу после имени нет запятой — внешность уже убрана, пропускаем
    const trimmedAfter = afterName.trimStart();
    if (!trimmedAfter.startsWith(",")) continue;

    let actionStart = -1;
    const afterLower = afterName.toLowerCase();
    for (const trigger of ACTION_TRIGGERS) {
      const idx = afterLower.indexOf(trigger);
      if (idx !== -1 && (actionStart === -1 || idx < actionStart)) {
        actionStart = idx;
      }
    }

    if (actionStart > 0 && actionStart < 600) {
      // Нашли триггер — отрезаем описание внешности
      result =
        result.slice(0, nameIdx + foundName.length) +
        " " +
        afterName.slice(actionStart).trim();
    } else {
      // Fallback: триггер не найден, но есть запятые — берём от первой точки
      const dotIdx = afterName.indexOf(". ");
      if (dotIdx > 0 && dotIdx < 600) {
        result =
          result.slice(0, nameIdx + foundName.length) +
          afterName.slice(dotIdx).trim();
      }
    }
  }
  return cleanText(result);
}
// ─────────────────────────────────────────────────────────────────────────────

function sceneText(scene = {}, { characterLock = [], appearanceMode = "full" } = {}) {
  const raw = stripPromptPrefix(
    scene.image_prompt_en || scene.description_en || scene.description_ru || scene.vo_ru || ""
  );
  if (appearanceMode === "minimal" && characterLock.length) {
    return stripCharacterAppearance(raw, characterLock);
  }
  return raw;
}

function sceneMotion(scene = {}) {
  return stripPromptPrefix(scene.video_prompt_en || scene.motion || scene.description_ru || scene.vo_ru || "");
}

function getShotType(scene = {}, i = 0) {
  const shots = ["wide establishing shot", "handheld medium shot", "close-up", "over-the-shoulder shot"];
  return cleanText(scene.shot_type || scene.camera || shots[i % shots.length]);
}

const LEGACY_LIVE_ACTION_STYLE_LOCK = `CRITICAL VISUAL RULE — OLD NEUROCINE LIVE-ACTION LOOK:
Every single cell must look like a camera-photographed live-action film still.
This is NOT an illustrated storyboard, NOT concept art, NOT a painted storyboard page, NOT parchment art.
The final image must look like real cinematic photographs arranged in a clean grid.

MANDATORY STYLE LOCK:
live-action cinematic realism, camera-photographed image, natural imperfections, documentary physical reality, dark historical documentary thriller, tense realism, gritty texture, smoke, mud, damp stone, filthy wood, cold overcast light, realistic faces, realistic skin pores, dirty hands, wet fabric, 35mm anamorphic lens, Kodak Vision3 500T film grain, shallow depth of field, handheld documentary feel, high dynamic range but natural, no stylized fantasy rendering.

CELL RULE:
Each frame/cell is a separate live-action cinematic shot from the same film universe.
Do not create a parchment page, drawn card, comic panel, sketch board, illustration sheet, or painted concept sheet.
Grid borders are allowed only as simple thin black separators between photographic frames.`;

const HARD_NEGATIVE_VISUAL_LOCK = `NEGATIVE VISUAL LOCK — REJECT IF PRESENT:
NO parchment background, NO paper texture, NO old manuscript look, NO beige canvas, NO drawn storyboard, NO painted storyboard, NO illustration, NO concept art, NO 2D art, NO cartoon, NO anime, NO comic style, NO sketch, NO painterly brush strokes, NO digital painting look, NO fantasy poster, NO stylized rendering, NO clean fantasy armor, NO modern objects, NO modern clothes, NO subtitles, NO UI, NO watermark, NO decorative captions, NO extra text except the requested frame labels.`;

export function splitScenesIntoParts(scenes = [], partSize = 4) {
  const size = Math.max(1, Number(partSize) || 4);
  const parts = [];
  for (let i = 0; i < scenes.length; i += size) {
    parts.push(scenes.slice(i, i + size));
  }
  return parts;
}

export function buildWorldLock({ storyboard, styleProfile, chainMode = "worldHero", strictLevel = "hard" } = {}) {
  const sourceStyle = cleanText(styleProfile?.style_lock || storyboard?.global_style_lock || "");
  const world = cleanText(storyboard?.world_lock || storyboard?.project_type || "same cinematic universe");
  const chars = Array.isArray(storyboard?.character_lock) ? storyboard.character_lock : [];
  const heroLine = chars.length
    ? chars.map((c, i) => `${c.name || `Character ${i + 1}`}: ${cleanText([c.description, c.age, c.clothing, c.hair, c.face_features, c.physical_condition].filter(Boolean).join("; "))}`).join("\n")
    : "If the script repeats the same hero, keep the same face, proportions, clothing and emotional state whenever that hero appears. If the current frame is WORLD-only, do not force the hero into it.";

  return `AUTO-CHAIN STRICT ENGINE — SOURCE-OF-TRUTH MODE

SOURCE OF TRUTH:
Use ONLY the provided storyboard scenes from the existing Scenario/Storyboard.
Do NOT invent new plot events, new locations, new actions, or new important objects.
If a detail is not present in a frame description, keep it neutral and minimal.
Camera choice and composition may be cinematic, but story content must stay literal.

CHAIN MODE:
${chainMode === "worldOnly" ? "WORLD ONLY — characters may change when the scenario changes, but the same world/style must remain locked." : "WORLD + HERO — the world stays locked, and recurring hero identity stays locked whenever the scenario returns to that hero."}

STRICTNESS:
${strictLevel === "maximum" ? "MAXIMUM — literal execution only. No decorative narrative expansion." : strictLevel === "soft" ? "SOFT — keep cinematic polish, but never contradict the scenario." : "HARD — cinematic framing is allowed, but story content must remain literal."}

${LEGACY_LIVE_ACTION_STYLE_LOCK}

PROJECT STYLE FROM ORIGINAL ENGINE:
${sourceStyle || "Use the old NeuroCine dark historical documentary thriller look exactly."}

WORLD LOCK:
All frames exist in the SAME cinematic universe.
World identity: ${world}
Maintain the same historical period, environment logic, lighting family, color grading, texture density, lens language and documentary realism across all generated PARTS.

HERO / CHARACTER LOCK:
${heroLine}
Do not force the hero into a frame where the scenario does not include them.
Do not replace a recurring hero with a different face when the hero appears.
World-only frames may show other people, but they must belong to the same world and style.

REFERENCE RULE:
Use uploaded reference images only as VISUAL DNA: style, lighting, texture, world continuity and recurring hero identity.
Do NOT copy the same composition into every new frame.
Do NOT make every cell a portrait of the reference hero.
New frames must follow their own scenario descriptions.

${HARD_NEGATIVE_VISUAL_LOCK}`;
}

function frameRoleHint(localIdx = 0, chainMode = "worldHero") {
  if (chainMode === "worldOnly") return "WORLD FRAME — prioritize the scenario environment/action; characters may change according to the script.";
  const roles = [
    "HERO OR CORE ACTION FRAME — if the scenario contains the recurring hero, keep identity locked; otherwise follow the scenario literally.",
    "WORLD FRAME — show the environment/event from the scenario; do not force the hero if not described.",
    "DETAIL FRAME — show the exact object/body/detail from the scenario; keep live-action macro realism.",
    "HERO / CONSEQUENCE FRAME — if the scenario returns to the hero, keep identity locked; otherwise show the described consequence/event."
  ];
  return roles[localIdx % roles.length];
}



function compactSceneText(scene = {}, { characterLock = [], appearanceMode = "full" } = {}) {
  let text = sceneText(scene, { characterLock, appearanceMode });
  text = String(text || "")
    .replace(/\s*visible skin pores[\s\S]*$/i, "")
    .replace(/\s*ARRI Alexa[\s\S]*$/i, "")
    .replace(/\s*ASPECT RATIO:[\s\S]*$/i, "")
    .replace(/\s*Subject:[\s\S]*$/i, "")
    .replace(/\s*Camera:[\s\S]*$/i, "")
    .replace(/\s*Lighting:[\s\S]*$/i, "")
    .replace(/\s*Color grade:[\s\S]*$/i, "")
    .replace(/\s*Realism anchors:[\s\S]*$/i, "")
    .replace(/\s*Format:[\s\S]*$/i, "");
  text = cleanText(text);
  return text.length > 360 ? text.slice(0, 357).trim() + "..." : text;
}

function compactCharacterLock(storyboard = {}) {
  const chars = Array.isArray(storyboard?.character_lock) ? storyboard.character_lock : [];
  if (!chars.length) return "If the same character returns, keep face, age, clothing and condition consistent with the storyboard.";
  return chars.slice(0, 4).map((c, i) => {
    const name = cleanText(c.name || `Character ${i + 1}`);
    const parts = [c.age ? `${c.age}y` : "", c.face_features, c.hair, c.clothing, c.physical_condition]
      .filter(Boolean).map(v => cleanText(v));
    const desc = cleanText(parts.join(", "));
    return `${name} — ${desc.length > 220 ? desc.slice(0, 217).trim() + "..." : desc}`;
  }).join("\n");
}

export function buildFlowCompactPartPrompt({
  storyboard, styleProfile, partScenes = [], partIndex = 0, totalScenes = 0,
  partSize = 4, chainMode = "worldHero", strictLevel = "hard",
  referenceMode = "previousPart", appearanceMode = "full", continuityMode = "smart"
} = {}) {
  if (!partScenes.length) return "";
  const characterLock = storyboard?.character_lock || [];
  const start = frameNumber(partScenes[0], partIndex * partSize);
  const end = frameNumber(partScenes[partScenes.length - 1], partIndex * partSize + partScenes.length - 1);
  const rows = Math.ceil(partScenes.length / 2);
  const labels = partScenes.map((s, i) => frameLabel(s, partIndex * partSize + i));
  const isFirstPart = partIndex === 0;

  const referenceLines = [];
  if (isFirstPart) {
    if (referenceMode !== "previousPart") referenceLines.push("Use uploaded Hero Anchor only for recurring hero identity/style DNA. Do not copy its pose or composition.");
    else referenceLines.push("No Previous PART is required for PART 1. Follow the storyboard and style lock.");
  } else {
    if (referenceMode === "heroAndPrevious") referenceLines.push("Use uploaded Hero Anchor for recurring hero identity. Use uploaded Previous PART only for world/style DNA. Do not copy previous compositions.");
    else if (referenceMode === "heroOnly") referenceLines.push("Use uploaded Hero Anchor for recurring hero identity only. Do not force the hero into frames where the scenario does not include them.");
    else referenceLines.push("Use uploaded Previous PART only for world/style DNA. Do not copy the same composition.");
  }
  if (continuityMode === "smart") {
    referenceLines.push("Smart Continuity: preserve the same style, light, era and production design, but every cell must be a new shot with a new composition.");
  }
  if (appearanceMode === "minimal") {
    referenceLines.push("Appearance mode: take faces/identity from anchors; frame text should drive action, location and camera only.");
  }

  const frames = partScenes.map((s, localIdx) => {
    const label = frameLabel(s, partIndex * partSize + localIdx);
    const visual = compactSceneText(s, { characterLock, appearanceMode });
    const shot = getShotType(s, localIdx);
    const sfx = cleanText(s.sfx || "subtle ambience");
    return `${label} — ${visual}\nCamera: ${shot}. SFX mood: ${sfx}.`;
  }).join("\n\n");

  return `STORYBOARD GRID PART ${partIndex + 1} — FLOW COMPACT PROMPT\nFRAMES: F${String(start).padStart(2, "0")}–F${String(end).padStart(2, "0")} of ${totalScenes || storyboard?.scenes?.length || end} total\n\nGenerate exactly ${partScenes.length} live-action cinematic frames in a clean 2×${rows} grid. Each cell is vertical 9:16 portrait. Use thin black separators. Labels only: ${labels.join(", ")} in small white text top-left. No other text, no subtitles, no UI, no watermark.\n\nSTYLE LOCK:\ndark historical documentary realism, live-action camera-photographed film stills, cold overcast natural light, damp stone, smoke, mud, filthy wood, realistic skin, dirty hands, worn fabric, shallow depth of field, subtle 35mm film grain, natural handheld documentary feel. Not illustration, not painting, not parchment, not fantasy art, not CGI.\n\nCONTINUITY:\n${referenceLines.join("\n")}\n\nCHARACTER LOCK:\n${compactCharacterLock(storyboard)}\n\nFRAMES:\n${frames}\n\nFINAL CHECK:\nExactly ${partScenes.length} frames. ${labels.join("–")} only. Same cinematic world. New camera angle and composition in every cell. Do not invent new plot events, animals, modern objects, parchment, illustration, captions or UI.`;
}

function buildContinuityModeBlock({ continuityMode = "smart", chainMode = "worldHero", partIndex = 0 } = {}) {
  if (continuityMode === "standard") {
    return `CONTINUITY MODE — STANDARD:
Use the storyboard and style lock normally. Keep the project genre, era and tone consistent, but do not force exact visual continuity between unrelated frames.`;
  }

  if (continuityMode === "anchor") {
    return `CONTINUITY MODE — ANCHOR:
Use uploaded Hero Anchor and/or Previous PART as strong visual references.
LOCK: recurring hero identity, wardrobe logic, world texture, lighting family and color grade when those elements are present in the scenario.
IMPORTANT: do not force the hero into frames where the scenario does not include the hero.
AVOID: copying the exact same composition from the reference image unless the scenario explicitly requires the same shot.`;
  }

  return `CONTINUITY MODE — SMART CONTINUITY / STYLE LOCKED, COMPOSITION FREE:
Maintain the SAME cinematic style, lighting family, color grading, lens language, historical world texture and documentary realism across all frames.
Do NOT clone the previous PART. Use Previous PART only as world/style DNA, not as a layout to copy.
Each frame MUST be visually distinct:
- different camera angle
- different shot size
- different subject placement
- different focal point
- different foreground / midground / background relationship
SHOT PROGRESSION GUIDE for a 4-frame PART:
Cell 1: establishing or threat-detail hook
Cell 2: medium human / action frame
Cell 3: object/detail / evidence frame
Cell 4: emotional close-up or consequence frame
FORBIDDEN:
- repeating the same camera position
- repeating the same composition layout
- duplicating a previous frame with small variations
- adding characters, animals, modern objects or events not present in the scenario
This is a cinematic sequence progression, not variations of the same shot.`;
}

export function buildAutoChainPartPrompt({
  storyboard, styleProfile, partScenes = [], partIndex = 0, totalScenes = 0,
  partSize = 4, chainMode = "worldHero", strictLevel = "hard",
  referenceMode = "previousPart", appearanceMode = "full", continuityMode = "smart"
} = {}) {
  if (!partScenes.length) return "";
  const characterLock = storyboard?.character_lock || [];
  const start = frameNumber(partScenes[0], partIndex * partSize);
  const end   = frameNumber(partScenes[partScenes.length - 1], partIndex * partSize + partScenes.length - 1);
  const rows  = Math.ceil(partScenes.length / 2);
  const isFirstPart = partIndex === 0;

  const baseRefText = isFirstPart
    ? (referenceMode === "previousPart"
        ? "PART 1 has no previous PART. If a previous reference is uploaded, use it only as loose world/style DNA, not as story continuity."
        : "PART 1: use the uploaded HERO ANCHOR image for recurring hero identity and visual DNA. There is no previous PART yet. Do not copy the anchor composition into every cell.")
    : referenceMode === "heroAndPrevious"
      ? "Use the uploaded HERO ANCHOR image and the uploaded PREVIOUS PART image as references. Hero anchor fixes recurring hero identity; previous PART fixes world/style continuity. Do not copy their compositions."
      : referenceMode === "heroOnly"
        ? "Use the uploaded HERO ANCHOR image only for recurring hero identity and style DNA. Do not force the hero into frames where the scenario does not include him/her."
        : "Use the uploaded PREVIOUS PART image as visual reference for world/style continuity. Do not copy the same composition.";

  const refText = continuityMode === "smart"
    ? `${baseRefText}
SMART CONTINUITY OVERRIDE: uploaded references are style/world DNA only. Preserve atmosphere and production design, but every frame must be a new shot with a new composition.`
    : continuityMode === "standard"
      ? "Standard mode: references are optional and loose. Follow the storyboard scenario first."
      : baseRefText;

  // Подсказка для режима minimal
  const appearanceNote = appearanceMode === "minimal"
    ? "\nAPPEARANCE MODE — ANCHOR PRIORITY:\nCharacter physical appearance is intentionally omitted from frame descriptions. Use the uploaded HERO ANCHOR image as the sole source of truth for character faces, proportions and visual identity. Do NOT invent a new face based on text.\n"
    : "";

  const frameBlocks = partScenes.map((s, localIdx) => {
    const globalIdx = partIndex * partSize + localIdx;
    const label     = frameLabel(s, globalIdx);
    const sceneTxt  = sceneText(s, { characterLock, appearanceMode });
    return `${label}:
${frameRoleHint(localIdx, chainMode)}
MANDATORY VISUAL PREFIX: camera-photographed live-action image, NOT illustration, NOT 2D art, NOT painting, NOT concept art.
SCENARIO INPUT (STRICT): ${sceneTxt}
SHOT TYPE: ${getShotType(s, localIdx)}
COMPOSITION RULE: visualize only the described action/subject/environment; keep cinematic composition but do not add new story events.
SFX NOTE: ${cleanText(s.sfx || "")}`;
  }).join("\n\n");

  return `STORYBOARD GRID PART ${partIndex + 1} — AUTO-CHAIN STRICT CONTINUATION
FRAMES: F${String(start).padStart(2, "0")}–F${String(end).padStart(2, "0")} of ${totalScenes || storyboard?.scenes?.length || end} total

REFERENCE INPUT:
${refText}
This PART must continue the same project, but each frame must follow its own scenario input.
${appearanceNote}
FORMAT:
2 columns × ${rows} rows — exactly ${partScenes.length} equal cells.
Each cell format: 9:16 portrait.
Overall image: natural grid canvas made of photographic frames, do NOT force the overall canvas to 9:16.
Use simple black separators between frames. Do NOT use parchment, beige paper, decorative background, or illustrated page layout.

FRAME LABELS:
${partScenes.map((s, i) => frameLabel(s, partIndex * partSize + i)).join(", ")} only.
Small white text, top-left corner of each cell.
No other text.

${buildWorldLock({ storyboard, styleProfile, chainMode, strictLevel })}

${buildContinuityModeBlock({ continuityMode, chainMode, partIndex })}

MOTION / EDITING CONTINUITY:
The PART should feel like a sequence cut from the same film.
Maintain timeline order left-to-right, top-to-bottom.
No teleportation unless the scenario itself changes location.
Scene changes are allowed ONLY when the scenario frame describes a new place/action.

NETFLIX-STYLE RHYTHM WITHOUT INVENTING:
Use the scenario as written, but keep the rhythm readable:
- core hero/action frames return to the recurring hero only if the scene includes him/her;
- world frames expand the same universe;
- detail frames show exact details from the scenario;
- no new plot content.

FRAMES IN THIS PART:
${frameBlocks}

FINAL CHECK:
Exactly ${partScenes.length} frames.
Every frame matches its SCENARIO INPUT only.
Same old NeuroCine live-action style across all cells.
Recurring hero identity remains consistent only where the scenario includes the hero.
No parchment. No illustration. No concept art. No extra text except frame labels.`;
}

export function buildAutoChainAllParts({
  storyboard, styleProfile, partSize = 4, chainMode = "worldHero",
  strictLevel = "hard", referenceMode = "previousPart", appearanceMode = "full", continuityMode = "smart"
} = {}) {
  const scenes = storyboard?.scenes || [];
  const parts  = splitScenesIntoParts(scenes, partSize);
  return parts.map((partScenes, i) => buildAutoChainPartPrompt({
    storyboard, styleProfile, partScenes, partIndex: i, totalScenes: scenes.length,
    partSize, chainMode, strictLevel, referenceMode, appearanceMode, continuityMode
  }));
}

export function buildAutoVideoPrompt(scene = {}, { storyboard, styleProfile, chainMode = "worldHero", includeVo = false } = {}) {
  const label  = frameLabel(scene, 0);
  const visual = sceneText(scene);
  const motion = sceneMotion(scene);
  const style  = cleanText(styleProfile?.style_lock || storyboard?.global_style_lock || "cinematic realism, 35mm film grain, natural light");
  return `ANIMATE CURRENT FRAME:

FRAME LABEL: ${label}

SOURCE OF TRUTH:
Animate ONLY what is present in this frame and its storyboard description. Do not invent new plot events.

VISUAL CONTEXT:
${visual}

ACTION / MOTION:
${motion || visual}

CONTINUITY:
Maintain the same cinematic universe, lighting, color grading, texture density and camera realism.
${chainMode === "worldOnly" ? "Characters may vary according to the scenario, but the world/style must remain consistent." : "If the recurring hero appears, keep the same face, outfit, body language and emotional state."}

CAMERA:
Subtle cinematic motion, realistic handheld micro-movement, physical lens behavior, no artificial zoom jumps.

CINEMATOGRAPHY:
camera-photographed live-action cinematic realism, documentary physical reality, natural imperfections, 35mm anamorphic, Kodak Vision3 500T grain. ${style}
${includeVo && scene.vo_ru ? `\nVO MEANING LOCK:\n${cleanText(scene.vo_ru)}` : ""}
SFX:
${cleanText(scene.sfx || "subtle environmental ambience")}

RESTRICTIONS:
No subtitles, no UI, no watermark, no modern objects unless explicitly present in the scenario. No illustration, no painting, no stylized look.`;
}

export function buildAutoVideoPack({ storyboard, styleProfile, partScenes = [], chainMode = "worldHero", includeVo = false } = {}) {
  return partScenes.map((s) => buildAutoVideoPrompt(s, { storyboard, styleProfile, chainMode, includeVo })).join("\n\n---\n\n");
}

export function buildAutoChainJson({
  storyboard, styleProfile, partSize = 4, chainMode = "worldHero",
  strictLevel = "hard", referenceMode = "previousPart", appearanceMode = "full", continuityMode = "smart", includeVo = false
} = {}) {
  const scenes = storyboard?.scenes || [];
  const parts  = splitScenesIntoParts(scenes, partSize);
  return {
    engine: "NeuroCine Auto-Chain Strict Engine",
    version: "2.6-order-fixed-strict-flow-prompt",
    project_name: storyboard?.project_name || "NeuroCine Project",
    mode: chainMode,
    strict_level: strictLevel,
    reference_mode: referenceMode,
    appearance_mode: appearanceMode,
    continuity_mode: continuityMode,
    part_size: partSize,
    total_frames: scenes.length,
    parts: parts.map((partScenes, i) => ({
      part: i + 1,
      frame_range: `${frameLabel(partScenes[0], i * partSize)}-${frameLabel(partScenes[partScenes.length - 1], i * partSize + partScenes.length - 1)}`,
      image_prompt: buildAutoChainPartPrompt({
        storyboard, styleProfile, partScenes, partIndex: i, totalScenes: scenes.length,
        partSize, chainMode, strictLevel, referenceMode, appearanceMode, continuityMode
      }),
      video_pack: buildAutoVideoPack({ storyboard, styleProfile, partScenes, chainMode, includeVo }),
      frames: partScenes.map((s, localIdx) => ({
        id: s.id || frameLabel(s, i * partSize + localIdx),
        label: frameLabel(s, i * partSize + localIdx),
        scenario_input: sceneText(s),
        vo_ru: s.vo_ru || "",
        sfx: s.sfx || "",
        image_prompt_en: s.image_prompt_en || "",
        video_prompt_en: s.video_prompt_en || ""
      }))
    }))
  };
}
