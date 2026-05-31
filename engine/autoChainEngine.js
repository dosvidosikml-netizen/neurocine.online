// NeuroCine Auto-Chain Strict Engine v2.8 — Smart Continuity + Flow Compact
// Purpose: build chained PART prompts strictly from storyboard scenes without inventing plot.
// v2.8: adds adjacent-frame continuity links, keeps same reveal/entity across neighboring cells,
// and avoids feeding bloated video prompts back into PART image prompts.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripPromptPrefix(value = "") {
  return cleanText(value)
    .replace(/^SCENE PRIMARY FOCUS:\s*/i, "")
    .replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "")
    .replace(/\bASPECT RATIO\s*:\s*[\d:]+\.?[\s\S]*$/i, "")
    .replace(/\bSubject\s*:\s*[\s\S]*$/i, "")
    .replace(/\bREFERENCE VISIBILITY RULE\s*:\s*[\s\S]*$/i, "")
    .replace(/\bWORLD OBJECT RULE\s*:\s*[\s\S]*$/i, "")
    .replace(/\bShot progression\s*:[\s\S]*?(?=\bCamera behavior\s*:|\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|$)/gi, "")
    .replace(/\bCamera behavior\s*:[\s\S]*?(?=\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|$)/gi, "")
    .replace(/\bAudio\s*:[\s\S]*?(?=\bSFX\s*:|$)/gi, "")
    .replace(/\bSFX\s*:[\s\S]*$/gi, "");
}

function frameNumber(scene, index = 0) {
  const raw = String(scene?.id || "").match(/\d+/)?.[0];
  return raw ? Number(raw) : index + 1;
}

function frameLabel(scene, index = 0) {
  return `F${String(frameNumber(scene, index)).padStart(2, "0")}`;
}

function visualBeatText(scene = {}) {
  return stripPromptPrefix(
    scene.visual_beat_en ||
    scene.visual_beat_ru ||
    scene.shot_visual_en ||
    scene.shot_visual_ru ||
    scene.visual_scene_en ||
    scene.visual_scene_ru ||
    scene.allowed_visual ||
    scene.image_prompt_en ||
    scene.description_en ||
    scene.description_ru ||
    scene.vo_ru ||
    ""
  );
}

function sceneText(scene = {}, { characterLock = [], appearanceMode = "full" } = {}) {
  const raw = visualBeatText(scene);
  if (appearanceMode === "minimal" && characterLock.length) {
    return removeKnownCharacterAppearance(raw, characterLock);
  }
  return raw;
}

function sceneMotion(scene = {}) {
  return stripPromptPrefix(
    scene.story_action_en ||
    scene.action_en ||
    scene.motion ||
    scene.visual_beat_en ||
    scene.visual_beat_ru ||
    scene.action ||
    scene.description_en ||
    scene.description_ru ||
    scene.vo_ru ||
    scene.video_prompt_en ||
    ""
  );
}

function sceneScriptLine(scene = {}) {
  return cleanText(scene.script_line_ru || scene.script_line || scene.vo_ru || "");
}

function listField(value = "", fallback = "") {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join("; ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => val ? `${key}: ${cleanText(val)}` : "")
      .filter(Boolean)
      .join("; ");
  }
  return cleanText(value || fallback);
}

function sceneAllowedLine(scene = {}) {
  return [
    scene.allowed_characters ? `characters: ${listField(scene.allowed_characters)}` : "",
    scene.allowed_objects ? `objects: ${listField(scene.allowed_objects)}` : "",
    scene.allowed_location ? `location: ${listField(scene.allowed_location)}` : "",
  ].filter(Boolean).join(" | ");
}

function sceneForbiddenLine(scene = {}) {
  return listField(scene.forbidden_visuals || scene.forbidden_objects || scene.forbidden || "");
}

function getShotType(scene = {}, i = 0) {
  const shots = ["wide establishing shot", "handheld medium shot", "close-up", "over-the-shoulder shot"];
  return cleanText(scene.shot_type || scene.camera || shots[i % shots.length]);
}

