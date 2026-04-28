import { NextResponse } from "next/server";
import { generateExplorePrompt, build2KPrompt } from "../../../engine/directorEngine_v4";

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.mode === "2k") {
      return NextResponse.json({ prompt: build2KPrompt(body) });
    }
    const result = await generateExplorePrompt(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Explore failed" }, { status: 500 });
  }
}
