export const MOCK_SCRIPT_RU = `За несколько секунд тайга легла на землю, как скошенная трава. И никто до сих пор не может честно сказать, что взорвалось над Сибирью.

Удар был такой силы, что окна выбило за сотни километров. Люди проснулись от белой вспышки, будто солнце упало прямо в печную трубу. Земля качнулась. Небо горело.

Охотники потом шли через мёртвый лес, где стволы лежали радиальными полосами, как спички после удара кулаком. А в центре их ждал странный круг: деревья стояли без веток, голые, будто их обожгло изнутри.

Но самое жуткое пришло потом. Экспедицию отправили только через 19 лет. Слишком поздно.

Ни воронки. Ни осколков. Ничего.

Если завтра такой свет вспыхнет над твоим городом, ты поверишь в официальное объяснение сразу?`;

const CONTINUITY_LINE = "CHARACTER CONTINUITY: maintain the same character identity, wardrobe, facial features, body proportions, lighting language, lens style, color grade and cinematic world across every frame.";

export function detectTheme(input = "") {
  const t = String(input || "").toLowerCase();
  if (/запрещен[оы].{0,60}сн|запретили.{0,60}сн|чужие сны|сновид|экран над кроватью|старый проектор|плачет весь город/i.test(t)) return "dream_control_dystopia";
  if (/гитлер|hitler|наци|nazi|рейх|reich|план восток|generalplan ost|выиграл войну|победил в войне|проигравшем человечестве/i.test(t)) return "nazi_alt_history";
  if (/рим|терм|бан|вод|гряз|антич|римлян/i.test(t)) return "roman_baths";
  if (/чума|эпидем|болез|зараз|карантин|plague/i.test(t)) return "plague";
  if (/убий|маньяк|дело|улика|свидетел|преступ|true crime|crime/i.test(t)) return "crime";
  if (/сибир|тунгус|взрыв|метеор|тайг/i.test(t)) return "tunguska";
  return "generic";
}

function buildThemeCover(theme, topic = "") {
  switch (theme) {
    case "dream_control_dystopia":
      return {
        style: "dream_control_documentary",
        main_title: "ТЕБЕ ЗАПРЕТИЛИ\nВИДЕТЬ СНЫ",
        side_facts: ["ЭКРАН СТИРАЕТ НОЧЬ", "ГОРОД СПИТ ПУСТО", "ПРОЕКТОР ПОКАЗАЛ ЧУЖИЕ СНЫ", "ПЛОЩАДЬ ЗАПЛАКАЛА"],
        bottom_hook: "ТЫ БЫ ВЕРНУЛ ИМ СНЫ?",
        psychology: ["сон как последняя свобода", "белый экран как диктатура", "проектор как запретная память", "выбор зрителя"],
        angle: "Dream-control dystopia / stolen humanity"
      };
    case "nazi_alt_history":
      return {
        style: "alternate_history_documentary",
        main_title: "ЕСЛИ БЫ ГИТЛЕР\nВЫИГРАЛ ВОЙНУ",
        side_facts: ["ОДИН ПОРТРЕТ НА СТЕНЕ", "СОСЕД ИСЧЕЗАЛ НОЧЬЮ", "ИСТОРИЯ НАЧИНАЛАСЬ С ПРИКАЗА", "МИЛЛИОНЫ БЕЗ ИМЕНИ"],
        bottom_hook: "ТЫ БЫ СЧИТАЛ ЭТО НОРМОЙ?",
        psychology: ["альтернативная история", "тихая диктатура", "повседневный страх", "анти-тоталитарный документальный тон"],
        angle: "Alternate-history warning / silent dictatorship"
      };
    case "roman_baths":
      return { style: "ancient_rome_dark", main_title: "РИМСКИЕ ТЕРМЫ\nБЫЛИ ЛОВУШКОЙ?", side_facts: ["ВОДУ НЕ МЕНЯЛИ НЕДЕЛЯМИ", "ТЫСЯЧИ ЛЮДЕЙ В ОДНОМ БАССЕЙНЕ", "ГРЯЗЬ СМЫВАЛАСЬ ОБРАТНО"], bottom_hook: "ТЫ БЫ ТУДА ВОШЁЛ?", psychology: ["телесный дискомфорт", "разрушение романтизированного образа"], angle: "Ancient Rome hygiene horror" };
    case "crime":
      return { style: "truecrime", main_title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?", side_facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?"], bottom_hook: "ЭТО БЫЛ НЕСЧАСТНЫЙ СЛУЧАЙ?", psychology: ["тайна без ответа", "запретная версия"], angle: "True crime viral Netflix framing" };
    case "tunguska":
      return { style: "conspiracy_documentary", main_title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?", side_facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ"], bottom_hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?", psychology: ["тайна без ответа", "масштаб катастрофы"], angle: "Siberian anomaly" };
    default:
      return { style: "viral_documentary", main_title: String(topic || "НЕИЗВЕСТНАЯ ИСТОРИЯ").slice(0, 40).toUpperCase(), side_facts: ["СКРЫТЫЙ ИСТОРИЧЕСКИЙ ФАКТ", "НЕОЖИДАННАЯ ПРАВДА"], bottom_hook: "ТЫ ОБ ЭТОМ ЗНАЛ?", psychology: ["историческое удивление"], angle: "Generic viral documentary" };
  }
}

