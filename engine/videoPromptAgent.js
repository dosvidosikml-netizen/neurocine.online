// engine/videoPromptAgent.js
// NeuroCine Video Prompt Agent v3.2 — dominant SFX planner + final de-duplicator
// Purpose: build clean image/video prompts with no recursive prompt bloat,
// one Action block, one Audio block, one SFX block, and scene-logical primary sound cues.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensurePromptPrefix(text = "", prefix) {
  let out = cleanText(text);
  if (prefix === "SCENE PRIMARY FOCUS:") out = out.replace(/^SCENE PRIMARY FOCUS[:\s-]*/i, "").trim();
  if (prefix === "ANIMATE CURRENT FRAME:") out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "").trim();
  return `${prefix} ${out}`.replace(/\s+/g, " ").trim();
}

function limitWords(text = "", max = 80) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  if (words.length <= max) return cleanText(text);
  return words.slice(0, max).join(" ").replace(/[,:;—-]+$/, "") + ".";
}

function isFirstFrame(frame = {}) {
  const id = String(frame?.id || "");
  const n = Number(id.match(/\d+/)?.[0] || frame?.index || 0);
  return n === 1 || id === "frame_01" || id === "F01";
}

function collectContext(frame = {}, storyboard = {}) {
  return cleanText([
    frame.id,
    frame.description_ru,
    frame.description_en,
    frame.image_prompt_en,
    frame.video_prompt_en,
    frame.vo_ru,
    frame.sfx,
    storyboard?.topic,
    storyboard?.script,
    ...(Array.isArray(storyboard?.character_lock)
      ? storyboard.character_lock.map((c) => [c.name, c.age, c.description, c.face_features, c.clothing, c.physical_condition].filter(Boolean).join(" "))
      : []),
  ].filter(Boolean).join(" "));
}

export function hasMinorContext(frame = {}, storyboard = {}) {
  const text = collectContext(frame, storyboard).toLowerCase();
  return /(\bchild\b|\bboy\b|\bgirl\b|\bkid\b|\bminor\b|\bteen\b|\bteenager\b|\b9\s*y|\b10\s*y|\b11\s*y|\b12\s*y|\b13\s*y|\b14\s*y|\b15\s*y|\b16\s*y|\b17\s*y|реб[её]нок|мальчик|девочк|несовершеннолет|дитина|хлопчик|дівчин)/i.test(text);
}

