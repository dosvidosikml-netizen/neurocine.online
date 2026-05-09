// app/api/analyze/route.js
// NeuroCine: image analysis disabled by user request.
// Route kept as a safe stub so old UI calls never crash the app.

import { requireSignedInAccess, guardErrorJson } from "../../../lib/apiAccess";
import { logUsageEvent } from "../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const guard = await requireSignedInAccess(req);
  if (!guard.ok) return guardErrorJson(guard);
  await logUsageEvent({ req, account: guard.account, endpoint: "/api/analyze", success: true, apiSource: "disabled_stub", modelUsed: "disabled" });
  return Response.json({
    success: false,
    disabled: true,
    message: "Image analysis is disabled in this NeuroCine build.",
    analysis: null,
  });
}
