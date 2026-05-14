// app/api/character-bible/route.js
// NeuroCine Character Bible API v1.1
// Extracts recurring heroes/cast from script for visual continuity.
// v1.1: source-aware, max-character limits, safer defaults for Shorts.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Character Bible Director.
Extract a clean cast bible from the user's CURRENT script/topic for visual continuity.
Return ONLY valid JSON. No markdown. No comments. No prose.

Rules:
- Do not invent plot events.
- Do not over-cast. For short/documentary videos, create only the visually necessary recurring people/roles.
- Main and recurring visual subjects first. Background crowds should stay background unless the script needs a stable recurring person.
- If the script is documentary and has no named hero, create useful visual roles, but keep the count low.
- Keep descriptions visual and usable for image/video prompts.
- Each character must have stable face, age, body, costume, emotional behavior, and continuity notes.
- Use English for prompt-facing descriptions.
- Use Russian for ui_label_ru.
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

function clampMaxCharacters(value, projectType = "film") {
  const explicit = Number(value);
  if (Number.isFinite(explicit) && explicit >= 1) return Math.max(1, Math.min(12, Math.round(explicit)));
  const type = String(projectType || "").toLowerCase();
  if (/short|reel|tiktok|youtube|док|documentary/.test(type)) return 4;
  if (/clip|клип|music/.test(type)) return 5;
  if (/series|сериал/.test(type)) return 8;
  return 5;
}

function fallbackBible({ script, topic, tone, projectType, maxCharacters }) {
  const text = String(script || topic || "").slice(0, 280);
  return {
    version: "1.1-fallback",
    mode: "auto",
    project_type: projectType || "film",
    source_used: script ? "script" : "topic",
    source_preview: text,
    max_characters: maxCharacters,
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
      }
    ],
    world_notes_en: `Tone: ${tone || "cinematic documentary thriller"}. Keep cast grounded in the script world.`
  };
}

function normalizeBible(data, input) {
  const max = clampMaxCharacters(input.maxCharacters, input.projectType);
  const base = data && typeof data === "object" ? data : fallbackBible({ ...input, maxCharacters: max });
  const chars = Array.isArray(base.characters) ? base.characters : [];
  return {
    version: base.version || "1.1",
    mode: base.mode || "auto",
    project_type: base.project_type || input.projectType || "film",
    source_used: input.script ? "script" : "topic",
    source_preview: String(input.script || input.topic || "").slice(0, 260),
    max_characters: max,
    cast_strategy: base.cast_strategy || "auto_extract_then_manual_refine",
    world_notes_en: base.world_notes_en || "Maintain consistent world, period, lighting, costume logic and documentary realism.",
    characters: chars.slice(0, max).map((c, i) => ({
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

function buildPrompt({ script, topic, tone, projectType, maxCharacters }) {
  const sourceLabel = script ? "CURRENT SCRIPT" : "CURRENT TOPIC ONLY";
  return `
Extract a Character Bible for NeuroCine.

Project type: ${projectType || "film"}
Tone/genre: ${tone || "cinematic documentary thriller"}
Source used: ${sourceLabel}
Maximum characters allowed: ${maxCharacters}
Topic: ${topic || "not specified"}

Script/source:
${script || topic || ""}

Return JSON with this exact shape:
{
  "version": "1.1",
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
- ABSOLUTE MAX: ${maxCharacters} characters.
- For shorts/documentary: prefer 1 main subject + 1-3 supporting visual roles.
- Do not create separate characters for every crowd member or historical region.
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
    const projectType = String(body.projectType || "shorts").trim();
    const maxCharacters = clampMaxCharacters(body.maxCharacters, projectType);

    if (!script && !topic) {
      return Response.json({ error: "Нужен сценарий или тема для создания героев" }, { status: 400 });
    }

    const result = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildPrompt({ script, topic, tone, projectType, maxCharacters }),
      maxTokensOverride: 2800,
      temperatureOverride: 0.22,
      appTitle: "NeuroCine Character Bible",
      apiKeyOverride: accessGuard.apiKey,
    });

    if (!result.ok) {
      const bible = fallbackBible({ script, topic, tone, projectType, maxCharacters });
      await logUsageFromGuard(accessGuard, {
        req,
        endpoint: "/api/character-bible",
        success: false,
        modelUsed: result.model_used,
        error: result.error,
        metadata: usageMeta(body, { tone, projectType, maxCharacters }),
      });
      return Response.json({ bible, warning: result.error, model_used: result.model_used });
    }

    const parsed = safeJsonFromText(result.content);
    const bible = normalizeBible(parsed, { script, topic, tone, projectType, maxCharacters });

    await logUsageFromGuard(accessGuard, {
      req,
      endpoint: "/api/character-bible",
      success: true,
      modelUsed: result.model_used,
      metadata: usageMeta(body, { tone, projectType, maxCharacters, character_count: bible.characters.length }),
    });

    return Response.json({ bible, model_used: result.model_used });
  } catch (e) {
    return Response.json({ error: e.message || "Character Bible error" }, { status: 500 });
  }
}
