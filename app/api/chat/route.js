// @ts-nocheck
/* eslint-disable */

export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: body.messages,
        max_tokens: body.max_tokens || 3900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Теперь Vercel не будет прятать ошибку, а выдаст точный ответ от Groq
      return new Response(JSON.stringify({ error: data.error?.message || "Ошибка лимитов или ключа Groq" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const text = data.choices[0].message.content;

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Сбой сервера: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
