# NeuroCine Engine — Core Thinking Doctrine v2.1

Документ описывает, как движок NeuroCine должен мыслить при написании сценариев, раскадровки, image- и video-промтов. Эта доктрина встроена в системные промты `app/api/chat/route.js` и `app/api/storyboard/route.js`. Документ — источник истины для команды и для последующих апдейтов промтов.

---

## 1. Pipeline (общий поток)

```
script (chat API) → storyboard JSON (storyboard API)
                         │
                         ├─ split into 2-4s shots
                         ├─ inject character_lock verbatim
                         ├─ build image_prompt + video_prompt per target (veo3 / grok)
                         ├─ sanitize banned words
                         └─ validate
                              │
                              └─ frame select → /api/video → final video prompt for chosen model
```

## 2. Thinking layers (для script writing — chat API)

Перед написанием сценария движок внутренне проходит 4 слоя анализа:

- **L1 STRUCTURE** — определяет 4 акта (Hook → Build → Climax → Outro+Question) и распределяет секунды
- **L2 EMOTIONAL ARC** — строит кривую напряжения (rest → rise → peak → release)
- **L3 VISUAL TRANSLATION** — каждое абстрактное утверждение превращается в конкретный физический образ. "Она боялась" → "костяшки белеют на дверной раме, дыхание затуманивает холодное стекло"
- **L4 BEAT RHYTHM** — чередует aggression → pause → aggression → reaction. Каждые 2-3 кадра — тихий бит (взгляд, ветер, неподвижность, дыхание, деталь объекта)

## 3. Правила раскадровки

### One-focus rule
Каждая сцена имеет ОДИН чёткий primary focus. Никакой много-фокусной каши. Камера принадлежит PRIMARY-персонажу: framing, motion, POV, focus.

### Character lock discipline
- **PRIMARY (P1)**: полная идентичность в КАЖДОМ image_prompt и video_prompt — verbatim, без перефраз
- **SECONDARY (P2)**: имя + 1-2 стабильных идентификатора
- **BACKGROUND (BG)**: минимальное упоминание если виден

Запрещено использовать generic-метки ("man", "person", "soldier") как замену идентичности.

### Show-don't-tell перевод
| Абстракция | Конкретная физическая трансляция |
|---|---|
| страх | руки дрожат, неровное дыхание, глаза мечутся |
| горе | сглатывание, опущенный взгляд, пальцы сжимают ткань |
| гнев | сжатая челюсть, ноздри раздуваются, белые костяшки |
| шок | замирание в середине действия, упавший предмет, рот приоткрыт |

### Physical realism (всегда)
В каждом video_prompt вшиты:
- инерция и вес в движении тела
- сопротивление и контакт с поверхностями
- видимое дыхание в холоде
- ткань реагирует на ветер и движение
- частицы среды (пыль, туман, пепел) реагируют на движение
- органический дрейф handheld камеры
- лёгкий focus breathing
- микро-задержки в реакциях (реальные люди не реагируют мгновенно)

### Эскалация без графики
Интенсивность нарастает через КАМЕРУ, ДЫХАНИЕ, НЕСТАБИЛЬНОСТЬ, ДАВЛЕНИЕ ТОЛПЫ, ЗВУК, ПСИХОЛОГИЧЕСКОЕ НАПРЯЖЕНИЕ — не через graphic-детали.

## 4. Структура image_prompt (image_prompt_en)

Жёсткий порядок:
```
[CONTEXT FRAMING] → [CHARACTER LOCK VERBATIM] → [SCENE VISUAL] →
[CAMERA + LENS] → [LIGHTING + COLOR GRADE] → [REALISM ANCHORS] →
[FORMAT/ASPECT RATIO]
```

Image prompt начинается с `SCENE PRIMARY FOCUS:` и заканчивается `ASPECT RATIO: <ratio>`.

### Realism anchors (минимум 4 в каждом промте)
- visible skin pores on nose bridge and cheeks
- natural skin texture with micro-imperfections
- subsurface scattering on skin
- fine facial asymmetry
- peach fuzz catching light
- subtle under-eye shadows
- individual hair strands visible
- fabric weave detail in focus zone
- subtle 35mm film grain (Kodak Vision3 500T)
- natural lens vignette
- lens chromatic aberration on high-contrast edges
- real bokeh from f/1.8

