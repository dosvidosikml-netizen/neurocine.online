# AUTO SAFE → GROK

Что добавлено:

- SAFE / GPT остаётся основным режимом для стабильной генерации JSON.
- После SAFE генерации сайт автоматически создаёт дополнительные поля для Grok:
  - image_prompt_grok_en
  - video_prompt_grok_en
  - grok_sfx
  - grok_camera
- Оригинальные поля не меняются:
  - image_prompt_en
  - video_prompt_en
  - vo_ru
  - timing
  - character_lock
- В таблице Storyboard появились новые колонки:
  - GROK IMAGE (AUTO)
  - GROK VIDEO (AUTO)

Как использовать:

1. Генерируй в SAFE / GPT.
2. Для картинок можно использовать обычный image_prompt_en или grok auto image.
3. Для видео в Grok бери video_prompt_grok_en.

Важно: AUTO SAFE → GROK не меняет VO и структуру сцен, только усиливает промты под видео.
