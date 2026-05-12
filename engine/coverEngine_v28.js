// engine/coverEngine_v28.js
// NeuroCine Cover Director Engine v2.8
// Deterministic scenario-aware cover director.
// Fix: Hitler / Nazi alternate-history scripts must never fall back to generic horror just because the script contains "страх".

function str(v = "") { return String(v || "").trim(); }
function low(v = "") { return str(v).toLowerCase(); }
function upper(v = "") { return str(v).toUpperCase(); }
function uniq(arr = []) {
  const out = [];
  const seen = new Set();
  for (const item of arr.map(str).filter(Boolean)) {
    const key = low(item);
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}
function hashString(input = "") {
  let h = 2166136261;
  const text = String(input || "");
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function textSource({ topic = "", script = "", storyboard = null } = {}) {
  const scenes = storyboard?.scenes || storyboard?.frames || [];
  return [
    topic,
    script,
    storyboard?.title,
    storyboard?.topic,
    storyboard?.hook,
    storyboard?.global_style_lock,
    ...(scenes || []).flatMap((f) => [
      f.description_ru, f.visual, f.voice, f.vo, f.vo_ru, f.text_on_screen,
      f.sfx, f.image_prompt_en, f.video_prompt_en, f.continuity_note
    ])
  ].filter(Boolean).join("\n");
}

function hasAny(source = "", words = []) {
  return words.some((w) => source.includes(w));
}

export function detectCoverTheme(input = {}) {
  const source = low(textSource(input));

  // Highest priority: explicit WW2 / Hitler / Nazi counterfactual.
  // This must run before generic horror/war/conspiracy because scripts contain words like "страх", "ночью", "исчезал".
  if (hasAny(source, [
    "гитлер", "hitler", "наци", "nazi", "рейх", "reich", "третьего рейха", "third reich",
    "план восток", "generalplan ost", "генеральный план ост", "победил в войне", "выиграл войну",
    "проигравшем человечестве", "рабочую массу", "без имени", "портрет", "приказ", "сосед исчезал"
  ])) return "nazi_alt_history";

  if (hasAny(source, ["петров", "ссср", "советск", "бункер", "сирен", "тревог", "ложная тревога", "ложн", "спутник", "солнечный блик", "блик", "не нажал", "кнопк", "конца мира", "до конца мира", "компьютеры показали", "один человек", "система"])) return "cold_war_alert";
  if (hasAny(source, ["мерзлот", "mammoth", "мамонт", "мамонтёнок", "мамонтенок", "permafrost", "сибирской язвы", "anthrax", "щенк", "голов", "волк", "лед начал таять", "лёд начал таять", "древние могильники"])) return "permafrost";
  if (hasAny(source, ["тунгус", "тайга", "сибир", "метеорит", "осколк", "воронк"])) return "tunguska";
  if (hasAny(source, ["нло", "ufo", "alien", "иноплан", "не земн", "внезем", "аппарат", "розуэл", "roswell"])) return "alien";
  if (hasAny(source, ["убий", "маньяк", "crime", "преступ", "детектив", "полици", "фбр", "fbi", "след"])) return "crime";
  if (hasAny(source, ["заговор", "секрет", "секретн", "classified", "redacted", "архив", "документ", "правительство", "гриф", "скрывал"])) return "conspiracy";
  if (hasAny(source, ["тюрьм", "остров дьявола", "каторг", "побег", "заключ", "камера", "лагерь", "гулат", "гулаг"])) return "prison";
  if (hasAny(source, ["чум", "болезн", "эпидем", "лихорад", "москит", "зараж", "карантин"])) return "plague";
  if (hasAny(source, ["война", "вторая мировая", "солдат", "танк", "battle", "war", "military", "армия", "ракета", "взрыв", "битва"])) return "war";
  if (hasAny(source, ["ужас", "хоррор", "призрак", "демон", "монстр", "страх", "horror", "creature", "nightmare"])) return "horror";
  if (hasAny(source, ["катастроф", "disaster", "авар", "цунами", "землетр", "пожар", "шторм", "самолет", "корабль"])) return "disaster";
  if (hasAny(source, ["древн", "археолог", "фараон", "рим", "history", "истори", "импер", "артефакт", "средневек"])) return "history";
  if (hasAny(source, ["ai", "ии", "нейро", "робот", "эксперимент", "наука", "учен", "технолог", "science"])) return "science";
  return "general";
}

const THEME_PRESETS = {
  nazi_alt_history: {
    title: "МИР БЫЛ БЫ\nСЛИШКОМ ТИХИМ",
    facts: ["ОДИН ПОРТРЕТ НА СТЕНЕ", "СОСЕД ИСЧЕЗАЛ НОЧЬЮ", "ИСТОРИЯ НАЧИНАЛАСЬ С ПРИКАЗА", "ПЛАН ВОСТОК = МИЛЛИОНЫ БЕЗ ИМЕНИ"],
    hook: "ТЫ БЫ СЧИТАЛ ЭТО НОРМОЙ?",
    visual: "alternate-history occupied Europe classroom corridor, one authoritarian portrait on a school wall, a history book open to a command-like page, empty apartment door in the background, silent street outside the window, muted gray uniforms seen only as distant silhouettes, oppressive quiet, no celebration, no glorification, documentary warning tone",
    angle: "alternate-history warning / silent dictatorship / everyday life after a lost humanity",
    forbiddenVisuals: "generic ghost corridor, paranormal monster, true crime evidence board, police tape, horror creature, jump scare, demon, random frightened victim, glorifying propaganda, heroic Nazi imagery, celebratory flags, modern phones, random unrelated text",
    variantLabels: {
      poster: "ALT HISTORY POSTER",
      evidence: "CLASSROOM + ORDER",
      human: "SILENT NEIGHBOR",
    },
  },
  cold_war_alert: {
    title: "ОН НЕ ПОВЕРИЛ\nСИСТЕМЕ",
    facts: ["СССР • КРАСНАЯ ТРЕВОГА", "МИНУТЫ ДО КАТАСТРОФЫ", "ЛОЖНЫЙ СИГНАЛ", "ОДИН ЧЕЛОВЕК РЕШИЛ"],
    hook: "ОН СПАС МИР?",
    visual: "Soviet Cold War underground command room at night, flashing red alarm beacon, CRT warning screens, Soviet duty officer frozen at a console, hand hovering above a report phone, red emergency light washing over steel walls, analog control panels, classified global panic atmosphere, one decision before catastrophe",
    angle: "false Cold War alert / one man refused the system / minutes before global catastrophe",
    forbiddenVisuals: "crime evidence board, police tape, witness silhouette, forensic markers, detective case file, courtroom, suspect wall, red string investigation board",
    variantLabels: { poster: "RED ALERT POSTER", evidence: "CONTROL ROOM + ALERT", human: "ONE MAN / ONE DECISION" },
  },
  permafrost: {
    title: "ГЛАЗ ПОДО\nЛЬДОМ?",
    facts: ["МЕРЗЛОТЕ 40 000 ЛЕТ", "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК", "ТРАВА ВНУТРИ БЫЛА ЗЕЛЁНОЙ", "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    hook: "ЭТО МОЖЕТ ВЕРНУТЬСЯ",
    visual: "Siberian permafrost excavation trench, blue-white frozen wall split open, glossy ancient eye visible under translucent ice, preserved baby mammoth emerging from frozen ground, scientists in winter gear, cold mist, biological threat atmosphere, documentary realism",
    angle: "permafrost horror / ancient life returning / thawed biological danger",
  },
  tunguska: {
    title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?",
    facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?",
    visual: "apocalyptic Siberian taiga after mysterious aerial explosion, blinding white-orange fireball in sky, radial flattened forest below, strange untouched circular center, no visible crater, ash in the air",
    angle: "forbidden mystery / official explanation under doubt",
  },
  alien: { title: "ЭТО БЫЛО\nНЕ С ЗЕМЛИ?", facts: ["ВОЕННЫЕ ПРИЕХАЛИ ПЕРВЫМИ", "ОБЛОМКИ ИСЧЕЗЛИ", "СВИДЕТЕЛЕЙ ЗАСТАВИЛИ МОЛЧАТЬ", "ДЕЛО ЗАСЕКРЕЧЕНО"], hook: "ЗАПРЕЩЁННАЯ ВЕРСИЯ", visual: "night crash site with impossible non-human wreckage, military floodlights, investigators in silhouette, classified evidence markers, strange metallic object glowing under a tarp", angle: "alien conspiracy / hidden government file" },
  crime: { title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?", facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?", "ОТВЕТ БЫЛ РЯДОМ"], hook: "ЭТА ДЕТАЛЬ ВСЁ МЕНЯЕТ", visual: "dark non-graphic crime evidence board, torn case file, red string, police tape, flashlight beam, suspect silhouette behind frosted glass, forensic markers", angle: "true crime evidence twist" },
  conspiracy: { title: "ЭТО СКРЫВАЛИ\nГОДАМИ?", facts: ["ДОКУМЕНТЫ ЗАЧЕРКНУТЫ", "ОЧЕВИДЦЫ МОЛЧАЛИ", "ВЕРСИЯ НЕ СХОДИТСЯ", "СЛИШКОМ МНОГО СОВПАДЕНИЙ"], hook: "ЗАПРЕЩЁННЫЙ АРХИВ", visual: "secret archive room, redacted classified documents under hard desk lamp, surveillance screens, shadow officials behind glass, stamped top secret folder", angle: "classified archive / hidden truth" },
  prison: { title: "ОТСЮДА\nНЕ ВОЗВРАЩАЛИСЬ", facts: ["ОСТРОВ ПОСРЕДИ АДА", "ЖАРА ЛОМАЛА ЛЮДЕЙ", "ПОБЕГ = СМЕРТЬ", "ДЖУНГЛИ ЖДАЛИ ВПЕРЕДИ"], hook: "ТЮРЬМА, КОТОРУЮ БОЯЛИСЬ", visual: "hellish tropical prison island, rusted bars, humid jungle, stormy ocean, guard tower silhouette, exhausted prisoner shadow, documentary realism", angle: "historical survival horror" },
  plague: { title: "ГОРОД\nУМИРАЛ МОЛЧА", facts: ["ДВЕРИ ЗАКОЛАЧИВАЛИ", "УЛИЦЫ ПУСТЕЛИ", "ВРАЧИ НЕ УСПЕВАЛИ", "ЗАПАХ СМЕРТИ ВЕЗДЕ"], hook: "ТЫ БЫ НЕ ВЫЖИЛ", visual: "medieval plague city, sealed doors, smoke, plague doctor silhouette, abandoned street, candlelight and fog, non-graphic historical horror atmosphere", angle: "historical horror survival" },
  horror: { title: "ОНИ УВИДЕЛИ\nЭТО СЛИШКОМ ПОЗДНО", facts: ["СВЕТ ПОГАС", "ДВЕРЬ ОТКРЫЛАСЬ", "ШАГИ БЫЛИ РЯДОМ", "КАМЕРА ЗАМОЛЧАЛА"], hook: "НЕ СМОТРИ ОДИН", visual: "dark corridor with unnatural silhouette, cold light leaking from half-open door, frightened witness foreground, fog and scratches, clean non-graphic horror tension", angle: "paranormal witness fear" },
  war: { title: "ЭТА БИТВА\nИЗМЕНИЛА ВСЁ", facts: ["СОЛДАТЫ ШЛИ В ДЫМ", "ПРИКАЗ БЫЛ БЕЗУМНЫМ", "ЗЕМЛЯ ГОРЕЛА", "ВЫЖИЛИ ЕДИНИЦЫ"], hook: "МИНУТА ДО КАТАСТРОФЫ", visual: "battlefield through smoke and sparks, damaged military vehicle, soldiers silhouettes, searchlights, muddy ground, documentary war realism, no gore", angle: "war documentary shock" },
  disaster: { title: "ЗА СЕКУНДЫ\nВСЁ ИСЧЕЗЛО", facts: ["ЛЮДИ НЕ УСПЕЛИ", "СИГНАЛ ПРОИГНОРИРОВАЛИ", "НЕБО СТАЛО БЕЛЫМ", "ГОРОД ЗАМЕР"], hook: "ЭТО МОЖЕТ ПОВТОРИТЬСЯ", visual: "large-scale disaster moment, impossible bright flash, emergency silhouettes, cracked ground, burning debris, cinematic chaos, no gore", angle: "catastrophe warning" },
  history: { title: "ТЫ БЫ\nНЕ ВЫЖИЛ", facts: ["ОШИБКА СТОИЛА ЖИЗНИ", "ГРЯЗЬ БЫЛА НОРМОЙ", "ВЛАСТЬ НЕ ПРОЩАЛА", "СТРАХ КАЖДЫЙ ДЕНЬ"], hook: "СРЕДНЕВЕКОВЬЕ БЫЛО АДОМ", visual: "brutal medieval street, mud, torchlight, exhausted people, wooden punishment frame in background, cinematic historical documentary realism, non-graphic", angle: "historical survival shock" },
  science: { title: "ЭКСПЕРИМЕНТ\nВЫШЕЛ ИЗ-ПОД КОНТРОЛЯ", facts: ["ДАТЧИКИ ЗАМОЛЧАЛИ", "КАМЕРА ЗАСВЕТИЛАСЬ", "УЧЁНЫЕ МОЛЧАЛИ", "ОБЪЕКТ НЕ ОБЪЯСНИЛИ"], hook: "НАУКА НЕ ГОТОВА", visual: "secret laboratory experiment going wrong, glowing containment chamber, warning lights, scientists behind glass, impossible object floating in center", angle: "science thriller" },
  general: { title: "ЭТУ ИСТОРИЮ\nСКРЫВАЛИ?", facts: ["ОДНА ДЕТАЛЬ ВСЁ МЕНЯЕТ", "ОФИЦИАЛЬНАЯ ВЕРСИЯ НЕ СХОДИТСЯ", "СВИДЕТЕЛИ МОЛЧАЛИ", "ПРАВДА СТРАШНЕЕ"], hook: "ТЫ ПОВЕРИШЬ В ЭТО?", visual: "strongest visible story evidence in foreground, dramatic event happening behind, shocked witnesses, cinematic high contrast lighting, clear viral hook object", angle: "viral documentary mystery" },
};

const STYLE_PRESETS = {
  viral: "viral YouTube Shorts documentary thumbnail, extreme readability, aggressive CTR composition, distressed bold typography, red-white-red text palette, black drop shadows, grunge texture",
  netflix: "premium Netflix documentary key art, serious investigative tone, elegant bold title hierarchy, deep shadows, realistic film grain",
  mrbeast: "high-energy viral thumbnail, oversized headline, exaggerated contrast, strong central object, clean readable blocks",
  truecrime: "true crime documentary poster, evidence labels, red string board feeling, gritty paper textures, investigative suspense",
  conspiracy: "classified conspiracy poster, warning stamps, redacted documents, black and red palette, paranoid thriller atmosphere",
};

function pickStyle(style = "viral", theme = "general") {
  if (theme === "nazi_alt_history") {
    return "dystopian alternate-history documentary poster, oppressive institutional silence, cold gray palette, red warning typography, school corridor / state office atmosphere, serious anti-totalitarian tone, no glorification";
  }
  if (theme === "cold_war_alert" && style === "truecrime") {
    return "Cold War classified documentary poster, red emergency typography, Soviet control room atmosphere, bold readable Russian text, no detective or police aesthetic";
  }
  return STYLE_PRESETS[style] || STYLE_PRESETS.viral;
}

function deriveFromScript(input = {}, preset, theme = "general") {
  const compact = textSource(input).replace(/\s+/g, " ");
  const extractedFacts = [];
  const commonRules = [
    [/гитлер|hitler/i, "ЕСЛИ БЫ ГИТЛЕР ВЫИГРАЛ"],
    [/школьн[^.?!]{0,60}портрет|портрет[^.?!]{0,40}стен/i, "ОДИН ПОРТРЕТ НА СТЕНЕ"],
    [/сосед[^.?!]{0,50}исчез/i, "СОСЕД ИСЧЕЗАЛ НОЧЬЮ"],
    [/книг[ауы]\s+истории|истори[яи][^.?!]{0,40}приказ/i, "ИСТОРИЯ НАЧИНАЛАСЬ С ПРИКАЗА"],
    [/план\s+восток|generalplan\s+ost/i, "ПЛАН ВОСТОК"],
    [/миллион[^.?!]{0,60}рабоч|рабочую\s+массу/i, "МИЛЛИОНЫ БЕЗ ИМЕНИ"],
    [/проигравш[^.?!]{0,40}человечеств/i, "ПРОИГРАВШЕЕ ЧЕЛОВЕЧЕСТВО"],
    [/считал[^.?!]{0,40}норм/i, "ТЫ БЫ СЧИТАЛ ЭТО НОРМОЙ"],

    [/петров/i, "ПЕТРОВ НЕ ПОВЕРИЛ СИСТЕМЕ"],
    [/не\s+нажал[^.?!]{0,30}кнопк|кнопк[^.?!]{0,30}не\s+нажал/i, "ОН НЕ НАЖАЛ КНОПКУ"],
    [/минут[^.?!]{0,50}(конца|катастроф|мира)/i, "МИНУТЫ ДО КОНЦА МИРА"],
    [/ложн[^.?!]{0,20}тревог|тревог[^.?!]{0,40}ложн/i, "ЛОЖНАЯ ТРЕВОГА"],
    [/мамонт[её]нок|мамонтенок/i, "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК"],
    [/сибирской\s+язв|anthrax/i, "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    [/окна[^.?!]{0,60}(выбил|выбило)/i, "ОКНА ВЫБИЛО ЗА СОТНИ КМ"],
    [/ни\s+воронк|ни\s+осколк/i, "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    [/тайга[^.?!]{0,80}(легла|скошенн|повален)/i, "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ"],
  ];
  for (const [rx, label] of commonRules) if (rx.test(compact)) extractedFacts.push(label);
  return { facts: uniq([...extractedFacts, ...(preset.facts || [])]).slice(0, 4) };
}

function buildTitle({ topic = "", script = "", mode = "viral", preset, theme = "general" }) {
  const t = upper(`${topic} ${script}`).replace(/\s+/g, " ");
  if (theme === "nazi_alt_history") {
    if (t.includes("ВЫИГРАЛ") || t.includes("ГИТЛЕР")) return "ЕСЛИ БЫ ГИТЛЕР\nВЫИГРАЛ ВОЙНУ";
    if (t.includes("СЛИШКОМ ТИХО")) return "МИР БЫЛ БЫ\nСЛИШКОМ ТИХИМ";
    return preset.title;
  }
  if (theme === "cold_war_alert") {
    if (t.includes("НЕ НАЖАЛ") || t.includes("КНОПК")) return "ОН НЕ НАЖАЛ\nКНОПКУ";
    if (t.includes("КОНЦА МИРА")) return "ДО КОНЦА МИРА\nБЫЛИ МИНУТЫ";
    return preset.title;
  }
  if ((topic && topic.length <= 42 && mode === "safe") || t.includes("ЧТО СКРЫЛИ")) return `${upper(topic || preset.title)}\nЧТО СКРЫЛИ?`;
  return preset.title;
}

function buildBrief({ topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = {}) {
  const source = textSource({ topic, script, storyboard });
  const theme = detectCoverTheme({ topic, script, storyboard });
  const preset = THEME_PRESETS[theme] || THEME_PRESETS.general;
  const derived = deriveFromScript({ topic, script, storyboard }, preset, theme);
  const title = buildTitle({ topic, script, mode, preset, theme });
  const modeLine = {
    safe: "credible documentary, no cheap clickbait, still high curiosity",
    viral: "viral curiosity gap, strong fear/mystery hook, bold but believable",
    extreme: "maximum CTR, forbidden-version energy, aggressive warning stamp, still non-graphic",
  }[mode] || "viral curiosity gap";

  return {
    version: "Cover Director v2.8",
    source_hash: hashString(source),
    theme,
    mode,
    style,
    platform,
    format: "9:16",
    angle: preset.angle,
    main_title: title,
    side_facts: derived.facts,
    bottom_hook: mode === "safe" ? preset.hook.replace("ЗАПРЕЩЁННАЯ", "ГЛАВНАЯ") : preset.hook,
    visual_symbol: preset.visual,
    forbidden_visuals: preset.forbiddenVisuals || "",
    variant_labels: preset.variantLabels || null,
    psychology: theme === "nazi_alt_history"
      ? ["альтернативная история без прославления", "обычная школа как символ диктатуры", "тишина = страх", "сосед исчезает без следов", "заголовок читается первым"]
      : ["тайна без полного ответа", "запретная версия", "масштабный шок", "один невозможный визуальный символ", "сначала читается главный заголовок"],
    ctr_score: mode === "extreme" ? 92 : mode === "viral" ? 86 : 73,
    typography_system: "3-level hierarchy: huge top headline, small evidence facts, bottom red-stamp hook",
    readability_rule: "all key text readable on a phone in under 1 second",
    mode_line: modeLine,
  };
}

function composePrompt(brief, variant = "poster") {
  const style = pickStyle(brief.style, brief.theme);
  const isAltHistory = brief.theme === "nazi_alt_history";
  const isColdWar = brief.theme === "cold_war_alert";
  const variantBlock = isAltHistory ? ({
    poster: "Alternative-history warning poster: school corridor and wall portrait dominate the upper/center zones; the oppressive silence is the main threat, not a monster or ghost.",
    evidence: "Classroom-order poster: emphasize a history book opened to a command page, institutional wall, empty desk, corridor leading to a closed apartment door, documentary dread.",
    human: "Silent-neighbor poster: foreground an empty doorway and a half-seen neighbor silhouette vanishing into darkness; the classroom portrait remains visible as oppressive context.",
  }[variant]) : isColdWar ? ({
    poster: "Red-alert command-room poster: flashing siren and Soviet bunker screens dominate; no generic crime evidence.",
    evidence: "Control-room alert poster: CRT warning screens, red alarm beacon, analog control panels, countdown feeling.",
    human: "One-man decision poster: Soviet duty officer frozen at console with hand near report phone; no police or detective imagery.",
  }[variant]) : ({
    poster: "Event-first poster: the impossible event dominates the upper half, evidence landscape dominates the center, text zones are integrated like a professional thumbnail poster.",
    evidence: "Evidence-board poster: include icons, stamped labels, red warning frame, documentary facts arranged on the left side, dramatic event still visible in background.",
    human: "Human + evidence poster: add a tense investigator or eyewitness in the lower/side foreground, direct eye contact, evidence reflected in glasses or held as a document, event visible behind.",
  }[variant]);

  const titleOneLine = brief.main_title.replace(/\n/g, " / ");
  const factsText = (brief.side_facts || []).map((f) => `"${f}"`).join(", ");

  return [
    "Vertical 9:16 viral Russian documentary thumbnail poster.",
    `CORE VISUAL: ${brief.visual_symbol}.`,
    `THUMBNAIL ANGLE: ${brief.angle}; ${brief.mode_line}.`,
    `COMPOSITION: ${variantBlock}`,
    "LAYOUT ZONES: top 35% = huge headline, center 40% = cinematic visual evidence, left side = compact fact blocks with small icons, bottom 20% = red warning stamp / final hook.",
    `ADD EXACT RUSSIAN TOP HEADLINE TEXT: "${titleOneLine}". Make it huge, bold, distressed, white and red, with black shadow, perfectly readable on phone screen.`,
    `ADD LEFT-SIDE FACT BLOCKS: ${factsText}. Use compact white/yellow text with small documentary icons.`,
    `ADD BOTTOM HOOK / RED STAMP TEXT: "${brief.bottom_hook}".`,
    `STYLE: ${style}, high contrast, dramatic lighting, sharp details, dark atmosphere, professional poster design, mobile readability first.`,
    isAltHistory ? "ALT-HISTORY LOCK: no paranormal horror, no monster, no ghost, no random corridor jump scare. Use school wall portrait, history book, order paper, silent apartment door, occupied society atmosphere. Strictly anti-glorification documentary warning tone." : "",
    isColdWar ? "COLD WAR LOCK: Soviet bunker, red siren, CRT screens, analog panels, officer decision, global panic atmosphere. No modern smartphone, no crime board, no police tape." : "",
    "TYPOGRAPHY SYSTEM: strict three-level hierarchy only — 1) giant top headline, 2) compact evidence facts, 3) bottom red stamp. Do not create extra captions, random labels, fake UI, channel names, or small unreadable text.",
    "CTR POLISH: one visual symbol must dominate; clean negative space behind headline; bottom hook looks like a forbidden-file stamp; sharpen contrast around the central object.",
    (isAltHistory || isColdWar) ? `THEME NEGATIVE: ${brief.forbidden_visuals}.` : "",
    "NEGATIVE: no watermark, no logo, no subtitles, no random extra text, no misspelled extra labels, no cartoon, no flat illustration, no gore, no UI elements, no duplicated Russian words."
  ].filter(Boolean).join("\n");
}

export function buildCoverDirectorPack(input = {}) {
  const { topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = input;
  const brief = buildBrief({ topic, script, storyboard, mode, style, platform });
  const labels = brief.variant_labels || { poster: "MAIN VIRAL POSTER", evidence: "EVIDENCE + FACTS", human: "WITNESS + MYSTERY" };
  const variants = [
    { id: "poster", title: labels.poster, prompt_EN: composePrompt(brief, "poster") },
    { id: "evidence", title: labels.evidence, prompt_EN: composePrompt(brief, "evidence") },
    { id: "human", title: labels.human, prompt_EN: composePrompt(brief, "human") },
  ];
  const negativeExtra = brief.forbidden_visuals ? `, ${brief.forbidden_visuals}` : "";

  return {
    ...brief,
    text_layout: {
      top_title: brief.main_title,
      side_facts: brief.side_facts,
      bottom_hook: brief.bottom_hook,
      safe_area: "keep all text inside 9:16 mobile safe margins; top title must not touch browser/UI crop zones",
    },
    variants,
    negative_prompt_EN: `low readability, small text, random letters, misspelled Russian, extra labels, watermark, logo, subtitles, UI overlay, duplicated text, messy layout, flat illustration, cartoon, gore${negativeExtra}`,
    usage_ru: "Скопируй IMAGE PROMPT в Flow/Nano Banana/Midjourney. Если текст искажается — отдельно добавь текст в редакторе поверх с теми же блоками TOP/SIDE/BOTTOM.",
  };
}