function removeKnownCharacterAppearance(text = "", characterLock = []) {
  let out = cleanText(text);
  for (const c of characterLock || []) {
    const name = cleanText(c.name || "");
    if (!name) continue;
    const idx = out.toLowerCase().indexOf(name.toLowerCase());
    if (idx < 0) continue;
    const after = out.slice(idx + name.length);
    const actionMatch = after.match(/\b(standing|sitting|walking|running|kneeling|holding|looking|turning|entering|crossing|dragging|lifting|reaching|watching|facing|moving|crouching|lying|staring|freezing|working|digging)\b/i);
    if (actionMatch?.index != null && actionMatch.index < 500) {
      out = `${out.slice(0, idx + name.length)} ${after.slice(actionMatch.index)}`;
    }
  }
  return cleanText(out);
}

function getRelevantCharacterLock(characterLock = [], partScenes = [], appearanceMode = "full") {
  const haystack = cleanText(partScenes.map((s) => [
    sceneText(s, { characterLock, appearanceMode }),
    s.description_ru,
    s.description_en,
    s.vo_ru,
  ].filter(Boolean).join(" ")).join(" ")).toLowerCase();

  const relevant = (characterLock || []).filter((c) => {
    const aliases = [
      c.name,
    ]
      .map((x) => cleanText(x).toLowerCase())
      .filter((x) => x.length >= 3);
    return aliases.some((alias) => haystack.includes(alias));
  });

  return relevant.length ? relevant : [];
}

function getContinuityLink(partScenes = [], localIdx = 0, partIndex = 0, partSize = 4) {
  if (localIdx === 0) {
    return "CONTINUITY LINK: establish the first literal state of this event. If later frames stay in the same beat, preserve the same subject/entity and environment unless the scenario explicitly changes them.";
  }
  const prev = partScenes[localIdx - 1];
  const prevLabel = frameLabel(prev, partIndex * partSize + localIdx - 1);
  return `CONTINUITY LINK: if this frame continues the reveal or action from ${prevLabel}, preserve the same subject/entity, same environment and same event. Change only angle, distance, lens, emphasis or foreground layer unless the SCENARIO INPUT explicitly introduces a new subject.`;
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
  for (let i = 0; i < scenes.length; i += size) parts.push(scenes.slice(i, i + size));
  if (parts.length > 1 && parts[parts.length - 1].length === 1 && parts[parts.length - 2].length > 2) {
    const moved = parts[parts.length - 2].pop();
    parts[parts.length - 1].unshift(moved);
  }
  return parts;
}

function isTrailerStoryboard(storyboard = {}) {
  const mode = String(storyboard?.export_meta?.mode || storyboard?.mode || "").toLowerCase();
  return mode === "trailer" || mode === "trailer_storyboard" || mode === "film_trailer";
}

function formatCastLock(storyboard = {}) {
  const cast = Array.isArray(storyboard.cast_lock) && storyboard.cast_lock.length
    ? storyboard.cast_lock
    : Array.isArray(storyboard.character_lock)
      ? storyboard.character_lock.map((c, i) => ({
          id: c.id || `CHAR_${String(i + 1).padStart(2, "0")}`,
          role: c.role || c.name || `Character ${i + 1}`,
          visual_identity: [c.description, c.face_features, c.hair, c.physical_condition].filter(Boolean).join("; "),
          wardrobe: c.clothing || "",
          forbidden_changes: c.forbidden_changes || "no different actor, no different age, no different face, no different wardrobe unless the script explicitly changes it",
        }))
      : [];
  return cast.map((c, i) => {
    const id = cleanText(c.id || `CHAR_${String(i + 1).padStart(2, "0")}`);
    const role = cleanText(c.role || c.name || c.character || `Character ${i + 1}`);
    const identity = cleanText(c.visual_identity || c.must_appear_as || c.description || "");
    const wardrobe = cleanText(c.wardrobe || c.clothing || "");
    const forbid = cleanText(c.forbidden_changes || "no actor redesign, no wardrobe drift, no age drift");
    return `${id} / ${role}: ${[identity, wardrobe ? `wardrobe: ${wardrobe}` : "", `forbidden: ${forbid}`].filter(Boolean).join("; ")}`;
  }).filter(Boolean).join("\n");
}

