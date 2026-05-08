// app/api/billing/checkout/route.js
// NeuroCine v61 — provider-agnostic PRO checkout foundation.
// Real provider can be connected later via BILLING_CHECKOUT_URL or webhook.

import { getServerAccount, createAdminSupabase } from "../../../../lib/serverSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePlan(input = "pro") {
  const plan = String(input || "pro").trim().toLowerCase();
  return plan === "pro" ? "pro" : "pro";
}

function buildCheckoutUrl(baseUrl, { email, userId, plan }) {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("email", email || "");
    url.searchParams.set("user_id", userId || "");
    url.searchParams.set("plan", plan || "pro");
    url.searchParams.set("source", "neurocine");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

async function logBillingEvent(adminSupabase, payload) {
  if (!adminSupabase) return;
  try {
    await adminSupabase.from("billing_events").insert(payload);
  } catch {}
}

export async function POST(req) {
  const account = await getServerAccount(req);
  if (!account.ok) return Response.json({ error: account.message || "Нужно войти." }, { status: account.status || 401 });

  const body = await req.json().catch(() => ({}));
  const plan = normalizePlan(body.plan || "pro");
  const email = account.profile?.email || account.user?.email || "";
  const userId = account.user?.id || account.profile?.id || "";

  const checkoutBase = process.env.BILLING_CHECKOUT_URL || process.env.NEXT_PUBLIC_PRO_CHECKOUT_URL || "";
  const checkoutUrl = buildCheckoutUrl(checkoutBase, { email, userId, plan });
  const adminSupabase = createAdminSupabase();

  await logBillingEvent(adminSupabase, {
    user_id: userId || null,
    email,
    provider: checkoutUrl ? "external_checkout" : "manual",
    event_type: "checkout_requested",
    status: checkoutUrl ? "pending" : "provider_not_configured",
    plan,
    amount: null,
    currency: "USD",
    metadata: { has_checkout_url: Boolean(checkoutUrl) },
  });

  if (!checkoutUrl) {
    return Response.json({
      ok: true,
      provider_configured: false,
      checkout_url: "",
      message: "PRO checkout пока работает в ручном режиме: заявка записана, OWNER может выдать PRO в Admin Panel.",
    });
  }

  return Response.json({ ok: true, provider_configured: true, checkout_url: checkoutUrl });
}
