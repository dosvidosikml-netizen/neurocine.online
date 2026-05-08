// app/api/billing/webhook/route.js
// NeuroCine v61 — generic secure webhook for future payment provider automation.
// Requires header: x-neurocine-billing-secret = BILLING_WEBHOOK_SECRET

import { createAdminSupabase } from "../../../../lib/serverSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPaidStatus(status = "") {
  return ["paid", "succeeded", "success", "active", "confirmed"].includes(String(status || "").toLowerCase());
}

function patchForPaidPro(provider = "external", providerId = "") {
  return {
    plan: "pro",
    role: "user",
    default_mode: "live",
    monthly_generation_limit: 999999,
    cloud_project_limit: 100,
    billing_status: "active",
    billing_provider: provider,
    billing_subscription_id: providerId,
    pro_activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req) {
  const expected = process.env.BILLING_WEBHOOK_SECRET || "";
  const received = req.headers.get("x-neurocine-billing-secret") || "";
  if (!expected) return Response.json({ error: "BILLING_WEBHOOK_SECRET не настроен." }, { status: 500 });
  if (received !== expected) return Response.json({ error: "Invalid webhook secret." }, { status: 401 });

  const adminSupabase = createAdminSupabase();
  if (!adminSupabase) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY не настроен." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const userId = String(body.user_id || body.userId || "").trim();
  const plan = String(body.plan || "pro").trim().toLowerCase();
  const status = String(body.status || body.payment_status || "paid").trim().toLowerCase();
  const provider = String(body.provider || "external").trim().toLowerCase();
  const providerEventId = String(body.provider_event_id || body.event_id || body.subscription_id || "").trim();

  if (plan !== "pro") return Response.json({ error: "Only PRO activation is supported." }, { status: 400 });
  if (!email && !userId) return Response.json({ error: "Нужен email или user_id." }, { status: 400 });

  try {
    await adminSupabase.from("billing_events").insert({
      user_id: userId || null,
      email,
      provider,
      provider_event_id: providerEventId,
      event_type: "webhook",
      status,
      plan: "pro",
      amount: body.amount || null,
      currency: body.currency || "USD",
      metadata: body,
    });
  } catch {}

  if (!isPaidStatus(status)) return Response.json({ ok: true, ignored: true, status });

  let query = adminSupabase.from("profiles").update(patchForPaidPro(provider, providerEventId));
  query = userId ? query.eq("id", userId) : query.ilike("email", email);
  const { data, error } = await query.select("id,email,plan,role,default_mode,billing_status,billing_provider").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Профиль не найден." }, { status: 404 });

  try {
    await adminSupabase.from("billing_subscriptions").upsert({
      user_id: data.id,
      email: data.email,
      provider,
      provider_subscription_id: providerEventId || `${provider}:${data.id}`,
      status: "active",
      plan: "pro",
      activated_at: new Date().toISOString(),
      raw_payload: body,
      updated_at: new Date().toISOString(),
    }, { onConflict: "provider,provider_subscription_id" });
  } catch {}

  return Response.json({ ok: true, user: data });
}
