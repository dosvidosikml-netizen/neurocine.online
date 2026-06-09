import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты сценарист трейлеров и короткометражек для вертикального cinematic storyboard.
Пиши на русском. Верни только готовый сценарий без markdown, заголовков, нумерации и объяснений.

Жёсткие правила:
- сценарий должен быть сразу пригоден для раскадровки;
- каждая фраза должна давать видимый кадр, действие, реакцию, объект, место, свет или звук;
- держи одну понятную локацию/мир, не прыгай хаотично между местами;
- если нужны персонажи, введи их рано и удерживай до конца;
- диалоги допустимы, но коротко и только когда они усиливают сцену;
- не копируй сцены, реплики и имена из известных фильмов; если тема ссылается на известную франшизу, сделай оригинальный сюжет с похожим жанровым напряжением, но без прямого плагиата;
- финал должен быть физическим кадром/действием, а не абстрактным выводом;
- без таймкодов, списков, номеров сцен и технических комментариев.`;

const RU_TRAILER_VO_WORDS_PER_SECOND = 1.85;
const DEFAULT_REUSED_NAMES = ["Лена", "Артём", "Илья", "Марина", "Сергей", "Геннадий", "Анна", "Рой"];

function wordTarget(durationSec = 90) {
  const duration = Math.max(30, Math.min(600, Number(durationSec) || 90));
  const target = Math.round(duration * RU_TRAILER_VO_WORDS_PER_SECOND);
  return {
    min: Math.max(40, Math.round(target * 0.88)),
    target,
    max: Math.round(target * 1.08),
  };
}

function countWords(text = "") {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function topicHasWord(topic = "", word = "") {
  return new RegExp(`(^|[^А-Яа-яЁёA-Za-z])${escapeRegExp(word)}([^А-Яа-яЁёA-Za-z]|$)`, "i").test(String(topic || ""));
}

function noHindLegsPremise(topic = "") {
  const text = String(topic || "").toLowerCase();
  return /(без|нет|лиш[её]н|лишилась|лишился|ампут|инвалид)/i.test(text)
    && /(задн\w*\s+лап|лап\w*)/i.test(text);
}

function buildNameRule(topic = "") {
  const blocked = DEFAULT_REUSED_NAMES.filter((name) => !topicHasWord(topic, name));
  if (!blocked.length) return "Имена из темы можно использовать, но не добавляй лишних имён без необходимости.";
  return `Если нужны имена, придумай свежие имена под эту историю. Не используй повторяющиеся имена из прошлых проектов: ${blocked.join(", ")}. Исключение: имя уже прямо есть в теме.`;
}

function buildPremiseLock(topic = "") {
  const base = [
    "Главное условие темы нельзя отменять финальным твистом.",
    "Не лечи, не восстанавливай, не подменяй и не переворачивай физическое состояние героя, если тема построена на этом состоянии.",
    "Хоррор-твист должен усиливать ситуацию через место, звук, отражение, предмет, след, дверь или невидимую угрозу, но не ломать исходную premise."
  ];

  if (noHindLegsPremise(topic)) {
    base.push(
      "Для темы с животным без задних лап: животное остаётся без задних лап от первого кадра до финала.",
      "Запрещено: у него появляются, отрастают, возвращаются, отражаются или намекаются задние лапы; нельзя показывать чужие задние лапы как финальный твист рядом с ним; нельзя превращать инвалидность в монстр-способность.",
      "Коляска/колёса остаются его способом движения. Финальный sting может быть через колёса, следы, звук, дверь, взгляд, ошейник, тень угрозы или камеру наблюдения, но не через новые лапы."
    );
  }

  return base.map((line) => `- ${line}`).join("\n");
}

function scriptGenerationChecks(text = "", topic = "", duration = 90) {
  const value = String(text || "");
  const words = wordTarget(duration);
  const wordCount = countWords(value);
  const hard = [];
  const soft = [];

  if (noHindLegsPremise(topic) && /(задн\w*\s+лап|нов\w*\s+лап|чуж\w*\s+лап|четыр[её]\s+лап|отраст\w*\s+лап|вернул\w*\s+лап|появ\w*\s+лап)/i.test(value)) {
    hard.push("нарушено условие темы: у героя без задних лап появились/намекнулись лапы");
  }

  const reusedNames = DEFAULT_REUSED_NAMES.filter((name) => !topicHasWord(topic, name) && topicHasWord(value, name));
  if (reusedNames.length) {
    soft.push(`повтор имён из прошлых проектов: ${reusedNames.join(", ")}`);
  }

  if (wordCount < words.min || wordCount > words.max) {
    soft.push(`объём ${wordCount} слов вне диапазона ${words.min}-${words.max}`);
  }

  return { hard, soft, wordCount };
}

function cleanModelText(value = "") {
  return String(value || "").replace(/^```[\s\S]*?\n?|\n?```$/g, "").trim();
}

function buildPrompt({ topic, duration, style, target, frameSeconds, frameCount }) {
  const words = wordTarget(duration);
  const voiceSeconds = Math.round(words.target / RU_TRAILER_VO_WORDS_PER_SECOND);
  return `Тема / название: ${topic}