### Запрещённые токены (banned words)
Эти токены делают промт **хуже**, не лучше — они учат модель на дешёвых стоковых фото:

```
cinematic, epic, stunning, beautiful, masterpiece, breathtaking, perfect,
flawless, 8K, ultra HD, 4K, high quality, hyperrealistic, AI generated,
rendered, CGI, octane render, trending on artstation,
no plastic skin, no blur, no smudged faces (negative-теги идут в negative_prompt поле, не в положительный промт)
```

Engine автоматически вычищает их через `stripBannedWords()` в `videoPromptAgent.js`.

## 5. Структура video_prompt (video_prompt_en) — TARGET-AWARE

### Veo 3 (Google)
- **Длина**: 60-120 слов, flowing paragraph
- **Порядок**: shot type → subject → action → environment → camera → lighting → color → realism → audio
- **Camera timing обязателен**: "slow 2-second push-in", "static 3-second hold"
- **Audio block обязателен**: `Audio: [ambience]. SFX: [details]. [Voiceover or 'no dialogue']`
- Veo 3 генерит native synchronized sound — silent промт = потерянная фича

### Grok Imagine (xAI)
- **Длина**: 40-80 слов, компактно
- **Visual hook первым**: первые 8-12 слов — самый сильный образ
- **Stylistic reference вместо тайминга**: "shot like a Roger Deakins documentary fragment", "1995 home video", "shot like a Christopher Doyle Hong Kong night scene"
- **Single action only** — Grok ломается на multi-step actions
- **No Audio block** — звук накладывается отдельно

### Continuity line (обязательно для обеих моделей)
Video prompt ВСЕГДА заканчивается:
```
Maintain EXACT same character appearance, face, clothing, and condition as previous frame.
```

## 6. Negative prompt

Базовый негатив (применяется ко всем кадрам):
```
plastic skin, waxy texture, beauty filter, skin smoothing, oversaturated colors,
soap opera effect, motion interpolation, morphing features, extra fingers,
dead eyes, frozen face, lifeless gaze, AI artifacts, fake bokeh,
smooth airbrushed skin, HDR tonemapping, oversharpened edges,
subtitles, watermark, logo, UI text on screen
```

## 7. Content modes (sanitize layer, ортогонально target)

- **safe** — documentary phrasing, замена risky-слов на нейтральные эквиваленты, observer framing для image prompts
- **raw** — сильнее камера/атмосфера, но всё ещё non-erotic, non-fetishized, non-instructional

`mode` управляет ЧТО в промте. `target` управляет КАК в промте структурируется. Эти два параметра независимы и работают в любой комбинации.

## 8. Validation

После сборки storyboard каждый кадр проверяется:
- character_lock инжектирован verbatim (имя персонажа найдено в обоих промтах)
- image_prompt начинается с правильного префикса
- video_prompt заканчивается continuity line
- target-specific: Veo 3 имеет Audio block, Grok ≤ 100 слов
- нет banned words
- cut_energy ∈ {low, medium, high}
- duration ∈ {2, 3, 4}, total = requested

При провале validation возвращается `errors[]` — клиент видит warning в UI.

## 9. Когда обновлять доктрину

Триггеры для апдейта этого документа и системных промтов:

1. **Новая видео-модель** (Sora 3, Kling 3.0, Runway Gen-5) — добавить новый target в `STORYBOARD_TARGETS` + ветку в `buildVideoPromptFor` + блок в SYSTEM_PROMPT
2. **Изменение поведения существующей модели** (Veo 3.5 разрешит 12 сек вместо 8) — обновить duration cap в `videoPromptAgent.js`
3. **Новые realism-теги работают лучше** — обновить `REALISM_ANCHORS_*` массивы
4. **Замечен новый banned-токен** (модели стали хуже отрабатывать "atmospheric") — добавить в `BANNED_WORDS` и `BANNED_REPLACEMENTS`

Все правки делаются в `engine/videoPromptAgent.js` (механика) + `app/api/storyboard/route.js` SYSTEM_PROMPT (инструкции для LLM).
