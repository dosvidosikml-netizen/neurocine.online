// app/api/cartoon/export/route.js
// Local cartoon export: no paid AI call, just validates/normalizes project JSON.

import { buildCartoonExport } from "../../../../engine/cartoonEngine";
import { requireSignedInAccess, guardErrorJson } from "../../../../lib/apiAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const guard = await requireSignedInAccess(req);
    if (!guard.ok) return guardErrorJson(guard);

    const body = await req.json();
    const project = buildCartoonExport(body || {});
    return Response.json({ ok: true, project });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Cartoon export failed" }, { status: 500 });
  }
}
