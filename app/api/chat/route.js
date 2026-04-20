export async function POST(req) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    // Увеличен лимит: 5000 обрезал JSON на полуслове → cleanJSON падал → краш
    const maxTokens = Math.min(body.max_tokens || 4000, 8000);
    
    const model = body.model || "meta-llama/llama-3.3-70b-instruct";

    // Таймаут увеличен с 25 до 55 сек:
    // Шаг 1A (20 кадров) реально занимает 30-45 сек — 25 сек убивал запрос слишком рано
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://neurocine.online",
          "X-Title": "NeuroCine",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model, 
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Читаем текст до парсинга — чтобы не падать на HTML-ошибках
    const rawText = await response.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`OpenRouter вернул не-JSON ответ. Статус: ${response.status}. Попробуйте снова.`);
    }
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Ошибка API OpenRouter (${response.status})`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenRouter вернул пустой ответ. Попробуйте снова.");
    }
    
    return new Response(JSON.stringify({ text }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("API Error:", error);
    
    const message = error.name === "AbortError" 
      ? "Сервер не успел ответить за 55 сек. Попробуйте уменьшить длительность видео или повторите."
      : (error.message || "Внутренняя ошибка сервера");
    
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
