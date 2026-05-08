// app/api/social-pack/route.js
// NeuroCine Social Director V2 — platform-ready social assets.

import { callOpenRouter, TASK_TYPES } from "../../../lib/modelRouter";
import { requireOpenRouterAccess, guardErrorJson } from "../../../lib/apiAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYS = (genre) => `Ты — NeuroCine Social Director V2: elite SMM-копирайтер для документальных Shorts/Reels.
Пиши ТОЛЬКО на русском. Output ONLY valid JSON. No markdown.
ЖАНР: ${genre}.

ЦЕЛЬ: не сырой пост, а готовый social pack с разными форматами.

ПРАВИЛА:
— Используй факты и физические детали из сценария.
— Не заявляй спорные версии как доказанный факт: формулируй как "одна из версий", "вопрос", "если это не...".
— Без воды: "невероятно", "шок", "мало кто знает" не использовать.
— Каждый формат должен иметь свой ритм, не копировать один и тот же текст.

FACEBOOK:
— post_hook: одна сильная первая строка.
— post_body: 3-5 коротких абзацев через \\n\\n.
— post_question: вопрос для комментариев.
— post_tags: 5-8 тематических хештегов.

REELS/TIKTOK CAPTION:
— 2-4 строки.
— Первая строка стоп-скроллер.
— Последняя строка открывает интригу.

CAROUSEL 5:
1 — Обложка: крупный тезис.
2 — Факт: числа/масштаб.
3 — Поворот: что не сходится.
4 — Версия: осторожная интрига.
5 — CTA: смотри ролик/что думаешь.

STORIES 3:
1 — удар, 2 — вопрос, 3 — CTA.

JSON:
{
  "post_hook": "...",
  "post_body": "...",
  "post_question": "...",
  "post_tags": "#... #...",
  "reels_caption": "...",
  "tiktok_caption": "...",
  "youtube_pinned_comment": "...",
  "carousel": [
    { "emoji":"🎬","headline":"...","sub":"...","bg":"#0d0010" },
    { "emoji":"📊","headline":"...","sub":"...","bg":"#0a0500" },
    { "emoji":"⚡","headline":"...","sub":"...","bg":"#000a06" },
    { "emoji":"👁","headline":"...","sub":"...","bg":"#0a000a" },
    { "emoji":"🎯","headline":"...","sub":"...","bg":"#00060d" }
  ],
  "slides": [
    { "emoji":"💥","headline":"...","sub":"...","bg":"#0d0010" },
    { "emoji":"❓","headline":"...","sub":"...","bg":"#0a0500" },
    { "emoji":"▶️","headline":"...","sub":"...","bg":"#00060d" }
  ]
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const accessGuard = await requireOpenRouterAccess(req);
    if (!accessGuard.ok) return guardErrorJson(accessGuard);
    const topic = String(body.topic || "").trim();
    const script = String(body.script || "").trim();
    const genre = String(body.genre || "ИСТОРИЯ").trim();
    if (!script || script.length < 30) return Response.json({ error: "Нужен сценарий минимум 30 символов" }, { status: 400 });

    const userMsg = `Тема: ${topic}\nСценарий:\n${script.slice(0, 7000)}\n\nСгенерируй полный V2 social pack: FB + Reels + TikTok + pinned comment + Carousel + Stories.`;

    const r = await callOpenRouter({
      taskType: TASK_TYPES.SCRIPT_WRITING,
      systemPrompt: SYS(genre),
      userMessage: userMsg,
      maxTokensOverride: 4800,
      responseFormat: { type: "json_object" },
      apiKeyOverride: accessGuard.apiKey,
      appTitle: "NeuroCine Social Director V2",
    });
    if (!r.ok) return Response.json({ error: r.error }, { status: 500 });

    let parsed;
    try {
      const c = String(r.content || "").trim().replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
      parsed = JSON.parse(c);
    } catch (e) { return Response.json({ error: "Невалидный JSON: " + e.message, raw: r.content?.slice(0,500) }, { status: 500 }); }

    return Response.json({ social: parsed, model_used: r.model_used });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
