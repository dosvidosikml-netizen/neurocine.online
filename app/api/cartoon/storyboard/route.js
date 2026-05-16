// app/api/cartoon/storyboard/route.js
// AI cartoon storyboard route with local fallback and protected API access.

import { callOpenRouter, TASK_TYPES } from "../../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../../lib/usageLogger";
import {
  buildCartoonExport,
  buildLocalStoryboard,
  buildCartoonContinuityContract,
  CARTOON_STORYBOARD_SYSTEM,
  normalizeCartoonProject,
  safeJsonParse,
} from "../../../../engine/cartoonEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const started = Date.now();
  let body = {};
  try {
    body = await req.json();
    const mode = String(body.mode || "ai").toLowerCase();

    if (mode === "local") {
      return Response.json({ ok: true, mode: "local", project: buildCartoonExport(body) });
    }

    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const project = normalizeCartoonProject(body || {});
    if (!project.script.full_text.trim()) {
      return Response.json({ ok: false, error: "Нужен сценарий для раскадровки." }, { status: 400 });
    }

    const local = buildLocalStoryboard(project);
    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      script: project.script,
      continuity_contract: buildCartoonContinuityContract(project),
      local_draft: local.storyboard,
    }, null, 2).slice(0, 24000);

    const r = await callOpenRouter({
      taskType: TASK_TYPES.STORYBOARD_GENERATION,
      systemPrompt: CARTOON_STORYBOARD_SYSTEM,
      userMessage,
      temperatureOverride: 0.28,
      maxTokensOverride: 12000,
      responseFormat: { type: "json_object" },
      apiKeyOverride: guard.apiKey,
      appTitle: "NeuroCine Cartoon Storyboard",
    });

    if (!r.ok) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/storyboard", success: false, modelUsed: r.model_used, error: r.error, durationMs: Date.now() - started, metadata: usageMeta(body) });
      return Response.json({ ok: false, error: r.error, fallback: buildCartoonExport(body) }, { status: 500 });
    }

    let parsed;
    try { parsed = safeJsonParse(r.content); }
    catch (e) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/storyboard", success: false, modelUsed: r.model_used, error: "Invalid JSON: " + e.message, durationMs: Date.now() - started, metadata: usageMeta(body) });
      return Response.json({ ok: false, error: "Невалидный JSON storyboard: " + e.message, raw: r.content?.slice(0, 800), fallback: buildCartoonExport(body) }, { status: 500 });
    }

    const base = buildCartoonExport(body);
    const storyboard = parsed.storyboard || parsed;
    const scenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : base.storyboard.scenes;
    const finalProject = {
      ...base,
      storyboard: {
        total_scenes: Number(storyboard.total_scenes || scenes.length),
        total_duration_sec: Number(storyboard.total_duration_sec || scenes.reduce((sum, sc) => sum + Number(sc.duration_sec || 0), 0)),
        scenes,
      },
      generation: { ...base.generation, model_storyboard: r.model_used, engine: "cartoonEngine.ai" },
    };

    await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/storyboard", success: true, modelUsed: r.model_used, durationMs: Date.now() - started, metadata: usageMeta(body, { scenes: finalProject.storyboard.total_scenes }) });
    return Response.json({ ok: true, mode: "ai", model_used: r.model_used, project: finalProject });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Cartoon storyboard failed" }, { status: 500 });
  }
}
