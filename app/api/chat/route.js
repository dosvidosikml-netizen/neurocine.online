export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const apiKey = process.env.GROQ_API_KEY; // Твой новый ключ из Vercel

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://docushorts-pro.vercel.app", 
        "X-Title": "DocuShorts Pro",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct", 
        messages: body.messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "OpenRouter Error" }), { status: response.status });
    }

    return new Response(JSON.stringify({ text: data.choices[0].message.content }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
