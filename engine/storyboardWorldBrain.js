// engine/storyboardWorldBrain.js
// NeuroCine old storyboard — world/audio/reference logic guard.
// This layer prevents modern sounds/objects from being invented when the script world makes them impossible.

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function lowerContext(frame = {}, storyboard = {}) {
  return cleanText([
    storyboard?.project_name,
    storyboard?.topic,
    storyboard?.script,
    storyboard?.global_style_lock,
    frame?.description_ru,
    frame?.description_en,
    frame?.image_prompt_en,
    frame?.video_prompt_en,
    frame?.vo_ru,
    frame?.sfx,
    frame?.camera,
  ].filter(Boolean).join(" ")).toLowerCase();
}

function scriptAllowsModernEmergency(frame = {}, storyboard = {}) {
  const scriptText = cleanText([
    frame?.vo_ru,
    frame?.script_line_ru,
    frame?.script_line,
  ].filter(Boolean).join(" ")).toLowerCase();
  return /(сирен|тревог|скорая|полици|аварийн|маяк|alarm|siren|alert|warning|beacon|ambulance|police|modern emergency)/i.test(scriptText);
}

function inferWorldProfile(frame = {}, storyboard = {}) {
  const text = lowerContext(frame, storyboard);

  const ancient = /(древн|семь тысяч|7000|тысяч лет|ч[её]рного моря|босфор|пресное озеро|хижин|коз|кост[её]р|берегов|потоп|ancient|7000|black sea|bosphorus|hut|goat|campfire|flood myth)/i.test(text);
  const medieval = /(средневек|замок|рыцар|крестьян|лошад|меч|medieval|castle|knight|peasant|horse|sword)/i.test(text);
  const space = /(космос|орбит|скафандр|корабл|space|orbit|helmet|spaceship|airlock)/i.test(text);
  const modern = /(современ|город|машин|полици|скорая|телефон|метро|офис|modern|city|car\b|police|ambulance|phone|subway|office)/i.test(text);

  if (ancient) {
    return {
      id: "ancient_documentary",
      label: "ancient historical documentary reconstruction",
      allowedAudio: "dry wind over cracked earth, soft footsteps on dry soil, rustling dry grass, distant low water pressure, soft water movement, fire embers, goats or distant settlement ambience only when visible, low natural documentary tension",
      forbiddenAudio: "sirens, alarms, ambulance, police, cars, engines, city noise, radio, phones, electronic warning tones, modern emergency sounds, synthetic disaster alarms",
      forbiddenObjects: "modern vehicles, asphalt roads, street lights, police, ambulance, phones, power lines, modern buildings, modern clothing unless explicitly required",
      rule: "Only sounds and objects physically possible in an ancient Black Sea basin / historical reconstruction are allowed.",
    };
  }

  if (medieval) {
    return {
      id: "medieval_historical",
      label: "medieval historical world",
      allowedAudio: "wind, footsteps, horses, leather, cloth, wood creaks, metal armor, distant crowd, bells only if historically present, fire and rain if visible",
      forbiddenAudio: "sirens, ambulance, police, cars, engines, phones, radio, electronic alarms, modern city noise",
      forbiddenObjects: "cars, phones, street lights, power lines, police, ambulance, asphalt roads, modern signage",
      rule: "Only medieval-era physical sounds and objects are allowed.",
    };
  }

  if (space) {
    return {
      id: "space_scifi",
      label: "space / spacecraft world",
      allowedAudio: "inside-helmet breathing, suit fabric, radio static only if communications are present, low spacecraft vibration, interior hum, muffled impacts through structure",
      forbiddenAudio: "open-air wind in vacuum, birds, street traffic, random ambulance sirens, police sirens, city noise",
      forbiddenObjects: "unexplained city props, random cars, period-inconsistent objects",
      rule: "Audio must obey space physics: no open-air sound in vacuum; only interior/contact/transmitted sound.",
    };
  }

  if (modern) {
    return {
      id: "modern_world",
      label: "modern world",
      allowedAudio: "location-specific modern ambience only if visible or scripted",
      forbiddenAudio: "random sirens, alarms or emergency tones unless the script or visible frame explicitly contains emergency vehicles, police, alarm hardware or city emergency context",
      forbiddenObjects: "unrelated props not in the script",
      rule: "Modern sounds are allowed only when supported by the script or visible frame, never just because the mood is dramatic.",
    };
  }

  return {
    id: "generic_documentary",
    label: "documentary world",
    allowedAudio: "scene-matched natural ambience, footsteps, fabric, breath, wind, room tone or environmental texture that physically belongs to the visible location",
    forbiddenAudio: "random sirens, alarms, ambulance, police, engines, electronic warning tones unless explicitly present in the script or visible frame",
    forbiddenObjects: "unrelated objects, unrelated era, unrelated location elements",
    rule: "Audio and props must come from the visible world and the script, not from generic dramatic mood.",
  };
}

