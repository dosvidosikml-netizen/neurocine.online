// app/api/cartoon/script/route.js
// AI cartoon script route.
// FIX: guard.ok=false → 403 error (not silent fallback).
// FIX: localScriptFallback now generates a themed outline from the actual title.

import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";
import { CARTOON_SCRIPT_SYSTEM, normalizeCartoonProject, safeJsonParse } from "../../../../engine/cartoonEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Builds a minimal but THEMED script from the actual title — used only when AI is unavailable
function localScriptFallback(project) {
  const lang  = project.project.language || "ru";
  const title = (project.project.title || "").trim() || (lang === "en" ? "Untitled Cartoon" : "Без названия");

  // Build beats from title words to make it at least vaguely themed
  const isRu = lang !== "en";
  const text  = isRu
    ? `В мире, где всё только начинается, разворачивается история: «${title}». Главный герой сталкивается с неожиданной угрозой, которая меняет всё вокруг. Силы противников нарастают, а времени остаётся всё меньше. В решающий момент герой находит неожиданный выход. Мир никогда не будет прежним — и это только начало.`
    : `In a world where everything is just beginning, the story of "${title}" unfolds. The main hero faces an unexpected threat that changes everything around them. Enemy forces grow stronger as time runs out. In the decisive moment, the hero finds an unexpected solution. The world will never be the same — and this is only the beginning.`;

  return {
    title,
    logline: isRu
      ? `История о том, как «${title}» изменило всё.`
      : `The story of how "${title}" changed everything.`,
    voice_style: project.script.voice_style || "neutral",
    full_text: text,
    beats: text.split(/(?<=[.!?…])\s+/).filter(Boolean),
    visual_dna: "Keep a clean, expressive cartoon style and stable hero identity across every scene.",
  };
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  let project = null;
  try {
    body    = await req.json();
    project = normalizeCartoonProject(body || {});
    const mode = String(body.mode || "ai").toLowerCase();

    // Explicit local mode request
    if (mode === "local") {
      return Response.json({ ok: true, mode: "local", model_used: "local_requested", script: localScriptFallback(project) });
    }

    // Auth / API key check — return 403 so client shows error, not silent fallback
    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) {
      return Response.json(
        { ok: false, error: guard.error || guard.reason || "AI закрыт — подключи API ключ в настройках" },
        { status: 403 }
      );
    }

    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      requested_voice_style: project.script.voice_style,
      existing_script_hint: project.script.full_text || null,
      instruction: "Generate a complete short cartoon voiceover script for this project. Use the project title and theme as the core topic — do not invent an unrelated story.",
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
      // AI tried but failed — return error so client shows message
      return Response.json({ ok: false, error: r.error || "AI не ответил — попробуй ещё раз" }, { status: 500 });
    }

    let parsed;
    try { parsed = safeJsonParse(r.content); }
    catch (e) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/script", success: false, modelUsed: r.model_used, error: "Invalid JSON: " + e.message, durationMs: Date.now() - started, metadata: usageMeta(body) });
      return Response.json({ ok: false, error: "AI вернул невалидный JSON — попробуй ещё раз" }, { status: 500 });
    }

    await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/script", success: true, modelUsed: r.model_used, durationMs: Date.now() - started, metadata: usageMeta(body) });
    return Response.json({ ok: true, mode: "ai", model_used: r.model_used, script: parsed });

  } catch (e) {
    const fallbackProject = project || normalizeCartoonProject(body || {});
    return Response.json({ ok: false, error: e.message || "Cartoon script failed" }, { status: 500 });
  }
}
