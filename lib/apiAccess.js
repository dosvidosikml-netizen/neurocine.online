// lib/apiAccess.js
// NeuroCine v54 — server-side LIVE access guard.
// Rule: DEMO/FREE never use real AI API. PRO uses user key. OWNER uses platform key.

import { getServerAccount } from "./serverSupabase";
import { decryptApiKey } from "./apiKeyCrypto";

export async function getActiveUserApiKey(supabase, userId, provider = "openrouter") {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider,encrypted_key,last4,is_active,status,updated_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data?.encrypted_key) return { ok: false, message: "AI API-ключ не подключён." };

  try {
    return { ok: true, apiKey: decryptApiKey(data.encrypted_key), meta: data };
  } catch (e) {
    return { ok: false, message: e.message || "Не удалось расшифровать AI API-ключ." };
  }
}

export async function requireOpenRouterAccess(req) {
  const account = await getServerAccount(req);
  if (!account.ok) return { ok: false, status: account.status, message: account.message };

  const { access, supabase, user } = account;
  if (access.isOwner || access.isAdmin || access.canUseAdminApi) {
    const platformKey = process.env.OPENROUTER_API_KEY || "";
    if (!platformKey) return { ok: false, status: 500, message: "OPENROUTER_API_KEY не настроен для OWNER." };
    return { ok: true, apiKey: platformKey, source: "platform_keys", account };
  }

  if (access.role === "pro") {
    const key = await getActiveUserApiKey(supabase, user.id, "openrouter");
    if (!key.ok) return { ok: false, status: 403, message: "PRO активен, но AI API-ключ ещё не подключён." };
    return { ok: true, apiKey: key.apiKey, source: "user_keys", account, keyMeta: key.meta };
  }

  return { ok: false, status: 403, message: "LIVE-генерация доступна в PRO." };
}

export function guardErrorJson(guard) {
  return Response.json({ error: guard.message || "LIVE доступ закрыт", apiError: true, accessDenied: true }, { status: guard.status || 403 });
}
