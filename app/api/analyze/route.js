// app/api/analyze/route.js
// NeuroCine: image analysis disabled by user request.
// Route kept as a safe stub so old UI calls never crash the app.

import { requireSignedInAccess, guardErrorJson } from "../../../lib/apiAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const guard = await requireSignedInAccess(req);
  if (!guard.ok) return guardErrorJson(guard);
  return Response.json({
    success: false,
    disabled: true,
    message: "Image analysis is disabled in this NeuroCine build.",
    analysis: null,
  });
}
