// app/api/seo-pack/route.js
// NeuroCine SEO Director V2 — platform-aware titles, descriptions and hashtags.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";
import { buildScenarioContext } from "../../../lib/scenarioContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYS = `You are NeuroCine SEO Director V2 for YouTube Shorts / TikTok / Reels.
Output ONLY valid JSON. No markdown.
Language: Russian.

Create 4 variants, not generic SEO:
1) shock — direct impact / number / scale
2) intrigue — mystery question / curiosity gap
3) search — keyword-friendly, discoverable
4) controversial — debate trigger, but not misinformation stated as fact

Rules:
- Titles must be short, punchy, mobile-readable.
- Avoid #fyp #viral #foryou.
- Descriptions 100-180 chars.
- Hashtags: 6-10 specific tags, mix broad + niche.
- Include platform_note_ru for how to use it.

JSON:
{
  "seo_variants": [
    { "type":"shock", "title":"...", "desc":"...", "tags":["#..."], "platform_note_ru":"..." },
    { "type":"intrigue", "title":"...", "desc":"...", "tags":["#..."], "platform_note_ru":"..." },
    { "type":"search", "title":"...", "desc":"...", "tags":["#..."], "platform_note_ru":"..." },
    { "type":"controversial", "title":"...", "desc":"...", "tags":["#..."], "platform_note_ru":"..." }
  ]
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);
    const topic = String(body.topic || "").trim();
    const script = String(body.script || "").trim();
    const genre = String(body.genre || "").trim();
    const platform = String(body.platform || "youtube_shorts").trim();
    const storyboard = body.storyboard || null;
    const styleProfile = body.styleProfile || body.style_profile || null;
    const scenarioCtx = buildScenarioContext({ topic, script, genre, storyboard, styleProfile });
    if (!topic && !script) return Response.json({ error: "Нужна тема или сценарий" }, { status: 400 });

    const userMsg = `Платформа: ${platform}\n${scenarioCtx.contextBlock}\n\nСценарий:\n${script.slice(0, 6000) || "(не задан)"}\n\nСгенерируй 4 SEO варианта под выбранную платформу, в тон выбранного стиля и хука.`;

    const r = await callOpenRouter({
      taskType: TASK_TYPES.LIGHT_TASK,
      systemPrompt: SYS,
      userMessage: userMsg,
      maxTokensOverride: 3200,
      responseFormat: { type: "json_object" },
      apiKeyOverride: accessGuard.apiKey,
      appTitle: "NeuroCine SEO Director V2",
    });
    if (!r.ok) {
      await logUsageFromGuard(accessGuard, { req, endpoint: "/api/seo-pack", success: false, modelUsed: r.model_used, error: r.error, metadata: usageMeta(body) });
      return Response.json({ error: r.error }, { status: 500 });
    }

    let parsed;
    try {
      const c = String(r.content || "").trim().replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
      parsed = JSON.parse(c);
    } catch (e) { return Response.json({ error: "Невалидный JSON: " + e.message, raw: r.content?.slice(0,500) }, { status: 500 }); }

    await logUsageFromGuard(accessGuard, { req, endpoint: "/api/seo-pack", success: true, modelUsed: r.model_used, metadata: usageMeta(body, { platform }) });
    return Response.json({ ...parsed, model_used: r.model_used });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