function buildVisualExplainer(theme, topic = "") {
  if (theme === "dream_control_dystopia") {
    return {
      title: "Как город лишили снов",
      dna: "dream_control_warning",
      overlays: ["White Screen Grid", "Projector Signal Path", "City Square Broadcast", "Destroy / Wake Choice"],
      prompt: "Create cinematic vertical documentary explainer for a dream-control dystopia: white bed screens, old projector, signal path to city square, dream broadcast on facade, harsh concrete realism, 9:16."
    };
  }
  if (theme === "nazi_alt_history") {
    return {
      title: "Как выглядел бы проигравший мир",
      dna: "alternate_history_warning",
      overlays: ["School Wall Portrait", "Order Timeline", "Silent Neighbor", "Plan East Map"],
      prompt: "Create cinematic vertical documentary explainer for an alternate-history WWII outcome: school wall portrait, state order documents, silent apartment door, Plan East map, oppressive gray atmosphere, anti-totalitarian warning tone, 9:16."
    };
  }
  return { title: topic || "Исторический разбор", dna: `${theme}_explainer`, overlays: ["Timeline Overlay", "Map Breakdown", "Visual Comparison"], prompt: `Create cinematic vertical documentary explainer for ${topic}. 9:16, detailed overlays, dark UI.` };
}

export function buildMockScript(topic = "") {
  const t = String(topic || "неизвестная историческая тайна").trim();
  return `Ты бы не поверил, но ${t}. Сначала это звучит как странная деталь из учебника. Но чем глубже смотришь, тем сильнее ощущение: эта история была опаснее, чем нам рассказывали. И самый жуткий факт здесь не в легенде. Он в том, что для людей прошлого это было нормой. Каждый день. Без выбора.`;
}

function splitVo(script = "", frameCount = 10) {
  const clean = String(script || MOCK_SCRIPT_RU).replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?…]+[.!?…]?/g)?.map((s) => s.trim()).filter(Boolean) || [clean];
  return Array.from({ length: frameCount }, (_, i) => sentences[i % sentences.length] || clean.slice(0, 120));
}

