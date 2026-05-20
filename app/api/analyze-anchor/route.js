// app/api/analyze-anchor/route.js
// NeuroCine: Analyze uploaded Hero Anchor or Previous PART grid with AI Vision.
// Returns text description for charFaceLock or continuity notes.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageFromGuard, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FACE_SYSTEM = `You are an expert face-description assistant for a video production pipeline.
Analyze the uploaded reference image and output a precise face identity description in English.
Include: age range, gender, face shape, skin tone, eye shape/color, nose type, mouth/lips,
jawline, hair (style/color/length), facial hair, distinctive marks, expression default.
Output ONLY the description text — no markdown, no extra commentary.
Example: "Male, 35-45, lean angular face, light olive skin, deep-set dark brown eyes, straight narrow nose, thin lips, defined jawline with light stubble, short dark brown hair buzzed on sides, neutral expression."`;

const GRID_STYLE_SYSTEM = `You are a visual continuity analyst for a cartoon/video storyboard pipeline.
Analyze the uploaded grid image (a 2×2 or similar frame grid) and describe:
1. Dominant color palette (3-5 colors)
2. Lighting mood and direction
3. Art style DNA (flat/3D/anime/realistic/etc)
4. Character visual identity (what stays the same across frames)
5. Background/environment consistency notes
Output as a compact continuity brief in English — no markdown, no extra commentary.`;

export async function POST(req) {
  const started = Date.now();
  try {
    const guard = await requireOpenRouterAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const body = await req.json();
    const { image, task } = body;

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return Response.json({ ok: false, error: "Нужно загрузить изображение (base64 data URL)" }, { status: 400 });
    }

    const systemPrompt = task === "grid_style" ? GRID_STYLE_SYSTEM : FACE_SYSTEM;
    const userText = task === "grid_style"
      ? "Analyze this storyboard grid. Describe the visual style, color palette, lighting, character identity and environment for continuity."
      : "Describe this person's face and appearance in detail for a face-lock system. Be precise about every facial feature.";

    // Build multimodal message: image + text
    const userMessage = [
      { type: "image_url", image_url: { url: image } },
      { type: "text", text: userText },
    ];

    const r = await callOpenRouter({
      taskType: TASK_TYPES.IMAGE_ANALYSIS,
      systemPrompt,
      userMessage,
      temperatureOverride: 0.2,
      maxTokensOverride: 500,
      apiKeyOverride: guard.apiKey,
      appTitle: "NeuroCine Anchor Analyzer",
    });

    if (!r.ok) {
      await logUsageFromGuard(guard, { req, endpoint: "/api/analyze-anchor", success: false, modelUsed: r.model_used, error: r.error, durationMs: Date.now() - started });
      return Response.json({ ok: false, error: r.error || "Vision model failed" }, { status: 500 });
    }

    const description = String(r.content || "").trim();

    await logUsageFromGuard(guard, { req, endpoint: "/api/analyze-anchor", success: true, modelUsed: r.model_used, durationMs: Date.now() - started, metadata: { task } });

    return Response.json({
      ok: true,
      task,
      description,
      model_used: r.model_used,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Analyze anchor failed" }, { status: 500 });
  }
}