function formatLocationLock(storyboard = {}) {
  const loc = storyboard.location_lock;
  if (!loc || typeof loc !== "object") return cleanText(storyboard.world_lock || "same locked film location, era, materials, lighting and spatial logic");
  return [
    loc.main || loc.main_location || loc.location,
    loc.materials ? `materials: ${loc.materials}` : "",
    loc.lighting ? `lighting: ${loc.lighting}` : "",
    loc.spatial_rules ? `spatial rules: ${loc.spatial_rules}` : "",
    loc.forbidden ? `forbidden: ${loc.forbidden}` : "",
  ].filter(Boolean).map(cleanText).join("; ");
}

export function buildWorldLock({ storyboard, styleProfile, chainMode = "worldHero", strictLevel = "hard" } = {}) {
  const sourceStyle = cleanText(styleProfile?.style_lock || storyboard?.global_style_lock || "");
  const world = cleanText(storyboard?.world_lock || storyboard?.project_type || "same cinematic universe");
  const chars = Array.isArray(storyboard?.character_lock) ? storyboard.character_lock : [];
  const trailerMode = isTrailerStoryboard(storyboard);
  const castLock = formatCastLock(storyboard);
  const locationLock = formatLocationLock(storyboard);
  const styleBible = cleanText(storyboard?.style_bible || storyboard?.master_style || "");
  const heroLine = chars.length
    ? chars.map((c, i) => `${c.name || `Character ${i + 1}`}: ${cleanText([c.description, c.age, c.clothing, c.hair, c.face_features, c.physical_condition].filter(Boolean).join("; "))}`).join("\n")
    : "If the script repeats the same hero, keep the same face, proportions, clothing and emotional state whenever that hero appears. If the current frame is WORLD-only, do not force the hero into it.";

  return `AUTO-CHAIN STRICT ENGINE — SOURCE-OF-TRUTH MODE

SOURCE OF TRUTH:
Use ONLY the provided storyboard scenes from the existing Scenario/Storyboard.
For each frame, the SCRIPT LINE / vo_ru is the highest authority for visible content.
Do NOT invent new plot events, new locations, new actions, new animals, new important objects or new characters.
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
Maintain the same scripted period, environment logic, lighting family, color grading, texture density, lens language and documentary realism across all generated PARTS.
${trailerMode ? `
TRAILER / FILM CONTINUITY LOCK:
This is not a new storyboard. This PART is a continuation of the same film plan.
CAST LOCK:
${castLock || heroLine}

LOCATION LOCK:
${locationLock}

STYLE BIBLE:
${styleBible || sourceStyle || "same locked cinematic style, same lens language, same color grade, same production design"}

Do not redesign actors between PARTS. Do not replace the office/elevator/corridor with a new location. Do not change wardrobe, age, face, body type or role unless the script explicitly says so.
` : ""}

HERO / CHARACTER LOCK:
${heroLine}
Do not force the hero into a frame where the scenario does not include them.
Do not replace a recurring hero with a different face when the hero appears.
World-only frames may show other people, but they must belong to the same world and style.

REFERENCE RULE:
Use uploaded reference images only as VISUAL DNA: style, lighting, texture, world continuity and recurring hero identity.
Reference images must not introduce new story objects, locations, wardrobe, era details or actions.
Do NOT copy the same composition into every new frame.
Do NOT make every cell a portrait of the reference hero.
New frames must follow their own scenario descriptions.

STYLE FORMULA:
Style controls only lens, camera behavior, color grade, contrast, grain, texture and lighting quality. Style cannot add characters, props, locations, era, weather, costumes, signs or plot events.

${HARD_NEGATIVE_VISUAL_LOCK}`;
}

