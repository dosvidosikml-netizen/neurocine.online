export async function POST(req) {
  try {
    const body = await req.json();

    const prompt = `Ты профессиональный AI-ассистент и режиссёр вирусных видео (Shorts/TikTok/Reels).
ПАРАМЕТРЫ: Тема: ${body.topic}. Детали: ${body.context}. Жанр: ${body.genre}. Длительность: ${body.duration}. Платформа: ${body.platform}. Язык: ${body.language}.

СТРОГИЕ ПРАВИЛА ГЕНЕРАЦИИ (НЕ ВЫДУМЫВАЙ ЕРУНДУ, ДЕЛАЙ ТО ЧТО ТРЕБУЮТ):
1. Раскадровка СТРОГО каждые 2-3 секунды. Каждое слово диктора должно иметь значительный кадр.
2. Дай 3 варианта мощного HOOK (шок, тайна, опасность, парадокс).
3. Сначала выдай полный сценарий: текст диктора, таймкоды, описание кадров и режиссерские пометки.
4. ПОСЛЕ полного сценария выдай чистый список промптов для генерации (без описаний и лишнего текста).
5. Image prompts пиши ТОЛЬКО для Veo, Whisk.
6. Video prompts пиши ТОЛЬКО для Grok super.
7. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать Midjourney или Leonardo.
8. Между каждым промптом в итоговом списке ОБЯЗАТЕЛЬНО делай отступ (пустую строку).

ДВИЖЕНИЕ: ${body.cameraMoves.join(", ")}. ФИЗИКА: ${body.physicsEffects.join(", ")}. АСМР: ${body.asmrSounds.join(", ")}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Ошибка API Google");
    }

    const text = data.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
