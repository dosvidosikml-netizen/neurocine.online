import { NextResponse } from "next/server";
import { DIRECTOR_SYSTEM } from "../../../engine/directorEngine_v4.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { image, frame, project } = await req.json();
    if (!image) return NextResponse.json({ error: "image is required" }, { status: 400 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
    const model = process.env.OPENAI_MODEL || "gpt-5.4";
    const instruction = `${DIRECTOR_SYSTEM}\n\nAnalyze the uploaded final frame for animation. Return Russian text only, not JSON. Extract: camera angle, framing, lens feel, lighting, character pose, emotion, environment, material details, safe micro-motions, camera movement options, SFX. Keep it strictly aligned with this locked storyboard frame: ${JSON.stringify(frame || {})}. Project style: ${project?.style_lock || project?.style_preset || ''}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: [
            { type: "text", text: "Сканируй изображение и дай точечный разбор для video prompt. Не меняй сценарий." },
            { type: "image_url", image_url: { url: image } }
          ]}
        ]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "OpenAI Vision request failed");
    const analysis = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ ok: true, analysis });
  } catch (e) {
    return NextResponse.json({ error: e.message || "analyze failed" }, { status: 500 });
  }
}
