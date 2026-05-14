// app/api/series-outline/route.js
// NeuroCine Series Outline API v2
// Uses unified tier policy: ADMIN/DIRECTOR platform key, PRO user key, FREE local fallback only.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { resolveGenerationAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Series Showrunner, working inside the same NeuroCine Director logic as the main storyboard engine.
Create a tight episode outline for a short AI video series.
Return ONLY valid JSON. No markdown. No prose.

Core logic:
- Script-first reasoning: hook → build → climax → cliffhanger.
- One focus per episode.
- Character continuity matters: keep cast identities consistent across episodes.
- Every abstract idea must become a concrete visual promise.
- Use Russian for user-facing episode fields.
- Keep production notes concise and practical for storyboard generation.
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
    episodes.push(localEpisode(input, i));
  }

  return {
    version: data?.version || "2.0",
    series_title: data?.series_title || input.title || "Новый сериал",
    season_logline: data?.season_logline || input.logline || "",
    episodes,
  };
}

function localEpisode(input, i) {
  const n = i + 1;
  const last = n === clampCount(input.episodeCount);
  const cast = Array.isArray(input.cast) ? input.cast : [];
  const mainCast = cast.slice(0, 3).map((c) => c.ui_label_ru || c.name).filter(Boolean);
  const idea = String(input.logline || input.title || "история").trim();
  const world = String(input.world || "мир истории").trim();
  const phase = n === 1 ? "хук и завязка" : last ? "кульминация сезона" : `эскалация ${n}`;

  return {
    id: `ep_${String(n).padStart(2, "0")}`,
    title: `Серия ${n} — ${n === 1 ? "Первый крючок" : last ? "Развязка с новым вопросом" : "Новый поворот"}`,
    hook: n === 1 ? `Зритель сразу видит странный визуальный знак: ${idea.slice(0, 120)}` : `После прошлого события появляется новая угроза в мире: ${world.slice(0, 120)}`,
    beat: `${phase}: герой сталкивается с конкретным физическим доказательством конфликта, а не с абстрактным объяснением.`,
    conflict: last ? "Главный конфликт сезона выходит на поверхность, но финал оставляет новый вопрос." : "Герой получает ответ, который только ухудшает ситуацию.",
    visual_promise: n === 1 ? "крупный детальный хук, тревожная локация, один сильный предмет в кадре" : "видимый след предыдущей серии, новая локация, нарастающее давление камеры",
    cliffhanger: last ? "Финальный кадр закрывает одну тайну и открывает следующую." : "В последнем кадре появляется деталь, которая меняет смысл серии.",
    characters_present: mainCast,
    storyboard_seed_ru: `Серия ${n}. ${idea}. Фаза: ${phase}. Мир: ${world}. Сделать 9:16 vertical storyboard с одним главным фокусом, RAW documentary realism, без размытия персонажей и без смены внешности героев.`,
  };
}

function buildLocalOutline(input) {
  const episodeCount = clampCount(input.episodeCount);
  return normalizeEpisodes({
    version: "2.0-local-free",
    series_title: input.title || "Новый сериал",
    season_logline: input.logline || "",
    episodes: Array.from({ length: episodeCount }, (_, i) => localEpisode(input, i)),
  }, input);
}

function buildPrompt({ title, genre, format, logline, world, cast, episodeCount }) {
  const castText = Array.isArray(cast) && cast.length
    ? cast.map((c) => `${c.ui_label_ru || c.name}: ${c.role || "роль не указана"}; DNA: ${c.face_lock_en || ""} ${c.clothing_lock_en || ""}`).join("\n")
    : "Герои ещё не заданы. Создай план, который можно будет связать с героями позже.";

  return `
Create an episode outline for a NeuroCine mini-series using the same reasoning as the main storyboard brain.

Title: ${title || "Новый сериал"}
Genre / tone: ${genre || "cinematic documentary thriller"}
Format: ${format || "диктор"}
Episode count: ${episodeCount}

Series idea:
${logline || ""}

World / locations:
${world || ""}

Cast / character DNA:
${castText}

Return JSON exactly:
{
  "version": "2.0",
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
- Each episode escalates the previous one.
- Do not make generic filler.
- Keep each field concise.
- Preserve character continuity from Cast / character DNA.
`;
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
    const accessGuard = await resolveGenerationAccess(req, { provider: "openrouter", allowFreeFallback: true });
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

    if (!accessGuard.live) {
      const outline = buildLocalOutline({ title, logline, genre, format, world, cast, episodeCount });
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/series-outline",
        success: true,
        modelUsed: "local_series_outline_free",
        metadata: usageMeta(body, { episodeCount, genre, format, tier: accessGuard.tier, apiSource: accessGuard.source }),
      });
      return Response.json({ outline, mode: "free_local_fallback", api_source: accessGuard.source });
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
        metadata: usageMeta(body, { episodeCount, genre, format, tier: accessGuard.tier, apiSource: accessGuard.source }),
      });
      return Response.json({ error: result.error || "Series outline failed", model_used: result.model_used }, { status: 502 });
    }

    const parsed = safeJsonFromText(result.content);
    const outline = normalizeEpisodes(parsed, { title, logline, episodeCount, genre, format, world, cast });

    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/series-outline",
      success: true,
      modelUsed: result.model_used,
      metadata: usageMeta(body, { episodeCount, genre, format, tier: accessGuard.tier, apiSource: accessGuard.source }),
    });

    return Response.json({ outline, model_used: result.model_used, mode: "live", api_source: accessGuard.source });
  } catch (e) {
    return Response.json({ error: e.message || "Series outline error" }, { status: 500 });
  }
}
