# NeuroCine — Bug Fix Pass

Дата: 2026-05-14
Билд: `next build` ✓ Линт: `next lint` ✓ (0 errors)

## Изменённые файлы (10 шт.)

| Файл | Что чинит |
|------|-----------|
| `engine/sceneEngine_v2.js` | **Grok caching bug**: `EXACT_CONTINUITY` теряется при триме длинных промтов |
| `engine/autoChainEngine.js` | `buildFlowCompactPartPrompt` использовал захардкоженный «2×2 grid» |
| `engine/longFormEngine.js` | `splitScriptForChunks` оставляет пустые чанки на коротких сценариях |
| `app/storyboard/page.js` | `doVideoPrompt` использовал `devMode` вместо `effectiveDevMode`; `charModifiers` неправильной схемы при импорте |
| `app/api/storyboard/route.js` | SSE без heartbeat → разрыв через прокси; нет отмены при разрыве клиента |
| `app/api/billing/webhook/route.js` | Отсутствует idempotency → ретраи провайдера сбрасывают `pro_activated_at` |
| `lib/modelRouter.js` | `callOpenRouter` не принимал AbortSignal → нельзя отменить in-flight запросы |
| `components/CloudProjectsPanel.js` | Autosave race-condition + квота проверялась только перед setBusy |
| `components/PublicLanding*.js` (×4) | 8 ESLint errors `react/no-unescaped-entities` |

---

## 1. Grok storyboard validation: «video prompt missing character continuity line» (×10)

### Что было

`compactGrokVideo()` собирал строку:
```
ANIMATE CURRENT FRAME: {hook}. Single action only: {action}. ... ; {camera}; ... naturally. Maintain EXACT same character appearance, face, clothing, and condition as previous frame.
```
И затем `trimWords(out, 118)`.

Если GPT-5.4 возвращал длинную `camera` (≥70 слов — обычное дело в Grok-режиме), общее число слов выходило за 118, и `trimWords` обрезал хвост — терялась строка `Maintain EXACT...`. Валидатор ругался: `frame_XX: video prompt missing character continuity line`.

Воспроизведено на тестовых данных: 10 фреймов, длинная camera → 10 ошибок (точно как на скриншоте пользователя).

### Что исправлено

В `engine/sceneEngine_v2.js`:
- Введён `CONTINUITY_WORD_COUNT` константа.
- Введён `appendContinuity(body, maxTotalWords)` — режет body с резервом места под `EXACT_CONTINUITY`, потом подклеивает континьюити-строку **в конце**.
- `compactGrokVideo` теперь дополнительно ограничивает `camera` до 14 слов и использует `appendContinuity(body, 118)`.
- Введён `extractAudioBlock(text)` для VEO — вытаскивает `Audio: ... SFX: ...` блок из baseVideo, чтобы трим не зацепил его.
- `ensureVeoVideo` теперь резервирует место под audio + continuity отдельно, режет только переменное тело промта.

### Проверка

```
GROK: words=67, ends with "previous frame." → validation ok
VEO:  words=125, Audio block intact, ends with "previous frame." → validation ok
```

---

## 2. autoChainEngine: захардкоженный «2×2 grid»

`buildFlowCompactPartPrompt` всегда говорил модели «2×2 grid», даже когда `partSize` = 6. Теперь `cols × rows` считается из `partScenes.length` динамически.

---

## 3. longFormEngine: пустые чанки

`splitScriptForChunks(script, chunks)` распределял предложения по бюджетам, но при `sentences.length < chunks.length` или несбалансированных весах оставлял первые/последние чанки пустыми → LLM получал `scriptForChunk=""` и галлюцинировал.

### Новое поведение

- `sentences == 0` → все пустые (фолбэк генерации).
- `chunks == 1` → весь скрипт.
- `sentences ≤ chunks` → пропорциональное распределение позиций + forward-fill для пустых чанков.
- `sentences > chunks` → старая пропорциональная логика + `minBudget = Math.max(...weights)` чтобы одно длинное предложение не пустило первый чанк вперёд + safety-net forward-fill на хвосте.

