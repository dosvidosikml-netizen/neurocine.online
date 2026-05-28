// engine/ambientBedEngine.js
// NeuroCine — авто-спецификация фоновой ambient-дорожки под каждый клип.
// Для Grok (и любого немого рендера) даёт готовый промт под генератор звука
// (ElevenLabs SFX / Suno / стоковый луп) + настройки микса, чтобы фон
// автоматически соответствовал сцене, стилю и SFX — а не подбирался вручную.

function clean(v = "") {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function splitCues(raw = "") {
  return clean(raw)
    .split(/[;,]|\s—\s|\.\s+/)
    .map((c) => clean(c))
    .filter(Boolean);
}

function styleTagOf(storyboard = {}) {
  const label = clean(
    storyboard?.style_profile?.style_label ||
    storyboard?.selected_style_label ||
    storyboard?.selected_style ||
    ""
  ).toLowerCase();
  if (/ghost|supernatural|привид|mystic|horror|ужас/.test(label)) return "supernatural_horror";
  if (/found.?footage|vhs|found/.test(label)) return "found_footage";
  if (/psycholog|clinical|двойник/.test(label)) return "psychological";
  if (/folk|деревн|ritual/.test(label)) return "folk_horror";
  if (/grime|slasher|подвал/.test(label)) return "grime";
  if (/liminal|backrooms|коридор/.test(label)) return "liminal";
  return "neutral_cinematic";
}

const STYLE_BED = {
  supernatural_horror: "deep sub-bass drone, cold room tone, faint high-frequency tension, distant house creaks",
  found_footage:       "tape hiss, electrical hum, on-mic air, low handheld rumble",
  psychological:       "sterile fluorescent buzz, thin high tone, clinical room tone, faint heartbeat pulse",
  folk_horror:         "wind through trees, distant birds, organic outdoor ambience, low earthy drone",
  grime:               "flickering bulb buzz, dripping water, dirty low rumble, distant industrial hum",
  liminal:             "fluorescent hum, empty hall reverb, faint air-conditioning drone, total stillness",
  neutral_cinematic:   "subtle cinematic room tone, soft low drone, quiet air movement",
};

// Главная функция — спецификация ambient-беда для одного кадра/клипа.
export function buildAmbientBed({ frame = {}, storyboard = {} } = {}) {
  const styleTag = styleTagOf(storyboard);
  const styleBed = STYLE_BED[styleTag] || STYLE_BED.neutral_cinematic;

  // Слои: явные SFX-кью кадра + базовая стилевая подложка.
  const frameCues = [frame.sfx, frame.audio, frame.sound].flatMap(splitCues);
  const layers = [...new Set([...frameCues, ...splitCues(styleBed)])].slice(0, 6);
  if (!layers.length) layers.push("subtle continuous room tone");

  const durationS = Math.max(2, Math.min(60, Number(frame.duration || 5) || 5));
  const hasVo = Boolean(frame.vo_ru || frame.vo || frame.script);

  const ambientPromptEn = clean(
    `Loopable ambient sound bed, ${styleTag.replace(/_/g, " ")} scene. ` +
    `Continuous diegetic background only — ${layers.join(", ")}. ` +
    `No melody, no musical instruments, no speech, no voiceover. ` +
    `Seamless ${durationS}s loop, consistent level, mono-compatible.`
  );

  return {
    mode_tag: styleTag,
    duration_s: durationS,
    ambient_prompt_en: ambientPromptEn,
    layers,
    mix: {
      target_lufs: -23,        // фон не перебивает озвучку
      peak_db: -3,
      fade_in_s: 0.5,
      fade_out_s: 0.8,
      loop: true,
      duck_under_vo_db: hasVo ? -12 : 0, // приглушать под VO, если озвучка есть
    },
    // Подсказка для пост-обработки: чем генерировать и как класть.
    pipeline_hint: "Сгенерируй луп по ambient_prompt_en (ElevenLabs SFX / Suno / сток), наложи под клип с настройками mix; при наличии VO включи ducking.",
  };
}

export default buildAmbientBed;
