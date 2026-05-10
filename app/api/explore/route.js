// app/api/cover/route.js
// NeuroCine Cover Director API v2.0
// Instant deterministic thumbnail director: script -> viral text hierarchy -> 9:16 cover prompts.

import { buildCoverDirectorPack } from "../../../engine/coverEngine";
import { requireSignedInAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageEvent, usageMeta } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const guard = await requireSignedInAccess(req);
    if (!guard.ok) return guardErrorJson(guard);
    const body = await req.json();
    const topic = String(body.topic || "").trim();
    const script = String(body.script || "").trim();
    const storyboard = body.storyboard || null;
    const mode = String(body.mode || "viral").trim();
    const style = String(body.style || "viral").trim();
    const platform = String(body.platform || "shorts").trim();

    if (!topic && !script && !storyboard?.scenes?.length) {
      return Response.json({ error: "Нужны topic, script или storyboard со сценами" }, { status: 400 });
    }

    const cover = buildCoverDirectorPack({ topic, script, storyboard, mode, style, platform });
    await logUsageEvent({ req, account: guard.account, endpoint: "/api/cover", success: true, apiSource: "local_signed_in", modelUsed: "local_cover_engine", metadata: usageMeta(body, { mode, style, platform }) });
    return Response.json({ cover, mode: "cover-director-v2", access_source: guard.access?.apiSource || "local_signed_in" });
  } catch (e) {
    return Response.json({ error: e.message || "Cover Director error" }, { status: 500 });
  }
}
