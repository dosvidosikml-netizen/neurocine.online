// app/api/script-polish/route.js
import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { validateScript } from "../../../lib/scriptValidator";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты сценарист коротких документальных видео. Верни только готовый текст диктора без markdown. Делай текст сильным, конкретным, с хорошим ритмом, без сухих списков через запятую.`;

function buildPolishPrompt({ script, topic, tone, duration, validation, mode }) {
  const isImprove = mode === "improve";
  const issues = (validation?.issues || []).map((x, i) => `${i + 1}. ${x}`).join("\n") || "Нет явных ошибок.";
  const score = validation?.score ?? "unknown";
  return `Тема: ${topic || "не указана"}\nТон: ${tone || "cinematic documentary thriller"}\nДлительность: ${duration || 60} секунд\nТекущий score: ${score}/100\nРежим: ${mode}\n\nОшибки валидатора:\n${issues}\n\nТекущий сценарий:\n${script}\n\nЗадача: ${isImprove ? "усиль драматургию, ритм и визуальные образы" : "минимально исправь ошибки валидатора до 100/100"}. Сохрани смысл и тему. Верни только новый текст диктора.`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);

    const script = String(body.script || "").trim();
    const topic = String(body.topic || "").trim();
    const tone = String(body.tone || "cinematic documentary thriller").trim();
    const duration = Number(body.duration || 60);
    const mode = String(body.mode || "polish") === "improve" ? "improve" : "polish";

    if (!script) return Response.json({ error: "Нужен сценарий для усиления" }, { status: 400 });

    const currentValidation = validateScript(script);
    const maxTokens = Math.max(2000, Math.ceil(script.split(/\s+/).length * 2.8));
    const result = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildPolishPrompt({ script, topic, tone, duration, validation: currentValidation, mode }),
      maxTokensOverride: maxTokens,
      temperatureOverride: mode === "improve" ? 0.55 : 0.32,
      appTitle: mode === "improve" ? "NeuroCine Script Improver" : "NeuroCine Script Polish",
      apiKeyOverride: accessGuard.apiKey,
    });

    if (!result.ok) {
      await logUsageFromGuard(accessGuard, { req, endpoint: "/api/script-polish", success: false, modelUsed: result.model_used, error: result.error, metadata: usageMeta(body, { mode, duration, tone }) });
      return Response.json({ text: script, validation: currentValidation, warning: result.error });
    }

    const text = result.content || script;
    const validation = validateScript(text);
    await logUsageFromGuard(accessGuard, { req, endpoint: "/api/script-polish", success: true, modelUsed: result.model_used, metadata: usageMeta(body, { mode, duration, tone, validation_score: validation?.score }) });
    return Response.json({ text, validation, mode, model_used: result.model_used });
  } catch (e) {
    return Response.json({ error: e.message || "Script polish error" }, { status: 500 });
  }
}
