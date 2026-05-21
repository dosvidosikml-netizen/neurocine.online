// engine/coverEngine.js
// NeuroCine Cover Director Engine v2.7 — scenario-aware Cover DNA + CTR hierarchy
// сценарий -> главный страх/тайна -> текстовая иерархия -> 9:16 poster composition -> готовый EN prompt.

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

  // Must run before generic crime / conspiracy / war.
  // Petrov-style Cold War false alert is NOT true crime and NOT detective evidence.
  if (hasAny(source, [
    "петров", "ссср", "советск", "бункер", "сирен", "ложная тревога", "ложн",
    "спутник", "солнечный блик", "не нажал", "конца мира", "до конца мира",
    "компьютеры показали"
  ])) return "cold_war_alert";

  if (hasAny(source, ["мерзлот", "mammoth", "мамонт", "мамонтёнок", "мамонтенок", "permafrost", "сибирской язвы", "anthrax", "щенк", "голов", "волк", "лед начал таять", "лёд начал таять", "древние могильники"])) return "permafrost";
  if (hasAny(source, ["тунгус", "тайга", "сибир", "метеорит", "осколк", "воронк"])) return "tunguska";
  if (hasAny(source, ["нло", "ufo", "alien", "иноплан", "не земн", "внезем", "аппарат", "розуэл", "roswell"])) return "alien";
  if (hasAny(source, ["убий", "маньяк", "crime", "преступ", "детектив", "полици", "фбр", "fbi", "следователь", "следствие", "расследован"])) return "crime";
  if (hasAny(source, ["заговор", "секрет", "секретн", "classified", "redacted", "архив", "документ", "правительство", "гриф", "скрывал"])) return "conspiracy";
  if (hasAny(source, ["тюрьм", "остров дьявола", "каторг", "побег", "заключ", "камера", "лагерь", "гулат", "гулаг"])) return "prison";
  if (hasAny(source, ["чум", "болезн", "эпидем", "лихорад", "москит", "зараж", "карантин"])) return "plague";
  if (hasAny(source, ["ужас", "хоррор", "призрак", "демон", "монстр", "страх", "horror", "creature", "nightmare"])) return "horror";
  if (hasAny(source, ["война", "солдат", "танк", "battle", "war", "military", "армия", "ракета", "взрыв", "битва"])) return "war";
  if (hasAny(source, ["катастроф", "disaster", "авар", "цунами", "землетр", "пожар", "шторм", "самолет", "корабль"])) return "disaster";
  if (hasAny(source, ["древн", "археолог", "фараон", "рим", "history", "истори", "импер", "артефакт", "средневек"])) return "history";
  if (hasAny(source, ["ai", "ии", "нейро", "робот", "эксперимент", "наука", "учен", "технолог", "science"])) return "science";
  return "general";
}

