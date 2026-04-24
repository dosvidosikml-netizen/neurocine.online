export async function POST(req) {
  try {
    const { pin } = await req.json();
    const lockPin = process.env.DEV_LOCK_PIN;
    if (!lockPin) {
      return Response.json({ ok: false, error: "DEV_LOCK_PIN is not configured" }, { status: 500 });
    }
    if (String(pin || "") === String(lockPin)) return Response.json({ ok: true });
    return Response.json({ ok: false }, { status: 403 });
  } catch (error) {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
