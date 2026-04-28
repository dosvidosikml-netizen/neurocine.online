import { NextResponse } from "next/server";
import { buildVideoPromptFromAnalysis } from "../../../engine/directorEngine_v4.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { frame, analysis, project } = await req.json();
    if (!frame) return NextResponse.json({ error: "frame is required" }, { status: 400 });
    const prompt = buildVideoPromptFromAnalysis(frame, analysis || "No image analysis provided. Use locked storyboard frame only.", project || {});
    return NextResponse.json({ ok: true, prompt });
  } catch (e) {
    return NextResponse.json({ error: e.message || "video prompt failed" }, { status: 500 });
  }
}