function frameRoleHint(localIdx = 0, chainMode = "worldHero") {
  if (chainMode === "worldOnly") return "WORLD FRAME — prioritize the scenario environment/action; characters may change according to the script.";
  const roles = [
    "CORE ACTION FRAME — if the scenario contains the recurring hero, keep identity locked; otherwise follow the scenario literally.",
    "WORLD / CONTEXT FRAME — show the environment/event from the scenario; do not force the hero if not described.",
    "DETAIL / EVIDENCE FRAME — show the exact object/body/detail from the scenario; keep live-action macro realism.",
    "CONSEQUENCE FRAME — if the scenario returns to the hero, keep identity locked; otherwise show the described consequence/event."
  ];
  return roles[localIdx % roles.length];
}

export function buildAutoChainPartPrompt({
  storyboard, styleProfile, partScenes = [], partIndex = 0, totalScenes = 0,
  partSize = 4, chainMode = "worldHero", strictLevel = "hard",
  referenceMode = "previousPart", appearanceMode = "full"
} = {}) {
  if (!partScenes.length) return "";
  const characterLock = storyboard?.character_lock || [];
  const start = frameNumber(partScenes[0], partIndex * partSize);
  const end = frameNumber(partScenes[partScenes.length - 1], partIndex * partSize + partScenes.length - 1);
  const cols = partScenes.length <= 2 ? partScenes.length : 2;
  const rows = Math.ceil(partScenes.length / cols);
  const aspect = storyboard?.aspect_ratio || "9:16";
  const isFirstPart = partIndex === 0;

  const refText = isFirstPart
    ? (referenceMode === "previousPart"
        ? "PART 1 has no previous PART. If a previous reference is uploaded, use it only as loose world/style DNA, not as story continuity."
        : "PART 1: use the uploaded HERO ANCHOR image for recurring hero identity and visual DNA. There is no previous PART yet. Do not copy the anchor composition into every cell.")
    : referenceMode === "heroAndPrevious"
      ? "Use the uploaded HERO ANCHOR image and the uploaded PREVIOUS PART image as references. Hero anchor fixes recurring hero identity; previous PART fixes world/style continuity. Do not copy their compositions."
      : referenceMode === "heroOnly"
        ? "Use the uploaded HERO ANCHOR image only for recurring hero identity and style DNA. Do not force the hero into frames where the scenario does not include him/her."
        : "Use the uploaded PREVIOUS PART image as visual reference for world/style continuity. Do not copy the same composition.";

  const appearanceNote = appearanceMode === "minimal"
    ? "\nAPPEARANCE MODE — ANCHOR PRIORITY:\nCharacter physical appearance is intentionally omitted from frame descriptions. Use the uploaded HERO ANCHOR image as the sole source of truth for character faces, proportions and visual identity. Do NOT invent a new face based on text.\n"
    : "";

  const frameBlocks = partScenes.map((s, localIdx) => {
    const globalIdx = partIndex * partSize + localIdx;
    const label = frameLabel(s, globalIdx);
    const sceneTxt = sceneText(s, { characterLock, appearanceMode });
    const scriptLine = sceneScriptLine(s);
    const allowed = sceneAllowedLine(s);
    const forbidden = sceneForbiddenLine(s);
    return `${label}:
${frameRoleHint(localIdx, chainMode)}
${getContinuityLink(partScenes, localIdx, partIndex, partSize)}
MANDATORY VISUAL PREFIX: camera-photographed live-action image, NOT illustration, NOT 2D art, NOT painting, NOT concept art.
SCRIPT LINE (SOURCE OF TRUTH): ${scriptLine || "use SCENARIO INPUT only; do not invent missing details"}
VISUAL BEAT (STRICT): ${sceneTxt}
${allowed ? `ALLOWED IN FRAME: ${allowed}` : "ALLOWED IN FRAME: only what the script line and visual beat explicitly name."}
${forbidden ? `FORBIDDEN IN FRAME: ${forbidden}` : "FORBIDDEN IN FRAME: new people, new props, new rooms, new era, new costumes, new story events."}
VO MEANING: ${cleanText(s.vo_ru || "")}
SHOT TYPE: ${getShotType(s, localIdx)}
COMPOSITION RULE: visualize only the described action/subject/environment from SCRIPT LINE + VISUAL BEAT; keep cinematic composition but do not add new story events, props, locations, weather or characters.
SFX NOTE: ${cleanText(s.sfx || "")}`;
  }).join("\n\n");

  return `STORYBOARD GRID PART ${partIndex + 1} — AUTO-CHAIN STRICT CONTINUATION
FRAMES: F${String(start).padStart(2, "0")}–F${String(end).padStart(2, "0")} of ${totalScenes || storyboard?.scenes?.length || end} total

REFERENCE INPUT:
${refText}
This PART must continue the same project, but each frame must follow its own scenario input.
${isTrailerStoryboard(storyboard) ? "TRAILER MODE: generate this as one segment of the same locked film trailer. Treat previous and next PARTS as the same production, not separate concepts." : ""}
${appearanceNote}
FORMAT:
${cols} columns × ${rows} rows — exactly ${partScenes.length} equal cells.
Each cell format: ${aspect}${aspect === "9:16" ? " portrait" : ""}.
Overall image: natural grid canvas made of photographic frames, do NOT force the overall canvas to ${aspect}.
Use simple black separators between frames. Do NOT use parchment, beige paper, decorative background, or illustrated page layout.

FRAME LABELS:
${partScenes.map((s, i) => frameLabel(s, partIndex * partSize + i)).join(", ")} only.
Small white text, top-left corner of each cell.
No other text.

${buildWorldLock({ storyboard, styleProfile, chainMode, strictLevel })}

MOTION / EDITING CONTINUITY:
The PART should feel like a sequence cut from the same film.
Maintain timeline order left-to-right, top-to-bottom.
No teleportation unless the scenario itself changes location.
Scene changes are allowed ONLY when the scenario frame describes a new place/action.
If a reveal spans adjacent frames, keep the same discovered subject/entity across those frames until the scenario explicitly changes to a new subject.

SMART CONTINUITY — STYLE LOCKED, COMPOSITION FREE:
Preserve style/world/hero DNA, but change shot design between cells: angle, distance, focal length, foreground/midground/background relationship, body placement and visual emphasis.
Do NOT copy previous composition. Do NOT introduce new plot content.

NETFLIX-STYLE RHYTHM WITHOUT INVENTING:
Use the scenario as written, but keep the rhythm readable:
- core action frames return to the recurring hero only if the scene includes him/her;
- world frames expand the same universe;
- detail frames show exact details from the scenario;
- no new plot content.

FRAMES IN THIS PART:
${frameBlocks}

FINAL CHECK:
Exactly ${partScenes.length} frames.
Every frame matches its VISUAL BEAT only.
Same old NeuroCine live-action style across all cells.
Recurring hero identity remains consistent only where the scenario includes the hero.
No parchment. No illustration. No concept art. No extra text except frame labels.`;
}

