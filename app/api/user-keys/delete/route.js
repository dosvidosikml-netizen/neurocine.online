// app/api/user-keys/delete/route.js
// NeuroCine v54 — delete/deactivate user AI API key.

import { getServerAccount } from "../../../../lib/serverSupabase";
import { logUsageEvent, usageMeta } from "../../../../lib/usageLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const account = await getServerAccount(req);
    if (!account.ok) return Response.json({ error: account.message }, { status: account.status });
    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider || "openrouter").trim().toLowerCase();

    const { error } = await account.supabase
      .from("user_api_keys")
      .delete()
      .eq("user_id", account.user.id)
      .eq("provider", provider);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    await account.supabase
      .from("profiles")
      .update({
        api_keys_connected: false,
        api_key_status: { [provider]: { connected: false, deleted_at: new Date().toISOString() } },
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.user.id);

    await logUsageEvent({ req, account, endpoint: "/api/user-keys/delete", success: true, apiSource: "key_vault", modelUsed: "local", metadata: usageMeta(body, { provider, action: "delete_key" }) });
    return Response.json({ ok: true, provider, profile_patch: { api_keys_connected: false, api_key_status: { [provider]: { connected: false } } } });
  } catch (e) {
    return Response.json({ error: e.message || "Key delete error" }, { status: 500 });
  }
}
