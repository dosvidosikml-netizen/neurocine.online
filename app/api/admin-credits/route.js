import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyAdminSession } from "../../../lib/adminAuth";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const isAuthed = await verifyAdminSession(token);

    if (!isAuthed) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { amount, action } = await req.json();
    const normalizedAmount = Number(amount);

    if (!["set", "add", "subtract", "reset"].includes(action)) {
      return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }

    if (action !== "reset" && (!Number.isFinite(normalizedAmount) || normalizedAmount < 0)) {
      return Response.json({ ok: false, error: "Amount must be a positive number" }, { status: 400 });
    }

    return Response.json({
      ok: true,
      action,
      amount: action === "reset" ? 3 : Math.floor(normalizedAmount),
      storageKey: "ds_billing",
      date: new Date().toLocaleDateString("ru-RU"),
    });
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