export function buildAutoChainAllParts({
  storyboard, styleProfile, partSize = 4, chainMode = "worldHero",
  strictLevel = "hard", referenceMode = "previousPart", appearanceMode = "full"
} = {}) {
  const scenes = storyboard?.scenes || [];
  const parts = splitScenesIntoParts(scenes, partSize);
  return parts.map((partScenes, i) => buildAutoChainPartPrompt({
    storyboard, styleProfile, partScenes, partIndex: i, totalScenes: scenes.length,
    partSize, chainMode, strictLevel, referenceMode, appearanceMode
  }));
}

export function buildAutoVideoPrompt(scene = {}, { storyboard, styleProfile, chainMode = "worldHero", includeVo = true } = {}) {
  const label = frameLabel(scene, 0);
  const visual = sceneText(scene);
  const motion = sceneMotion(scene);
  const style = cleanText(styleProfile?.style_lock || storyboard?.global_style_lock || "cinematic realism, 35mm film grain, natural light");

  // Script line используется как визуальный якорь в любом режиме (не для аудио)
  const scriptAnchor = scene.vo_ru
    ? `\nSCRIPT LINE (visual anchor): "${cleanText(scene.vo_ru)}"`
    : "";

  // VO блок: если VO включён — даём смысловой якорь; если выключен — жёсткий запрет
  const voBlock = includeVo && scene.vo_ru
    ? `\nVO MEANING LOCK:\n${cleanText(scene.vo_ru)}`
    : "\nAUDIO: NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. Ambient SFX and environmental sound only.";

  return `ANIMATE CURRENT FRAME: ${label}
${scriptAnchor}

SOURCE OF TRUTH — STRICT:
Animate ONLY what is explicitly present in this frame's storyboard description AND directly stated in the SCRIPT LINE above.
The uploaded/current frame is the visual anchor; the SCRIPT LINE is the content authority.
FORBIDDEN: inventing new locations, characters, objects or actions not in the script line.
Example: if script says "руки дрожат над кружкой" — animate HANDS and CUP only. NOT feet, NOT corridor, NOT POV walk.
If you cannot find an element in the script line → do NOT animate it.

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
${voBlock}
SFX:
${cleanText(scene.sfx || "subtle environmental ambience")}

RESTRICTIONS:
No subtitles, no UI, no watermark, no modern objects unless explicitly present in the scenario. No illustration, no painting, no stylized look.${!includeVo ? " No spoken words, no voiceover, no dialogue audio of any kind." : ""}`;
}

