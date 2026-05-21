// engine/coverEngine_v28.js
// NeuroCine Cover Director Engine v2.9 — 24 themes · 13 styles · style-aware composition

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
  // Only narrative content — exclude global_style_lock, image_prompt_en, video_prompt_en,
  // sfx, continuity_note (style/technical fields that caused false theme detection).
  const scenes = storyboard?.scenes || storyboard?.frames || [];
  return [
    topic,
    script,
    storyboard?.title,
    storyboard?.topic,
    storyboard?.hook,
    ...(scenes || []).flatMap((f) => [
      f.description_ru, f.visual, f.voice, f.vo, f.vo_ru, f.text_on_screen
    ])
  ].filter(Boolean).join("\n");
}

function hasAny(source = "", words = []) {
  return words.some((w) => source.includes(w));
}

export function detectCoverTheme(input = {}) {
  // IMPORTANT: theme detection uses ONLY topic + script — NOT storyboard scene fields.
  // Scene descriptions (visual, description_ru, etc.) contain atmospheric language
  // ("луна освещает", "следующий кадр") that causes false theme matches.
  const source = low([input.topic, input.script].filter(Boolean).join("\n"));

  // ── P0: highest priority overrides ────────────────────────────────────────
  if (hasAny(source, [
    "гитлер", "hitler", "наци", "nazi", "рейх", "reich", "третьего рейха", "third reich",
    "план восток", "generalplan ost", "генеральный план ост", "победил в войне", "выиграл войну",
    "проигравшем человечестве", "рабочую массу", "сосед исчезал"
  ])) return "nazi_alt_history";

  if (hasAny(source, ["петров", "ссср", "советск", "бункер", "ложная тревога", "спутник",
    "солнечный блик", "не нажал", "конца мира", "до конца мира", "компьютеры показали"])) return "cold_war_alert";

  // ── P1: specific event themes ─────────────────────────────────────────────
  if (hasAny(source, ["мерзлот", "mammoth", "мамонт", "мамонтёнок", "мамонтенок", "permafrost",
    "сибирской язвы", "anthrax", "древние могильники"])) return "permafrost";
  if (hasAny(source, ["тунгус", "метеорит", "осколк", "воронк", "взорвалось над"])) return "tunguska";
  if (hasAny(source, ["нло", "ufo", "alien", "иноплан", "не земн", "внезем", "розуэл", "roswell"])) return "alien";

  // ── P2: topic themes ──────────────────────────────────────────────────────
  if (hasAny(source, ["космос", "астронавт", "nasa", "чёрная дыра", "черная дыра", "галактик",
    "планет", "марс", "луна", "орбит", "спутник земл", "невесомост"])) return "space_cosmos";
  if (hasAny(source, ["миллиард", "капитал", "состояни", "богатств", "биллионер", "уолл-стрит",
    "forbes", "корпорац", "монополи", "офшор", "яхта", "особняк"])) return "money_power";
  if (hasAny(source, ["корол", "царь", "царица", "трон", "dynasty", "корона", "правитель",
    "импер", "дворец", "предател", "заговор при", "монарх"])) return "royalty_empire";
  if (hasAny(source, ["ритуал", "культ", "секта", "жертвопринош", "обряд", "масон",
    "иллюминат", "тайное общество", "древний культ", "языческ"])) return "cult_ritual";
  if (hasAny(source, ["психолог", "манипул", "нарцисс", "газлайт", "когнитивн", "подсознани",
    "мозг решает", "поведени человека", "инстинкт", "страх смерти"])) return "psychology_mind";
  if (hasAny(source, ["хищник", "акул", "крокодил", "змея", "охота", "выживани в", "джунгл",
    "природ убивает", "дикая природ", "сафари", "паразит"])) return "nature_wild";
  if (hasAny(source, ["похорон", "плакальщиц", "гроб", "траур", "некролог", "погребен",
    "кладбищ", "скорб", "прощани", "покойник", "отпевани"])) return "mourning_ritual";
  if (hasAny(source, ["тренд", "тикток", "инстаграм", "блогер", "подписчик", "вирусн",
    "соцсет", "инфлюенсер", "хайп", "отмен", "cancel"])) return "social_modern";
  if (hasAny(source, ["еда", "кухн", "рецепт", "яд в", "отравлен едой", "пищев",
    "фастфуд", "продукт", "сахар убивает", "скрытое в еде"])) return "food_dark";

  // ── P3: broad narrative themes ────────────────────────────────────────────
  if (hasAny(source, ["убий", "маньяк", "преступ", "детектив", "полици", "фбр", "fbi",
    "следователь", "следствие", "расследован"])) return "crime";
  if (hasAny(source, ["заговор", "секретн", "classified", "redacted", "гриф", "скрывал"])) return "conspiracy";
  if (hasAny(source, ["тюрьм", "остров дьявола", "каторг", "побег", "заключ", "гулаг"])) return "prison";
  if (hasAny(source, ["чум", "эпидем", "лихорад", "москит", "зараж", "карантин"])) return "plague";
  if (hasAny(source, ["война", "вторая мировая", "солдат", "танк", "армия", "битва"])) return "war";
  if (hasAny(source, ["ужас", "хоррор", "призрак", "демон", "монстр", "horror", "nightmare"])) return "horror";
  if (hasAny(source, ["катастроф", "цунами", "землетр", "пожар", "шторм"])) return "disaster";
  if (hasAny(source, ["фараон", "археолог", "артефакт", "средневек"])) return "history";
  if (hasAny(source, ["нейро", "робот", "эксперимент", "учен", "технолог"])) return "science";
  return "general";
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────
const THEME_PRESETS = {

  nazi_alt_history: {
    title: "МИР БЫЛ БЫ\nСЛИШКОМ ТИХИМ",
    facts: ["ОДИН ПОРТРЕТ НА СТЕНЕ", "СОСЕД ИСЧЕЗАЛ НОЧЬЮ", "ИСТОРИЯ НАЧИНАЛАСЬ С ПРИКАЗА", "ПЛАН ВОСТОК = МИЛЛИОНЫ БЕЗ ИМЕНИ"],
    hook: "ТЫ БЫ СЧИТАЛ ЭТО НОРМОЙ?",
    visual: "alternate-history occupied Europe classroom corridor, one authoritarian portrait on a school wall, a history book open to a command-like page, empty apartment door in the background, silent street outside the window, muted gray uniforms as distant silhouettes, oppressive quiet, documentary warning tone",
    angle: "alternate-history warning / silent dictatorship",
    forbiddenVisuals: "paranormal monster, true crime evidence board, horror creature, glorifying propaganda, heroic Nazi imagery, celebratory flags",
    variantLabels: { poster: "ALT HISTORY POSTER", evidence: "CLASSROOM + ORDER", human: "SILENT NEIGHBOR" },
  },

  cold_war_alert: {
    title: "ОН НЕ ПОВЕРИЛ\nСИСТЕМЕ",
    facts: ["СССР • КРАСНАЯ ТРЕВОГА", "МИНУТЫ ДО КАТАСТРОФЫ", "ЛОЖНЫЙ СИГНАЛ", "ОДИН ЧЕЛОВЕК РЕШИЛ"],
    hook: "ОН СПАС МИР?",
    visual: "Soviet Cold War underground command room at night, flashing red alarm beacon, CRT warning screens, Soviet duty officer frozen at a console, hand hovering above a report phone, red emergency light washing over steel walls, analog control panels, classified global panic atmosphere",
    angle: "false Cold War alert / one man refused the system / minutes before global catastrophe",
    forbiddenVisuals: "crime evidence board, police tape, forensic markers, detective case file, courtroom",
    variantLabels: { poster: "RED ALERT POSTER", evidence: "CONTROL ROOM + ALERT", human: "ONE MAN / ONE DECISION" },
  },

  permafrost: {
    title: "ГЛАЗ ПОДО\nЛЬДОМ?",
    facts: ["МЕРЗЛОТЕ 40 000 ЛЕТ", "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК", "ТРАВА ВНУТРИ БЫЛА ЗЕЛЁНОЙ", "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    hook: "ЭТО МОЖЕТ ВЕРНУТЬСЯ",
    visual: "Siberian permafrost excavation trench, blue-white frozen wall split open, glossy ancient eye visible under translucent ice, preserved baby mammoth emerging from frozen ground, scientists in winter gear, cold mist, biological threat atmosphere",
    angle: "permafrost horror / ancient life returning / thawed biological danger",
  },

  tunguska: {
    title: "ЧТО ВЗОРВАЛОСЬ\nНАД СИБИРЬЮ?",
    facts: ["ОКНА ВЫБИЛО ЗА СОТНИ КМ", "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ", "ЭКСПЕДИЦИЯ ЧЕРЕЗ 19 ЛЕТ", "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    hook: "ЭТО БЫЛ НЕ МЕТЕОРИТ?",
    visual: "apocalyptic Siberian taiga after mysterious aerial explosion, blinding white-orange fireball in sky, radial flattened forest below, strange untouched circular center, no visible crater, ash in the air",
    angle: "forbidden mystery / official explanation under doubt",
  },

  alien: {
    title: "ЭТО БЫЛО\nНЕ С ЗЕМЛИ?",
    facts: ["ВОЕННЫЕ ПРИЕХАЛИ ПЕРВЫМИ", "ОБЛОМКИ ИСЧЕЗЛИ", "СВИДЕТЕЛЕЙ ЗАСТАВИЛИ МОЛЧАТЬ", "ДЕЛО ЗАСЕКРЕЧЕНО"],
    hook: "ЗАПРЕЩЁННАЯ ВЕРСИЯ",
    visual: "night crash site with impossible non-human wreckage, military floodlights, investigators in silhouette, classified evidence markers, strange metallic object glowing under a tarp",
    angle: "alien conspiracy / hidden government file",
  },

  // ── NEW THEMES ─────────────────────────────────────────────────────────────

  space_cosmos: {
    title: "ЗА ЭТИМ\nНЕТ НИЧЕГО?",
    facts: ["СВЕТ ИДЁТ 8 МИНУТ", "МЫ ВИДИМ ТОЛЬКО 5%", "СИГНАЛ БЫЛ ОДИН РАЗ", "НИКТО НЕ ВЕРНУЛСЯ"],
    hook: "ЧТО ТАМ В ТЕМНОТЕ?",
    visual: "deep space void with single astronaut figure in white spacesuit seen from behind, facing an incomprehensibly vast dark nebula, one pale distant star far ahead, extreme loneliness, cosmic scale, photorealistic NASA-grade photography, atmospheric particle glow",
    angle: "cosmic scale / existential void / human insignificance",
    variantLabels: { poster: "VOID POSTER", evidence: "DEEP SPACE DATA", human: "LONE ASTRONAUT" },
  },

  money_power: {
    title: "ОНИ ЗНАЛИ\nЗА ГОДЫ ДО НАС",
    facts: ["НАЛОГ ПЛАТИЛ ТЫ", "ОН ЗАРАБОТАЛ НА КРИЗИСЕ", "СИСТЕМА СОЗДАНА ДЛЯ НИХ", "ПРАВИЛА МЕНЯЮТ САМИ"],
    hook: "КАК ОНИ ЭТО ДЕЛАЮТ?",
    visual: "dark opulent boardroom seen through rain-streaked floor-to-ceiling glass, one powerful silhouette against city lights far below, enormous table with financial charts glowing, suited figures as shadows in background, elite power atmosphere, cinematic inequality",
    angle: "hidden wealth mechanics / system designed for few / financial elite secrets",
    variantLabels: { poster: "POWER POSTER", evidence: "MONEY MACHINE", human: "ONE PERCENT" },
  },

  royalty_empire: {
    title: "ЗА ТРОНОМ\nСКРЫТА КРОВЬ",
    facts: ["ПРЕДАТЕЛЬ БЫЛ РЯДОМ", "ДОКУМЕНТ ПОДДЕЛАЛИ", "НАСЛЕДНИК ИСЧЕЗ", "ИСТОРИЯ СОЛГАЛА"],
    hook: "КТО НА САМОМ ДЕЛЕ ПРАВИЛ?",
    visual: "dramatic Renaissance-era royal palace hall at night, a lone monarch figure facing away from viewer toward tall arched window, cracked royal portrait on stone wall, melting candles throwing long shadows, conspiracy documents visible on table, atmosphere of betrayal",
    angle: "royal betrayal / historical cover-up / dynasty secrets",
    variantLabels: { poster: "THRONE POSTER", evidence: "PALACE CONSPIRACY", human: "THE MONARCH" },
  },

  cult_ritual: {
    title: "ОНИ ДЕЛАЛИ\nЭТО ТЫСЯЧИ ЛЕТ",
    facts: ["НИКТО НЕ УХОДИЛ ЖИВЫМ", "РИТУАЛ ПОВТОРЯЛИ ВЕЗДЕ", "СИМВОЛ НАЙДЕН НА 5 КОНТИНЕНТАХ", "ПРАВИТЕЛЬСТВА МОЛЧАТ"],
    hook: "ЧТО ОНИ ЗНАЛИ?",
    visual: "ancient stone chamber deep underground, lone robed figure facing a massive carved symbol on the wall illuminated by torchlight, symbols carved into every surface, thick smoke, absolute isolation, mysterious pre-human atmosphere, documentary archaeology realism",
    angle: "ancient secret ritual / forbidden knowledge / worldwide hidden symbol",
    variantLabels: { poster: "RITUAL POSTER", evidence: "ANCIENT SYMBOL", human: "THE INITIATED" },
  },

  psychology_mind: {
    title: "ТВОЙ МОЗГ\nРЕШАЕТ БЕЗ ТЕБЯ",
    facts: ["РЕШЕНИЕ ПРИНЯТО ЗА 0.3 СЕК", "СТРАХ ПОДЧИНЯЕТ", "ПАМЯТЬ ПЕРЕПИСЫВАЕТСЯ", "МАНИПУЛЯЦИЯ НЕ ОЩУЩАЕТСЯ"],
    hook: "КТО РЕАЛЬНО УПРАВЛЯЕТ ТОБОЙ?",
    visual: "hyper-detailed human brain floating in dark space, lit dramatically from one side casting sharp shadows, neural pathways glowing electric blue inside the tissue, a tiny human silhouette walking on the surface below a glowing synapse, scale contrast, scientific surrealism",
    angle: "mind control / unconscious decisions / psychological manipulation",
    variantLabels: { poster: "MIND POSTER", evidence: "BRAIN MECHANICS", human: "INSIDE YOUR HEAD" },
  },

  nature_wild: {
    title: "ОНА ЖДЁТ\nСВОЁГО МОМЕНТА",
    facts: ["ХИЩНИК ТЕРПИТ ЧАСАМИ", "ЖЕРТВА НЕ СЛЫШИТ", "ПРИРОДА ВСЕГДА ПОБЕЖДАЕТ", "ШАНС — ОДИН"],
    hook: "ТЫ НЕ УШЁЛ БЫ ЖИВЫМ",
    visual: "extreme close-up of apex predator eye in absolute darkness with one pinpoint reflection of light, scales or fur texture impossibly detailed at macro level, patient stillness before an attack, zero motion blur, alive and dangerous, National Geographic ultra-realism",
    angle: "apex predator patience / nature's cold calculation / survival is not guaranteed",
    variantLabels: { poster: "PREDATOR POSTER", evidence: "HUNT MECHANICS", human: "APEX EYE" },
  },

  mourning_ritual: {
    title: "ТЫ НЕ ЗНАЛ,\nЧТО ЭТО БИЗНЕС",
    facts: ["ЗА СЛЁЗЫ ПЛАТИЛИ ОТДЕЛЬНО", "ЧУЖИЕ ГОЛОСА РЫДАЛИ ГРОМЧЕ", "РИТУАЛ СТОИЛ ЦЕЛОЕ СОСТОЯНИЕ", "ГОРЕ НАПОКАЗ = СТАТУС"],
    hook: "ТЫ БЫ НЕ ОТЛИЧИЛ?",
    visual: "atmospheric historical street at dusk, a procession of women in heavy black veils and dark clothing moving in slow choreographed grief, theatrical mourning gestures, cobblestone street, candlelight and fog, muted sepia tones with selective golden warmth on faces, old world ritual atmosphere",
    angle: "paid mourning ritual / grief as performance / hidden social economics",
    variantLabels: { poster: "MOURNING POSTER", evidence: "GRIEF ECONOMY", human: "THE WEEPERS" },
  },

  social_modern: {
    title: "ТЫ НЕ ВИДИШЬ\nЧТО ПРОИСХОДИТ",
    facts: ["АЛГОРИТМ РЕШИЛ ЗА ТЕБЯ", "ТРЕНД СОЗДАН НАМЕРЕННО", "ОТМЕНА БЫЛА СПЛАНИРОВАНА", "1000 АККАУНТОВ — ОДИН ЧЕЛОВЕК"],
    hook: "КТО УПРАВЛЯЕТ ТРЕНДАМИ?",
    visual: "smartphone screen shattered into fragments floating in dark space, each fragment showing a different social media feed, bright notification icons glowing like warning lights in darkness, a tiny human figure reflected in the cracked glass, digital manipulation atmosphere",
    angle: "algorithm manipulation / manufactured trends / social media dark mechanics",
    variantLabels: { poster: "FEED POSTER", evidence: "ALGORITHM EXPOSED", human: "THE SCROLL" },
  },

  food_dark: {
    title: "ЭТО ЕШЬ\nТЫ КАЖДЫЙ ДЕНЬ",
    facts: ["СОСТАВ СКРЫВАЮТ", "ЗАВИСИМОСТЬ СОЗДАНА СПЕЦИАЛЬНО", "ЛОББИ ЗАПРЕТИЛО ИССЛЕДОВАНИЕ", "ВРАЧИ МОЛЧАЛИ"],
    hook: "ЧТО ДОБАВИЛИ В ЕДУ?",
    visual: "hyper-detailed cross-section of processed food product under forensic macro lighting, glowing chemical structure diagrams overlaid, dark laboratory atmosphere, microscopic view of suspicious ingredient, investigative food science aesthetic, clean but disturbing",
    angle: "hidden food industry secrets / manufactured addiction / suppressed research",
    variantLabels: { poster: "FOOD REVEAL", evidence: "INGREDIENT EXPOSÉ", human: "WHAT YOU EAT" },
  },

  // ── ORIGINAL THEMES ────────────────────────────────────────────────────────

  crime: {
    title: "ЧТО СКРЫЛИ\nВ ДЕЛЕ?",
    facts: ["УЛИКА ИСЧЕЗЛА", "СВИДЕТЕЛЬ МОЛЧАЛ", "ПОЛИЦИЯ ОШИБЛАСЬ?", "ОТВЕТ БЫЛ РЯДОМ"],
    hook: "ЭТА ДЕТАЛЬ ВСЁ МЕНЯЕТ",
    visual: "dark non-graphic crime evidence board, torn case file, red string, police tape, flashlight beam cutting through darkness, suspect silhouette behind frosted glass, forensic markers on table",
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
    visual: "hellish tropical prison island, rusted bars, humid jungle, stormy ocean, guard tower silhouette, exhausted prisoner shadow, documentary realism",
    angle: "historical survival horror",
  },

  plague: {
    title: "ГОРОД\nУМИРАЛ МОЛЧА",
    facts: ["ДВЕРИ ЗАКОЛАЧИВАЛИ", "УЛИЦЫ ПУСТЕЛИ", "ВРАЧИ НЕ УСПЕВАЛИ", "ЗАПАХ СМЕРТИ ВЕЗДЕ"],
    hook: "ТЫ БЫ НЕ ВЫЖИЛ",
    visual: "medieval plague city at night, sealed doors, thick smoke, plague doctor silhouette in bird mask, abandoned street, single candlelight in window, fog rolling over cobblestones",
    angle: "historical horror survival",
  },

  horror: {
    title: "ОНИ УВИДЕЛИ\nЭТО СЛИШКОМ ПОЗДНО",
    facts: ["СВЕТ ПОГАС", "ДВЕРЬ ОТКРЫЛАСЬ", "ШАГИ БЫЛИ РЯДОМ", "КАМЕРА ЗАМОЛЧАЛА"],
    hook: "НЕ СМОТРИ ОДИН",
    visual: "dark corridor with impossible unnatural silhouette at the far end, cold white light leaking from a half-open door, frightened witness foreground, scratches on walls, heavy fog, non-graphic horror tension",
    angle: "paranormal witness fear",
  },

  war: {
    title: "ЭТА БИТВА\nИЗМЕНИЛА ВСЁ",
    facts: ["СОЛДАТЫ ШЛИ В ДЫМ", "ПРИКАЗ БЫЛ БЕЗУМНЫМ", "ЗЕМЛЯ ГОРЕЛА", "ВЫЖИЛИ ЕДИНИЦЫ"],
    hook: "МИНУТА ДО КАТАСТРОФЫ",
    visual: "battlefield through dense smoke and sparks at golden hour, damaged military vehicle in foreground, soldiers silhouettes advancing, dramatic searchlights overhead, muddy ground with shell craters, war documentary realism, no gore",
    angle: "war documentary shock",
  },

  disaster: {
    title: "ЗА СЕКУНДЫ\nВСЁ ИСЧЕЗЛО",
    facts: ["ЛЮДИ НЕ УСПЕЛИ", "СИГНАЛ ПРОИГНОРИРОВАЛИ", "НЕБО СТАЛО БЕЛЫМ", "ГОРОД ЗАМЕР"],
    hook: "ЭТО МОЖЕТ ПОВТОРИТЬСЯ",
    visual: "city at the moment of impossible disaster, enormous bright flash on the horizon turning the sky white, people frozen mid-motion as silhouettes, emergency vehicles overturned, cracked ground, ash particles in air, cinematic chaos without gore",
    angle: "catastrophe warning",
  },

  history: {
    title: "ТЫ БЫ\nНЕ ВЫЖИЛ",
    facts: ["ОШИБКА СТОИЛА ЖИЗНИ", "ГРЯЗЬ БЫЛА НОРМОЙ", "ВЛАСТЬ НЕ ПРОЩАЛА", "СТРАХ КАЖДЫЙ ДЕНЬ"],
    hook: "СРЕДНЕВЕКОВЬЕ БЫЛО АДОМ",
    visual: "brutal medieval street at night, mud and torchlight, exhausted peasants, wooden punishment stocks in background, rats visible at cobblestone edges, dark castle looming over everything, cinematic historical documentary realism",
    angle: "historical survival shock",
  },

  science: {
    title: "ЭКСПЕРИМЕНТ\nВЫШЕЛ ИЗ-ПОД КОНТРОЛЯ",
    facts: ["ДАТЧИКИ ЗАМОЛЧАЛИ", "КАМЕРА ЗАСВЕТИЛАСЬ", "УЧЁНЫЕ МОЛЧАЛИ", "ОБЪЕКТ НЕ ОБЪЯСНИЛИ"],
    hook: "НАУКА НЕ ГОТОВА",
    visual: "secret research laboratory at night, one glowing containment chamber in center, warning red lights activated, scientists in protective gear pressed against glass watching, impossible floating object inside chamber, classified experiment gone wrong atmosphere",
    angle: "science thriller",
  },

  general: {
    title: "ЭТУ ИСТОРИЮ\nСКРЫВАЛИ?",
    facts: ["ОДНА ДЕТАЛЬ ВСЁ МЕНЯЕТ", "ОФИЦИАЛЬНАЯ ВЕРСИЯ НЕ СХОДИТСЯ", "СВИДЕТЕЛИ МОЛЧАЛИ", "ПРАВДА СТРАШНЕЕ"],
    hook: "ТЫ ПОВЕРИШЬ В ЭТО?",
    visual: "strongest visible story evidence in foreground, dramatic event happening behind, shocked witnesses in silhouette, cinematic high contrast lighting, clear viral hook object dominating frame",
    angle: "viral documentary mystery",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLE PRESETS — each defines a unique VISUAL LANGUAGE
// ─────────────────────────────────────────────────────────────────────────────
const STYLE_PRESETS = {

  // Original styles
  viral: {
    desc: "viral YouTube Shorts documentary thumbnail, extreme CTR composition, distressed bold condensed typography, red-white-yellow text on dark background, aggressive black drop shadows, rough grunge texture overlay, high contrast, mobile-first readability",
    layout: "top 35% = giant distressed headline in red/white, center = dramatic cinematic scene, left strip = yellow fact labels, bottom 20% = red warning stamp",
    palette: "black background, red #E53E3E and white text, yellow #FBBF24 accents, dark vignette edges",
  },
  netflix: {
    desc: "premium Netflix/HBO documentary key art, serious investigative tone, elegant but powerful title hierarchy, deep cinematic shadows, realistic film grain, prestige streaming aesthetic",
    layout: "centered bold title in upper third, full-bleed cinematic image, subtle letterbox bars, minimal text overlay, premium documentary feel",
    palette: "very dark background almost black, white and warm gold typography, subtle red accent on key word, elegant spacing",
  },
  mrbeast: {
    desc: "high-energy MrBeast-style viral thumbnail, oversized exaggerated headline with strong yellow outline, extreme facial expression or reaction energy, bold saturated colors, cartoonish drop shadows, clean bright background zones",
    layout: "huge text taking 40% of frame, central object or reaction face, bright contrasting background, exaggerated scale",
    palette: "bright yellow #FCD34D, electric blue, white, strong black outlines, high saturation",
  },
  truecrime: {
    desc: "true crime Netflix/HBO documentary poster, evidence board atmosphere, worn paper textures, red string conspiracy board aesthetic, police procedural lighting, gritty journalistic authority",
    layout: "headline in bold serif on worn background, evidence photos arranged like investigation board, red thread connecting elements, polaroid-style facts",
    palette: "aged cream/beige background, dark brown and red text, faded photographs, red thread accent",
  },
  conspiracy: {
    desc: "classified conspiracy poster aesthetic, black redaction stamps, top-secret document feel, grainy surveillance photography, red and black urgent palette, paranoid thriller energy",
    layout: "redacted document headline, surveillance-style image center, classification stamps scattered, typewriter font facts",
    palette: "dark olive/black background, red stamps, white typewriter text, grainy low-contrast photos",
  },

  // NEW STYLES
  neon_hype: {
    desc: "neon cyberpunk viral thumbnail, electric glowing text with intense cyan and magenta neon outlines, deep black background with gradient light flares, high-energy Gen Z street aesthetic, chrome and glass reflections, futuristic but accessible",
    layout: "massive glowing neon headline at top with electric outline, central subject with neon rim light, small glowing fact badges floating on sides, bottom neon gradient stamp",
    palette: "pure black background, electric cyan #00F5FF and magenta #FF00FF neon glows, white text core, purple gradient accents",
  },
  magazine: {
    desc: "premium editorial magazine cover, clean sophisticated layout with breathing room, luxury serif and sans-serif typography combination, single dominant photograph with elegant text overlay, GQ or Vogue adapted for documentary",
    layout: "clean white or deep black background, centered dominant visual, elegant title in upper zone with generous spacing, minimal side text in refined typography, no clutter",
    palette: "either stark white with black text and one deep accent color, or deep navy/black with gold and white, luxury editorial tones",
  },
  retro_vhs: {
    desc: "VHS retro 80s/90s aesthetic thumbnail, visible scan lines and tape artifacts, slight color bleeding on edges, neon pink and electric blue palette, retro TV channel feel, nostalgic viral energy, chromatic aberration",
    layout: "headline in retro bold italic with VHS glow effect, central image with scan-line overlay, retro date-stamp in corner, fact labels in 80s cable TV graphics style",
    palette: "dark cyan-tinted background, neon pink #FF6EC7 and electric blue #00BFFF, VHS white noise texture, orange date stamp",
  },
  newspaper: {
    desc: "newspaper front page breaking news style, bold black serif headline on cream/white background, red BREAKING banner at top, black-and-white photography with sharp contrast, journalistic authority and urgency",
    layout: "thick red BREAKING NEWS or ЭКСКЛЮЗИВ banner at top, huge bold black serif headline below, news photo with sharp B&W treatment, fact text in newspaper column layout, red accent line separators",
    palette: "cream/white #F5F0E8 background, black serif text, urgent red #CC0000 accent, B&W photo treatment",
  },
  glitch_dark: {
    desc: "digital glitch corruption aesthetic, aggressive RGB color channel splitting, broken pixel blocks and scan distortions, hacker/cyberpunk thriller atmosphere, green matrix-code fragments, corrupted data visual language",
    layout: "glitched headline with RGB split effect, central image with horizontal distortion bands, green code rain in background corners, corrupted pixel blocks as fact labels",
    palette: "near-black background, glitch red #FF0040 and cyan #00FFFF channel splits, toxic green #00FF41 code text, pure white corrupted elements",
  },
  gold_luxury: {
    desc: "ultra-premium dark luxury aesthetic, deep black velvet background, genuine gold foil typography with metallic shimmer, dramatic single-source cinematic side lighting, prestige documentary energy, dark elegance",
    layout: "gold foil title centered or upper third with metallic treatment, atmospheric cinematic scene below, gold leaf separator lines, minimal gold accent facts on sides",
    palette: "deep black #0A0A0A background, gold #C9A84C and champagne #F0D98C typography, warm side light, no harsh colors",
  },
  horror_poster: {
    desc: "classic horror film poster aesthetic, distressed vintage paper texture, dripping paint or blood-like title treatment (non-graphic), dark atmospheric illustration quality, theatrical horror movie design tradition",
    layout: "title dripping or cracking at top, main atmospheric image taking center stage, tagline in italic at bottom, texture and grain throughout, theatrical poster proportions",
    palette: "dark sepia or near-black background, crimson #8B0000 and dirty white title, aged paper texture, fog and shadow",
  },
  minimalist: {
    desc: "ultra-minimalist design, single powerful concept, maximum white or black space, one enormous typographic statement or one impossible object, brutal simplicity that forces the eye to the message",
    layout: "one massive typographic element OR one isolated object against pure background, extreme negative space, single accent color, nothing else",
    palette: "pure white or pure black background, one single accent color for emphasis, clean modern sans-serif, no decoration",
  },
};

function getStyleConfig(style = "viral", theme = "general") {
  // Special overrides for specific theme+style combos
  if (theme === "nazi_alt_history") {
    return {
      desc: "dystopian alternate-history documentary poster, oppressive institutional silence, cold gray palette, red warning typography, school corridor / state office atmosphere, serious anti-totalitarian tone, no glorification",
      layout: "oppressive gray institutional layout, authoritarian portrait in upper zone, text in cold warning typography",
      palette: "cold gray and muted beige, red warning accent, no celebration colors",
    };
  }
  if (theme === "cold_war_alert" && style === "truecrime") {
    return {
      desc: "Cold War classified documentary poster, red emergency typography, Soviet control room atmosphere, bold readable Russian text, no detective or police aesthetic",
      layout: "red alert dominant, CRT screen visual, classified Soviet typography",
      palette: "deep black and emergency red, Soviet green accent, cold white text",
    };
  }
  return STYLE_PRESETS[style] || STYLE_PRESETS.viral;
}

function deriveFromScript(input = {}, preset, theme = "general") {
  const compact = textSource(input).replace(/\s+/g, " ");
  const extractedFacts = [];
  const rules = [
    [/гитлер|hitler/i, "ЕСЛИ БЫ ГИТЛЕР ВЫИГРАЛ"],
    [/школьн[^.?!]{0,60}портрет|портрет[^.?!]{0,40}стен/i, "ОДИН ПОРТРЕТ НА СТЕНЕ"],
    [/сосед[^.?!]{0,50}исчез/i, "СОСЕД ИСЧЕЗАЛ НОЧЬЮ"],
    [/петров/i, "ПЕТРОВ НЕ ПОВЕРИЛ СИСТЕМЕ"],
    [/не\s+нажал[^.?!]{0,30}кнопк|кнопк[^.?!]{0,30}не\s+нажал/i, "ОН НЕ НАЖАЛ КНОПКУ"],
    [/минут[^.?!]{0,50}(конца|катастроф|мира)/i, "МИНУТЫ ДО КОНЦА МИРА"],
    [/ложн[^.?!]{0,20}тревог|тревог[^.?!]{0,40}ложн/i, "ЛОЖНАЯ ТРЕВОГА"],
    [/мамонт[её]нок|мамонтенок/i, "ИЗО ЛЬДА ВЫШЕЛ МАМОНТЁНОК"],
    [/сибирской\s+язв|anthrax/i, "СПОРЫ СИБИРСКОЙ ЯЗВЫ ЖИВЫ"],
    [/окна[^.?!]{0,60}(выбил|выбило)/i, "ОКНА ВЫБИЛО ЗА СОТНИ КМ"],
    [/ни\s+воронк|ни\s+осколк/i, "НИ ВОРОНКИ. НИ ОСКОЛКОВ."],
    [/тайга[^.?!]{0,80}(легла|скошенн|повален)/i, "ТАЙГА ЛЕГЛА ЗА СЕКУНДЫ"],
    [/плакальщиц|наёмн[^.?!]{0,20}плак/i, "ЗА СЛЁЗЫ ПЛАТИЛИ ОТДЕЛЬНО"],
    [/за\s+плач\s+платил|платили\s+за\s+плач/i, "ГОРЕ МОЖНО БЫЛО КУПИТЬ"],
    [/миллиард[^.?!]{0,60}оффшор|оффшор[^.?!]{0,60}налог/i, "ДЕНЬГИ СПРЯТАНЫ В ОФФШОРАХ"],
    [/алгоритм[^.?!]{0,80}(реш|контрол|управл)/i, "АЛГОРИТМ РЕШИЛ ЗА ТЕБЯ"],
    [/реш[её]ни[ея][^.?!]{0,40}прин[яи]т[оа]\s*(до|за\s*[0-9])/i, "РЕШЕНИЕ ПРИНЯТО ЗА 0.3 СЕК"],
    [/манипул[^.?!]{0,60}(не ощуща|незаметн)/i, "МАНИПУЛЯЦИЯ НЕ ОЩУЩАЕТСЯ"],
    [/хищник[^.?!]{0,80}(ждёт|ждет|терп)/i, "ХИЩНИК ТЕРПИТ ЧАСАМИ"],
    [/чёрн[аую][^.?!]{0,20}дыр|черн[аую][^.?!]{0,20}дыр/i, "ЧЁРНАЯ ДЫРА В 4 МЛН СОЛНЦ"],
  ];
  for (const [rx, label] of rules) if (rx.test(compact)) extractedFacts.push(label);
  return { facts: uniq([...extractedFacts, ...(preset.facts || [])]).slice(0, 4) };
}

function buildTitle({ topic = "", script = "", mode = "", preset, theme = "general" }) {
  const t = upper(`${topic} ${script}`).replace(/\s+/g, " ");
  if (theme === "nazi_alt_history") {
    if (t.includes("ВЫИГРАЛ") || t.includes("ГИТЛЕР")) return "ЕСЛИ БЫ ГИТЛЕР\nВЫИГРАЛ ВОЙНУ";
    return preset.title;
  }
  if (theme === "cold_war_alert") {
    if (t.includes("НЕ НАЖАЛ") || t.includes("КНОПК")) return "ОН НЕ НАЖАЛ\nКНОПКУ";
    if (t.includes("КОНЦА МИРА")) return "ДО КОНЦА МИРА\nБЫЛИ МИНУТЫ";
    return preset.title;
  }
  if (topic && topic.length <= 42 && mode === "safe") return `${upper(topic)}\nЧТО СКРЫЛИ?`;
  return preset.title;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE-AWARE PROMPT COMPOSER
// ─────────────────────────────────────────────────────────────────────────────
function composePrompt(brief, variant = "poster") {
  const sc = getStyleConfig(brief.style, brief.theme);
  const isAltHistory = brief.theme === "nazi_alt_history";
  const isColdWar = brief.theme === "cold_war_alert";
  const titleOneLine = brief.main_title.replace(/\n/g, " / ");
  const factsText = (brief.side_facts || []).map((f) => `"${f}"`).join(", ");

  // Variant-specific composition instruction
  const variantComposition = isAltHistory ? ({
    poster: "Alternative-history warning poster: school corridor and wall portrait dominate upper/center; oppressive silence is the threat.",
    evidence: "Classroom-order poster: history book opened to a command page, institutional wall, empty desk, closed apartment door.",
    human: "Silent-neighbor poster: empty doorway, half-seen neighbor silhouette vanishing into darkness, classroom portrait visible.",
  }[variant]) : isColdWar ? ({
    poster: "Red-alert command-room poster: flashing siren and Soviet bunker screens dominate; no crime evidence.",
    evidence: "Control-room alert poster: CRT warning screens, red alarm beacon, analog control panels, countdown feel.",
    human: "One-man decision: Soviet duty officer frozen at console with hand near report phone; no police imagery.",
  }[variant]) : ({
    poster: "Main viral poster: the single impossible central visual dominates upper half; text zones integrated as thumbnail.",
    evidence: "Evidence/data poster: information labels, stamped data blocks, documentary facts on left side, scene in background.",
    human: "Human angle poster: a witness or investigator in foreground with direct eye contact; scene reflected in environment.",
  }[variant]);

  // Style-specific text treatment instruction
  const textTreatment = {
    viral: `TOP TITLE in huge distressed bold condensed font, white with red fill and aggressive black shadow. SIDE FACTS in compact yellow labels. BOTTOM STAMP in bold red.`,
    netflix: `TITLE in clean powerful bold serif or sans, white or warm gold, elegant spacing. FACTS in small refined caption text. Minimal clean hierarchy.`,
    mrbeast: `TITLE in enormous cartoon-bold font with thick yellow or white outline and exaggerated drop shadow. FACTS in bright bold callout boxes. High energy.`,
    truecrime: `TITLE in aged bold serif on worn paper. FACTS styled as evidence labels with torn edges. One underlined red clue word. HOOK as red police stamp.`,
    conspiracy: `TITLE in bold all-caps typewriter or stencil font. FACTS in redacted-style text with black bars partially covering words. HOOK as top-secret red stamp.`,
    neon_hype: `TITLE in huge bold font with electric cyan/magenta neon glow outline. FACTS as glowing holographic badges. HOOK as pulsing neon strip at bottom.`,
    magazine: `TITLE in elegant serif or clean sans with generous tracking. FACTS in small refined caption lines. Restrained, breathing room, luxury feel.`,
    retro_vhs: `TITLE in bold italic with VHS neon glow artifact. FACTS in retro cable-TV graphics style. VHS date-stamp corner. Scan-line texture overlay.`,
    newspaper: `TITLE in massive black serif bold. RED BREAKING BANNER above title. FACTS in narrow newspaper column text. Strong black rules between sections.`,
    glitch_dark: `TITLE with strong RGB channel-split glitch displacement. FACTS in glitched green mono font. Horizontal distortion bands across image. Corrupted pixel blocks.`,
    gold_luxury: `TITLE in deep gold metallic foil with specular shimmer. FACTS in small refined gold-leaf text. Thin gold separator lines. Dark velvet feel.`,
    horror_poster: `TITLE in rough horror display font with drip or crack treatment at bottom of letters. FACTS in weathered italic text. Tagline in elegant small italic.`,
    minimalist: `ONE statement word or short phrase in enormous scale, single accent color on pure background. If facts needed, absolute minimum, tiny and refined.`,
  }[brief.style] || `TOP TITLE huge and bold, FACTS compact, BOTTOM HOOK as stamp.`;

  return [
    `Vertical 9:16 thumbnail poster for short-form video.`,
    `CORE VISUAL: ${brief.visual_symbol}.`,
    `THUMBNAIL ANGLE: ${brief.angle}; ${brief.mode_line}.`,
    `COMPOSITION VARIANT: ${variantComposition}`,
    `LAYOUT: ${sc.layout}.`,
    `COLOR PALETTE: ${sc.palette}.`,
    `TEXT TREATMENT — ${textTreatment}`,
    `RUSSIAN TEXT TO EMBED: TOP TITLE = "${titleOneLine}". SIDE FACTS = ${factsText}. BOTTOM HOOK = "${brief.bottom_hook}".`,
    `STYLE: ${sc.desc}. Professional poster design, mobile readability first.`,
    isAltHistory ? "ALT-HISTORY LOCK: no paranormal horror, no monster. School portrait, history book, silent apartment door, anti-totalitarian documentary tone." : "",
    isColdWar ? "COLD WAR LOCK: Soviet bunker, red siren, CRT screens, analog panels, officer decision. No crime board, no police tape." : "",
    brief.forbidden_visuals ? `FORBIDDEN VISUALS: ${brief.forbidden_visuals}.` : "",
    "TYPOGRAPHY RULE: strict 3-level hierarchy — 1) giant headline, 2) compact facts, 3) bottom hook. No extra captions, no channel names, no UI.",
    "CTR RULE: one dominant impossible visual symbol; clean space behind headline; bottom hook reads as forbidden stamp.",
    "NEGATIVE: no watermark, no logo, no random text, no subtitles, no cartoon, no flat vector art, no gore, no duplicated Russian words.",
  ].filter(Boolean).join("\n");
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

  const psychologyByTheme = {
    psychology_mind: ["решения принимаются без осознания", "потеря контроля над собой", "манипуляция незаметна", "страх = инструмент управления", "заголовок вызывает немедленную тревогу"],
    money_power: ["система работает против тебя", "они всегда знали заранее", "правила написаны для себя", "ты не в том клубе", "заголовок вызывает злость"],
    space_cosmos: ["человек ничтожно мал", "там может быть что угодно", "одиночество на уровне вселенной", "неизвестность страшнее известного", "заголовок открывает бездну"],
    mourning_ritual: ["горе можно купить", "настоящее vs. показное", "ты не знаешь людей вокруг тебя", "деньги решают даже смерть", "заголовок разрушает иллюзию"],
    nazi_alt_history: ["альтернативная история без прославления", "тишина = страх", "обычное стало нормой диктатуры", "сосед исчезает без следов", "заголовок читается первым"],
  };

  return {
    version: "Cover Director v2.9",
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
    psychology: psychologyByTheme[theme] || ["тайна без полного ответа", "запретная версия", "масштабный шок", "один невозможный визуальный символ", "сначала читается главный заголовок"],
    ctr_score: mode === "extreme" ? 92 : mode === "viral" ? 86 : 73,
    typography_system: "3-level hierarchy: huge top headline, compact evidence facts, bottom stamp hook",
    readability_rule: "all key text readable on a phone in under 1 second",
    mode_line: modeLine,
  };
}

export function buildCoverDirectorPack(input = {}) {
  const { topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = input;
  const brief = buildBrief({ topic, script, storyboard, mode, style, platform });
  const labels = brief.variant_labels || { poster: "MAIN POSTER", evidence: "EVIDENCE + DATA", human: "HUMAN ANGLE" };
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
    usage_ru: "Скопируй IMAGE PROMPT в Flow/Nano Banana/Midjourney. Если текст искажается — добавь текст поверх в редакторе с теми же блоками TOP/SIDE/BOTTOM.",
  };
}

export function buildCoverVariants({ topic = "", script = "", storyboard = null, hook = "" } = {}) {
  const pack = buildCoverDirectorPack({ topic: topic || hook, script, storyboard, mode: "viral", style: "viral" });
  return {
    theme: pack.theme,
    variants: pack.variants.map((v) => ({ id: v.id, title: v.title, prompt_EN: v.prompt_EN })),
  };
}

export { STYLE_PRESETS, THEME_PRESETS };
