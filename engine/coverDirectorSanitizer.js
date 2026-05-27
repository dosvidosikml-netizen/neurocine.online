// engine/coverDirectorSanitizer.js
// Post-processes Cover Director output so raw storyboard/script action beats do not leak
// into the thumbnail SIDE FACTS block.

import { THEME_PRESETS } from "./coverEngine_v28";

function str(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function upper(value = "") {
  return str(value).toUpperCase();
}

function uniq(list = []) {
  const out = [];
  const seen = new Set();
  for (const item of list.map(str).filter(Boolean)) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function isRawSceneBeat(value = "") {
  const text = str(value).toLowerCase();
  if (!text) return true;

  // These are good cover-fact signals; keep them even if they are long.
  if (/\d|%|€|\$|год|лет|век|млн|миллион|миллиард|статус|ритуал|сл[её]з|плат|стоил|скры|запрет|система|алгоритм|свидетел|документ|улика|тревог|сигнал|приказ|эксперимент|смерть|выжил|исчез|прокажённ|прокаженн|лепра|колокол|заупокой|покойник|болезн|хоронили|пальц|приговор/i.test(text)) {
    return false;
  }

  // Raw scene/script actions that should never be used as side facts.
  if (/\b(он|она|они|ты|доктор|человек|герой|камера)\b/i.test(text) && /(ид[её]т|выходит|останавливается|смотрит|подходит|проходит|говорит|видит|держит|стоит|сидит|лежит|поворачивается|открывает|закрывает|бер[её]т|подпустил|между|у стены|в переулок)/i.test(text)) {
    return true;
  }

  // Long narrative fragments are not thumbnail facts.
  return text.length > 34 && !/[0-9]/.test(text);
}

function compactFact(value = "") {
  const text = upper(value)
    .replace(/\s*[—–-]\s*/g, " — ")
    .replace(/[.]+$/g, "")
    .trim();

  if (text.length <= 42) return text;
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, 5).join(" ");
}

function sanitizeFacts(cover = {}) {
  const presetFacts = THEME_PRESETS?.[cover.theme]?.facts || [];
  const currentFacts = Array.isArray(cover.side_facts) ? cover.side_facts : [];
  const goodCurrent = currentFacts.filter((fact) => !isRawSceneBeat(fact)).map(compactFact);

  // If most facts are raw scene beats, fall back to the theme's thumbnail facts.
  const rawCount = currentFacts.filter(isRawSceneBeat).length;
  const shouldUsePreset = rawCount >= Math.max(1, currentFacts.length - 1) || goodCurrent.length < 2;
  const source = shouldUsePreset ? presetFacts : goodCurrent;

  return uniq(source.map(compactFact)).slice(0, 4);
}

function replaceFactsInsidePrompt(prompt = "", facts = []) {
  const factsText = facts.map((f) => `"${f}"`).join(", ");
  return String(prompt || "").replace(
    /SIDE FACTS\s*=\s*[\s\S]*?\.\s*BOTTOM HOOK\s*=/i,
    `SIDE FACTS = ${factsText}. BOTTOM HOOK =`
  );
}

export function sanitizeCoverDirectorPack(cover = {}) {
  if (!cover || typeof cover !== "object") return cover;

  const cleanFacts = sanitizeFacts(cover);
  if (!cleanFacts.length) return cover;

  return {
    ...cover,
    side_facts: cleanFacts,
    text_layout: {
      ...(cover.text_layout || {}),
      side_facts: cleanFacts,
    },
    variants: Array.isArray(cover.variants)
      ? cover.variants.map((variant) => ({
          ...variant,
          prompt_EN: replaceFactsInsidePrompt(variant.prompt_EN, cleanFacts),
        }))
      : cover.variants,
  };
}
