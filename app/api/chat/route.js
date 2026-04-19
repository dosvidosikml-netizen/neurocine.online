export async function POST(req) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const maxTokens = Math.min(body.max_tokens || 4000, 5000); // ФИХ: Ограничиваем максимум до 5000
    
    const model = body.model || "meta-llama/llama-3.3-70b-instruct";

    // ФИХ: Добавлен таймаут 25 секунд чтобы сервер не падал
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

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

    // ФИХ: Сначала читаем текст, потом парсим — чтобы не падать на HTML-ошибках
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
    
    // ФИХ: Понятное сообщение при таймауте
    const message = error.name === "AbortError" 
      ? "Запрос занял слишком много времени. Попробуйте уменьшить длительность видео."
      : (error.message || "Внутренняя ошибка сервера");
    
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