function cleanAudioCue(text = "") {
  return cleanText(text)
    .replace(/электрический гул экрана/gi, "electric screen hum")
    .replace(/гул экрана/gi, "screen hum")
    .replace(/скрип кровати/gi, "bed creak")
    .replace(/скрип матраса/gi, "mattress creak")
    .replace(/ткань/gi, "fabric rustle")
    .replace(/дыхание/gi, "shallow breathing")
    .replace(/пыль/gi, "dust in still air")
    .replace(/вентиляционный гул|гул вентиляции/gi, "ventilation hum")
    .replace(/щелчок сканера/gi, "scanner click")
    .replace(/crowd murmur/gi, "distant non-verbal crowd ambience")
    .replace(/human voices/gi, "non-verbal human ambience")
    .replace(/\bvoices\b/gi, "non-verbal ambience")
    .replace(/\bdialogue\b/gi, "no dialogue")
    .replace(/\bspeech\b/gi, "no speech")
    .replace(/\bnarration\b/gi, "no narration")
    .replace(/\bvoiceover\b/gi, "no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSection(text = "", label = "Audio") {
  const re = new RegExp(`\\b${label}\\s*:\\s*([\\s\\S]*?)(?=\\bAudio\\s*:|\\bSFX\\s*:|\\bShot progression\\s*:|\\bCamera behavior\\s*:|\\bLighting\\s*:|\\bColor grade\\s*:|\\bPhysics\\s*:|\\bMaintain\\b|\\bUltra consistency\\b|$)`, "i");
  return cleanText(String(text || "").match(re)?.[1] || "");
}

function splitCues(text = "") {
  return cleanText(text)
    .replace(/\.+/g, ".")
    .split(/[,;|/]|\band\b|\+|\.\s+/i)
    .map((x) => cleanAudioCue(x).replace(/^SFX\s*:/i, "").replace(/^Audio\s*:/i, "").trim())
    .filter((x) => x && x.length > 2);
}

function dedupeList(list = []) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const value = cleanText(item).replace(/\.+$/, "");
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function hasAny(text = "", words = []) {
  const lower = String(text || "").toLowerCase();
  return words.some((w) => lower.includes(w));
}

function buildAudioPlan({ frame = {}, storyboard = {}, action = "" } = {}) {
  const frameAudioContext = cleanText([
    frame.sfx, frame.audio, frame.sound,
  ].filter(Boolean).join(" "));

  const ctx = cleanText([
    frameAudioContext,
    frame.description_ru, frame.description_en,
    frame.image_prompt_en, frame.vo_ru,
    action,
  ].filter(Boolean).join(" ")).toLowerCase();

  // Извлекаем готовые кью из sfx-поля сцены (приоритет)
  const extracted = [frame.sfx, frame.audio, frame.sound].flatMap(splitCues);

  const cues = [];

  // ── ТРЕВОГА / СИРЕНА (P0) ─────────────────────────────────────────────────
  if (hasAny(ctx, ["alarm", "siren", "alert", "warning", "beacon", "тревог", "сирен", "маяк"])) {
    cues.push("loud rotating alarm siren synchronized with flashing red beacon");
  }

  // ── СПАЛЬНЯ / СОН / ПОСТЕЛЬ ───────────────────────────────────────────────
  if (hasAny(ctx, ["bed", "pillow", "blanket", "mattress", "lying", "кровать", "подушк", "одеял", "матрас", "лежит", "лежать"])) {
    cues.push("slow labored breathing — each inhale pulls the cotton pillowcase with a micro-rustle");
    cues.push("mattress spring creak under shifting body weight");
    if (hasAny(ctx, ["eye", "глаз", "взгляд"])) {
      cues.push("eyelid dry friction against pillow surface");
    }
  }

  // ── РУКИ / ТРЕМОР / ДРОЖАНИЕ ──────────────────────────────────────────────
  if (hasAny(ctx, ["trembl", "shak", "дрож", "трясётся", "трясутся", "трясти"])) {
    cues.push("fine hand tremor tapping ceramic rim — ceramic-on-ceramic micro-click");
    cues.push("liquid surface ripple sound — water or coffee disturbed by trembling");
  }

  // ── КРУЖКА / СТАКАН / ЧАШКА ───────────────────────────────────────────────
  if (hasAny(ctx, ["cup", "mug", "coffee", "tea", "drink", "кружк", "чашк", "кофе", "чай", "напит"])) {
    cues.push("ceramic cup set down on wood — soft thud with hollow resonance");
    cues.push("hot liquid thermal tick — cup material expanding from heat");
    if (!hasAny(ctx, ["дрож", "trembl", "shak"])) {
      cues.push("swallow — dry throat contraction");
    }
  }

  // ── НОУТБУК / КЛАВИАТУРА / ЭКРАН ─────────────────────────────────────────
  if (hasAny(ctx, ["laptop", "keyboard", "typing", "keys", "ноутбук", "клавиатур", "печатает", "набирает"])) {
    cues.push("individual keycap click — sharp plastic-on-membrane contact, 42g actuation");
    cues.push("fingertip skin dragging across keycap surface between keystrokes");
    cues.push("laptop chassis resonance — low-frequency body vibration during typing burst");
    // убираем гул экрана — заменяем на конкретный звук
    if (hasAny(ctx, ["screen", "monitor", "экран", "монитор", "дисплей"])) {
      cues.push("LCD backlight faint electrical tick on brightness cycle");
    }
  }

  // ── ОКНО / СТЕКЛО / ОТРАЖЕНИЕ ────────────────────────────────────────────
  if (hasAny(ctx, ["window", "glass", "reflection", "окно", "стекл", "отражени", "смотрит.*окно", "у окна"])) {
    cues.push("double-pane window pressure flex — low-frequency hum only when wind gusts");
    cues.push("condensation droplet tracking down glass — near-silent friction squeak");
    if (hasAny(ctx, ["rain", "дождь", "капли"])) {
      cues.push("individual raindrops striking glass at irregular intervals — not continuous rain sheet");
    } else {
      cues.push("muted exterior air pressure through glass — low-end texture without identifiable traffic");
    }
  }

  // ── КОРИДОР / ХОДЬБА / ШАГИ ──────────────────────────────────────────────
  if (hasAny(ctx, ["corridor", "hallway", "walk", "footstep", "коридор", "шаги", "идёт", "ходит", "паркет", "пол"])) {
    if (hasAny(ctx, ["sock", "bare", "носк", "босиком"])) {
      cues.push("socked foot pressure on hardwood — fabric compression creak, no heel impact");
    } else {
      cues.push("slow deliberate footstep — heel-to-toe weight transfer on wooden floor");
    }
    cues.push("floorboard micro-creak at specific pressure point — isolated, not continuous");
  }

  // ── КУХНЯ / ХОЛОДИЛЬНИК ───────────────────────────────────────────────────
  if (hasAny(ctx, ["kitchen", "fridge", "refrigerator", "кухня", "холодильник", "кухне"])) {
    cues.push("refrigerator compressor start — low-frequency thump then constant 60Hz vibration in floor");
    cues.push("kitchen silence — absence of sound except compressor and distant traffic seeping through wall");
  }

  // ── ДЫХАНИЕ / УСТАЛОСТЬ / ИЗНЕМОЖЕНИЕ ───────────────────────────────────
  if (hasAny(ctx, ["breath", "exhaust", "fatigue", "дых", "усталост", "изнеможен", "не спит", "бессонниц"])) {
    if (!cues.some(c => c.includes("breath"))) {
      cues.push("shallow irregular breathing — chest barely moves, inhale twice as long as exhale");
    }
    cues.push("dry swallow — throat clicks from dehydration");
  }

  // ── ГАЛЛЮЦИНАЦИИ / ДВИЖЕНИЕ / ТЕНИ ──────────────────────────────────────
  if (hasAny(ctx, ["hallucin", "shadow", "movement", "мерещ", "тень", "движение", "никого"])) {
    cues.push("absolute room silence — held breath makes ears ring");
    cues.push("micro-creak from thermal expansion of wall material — not footstep");
  }

  // ── МОЗГ / НЕЙРОНЫ / МЕДИЦИНА / ЭЭГ ─────────────────────────────────────
  if (hasAny(ctx, ["brain", "neuron", "eeg", "monitor", "medical", "мозг", "нейрон", "ээг", "врач", "кнопк"])) {
    cues.push("EEG electrode contact crackle — brief static pop as lead shifts");
    cues.push("medical monitor tone — single clean sine wave, not alarm");
    cues.push("doctor glove latex stretch — quiet snap as hand grips device");
  }

  // ── НОЧЬ / ТИШИНА / ПУСТОТА ──────────────────────────────────────────────
  if (hasAny(ctx, ["night", "dark", "silence", "empty", "ночь", "темнота", "тишина", "пустой", "пусто"])) {
    if (!cues.length) {
      cues.push("held interior silence — high-frequency air pressure with no identifiable source");
      cues.push("fabric micro-rustle from small body movement in the dark");
    }
  }

  // Если ничего не совпало — используем конкретный физический минимализм
  const finalCues = dedupeList([...extracted, ...cues]);
  if (!finalCues.length) {
    finalCues.push("room tone — physical silence with micro-texture: air pressure, distant low-end through walls");
    finalCues.push("involuntary body sound — clothes fabric shift, slow breath cycle");
  }

  // Убираем generic заглушки которые могли просочиться из sfx-поля
  const cleaned = finalCues.filter(c =>
    !/^(subtle.*ambience|generic.*ambient|environmental.*ambience|low.*hum|background.*hum|white.*noise)$/i.test(c.trim())
  );
  if (!cleaned.length) cleaned.push(...finalCues); // fallback если отфильтровали всё

  const primary = cleaned.find((x) => /alarm|siren|alert|warning|тревог|сирен/i.test(x)) || cleaned[0];
  const background = cleaned.filter((x) => x !== primary).slice(0, 4);

  return {
    primary,
    background,
    sfxLine: dedupeList([primary, ...background]).join(", "),
    hasDominantAlarm: /alarm|siren|alert|warning|тревог|сирен/i.test(primary),
  };
}

function stripGeneratedPromptSections(text = "") {
  let out = String(text || "");
  out = out.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, "");
  out = out.replace(/^SCENE PRIMARY FOCUS[:\s—-]*/i, "");
  out = out.replace(/\bASPECT RATIO\s*:\s*[\d:]+\.?[\s\S]*$/i, "");
  out = out.replace(/\bSubject\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bREFERENCE VISIBILITY RULE\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bWORLD OBJECT RULE\s*:\s*[\s\S]*$/i, "");
  out = out.replace(/\bShot progression\s*:[\s\S]*?(?=\bCamera behavior\s*:|\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bCamera behavior\s*:[\s\S]*?(?=\bLighting\s*:|\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bLighting\s*:[\s\S]*?(?=\bColor grade\s*:|\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bColor grade\s*:[\s\S]*?(?=\bPhysics\s*:|\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bPhysics\s*:[\s\S]*?(?=\bAudio\s*:|\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bAudio\s*:[\s\S]*?(?=\bSFX\s*:|\bMaintain\b|\bUltra consistency\b|$)/gi, "");
  out = out.replace(/\bSFX\s*:[\s\S]*$/gi, "");
  out = out.replace(/\bMaintain exact[^.]*\./gi, "");
  out = out.replace(/\bMaintain EXACT[^.]*\./gi, "");
  out = out.replace(/\bUltra consistency[^.]*\./gi, "");
  out = out.replace(/\bNo Maintain\b/gi, "");
  out = out.replace(/\bAction\s*:\s*Action\s*:/gi, "Action:");
  out = out.replace(/^Action\s*:/i, "");
  return cleanText(out);
}

function removeGeneratedNames(text = "", storyboard = {}) {
  let out = String(text || "");
  const names = new Set([
    "Mikhail", "Tomas", "Thomas", "John", "Peter", "Aldric", "Marta", "Luc", "Matthieu", "Etienne",
  ]);
  for (const name of names) {
    const safe = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${safe}\\b`, "g"), "the character");
  }
  return cleanText(out);
}

function sanitizeSensitiveMinorTerms(text = "", minorSafe = false) {
  let out = String(text || "");
  if (!minorSafe) return cleanText(out);
  const replacements = [
    [/\bchild execution\b/gi, "tense medieval court scene"],
    [/\bexecution\b/gi, "public sentence context"],
    [/\bhanging\b/gi, "wooden gallows structure"],
    [/\bhanged\b/gi, "sentenced"],
    [/\bnoose\b/gi, "rope above the platform"],
    [/\bkill(?:ed|ing)?\b/gi, "condemn"],
    [/\bdeath\b/gi, "grave consequence"],
    [/\bpunishment of a child\b/gi, "historical court consequence"],
    [/казн[ьиь]/gi, "суровый приговор"],
    [/повешен/gi, "приговорён"],
    [/петл[яюи]/gi, "верёвка над помостом"],
  ];
  for (const [re, repl] of replacements) out = out.replace(re, repl);
  return cleanText(out);
}

function stripNoVoiceGarbage(text = "", includeVo = false) {
  let out = cleanText(text)
    .replace(/No dialogue, no No dialogue, no voiceover;?/gi, "No dialogue, no voiceover;")
    .replace(/No dialogue, no no dialogue, no voiceover;?/gi, "No dialogue, no voiceover;")
    .replace(/No dialogue, No voiceover/gi, "No dialogue, no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/no no/gi, "no")
    .replace(/\bNo Maintain\b/gi, "Maintain");

  if (!includeVo) {
    out = out
      .replace(/\bVoice\/no dialogue allowed by user only if needed\.?/gi, "")
      .replace(/\bVoice\/dialogue allowed by user only if needed\.?/gi, "");
    out = out.split(/(?<=[.!?])\s+/).filter((sentence) => {
      const s = cleanText(sentence);
      if (!/\b(voiceover|narration|speech|spoken line|VO)\b/i.test(s)) return true;
      return /\b(no speech|no voiceover|no narration|no dialogue|NO SPEECH|NO VOICEOVER)\b/i.test(s);
    }).join(" ");
  }

  return cleanText(out);
}

function keepOneSection(text = "", label = "Audio") {
  const src = String(text || "");
  const re = new RegExp(`\\b${label}\\s*:[\\s\\S]*?(?=\\bShot progression\\s*:|\\bCamera behavior\\s*:|\\bLighting\\s*:|\\bColor grade\\s*:|\\bPhysics\\s*:|\\bAudio\\s*:|\\bSFX\\s*:|\\bMaintain\\b|\\bUltra consistency\\b|\\bFormat\\s*:|$)`, "gi");
  const matches = src.match(re) || [];
  if (matches.length <= 1) return cleanText(src);
  let first = true;
  return cleanText(src.replace(re, (m) => {
    if (first) {
      first = false;
      return m;
    }
    return "";
  }));
}

function dedupeFinalPrompt(text = "") {
  let out = cleanText(text)
    .replace(/\bAction\s*:\s*Action\s*:/gi, "Action:")
    .replace(/\.\./g, ".")
    .replace(/\s+\./g, ".")
    .replace(/\bNo Maintain\b/gi, "Maintain");

  out = keepOneSection(out, "Shot progression");
  out = keepOneSection(out, "Camera behavior");
  out = keepOneSection(out, "Lighting");
  out = keepOneSection(out, "Color grade");
  out = keepOneSection(out, "Physics");
  out = keepOneSection(out, "Audio");
  out = keepOneSection(out, "SFX");

  const maintainFirst = out.match(/Maintain exact character appearance, clothing and condition from the uploaded frame\.?/i)?.[0]
    || out.match(/Maintain exact character appearance, clothing, lighting and condition from the uploaded frame\.?/i)?.[0]
    || out.match(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/i)?.[0];

  out = out
    .replace(/Maintain exact character appearance, clothing and condition from the uploaded frame\.?/gi, "")
    .replace(/Maintain exact character appearance, clothing, lighting and condition from the uploaded frame\.?/gi, "")
    .replace(/Maintain EXACT same character appearance, face, clothing, and condition as previous frame\.?/gi, "");
  if (maintainFirst) out = `${out} ${maintainFirst.replace(/\.?$/, ".")}`;

  return cleanText(out)
    .replace(/No dialogue,\s*No voiceover/gi, "No dialogue, no voiceover")
    .replace(/\bNo\s+No\b/gi, "No")
    .replace(/\.\s*\./g, ".");
}

export const REALISM_ANCHORS_SKIN = [
  "visible skin pores on nose bridge and cheeks",
  "natural skin texture with micro-imperfections",
  "subsurface scattering on skin",
  "fine facial asymmetry",
  "peach fuzz catching light",
  "subtle under-eye shadows",
  "subsurface flush on cheekbones",
];

export const REALISM_ANCHORS_HAIR_FABRIC = [
  "individual hair strands visible",
  "fabric weave detail in focus zone",
  "tension wrinkles from stress points",
  "fabric gravity drape",
];

export const REALISM_ANCHORS_OPTICS = [
  "subtle 35mm film grain",
  "natural lens vignette",
  "lens chromatic aberration on high-contrast edges",
  "real optical bokeh",
  "luminance grain in shadows",
];

export const BANNED_WORDS = [
  "epic", "stunning", "beautiful", "masterpiece", "high quality", "8K", "8k", "ultra HD", "4K",
  "perfect", "flawless", "breathtaking", "hyperrealistic", "AI generated", "rendered", "CGI",
  "octane render", "trending on artstation",
];

export const NEGATIVE_PROMPT_BASE =
  "plastic skin, waxy texture, beauty filter, skin smoothing, oversaturated colors, soap opera effect, motion interpolation, morphing features, extra fingers, dead eyes, frozen face, lifeless gaze, AI artifacts, fake bokeh, smooth airbrushed skin, HDR tonemapping, oversharpened edges, subtitles, watermark, logo, UI text on screen";

export function buildCharacterBlock(characterLock = [], { compact = false, omitNames = false } = {}) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return "";
  const take = compact ? characterLock.slice(0, 1) : characterLock;
  return take.map((c, i) => {
    const label = omitNames ? (Number(c.age) < 18 ? "the child" : `the character ${i + 1}`) : (c.name || `Character ${i + 1}`);
    const parts = [
      label,
      c.age ? `${c.age}y old` : null,
      c.face_features || c.description,
      c.hair,
      c.clothing,
      c.physical_condition,
    ].filter(Boolean);
    return parts.join(", ");
  }).join(" | ");
}

function getRelevantCharacterLock(characterLock = [], frame = {}) {
  if (!Array.isArray(characterLock) || characterLock.length === 0) return [];
  const haystack = cleanText([
    frame.description_ru,
    frame.description_en,
    stripGeneratedPromptSections(frame.image_prompt_en),
    stripGeneratedPromptSections(frame.video_prompt_en),
    frame.vo_ru,
  ].filter(Boolean).join(" ")).toLowerCase();
  const relevant = characterLock.filter((c) => {
    const name = cleanText(c.name || "").toLowerCase();
    return name.length >= 3 && haystack.includes(name);
  });
  return relevant.length ? relevant : characterLock.slice(0, 1);
}

function getFrameAction(frame = {}) {
  const preferred = [
    frame.motion,
    frame.story_action_en,
    frame.action_en,
    frame.action,
    frame.description_en,
    frame.description_ru,
    frame.vo_ru,
    frame.image_prompt_en,
  ];
  for (const value of preferred) {
    const cleaned = stripGeneratedPromptSections(value || "");
    if (cleaned && cleaned.length > 12) return cleaned;
  }
  return "";
}

function getScriptLine(frame = {}) {
  return cleanText(frame.vo_ru || frame.script_line_ru || frame.script_line || "");
}

function getSourceTruthAction(frame = {}) {
  const scriptLine = getScriptLine(frame);
  return scriptLine || getFrameAction(frame);
}

function getSourceTruthVisual(frame = {}) {
  const scriptLine = getScriptLine(frame);
  return scriptLine || stripGeneratedPromptSections(frame.image_prompt_en || frame.description_en || frame.description_ru || "");
}

function compactVideoBeat(text = "", maxWords = 34) {
  let out = stripGeneratedPromptSections(text)
    .replace(/\bARRI Alexa[^.]*\.?/gi, "")
    .replace(/\bZeiss Master Prime[^.]*\.?/gi, "")
    .replace(/\bKodak Portra 400[^.]*\.?/gi, "")
    .replace(/\banamorphic 35mm[^.]*\.?/gi, "")
    .replace(/\bVisible skin pores[^.]*\.?/gi, "")
    .replace(/\bForeground\s*:[^.]*\.?/gi, "")
    .replace(/\bMidground\s*:[^.]*\.?/gi, "")
    .replace(/\bBackground\s*:[^.]*\.?/gi, "")
    .replace(/\bExtreme low-angle close-up[^.]*\.?/gi, "")
    .replace(/\bMedium long lens shot[^.]*\.?/gi, "")
    .replace(/\bClose-up shot[^.]*\.?/gi, "");
  out = cleanText(out).split(/(?<=[.!?])\s+/)[0] || cleanText(out);
  return limitWords(out, maxWords).replace(/\.$/, "");
}

function compactCameraMove(text = "", maxWords = 14) {
  const out = cleanText(text || "subtle slow push-in")
    .replace(/\bARRI Alexa[^,.;]*[,.;]?/gi, "")
    .replace(/\bZeiss Master Prime[^,.;]*[,.;]?/gi, "")
    .replace(/\bKodak[^,.;]*[,.;]?/gi, "");
  return limitWords(out, maxWords).replace(/\.$/, "");
}

function inferMicroMotion(action = "", frame = {}) {
  const text = cleanText([action, frame.description_ru, frame.description_en, frame.image_prompt_en, frame.sfx].filter(Boolean).join(" ")).toLowerCase();
  const moves = [];
  if (/(hand|finger|palm|рук|палец|ладон)/i.test(text)) moves.push("the raised hand trembles slightly, fingers tense");
  if (/(bed|blanket|mattress|кровать|одеял|матрас)/i.test(text)) moves.push("the blanket shifts with shallow breathing");
  if (/(screen|monitor|экран)/i.test(text)) moves.push("the white screen flickers almost imperceptibly");
  if (/(dust|smoke|пыль|дым)/i.test(text)) moves.push("dust drifts through the light");
  if (/(projector|проектор|film|пл[её]нк)/i.test(text)) moves.push("the projector vibrates softly, tiny mechanical jitter in the frame");
  if (/(walk|ид[её]т|шага|corridor|коридор)/i.test(text)) moves.push("subtle body movement and small handheld camera drift");
  return dedupeList(moves).slice(0, 3).join("; ") || "only subtle natural motion, no new action";
}

function buildCompactVideoPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const duration = Math.min(6, Math.max(3, Number(frame.duration || 3) || 3));
  const rawAction = sanitizeSensitiveMinorTerms(removeGeneratedNames(getSourceTruthAction(frame), storyboard), minorSafe);
  const beat = compactVideoBeat(rawAction, 34) || "hold the visible scene in tense stillness";
  const camera = compactCameraMove(frame.camera || "subtle slow push-in", 14);
  const motion = inferMicroMotion(rawAction, frame);
  const audio = buildAudioPlan({ frame, storyboard, action: rawAction });
  const noVoice = includeVo && frame.vo_ru ? "Voiceover may be added separately; keep this clip non-verbal." : "ABSOLUTE AUDIO LOCK: no human voice, no speech, no dialogue, no narration, no whisper, no voiceover, no music.";
  const continuity = consistency === "ultra"
    ? "Keep the exact uploaded composition, lighting, clothing, grime and object layout."
    : "Keep visual continuity with the uploaded frame.";

  const scriptAnchorLine = includeVo ? frame.vo_ru : String(frame.vo_ru||"").replace(/\bголос(ом|а|у|е)?\b/gi,"звук").replace(/\bvoice(over)?\b/gi,"sound");
  const scriptAnchor = scriptAnchorLine
    ? `Script line: "${String(frame.vo_ru).replace(/\bголос(ом|а|у|е)?\b/gi,"звук").replace(/\bvoice(over)?\b/gi,"sound").slice(0,120)}". Animate ONLY what this line describes.`
    : "";

  return limitWords(dedupeFinalPrompt([
    `${duration}-second I2V shot.`,
    continuity,
    scriptAnchor,
    `Camera: ${camera}.`,
    `Action: ${beat}.`,
    `Motion: ${motion}.`,
    "Harsh practical light, dirty concrete shadows, gritty documentary realism.",
    `SFX: ${dedupeList([audio.primary, ...audio.background]).slice(0, 4).join(", ")}.`,
    `${noVoice} No subtitles, no UI, no watermark, no new objects, no new characters, no reframe.`,
    `Format: ${aspectRatio}, live-action.`
  ].filter(Boolean).join(" ")), 115);
}

export function buildImagePrompt({ frame = {}, storyboard = {}, target = "veo3" } = {}) {
  const aspectRatio = storyboard.aspect_ratio || "9:16";
  const totalScenes = Array.isArray(storyboard.scenes) ? storyboard.scenes.length : 0;
  const frameNum = Number(String(frame.id || "").replace(/\D/g, "")) || 1;
  const relevantCharacters = getRelevantCharacterLock(storyboard.character_lock, frame);
  const characterBlock = buildCharacterBlock(relevantCharacters, { compact: target === "grok", omitNames: target === "grok" });
  const sceneVisual = cleanText(stripGeneratedPromptSections(frame.image_prompt_en || frame.description_en || frame.description_ru || ""));
  const sourceTruthVisual = getSourceTruthVisual(frame) || sceneVisual;
  const camera = cleanText(frame.camera || "static documentary frame, natural lens perspective");
  const anchors = [REALISM_ANCHORS_SKIN[0], REALISM_ANCHORS_HAIR_FABRIC[0], REALISM_ANCHORS_OPTICS[0]].join(", ");

  if (target === "grok") {
    // Структурированный формат: Storyboard panel X of Y
    const panelLabel = `Storyboard panel ${frameNum} of ${totalScenes || "?"}:`;
    const arFlag = aspectRatio === "9:16" ? "--ar 9:16" : aspectRatio === "16:9" ? "--ar 16:9" : "--ar 1:1";

    const sourceLine = getScriptLine(frame);

    // Subject блок — character_lock фиксирует идентичность, но не добавляет героя в кадр без поддержки script line.
    const subjectBlock = characterBlock
      ? `Subject: ${characterBlock} only if present in the source line`
      : `Subject: ${limitWords(sourceTruthVisual, 18)}`;

    // Action & Emotion строго из source line / vo_ru.
    const actionBlock = limitWords(sourceTruthVisual, 24);

    // Environment не имеет права расширять сценарий.
    const envBlock = "Environment: only location, time, weather and props stated or directly implied by the source line";

    // Style — из global_style_lock или master_style
    const styleRef = storyboard.master_style
      ? storyboard.master_style.replace("Overall visual style:", "").trim()
      : cleanText((storyboard.global_style_lock || "").split(".")[0] || "cinematic documentary realism");

    // Lighting из camera или style
    const lightBlock = cleanText(frame.camera || "").includes("light")
      ? cleanText(frame.camera)
      : "cinematic lighting, natural available light, soft shadows";

    // Stylize — берём от 250 до 450 зависимости от beat_type
    const stylize = frame.beat_type === "hook" ? "450" : frame.beat_type === "ending" ? "400" : "300";

    return cleanText([
      panelLabel,
      sourceLine ? `Source line: "${limitWords(sourceLine, 24)}".` : "Source line: storyboard frame description.",
      subjectBlock + ".",
      `Action & Emotion: ${actionBlock}.`,
      envBlock + ".",
      lightBlock + ".",
      `Camera: ${camera}.`,
      `Style: ${styleRef}.`,
      "no extra objects, no extra locations, no extra characters, sharp focus, cinematic lighting, photorealistic",
      `${arFlag} --stylize ${stylize} --v 6`,
    ].filter(Boolean).join(" "));
  }

  return cleanText([
    sceneVisual,
    characterBlock ? `Subject: ${characterBlock}` : "",
    `Camera: ${camera}`,
    "Lighting: natural available light, soft ground bounce fill, realistic shadow penumbra",
    "Color grade: desaturated shadows, lifted blacks, natural skin tones",
    `Realism anchors: ${anchors}`,
    `Format: ${aspectRatio}, live-action photographic frame`,
  ].filter(Boolean).join(". "));
}

function getShotProgression(frame = {}) {
  const id = String(frame?.id || "");
  const n = Number(id.match(/\d+/)?.[0] || frame?.index || 1);
  const phase = n <= 3 ? "HOOK" : n <= 8 ? "BUILD" : n <= 15 ? "ESCALATION" : "PAYOFF";
  const rhythm = {
    HOOK: "immediate visual hook, minimal motion, suspended dread",
    BUILD: "slow reveal, camera discovers one new clue, tension grows without rushing",
    ESCALATION: "stronger motion cues, pressure rises, environmental movement becomes more noticeable",
    PAYOFF: "controlled final emphasis, hold the question, do not over-animate"
  }[phase];
  return { n, phase, rhythm };
}

// Для Grok — укороченные SFX теги без ASMR-нарратива (ограничение токенов)
function buildGrokSfxLine(audio) {
  const simplify = (cue) => String(cue || "").split(" — ")[0].split("; ")[0].slice(0, 50);
  return dedupeList([audio.primary, ...audio.background].map(simplify)).slice(0, 3).join(", ");
}

function buildGrokCheapPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  const action = sanitizeSensitiveMinorTerms(removeGeneratedNames(getSourceTruthAction(frame), storyboard), minorSafe) || "the visible subject holds position with subtle movement";
  const sourceLine = getScriptLine(frame) || action;
  const audio = buildAudioPlan({ frame, storyboard, action });
  const noVoice = includeVo ? "" : "NO SPEECH. NO HUMAN VOICES.";
  const duration = Math.min(8, Math.max(3, Number(frame.duration || 5)));
  const camera = cleanText(frame.camera || "static handheld").split(",")[0].trim();
  const sfxShort = buildGrokSfxLine(audio);

  // Grok compact structure: source line, locked uploaded frame, one movement, one camera, short SFX.
  return limitWords(dedupeFinalPrompt([
    noVoice,
    "SOURCE OF TRUTH: script line.",
    `Script: "${limitWords(sourceLine, 16)}".`,
    "Preserve uploaded frame; animate only this described action.",
    "No new objects, locations, characters, or scene change.",
    `Camera: ${limitWords(camera, 8)}.`,
    `SFX: ${sfxShort}.`,
    `Photorealistic 24fps. ${duration}s --motion 4`,
  ].filter(Boolean).join(" ")), 77);
}

function buildGrokProPrompt({ frame = {}, storyboard = {}, includeVo = false, consistency = "ultra" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  let action = removeGeneratedNames(getSourceTruthAction(frame), storyboard);
  action = sanitizeSensitiveMinorTerms(action, minorSafe) || "the visible scene holds tension with subtle physical motion";
  const duration = Math.min(10, Math.max(4, Number(frame.duration || 5)));
  const camera = cleanText(frame.camera || "subtle handheld documentary movement");
  const audio = buildAudioPlan({ frame, storyboard, action });
  const noVoice = includeVo ? "" : "NO SPEECH. NO HUMAN VOICES. NO VOICEOVER.";
  const shot = getShotProgression(frame);
  const sourceLine = getScriptLine(frame) || action;
  const sfxShort = buildGrokSfxLine(audio);

  // Берём стиль из master_style или global_style_lock
  const styleRef = storyboard.master_style
    ? storyboard.master_style.replace("Overall visual style:", "").trim().split(",")[0]
    : cleanText((storyboard.global_style_lock || "").split(".")[0] || "natural light, documentary realism");

  // Структура: source line, locked frame, one visible action, one camera sentence, compact SFX.
  const motionVal = shot.phase === "HOOK" ? 3 : shot.phase === "ESCALATION" ? 6 : shot.phase === "PAYOFF" ? 7 : 4;

  return limitWords(dedupeFinalPrompt([
    noVoice,
    "SOURCE OF TRUTH: script line.",
    `Script: "${limitWords(sourceLine, 18)}".`,
    "Preserve uploaded frame; animate only this described action.",
    "No new objects, locations, characters, weather, or scene change.",
    `Camera: ${limitWords(camera, 10)}.`,
    `Pace: ${shot.phase.toLowerCase()}, ${limitWords(shot.rhythm, 8)}.`,
    `SFX: ${sfxShort}.`,
    `${limitWords(styleRef, 5)}, photorealistic 24fps. ${duration}s --motion ${motionVal}`,
  ].filter(Boolean).join(" ")), 77);
}

export function buildVideoPromptFor({
  frame = {},
  storyboard = {},
  target = "veo3",
  includeVo = false,
  promptMode = "pro",
  consistency = "ultra",
} = {}) {
  const normalizedTarget = String(target || "veo3").toLowerCase();

  if (normalizedTarget === "grok") {
    const prompt = promptMode === "cheap"
      ? buildGrokCheapPrompt({ frame, storyboard, includeVo, consistency })
      : buildGrokProPrompt({ frame, storyboard, includeVo, consistency });
    return cleanText(prompt.replace(/^ANIMATE CURRENT FRAME[:\s—-]*/i, ""));
  }

  return buildCompactVideoPrompt({ frame, storyboard, includeVo, consistency });
}

const BANNED_REPLACEMENTS = {
  epic: "intense",
  stunning: "vivid",
  beautiful: "striking",
  masterpiece: "production-grade",
  "high quality": "production-grade",
  "8K": "high resolution",
  "8k": "high resolution",
  "ultra HD": "high resolution",
  "4K": "high resolution",
  perfect: "precise",
  flawless: "controlled",
  breathtaking: "arresting",
  hyperrealistic: "photorealistic",
  "AI generated": "photographed",
  rendered: "photographed",
  CGI: "photographed",
  "octane render": "natural light photograph",
  "trending on artstation": "documentary realism",
};

export function stripBannedWords(text = "") {
  let out = String(text || "");
  for (const [banned, replacement] of Object.entries(BANNED_REPLACEMENTS)) {
    const re = new RegExp(`\\b${banned.replace(/\s+/g, "\\s+")}\\b`, "gi");
    out = out.replace(re, replacement);
  }
  return cleanText(out).replace(/,\s*,+/g, ",");
}

export function finalizePromptCleaners(text = "", { frame = {}, storyboard = {}, includeVo = false, target = "veo3" } = {}) {
  const minorSafe = hasMinorContext(frame, storyboard);
  let out = stripBannedWords(text);
  out = stripNoVoiceGarbage(out, includeVo);
  out = sanitizeSensitiveMinorTerms(out, minorSafe);
  out = dedupeFinalPrompt(out);

  if (!includeVo) {
    const hardNoVoice = "NO SPEECH. NO HUMAN VOICES. NO NARRATION. NO DIALOGUE. NO VOICEOVER. AMBIENT SFX ONLY.";
    if (String(target).toLowerCase() === "grok" && !out.startsWith("NO SPEECH")) out = `${hardNoVoice} ${out}`;
    if (!/(No dialogue,\s*no voiceover|No speech,\s*no voiceover|NO SPEECH)/i.test(out) && String(target).toLowerCase() !== "grok") {
      out = `${out} No dialogue, no voiceover; ambient sound and SFX only.`;
    }
  }
  return dedupeFinalPrompt(out);
}

function ensureSfxLine(text = "", frame = {}, storyboard = {}) {
  let out = dedupeFinalPrompt(text).replace(/\bNo\s+SFX\s*:/gi, "SFX:");
  if (!/\bSFX\s*:/i.test(out)) {
    const action = getFrameAction(frame);
    const audio = buildAudioPlan({ frame, storyboard, action });
    out = `${out} SFX: ${audio.sfxLine}.`;
  }
  return dedupeFinalPrompt(out);
}

export function buildFramePromptsForTarget({ frame, storyboard, target = "veo3", includeVo = false, promptMode = "pro", consistency = "ultra" }) {
  const imagePrompt = ensurePromptPrefix(
    stripBannedWords(buildImagePrompt({ frame, storyboard, target })),
    "SCENE PRIMARY FOCUS:"
  );
  const rawVideo = buildVideoPromptFor({ frame, storyboard, target, includeVo, promptMode, consistency });
  const cleanedVideo = ensureSfxLine(finalizePromptCleaners(rawVideo, { frame, storyboard, includeVo, target }), frame, storyboard);
  const videoPrompt = ensurePromptPrefix(cleanedVideo, "ANIMATE CURRENT FRAME:");

  return {
    image_prompt_en: imagePrompt,
    video_prompt_en: videoPrompt,
    negative_prompt: NEGATIVE_PROMPT_BASE,
    target,
  };
}

export function validateFramePrompts({ frame, storyboard, target = "veo3" }) {
  const errors = [];
  const text = `${frame.image_prompt_en || ""} ${frame.video_prompt_en || ""}`;
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) errors.push(`banned word: "${word}"`);
  }
  if (frame.image_prompt_en && !/^SCENE PRIMARY FOCUS:/i.test(frame.image_prompt_en)) errors.push("image prompt missing SCENE PRIMARY FOCUS prefix");
  if (frame.video_prompt_en && !/^ANIMATE CURRENT FRAME:/i.test(frame.video_prompt_en)) errors.push("video prompt missing ANIMATE CURRENT FRAME prefix");
  if (frame.video_prompt_en && !/\bSFX\s*:/i.test(frame.video_prompt_en)) errors.push("video prompt missing embedded SFX block");
  if (/Action:\s*Action:|No Maintain|Shot progression:[\s\S]*Shot progression:|Audio:[\s\S]*Audio:|SFX:[\s\S]*SFX:/i.test(frame.video_prompt_en || "")) {
    errors.push("video prompt contains duplicated generated sections");
  }
  if (/alarm|siren|alert|warning/i.test(`${frame.sfx || ""}`) && !/PRIMARY SFX\s*—\s*[^.]*alarm|PRIMARY SFX\s*—\s*[^.]*siren|Audio priority/i.test(frame.video_prompt_en || "")) {
    errors.push("alarm/siren cue is not promoted as primary audio event");
  }
  if (target === "grok") {
    const wordCount = cleanText(frame.video_prompt_en || "").split(/\s+/).length;
    if (wordCount > 80) errors.push(`Grok video prompt too long: ${wordCount} words (max 80)`);
    if (/human voices|voiceover|dialogue|narration/i.test(frame.video_prompt_en || "")) {
      if (!/^ANIMATE CURRENT FRAME:\s*NO SPEECH/i.test(frame.video_prompt_en || "")) errors.push("Grok prompt may allow voices/dialogue");
    }
  }
  return { ok: errors.length === 0, errors };
}
