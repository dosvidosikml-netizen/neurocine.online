// lib/scriptValidator.js
// NeuroCine Script Quality Validator v1.2
// Проверяет вирусные сценарии на типовые провалы и даёт UI score.
// v1.1: исправлены кириллические границы слов в проверке сухих списков.
// v1.2: добавлена проверка пригодности сценария к storyboard и финальному кадру.

const FORBIDDEN_OPENING_PATTERNS = [
  { re: /^[«"']?\s*(в|до|после)?\s*\d{3,4}\s*(году|год|г\.)/i, reason: "начинается с года" },
  { re: /^[«"']?\s*\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i, reason: "начинается с даты" },
  { re: /^[«"']?\s*это\s+(история|рассказ|случай|событие)/i, reason: "начинается с 'это история о...'" },
  { re: /^[«"']?\s*расскажу/i, reason: "начинается с 'расскажу'" },
  { re: /^[«"']?\s*сегодня\s+(мы|я)\s+(поговорим|узнаем|расскаж)/i, reason: "школьное вступление 'сегодня мы поговорим'" },
  { re: /^[«"']?\s*(стоит\s+отметить|известно\s+что|интересный\s+факт|общеизвестно|итак|так\s+вот)/i, reason: "начинается со слова-паразита" },
  { re: /^[«"']?\s*в\s+\d{4}\s+году\s+произошл/i, reason: "учебниковый зачин" },
];

const FORBIDDEN_OUTRO_PATTERNS = [
  /что\s+(ты|вы)\s+думае(те|шь)\??\s*$/i,
  /пишите?\s+в\s+комментариях/i,
  /поделитесь\s+(мнением|в\s+комментариях)/i,
  /подписывайтесь/i,
  /ставьте\s+лайк/i,
  /а\s+как\s+(ты|вы)\s+считае(те|шь)\??\s*$/i,
];

const CYR_LETTERS = "а-яёА-ЯЁ";
const YOU_RE = new RegExp(`(?<![${CYR_LETTERS}])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?![${CYR_LETTERS}])`, "gi");
const FILLER_RE_LIST = ["вообще", "так\\s+вот", "ну\\s+вот", "как\\s+бы", "типа", "знаешь", "кстати"].map(
  (w) => new RegExp(`(?<![${CYR_LETTERS}])${w}(?![${CYR_LETTERS}])`, "gi")
);

const SUBORDINATE_MARKERS = new RegExp(
  `(?<![${CYR_LETTERS}])(потому\\s+что|когда|где|который|которая|которое|которые|пока|если|чтобы|хотя|пусть)(?![${CYR_LETTERS}])`,
  "i"
);

const STORYBOARD_ACTION_RE =
  /(наш[её]л|нашла|включил|включила|нажал|нажала|нажм[её]т|нажимает|поднял|подняла|поднимает|опускает|открыл|открыла|открывает|закрыл|закрыла|закрывает|держит|бер[её]т|берут|тянется|касается|смотрит|видит|ид[её]т|бежит|падает|замирает|стоит|чинит|чинила|полез|полезла|сжигает|сж[её]г|горит|гаснет|дрожит|ломает|прячет|доста[её]т|выводит|транслирует|показывает|отражается|появляется|исчезает)/gi;

const STORYBOARD_ANCHOR_RE =
  /(экран|кровать|стена|дверь|окно|рука|палец|лицо|глаз|рот|кожа|волос|плечо|спина|лампа|свеча|огонь|коридор|улица|город|комната|подвал|крыша|дом|изба|поле|лес|дорога|мост|река|земля|камень|дерево|стол|стул|чашка|нож|мешок|одежда|тело|лестница|вагон|поезд|пульт|кнопка|рубильник|машина|проектор|пл[её]нка|кадр|свет|шум|пыль|дым|стекло|асфальт|вода|ткань|металл|бумага|фото|дневник|ключ|замок)/gi;

const FINAL_FRAME_ACTION_RE =
  /(нажимает|нажала|включает|включила|поднимает|подняла|опускает|открывает|открыла|закрывает|держит|тянется|касается|клад[её]т|бросает|сжигает|ломает|стоит|замирает|смотрит|выводит|транслирует|показывает|загорается|гаснет|дрожит|отражается)/i;

const CONDITIONAL_FINAL_RE =
  /(^|\s)(если|бы|может|могла\s+бы|мог\s+бы|должна\s+ли|стоит\s+ли)(\s|$)/i;

function splitSentences(clean) {
  return String(clean || "")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordCount(sentence) {
  return String(sentence || "").split(/\s+/).filter(Boolean).length;
}

export function validateScript(text = "") {
  const issues = [];
  const checks = {
    hook_strong: true,
    has_you_address: true,
    rhythm_varied: true,
    climax_isolated: true,
    outro_strong: true,
    no_filler_words: true,
    no_long_lists: true,
    storyboard_spine: true,
    final_frame_grounded: true,
  };

  const clean = String(text || "").trim();
  if (!clean) {
    return {
      ok: false,
      score: 0,
      issues: ["Пустой текст"],
      checks: Object.fromEntries(Object.keys(checks).map((k) => [k, false])),
    };
  }

  const sentences = splitSentences(clean);
  if (sentences.length < 3) {
    return {
      ok: false,
      score: 20,
      issues: ["Слишком мало предложений (<3)"],
      checks: { hook_strong: false, has_you_address: false, rhythm_varied: false, climax_isolated: false, outro_strong: false, no_filler_words: true, no_long_lists: true, storyboard_spine: false, final_frame_grounded: false },
    };
  }

  const firstSentence = sentences[0];
  for (const pattern of FORBIDDEN_OPENING_PATTERNS) {
    if (pattern.re.test(firstSentence)) {
      issues.push(`HOOK: ${pattern.reason} — "${firstSentence.slice(0, 60)}..."`);
      checks.hook_strong = false;
      break;
    }
  }

  const youMatches = clean.match(YOU_RE) || [];
  if (youMatches.length < 2) {
    issues.push(`YOU-ADDRESS: только ${youMatches.length} обращений "ты" (нужно минимум 2-3)`);
    checks.has_you_address = false;
  }

  const wordCounts = sentences.map(wordCount);
  const shortSentences = wordCounts.filter((w) => w <= 5).length;
  const avgLen = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const variance = wordCounts.reduce((acc, w) => acc + Math.pow(w - avgLen, 2), 0) / wordCounts.length;
  const stdDev = Math.sqrt(variance);

  if (shortSentences < 1 || stdDev < 3) {
    issues.push(`RHYTHM: монотонный ритм (${shortSentences} коротких фраз, σ=${stdDev.toFixed(1)} — нужны ударные короткие фразы ≤5 слов)`);
    checks.rhythm_varied = false;
  }

  const lastThirdStart = Math.floor(sentences.length * 0.6);
  const lastThird = sentences.slice(lastThirdStart, sentences.length - 1);
  const climaxCandidates = lastThird.filter((s) => wordCount(s) <= 7);
  if (climaxCandidates.length === 0 && sentences.length >= 6) {
    issues.push("CLIMAX: нет изолированной короткой фразы-пика в последней трети (climax растворён в абзацах)");
    checks.climax_isolated = false;
  }

  const lastSentence = sentences[sentences.length - 1] || "";
  for (const pattern of FORBIDDEN_OUTRO_PATTERNS) {
    if (pattern.test(lastSentence)) {
      issues.push(`OUTRO: банальная концовка — "${lastSentence.slice(0, 60)}"`);
      checks.outro_strong = false;
      break;
    }
  }
  if (lastSentence.length < 15 && /\?$/.test(lastSentence)) {
    issues.push(`OUTRO: вопрос слишком короткий и поверхностный — "${lastSentence}"`);
    checks.outro_strong = false;
  }

  let fillerCount = 0;
  for (const re of FILLER_RE_LIST) {
    const m = clean.match(re);
    if (m) fillerCount += m.length;
  }
  if (fillerCount > 1) {
    issues.push(`FILLER: ${fillerCount} слов-паразитов (вообще/типа/как бы/и т.д.)`);
    checks.no_filler_words = false;
  }

  const longListSentences = [];
  for (const sentence of sentences) {
    const stripped = sentence.replace(/\s+—\s+/g, " ");
    const commas = (stripped.match(/,/g) || []).length;
    if (commas >= 3 && !SUBORDINATE_MARKERS.test(stripped)) {
      longListSentences.push(sentence.slice(0, 70));
    }
  }
  if (longListSentences.length > 0) {
    issues.push(`LONG-LIST: сухое перечисление через запятую — "${longListSentences[0]}..." (замени на 1 яркий образ)`);
    checks.no_long_lists = false;
  }

  const storyboardActions = clean.match(STORYBOARD_ACTION_RE) || [];
  const storyboardAnchors = clean.match(STORYBOARD_ANCHOR_RE) || [];
  if (storyboardActions.length < 3 || storyboardAnchors.length < 3) {
    issues.push(`STORYBOARD: мало опор для раскадровки (${storyboardActions.length} действий, ${storyboardAnchors.length} предметных деталей — нужны герой, объект, действие, реакция, финальный кадр)`);
    checks.storyboard_spine = false;
  }

  if (/\?$/.test(lastSentence)) {
    const prevSentence = sentences[sentences.length - 2] || "";
    const prePrevSentence = sentences[sentences.length - 3] || "";
    const finalSetup = `${prePrevSentence} ${prevSentence}`.trim();
    const conditionalFinal = CONDITIONAL_FINAL_RE.test(prevSentence);
    const hasFinalFrameAction = FINAL_FRAME_ACTION_RE.test(finalSetup);
    if (!hasFinalFrameAction || conditionalFinal) {
      issues.push(`FINAL-FRAME: перед последним вопросом нет конкретного кадра-действия героя — "${prevSentence.slice(0, 80)}..."`);
      checks.final_frame_grounded = false;
    }
  }

  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    ok: issues.length === 0,
    score,
    issues,
    checks,
    stats: {
      sentences: sentences.length,
      avg_words_per_sentence: Math.round(avgLen),
      short_sentences: shortSentences,
      you_address_count: youMatches.length,
      rhythm_std_dev: Math.round(stdDev * 10) / 10,
      long_list_sentences: longListSentences.length,
      storyboard_actions: storyboardActions.length,
      storyboard_anchors: storyboardAnchors.length,
    },
  };
}

export function buildRetryHint(validation) {
  if (!validation || validation.ok) return "";
  const lines = [
    "═══════════════════════════════════════════════════════════════════",
    "RETRY: ПРЕДЫДУЩАЯ ПОПЫТКА ПРОВАЛЕНА. ИСПРАВЬ КОНКРЕТНЫЕ ПРОБЛЕМЫ:",
    "═══════════════════════════════════════════════════════════════════",
  ];

  if (!validation.checks.hook_strong) {
    lines.push("", "⚠ ХУК СЛАБЫЙ. Не начинай с года, даты, 'это история', 'расскажу'.", "Начни с неожиданного факта, личной угрозы или формулы 'Ты не знал, что...'.");
  }
  if (!validation.checks.has_you_address) {
    lines.push("", "⚠ НЕТ ОБРАЩЕНИЯ К ЗРИТЕЛЮ. Минимум 2-3 раза используй 'ты/тебя/тебе/твой'.");
  }
  if (!validation.checks.rhythm_varied) {
    lines.push("", "⚠ МОНОТОННЫЙ РИТМ. Добавь короткие ударные фразы 3-5 слов.", "Пример: 'Это была норма. Каждый день. Без исключений.'");
  }
  if (!validation.checks.climax_isolated) {
    lines.push("", "⚠ CLIMAX РАСТВОРЁН. Самый шокирующий факт вынеси в отдельное короткое предложение.");
  }
  if (!validation.checks.outro_strong) {
    lines.push("", "⚠ КОНЦОВКА БАНАЛЬНАЯ. Запрещено: 'что ты думаешь?', 'пиши в комментариях', 'ты бы поверил?'.", "Нужен переворот смысла + личный выбор/угроза для зрителя.");
  }
  if (!validation.checks.no_filler_words) {
    lines.push("", "⚠ СЛОВА-ПАРАЗИТЫ. Убери: 'вообще', 'типа', 'как бы', 'так вот', 'кстати'.");
  }
  if (!validation.checks.no_long_lists) {
    lines.push("", "⚠ СУХОЕ ПЕРЕЧИСЛЕНИЕ. Список из 3+ элементов через запятую зритель забудет.", "Выбери один самый яркий элемент и сделай его визуальным образом.");
  }
  if (!validation.checks.storyboard_spine) {
    lines.push("", "⚠ СЛАБЫЙ STORYBOARD SPINE. Добавь конкретные видимые опоры: герой, место, объект, действие руками/телом, реакция мира, финальный кадр.");
  }
  if (!validation.checks.final_frame_grounded) {
    lines.push("", "⚠ НЕТ ФИНАЛЬНОГО КАДРА. Перед последним вопросом покажи физическое действие или cliffhanger героя: палец над кнопкой, рука на рубильнике, объект в огне, дверь открывается.");
  }

  lines.push("", "Перепиши сценарий с нуля учитывая ВСЕ проблемы выше. Только текст диктора.", "═══════════════════════════════════════════════════════════════════");
  return lines.join("\n");
}
