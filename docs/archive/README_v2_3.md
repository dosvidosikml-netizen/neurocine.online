# NeuroCine v2.3 — Полная сборка с Long-Form до 10 минут

## Что внутри
- v2.1: Veo 3 + Grok Imagine target switching, videoPromptAgent с realism anchors
- v2.2: Hybrid model routing (GPT-5.4 + Sonnet 4.6 + Haiku 4.5), снижение max_tokens
- v2.3: Long-form до 10 минут через chunked генерацию по 90с

## Минимальный env
```
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_SITE_URL=https://neurocine.online
```

Не задавай OPENROUTER_MODEL — сломает hybrid routing.

## ВАЖНО для long-form (>3 мин)
maxDuration в storyboard route = 800с. Это требует Vercel Pro план.
На Hobby плане (60с лимит) long-form упадёт по timeout.

| Vercel план | Доступная длительность |
|---|---|
| Hobby | до 3 мин (short-form) |
| Pro | до 5 мин |
| Pro + Fluid Compute | до 10 мин |
| Enterprise | всё |

## Стоимость
- 60 сек ролик: ~$0.10-0.18
- 5 мин ролик: ~$0.75
- 10 мин ролик: ~$1.30 (storyboard) + ~$0.30-0.50 (video prompts)

UI автоматически показывает warning со стоимостью при выборе >3 мин.

## Деплой
```bash
unzip -o neurocine_FULL_v2_3.zip
git add -A
git commit -m "feat: v2.3 long-form support"
git push
```