export function buildAutoVideoPack({ storyboard, styleProfile, partScenes = [], chainMode = "worldHero", includeVo = true } = {}) {
  return partScenes.map((s) => buildAutoVideoPrompt(s, { storyboard, styleProfile, chainMode, includeVo })).join("\n\n---\n\n");
}

export function buildAutoChainJson({
  storyboard, styleProfile, partSize = 4, chainMode = "worldHero",
  strictLevel = "hard", referenceMode = "previousPart", appearanceMode = "full", includeVo = true
} = {}) {
  const scenes = storyboard?.scenes || [];
  const characterLock = storyboard?.character_lock || [];
  const parts = splitScenesIntoParts(scenes, partSize);
  return {
    engine: "NeuroCine Auto-Chain Strict Engine",
    version: "2.8-smart-continuity-flow-prompt",
    project_name: storyboard?.project_name || "NeuroCine Project",
    mode: chainMode,
    strict_level: strictLevel,
    reference_mode: referenceMode,
    appearance_mode: appearanceMode,
    part_size: partSize,
    total_frames: scenes.length,
    parts: parts.map((partScenes, i) => ({
      part: i + 1,
      frame_range: `${frameLabel(partScenes[0], i * partSize)}-${frameLabel(partScenes[partScenes.length - 1], i * partSize + partScenes.length - 1)}`,
      image_prompt: buildAutoChainPartPrompt({
        storyboard, styleProfile, partScenes, partIndex: i, totalScenes: scenes.length,
        partSize, chainMode, strictLevel, referenceMode, appearanceMode
      }),
      video_pack: buildAutoVideoPack({ storyboard, styleProfile, partScenes, chainMode, includeVo }),
      frames: partScenes.map((s, localIdx) => ({
        id: s.id || frameLabel(s, i * partSize + localIdx),
        label: frameLabel(s, i * partSize + localIdx),
        scenario_input: sceneText(s, { characterLock, appearanceMode }),
        vo_ru: s.vo_ru || "",
        script_line_ru: sceneScriptLine(s),
        sfx: s.sfx || "",
        image_prompt_en: s.image_prompt_en || "",
        video_prompt_en: s.video_prompt_en || "",
        visual_beat_en: s.visual_beat_en || "",
        visual_beat_ru: s.visual_beat_ru || "",
        allowed_characters: s.allowed_characters || "",
        allowed_objects: s.allowed_objects || "",
        allowed_location: s.allowed_location || "",
        forbidden_visuals: s.forbidden_visuals || ""
      }))
    }))
  };
}

