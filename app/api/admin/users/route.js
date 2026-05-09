// app/api/admin/users/route.js
// NeuroCine v63 — OWNER Admin Panel API with billing requests, key status and usage analytics.

import { requireOwnerAdminClient, ownerErrorJson } from "../../../../lib/ownerGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePlan(input = "demo") {
  const plan = String(input || "demo").trim().toLowerCase();
  if (["demo", "free"].includes(plan)) return "demo";
  if (plan === "pro") return "pro";
  if (["admin", "owner"].includes(plan)) return "admin";
  return "demo";
}

function patchForPlan(plan) {
  if (plan === "admin") {
    return {
      plan: "admin",
      role: "admin",
      default_mode: "live",
      monthly_generation_limit: 999999,
      cloud_project_limit: 999999,
      billing_status: "owner_bypass",
      billing_provider: "platform",
      updated_at: new Date().toISOString(),
    };
  }
  if (plan === "pro") {
    return {
      plan: "pro",
      role: "user",
      default_mode: "live",
      monthly_generation_limit: 999999,
      cloud_project_limit: 100,
      billing_status: "manual_pro",
      billing_provider: "owner_admin",
      pro_activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return {
    plan: "demo",
    role: "user",
    default_mode: "demo",
    monthly_generation_limit: 10,
    cloud_project_limit: 3,
    api_keys_connected: false,
    api_key_status: {},
    billing_status: "none",
    billing_provider: "",
    billing_subscription_id: "",
    pro_activated_at: null,
    pro_expires_at: null,
    updated_at: new Date().toISOString(),
  };
}

async function countProjectsByUser(adminSupabase) {
  const { data, error } = await adminSupabase.from("projects").select("user_id,id");
  if (error) return {};
  const map = {};
  for (const row of data || []) map[row.user_id] = (map[row.user_id] || 0) + 1;
  return map;
}

async function recentBillingEvents(adminSupabase) {
  try {
    const { data, error } = await adminSupabase
      .from("billing_events")
      .select("id,user_id,email,provider,event_type,status,plan,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function recentUsageEvents(adminSupabase) {
  try {
    const { data, error } = await adminSupabase
      .from("usage_events")
      .select("id,user_id,email,plan,role,endpoint,mode,api_source,model_used,success,error,duration_ms,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

function summarizeUsage(events = []) {
  const byUser = {};
  const totals = { total: events.length, ok: 0, error: 0, userKeys: 0, platform: 0, none: 0 };
  for (const ev of events || []) {
    if (ev.success) totals.ok += 1;
    else totals.error += 1;
    if (ev.api_source === "user_keys") totals.userKeys += 1;
    else if (ev.api_source === "platform_keys") totals.platform += 1;
    else totals.none += 1;
    if (ev.user_id) {
      byUser[ev.user_id] = byUser[ev.user_id] || { count: 0, ok: 0, error: 0, last: null };
      byUser[ev.user_id].count += 1;
      if (ev.success) byUser[ev.user_id].ok += 1;
      else byUser[ev.user_id].error += 1;
      if (!byUser[ev.user_id].last) byUser[ev.user_id].last = ev;
    }
  }
  return { byUser, totals };
}

export async function GET(req) {
  const guard = await requireOwnerAdminClient(req);
  if (!guard.ok) return ownerErrorJson(guard);

  const { adminSupabase } = guard;
  const projectCounts = await countProjectsByUser(adminSupabase);
  const billingEvents = await recentBillingEvents(adminSupabase);
  const usageEvents = await recentUsageEvents(adminSupabase);
  const usage = summarizeUsage(usageEvents);

  const lastRequestByUser = {};
  for (const ev of billingEvents || []) {
    if (ev?.user_id && !lastRequestByUser[ev.user_id]) lastRequestByUser[ev.user_id] = ev;
  }

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,role,plan,default_mode,api_keys_connected,api_key_status,monthly_generation_limit,generations_used,cloud_project_limit,cloud_projects_used,billing_status,billing_provider,pro_activated_at,pro_expires_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  const users = (data || []).map((u) => ({
    ...u,
    project_count: projectCounts[u.id] || 0,
    last_billing_event: lastRequestByUser[u.id] || null,
    usage_count: usage.byUser[u.id]?.count || 0,
    usage_error_count: usage.byUser[u.id]?.error || 0,
    last_usage_event: usage.byUser[u.id]?.last || null,
  }));

  return Response.json({
    users,
    total: users.length,
    billing_events: billingEvents,
    usage_events: usageEvents,
    usage_totals: usage.totals,
  });
}

export async function POST(req) {
  const guard = await requireOwnerAdminClient(req);
  if (!guard.ok) return ownerErrorJson(guard);

  try {
    const body = await req.json();
    const userId = String(body.user_id || body.id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const plan = normalizePlan(body.plan || body.next_plan);
    if (!userId && !email) return Response.json({ error: "Нужен user_id или email." }, { status: 400 });

    const ownerEmail = "dosvidosikml@gmail.com";
    if (email === ownerEmail && plan !== "admin") {
      return Response.json({ error: "OWNER-аккаунт нельзя понизить из Admin Panel." }, { status: 400 });
    }

    let query = guard.adminSupabase.from("profiles").update(patchForPlan(plan));
    query = userId ? query.eq("id", userId) : query.ilike("email", email);
    const { data, error } = await query
      .select("id,email,plan,role,default_mode,api_keys_connected,cloud_project_limit,billing_status,billing_provider,updated_at")
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "Профиль не найден." }, { status: 404 });

    try {
      await guard.adminSupabase.from("billing_events").insert({
        user_id: data.id,
        email: data.email,
        provider: "owner_admin",
        event_type: "manual_plan_change",
        status: "applied",
        plan,
        metadata: { changed_by: guard.account?.profile?.email || guard.account?.user?.email || "owner" },
      });
    } catch {}

    return Response.json({ ok: true, user: data });
  } catch (e) {
    return Response.json({ error: e.message || "Admin update error" }, { status: 500 });
  }
}
