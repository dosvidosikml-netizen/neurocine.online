# NeuroCine v65 — Quick Storygrid + Viral Shorts Tools

## Что добавлено

v65 добавляет второй слой AI Video Factory поверх мобильной оболочки v64:

- Quick Storygrid Tool
- Viral Shorts Generator
- новые карточки в Tools Registry
- anchor `#quick-tools`
- быстрый переход из Create Hub / Side Drawer
- чистый frontend foundation без новых API, SQL и ENV

## Quick Storygrid

Быстрая форма для входа в storyboard:

- идея видео
- длина
- формат 9:16 / 16:9 / 1:1
- количество сцен
- язык
- стиль
- detailed / compact prompts

Кнопки:

- Применить настройки
- Создать сценарий
- Создать storyboard

## Viral Shorts

Быстрая заготовка для viral content:

- платформа: YouTube Shorts / TikTok / Instagram Reels / Facebook Reels
- ниша
- длительность
- тип подачи
- hook
- script structure
- cover text
- TTS
- music
- SEO titles
- hashtags

Кнопка `Вставить в сценарий` переносит pack в текущий сценарий Studio.

## Изменённые / новые файлы

```txt
app/storyboard/page.js
app/globals.css
lib/toolsRegistry.js
components/QuickStorygridTool.js
components/ViralShortsTool.js
README_v65_quick_storygrid_viral_tools.md
```

## SQL / ENV

Не нужны.

## Проверка

После деплоя:

1. Открыть `/storyboard`
2. Нажать `+`
3. Выбрать `Quick Storygrid` или `Виральные Shorts`
4. Должен произойти переход к блоку `Быстрый старт`
5. Quick Storygrid должен применять настройки и запускать сценарий/storyboard
6. Viral Shorts должен вставлять production-заготовку в сценарий

## Важно

Текущий Storyboard workflow не удалён и не заменён. v65 только добавляет быстрый мобильный слой поверх существующей Studio.
