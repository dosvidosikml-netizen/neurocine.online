export async function POST(req) {
  try {
    const body = await req.json();
    const topic = body.topic || "AI видео";

    // 🔥 ВРЕМЕННО БЕЗ API — ЧТОБЫ САЙТ ЗАРАБОТАЛ
    return new Response(JSON.stringify({
      hooks: [
        "Ты теряешь деньги на AI",
        "3 способа заработать на AI",
        "Почему твои видео не заходят",
        "AI уже заменяет людей",
        "Вот как делать вирусные видео"
      ],
      selected_hook: "3 способа заработать на AI",
      frames: [
        {
          time: "0-3",
          visual: "man shocked looking at screen",
          image_prompt: "close-up man, shocked, dark room, screen glow",
          video_prompt: "slow zoom, subtle movement",
          vo: "3 способа заработать на AI",
          sfx: "whoosh"
        },
        {
          time: "3-6",
          visual: "man typing fast on laptop",
          image_prompt: "man typing, laptop glow, dark room",
          video_prompt: "fast typing motion, slight camera shake",
          vo: "AI даёт деньги прямо сейчас",
          sfx: "clicks"
        }
      ]
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      error: "server error"
    }), { status: 500 });
  }
}
