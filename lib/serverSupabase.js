// lib/serverSupabase.js
// NeuroCine v54 — Supabase server helpers for authenticated API routes.

import { createClient } from "@supabase/supabase-js";
import { getAccountAccess } from "./accountRoles";

export function getBearerToken(req) {
  const auth = req?.headers?.get?.("authorization") || req?.headers?.get?.("Authorization") || "";
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function isServerSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createServerSupabase(token = "") {
  if (!isServerSupabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export async function getServerAccount(req) {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, message: "Нужно войти через Google.", token: "" };
  const supabase = createServerSupabase(token);
  if (!supabase) return { ok: false, status: 500, message: "Supabase ENV не настроены на сервере.", token };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user || null;
  if (userError || !user) return { ok: false, status: 401, message: "Сессия истекла. Войдите заново.", token };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,role,plan,default_mode,monthly_generation_limit,generations_used,cloud_project_limit,cloud_projects_used,api_keys_connected,api_key_status,pro_api_note,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, status: 500, message: profileError.message || "Не удалось прочитать profile.", token, supabase, user };
  }

  const fallbackProfile = profile || {
    id: user.id,
    email: user.email || user.user_metadata?.email || "",
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User",
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    role: "user",
    plan: "demo",
    default_mode: "demo",
  };

  const access = getAccountAccess(fallbackProfile, { user });
  return { ok: true, status: 200, token, supabase, user, profile: fallbackProfile, access };
}
