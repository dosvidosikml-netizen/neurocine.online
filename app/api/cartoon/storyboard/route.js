// app/api/cartoon/storyboard/route.js
// NeuroCine Cartoon Storyboard API v2 — uses cartoonEngine v2 (AutoChain-aware).

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

    const timing = project.project.timing || {
      duration_sec: project.project.duration_sec,
      frame_duration_sec: project.project.frame_duration_sec || 3,
      target_scene_count: project.project.target_scene_count || Math.round(project.project.duration_sec / 3),
    };

    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      script: project.script,
      settings: project.settings,
      timing: {
        ...timing,
        rule: "STRICT: Total scenes MUST equal target_scene_count. Each scene duration_sec MUST be 2, 3 or 4. Sum of durations should equal duration_sec. Do NOT return 9 scenes for 60 seconds.",
      },
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
    let scenes = Array.isArray(storyboard.scenes) ? storyboard.scenes : base.storyboard.scenes;
    const targetCount = Math.max(1, Number(project.project.target_scene_count) || scenes.length || 1);
    const validFrameDur = (n) => Math.max(2, Math.min(4, Number(n) || project.project.frame_duration_sec || 3));

    scenes = scenes.map((sc) => ({ ...sc, duration_sec: validFrameDur(sc.duration_sec) }));

    if (scenes.length < targetCount) {
      const localScenes = base.storyboard.scenes || [];
      while (scenes.length < targetCount) {
        const idx = scenes.length % Math.max(1, localScenes.length);
        scenes.push({ ...(localScenes[idx] || scenes[scenes.length - 1] || {}), id: `scene_${String(scenes.length + 1).padStart(2, "0")}`, index: scenes.length + 1 });
      }
    }

    if (scenes.length > targetCount) scenes = scenes.slice(0, targetCount);

    scenes = scenes.map((sc, index) => ({
      ...sc,
      id: sc.id || `scene_${String(index + 1).padStart(2, "0")}`,
      index: index + 1,
      duration_sec: validFrameDur(sc.duration_sec),
    }));

    const totalDurationSec = scenes.reduce((sum, sc) => sum + Number(sc.duration_sec || 0), 0);
    const finalProject = {
      ...base,
      storyboard: {
        total_scenes: scenes.length,
        target_scene_count: targetCount,
        total_duration_sec: totalDurationSec,
        part_size: project.project?.chain?.partSize || body.partSize || body.chain?.partSize || 4,
        scenes,
      },
      generation: { ...base.generation, model_storyboard: r.model_used, engine: "cartoonEngine.ai.v2" },
    };

    await logUsageFromGuard(guard, { req, endpoint: "/api/cartoon/storyboard", success: true, modelUsed: r.model_used, durationMs: Date.now() - started, metadata: usageMeta(body, { scenes: finalProject.storyboard.total_scenes }) });
    return Response.json({ ok: true, mode: "ai", model_used: r.model_used, project: finalProject });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Cartoon storyboard failed" }, { status: 500 });
  }
}
