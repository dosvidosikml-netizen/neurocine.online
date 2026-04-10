export async function POST(req) {
  try {
    const body = await req.json();

    const camera = body.cameraMoves ? body.cameraMoves.join(", ") : "на усмотрение режиссера";
    const physics = body.physicsEffects ? body.physicsEffects.join(", ") : "отсутствует";
    const asmr = body.asmrSounds ? body.asmrSounds.join(", ") : "стандартное звуковое оформление";

    const prompt = `Ты профессиональный AI-ассистент и режиссёр вирусных видео (Shorts/TikTok/Reels).
ПАРАМЕТРЫ: Тема: ${body.topic}. Детали: ${body.context}. Жанр: ${body.genre}. Длительность: ${body.duration}. Платформа: ${body.platform}.

СТРОГИЕ ПРАВИЛА ГЕНЕРАЦИИ (НЕ ВЫДУМЫВАЙ ЕРУНДУ, ДЕЛАЙ ТО ЧТО ТРЕБУЮТ):
1. Раскадровка СТРОГО каждые 2-3 секунды. Каждое слово диктора должно иметь значительный кадр.
2. Дай 3 варианта мощного HOOK (шок, тайна, опасность, парадокс).
3. Сначала выдай полный сценарий: текст диктора, таймкоды, описание кадров и режиссерские пометки.
4. ПОСЛЕ полного сценария выдай чистый список промптов для генерации (без описаний и лишнего текста).
5. Image prompts пиши ТОЛЬКО для Veo, Whisk.
6. Video prompts пиши ТОЛЬКО для Grok super.
7. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать Midjourney или Leonardo.
8. Между каждым промптом в итоговом списке ОБЯЗАТЕЛЬНО делай отступ (пустую строку).

ДВИЖЕНИЕ КАМЕРЫ: ${camera}.
ФИЗИКА И ЭФФЕКТЫ: ${physics}.
АСМР-ЗВУКИ: ${asmr}.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Ошибка API Groq");
    }

    const text = data.choices[0].message.content;
    
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