Формат: трейлер / короткометражка, вертикальное видео
Целевая модель визуала: ${target || "grok"}
Стиль: ${style || "cinematic supernatural thriller"}
Длительность: ${duration || 90} секунд
Ориентир по кадрам: ${frameCount || "auto"}
Секунд на кадр: ${frameSeconds || 3}
Озвучка: русский трейлерный VO, примерно ${RU_TRAILER_VO_WORDS_PER_SECOND} слова/сек с короткими паузами.
Объём строго: ${words.min}-${words.max} слов, цель около ${words.target} слов. Это должно укладываться примерно в ${voiceSeconds} секунд озвучки.

Задача:
Напиши цельный сценарий без таймкодов. Он должен иметь:
1. сильный hook в первых 2-3 фразах;
2. понятное место действия;
3. устойчивых персонажей, если тема подразумевает людей;
4. нарастающую цепочку визуальных событий;
5. 1-3 короткие реплики, если это уместно;
6. финальный sting, который можно сразу превратить в последний кадр.

SOURCE PREMISE LOCK:
${buildPremiseLock(topic)}

ИМЕНА И НОВИЗНА:
- Генерируй историю только из текущей темы, не продолжай прошлые проекты и не используй кэш старых сценариев.
- ${buildNameRule(topic)}
- Если в теме нет имени, не используй имя из предыдущих тестов.

Контроль перед ответом:
- посчитай слова внутренне;
- если сценарий короче ${words.min} слов или длиннее ${words.max} слов, перепиши его до попадания в диапазон;
- проверь, что финал не противоречит теме и не отменяет главное физическое условие героя;
- проверь, что имена не взяты из прошлых проектов, если их нет в теме;
- не добавляй технический отчёт о подсчёте, верни только сценарий.

Верни только сам сценарий.`;
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  try {
    body = await req.json().catch(() => ({}));
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);

    const topic = String(body.topic || body.project_name || "").trim();
    if (topic.length < 3) return Response.json({ error: "Нужна тема или название проекта." }, { status: 400 });

    const duration = Number(body.duration || 90);
    const userMessage = buildPrompt({
      topic,
      duration,
      style: body.style,
      target: body.target,
      frameSeconds: body.frame_seconds,
      frameCount: body.frame_count,
    });

    const result = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperatureOverride: 0.52,
      maxTokensOverride: 2600,
      appTitle: "NeuroCine Trailer Script Writer",
      apiKeyOverride: accessGuard.apiKey,
    });

    if (!result.ok) {
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/trailer/script",
        success: false,
        modelUsed: result.model_used,
        error: result.error,
        durationMs: Date.now() - started,
        metadata: usageMeta(body, { duration }),
      });
      return Response.json({ error: result.error || "Генерация сценария не удалась", model_used: result.model_used }, { status: 500 });
    }

    let text = cleanModelText(result.content);
    let modelUsed = result.model_used;
    let checks = scriptGenerationChecks(text, topic, duration);

    if (checks.hard.length || checks.soft.length) {
      const retryResult = await callOpenRouter({
        taskType: TASK_TYPES.SCRIPT_WRITING,
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `${userMessage}

Предыдущий черновик нарушил контроль:
${[...checks.hard, ...checks.soft].map((item) => `- ${item}`).join("\n")}

Перепиши сценарий полностью. Не объясняй исправления. Верни только новый сценарий.

Плохой черновик:
${text.slice(0, 3000)}`,
        temperatureOverride: 0.38,
        maxTokensOverride: 2600,
        appTitle: "NeuroCine Trailer Script Writer",
        apiKeyOverride: accessGuard.apiKey,
      });

      if (retryResult.ok) {
        const retryText = cleanModelText(retryResult.content);
        const retryChecks = scriptGenerationChecks(retryText, topic, duration);
        if (retryChecks.hard.length < checks.hard.length || (!retryChecks.hard.length && retryChecks.soft.length <= checks.soft.length)) {
          text = retryText;
          modelUsed = retryResult.model_used || modelUsed;
          checks = retryChecks;
        }
      }
    }

    if (checks.hard.length) {
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/trailer/script",
        success: false,
        modelUsed,
        error: checks.hard.join("; "),
        durationMs: Date.now() - started,
        metadata: usageMeta(body, { duration, validation_hard: checks.hard, validation_soft: checks.soft }),
      });
      return Response.json({
        error: `AI нарушил premise темы: ${checks.hard.join("; ")}. Попробуй ещё раз или уточни тему.`,
        model_used: modelUsed,
        validation_warnings: checks.soft,
      }, { status: 502 });
    }

    const words = wordTarget(duration);
    const wordCount = countWords(text);
    const voiceSeconds = Math.round(wordCount / RU_TRAILER_VO_WORDS_PER_SECOND);
    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/trailer/script",
      success: true,
      modelUsed,
      durationMs: Date.now() - started,
      metadata: usageMeta(body, { duration, words: wordCount, target_words: words.target, voice_seconds: voiceSeconds, validation_warnings: checks.soft }),
    });

    return Response.json({
      ok: true,
      text,
      model_used: modelUsed,
      word_count: wordCount,
      word_target: words,
      estimated_voice_seconds: voiceSeconds,
      voice_words_per_second: RU_TRAILER_VO_WORDS_PER_SECOND,
      validation_warnings: checks.soft,
    });
  } catch (e) {
    return Response.json({ error: e.message || "Trailer script generation error" }, { status: 500 });
  }
}
