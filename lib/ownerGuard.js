// lib/ownerGuard.js
// NeuroCine v55-60 — OWNER-only server guard for admin tools.

import { getServerAccount, createAdminSupabase } from "./serverSupabase";

export async function requireOwnerAccount(req) {
  const account = await getServerAccount(req);
  if (!account.ok) return { ok: false, status: account.status || 401, message: account.message || "Нужно войти." };
  const access = account.access || {};
  if (!(access.isOwner || access.isAdmin)) {
    return { ok: false, status: 403, message: "OWNER-доступ закрыт." };
  }
  return { ok: true, account };
}

export async function requireOwnerAdminClient(req) {
  const owner = await requireOwnerAccount(req);
  if (!owner.ok) return owner;
  const adminSupabase = createAdminSupabase();
  if (!adminSupabase) {
    return {
      ok: false,
      status: 500,
      message: "SUPABASE_SERVICE_ROLE_KEY не настроен в Render. Он нужен только для OWNER Admin Panel.",
      account: owner.account,
    };
  }
  return { ok: true, account: owner.account, adminSupabase };
}

export function ownerErrorJson(result) {
  return Response.json({ error: result.message || "OWNER access error" }, { status: result.status || 403 });
}
