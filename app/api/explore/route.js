// app/api/explore/route.js
// NeuroCine Explore Prompt API
// Builds a 2×2 cinematic variation grid prompt for the selected storyboard frame.

import { buildExplorePrompt } from "../../../engine/directorEngine_v4";
import { requireSignedInAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageEvent, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body = {};
  try {
    const guard = await requireSignedInAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    body = await req.json();
    const frame = body.frame || {};
    const storyboard = body.storyboard || {};
    const styleProfile = body.styleProfile || {};

    if (!frame?.id && !frame?.image_prompt_en && !frame?.description_ru && !frame?.vo_ru) {
      return Response.json({ error: "Нужен выбранный storyboard frame" }, { status: 400 });
    }

    const prompt = buildExplorePrompt(frame, storyboard, styleProfile);

    await logUsageEvent({
      req,
      account: guard.account,
      endpoint: "/api/explore",
      success: true,
      apiSource: "local_signed_in",
      modelUsed: "local_explore_engine",
      metadata: usageMeta(body, { frame_id: frame?.id || null }),
    });

    return Response.json({
      prompt,
      mode: "explore-prompt-v1",
      access_source: guard.access?.apiSource || "local_signed_in",
    });
  } catch (e) {
    return Response.json({ error: e.message || "Explore prompt error" }, { status: 500 });
  }
}
