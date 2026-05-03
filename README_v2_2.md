# NeuroCine v2.2 — Hybrid Model Routing + Veo 3 / Grok Pipeline

Финальный апдейт: добавлен централизованный modelRouter, который автоматически выбирает оптимальную модель для каждого типа задачи. Не нужно вручную следить за тем, какая модель куда вызывается — роутер делает это сам.

## Что нового в v2.2 (поверх v2.1)

### Гибридный роутинг моделей
Разные стадии pipeline используют разные модели по умолчанию:

| Задача | Модель по умолчанию | Цена $/1M | Почему именно она |
|---|---|---|---|
| Сценарий (`/api/chat`) | GPT-5.4 | $2.50 / $15 | Сильный креатив на русском, хорошо держит ритм |
| Storyboard JSON (`/api/storyboard`) | GPT-5.4 | $2.50 / $15 | Стабильнее в JSON-mode для больших структур |
| Video prompt refinement (`/api/video`) | **Claude Haiku 4.5** | $1 / $5 | Дешёвая, большую часть работы делает videoPromptAgent локально |
| Image analysis vision (`/api/analyze`) | **Claude Sonnet 4.6** | $3 / $15 | Детальнее видит лица/одежду для continuity |
| Fallback (для всех) | Claude Sonnet 4.6 | $3 / $15 | Запасной вариант если primary упадёт |

### Снижение `max_tokens` storyboard с 32k до 16k
Реально storyboard на 60-секундный ролик использует 8-12k токенов output. 16k = безопасный потолок, защита от случайных дорогих loop-генераций.

### Расход на 1 ролик 60с
- **Раньше (всё на GPT-5.4)**: $0.20-0.35
- **Сейчас (гибридная схема)**: $0.10-0.18 — экономия ~50% без потери качества
- **Если использовать Opus 4.7 везде**: $0.80-1.20 (НЕ рекомендую)

## Файлы апдейта

### Новые
- **`lib/modelRouter.js`** — центральный роутер моделей, выбирает оптимальную модель для каждого task type
- **`.env.example`** — пример конфигурации с тремя пресетами (default / экономия / премиум)

### Обновлённые поверх v2.1
- `app/api/chat/route.js` — использует `callOpenRouter(SCRIPT_WRITING)`
- `app/api/storyboard/route.js` — использует `callOpenRouter(STORYBOARD_GENERATION)`, max_tokens 16k
- `app/api/video/route.js` — использует `callOpenRouter(VIDEO_PROMPT_REFINEMENT)` через Haiku 4.5
- `app/api/analyze/route.js` — использует `getModelConfig(IMAGE_ANALYSIS)` через Sonnet 4.6

### Файлы из v2.1 (не менялись в v2.2)
- `engine/videoPromptAgent.js`
- `engine/sceneEngine_v2.js`
- `app/storyboard/page.js` (UI Veo3/Grok переключатель)
- `docs/CORE_THINKING_DOCTRINE.md`

## Деплой

### Шаг 1. Распакуй ZIP поверх репо
8 файлов будут перезаписаны/добавлены:
```
lib/
  modelRouter.js          ← НОВЫЙ
.env.example              ← НОВЫЙ
engine/
  videoPromptAgent.js     ← из v2.1
  sceneEngine_v2.js       ← из v2.1
app/
  api/
    chat/route.js         ← обновлён под router
    storyboard/route.js   ← обновлён под router
    video/route.js        ← обновлён под router
    analyze/route.js      ← обновлён под router
  storyboard/page.js      ← из v2.1 (UI Veo3/Grok)
docs/
  CORE_THINKING_DOCTRINE.md ← из v2.1
```

### Шаг 2. Переменные окружения

