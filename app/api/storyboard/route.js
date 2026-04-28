import { NextResponse } from "next/server";
import {
  DEFAULT_STYLE_LOCK,
  buildDirectorStoryboardUserPrompt,
  buildFallbackStoryboard,
  normalizeMode,
  normalizeStoryboard,
  validateDirectorStoryboard,
} from "../../../engine/directorEngine_v3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are NeuroCine Director Core v3, a production storyboard brain for AI video studios.

Primary law: the user's scenario is fixed. Do not rewrite the story. Do not add new story events. Do not change characters, wardrobe, location, era, time, emotional meaning, VO meaning, SFX meaning, or timeline order.

Your output is used for a Director Mode pipeline:
SCRIPT → STYLE LOCK → SCENARIO LOCK → STORY GRID → EXPLORE VARIATIONS → LOCK FRAME → VIDEO PROMPT.

You create strict JSON only. Every frame must be generation-ready for image and video.
No markdown. No explanations. No text outside JSON.
`;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function extractJson(text = "") {
  const cleaned = String(text)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch (_) {}
  }
  throw new Error("Model returned invalid JSON");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const script = String(body.script || "").trim();
    const duration = Number(body.duration || 60);
    const mode = normalizeMode(body.mode || "safe");
    const styleLock = String(body.styleLock || body.style_lock || DEFAULT_STYLE_LOCK).trim();
    const projectType = String(body.projectType || body.project_type || "film");
    const stylePreset = String(body.stylePreset || body.style_preset || "cinematic_realism");

    if (!script) return json({ error: "script is required" }, 400);

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-5.4";

    if (!process.env.OPENROUTER_API_KEY) {
      const fallback = buildFallbackStoryboard({ script, duration, mode, styleLock });
      return json({ ...fallback, warning: "OPENROUTER_API_KEY is missing. Returned local fallback storyboard.", validation: validateDirectorStoryboard(fallback), model_used: "local-fallback" });
    }

    const userPrompt = buildDirectorStoryboardUserPrompt({ script, duration, mode, styleLock, projectType, stylePreset });
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online",
        "X-Title": "NeuroCine Director Core v3",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 32000,
        temperature: mode === "raw" ? 0.48 : 0.26,
        top_p: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || JSON.stringify(payload);
      return json({ error: `OpenRouter ${response.status}: ${message}` }, response.status);
    }

    const content = payload?.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);
    const storyboard = normalizeStoryboard(parsed, duration, mode, model, styleLock, script);
    const validation = validateDirectorStoryboard(storyboard);

    return json({ ...storyboard, validation, model_used: model });
  } catch (error) {
    return json({ error: error.message || "Director storyboard generation failed" }, 500);
  }
}

export async function GET() {
  return json({ ok: true, engine: "NeuroCine Director Core v3" });
}
