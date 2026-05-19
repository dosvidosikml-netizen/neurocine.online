// app/api/cartoon/script/route.js
// AI cartoon script route. Paid API is never silently replaced by local text.

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

function localScriptFallback(project) {
  const lang = project.project.language || "ru";
  const title = project.project.title || "Untitled Cartoon";
  const dur = Number(project.project.duration_sec || 60);
  const target = wordTarget(dur, lang);
  const text = lang === "en"
    ? `One ordinary day, ${title} began with a strange glowing sign. The main hero noticed it near the place where everything usually felt safe. The sign pulsed softly, as if it was calling for help. The hero followed it and stepped into a world where toys moved, shadows whispered, and tiny lights showed the way. At first the hero was afraid and wanted to run back home. Then a small creature appeared and explained that the light was fading. Without that light, the whole cartoon world would become silent. The hero chose kindness instead of fear. Step by step, the hero helped the creatures gather courage, repair the broken glow, and believe in each other again. In the end, the sign shone brighter than before, and the hero returned home with a new spark inside.`
    : `Однажды история «${title}» началась со странного светящегося знака. Главный герой заметил его там, где обычно всё было тихо и безопасно. Знак мягко пульсировал, будто звал на помощь. Герой пошёл за светом и оказался в мире, где игрушки двигались, тени шептали, а маленькие огоньки показывали дорогу. Сначала герой испугался и хотел вернуться домой. Но рядом появилось маленькое существо и объяснило, что волшебный свет почти погас. Если он исчезнет, весь мультяшный мир станет пустым и немым. Герой выбрал доброту вместо страха. Шаг за шагом он помог жителям собрать смелость, починить сломанное сияние и снова поверить друг в друга. В финале знак загорелся ярче прежнего, а герой вернулся домой с новой искрой внутри.`;
  return {
    title,
    logline: lang === "en" ? "A small hero follows a mysterious sign and restores light through kindness." : "Маленький герой идёт за загадочным знаком и возвращает свет силой доброты.",
    voice_style: project.script.voice_style || "neutral",
    full_text: text,
    beats: text.split(/(?<=[.!?…])\s+/).filter(Boolean),
    visual_dna: `Voiceover target for ${dur}s: ${target.min}-${target.max} words. Keep a clean, expressive cartoon style and stable hero identity across every scene.`,
  };
}

function localOk(project, reason = "local_requested") {
  return Response.json({
    ok: true,
    mode: "local",
    model_used: reason,
    warning: reason,
    script: localScriptFallback(project),
  });
}

function apiError(project, message, status = 500, extra = {}) {
  return Response.json({
    ok: false,
    mode: "api_error",
    error: message || "Cartoon script API failed",
    fallback_available: true,
    fallback: localScriptFallback(project),
    ...extra,
  }, { status });
}

export async function POST(req) {
  const started = Date.now();
  let body = {};
  let project = null;
  try {
    body = await req.json();
    project = normalizeCartoonProject(body || {});
    const mode = String(body.mode || "ai").toLowerCase();
    const target = wordTarget(project.project.duration_sec, project.project.language);

    if (mode === "local") {
      return localOk(project, "local_requested");
    }

    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) {
      return apiError(project, guard.message || guard.error || guard.reason || "OpenRouter access closed", guard.status || 403, {
        accessDenied: true,
      });
    }

    const userMessage = JSON.stringify({
      project: project.project,
      characters: project.characters,
      requested_voice_style: project.script.voice_style,
      existing_script_hint: project.script.full_text || null,
      duration_sec: project.project.duration_sec,
      target_voiceover_words: target,
      instruction: `Generate a complete cartoon voiceover script for exactly about ${project.project.duration_sec}s. Use ${target.min}-${target.max} words, target ${target.target}. Do not write a short placeholder.`,
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
      return apiError(project, r.error || "OpenRouter failed", 500, { model_used: r.model_used });
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
      return apiError(project, "Invalid AI JSON: " + e.message, 500, { model_used: r.model_used, raw: r.content?.slice(0, 700) });
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
    const fallbackProject = project || normalizeCartoonProject(body || {});
    return apiError(fallbackProject, e.message || "Cartoon script failed", 500);
  }
}
