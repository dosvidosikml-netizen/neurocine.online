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

function wordTarget(durationSec = 90) {
  const duration = Math.max(30, Math.min(600, Number(durationSec) || 90));
  const target = Math.round(duration * 1.65);
  return {
    min: Math.max(70, Math.round(target * 0.78)),
    target,
    max: Math.round(target * 1.18),
  };
}

function buildPrompt({ topic, duration, style, target, frameSeconds, frameCount }) {
  const words = wordTarget(duration);
  return `Тема / название: ${topic}
Формат: трейлер / короткометражка, вертикальное видео
Целевая модель визуала: ${target || "grok"}
Стиль: ${style || "cinematic supernatural thriller"}
Длительность: ${duration || 90} секунд
Ориентир по кадрам: ${frameCount || "auto"}
Секунд на кадр: ${frameSeconds || 3}
Объём: ${words.min}-${words.max} слов, цель около ${words.target}.

Задача:
Напиши цельный сценарий без таймкодов. Он должен иметь:
1. сильный hook в первых 2-3 фразах;
2. понятное место действия;
3. устойчивых персонажей, если тема подразумевает людей;
4. нарастающую цепочку визуальных событий;
5. 1-3 короткие реплики, если это уместно;
6. финальный sting, который можно сразу превратить в последний кадр.

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

    const text = String(result.content || "").replace(/^```[\s\S]*?\n?|\n?```$/g, "").trim();
    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/trailer/script",
      success: true,
      modelUsed: result.model_used,
      durationMs: Date.now() - started,
      metadata: usageMeta(body, { duration, words: text.split(/\s+/).filter(Boolean).length }),
    });

    return Response.json({ ok: true, text, model_used: result.model_used });
  } catch (e) {
    return Response.json({ error: e.message || "Trailer script generation error" }, { status: 500 });
  }
}
