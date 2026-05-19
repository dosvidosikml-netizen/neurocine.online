// app/api/cartoon/script/route.js
// AI cartoon script route. No local text generation: paid API only.

import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";
import { CARTOON_SCRIPT_SYSTEM, normalizeCartoonProject, safeJsonParse } from "../../../../engine/cartoonEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wordTarget(durationSec = 60, lang = "ru") {
  const dur = Math.max(15, Math.min(600, Number(durationSec) || 60));
  const base = lang === "en" ? 2.35 : 2.15;
  const target = Math.round(dur * base);
  return {
    min: Math.max(35, Math.round(target * 0.86)),
    target,
    max: Math.round(target * 1.16),
  };
}

function apiError(message, status = 500, extra = {}) {
  return Response.json({
    ok: false,
    mode: "api_required",
    error: message || "Платный AI API недоступен. Локальная генерация отключена.",
    fallback_available: false,
    script: null,
    ...extra,
  }, { status });
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  try {
    body = await req.json();
    const project = normalizeCartoonProject(body || {});
    const target = wordTarget(project.project.duration_sec, project.project.language);

    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) {
      return apiError(guard.message || guard.error || guard.reason || "OpenRouter access closed", guard.status || 403, {
        accessDenied: true,
      });
    }

    const frameSecRaw = project.project.frame_duration_sec || 3;
    const frameSec = Math.max(2, Math.min(4, Number(frameSecRaw) || 3));
    const targetScenes = project.project.target_scene_count || Math.round(project.project.duration_sec / frameSec);

    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      requested_voice_style: project.script.voice_style,
      existing_script_hint: project.script.full_text || null,
      duration_sec: project.project.duration_sec,
      frame_duration_sec: frameSec,
      target_scene_count: targetScenes,
      target_voiceover_words: target,
      instruction: `STRICT RULES: 1) Write ONLY about the project title and theme. If title is empty use style="${project.project.style?.preset}" and mood="${project.project.style?.mood}" as the topic. Do NOT invent an unrelated story. 2) Write EXACTLY ${targetScenes} short sentences — one sentence per scene. 3) Each sentence = ${frameSec} seconds. Total = ${project.project.duration_sec}s. Use ${target.min}-${target.max} words total.`,
    }, null, 2);

    const r = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: CARTOON_SCRIPT_SYSTEM,
      userMessage,
      temperatureOverride: 0.55,
      maxTokensOverride: 4200,
      responseFormat: { type: "json_object" },
      apiKeyOverride: guard.apiKey,
      appTitle: "NeuroCine Cartoon Writer",
    });

    if (!r.ok) {
      await logUsageFromGuard(guard, {
        req,
        endpoint: "/api/cartoon/script",
        success: false,
        modelUsed: r.model_used,
        error: r.error,
        durationMs: Date.now() - started,
        metadata: usageMeta(body),
      });
      return apiError(r.error || "OpenRouter failed", 500, { model_used: r.model_used });
    }

    let parsed;
    try { parsed = safeJsonParse(r.content); }
    catch (e) {
      await logUsageFromGuard(guard, {
        req,
        endpoint: "/api/cartoon/script",
        success: false,
        modelUsed: r.model_used,
        error: "Invalid JSON: " + e.message,
        durationMs: Date.now() - started,
        metadata: usageMeta(body),
      });
      return apiError("Invalid AI JSON: " + e.message, 500, { model_used: r.model_used, raw: r.content?.slice(0, 700) });
    }

    await logUsageFromGuard(guard, {
      req,
      endpoint: "/api/cartoon/script",
      success: true,
      modelUsed: r.model_used,
      durationMs: Date.now() - started,
      metadata: usageMeta(body),
    });
    return Response.json({ ok: true, mode: "ai", model_used: r.model_used, script: parsed, target_voiceover_words: target });
  } catch (e) {
    return apiError(e.message || "Cartoon script failed", 500);
  }
}
