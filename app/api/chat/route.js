export async function POST(req) {
  try {
    // ЗАЩИТА: Проверяем наличие секретного ключа от нашего фронтенда
    const secretToken = req.headers.get("x-access-token");
    if (secretToken !== "proffi-core") {
      console.warn("Попытка несанкционированного доступа к API");
      return new Response(JSON.stringify({ error: "ACCESS DENIED. SYS_LOCKED." }), { 
        status: 403, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const messages = body.messages || [];
    const maxTokens = body.max_tokens || 4000;
    
    const model = body.model || "meta-llama/llama-3.3-70b-instruct";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://docushorts.render.com", 
        "X-Title": "DocuShorts Pro",
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

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Ошибка API OpenRouter");
    }

    const text = data.choices[0].message.content;
    
    return new Response(JSON.stringify({ text }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Внутренняя ошибка сервера" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