function visualBeat(theme, frameNum) {
  if (theme === "nazi_alt_history") {
    const beats = [
      "alternate-history occupied school corridor, one authoritarian portrait on the wall, oppressive silence",
      "history book open on a desk, the page looks like an order, cold institutional light",
      "empty apartment door at night, neighbor vanished without sound, quiet stairwell",
      "gray classroom with identical desks, students as silhouettes, no freedom on the wall",
      "Plan East map overlay, population names erased into anonymous worker rows",
      "silent city street under authoritarian banners blurred in distance, no glorification",
      "close-up of a child's notebook crossed by a red order stamp",
      "family window at night, lights off, fear hidden behind curtains",
      "wide institutional hallway, footsteps implied but no one visible",
      "final empty classroom, single portrait above blackboard, cold documentary warning tone"
    ];
    return beats[(frameNum - 1) % beats.length];
  }
  if (theme === "roman_baths") {
    const beats = ["crowded Ancient Roman bathhouse entrance with humid steam and torchlight", "wide view of a Roman hot pool packed with people and marble arches", "close-up of murky bath water with oil sheen and historical texture", "Roman bath attendant with strigil and stone basin", "documentary diagram of bathhouse water channels", "claustrophobic steam room with silhouettes", "wet stone floor with footprints and sandals", "elite Roman citizens in a crowded bath hall", "torch reflection over dark pool surface", "empty bathhouse at night with dripping water"];
    return beats[(frameNum - 1) % beats.length];
  }
  if (theme === "tunguska") {
    const beats = ["Siberian forest before dawn", "white flash above endless taiga", "shockwave flattening trees", "distant village windows shaking", "burned tree trunks in a silent forest", "expedition crossing dead forest", "empty impact center with no crater", "map overlay of blast radius", "scientist field notebook close-up", "ominous sky over taiga at dusk"];
    return beats[(frameNum - 1) % beats.length];
  }
  return `cinematic documentary scene ${frameNum}`;
}

export function buildMockStoryboard({ topic = "", script = "", duration = 30, aspectRatio = "9:16", stylePreset = "cinematic", target = "veo3" } = {}) {
  const frameCount = Math.max(1, Math.round(Number(duration || 30) / 3));
  const theme = detectTheme(`${topic}\n${script}`);
  const vo = splitVo(script || topic || MOCK_SCRIPT_RU, frameCount);
  const scenes = Array.from({ length: frameCount }, (_, idx) => {
    const n = idx + 1;
    return {
      id: `frame_${String(n).padStart(2, "0")}`,
      start: idx * 3,
      end: idx * 3 + 3,
      vo_ru: vo[idx],
      image_prompt_en: `SCENE PRIMARY FOCUS: ${visualBeat(theme, n)}. Vertical ${aspectRatio}, ${stylePreset} documentary realism, coherent lighting, no text, no UI.`,
      video_prompt_en: `ANIMATE CURRENT FRAME: slow cinematic push-in, subtle handheld micro-movement, atmospheric depth, preserve exact visual composition. ${CONTINUITY_LINE} SFX: low room tone, restrained cinematic tension.`,
      sfx: "low room tone, restrained cinematic tension"
    };
  });
  return { project_name: topic || "NeuroCine Project", aspect_ratio: aspectRatio, duration_sec: Number(duration || 30), target, global_style_lock: `${stylePreset} documentary realism, consistent color grade, consistent lens language`, character_lock: [{ name: "visual_world", description: "Keep same cinematic world, era, materials, lighting and camera language across frames." }], scenes };
}

export function buildMockCoverPack({ topic = "", script = "" } = {}) {
  const theme = detectTheme(`${topic}\n${script}`);
  const cover = buildThemeCover(theme, topic);
  const explainer = buildVisualExplainer(theme, topic);
  return {
    theme,
    topic,
    mode: "demo",
    format: "9:16",
    style: cover.style,
    main_title: cover.main_title,
    side_facts: cover.side_facts,
    bottom_hook: cover.bottom_hook,
    psychology: cover.psychology,
    angle: cover.angle,
    visual_explainer: explainer,
    variants: [
      { id: "poster", title: "MAIN POSTER", prompt_EN: `Vertical 9:16 documentary thumbnail poster. TOP TITLE: ${cover.main_title}. SIDE FACTS: ${cover.side_facts.join(" / ")}. BOTTOM HOOK: ${cover.bottom_hook}. Theme: ${theme}. Dark cinematic realism, phone-readable typography.` },
      { id: "evidence", title: "EVIDENCE", prompt_EN: `Vertical 9:16 evidence-style documentary cover for ${topic || theme}. Use facts: ${cover.side_facts.join(", ")}. Strong readable Russian text, cinematic contrast.` },
      { id: "human", title: "HUMAN ANGLE", prompt_EN: `Vertical 9:16 human-centered documentary cover for ${topic || theme}. Emotional but non-graphic, serious tone, readable title: ${cover.main_title}.` }
    ],
    negative_prompt_EN: "watermark, logo, unreadable text, random extra captions, cartoon, flat illustration, gore, UI overlay"
  };
}