function hasFaceVisible(frame = {}) {
  const text = cleanText([
    frame?.description_ru,
    frame?.description_en,
    frame?.image_prompt_en,
    frame?.video_prompt_en,
    frame?.camera,
  ].filter(Boolean).join(" "))
    .replace(/\bREFERENCE VISIBILITY RULE\s*:[\s\S]*$/i, "")
    .toLowerCase();
  if (/(tense face|reflected eye|three-quarter profile|face tilted|visible face|close-up|portrait|profile|лицо|крупный план)/i.test(text)) return true;
  if (/(ног|сандал|стоп|feet|foot|sandals|legs|low close-up|низкий план ног)/i.test(text)) return false;
  if (/(со спины|спина|затылок|back view|from behind|rear view|back of head)/i.test(text)) return false;
  if (/(close-up|portrait|3\/4|three-quarter|face|лицо|портрет|крупный план)/i.test(text)) return true;
  return false;
}

function buildReferenceVisibilityRule(frame = {}, storyboard = {}) {
  const hasCharacters = Array.isArray(storyboard?.character_lock) && storyboard.character_lock.length > 0;
  if (!hasCharacters) return "";

  if (hasFaceVisible(frame)) {
    return "REFERENCE VISIBILITY RULE: The face is visible in this shot. Match the uploaded hero/reference identity strictly: same facial structure, eyes, nose, jawline, hair, skin tone and stable distinguishing features. If the reference clothing is modern, use it only for identity, not wardrobe, unless the script requires modern clothing.";
  }

  return "REFERENCE VISIBILITY RULE: The face is not clearly visible in this shot. Do not invent a new face. Preserve identity through body type, hair silhouette, clothing continuity, posture and world-appropriate wardrobe. Face Lock cannot be judged in this frame; include a later visible-face shot when the story allows it.";
}

function removeForbiddenAudio(text = "", profile, allowModernEmergency = false) {
  let out = String(text || "");
  if (allowModernEmergency) return cleanText(out);

  const replacements = [
    [/\b(loud\s+)?(rotating\s+)?alarm siren\b/gi, "low natural tension"],
    [/\bambulance siren\b/gi, "distant natural ambience"],
    [/\bpolice siren\b/gi, "distant natural ambience"],
    [/\bsiren(s)?\b/gi, "natural ambience"],
    [/\balarm(s)?\b/gi, "natural tension"],
    [/\balert tone(s)?\b/gi, "low environmental tone"],
    [/\bwarning tone(s)?\b/gi, "low environmental tone"],
    [/\bemergency sound(s)?\b/gi, "scene-matched natural ambience"],
    [/\bengine(s)?\b/gi, ""],
    [/\bcars?\b/gi, ""],
    [/\bambulance\b/gi, ""],
    [/\bpolice\b/gi, ""],
    [/сирен[ауы]?/gi, "естественный шум среды"],
    [/тревог[ауы]?/gi, "естественное напряжение"],
    [/скор(ая|ой|ую)/gi, ""],
    [/полици[яию]/gi, ""],
  ];

  for (const [re, repl] of replacements) out = out.replace(re, repl);
  return cleanText(out).replace(/,\s*,+/g, ",").replace(/\.\s*\./g, ".");
}

