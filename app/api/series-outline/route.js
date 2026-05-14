// app/api/series-outline/route.js
// NeuroCine Series Outline API v1
// Creates editable episode plans for short AI series.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Series Showrunner.
Create a tight episode outline for a short AI video series.
Return ONLY valid JSON. No markdown. No prose.

Rules:
- Do not write full scripts unless asked.
- Make every episode distinct and sequential.
- Each episode needs a strong hook, conflict beat, visual promise, and cliffhanger.
- Keep it suitable for vertical short cinema / mini-series production.
- Use Russian for user-facing episode fields.
- Keep production notes concise and practical.
`;

function safeJsonFromText(text = "") {
  const raw = String(text || "").trim();
  try { return JSON.parse(raw); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function clampCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(20, Math.round(n)));
}

function normalizeEpisodes(data, input) {
  const count = clampCount(input.episodeCount);
  const raw = Array.isArray(data?.episodes) ? data.episodes : [];
  const episodes = raw.slice(0, count).map((ep, i) => ({
    id: ep.id || `ep_${String(i + 1).padStart(2, "0")}`,
    title: String(ep.title || `Серия ${i + 1}`).trim(),
    hook: String(ep.hook || "").trim(),
    beat: String(ep.beat || ep.summary || "").trim(),
    conflict: String(ep.conflict || "").trim(),
    visual_promise: String(ep.visual_promise || "").trim(),
    cliffhanger: String(ep.cliffhanger || "").trim(),
    characters_present: Array.isArray(ep.characters_present) ? ep.characters_present.map(String) : [],
    storyboard_seed_ru: String(ep.storyboard_seed_ru || ep.beat || ep.summary || "").trim(),
  }));

  while (episodes.length < count) {
    const i = episodes.length;
    episodes.push({
      id: `ep_${String(i + 1).padStart(2, "0")}`,
      title: `Серия ${i + 1}`,
      hook: "Сильный хук серии",
      beat: "Ключевое событие серии",
      conflict: "Конфликт серии",
      visual_promise: "Главный визуальный образ серии",
      cliffhanger: "Крючок в конце серии",
      characters_present: [],
      storyboard_seed_ru: "Краткое описание серии для storyboard",
    });
  }

  return {
    version: data?.version || "1.0",
    series_title: data?.series_title || input.title || "Новый сериал",
    season_logline: data?.season_logline || input.logline || "",
    episodes,
  };
}

function buildPrompt({ title, genre, format, logline, world, cast, episodeCount }) {
  const castText = Array.isArray(cast) && cast.length
    ? cast.map((c) => `${c.ui_label_ru || c.name}: ${c.role || "роль не указана"}`).join("\n")
    : "Герои ещё не заданы. Создай план, который можно будет связать с героями позже.";

  return `
Create an episode outline for a NeuroCine mini-series.

Title: ${title || "Новый сериал"}
Genre / tone: ${genre || "cinematic documentary thriller"}
Format: ${format || "диктор"}
Episode count: ${episodeCount}

Series idea:
${logline || ""}

World / locations:
${world || ""}

Cast:
${castText}

Return JSON exactly:
{
  "version": "1.0",
  "series_title": "...",
  "season_logline": "...",
  "episodes": [
    {
      "id": "ep_01",
      "title": "Серия 1 — ...",
      "hook": "короткий хук",
      "beat": "главное событие серии",
      "conflict": "конфликт серии",
      "visual_promise": "главный визуальный образ",
      "cliffhanger": "концовка-крючок",
      "characters_present": ["имя героя"],
      "storyboard_seed_ru": "готовое краткое ТЗ для storyboard этой серии"
    }
  ]
}

Rules:
- Exactly ${episodeCount} episodes.
- Russian episode text.
- Each episode must escalate the previous one.
- Avoid generic filler.
- Keep each field concise.
`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);

    const episodeCount = clampCount(body.episodeCount);
    const title = String(body.title || "Новый сериал").trim();
    const logline = String(body.logline || "").trim();
    const genre = String(body.genre || "cinematic documentary thriller").trim();
    const format = String(body.format || "диктор").trim();
    const world = String(body.world || "").trim();
    const cast = Array.isArray(body.cast) ? body.cast : [];

    if (!logline && !title) {
      return Response.json({ error: "Нужна идея сериала" }, { status: 400 });
    }

    const result = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildPrompt({ title, genre, format, logline, world, cast, episodeCount }),
      maxTokensOverride: 3600,
      temperatureOverride: 0.35,
      appTitle: "NeuroCine Series Outline",
      apiKeyOverride: accessGuard.apiKey,
    });

    if (!result.ok) {
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/series-outline",
        success: false,
        modelUsed: result.model_used,
        error: result.error,
        metadata: usageMeta(body, { episodeCount, genre, format }),
      });
      return Response.json({ error: result.error || "Series outline failed", model_used: result.model_used }, { status: 502 });
    }

    const parsed = safeJsonFromText(result.content);
    const outline = normalizeEpisodes(parsed, { title, logline, episodeCount });

    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/series-outline",
      success: true,
      modelUsed: result.model_used,
      metadata: usageMeta(body, { episodeCount, genre, format }),
    });

    return Response.json({ outline, model_used: result.model_used });
  } catch (e) {
    return Response.json({ error: e.message || "Series outline error" }, { status: 500 });
  }
}
