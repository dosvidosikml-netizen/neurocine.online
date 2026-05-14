// app/api/character-bible/route.js
// NeuroCine Character Bible API v1
// Extracts recurring heroes/cast from script for series/film/music video continuity.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Character Bible Director.
Your job is to extract a clean cast bible from a script for visual continuity in a film/series/storyboard pipeline.
Return ONLY valid JSON. No markdown. No comments. No prose.

Rules:
- Detect named characters and important unnamed recurring roles.
- Do not invent plot events.
- If the script is documentary and has no stable hero, create visual roles needed for continuity, e.g. "main witness", "hired mourner", "widow", "guard", "narrator subject".
- Keep descriptions visual and usable for image/video prompts.
- Each character must have stable face, age, body, costume, emotional behavior, and continuity notes.
- Use English for prompt-facing descriptions.
- Use concise Russian labels only where helpful for UI.
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

function fallbackBible({ script, topic, tone }) {
  const text = String(script || topic || "").slice(0, 280);
  return {
    version: "1.0-fallback",
    mode: "auto",
    project_type: "unknown",
    cast_strategy: "auto_extract_then_manual_refine",
    characters: [
      {
        id: "char_01",
        name: "Main Subject",
        ui_label_ru: "Главный герой / объект истории",
        role: "primary recurring visual subject",
        importance: "main",
        age_range: "adult",
        gender_presentation: "unspecified",
        face_lock_en: "realistic unretouched human face, stable identity, natural asymmetry, visible pores, tired eyes",
        body_lock_en: "natural non-model posture, documentary physical presence",
        clothing_lock_en: "period-appropriate clothing based strictly on the script context",
        emotion_lock_en: "emotionally restrained but physically believable",
        continuity_notes_en: "Preserve the same face, age, clothing logic and physical condition in every frame where this subject appears.",
        appears_in: "derive from storyboard scenes",
        reference_mode: "auto",
        reference_image: null,
        source_hint: text,
      }
    ],
    world_notes_en: `Tone: ${tone || "cinematic documentary thriller"}. Keep cast grounded in the script world.`
  };
}

function normalizeBible(data, input) {
  const base = data && typeof data === "object" ? data : fallbackBible(input);
  const chars = Array.isArray(base.characters) ? base.characters : [];
  return {
    version: base.version || "1.0",
    mode: base.mode || "auto",
    project_type: base.project_type || input.projectType || "film",
    cast_strategy: base.cast_strategy || "auto_extract_then_manual_refine",
    world_notes_en: base.world_notes_en || "Maintain consistent world, period, lighting, costume logic and documentary realism.",
    characters: chars.slice(0, 12).map((c, i) => ({
      id: c.id || `char_${String(i + 1).padStart(2, "0")}`,
      name: String(c.name || c.ui_label_ru || `Character ${i + 1}`).trim(),
      ui_label_ru: String(c.ui_label_ru || c.name || `Герой ${i + 1}`).trim(),
      role: String(c.role || "supporting character").trim(),
      importance: String(c.importance || (i === 0 ? "main" : "supporting")).trim(),
      age_range: String(c.age_range || "adult").trim(),
      gender_presentation: String(c.gender_presentation || "unspecified").trim(),
      face_lock_en: String(c.face_lock_en || "realistic stable face, natural asymmetry, visible pores").trim(),
      body_lock_en: String(c.body_lock_en || "natural documentary posture and body language").trim(),
      clothing_lock_en: String(c.clothing_lock_en || "costume follows the script world and period").trim(),
      emotion_lock_en: String(c.emotion_lock_en || "emotionally believable, not theatrical unless script requires it").trim(),
      continuity_notes_en: String(c.continuity_notes_en || "Keep identity consistent in every frame where this character appears.").trim(),
      appears_in: c.appears_in || "derive from scenes",
      reference_mode: c.reference_mode || "auto",
      reference_image: null,
    }))
  };
}

function buildPrompt({ script, topic, tone, projectType }) {
  return `
Extract a Character Bible for NeuroCine.

Project type: ${projectType || "film"}
Tone/genre: ${tone || "cinematic documentary thriller"}
Topic: ${topic || "not specified"}

Script:
${script || ""}

Return JSON with this exact shape:
{
  "version": "1.0",
  "mode": "auto",
  "project_type": "series|film|clip|documentary|shorts",
  "cast_strategy": "auto_extract_then_manual_refine",
  "world_notes_en": "...",
  "characters": [
    {
      "id": "char_01",
      "name": "stable English name or role",
      "ui_label_ru": "Russian UI name",
      "role": "story role",
      "importance": "main|supporting|background",
      "age_range": "...",
      "gender_presentation": "...",
      "face_lock_en": "stable face description for image continuity",
      "body_lock_en": "body/posture/physicality",
      "clothing_lock_en": "costume/clothing continuity",
      "emotion_lock_en": "emotional behavior continuity",
      "continuity_notes_en": "rules for storyboard/grid prompts",
      "appears_in": "where this character appears",
      "reference_mode": "auto",
      "reference_image": null
    }
  ]
}

Important:
- Max 12 characters.
- Main recurring heroes first.
- If no names exist, create useful role names from the story.
- Every description must be visual, not literary.
- Return only JSON.
`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);

    const script = String(body.script || "").trim();
    const topic = String(body.topic || "").trim();
    const tone = String(body.tone || "cinematic documentary thriller").trim();
    const projectType = String(body.projectType || "film").trim();

    if (!script && !topic) {
      return Response.json({ error: "Нужен сценарий или тема для создания Character Bible" }, { status: 400 });
    }

    const result = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildPrompt({ script, topic, tone, projectType }),
      maxTokensOverride: 3200,
      temperatureOverride: 0.25,
      appTitle: "NeuroCine Character Bible",
      apiKeyOverride: accessGuard.apiKey,
    });

    if (!result.ok) {
      const bible = fallbackBible({ script, topic, tone, projectType });
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/character-bible",
        success: false,
        modelUsed: result.model_used,
        error: result.error,
        metadata: usageMeta(body, { tone, projectType }),
      });
      return Response.json({ bible, warning: result.error, model_used: result.model_used });
    }

    const parsed = safeJsonFromText(result.content);
    const bible = normalizeBible(parsed, { script, topic, tone, projectType });

    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/character-bible",
      success: true,
      modelUsed: result.model_used,
      metadata: usageMeta(body, { tone, projectType, character_count: bible.characters.length }),
    });

    return Response.json({ bible, model_used: result.model_used });
  } catch (e) {
    return Response.json({ error: e.message || "Character Bible error" }, { status: 500 });
  }
}