const THEME_PRESETS = {
  cold_war_alert: {
    title: "ОН НЕ ПОВЕРИЛ\nСИСТЕМЕ",
    facts: ["СССР • КРАСНАЯ ТРЕВОГА", "МИНУТЫ ДО КАТАСТРОФЫ", "ЛОЖНЫЙ СИГНАЛ", "ОДИН ЧЕЛОВЕК РЕШИЛ"],
    hook: "ОН СПАС МИР?",
    visual: "Soviet Cold War underground command room at night, flashing red alarm beacon, CRT warning screens, Soviet duty officer frozen at a console, hand hovering above a report phone, red emergency light washing over steel walls, analog control panels, classified global panic atmosphere, one decision before catastrophe",
    angle: "false Cold War alert / one man refused the system / minutes before global catastrophe",
    forbiddenVisuals: "crime evidence board, police tape, witness silhouette, forensic markers, detective case file, courtroom, suspect wall, red string investigation board",
    variantLabels: {
      poster: "RED ALERT POSTER",
      evidence: "CONTROL ROOM + ALERT",
      human: "ONE MAN / ONE DECISION",
    },
  },
  permafrost: {
    title: "ГЛАЗ ПОДО\nЛЬДОМ?",
    facts: ["МЕРЗЛОТЕ 40 000 ЛЕТ", "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК", "ТРАВА ВНУТРИ БЫЛА ЗЕЛЁНОЙ", "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    hook: "ЭТО МОЖЕТ ВЕРНУТЬСЯ",
    visual: "Siberian permafrost excavation trench, blue-white frozen wall split open, a glossy ancient eye visible under translucent ice, preserved baby mammoth emerging from frozen ground, scientists in heavy winter gear, excavator bucket in background, cold mist, biological threat atmosphere, documentary realism",
    angle: "permafrost horror / ancient life returning / thawed biological danger",
  },
  tunguska: {
    title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?",
    facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?",
    visual: "apocalyptic Siberian taiga after a mysterious aerial explosion, massive blinding white-orange fireball in the sky, radial flattened forest below like matchsticks, strange untouched circular center with black branchless burned trees, no visible crater, storm clouds, ash in the air",
    angle: "forbidden mystery / official explanation under doubt",
  },
  alien: {
    title: "ЭТО БЫЛО\nНЕ С ЗЕМЛИ?",
    facts: ["ВОЕННЫЕ ПРИЕХАЛИ ПЕРВЫМИ", "ОБЛОМКИ ИСЧЕЗЛИ", "СВИДЕТЕЛЕЙ ЗАСТАВИЛИ МОЛЧАТЬ", "ДЕЛО ЗАСЕКРЕЧЕНО"],
    hook: "ЗАПРЕЩЁННАЯ ВЕРСИЯ",
    visual: "night crash site with impossible non-human wreckage, military floodlights, investigators in silhouette, classified evidence markers, one strange metallic object glowing under a tarp",
    angle: "alien conspiracy / hidden government file",
  },
  crime: {
    title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?",
    facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?", "ОТВЕТ БЫЛ РЯДОМ"],
    hook: "ЭТА ДЕТАЛЬ ВСЁ МЕНЯЕТ",
    visual: "dark non-graphic crime evidence board, torn case file, red string, police tape, flashlight beam, suspect silhouette behind frosted glass, forensic markers",
    angle: "true crime evidence twist",
  },
  conspiracy: {
    title: "ЭТО СКРЫВАЛИ\nГОДАМИ?",
    facts: ["ДОКУМЕНТЫ ЗАЧЕРКНУТЫ", "ОЧЕВИДЦЫ МОЛЧАЛИ", "ВЕРСИЯ НЕ СХОДИТСЯ", "СЛИШКОМ МНОГО СОВПАДЕНИЙ"],
    hook: "ЗАПРЕЩЁННЫЙ АРХИВ",
    visual: "secret archive room, redacted classified documents under hard desk lamp, surveillance screens, shadow officials behind glass, stamped top secret folder",
    angle: "classified archive / hidden truth",
  },
  prison: {
    title: "ОТСЮДА\nНЕ ВОЗВРАЩАЛИСЬ",
    facts: ["ОСТРОВ ПОСРЕДИ АДА", "ЖАРА ЛОМАЛА ЛЮДЕЙ", "ПОБЕГ = СМЕРТЬ", "ДЖУНГЛИ ЖДАЛИ ВПЕРЕДИ"],
    hook: "ТЮРЬМА, КОТОРУЮ БОЯЛИСЬ",
    visual: "hellish tropical prison island, rusted bars, humid jungle, stormy ocean, guard tower silhouette, exhausted prisoner shadow, mosquitoes in hot air, cinematic documentary realism",
    angle: "historical survival horror",
  },
  plague: {
    title: "ГОРОД\nУМИРАЛ МОЛЧА",
    facts: ["ДВЕРИ ЗАКОЛАЧИВАЛИ", "УЛИЦЫ ПУСТЕЛИ", "ВРАЧИ НЕ УСПЕВАЛИ", "ЗАПАХ СМЕРТИ ВЕЗДЕ"],
    hook: "ТЫ БЫ НЕ ВЫЖИЛ",
    visual: "medieval plague city, sealed doors, smoke, plague doctor silhouette, abandoned street, candlelight and fog, non-graphic historical horror atmosphere",
    angle: "historical horror survival",
  },
  horror: {
    title: "ОНИ УВИДЕЛИ\nЭТО СЛИШКОМ ПОЗДНО",
    facts: ["СВЕТ ПОГАС", "ДВЕРЬ ОТКРЫЛАСЬ", "ШАГИ БЫЛИ РЯДОМ", "КАМЕРА ЗАМОЛЧАЛА"],
    hook: "НЕ СМОТРИ ОДИН",
    visual: "dark corridor with unnatural silhouette, cold light leaking from half-open door, frightened witness foreground, fog and scratches, clean non-graphic horror tension",
    angle: "paranormal witness fear",
  },
  war: {
    title: "ЭТА БИТВА\nИЗМЕНИЛА ВСЁ",
    facts: ["СОЛДАТЫ ШЛИ В ДЫМ", "ПРИКАЗ БЫЛ БЕЗУМНЫМ", "ЗЕМЛЯ ГОРЕЛА", "ВЫЖИЛИ ЕДИНИЦЫ"],
    hook: "МИНУТА ДО КАТАСТРОФЫ",
    visual: "battlefield through smoke and sparks, damaged military vehicle, soldiers silhouettes, searchlights, muddy ground, documentary war realism, no gore",
    angle: "war documentary shock",
  },
  disaster: {
    title: "ЗА СЕКУНДЫ\nВСЁ ИСЧЕЗЛО",
    facts: ["ЛЮДИ НЕ УСПЕЛИ", "СИГНАЛ ПРОИГНОРИРОВАЛИ", "НЕБО СТАЛО БЕЛЫМ", "ГОРОД ЗАМЕР"],
    hook: "ЭТО МОЖЕТ ПОВТОРИТЬСЯ",
    visual: "large-scale disaster moment, impossible bright flash, emergency silhouettes, cracked ground, burning debris, cinematic chaos, no gore",
    angle: "catastrophe warning",
  },
  history: {
    title: "ТЫ БЫ\nНЕ ВЫЖИЛ",
    facts: ["ОШИБКА СТОИЛА ЖИЗНИ", "ГРЯЗЬ БЫЛА НОРМОЙ", "ВЛАСТЬ НЕ ПРОЩАЛА", "СТРАХ КАЖДЫЙ ДЕНЬ"],
    hook: "СРЕДНЕВЕКОВЬЕ БЫЛО АДОМ",
    visual: "brutal medieval street, mud, torchlight, exhausted people, wooden punishment frame in background, cinematic historical documentary realism, non-graphic",
    angle: "historical survival shock",
  },
  science: {
    title: "ЭКСПЕРИМЕНТ\nВЫШЕЛ ИЗ-ПОД КОНТРОЛЯ",
    facts: ["ДАТЧИКИ ЗАМОЛЧАЛИ", "КАМЕРА ЗАСВЕТИЛАСЬ", "УЧЁНЫЕ МОЛЧАЛИ", "ОБЪЕКТ НЕ ОБЪЯСНИЛИ"],
    hook: "НАУКА НЕ ГОТОВА",
    visual: "secret laboratory experiment going wrong, glowing containment chamber, warning lights, scientists behind glass, impossible object floating in center",
    angle: "science thriller",
  },
  general: {
    title: "ЭТУ ИСТОРИЮ\nСКРЫВАЛИ?",
    facts: ["ОДНА ДЕТАЛЬ ВСЁ МЕНЯЕТ", "ОФИЦИАЛЬНАЯ ВЕРСИЯ НЕ СХОДИТСЯ", "СВИДЕТЕЛИ МОЛЧАЛИ", "ПРАВДА СТРАШНЕЕ"],
    hook: "ТЫ ПОВЕРИШЬ В ЭТО?",
    visual: "strongest visible story evidence in foreground, dramatic event happening behind, shocked witnesses, cinematic high contrast lighting, clear viral hook object",
    angle: "viral documentary mystery",
  },
};

const STYLE_PRESETS = {
  viral: "viral YouTube Shorts documentary thumbnail, extreme readability, aggressive CTR composition, distressed bold typography, red-white-yellow text palette, black drop shadows, grunge texture",
  netflix: "premium Netflix documentary key art, cinematic poster layout, serious investigative tone, elegant but bold title hierarchy, deep shadows, realistic film grain",
  mrbeast: "high-energy viral thumbnail, oversized headline, exaggerated contrast, strong central object, clear emotional hook, clean readable blocks",
  truecrime: "true crime documentary poster, evidence labels, red string board feeling, police light accents, gritty paper textures, investigative suspense",
  conspiracy: "classified conspiracy poster, warning stamps, redacted documents, black and red palette, top secret evidence board, paranoid thriller atmosphere",
};

function pickStyle(style = "viral", theme = "general") {
  if (theme === "cold_war_alert" && style === "truecrime") {
    return "Cold War classified documentary poster, red emergency typography, Soviet control room atmosphere, bold readable Russian text, no detective or police aesthetic";
  }
  return STYLE_PRESETS[style] || STYLE_PRESETS.viral;
}

function deriveFromScript(input = {}, preset) {
  const source = textSource(input);
  const compact = source.replace(/\s+/g, " ");
  const extractedFacts = [];
  const factRules = [
    [/петров/i, "ПЕТРОВ НЕ ПОВЕРИЛ СИСТЕМЕ"],
    [/не\s+нажал[^.?!]{0,30}кнопк|кнопк[^.?!]{0,30}не\s+нажал/i, "ОН НЕ НАЖАЛ КНОПКУ"],
    [/ссср/i, "СССР • НОЧНАЯ СМЕНА"],
    [/минут[^.?!]{0,50}(конца|катастроф|мира)/i, "МИНУТЫ ДО КОНЦА МИРА"],
    [/ложн[^.?!]{0,20}тревог|тревог[^.?!]{0,40}ложн/i, "ЛОЖНАЯ ТРЕВОГА"],
    [/спутник[^.?!]{0,80}(блик|пуск)/i, "СПУТНИК ОШИБСЯ"],
    [/солнечн[^.?!]{0,40}блик/i, "СОЛНЕЧНЫЙ БЛИК"],
    [/сирен/i, "СИРЕНЫ РЕЗАЛИ УШИ"],
    [/бункер/i, "КРАСНЫЙ БУНКЕР"],
    [/один\s+человек/i, "ОДИН ЧЕЛОВЕК РЕШИЛ"],

    [/глаз[^.?!]{0,60}(лед|л[её]д|мерзлот)/i, "ГЛАЗ ПОДО ЛЬДОМ"],
    [/(сорок\s*тысяч|40\s*тысяч)/i, "МЕРЗЛОТЕ 40 000 ЛЕТ"],
    [/мамонт[её]нок|мамонтенок|мамонтёнок/i, "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК"],
    [/трав[ауы][^.?!]{0,80}зел[её]н/i, "ТРАВА ВНУТРИ БЫЛА ЗЕЛЁНОЙ"],
    [/сибирской\s+язв|anthrax/i, "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    [/щенк/i, "МЕРЗЛОТА ВОЗВРАЩАЕТ ДАЖЕ ЩЕНКА"],
    [/голов[ауы]\s+волк|волк[^.?!]{0,40}клык/i, "ДАЖЕ ГОЛОВА ВОЛКА СОХРАНИЛАСЬ"],
    [/окна[^.?!]{0,60}(выбил|выбило)[^.?!]{0,80}/i, "ОКНА ВЫБИЛО ЗА СОТНИ КМ"],
    [/экспедиц[^.?!]{0,80}(19|девятнадцать)[^.?!]{0,40}лет/i, "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ"],
    [/ни\s+воронк/i, "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    [/ни\s+осколк/i, "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    [/тайга[^.?!]{0,80}(легла|скошенн|повален)/i, "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ"],
    [/бел[а-яё\s-]{0,20}вспышк/i, "БЕЛАЯ ВСПЫШКА В НЕБЕ"],
    [/земля[^.?!]{0,30}(качнулась|дрожала|трясл)/i, "ЗЕМЛЯ КАЧНУЛАСЬ"],
    [/слишком\s+поздно/i, "СЛИШКОМ ПОЗДНО"],
    [/не\s+метеорит/i, "НЕ МЕТЕОРИТ?"],
    [/управляем[а-яё\s-]{0,20}аппарат/i, "УПРАВЛЯЕМЫЙ АППАРАТ?"],
  ];
  for (const [rx, label] of factRules) if (rx.test(compact)) extractedFacts.push(label);
  return { facts: uniq([...extractedFacts, ...(preset.facts || [])]).slice(0, 4) };
}

function buildTitle({ topic = "", script = "", mode = "viral", preset, theme = "general" }) {
  const t = upper(`${topic} ${script}`).replace(/\s+/g, " ");
  if (theme === "cold_war_alert") {
    if (t.includes("НЕ НАЖАЛ") || t.includes("КНОПК")) return "ОН НЕ НАЖАЛ\nКНОПКУ";
    if (t.includes("КОНЦА МИРА")) return "ДО КОНЦА МИРА\nБЫЛИ МИНУТЫ";
    return preset.title;
  }
  if (t.includes("МАМОН") || t.includes("МЕРЗЛОТ") || t.includes("ЛЁД") || t.includes("ЛЕД")) return preset.title;
  if (t.includes("ТУНГУС") || t.includes("СИБИР")) return preset.title;
  if (topic && topic.length <= 42 && mode === "safe") return `${upper(topic)}\nЧТО СКРЫЛИ?`;
  return preset.title;
}

function buildBrief({ topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = {}) {
  const theme = detectCoverTheme({ topic, script, storyboard });
  const preset = THEME_PRESETS[theme] || THEME_PRESETS.general;
  const derived = deriveFromScript({ topic, script, storyboard }, preset);
  const title = buildTitle({ topic, script, mode, preset, theme });
  const modeLine = {
    safe: "credible documentary, no cheap clickbait, still high curiosity",
    viral: "viral curiosity gap, strong fear/mystery hook, bold but believable",
    extreme: "maximum CTR, forbidden-version energy, aggressive warning stamp, still non-graphic",
  }[mode] || "viral curiosity gap";

  return {
    version: "Cover Director v2.7",
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
    psychology: theme === "cold_war_alert"
      ? ["один человек против системы", "минуты до конца мира", "ложная тревога", "решение не нажать", "сначала читается главный заголовок"]
      : ["тайна без полного ответа", "запретная версия", "масштабный шок", "один невозможный визуальный символ", "сначала читается главный заголовок"],
    ctr_score: mode === "extreme" ? 92 : mode === "viral" ? 86 : 73,
    typography_system: "3-level hierarchy: huge top headline, small evidence facts, bottom red-stamp hook",
    readability_rule: "all key text readable on a phone in under 1 second",
    mode_line: modeLine,
  };
}

function composePrompt(brief, variant = "poster") {
  const style = pickStyle(brief.style, brief.theme);
  const isColdWar = brief.theme === "cold_war_alert";
  const variantBlock = isColdWar ? ({
    poster: "Red-alert command-room poster: the flashing siren and Soviet bunker screens dominate the upper and center zones; the officer decision moment is visible but not generic crime evidence.",
    evidence: "Control-room alert poster: emphasize CRT warning screens, red alarm beacon, analog control panels, countdown feeling, classified Cold War room geometry.",
    human: "One-man decision poster: foreground a Soviet duty officer frozen at the console with a hand near a report phone; red warning light reflects on his face; no police or detective imagery.",
  }[variant]) : ({
    poster: "Event-first poster: the impossible event dominates the upper half, evidence landscape dominates the center, text zones are integrated like a professional thumbnail poster.",
    evidence: "Evidence-board poster: include icons, stamped labels, red warning frame, documentary facts arranged on the left side, dramatic event still visible in background.",
    human: "Human + evidence poster: add a tense investigator or eyewitness in the lower/side foreground, direct eye contact, evidence reflected in glasses or held as a document, event visible behind.",
  }[variant]);

  const titleOneLine = brief.main_title.replace(/\n/g, " / ");
  const factsText = brief.side_facts.map((f) => `"${f}"`).join(", ");

  return [
    "Vertical 9:16 viral Russian documentary thumbnail poster.",
    `CORE VISUAL: ${brief.visual_symbol}.`,
    `THUMBNAIL ANGLE: ${brief.angle}; ${brief.mode_line}.`,
    `COMPOSITION: ${variantBlock}`,
    "LAYOUT ZONES: top 35% = huge headline, center 40% = cinematic visual evidence, left side = compact fact blocks with small icons, bottom 20% = red warning stamp / final hook.",
    `ADD EXACT RUSSIAN TOP HEADLINE TEXT: "${titleOneLine}". Make it huge, bold, distressed, white and red, with black shadow, perfectly readable on phone screen.`,
    `ADD LEFT-SIDE FACT BLOCKS: ${factsText}. Use compact white/yellow text with small documentary icons.`,
    `ADD BOTTOM HOOK / RED STAMP TEXT: "${brief.bottom_hook}".`,
    `STYLE: ${style}, cinematic realism, high contrast, dramatic lighting, sharp details, dark atmosphere, professional poster design, mobile readability first.`,
    isColdWar ? "COLD WAR LOCK: Soviet bunker, red siren, CRT screens, analog panels, officer decision, global panic atmosphere. No modern smartphone, no crime board, no police tape." : "",
    "TYPOGRAPHY SYSTEM: use a strict three-level hierarchy only — 1) giant top headline, 2) compact evidence facts, 3) bottom red stamp. Do not create extra captions, random labels, fake UI, channel names, or small unreadable text.",
    "CTR POLISH: one impossible visual symbol must dominate; keep clean negative space behind the headline; make the bottom hook feel like a forbidden-file stamp; sharpen contrast around the central object.",
    isColdWar ? `THEME NEGATIVE: ${brief.forbidden_visuals}. Do not make a police case, detective board, suspect wall, courtroom, true crime poster, forensic board or witness mystery.` : "",
    "NEGATIVE: no watermark, no logo, no subtitles, no random extra text, no misspelled extra labels, no cartoon, no flat illustration, no gore, no UI elements, no duplicated Russian words."
  ].filter(Boolean).join("\n");
}

export function buildCoverDirectorPack(input = {}) {
  const { topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = input;
  const brief = buildBrief({ topic, script, storyboard, mode, style, platform });
  const labels = brief.variant_labels || {
    poster: "MAIN VIRAL POSTER",
    evidence: "EVIDENCE + FACTS",
    human: "WITNESS + MYSTERY",
  };
  const variants = [
    { id: "poster", title: labels.poster, prompt_EN: composePrompt(brief, "poster") },
    { id: "evidence", title: labels.evidence, prompt_EN: composePrompt(brief, "evidence") },
    { id: "human", title: labels.human, prompt_EN: composePrompt(brief, "human") },
  ];
  const negativeExtra = brief.theme === "cold_war_alert"
    ? ", crime evidence board, police tape, witness silhouette, forensic markers, detective case file, courtroom, suspect wall, red string investigation board, modern office"
    : "";

  return {
    ...brief,
    text_layout: {
      top_title: brief.main_title,
      side_facts: brief.side_facts,
      bottom_hook: brief.bottom_hook,
      safe_area: "keep all text inside 8% margins; huge top title; no tiny text under 32px equivalent",
    },
    variants,
    best_prompt_EN: variants[0].prompt_EN,
    negative_prompt_EN: `wrong aspect ratio, horizontal poster, tiny unreadable text, random letters, watermark, logo, UI, subtitles, cartoon, flat vector art, gore${negativeExtra}`,
  };
}

export function buildCoverVariants({ topic = "", script = "", storyboard = null, hook = "" } = {}) {
  const pack = buildCoverDirectorPack({ topic: topic || hook, script, storyboard, mode: "viral", style: "viral" });
  return {
    theme: pack.theme,
    variants: pack.variants.map((v) => ({ id: v.id, title: v.title, prompt_EN: v.prompt_EN })),
  };
}

export const COVER_DNA_PRESETS = {
  cold_war_alert_command: {
    palette: "red black cold gray warning",
    typography: "bold Soviet emergency warning typography",
    atmosphere: "Cold War red alert command bunker",
    symbols: ["red siren", "CRT alert screen", "Soviet officer", "report decision"],
  },
  permafrost_horror: {
    palette: "ice blue black red warning",
    typography: "cold distressed warning typography",
    atmosphere: "ancient biological danger thawing from ice",
    symbols: ["blue ice", "ancient eye", "mammoth", "warning stamp"],
  },
  conspiracy_documentary: {
    palette: "red black orange",
    typography: "bold distressed warning typography",
    atmosphere: "classified mystery",
    symbols: ["warning stamp", "evidence marks", "impact zone"],
  },
  historical_horror: {
    palette: "burnt brown dark red",
    typography: "aged distressed serif",
    atmosphere: "medieval dread",
    symbols: ["smoke", "torchlight", "dirty parchment"],
  },
  prison_survival: {
    palette: "humid green yellow",
    typography: "rough prison typography",
    atmosphere: "suffocating tropical prison",
    symbols: ["rust", "bars", "wet concrete"],
  },
  plague_nightmare: {
    palette: "sick yellow black",
    typography: "fear-driven gothic typography",
    atmosphere: "death and infection",
    symbols: ["fog", "candles", "church shadows"],
  }
};

export function detectCoverDNA(script = "") {
  const s = script.toLowerCase();
  if (s.includes("петров") || s.includes("ссср") || s.includes("ложная тревога") || s.includes("не нажал")) return "cold_war_alert_command";
  if (s.includes("мерзлот") || s.includes("мамонт") || s.includes("сибирской язвы") || s.includes("anthrax")) return "permafrost_horror";
  if (s.includes("тунгус") || s.includes("ufo") || s.includes("не земной")) return "conspiracy_documentary";
  if (s.includes("казнь") || s.includes("средневек") || s.includes("ведьм")) return "historical_horror";
  if (s.includes("тюрьм") || s.includes("остров дьявола")) return "prison_survival";
  if (s.includes("чума") || s.includes("эпидем")) return "plague_nightmare";
  return "conspiracy_documentary";
}
