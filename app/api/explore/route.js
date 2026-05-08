import { buildExplorePrompt, getStyleProfile } from "../../../engine/directorEngine_v4";
import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Director Engine.
Output ONLY valid JSON. No markdown.
Your job: create a strict 2x2 variation-grid image prompt for one selected storyboard frame.
Rules:
- Do not change the story event.
- Do not change character identity, wardrobe, location, time, emotion, chronology or genre.
- Only vary camera angle, lens feeling, framing, composition, camera distance and depth of field.
- Output JSON: { "prompt": "...", "notes_ru": "..." }
`;

async function askOpenRouter({ frame, storyboard, styleProfile, variantCount, apiKeyOverride }) {
  const seedPrompt = buildExplorePrompt(frame, storyboard, styleProfile, variantCount);

  const result = await callOpenRouter({
    taskType: TASK_TYPES.LIGHT_TASK,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `Improve this prompt without changing its rules. Return JSON only.

${seedPrompt}`,
    temperatureOverride: 0.2,
    maxTokensOverride: 3000,
    responseFormat: { type: "json_object" },
    appTitle: "NeuroCine Director Studio",
    apiKeyOverride,
  });

  if (!result.ok || !result.content) return null;
  const parsed = JSON.parse(result.content);
  return { ...parsed, _model_used: result.model_used };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);
    const frame = body.frame || {};
    const storyboard = body.storyboard || {};
    const styleProfile = body.styleProfile || getStyleProfile(body.projectType, body.stylePreset);
    const variantCount = Number(body.variantCount || 4);

    let api = null;
    try {
      api = await askOpenRouter({ frame, storyboard, styleProfile, variantCount, apiKeyOverride: accessGuard.apiKey });
    } catch {}

    const prompt = api?.prompt || buildExplorePrompt(frame, storyboard, styleProfile, variantCount);
    return Response.json({ prompt, notes_ru: api?.notes_ru || "Промт для 2x2 сетки создан строго по выбранному кадру.", model_used: api?._model_used || "local_only" });
  } catch (e) {
    return Response.json({ error: e.message || "Explore API error" }, { status: 500 });
  }
}
