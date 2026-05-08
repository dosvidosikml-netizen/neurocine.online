// app/api/admin/users/route.js
// NeuroCine v55-60 — basic OWNER Admin Panel API.

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
    updated_at: new Date().toISOString(),
  };
}

async function countProjectsByUser(adminSupabase) {
  const { data, error } = await adminSupabase
    .from("projects")
    .select("user_id,id");
  if (error) return {};
  const map = {};
  for (const row of data || []) map[row.user_id] = (map[row.user_id] || 0) + 1;
  return map;
}

export async function GET(req) {
  const guard = await requireOwnerAdminClient(req);
  if (!guard.ok) return ownerErrorJson(guard);

  const { adminSupabase } = guard;
  const projectCounts = await countProjectsByUser(adminSupabase);
  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,role,plan,default_mode,api_keys_connected,monthly_generation_limit,generations_used,cloud_project_limit,cloud_projects_used,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  const users = (data || []).map((u) => ({
    ...u,
    project_count: projectCounts[u.id] || 0,
  }));
  return Response.json({ users, total: users.length });
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
    const { data, error } = await query.select("id,email,plan,role,default_mode,api_keys_connected,cloud_project_limit,updated_at").maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data) return Response.json({ error: "Профиль не найден." }, { status: 404 });

    return Response.json({ ok: true, user: data });
  } catch (e) {
    return Response.json({ error: e.message || "Admin update error" }, { status: 500 });
  }
}
