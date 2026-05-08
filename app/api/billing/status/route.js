// app/api/billing/status/route.js
// NeuroCine v61 — current user's billing/subscription status.

import { getServerAccount } from "../../../../lib/serverSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const account = await getServerAccount(req);
  if (!account.ok) return Response.json({ error: account.message || "Нужно войти." }, { status: account.status || 401 });
  const profile = account.profile || {};
  return Response.json({
    ok: true,
    plan: profile.plan || "demo",
    role: profile.role || "user",
    default_mode: profile.default_mode || "demo",
    billing_status: profile.billing_status || "none",
    billing_provider: profile.billing_provider || "",
    pro_activated_at: profile.pro_activated_at || null,
    pro_expires_at: profile.pro_expires_at || null,
    access: account.access,
  });
}
