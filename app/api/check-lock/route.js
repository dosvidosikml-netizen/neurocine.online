// ─── Rate Limiter (in-memory, per IP) ────────────────────────────────────────
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

// ─── Whitelist разрешённых моделей ───────────────────────────────────────────
const ALLOWED_MODELS = new Set([
  "anthropic/claude-sonnet-4-6",
  "openai/gpt-4o-mini",
]);

// Лимит поднят до 10 MB — base64 фото (vision / multi-character) требуют места
const MAX_MESSAGE_LENGTH = 10 * 1024 * 1024;

export async function POST(req) {
  try {
    // 1. Rate limiting по IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов. Подождите минуту." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Защита от прямого вызова API извне приложения.
    // Браузерные запросы не несут секрет — блокируем только если токен ПРИШЁЛ и оказался неверным.
    const appSecret = process.env.APP_SECRET;
    const clientToken = req.headers.get("X-App-Token");
    if (appSecret && clientToken && clientToken !== appSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = body.messages || [];

    // 3. Валидация длины входных данных
    if (JSON.stringify(messages).length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Входные данные слишком большие." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Whitelist моделей
    const requestedModel = body.model || "anthropic/claude-sonnet-4-6";
    const model = ALLOWED_MODELS.has(requestedModel)
      ? requestedModel
      : "anthropic/claude-sonnet-4-6";

    const maxTokens = Math.min(body.max_tokens || 4000, 8000);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://neurocine.online",
          "X-Title": "NeuroCine",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(
        `OpenRouter вернул не-JSON ответ. Статус: ${response.status}. Попробуйте снова.`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error?.message || `Ошибка API OpenRouter (${response.status})`
      );
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenRouter вернул пустой ответ. Попробуйте снова.");
    }

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    const message =
      error.name === "AbortError"
        ? "Сервер не успел ответить за 55 сек. Попробуйте уменьшить длительность видео или повторите."
        : error.message || "Внутренняя ошибка сервера";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
