// app/api/user-keys/route.js
// NeuroCine v54 — user AI API Key Vault status/save.

import { getServerAccount } from "../../../lib/serverSupabase";
import { encryptApiKey, getLast4, maskKey } from "../../../lib/apiKeyCrypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = new Set(["openrouter"]);

function normalizeProvider(raw = "openrouter") {
  const p = String(raw || "openrouter").trim().toLowerCase();
  return ALLOWED_PROVIDERS.has(p) ? p : "openrouter";
}

async function testOpenRouterKey(apiKey = "") {
  const key = String(apiKey || "").trim();
  if (!key || key.length < 20) return { ok: false, message: "Ключ слишком короткий." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload?.error?.message || payload?.message || `HTTP ${res.status}`;
      return { ok: false, message: msg };
    }
    return { ok: true, message: "OpenRouter key проверен.", models_seen: Array.isArray(payload?.data) ? payload.data.length : null };
  } catch (e) {
    return { ok: false, message: e.message || "Не удалось проверить ключ." };
  }
}

async function readKeyStatus(supabase, userId) {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider,last4,is_active,status,key_label,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  const providers = {};
  for (const row of data || []) {
    providers[row.provider] = {
      connected: Boolean(row.is_active),
      provider: row.provider,
      label: row.key_label || row.provider,
      last4: row.last4 || "",
      masked: row.last4 ? `••••••••••••${row.last4}` : "",
      status: row.status || {},
      updated_at: row.updated_at,
    };
  }
  return providers;
}

export async function GET(req) {
  try {
    const account = await getServerAccount(req);
    if (!account.ok) return Response.json({ error: account.message }, { status: account.status });
    const providers = await readKeyStatus(account.supabase, account.user.id);
    return Response.json({ providers, access: { role: account.access.role, plan: account.access.plan, can_manage_keys: account.access.role === "pro" || account.access.isOwner || account.access.isAdmin } });
  } catch (e) {
    return Response.json({ error: e.message || "Key Vault status error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const account = await getServerAccount(req);
    if (!account.ok) return Response.json({ error: account.message }, { status: account.status });

    const access = account.access;
    const canManage = access.role === "pro" || access.isOwner || access.isAdmin;
    if (!canManage) return Response.json({ error: "Подключение AI-ключей доступно в PRO." }, { status: 403 });

    const body = await req.json();
    const provider = normalizeProvider(body.provider || "openrouter");
    const apiKey = String(body.apiKey || body.api_key || "").trim();
    const keyLabel = String(body.keyLabel || body.key_label || "OpenRouter").trim().slice(0, 60) || "OpenRouter";

    if (!apiKey) return Response.json({ error: "Вставьте API key." }, { status: 400 });
    const test = provider === "openrouter" ? await testOpenRouterKey(apiKey) : { ok: false, message: "Провайдер пока не поддерживается." };
    if (!test.ok) return Response.json({ error: `Ключ не прошёл проверку: ${test.message}` }, { status: 400 });

    const encrypted = encryptApiKey(apiKey);
    const last4 = getLast4(apiKey);
    const status = { checked: true, ok: true, message: test.message, provider, checked_at: new Date().toISOString() };

    const { error: upsertError } = await account.supabase
      .from("user_api_keys")
      .upsert({
        user_id: account.user.id,
        provider,
        key_label: keyLabel,
        encrypted_key: encrypted,
        last4,
        is_active: true,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

    if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 });

    await account.supabase
      .from("profiles")
      .update({
        api_keys_connected: true,
        api_key_status: { [provider]: { connected: true, last4, checked_at: status.checked_at } },
        default_mode: "live",
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.user.id);

    return Response.json({
      ok: true,
      provider,
      masked: maskKey(apiKey),
      last4,
      status,
      profile_patch: { api_keys_connected: true, default_mode: "live", api_key_status: { [provider]: { connected: true, last4 } } },
    });
  } catch (e) {
    return Response.json({ error: e.message || "Key Vault save error" }, { status: 500 });
  }
}
