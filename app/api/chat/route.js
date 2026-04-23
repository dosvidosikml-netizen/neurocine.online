// app/api/chat/route.js

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return json({ error: "Rate limit" }, 429);
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return json({ error: "No API key" }, 500);
    }

    const body = await req.json();

    const topic = body.topic || "";
    if (!topic) {
      return json({ error: "Topic required" }, 400);
    }

    // 🔥 НОВЫЙ ДВИЖОК (короткие промпты)
    const systemPrompt = `
You are an elite short-form video generator.

RULES:
- Output ONLY JSON
- No explanations
- No long prompts

LIMITS:
- image_prompt <= 200 chars
- video_prompt <= 200 chars
- visual <= 120 chars
- vo <= 100 chars
- sfx <= 60 chars

STRUCTURE:

image_prompt:
subject + environment + lighting + camera + style

video_prompt:
camera movement + micro motion + environment motion

NO LONG SENTENCES.
NO GENERIC WORDS.

HOOKS:
Generate 5 hooks (max 10 words each)

OUTPUT:

{
  "hooks": [],
  "selected_hook": "",
  "frames": [
    {
      "time": "0-3",
      "visual": "",
      "image_prompt": "",
      "video_prompt": "",
      "vo": "",
      "sfx": ""
    }
  ]
}
`;

    const userPrompt = `Topic: ${topic}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-6",
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    const data = await response.json();

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    let parsed = JSON.parse(raw);

    // 🔥 ЖЁСТКАЯ ОБРЕЗКА (фикс качества)
    const clamp = (str, max) =>
      typeof str === "string" ? str.slice(0, max) : "";

    parsed.frames = parsed.frames.map((f) => ({
      ...f,
      visual: clamp(f.visual, 120),
      image_prompt: clamp(f.image_prompt, 200),
      video_prompt: clamp(f.video_prompt, 200),
      vo: clamp(f.vo, 100),
      sfx: clamp(f.sfx, 60),
    }));

    return json(parsed);
  } catch (e) {
    console.error(e);
    return json({ error: e.message }, 500);
  }
}
