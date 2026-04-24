import { cookies } from "next/headers";
import { createAdminSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "../../../../lib/adminAuth";

export async function POST(req) {
  try {
    const { pin } = await req.json();
    const adminPin = process.env.ADMIN_PIN || process.env.DEV_LOCK_PIN;

    if (!adminPin) {
      return Response.json({ ok: false, error: "ADMIN_PIN or DEV_LOCK_PIN is not configured" }, { status: 500 });
    }

    if (String(pin || "") !== String(adminPin)) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const token = await createAdminSession();
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