### Тесты

| Кейс | Empty count до | Empty count после |
|------|----------------|-------------------|
| 5 предложений × 8 чанков | 3 | 0 |
| 30 × 4 (нормальный) | 0 | 0 |
| 1 × 4 (экстрим) | 3 | 0 |
| 0 × 4 (пустой ввод) | 4 | 4 (корректно) |

---

## 4. SSE-стрим в `/api/storyboard` route

### Что добавлено

- **Heartbeat ping** каждые 15 секунд (`: ping {ts}\n\n`). Без него Cloudflare/корпоративные прокси закрывают idle-соединение между chunk-вызовами (30-60с пауза).
- **Безопасный send()** — обёрнут в try/catch + флаг `closed`. После закрытия контроллера `send` молча игнорится вместо exception.
- **Abort-signal propagation**: `req.signal` пробрасывается в `callOpenRouter`, между чанками проверяется `abortSignal.aborted`. Если клиент закрыл вкладку — цикл прерывается и дорогие API-вызовы не делаются.
- **Header `X-Accel-Buffering: no`** — отключает буферизацию nginx (на случай proxied деплоя).
- `controller.close()` теперь только в `finally` (раньше — в нескольких ранних `return`), что упрощает lifecycle и убирает риск двойного close.

### `lib/modelRouter.js`

`callOpenRouter` теперь принимает `signal` параметр. AbortError превращается в `{ ok: false, aborted: true }` без падения.

---

## 5. billing webhook: idempotency

Stripe / PayPal / другие провайдеры **повторяют** webhook events если получили 5xx или таймаут. До фикса каждый ретрай:
- Вставлял дубль в `billing_events`.
- **Сбрасывал `pro_activated_at` на текущее время** в `profiles`.

Теперь перед обработкой проверяется `(provider, provider_event_id)` в `billing_events`. Если такое событие уже есть — возвращаем `{ ok: true, idempotent: true }` без апдейта профиля.

---

## 6. CloudProjectsPanel

- **Autosave race**: `lastAutoSaveKeyRef.current = inFlightKey` теперь ставится **до** `await updateSelectedCloudProject()`. Иначе во время сейва приходящий новый `autoSaveKey` ставил таймер на следующий тик и сейв повторялся 2 раза подряд. На ошибке делается rollback ref'а чтобы ретрай состоялся.
- **Квота-чек перед insert**: повторно проверяется `items.length >= projectLimit` непосредственно перед запросом — `items` мог обновиться из другого таба/автосейва.

---

## 7. app/storyboard/page.js

- `doVideoPrompt` использовал `devMode` напрямую вместо производного `effectiveDevMode`. Для admin/owner с `forceLiveForAdmin=true` это означало: video-prompt возвращал mock-данные даже когда должен был идти LIVE-запрос.
- `setCharModifiers(pipe.charModifiers || { clothing:"", body:"", ... })` — fallback-объект был неправильной схемы (строки вместо булевых; ключи не совпадали с реальным state). После импорта снапшота без charModifiers UI-кнопки не находили свои ключи. Исправлено на `{ beard:false, scar:false, dirt:false, bruises:false, sweat:false, exhaustion:false, pale:false, blood:false }`.

---

## 8. components/PublicLanding*.js

8 ESLint errors `react/no-unescaped-entities`:
- `Director's Cut` → `Director&apos;s Cut`
- `Director's Note` → `Director&apos;s Note`

В четырёх файлах: `PublicLanding.js`, `PublicLandingOriginalAuth.js`, `PublicLandingV2.js`, `PublicLandingV3.js`.

---

## Не тронуто (намеренно)

- Хук-deps warnings (`react-hooks/exhaustive-deps`) в `storyboard/page.js`. Большинство выглядит как намеренное замораживание зависимостей; править их вслепую опасно.
- `useStoredState` race-condition в ProductionPack — нечастый сценарий, переписывать без покрытия тестами рискованно.
- `<img>` → `<Image />` warnings — это performance hint, не баг.
