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
  const narrative = [
    script,
    storyboard?.script,
    storyboard?.title,
    storyboard?.topic,
    storyboard?.hook,
    ...(scenes || []).flatMap((f) => [
      f.description_ru, f.description_en, f.visual, f.voice, f.vo, f.vo_ru, f.text_on_screen
    ])
  ].filter(Boolean).join("\n").replace(/\s+/g, " ").trim();

  // If a real script/storyboard exists, treat it as the source of truth.
  // A stale topic field from a previous project must not override the current story.
  if (narrative.length > 80) return narrative;
  return [topic, narrative].filter(Boolean).join("\n").replace(/\s+/g, " ").trim();
}

function hasAny(source = "", words = []) {
  return words.some((w) => source.includes(w));
}

// Берёт topic и формирует до 3 строк заголовка обложки — без обрезки "…".
function extractTitleFromTopic(topic = "") {
  const t = upper(str(topic));
  if (!t || t.length < 3) return null;
  if (t.length <= 22) return t;
  const words = t.split(" ");

  // Строка 1: первые ~40–45% слов, не длиннее 20 символов
  let s1 = Math.ceil(words.length * 0.45);
  let line1 = words.slice(0, s1).join(" ");
  while (line1.length > 20 && s1 > 1) { s1--; line1 = words.slice(0, s1).join(" "); }

  const rest = words.slice(s1);
  if (!rest.length) return line1;

  // Строка 2: следующие слова, не длиннее 22 символов
  let s2 = Math.ceil(rest.length * 0.55);
  let line2 = rest.slice(0, s2).join(" ");
  while (line2.length > 22 && s2 > 1) { s2--; line2 = rest.slice(0, s2).join(" "); }

  const rest2 = rest.slice(s2);
  if (!rest2.length) return line1 + "\n" + line2;

  // Строка 3: всё оставшееся (без обрезки)
  const line3 = rest2.join(" ");
  return line1 + "\n" + line2 + "\n" + line3;
}

// Извлекает факты прямо из скрипта — для любой темы, без зависимости от preset.
function extractFactsFromScript(script = "", count = 4) {
  const s = str(script).replace(/\s+/g, " ");
  if (!s) return [];
  const results = [];
  const sentences = s.split(/[.!?]+/).map(x => x.trim()).filter(x => x.length > 8);
  for (const sent of sentences) {
    const words = sent.split(/\s+/);
    if (words.length >= 2 && words.length <= 7) {
      results.push(upper(sent));
    } else if (/\d/.test(sent)) {
      const m = sent.match(/[^,;:—–]{0,20}\d+[^,;:—–]{0,25}/);
      if (m) results.push(upper(m[0].trim()));
    }
    if (results.length >= count) break;
  }
  if (results.length < count) {
    for (const sent of sentences) {
      const words = sent.split(/\s+/);
      if (words.length >= 3 && words.length <= 14) {
        const fragment = upper(words.slice(0, Math.min(7, words.length)).join(" "));
        if (!results.some(r => r.startsWith(fragment.slice(0, 12)))) {
          results.push(fragment);
        }
      }
      if (results.length >= count) break;
    }
  }
  return uniq(results).slice(0, count);
}