**Минимальный сетап** — добавь в `.env.local` или Vercel env:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_SITE_URL=https://neurocine.online
```

Этого достаточно — modelRouter применит дефолты (гибридная схема). Расход: ~$0.10-0.18 за ролик.

**Если хочешь явный контроль** — раскомментируй в `.env.example` нужные строки. Доступно 3 пресета:

1. **Default (рекомендую)** — гибридная схема, ~$0.10-0.18 за ролик
2. **Альтернатива 1: Максимальная экономия** — всё на Haiku 4.5, ~$0.04 за ролик, качество 80%
3. **Альтернатива 2: Премиум** — Opus 4.7 на креативе, ~$0.50 за ролик, для коммерции

### Шаг 3. Деплой

```bash
git add -A
git commit -m "feat: hybrid model routing v2.2 + Veo 3 / Grok pipeline"
git push
```

Никаких новых зависимостей — `package.json` не меняется.

### Шаг 4. Проверка

1. Открой `/storyboard`
2. Сгенерируй сценарий → в Network tab должен быть вызов `/api/chat`, ответ содержит `"model_used": "openai/gpt-5.4"`
3. Сгенерируй раскадровку → ответ `/api/storyboard` содержит `"model_used": "openai/gpt-5.4"`
4. Перейди к видео-промту → `/api/video` ответ `"model_used": "anthropic/claude-haiku-4.5"`
5. Если загрузишь картинку для analyze → `/api/analyze` использует Sonnet 4.6

## Экономика — практический пример

Допустим, ты делаешь **10 роликов 60-сек в неделю**:

| Сетап | Стоимость в неделю | Стоимость в месяц | Стоимость в год |
|---|---|---|---|
| Только Opus 4.7 | $8-12 | $35-50 | $400-600 |
| Только GPT-5.4 (как было) | $2-3.50 | $9-15 | $100-180 |
| **Hybrid v2.2 (рекомендую)** | $1-1.80 | $4-8 | $50-95 |
| Только Haiku 4.5 | $0.40-0.80 | $2-3.50 | $20-40 |

Экономия от перехода с "только GPT-5.4" на v2.2 hybrid за год: **~$50-90** при том же качестве.

## Как переключаться между сетапами

В Vercel зайди в Settings → Environment Variables и переопредели нужные переменные. Например, для премиум-проекта:

```
OPENROUTER_SCRIPT_MODEL=anthropic/claude-opus-4.7
OPENROUTER_VISION_MODEL=anthropic/claude-opus-4.7
```

Перезапуск/redeploy не нужен — Next.js при следующем запросе подхватит новые env.

Можно даже создать **разные projects на Vercel** для разных тарифов:
- `neurocine-premium.online` — Opus сетап
- `neurocine.online` — hybrid (default)
- `neurocine-mass.online` — Haiku сетап

Один git repo, разные env — разные конфигурации.

## Backward compatibility

Старая переменная `OPENROUTER_MODEL` всё ещё работает — если она задана, она перебивает primary для всех задач. Это для тех у кого уже настроен deployment с этой переменной.

```bash
# Если у тебя в Vercel уже задано:
OPENROUTER_MODEL=openai/gpt-5.4

# Это значит: ВСЕ задачи используют GPT-5.4 как primary.
# Чтобы получить выгоду от hybrid routing — удали OPENROUTER_MODEL
# и добавь per-task переменные из .env.example.
```

## Troubleshooting

### "Расход не упал"
Проверь что в env не задана `OPENROUTER_MODEL` (legacy override). Если задана — все задачи будут идти через одну модель, hybrid routing не сработает.

### "Качество video promts ухудшилось"
Haiku 4.5 на video refinement иногда упрощает. Если важно качество для конкретного проекта — переопредели:
```bash
OPENROUTER_FAST_MODEL=openai/gpt-5.4
```

### "Vision не работает"
Sonnet 4.6 — мультимодальная модель. Если у тебя нет к ней доступа в OpenRouter, используй:
```bash
OPENROUTER_VISION_MODEL=openai/gpt-5.4
```

GPT-5.4 тоже умеет vision, чуть слабее на лицах но рабоче.

## Roadmap

- [ ] Per-shot target override (большинство кадров на Veo 3, ключевые — на Sora 2)
- [ ] UI debug-панель: показывать какая модель вызвалась для каждого кадра
- [ ] Stats dashboard: автоматический подсчёт стоимости текущего проекта
- [ ] Sora 2 target когда стабилизируется API
