// app/api/user-keys/test/route.js
// NeuroCine v54 — test user AI API key without saving.

import { getServerAccount } from "../../../../lib/serverSupabase";
import { maskKey } from "../../../../lib/apiKeyCrypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function testOpenRouterKey(apiKey = "") {
  const key = String(apiKey || "").trim();
  if (!key || key.length < 20) return { ok: false, message: "Ключ слишком короткий." };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: payload?.error?.message || payload?.message || `HTTP ${res.status}` };
    return { ok: true, message: "Ключ активен.", models_seen: Array.isArray(payload?.data) ? payload.data.length : null };
  } catch (e) {
    return { ok: false, message: e.message || "Не удалось проверить ключ." };
  }
}

export async function POST(req) {
  try {
    const account = await getServerAccount(req);
    if (!account.ok) return Response.json({ error: account.message }, { status: account.status });
    const canManage = account.access.role === "pro" || account.access.isOwner || account.access.isAdmin;
    if (!canManage) return Response.json({ error: "Проверка AI-ключей доступна в PRO." }, { status: 403 });

    const body = await req.json();
    const provider = String(body.provider || "openrouter").toLowerCase();
    const apiKey = String(body.apiKey || body.api_key || "").trim();
    if (provider !== "openrouter") return Response.json({ error: "В v54 подключён только OpenRouter как первый AI provider." }, { status: 400 });
    const result = await testOpenRouterKey(apiKey);
    return Response.json({ ...result, provider, masked: result.ok ? maskKey(apiKey) : "" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return Response.json({ error: e.message || "Key test error" }, { status: 500 });
  }
}
