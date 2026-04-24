export async function GET() {
  return Response.json({ ok: true, service: "neurocine", ts: Date.now() });
}
