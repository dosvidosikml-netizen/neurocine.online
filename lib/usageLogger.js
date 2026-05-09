// lib/usageLogger.js
// NeuroCine v63 — server-side usage analytics ledger.
// Best-effort logger: never breaks generation if Supabase logging fails.

import { createAdminSupabase } from "./serverSupabase";

function endpointFromReq(req, fallback = "") {
  try {
    const url = new URL(req?.url || "http://local");
    return url.pathname || fallback || "unknown";
  } catch {
    return fallback || "unknown";
  }
}

function getUserAgent(req) {
  try { return req?.headers?.get?.("user-agent") || ""; } catch { return ""; }
}

export async function logUsageEvent({
  req = null,
  account = null,
  endpoint = "",
  mode = "unknown",
  apiSource = "none",
  modelUsed = "",
  success = true,
  error = "",
  projectId = null,
  durationMs = null,
  metadata = {},
} = {}) {
  try {
    const adminSupabase = createAdminSupabase();
    if (!adminSupabase) return { ok: false, skipped: true, reason: "no_service_role" };

    const profile = account?.profile || {};
    const access = account?.access || {};
    const user = account?.user || {};
    const resolvedEndpoint = endpoint || endpointFromReq(req);
    const resolvedMode = mode || access.defaultMode || profile.default_mode || "unknown";
    const resolvedSource = apiSource || "none";

    const payload = {
      user_id: user?.id || profile?.id || null,
      email: profile?.email || user?.email || "",
      plan: profile?.plan || access?.plan || "",
      role: profile?.role || access?.role || "",
      endpoint: resolvedEndpoint,
      mode: resolvedMode,
      api_source: resolvedSource,
      model_used: modelUsed || "",
      success: Boolean(success),
      error: String(error || "").slice(0, 1000),
      project_id: projectId || null,
      duration_ms: Number.isFinite(Number(durationMs)) ? Math.round(Number(durationMs)) : null,
      metadata: {
        ...(metadata && typeof metadata === "object" ? metadata : {}),
        user_agent: getUserAgent(req).slice(0, 300),
      },
    };

    const { error: insertError } = await adminSupabase.from("usage_events").insert(payload);
    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || "usage log error" };
  }
}

export async function logUsageFromGuard(guard, options = {}) {
  if (!guard?.account) return { ok: false, skipped: true, reason: "no_account" };
  return logUsageEvent({
    account: guard.account,
    apiSource: guard.source || options.apiSource || "none",
    mode: guard.account?.access?.defaultMode || guard.account?.profile?.default_mode || "unknown",
    ...options,
  });
}

export function usageMeta(body = {}, extra = {}) {
  const clean = {};
  if (body?.topic) clean.topic = String(body.topic).slice(0, 160);
  if (body?.duration) clean.duration = Number(body.duration) || body.duration;
  if (body?.target) clean.target = String(body.target).slice(0, 60);
  if (body?.mode) clean.mode = String(body.mode).slice(0, 60);
  if (body?.project_name) clean.project_name = String(body.project_name).slice(0, 160);
  if (body?.provider) clean.provider = String(body.provider).slice(0, 60);
  return { ...clean, ...extra };
}
