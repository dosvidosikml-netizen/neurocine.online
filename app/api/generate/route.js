export async function POST(req) {
  try {
    const body = await req.json();

    // Обновленный промпт: сохранили твои правила генерации и упаковали их в структуру JSON
    const systemPrompt = `### **SYSTEM ROLE & VIRAL ALGORITHMS (STRICT ADHERENCE REQUIRED)**
Ты профессиональный AI-сценарист. Твоя задача — выдать результат ИСКЛЮЧИТЕЛЬНО в формате валидного JSON. Никакого текста, маркдауна или комментариев до/после JSON.

**1. ВИЗУАЛЬНЫЙ РИТМ И МАТЕМАТИКА:**
 * **ПРАВИЛО 3 СЕКУНД:** Смена кадра СТРОГО каждые 3 секунды.
 * **КОЛИЧЕСТВО ПРОМПТОВ:** Каждый 3-секундный кадр должен иметь свой сгенерированный Image и Video промпт.

**2. ТЕХНИЧЕСКИЙ РАЙДЕР (ДЕТАЛИЗАЦИЯ 50+ СЛОВ):**
 * **Image Prompts (Veo/Whisk):** Описывай как для фотографа. Глубина резкости, свет (Rim lighting), частицы пыли, 8k, cinematic.
 * **Video Prompts (Grok Super):** Описывай физику. "Камера медленно пролетает сквозь...", "Объект вращается в slow-motion".
 * **ЗАПРЕТЫ:** Никаких Midjourney/Leonardo.

**3. TTS TAGGING (ГОЛОС ДИКТОРА):**
Перед каждой фразой в audio_tts ставь тег: [shock], [intrigue], [fear], [information], [whisper], [confident].

**4. СТРУКТУРА JSON ВЫДАЧИ:**
{
  "hooks": ["Вариант хука 1", "Вариант хука 2", "Вариант хука 3"],
  "cover": {
    "text_overlay": "2-4 слова",
    "image_prompt": "Промпт обложки: один крупный объект, 8k, шок/ужас..."
  },
  "scenes": [
    {
      "time_start": 0,
      "time_end": 3,
      "audio_tts": "[shock] Текст...",
      "sfx": "Звуковой эффект...",
      "on_screen_text": "Текст на экране...",
      "image_prompt_veo": "Промпт для Veo/Whisk...",
      "video_prompt_grok": "Промпт для Grok Super..."
    }
  ]
}`;

    const userPrompt = `ТЕМА: ${body.topic}. КОНТЕКСТ: ${body.context}. ЖАНР: ${body.genre}. ДЛИТЕЛЬНОСТЬ: ${body.duration}. ПЛАТФОРМА: ${body.platform}. Генерируй сценарий и ПОЛНЫЙ набор промптов СТРОГО в формате JSON.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        // ЭТОТ ПАРАМЕТР ЖЕСТКО ЗАСТАВЛЯЕТ LLM ВЫДАВАТЬ ТОЛЬКО JSON
        response_format: { type: "json_object" }, 
        temperature: 0.5,
        max_tokens: 4000 
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Ошибка API Groq");

    // Парсим строку с ответом от нейросети в реальный JSON-объект
    const parsedData = JSON.parse(data.choices[0].message.content);

    // Отправляем чистый объект на фронтенд
    return new Response(JSON.stringify(parsedData), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
