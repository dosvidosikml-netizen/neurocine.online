import { NextResponse } from "next/server";
import { buildExplorePrompt, build2KPrompt } from "../../../engine/directorEngine_v4.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { mode, frame, variant, project } = await req.json();
    if (!frame) return NextResponse.json({ error: "frame is required" }, { status: 400 });
    const prompt = mode === "2k" ? build2KPrompt(frame, variant, project || {}) : buildExplorePrompt(frame, project || {});
    return NextResponse.json({ ok: true, prompt });
  } catch (e) {
    return NextResponse.json({ error: e.message || "explore failed" }, { status: 500 });
  }
}
