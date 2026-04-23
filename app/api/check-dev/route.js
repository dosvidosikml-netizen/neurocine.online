
export async function GET(req) {
  const key = new URL(req.url).searchParams.get("key");
  if (key && key === process.env.DEV_KEY) {
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false }, { status: 403 });
}
