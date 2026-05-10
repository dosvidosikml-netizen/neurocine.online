// lib/scriptValidator.js
// NeuroCine Script Quality Validator v1
// Проверяет вирусные сценарии на типовые провалы:
// - слабый хук (дата/год/имя в начале)
// - отсутствие "ты"-обращения
// - монотонный ритм (нет коротких фраз)
// - растворённый climax (нет фразы-пика в изоляции)
// - банальная концовка
//
// Используется и на сервере (для ретрая) и на клиенте (для UI индикатора).

// ────────────────────────────────────────────────────────────────────────────
// FORBIDDEN OPENINGS — что НЕ должно стоять в начале текста
// ────────────────────────────────────────────────────────────────────────────
const FORBIDDEN_OPENING_PATTERNS = [
  // Год / дата в начале (главный убийца хука)
  { re: /^[«"']?\s*(в|до|после)?\s*\d{3,4}\s*(году|год|г\.)/i, reason: "начинается с года" },
  { re: /^[«"']?\s*\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i, reason: "начинается с даты" },

  // Слабые шаблоны "это история"
  { re: /^[«"']?\s*это\s+(история|рассказ|случай|событие)/i, reason: "начинается с 'это история о...'" },
  { re: /^[«"']?\s*расскажу/i, reason: "начинается с 'расскажу'" },
  { re: /^[«"']?\s*сегодня\s+(мы|я)\s+(поговорим|узнаем|расскаж)/i, reason: "школьное вступление 'сегодня мы поговорим'" },

  // Слова-паразиты в начале
  { re: /^[«"']?\s*(стоит\s+отметить|известно\s+что|интересный\s+факт|общеизвестно|итак|так\s+вот)/i, reason: "начинается со слова-паразита" },

  // Скучные фактологические зачины
  { re: /^[«"']?\s*в\s+\d{4}\s+году\s+произошл/i, reason: "учебниковый зачин" },
];

// ────────────────────────────────────────────────────────────────────────────
// FORBIDDEN OUTROS — банальные концовки
// ────────────────────────────────────────────────────────────────────────────
const FORBIDDEN_OUTRO_PATTERNS = [
  /что\s+(ты|вы)\s+думае(те|шь)\??\s*$/i,
  /пишите?\s+в\s+комментариях/i,
  /поделитесь\s+(мнением|в\s+комментариях)/i,
  /подписывайтесь/i,
  /ставьте\s+лайк/i,
  /а\s+как\s+(ты|вы)\s+считае(те|шь)\??\s*$/i,
];

// ────────────────────────────────────────────────────────────────────────────
// MAIN VALIDATOR
// ────────────────────────────────────────────────────────────────────────────
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
  };

  const clean = String(text || "").trim();
  if (!clean) {
    return {
      ok: false,
      score: 0,
      issues: ["Пустой текст"],
      checks: { hook_strong: false, has_you_address: false, rhythm_varied: false, climax_isolated: false, outro_strong: false, no_filler_words: false, no_long_lists: false },
    };
  }

  // ── Разбивка на предложения ──
  const sentences = clean
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length < 3) {
    return {
      ok: false,
      score: 20,
      issues: ["Слишком мало предложений (<3)"],
      checks: { hook_strong: false, has_you_address: false, rhythm_varied: false, climax_isolated: false, outro_strong: false, no_filler_words: true, no_long_lists: true },
    };
  }

  // ── 1. HOOK CHECK ── первое предложение
  const firstSentence = sentences[0];
  for (const pattern of FORBIDDEN_OPENING_PATTERNS) {
    if (pattern.re.test(firstSentence)) {
      issues.push(`HOOK: ${pattern.reason} — "${firstSentence.slice(0, 60)}..."`);
      checks.hook_strong = false;
      break;
    }
  }

  // ── 2. YOU-ADDRESS CHECK ── минимум 2 раза "ты/тебя/тебе/твой/твоя/твоё/твои"
  // ВАЖНО: \b в JS regex не работает с кириллицей. Используем lookahead/lookbehind.
  const youMatches = clean.match(/(?<![а-яёА-ЯЁ])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?![а-яёА-ЯЁ])/gi) || [];
  if (youMatches.length < 2) {
    issues.push(`YOU-ADDRESS: только ${youMatches.length} обращений "ты" (нужно минимум 2-3)`);
    checks.has_you_address = false;
  }

  // ── 3. RHYTHM CHECK ── должна быть хотя бы одна короткая фраза (≤5 слов)
  const wordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const shortSentences = wordCounts.filter((w) => w <= 5).length;
  const avgLen = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  // Стандартное отклонение длины
  const variance = wordCounts.reduce((acc, w) => acc + Math.pow(w - avgLen, 2), 0) / wordCounts.length;
  const stdDev = Math.sqrt(variance);

  if (shortSentences < 1 || stdDev < 3) {
    issues.push(`RHYTHM: монотонный ритм (${shortSentences} коротких фраз, σ=${stdDev.toFixed(1)} — нужны ударные короткие фразы ≤5 слов)`);
    checks.rhythm_varied = false;
  }

  // ── 4. CLIMAX CHECK ── в последней трети должна быть короткая ударная фраза
  const lastThirdStart = Math.floor(sentences.length * 0.6);
  const lastThird = sentences.slice(lastThirdStart, sentences.length - 1); // исключаем последнее (это outro)
  const climaxCandidates = lastThird.filter((s) => {
    const wc = s.split(/\s+/).filter(Boolean).length;
    return wc <= 7; // короткая фраза-пик
  });
  if (climaxCandidates.length === 0 && sentences.length >= 6) {
    issues.push("CLIMAX: нет изолированной короткой фразы-пика в последней трети (climax растворён в абзацах)");
    checks.climax_isolated = false;
  }

  // ── 5. OUTRO CHECK ── последняя фраза не должна быть из чёрного списка
  const lastSentence = sentences[sentences.length - 1] || "";
  for (const pattern of FORBIDDEN_OUTRO_PATTERNS) {
    if (pattern.test(lastSentence)) {
      issues.push(`OUTRO: банальная концовка — "${lastSentence.slice(0, 60)}"`);
      checks.outro_strong = false;
      break;
    }
  }
  // Дополнительно: outro слишком короткий или просто question mark в стиле YouTube
  if (lastSentence.length < 15 && /\?$/.test(lastSentence)) {
    issues.push(`OUTRO: вопрос слишком короткий и поверхностный — "${lastSentence}"`);
    checks.outro_strong = false;
  }

  // ── 6. FILLER WORDS ── слова-паразиты
  // ВАЖНО: \b не работает с кириллицей, используем lookahead/lookbehind
  const fillerWords = [
    /(?<![а-яёА-ЯЁ])вообще(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])так\s+вот(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])ну\s+вот(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])как\s+бы(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])типа(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])знаешь(?![а-яёА-ЯЁ])/gi,
    /(?<![а-яёА-ЯЁ])кстати(?![а-яёА-ЯЁ])/gi,
  ];
  let fillerCount = 0;
  for (const re of fillerWords) {
    const m = clean.match(re);
    if (m) fillerCount += m.length;
  }
  if (fillerCount > 1) {
    issues.push(`FILLER: ${fillerCount} слов-паразитов (вообще/типа/как бы/и т.д.)`);
    checks.no_filler_words = false;
  }

  // ── 7. LONG LISTS CHECK ── сухие перечисления через запятую
  // Если в одном предложении больше 3 однородных существительных через запятую — это
  // списочное мышление, зритель не запомнит. Должен быть 1 яркий образ вместо списка.
  // Игнорируем сложные предложения с подчинёнными оборотами (где запятая = граница clause, не перечисление)
  const SUBORDINATE_MARKERS = /\b(потому\s+что|когда|где|который|которая|которое|которые|пока|если|чтобы|хотя|пусть)\b/i;
  const longListSentences = [];
  for (const s of sentences) {
    // Удаляем тире-конструкции (не считаются перечислением)
    const stripped = s.replace(/\s+—\s+/g, " ");
    const commas = (stripped.match(/,/g) || []).length;
    // 3+ запятых в предложении и нет подчинительных союзов = вероятный сухой список
    if (commas >= 3 && !SUBORDINATE_MARKERS.test(stripped)) {
      longListSentences.push(s.slice(0, 70));
    }
  }
  if (longListSentences.length > 0) {
    issues.push(`LONG-LIST: сухое перечисление через запятую — "${longListSentences[0]}..." (замени на 1 яркий образ)`);
    checks.no_long_lists = false;
  }

  // ── SCORE ──
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
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// buildRetryHint — формирует подсказку для регенерации при провале валидации
// Передаётся в системный промт при ретрае.
// ────────────────────────────────────────────────────────────────────────────
export function buildRetryHint(validation) {
  if (!validation || validation.ok) return "";
  const lines = [
    "═══════════════════════════════════════════════════════════════════",
    "RETRY: ПРЕДЫДУЩАЯ ПОПЫТКА ПРОВАЛЕНА. ИСПРАВЬ КОНКРЕТНЫЕ ПРОБЛЕМЫ:",
    "═══════════════════════════════════════════════════════════════════",
  ];

  if (!validation.checks.hook_strong) {
    lines.push("");
    lines.push("⚠ ХУК СЛАБЫЙ. НЕ начинай с года, даты, 'это история', 'расскажу'.");
    lines.push("Используй одну из формул:");
    lines.push('  "За [N секунд] [катастрофа]. И [загадка]."');
    lines.push('  "Ты не знал, что [неожиданный факт]"');
    lines.push('  "Если бы это случилось сегодня — [последствие]"');
    lines.push('  "[Шокирующее утверждение]. И это правда."');
  }

  if (!validation.checks.has_you_address) {
    lines.push("");
    lines.push('⚠ НЕТ ОБРАЩЕНИЯ К ЗРИТЕЛЮ. Минимум 2-3 раза используй "ты/тебя/тебе/твой".');
    lines.push("Зритель должен чувствовать что говорят с ним, а не лекцию читают.");
  }

  if (!validation.checks.rhythm_varied) {
    lines.push("");
    lines.push("⚠ МОНОТОННЫЙ РИТМ. Добавь короткие ударные фразы (3-5 слов).");
    lines.push("Пример: 'Это была норма. Каждый день. Без исключений.'");
    lines.push("Чередуй: длинная — короткая удар — длинная с деталью — короткая.");
  }

  if (!validation.checks.climax_isolated) {
    lines.push("");
    lines.push("⚠ CLIMAX РАСТВОРЁН. Самый шокирующий факт должен быть в ОДНОЙ короткой фразе.");
    lines.push("Не прячь его в абзаце. Вынеси в отдельное предложение, перед ним короткая пауза-разгон.");
  }

  if (!validation.checks.outro_strong) {
    lines.push("");
    lines.push("⚠ КОНЦОВКА БАНАЛЬНАЯ. Запрещено: 'что ты думаешь?', 'пиши в комментариях', 'ты бы поверил?'.");
    lines.push("Используй: переворот смысла + личная угроза/выбор для зрителя.");
    lines.push("Пример: 'Если такое случится завтра над твоим городом — у тебя будет 5 секунд. И ни одного объяснения.'");
  }

  if (!validation.checks.no_filler_words) {
    lines.push("");
    lines.push("⚠ СЛОВА-ПАРАЗИТЫ. Убери: 'вообще', 'типа', 'как бы', 'так вот', 'кстати'.");
  }

  if (!validation.checks.no_long_lists) {
    lines.push("");
    lines.push("⚠ СУХОЕ ПЕРЕЧИСЛЕНИЕ. Список из 3+ элементов через запятую — зритель забудет.");
    lines.push("Выбери ОДИН самый яркий элемент и оставь его. Остальные выкинь или упомяни намёком.");
    lines.push('Плохо: "версии про метеорит, комету, газ, антиматерию и инопланетный корабль"');
    lines.push('Хорошо: "одна из засекреченных версий — управляемый аппарат. Не земной."');
  }

  lines.push("");
  lines.push("Перепиши сценарий с нуля учитывая ВСЕ проблемы выше. Только текст диктора.");
  lines.push("═══════════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