export function buildFlowCompactPartPrompt({
  storyboard, styleProfile, partScenes = [], partIndex = 0, totalScenes = 0,
  partSize = 4, chainMode = "worldHero", strictLevel = "hard",
  referenceMode = "previousPart", appearanceMode = "full"
} = {}) {
  if (!partScenes.length) return "";
  const characterLock = storyboard?.character_lock || [];
  const start = frameNumber(partScenes[0], partIndex * partSize);
  const end = frameNumber(partScenes[partScenes.length - 1], partIndex * partSize + partScenes.length - 1);
  const labels = partScenes.map((s, i) => frameLabel(s, partIndex * partSize + i)).join(", ");
  const isFirstPart = partIndex === 0;
  const aspect = storyboard?.aspect_ratio || "9:16";

  const refLine = isFirstPart
    ? "Use Hero Anchor only if uploaded for recurring identity. No Previous PART exists yet."
    : referenceMode === "heroAndPrevious"
      ? "Use Hero Anchor for recurring identity and Previous PART only for world/style DNA. Do not copy compositions."
      : referenceMode === "heroOnly"
        ? "Use Hero Anchor only for recurring identity. Do not force the hero into frames where the scenario does not include them."
        : "Use Previous PART only for world/style DNA. Do not copy compositions.";

  const relevantCharacterLock = getRelevantCharacterLock(characterLock, partScenes, appearanceMode);
  const trailerMode = isTrailerStoryboard(storyboard);
  const castLock = formatCastLock(storyboard);
  const locationLock = formatLocationLock(storyboard);
  const styleBible = cleanText(storyboard?.style_bible || storyboard?.master_style || "");
  const chars = relevantCharacterLock.slice(0, 4).map((c, i) => {
    const name = cleanText(c.name || `Character ${i + 1}`);
    const desc = cleanText(c.description || [c.age, c.clothing, c.hair, c.face_features, c.physical_condition].filter(Boolean).join(", "));
    return desc ? `${name} — ${desc}` : "";
  }).filter(Boolean).join("\n");

  const frames = partScenes.map((s, localIdx) => {
    const label = frameLabel(s, partIndex * partSize + localIdx);
    const text = sceneText(s, { characterLock, appearanceMode });
    const scriptLine = sceneScriptLine(s);
    const allowed = sceneAllowedLine(s);
    const forbidden = sceneForbiddenLine(s);
    const sfx = cleanText(s.sfx || "subtle ambience");
    return `${label}
Source line: "${scriptLine || text}"
Visual beat: ${text}
${allowed ? `Allowed in this cell: ${allowed}` : "Allowed in this cell: only what this source line and visual beat explicitly name."}
${forbidden ? `Forbidden in this cell: ${forbidden}` : "Forbidden in this cell: no extra actors, no new props, no new location, no new era, no new costumes, no new story event."}
${getContinuityLink(partScenes, localIdx, partIndex, partSize)}
SFX mood: ${sfx}`;
  }).join("\n\n");

  const cols = partScenes.length <= 2 ? partScenes.length : 2;
  const rows = Math.ceil(partScenes.length / cols);
  const styleLock = cleanText(styleProfile?.style_lock || storyboard?.global_style_lock || "");
  const chainLine = chainMode === "worldOnly"
    ? "WORLD ONLY — lock the same world, period, lighting family and realism; characters may change only when the scenario changes."
    : "WORLD + HERO — lock the world and keep recurring hero identity stable whenever the scenario includes that hero.";
  const strictLine = strictLevel === "maximum"
    ? "MAXIMUM — literal scenario execution only. No decorative narrative expansion."
    : strictLevel === "soft"
      ? "SOFT — cinematic polish is allowed, but never contradict the scenario."
      : "HARD — strict to the scenario; cinematic framing is allowed without adding plot content.";

  const gridInstruction = trailerMode
    ? `Generate exactly ${partScenes.length} live-action cinematic frames in a clean ${cols}×${rows} grid (${cols} columns × ${rows} rows). Each cell must be a clean ${aspect}${aspect === "9:16" ? " vertical portrait" : ""} image, edge-to-edge. NO frame labels, NO numbers, NO captions, NO title bars, NO black gutters, NO borders, NO separators, NO UI, NO watermark. The grid is only a temporary layout for cropping; every cell must look like a standalone 9:16 video frame.`
    : `Generate exactly ${partScenes.length} live-action cinematic frames in a clean ${cols}×${rows} grid (${cols} columns × ${rows} rows). Each cell format is ${aspect}${aspect === "9:16" ? " vertical portrait" : ""}. Use thin black separators. Frame labels only: ${labels} in small white text top-left. No other text, no subtitles, no UI, no watermark.`;
  const trailerFinalCheck = trailerMode
    ? `Exactly ${partScenes.length} clean unlabeled ${aspect} frames. Use the internal frame order ${labels}, but do not draw labels/numbers/text/borders in the image. Follow each frame's Visual beat literally. No new plot events, animals, modern objects or extra characters unless described. Character Lock is not a cast list for every frame. Same cinematic world, different composition in every cell.`
    : `Exactly ${partScenes.length} frames. ${labels} only. Follow each frame literally. No new plot events, animals, modern objects or extra characters unless described. Character Lock is not a cast list for every frame. Same cinematic world, different composition in every cell.`;

  return `STORYBOARD GRID PART ${partIndex + 1} — ${labels}
${gridInstruction}

STYLE LOCK:
${styleLock || "dark cinematic documentary realism, camera-photographed live-action film stills, natural imperfections, realistic skin and fabric, controlled night interior lighting, subtle 35mm film grain."}
${trailerMode ? `
TRAILER PRODUCTION LOCK:
This PART belongs to the same trailer storyboard as all other PARTS.
CAST LOCK:
${castLock || "Use the same recurring characters from character_lock; do not redesign actors."}

LOCATION LOCK:
${locationLock}

STYLE BIBLE:
${styleBible || styleLock || "same film style, same lens language, same lighting family, same production design"}

If this is an odd-count storyboard, the final PART may contain fewer cells. That is intentional. Generate exactly the listed internal frame order, no missing cells, no extra cells, and no visible labels.
` : ""}

MANDATORY VISUAL TYPE:
camera-photographed live-action film stills, natural imperfections, realistic skin and fabric, physical documentary realism. Not illustration, not painting, not concept art, not parchment, not fantasy art.

STYLE FORMULA:
Style controls only lens, camera behavior, color grade, contrast, grain, texture and lighting quality. Style cannot add characters, props, locations, era, weather, costumes, signs or plot events. If style text conflicts with the source line, ignore that style token.

CHAIN MODE:
${chainLine}

STRICTNESS:
${strictLine}

CONTINUITY:
${refLine}
Smart continuity: preserve atmosphere, lighting family, color grade and scripted world texture, but every frame must be a new shot with a different composition, camera angle and focal point.
If adjacent frames describe the same reveal or subject, keep it as the same exact entity and same event while only changing the shot design.

${chars ? `CHARACTER LOCK:\n${chars}\nUse this only as identity reference when a frame explicitly includes that character. Do NOT insert every locked character into every cell.\n\n` : ""}FRAMES:
${frames}

FINAL CHECK:
${trailerFinalCheck}`;
}
