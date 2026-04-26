const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const MAX_MESSAGE_LENGTH = 10 * 1024 * 1024;

// 🔥 ТВОЙ ДВИЖОК
const SYSTEM_PROMPT = `
Cinematic NeuroCine vFinal.

Default SAFE mode.
If user writes "grok" → RAW mode.

SAFE:
- no explicit gore
- no exposed body wording
- focus on reaction, camera, tension

RAW:
- stronger motion
- stronger camera
- higher intensity

Rules:
- cinematic realism
- strict continuity
- no subtitles/UI
- structured scenes

If user writes "json" → return JSON only
`;

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit" }), {
        status: 429,
      });
    }

    const body = await req.json();
    let messages = body.messages || [];

    if (JSON.stringify(messages).length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: "Too large" }), {
        status: 400,
      });
    }

    const model = "openai/gpt-5.4";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          // 🔥 ВСТАВЬ СЮДА СВОЙ КЛЮЧ
          Authorization: `Bearer sk-or-PASTE_YOUR_KEY_HERE`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.3,
          max_tokens: 6000,
          response_format: { type: "json_object" },
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API error");
    }

    let text = data.choices?.[0]?.message?.content;

    // 🔥 защита от ```json
    if (text?.startsWith("```")) {
      text = text.replace(/```json|```/g, "").trim();
    }

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error.name === "AbortError"
            ? "Timeout"
            : error.message || "Server error",
      }),
      { status: 500 }
    );
  }
}
