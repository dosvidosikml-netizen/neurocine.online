// app/api/billing/checkout/route.js
// NeuroCine v62.2 — reliable manual PRO request logging.
// If payment provider is not configured, request MUST be written to billing_events.

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

async function writeBillingRequest(adminSupabase, payload) {
  if (!adminSupabase) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY не настроен в Render. Заявку нельзя записать в Admin Panel.",
    };
  }

  const { data, error } = await adminSupabase
    .from("billing_events")
    .insert(payload)
    .select("id,email,event_type,status,plan,created_at")
    .single();

  if (error) return { ok: false, error: error.message || "Не удалось записать billing_events." };

  // Mark profile so OWNER can also see the request on the user row.
  if (payload.user_id) {
    await adminSupabase
      .from("profiles")
      .update({
        billing_status: payload.status || "pro_requested",
        billing_provider: payload.provider || "manual",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.user_id);
  }

  return { ok: true, event: data };
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

  const status = checkoutUrl ? "pending" : "pro_requested";
  const provider = checkoutUrl ? "external_checkout" : "manual";
  const saved = await writeBillingRequest(adminSupabase, {
    user_id: userId || null,
    email,
    provider,
    event_type: "checkout_requested",
    status,
    plan,
    amount: null,
    currency: "USD",
    metadata: { has_checkout_url: Boolean(checkoutUrl), ui_version: "v62.2" },
  });

  if (!saved.ok) {
    return Response.json({ ok: false, error: saved.error }, { status: 500 });
  }

  if (!checkoutUrl) {
    return Response.json({
      ok: true,
      provider_configured: false,
      checkout_url: "",
      event: saved.event,
      message: "Заявка на PRO записана. OWNER может выдать PRO вручную в Admin Panel.",
    });
  }

  return Response.json({ ok: true, provider_configured: true, checkout_url: checkoutUrl, event: saved.event });
}