export function buildMockTtsPack({ topic = "", script = "" } = {}) {
  const cleanScript = String(script || buildMockScript(topic)).trim();
  return {
    scene: topic || "NeuroCine documentary narration",
    context: "Short-form documentary voiceover: restrained, tense, clear diction, no theatrical overacting.",
    voice_id: "Charon",
    voice_desc: "низкий документальный тембр, холодная подача",
    voice_reason: "Подходит для историй с тревогой, расследованием и ощущением скрытой угрозы.",
    pacing_tips: "Hook: медленнее и тише. Build: добавить давление. Climax: короткие паузы перед ключевыми словами. Outro: почти шёпот.",
    script_google: `[Voice: Charon]\n[Style: documentary thriller, controlled fear, low volume]\n${cleanScript}`,
    script_elevenlabs: `${cleanScript}\n\nDirection: low, tense documentary narrator; natural pauses; no shouting; no comedy.`,
    script_clean: cleanScript
  };
}

export function buildMockMusicPack({ topic = "", script = "", genre = "documentary", storyboard = null } = {}) {
  const theme = detectTheme(`${topic}\n${script}\n${genre}`);
  const isAlt = theme === "nazi_alt_history";
  const isRome = theme === "roman_baths";
  const mood = isAlt ? "oppressive silence, institutional dread, alternate-history tension" : isRome ? "claustrophobic dread, humid unease, social pressure" : "dark documentary tension, mystery, slow pressure";
  return {
    duration_hint: "30s",
    music_EN: `[Genre: Cinematic Orchestral Thriller], [Mood: ${mood}], [Instruments: low strings, muted brass, prepared piano, distant pulses, dark ambient bed], [Tempo: 58 BPM], [Rhythm: irregular breathing-like pulse, no steady beat], [Arc: 0-8s quiet hook; 8-18s tension build; 18-24s peak; 24-30s decay into silence], [Vibe: instrumental documentary bed, no vocals, tactile, restrained, ominous]`,
    negative_EN: "no lyrics, no singing, no cheerful melody, no dance beat, no uplifting ending, no comedy, no bright pop synths",
    usage_ru: "Фоновая подложка на весь ролик. Hook 45-55%, build 70-75%, climax 85%, outro 35-45%.",
    notes_ru: `Музыка собрана под тему: ${theme}. Используй как Suno/Udio prompt или как референс для монтажной кровати.`
  };
}

export function buildMockSocialPack(payload = {}) {
  return {
    hooks: ["Ты бы рискнул зайти туда?", "Об этом молчали десятилетиями", "История оказалась хуже легенды"],
    captions: [`История: ${payload?.topic || "тайна прошлого"}`, "Сохрани чтобы не забыть"],
    hashtags: ["#history", "#documentary", "#viral"],
    carousel: [
      { emoji: "🎬", headline: "Эта история звучит как кино", sub: payload?.topic || "Но детали были реальными." },
      { emoji: "⚠️", headline: "Один факт всё меняет", sub: "Смотри до конца — развязка меняет восприятие." }
    ],
    stories: [
      { emoji: "👁", headline: "Ты бы выдержал это?", sub: payload?.topic || "История, которую трудно забыть." }
    ]
  };
}

export function buildMockSeoPack(payload = {}) {
  return [
    { type: "viral", title: payload?.topic || "NeuroCine Documentary", desc: `Кинематографичный документальный разбор: ${payload?.topic || "историческая тайна"}.`, tags: ["#history", "#documentary", "#shorts", "#neurocine"] },
    { type: "search", title: `${payload?.topic || "Историческая тайна"} — что было на самом деле?`, desc: "Короткий документальный выпуск с визуальным сценарием и сильным hook.", tags: ["#история", "#документалка", "#shorts"] },
    { type: "comment", title: "Ты бы поверил официальной версии?", desc: "Напиши в комментариях, какая версия кажется правдоподобнее.", tags: ["#reels", "#viral", "#historytok"] }
  ];
}

export function buildMockVideoPrompt(payload = {}) {
  return { master_prompt: `Create cinematic 9:16 documentary video about ${payload?.topic || "historical mystery"}, atmospheric lighting, realistic textures, dramatic camera movement. ${CONTINUITY_LINE}` };
}
