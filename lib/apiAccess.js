// lib/apiAccess.js
// NeuroCine v65 — server-side AI access guard.
// Rule: FREE never uses paid platform AI. PRO uses only user's own key. ADMIN/DIRECTOR uses platform key.

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

export async function resolveGenerationAccess(req, { provider = "openrouter", allowFreeFallback = true } = {}) {
  const account = await getServerAccount(req);
  if (!account.ok) return { ok: false, status: account.status, message: account.message };

  const { access, supabase, user } = account;

  if (access.isOwner || access.isAdmin || access.canUseAdminApi) {
    const platformKey = process.env.OPENROUTER_API_KEY || "";
    if (!platformKey) return { ok: false, status: 500, message: "OPENROUTER_API_KEY не настроен для DIRECTOR/ADMIN." };
    return {
      ok: true,
      live: true,
      apiKey: platformKey,
      source: "platform_keys",
      tier: "admin",
      account,
      provider,
    };
  }

  if (access.role === "pro") {
    const key = await getActiveUserApiKey(supabase, user.id, provider);
    if (!key.ok) {
      return {
        ok: false,
        status: 403,
        message: "PRO активен, но личный AI API-ключ ещё не подключён. Платформа не использует ключи сайта для PRO.",
      };
    }
    return {
      ok: true,
      live: true,
      apiKey: key.apiKey,
      source: "user_keys",
      tier: "pro",
      account,
      keyMeta: key.meta,
      provider,
    };
  }

  if (allowFreeFallback) {
    return {
      ok: true,
      live: false,
      apiKey: "",
      source: "free_site_fallback",
      tier: access.role || "free",
      account,
      provider,
      message: "FREE режим: используется бесплатный локальный/шаблонный мозг сайта без платных API-ключей.",
    };
  }

  return { ok: false, status: 403, message: "LIVE-генерация доступна в PRO." };
}

export async function requireOpenRouterAccess(req) {
  const guard = await resolveGenerationAccess(req, { provider: "openrouter", allowFreeFallback: false });
  if (!guard.ok) return guard;
  if (!guard.live || !guard.apiKey) return { ok: false, status: 403, message: "LIVE-генерация доступна только с AI API-ключом." };
  return guard;
}

export function guardErrorJson(guard) {
  return Response.json({ error: guard.message || "LIVE доступ закрыт", apiError: true, accessDenied: true }, { status: guard.status || 403 });
}

export async function requireSignedInAccess(req) {
  const account = await getServerAccount(req);
  if (!account.ok) return { ok: false, status: account.status, message: account.message };
  return { ok: true, status: 200, account, access: account.access };
}