export function detectCoverTheme(input = {}) {
  const source = low(textSource(input));

  // ── P0: highest priority overrides ────────────────────────────────────────
  if (hasAny(source, [
    "запрещено видеть сны", "запрещены сны", "видеть сны", "чужие сны", "сновид",
    "экран над кроватью", "экран стирает ночь", "стирает ночь над",
    "старый проектор показ", "проектор показывал сны",
    "показывает чужие сны", "площадь заплакала", "плачет весь город", "город плачет"
  ])) return "dream_control_dystopia";

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
  // Medieval leprosy exile — must fire BEFORE generic mourning detection.
  // "покойник" and "похороны" can appear in leprosy scripts ("живой покойник", "похороны при жизни").
  if (hasAny(source, [
    "прокажённ", "прокаженн", "лепра", "leprosy",
    "звонишь сам", "болезн убивала тело",
    "хоронили при жизни", "заупокойн",
    "колокольчик", "живой покойник"
  ])) return "leper_exile";

  // Professional mourning as a BUSINESS — only fires when paid/commercial context is explicit.
  // Do NOT use generic words like "покойник", "похороны", "гроб" — they appear in countless scripts.
  if (hasAny(source, [
    "плакальщиц", "наёмн",
    "за плач платили", "платили за слёзы", "платили за плач",
    "горе напоказ", "горе как бизнес", "горе стоило",
    "траурный бизнес", "ритуал стоил", "горе можно купить",
    "нанятые плакали", "заказные слёзы"
  ])) return "mourning_ritual";
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

  dream_control_dystopia: {
    title: "ТЕБЕ ЗАПРЕТИЛИ\nВИДЕТЬ СНЫ",
    facts: ["ЭКРАН СТИРАЕТ НОЧЬ", "ГОРОД СПИТ ПУСТО", "ПРОЕКТОР ПОКАЗАЛ ЧУЖИЕ СНЫ", "ПЛОЩАДЬ ЗАПЛАКАЛА"],
    hook: "ТЫ БЫ ВЕРНУЛ ИМ СНЫ?",
    visual: "dystopian concrete sleeping cell with a harsh white rectangular screen above a narrow bed, a tired hand shielding the eyes, old film projector discovered under dusty cloth, city square watching impossible dream images on a giant facade, oppressive dream-control society, raw cinematic documentary realism",
    angle: "dream-control dystopia / stolen humanity / forbidden memory machine",
    forbiddenVisuals: "alternate-history classroom, authoritarian portrait, wartime propaganda, war poster, police case board, paranormal monster, fantasy dream clouds, glossy cyberpunk city",
    variantLabels: { poster: "DREAM CONTROL POSTER", evidence: "SCREEN + PROJECTOR", human: "THE CITY WAKES" },
  },

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

  leper_exile: {
    title: "ТЫ БЫЛ\nЖИВОЙ МЕРТВЕЦ",
    facts: ["КОЛОКОЛЬЧИК — ПРИГОВОР", "ХОРОНИЛИ ПРИ ЖИЗНИ", "НЕЛЬЗЯ КАСАТЬСЯ ВОДЫ", "ТЫ УМЕР ДЛЯ ГОРОДА"],
    hook: "ТЫ БЫ ВЫНЕС ЭТО?",
    visual: "medieval street at dusk, solitary cloaked figure walking alone holding a small bronze bell, fog-covered cobblestones, townspeople pressing against damp stone walls in silent horror, priest silhouette in a church archway reading from a book over a living man, single torch throwing long shadows, cold mist, cinematic historical documentary realism, no gore",
    angle: "medieval leprosy exile / social death while alive / funeral held for the living",
    forbiddenVisuals: "plague doctor beaked mask, bubonic buboes, gore, skeleton imagery, fantasy creature, modern objects",
    variantLabels: { poster: "THE BELL POSTER", evidence: "SOCIAL DEATH", human: "LIVING DEAD" },
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

  // ── Canva-inspired styles ──────────────────────────────────────────────────
  bold_caption: {
    desc: "Canva-style bold caption overlay thumbnail, large semi-transparent text band across center or bottom, clean geometric shapes as background accents, high contrast accessible design, modern social media energy",
    layout: "full-bleed photo/scene behind, bold caption band in center or lower third with semi-transparent dark fill, clean white text hierarchy, simple geometric accent shape at corner",
    palette: "vibrant photo background, clean white or black text band, one bold accent color #FF4757 or #2ED573 or #1E90FF, no gradients",
  },
  gradient_pop: {
    desc: "vibrant Canva gradient poster, bold smooth multi-color gradient background, clean modern sans-serif headline, minimal geometric shapes, youthful high-energy social media feel, Gen Z aesthetic",
    layout: "large gradient field as background, centered bold white headline taking 50% of frame height, small geometric icons or shapes as decoration, bottom tagline in contrasting color",
    palette: "bold gradient: purple-to-coral #7C3AED→#F59E0B or teal-to-pink #0EA5E9→#EC4899, pure white headline text, one small accent emoji or icon",
  },
  clean_infographic: {
    desc: "clean Canva infographic poster, white or very light background, colorful headline with bold accent word in different color, minimal flat icons, organized readable sections, professional modern presentation feel",
    layout: "clean white or very light gray background, large headline with one accent word in bold color, 2-3 clean fact badges as colored pills or cards arranged below, simple flat icon at top",
    palette: "white or #F8FAFC background, deep gray #1E293B for main text, electric blue #3B82F6 or orange #F97316 accent, clean modern sans-serif throughout",
  },

  // ── Энергетика / Агрессия ──────────────────────────────────────────────────
  bold_yellow: {
    desc: "classic YouTube viral bold yellow-black thumbnail, giant oversized yellow headline with thick black outline and aggressive drop shadow, high energy reaction energy, maximally readable in 2 seconds on mobile",
    layout: "pure black or very dark background, single enormous yellow bold headline filling 55% of height, optional secondary white line below, bottom red or white accent stamp",
    palette: "pure black background, electric yellow #FFE600 headline with thick black stroke, white secondary text, small red #FF0000 accent for numbers or key word",
  },
  inferno: {
    desc: "fire and danger aggressive thumbnail, deep red and orange flame-lit atmosphere, bold warning typography, high-adrenaline threat energy, danger and risk visual language",
    layout: "near-black background with deep red-orange fire gradient at bottom and edges, bold white or orange headline at top, facts as orange warning labels, bottom red stamp",
    palette: "deep black to red-orange gradient, white headline with orange glow outline, amber #FF8C00 facts, urgent red #FF2400 stamp",
  },
  arctic: {
    desc: "cold arctic mysterious thumbnail, deep ice-blue and white palette, frozen crystalline atmosphere, isolation and mystery energy, cold science or deep ocean feel",
    layout: "deep cold blue-black background, frozen ice crystal or deep water visual, white headline with cold blue tint, fact labels in ice-blue glass-like pills",
    palette: "deep navy #0A1628 to ice blue #B8E0FF gradient, pure white headline, ice blue #64B5F6 facts, subtle frost texture",
  },

  // ── Ретро / Артхаус ────────────────────────────────────────────────────────
  vintage_film: {
    desc: "1960-70s vintage film documentary poster, aged celluloid grain and faded colors, typewriter or classic editorial serif typography, analog photography feeling, timeless journalistic authenticity",
    layout: "full-frame aged film-grain photo, centered title in classic vintage typography with film-era tracking, bottom single stripe with faded facts in typewriter font, visible scratches and grain",
    palette: "faded warm tones — sepia #8B7355, faded yellow #D4A843, off-white #F5F0DC, dark brown #2D1B00, vintage film color cast",
  },
  dark_academia: {
    desc: "dark academia scholarly mysterious poster, leather and aged paper atmosphere, candlelight and library aesthetics, intellectual mystery, old books and forbidden knowledge energy",
    layout: "deep warm brown and green academic atmosphere, ornate serif title in gold or cream, aged parchment-style fact labels, subtle candlelight glow from below",
    palette: "deep forest green #1C3A2A and dark brown #2C1810, aged gold #C9A84C headline, cream #F5EDD6 facts, candlelight amber accent",
  },

  // ── Медиа / Спецэффекты ─────────────────────────────────────────────────────
  breaking_tv: {
    desc: "live TV breaking news broadcast thumbnail, news channel lower-third graphics, urgent broadcast urgency, red BREAKING NEWS banner, authoritative newscast energy",
    layout: "news footage or dramatic scene behind, thick red СРОЧНО or BREAKING banner at very bottom, bold white news headline above banner, network-style left stripe accent, ticker-feel elements",
    palette: "dark scene background, red #CC0000 breaking banner, white headline text, light blue #4FC3F7 accent stripe, clean broadcast typography",
  },
  street_poster: {
    desc: "hand-pasted street art poster thumbnail, torn paper edges, rough paste-up texture, urban guerrilla design aesthetic, bold propaganda-style typography, raw activist energy",
    layout: "rough paper or concrete wall texture background, oversized bold angular title with slight rotation or off-alignment, fact labels as torn paper strips or marker scrawl, raw hand-made feel",
    palette: "aged paper cream or raw concrete gray, bold black text with rough edges, one aggressive accent color red or yellow, ink bleed and texture artifacts",
  },

  hyperreal_8k: {
    desc: "ultra-hyperrealistic 8K+ photography thumbnail, razor-sharp microscopic detail, zero motion blur, zero film grain, maximum color volume and contrast, forensically clear like watching 8K reference display",
    layout: "full-bleed hyperrealistic photograph, subject in perfect critical focus with microscopic surface detail, dramatic high-contrast studio-calibrated lighting, deep rich background, bold sharp text with clean modern sans-serif",
    palette: "maximum color volume — Rec.2020 wide gamut, rich deep blacks fully detailed, brilliant clean whites without clipping, vibrant accurate hues, zero desaturation, zero grain, zero vintage treatment",
  },
};

function getStyleConfig(style = "viral", theme = "general") {
  // Special overrides for specific theme+style combos
  if (theme === "dream_control_dystopia") {
    return {
      desc: "raw dystopian documentary poster, oppressive concrete cells, harsh white screen light, dusty analog projector, restrained red warning typography, non-glossy cinematic realism",
      layout: "blinding white rectangle and shielding hand as main hook, old projector as forbidden evidence object, concrete city/square as secondary layer",
      palette: "dirty concrete gray, harsh white screen glow, muted graphite, small red warning accent",
    };
  }
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
    [/запрещен[оы][^.?!]{0,60}сн|запретили[^.?!]{0,60}сн/i, "ТЕБЕ ЗАПРЕТИЛИ ВИДЕТЬ СНЫ"],
    [/экран[^.?!]{0,80}(кровать|бел[а-яё\s-]{0,20}свет|стирает)/i, "ЭКРАН СТИРАЕТ НОЧЬ"],
    [/стар[а-яё\s-]{0,20}проектор|проектор[^.?!]{0,60}(наш|показ)/i, "СТАРЫЙ ПРОЕКТОР ПОКАЗАЛ СНЫ"],
    [/чуж[иех]{0,3}\s+сны|сны[^.?!]{0,50}чуж/i, "ОН ПОКАЗЫВАЛ ЧУЖИЕ СНЫ"],
    [/площад[^.?!]{0,80}плач|плач[^.?!]{0,80}город/i, "НА ПЛОЩАДИ ПЛАКАЛ ВЕСЬ ГОРОД"],
    [/уничтожить|сжечь/i, "ПРИКАЗ: УНИЧТОЖИТЬ"],
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
    // ── Leprosy / medieval exile ─────────────────────────────────────────────
    [/прокажённ|прокаженн|лепра/i, "ТАК ВСТРЕЧАЛИ ПРОКАЖЁННЫХ"],
    [/колокольчик[^.?!]{0,80}(стучит|звонит|предупрежд|звук|дрожит|руке)/i, "ЭТОТ ЗВУК — ТВОЙ ПРИГОВОР"],
    [/заупокойну[ю][^.?!]{0,40}(служб|молитв)/i, "ЧИТАЛИ ЗАУПОКОЙНУЮ ПРИ ЖИЗНИ"],
    [/похорон[^.?!]{0,60}(при жизни|живой|стоял рядом|слушал)/i, "ХОРОНИЛИ ПОКА ТЫ СТОЯЛ РЯДОМ"],
    [/горсть[^.?!]{0,40}земл/i, "ГОРСТЬ ЗЕМЛИ К НОГАМ ЖИВОГО"],
    [/живой[^.?!]{0,20}покойник|покойник[^.?!]{0,20}живой/i, "ТЫ ЖИВ — НО ДЛЯ НИХ УЖЕ НЕТ"],
    [/пальцы[^.?!]{0,60}(теряли|потеряли|чувств)/i, "ПАЛЬЦЫ ТЕРЯЛИ ЧУВСТВИТЕЛЬНОСТЬ"],
    [/превращ[^.?!]{0,40}(тень|мертв|покойник)/i, "ТЫ СТАЛ ТЕНЬЮ ЕЩЁ ЖИВЫМ"],
    [/болезн[^.?!]{0,20}убивала[^.?!]{0,20}(тело|раньше)/i, "БОЛЕЗНЬ УБИВАЛА ТЕЛО ПОСЛЕДНЕЙ"],
    [/запрет[^.?!]{0,40}(касаться|колодц|рынк|двери)/i, "НЕЛЬЗЯ КАСАТЬСЯ КОЛОДЦА И ДВЕРИ"],
    // ── Professional mourning (business context) ────────────────────────────
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

  // Если тематические regex ничего не нашли — извлекаем факты прямо из скрипта
  if (extractedFacts.length === 0 && input.script) {
    const scriptFacts = extractFactsFromScript(input.script, 4);
    if (scriptFacts.length > 0) {
      return { facts: uniq([...scriptFacts, ...(preset.facts || [])]).slice(0, 4) };
    }
  }

  return { facts: uniq([...extractedFacts, ...(preset.facts || [])]).slice(0, 4) };
}

function buildTitle({ topic = "", script = "", mode = "", preset, theme = "general" }) {
  const t = upper(`${topic} ${script}`).replace(/\s+/g, " ");

  // ── Специфичные темы с узкими ключевыми совпадениями ──────────────────────
  // Только если topic ДЕЙСТВИТЕЛЬНО соответствует теме — иначе используем topic.
  if (theme === "dream_control_dystopia") {
    const topicUp = upper(topic);
    const isDreamTopic = /СНЫ|ПРОЕКТОР|ЭКРАН НАД|ЗАПРЕТ.*СН/i.test(topicUp);
    if (!isDreamTopic) {
      // topic не про сны — извлекаем заголовок из реального topic
      const derived = extractTitleFromTopic(topic);
      if (derived) return derived;
    }
    if (t.includes("УНИЧТОЖИТЬ") || t.includes("СЖЕЧЬ")) return "СЖЕЧЬ ПРОЕКТОР\nИЛИ РАЗБУДИТЬ ГОРОД?";
    return preset.title;
  }
  if (theme === "nazi_alt_history") {
    if (t.includes("ВЫИГРАЛ") || t.includes("ГИТЛЕР")) return "ЕСЛИ БЫ ГИТЛЕР\nВЫИГРАЛ ВОЙНУ";
    const derived = extractTitleFromTopic(topic);
    if (derived) return derived;
    return preset.title;
  }
  if (theme === "cold_war_alert") {
    if (t.includes("НЕ НАЖАЛ") || t.includes("КНОПК")) return "ОН НЕ НАЖАЛ\nКНОПКУ";
    if (t.includes("КОНЦА МИРА")) return "ДО КОНЦА МИРА\nБЫЛИ МИНУТЫ";
    const derived = extractTitleFromTopic(topic);
    if (derived) return derived;
    return preset.title;
  }
  if (theme === "leper_exile") {
    if (t.includes("ЖИВОЙ ПОКОЙНИК") || t.includes("ЖИВОЙ МЕРТВЕЦ")) return "ТЫ БЫЛ\nЖИВОЙ МЕРТВЕЦ";
    if (t.includes("КОЛОКОЛЬЧИК") && (t.includes("ПРИГОВОР") || t.includes("БОЛЕЗН"))) return "ЭТОТ ЗВУК —\nТВОЙ ПРИГОВОР";
    if (t.includes("ПРОКАЖЁНН") || t.includes("ЛЕПРА")) return "ПОХОРОНЫ\nПРИ ЖИЗНИ";
    if (t.includes("ХОРОНИЛИ") && t.includes("ЖИЗНИ")) return "ХОРОНИЛИ\nПРИ ЖИЗНИ";
    const derived = extractTitleFromTopic(topic);
    if (derived) return derived;
    return preset.title;
  }

  // ── Универсальная логика для всех тем ─────────────────────────────────────
  // Приоритет 1: topic — основной источник заголовка для любой темы
  if (topic && topic.length >= 4 && topic.length <= 80) {
    const derived = extractTitleFromTopic(topic);
    if (derived) return derived;
  }
  // Приоритет 2: режим safe + короткий topic
  if (topic && topic.length <= 42 && mode === "safe") return `${upper(topic)}\nЧТО СКРЫЛИ?`;
  // Фоллбэк: хардкод пресета
  return preset.title;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE-AWARE PROMPT COMPOSER
// ─────────────────────────────────────────────────────────────────────────────
function composePrompt(brief, variant = "poster") {
  const sc = getStyleConfig(brief.style, brief.theme);
  const isAltHistory = brief.theme === "nazi_alt_history";
  const isColdWar = brief.theme === "cold_war_alert";
  const isDreamControl = brief.theme === "dream_control_dystopia";
  const titleOneLine = brief.main_title.replace(/\n/g, " / ");
  const factsText = (brief.side_facts || []).map((f) => `"${f}"`).join(", ");

  // Variant-specific composition instruction
  const variantComposition = isDreamControl ? ({
    poster: "Dream-control poster: harsh white screen over a narrow bed and a shielding hand dominate the upper/center; old projector appears as the forbidden object.",
    evidence: "Screen-and-projector poster: split attention between the blinding bed screen and dusty old projector, with concrete city texture behind.",
    human: "City-wakes poster: silhouettes at a square or windows watching dream images on a huge facade, one hand or projector in foreground.",
  }[variant]) : isAltHistory ? ({
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
    isDreamControl ? "DREAM-CONTROL LOCK: white bed screen, dusty old projector, concrete sleeping cells, city square/facade dream projection. No alternate-history classroom, no wartime propaganda, no police case board." : "",
    isAltHistory ? "ALT-HISTORY LOCK: no paranormal horror, no monster. School portrait, history book, silent apartment door, anti-totalitarian documentary tone." : "",
    isColdWar ? "COLD WAR LOCK: Soviet bunker, red siren, CRT screens, analog panels, officer decision. No crime board, no police tape." : "",
    brief.theme === "submarine_warfare" ? "SUBMARINE REALITY LOCK: use only WWII submarines, U-864, HMS Venturer, torpedo track geometry, sonar/depth calculations, red submarine control room, dark North Sea water near Norway. Absolutely no reptiles, no animal eyes, no predators, no monsters, no fantasy creatures." : "",
    brief.forbidden_visuals ? `FORBIDDEN VISUALS: ${brief.forbidden_visuals}.` : "",
    "TYPOGRAPHY RULE: strict 3-level hierarchy — 1) giant headline, 2) compact facts, 3) bottom hook. No extra captions, no channel names, no UI.",
    "CTR RULE: one dominant impossible visual symbol; clean space behind headline; bottom hook reads as forbidden stamp.",
    "NEGATIVE: no watermark, no logo, no random text, no subtitles, no cartoon, no flat vector art, no gore, no duplicated Russian words.",
  ].filter(Boolean).join("\n");
}

function buildBrief({ topic = "", script = "", storyboard = null, mode = "viral", style = "viral", platform = "shorts" } = {}) {
  const source = textSource({ topic, script, storyboard });
  const sourceLow = source.toLowerCase();
  const isSubmarineStory =
    sourceLow.includes("u-864") ||
    sourceLow.includes("venturer") ||
    sourceLow.includes("торпед") ||
    (sourceLow.includes("подвод") && sourceLow.includes("лод")) ||
    (sourceLow.includes("норв") && sourceLow.includes("1945"));

  const theme = isSubmarineStory ? "submarine_warfare" : detectCoverTheme({ topic, script, storyboard });
  const preset = isSubmarineStory ? {
    title: "U-864 ПРОТИВ\nHMS VENTURER",
    facts: [
      "1945 • БЕРЕГА НОРВЕГИИ",
      "ПОДЛОДКА ПРОТИВ ПОДЛОДКИ",
      "СТРЕЛЬБА ПО РАСЧЁТУ",
      "ТОРПЕДНЫЙ ЗАЛП"
    ],
    hook: "ТЫ БЫ НАЖАЛ ПУСК?",
    visual: "World War II underwater submarine duel near Norway, German U-864 and British HMS Venturer as steel submarine silhouettes in black water, sonar map geometry, torpedo path lines, red submarine control-room light, commander hand near torpedo launch control, pressure, metal hull, bubbles, documentary realism, no animals, no reptile eye",
    angle: "historic submarine duel / blind underwater targeting / U-864 vs HMS Venturer",
    forbiddenVisuals: "reptile, crocodile, snake, animal eye, predator eye, monster, creature, dinosaur, shark, dragon, fantasy beast, wildlife hunt, jungle, claws, scales as animal skin",
    variantLabels: { poster: "SUBMARINE DUEL", evidence: "TORPEDO GEOMETRY", human: "COMMANDER DECISION" }
  } : (THEME_PRESETS[theme] || THEME_PRESETS.general);

  const derived = isSubmarineStory ? { facts: preset.facts } : deriveFromScript({ topic, script, storyboard }, preset, theme);
  const title = isSubmarineStory ? preset.title : buildTitle({ topic, script, mode, preset, theme });
  const modeLine = {
    safe: "credible documentary, no cheap clickbait, still high curiosity",
    viral: "viral curiosity gap, strong fear/mystery hook, bold but believable",
    extreme: "maximum CTR, forbidden-version energy, aggressive warning stamp, still non-graphic",
  }[mode] || "viral curiosity gap";

  const psychologyByTheme = {
    dream_control_dystopia: ["сон = последняя свобода", "белый экран как насилие системы", "старый проектор = запретная память", "весь город просыпается одновременно", "выбор зрителя становится моральным приговором"],
    psychology_mind: ["решения принимаются без осознания", "потеря контроля над собой", "манипуляция незаметна", "страх = инструмент управления", "заголовок вызывает немедленную тревогу"],
    money_power: ["система работает против тебя", "они всегда знали заранее", "правила написаны для себя", "ты не в том клубе", "заголовок вызывает злость"],
    space_cosmos: ["человек ничтожно мал", "там может быть что угодно", "одиночество на уровне вселенной", "неизвестность страшнее известного", "заголовок открывает бездну"],
    leper_exile: ["уже мёртв, но ещё дышит", "болезнь убивает медленнее, чем общество", "звук колокольчика = приговор", "похороны при живом человеке", "заголовок озвучивает главный страх зрителя"],
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
