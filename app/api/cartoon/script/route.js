// app/api/cartoon/script/route.js
// AI cartoon script route protected by account/API access.

import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";
import { CARTOON_SCRIPT_SYSTEM, normalizeCartoonProject, safeJsonParse } from "../../../../engine/cartoonEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function localScriptFallback(project) {
  const lang = project.project.language || "ru";
  const title = project.project.title || "Untitled Cartoon";
  const text = lang === "en"
    ? `One ordinary day, ${title} began with a strange glowing sign. The hero followed it into a place that should not exist. A tiny problem became a huge adventure. Fear almost won, but kindness changed the rules. In the end, the hero returned home carrying a new light inside.`
    : `Однажды история «${title}» началась со странного светящегося знака. Герой пошёл за ним туда, где невозможное стало настоящим. Маленькая проблема быстро превратилась в большое приключение. Страх почти победил, но доброта изменила правила. В финале герой вернулся домой с новым светом внутри.`;
  return {
    title,
    logline: lang === "en" ? "A small hero follows a mysterious sign and changes the world with kindness." : "Маленький герой идёт за загадочным знаком и меняет мир добротой.",
    voice_style: project.script.voice_style || "neutral",
    full_text: text,
    beats: text.split(/(?<=[.!?…])\s+/).filter(Boolean),
    visual_dna: "Keep a clean, expressive cartoon style and stable hero identity across every scene.",
  };
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  try {
    body = await req.json();
    const project = normalizeCartoonProject(body || {});
    const mode = String(body.mode || "ai").toLowerCase();

    if (mode === "local") {
      return Response.json({ ok: true, mode: "local", script: localScriptFallback(project) });
    }

    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      requested_voice_style: project.script.voice_style,
      existing_script_hint: project.script.full_text || null,
      instruction: "Generate a complete short cartoon voiceover script for this project.",
    }, null, 2);

    const r = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: CARTOON_SCRIPT_SYSTEM,
      userMessage,
      temperatureOverride: 0.48,
      maxTokensOverride: 3200,
      responseFormat: { type: "json_object" },
      apiKeyOverride: guard.apiKey,
      appTitle: "NeuroCine Cartoon Writer",
    });

    if (!r.ok) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/script", success: false, modelUsed: r.model_used, error: r.error, durationMs: Date.now() - started, metadata: usageMeta(body) });
      return Response.json({ ok: false, error: r.error, fallback: localScriptFallback(project) }, { status: 500 });
    }

    let parsed;
    try { parsed = safeJsonParse(r.content); }
    catch (e) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/script", success: false, modelUsed: r.model_used, error: "Invalid JSON: " + e.message, durationMs: Date.now() - started, metadata: usageMeta(body) });
      return Response.json({ ok: false, error: "Невалидный JSON сценария: " + e.message, raw: r.content?.slice(0, 800), fallback: localScriptFallback(project) }, { status: 500 });
    }

    await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/script", success: true, modelUsed: r.model_used, durationMs: Date.now() - started, metadata: usageMeta(body) });
    return Response.json({ ok: true, mode: "ai", model_used: r.model_used, script: parsed });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Cartoon script failed" }, { status: 500 });
  }
}