export function buildWorldAudioBlock(frame = {}, storyboard = {}) {
  const profile = inferWorldProfile(frame, storyboard);
  const allowModernEmergency = scriptAllowsModernEmergency(frame, storyboard);
  return {
    profile,
    allowModernEmergency,
    block: [
      `WORLD LOGIC: ${profile.label}. ${profile.rule}`,
      `ALLOWED AUDIO: ${profile.allowedAudio}.`,
      allowModernEmergency ? "SCRIPT ALLOWS MODERN EMERGENCY AUDIO: yes, only if directly visible or scripted." : `FORBIDDEN AUDIO: ${profile.forbiddenAudio}.`,
      `FORBIDDEN OBJECTS: ${profile.forbiddenObjects}.`,
      buildReferenceVisibilityRule(frame, storyboard),
    ].filter(Boolean).join(" "),
  };
}

function scriptLineFor(frame = {}) {
  return cleanText(frame?.vo_ru || frame?.script_line_ru || frame?.script_line || "");
}

function buildSourceTruthRule(frame = {}, { compact = false } = {}) {
  const line = scriptLineFor(frame).slice(0, 180);
  if (compact) {
    return line
      ? `SOURCE OF TRUTH: script line only. Preserve uploaded frame; animate only what this script line describes.`
      : "SOURCE OF TRUTH: storyboard frame only. Preserve uploaded frame; animate only described visible action.";
  }
  return line
    ? `SOURCE OF TRUTH OBJECT RULE: SCRIPT LINE is law: "${line}". Do not add any object, location, character, weather, era detail or action that is not supported by this line.`
    : "SOURCE OF TRUTH OBJECT RULE: storyboard frame is law. Do not add objects, locations, characters, weather, era details or actions not supported by the frame.";
}

export function applyWorldBrainToFrame(frame = {}, storyboard = {}) {
  const { profile, allowModernEmergency, block } = buildWorldAudioBlock(frame, storyboard);
  const cleanSfx = removeForbiddenAudio(frame.sfx || "scene-matched ambience", profile, allowModernEmergency);
  const next = { ...frame, sfx: cleanSfx || profile.allowedAudio };

  if (next.image_prompt_en) {
    next.image_prompt_en = cleanText(`${next.image_prompt_en} ${buildSourceTruthRule(frame)} ${buildReferenceVisibilityRule(frame, storyboard)} WORLD OBJECT RULE: ${profile.forbiddenObjects ? `Do not show ${profile.forbiddenObjects}.` : "Do not add unrelated objects."}`);
  }
  if (next.video_prompt_en) {
    const isGrok = String(next.target || frame.target || "").toLowerCase() === "grok";
    next.video_prompt_en = applyWorldBrainToVideoPrompt(next.video_prompt_en, next, storyboard, { compact: isGrok });
  }
  return next;
}

export function applyWorldBrainToVideoPrompt(prompt = "", frame = {}, storyboard = {}, options = {}) {
  const { profile, allowModernEmergency, block } = buildWorldAudioBlock(frame, storyboard);
  const cleaned = removeForbiddenAudio(prompt, profile, allowModernEmergency);
  const sfx = removeForbiddenAudio(frame.sfx || profile.allowedAudio, profile, allowModernEmergency) || profile.allowedAudio;
  if (options.compact) {
    const guard = allowModernEmergency
      ? "Emergency sounds only if visible in the uploaded frame."
      : "No random sirens, alarms, emergency tones, vehicles or unrelated props.";
    return cleanText(`${cleaned} ${buildSourceTruthRule(frame, { compact: true })} ${guard}`);
  }
  const noModern = allowModernEmergency ? "" : ` HARD NEGATIVE AUDIO: ${profile.forbiddenAudio}.`;
  return cleanText(`${cleaned} ${buildSourceTruthRule(frame)} ${block} PRIMARY SFX MUST BE: ${sfx}.${noModern}`);
}

export function applyWorldBrainToStoryboard(storyboard = {}) {
  if (!storyboard || !Array.isArray(storyboard.scenes)) return storyboard;
  const base = {
    ...storyboard,
    world_audio_lock: storyboard.world_audio_lock || "Scene audio must be physically possible for the script era, location and visible objects. Do not use modern sirens/alarms unless explicitly scripted.",
  };
  base.scenes = storyboard.scenes.map((scene) => applyWorldBrainToFrame(scene, base));
  return base;
}
