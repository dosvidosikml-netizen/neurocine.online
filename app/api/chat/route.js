// Увеличиваем лимит времени выполнения для Vercel (Хобби-тариф дает максимум 60 секунд)
export const maxDuration = 60;

export async function POST(req) {
  try {
    const body = await req.json();

    // Получаем данные, которые отправляет наша функция callAPI с фронтенда
    const messages = body.messages || [];
    const maxTokens = body.max_tokens || 4000;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.2 // Понизил температуру, чтобы ИИ меньше "фантазировал" и строже держал JSON формат
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Ошибка API Groq");
    }

    const text = data.choices[0].message.content;
    
    // Возвращаем ответ в том формате, который ждет наш интерфейс { text: "..." }
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
