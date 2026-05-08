# Auto-Chain Strict Engine V2

Добавлено отдельным режимом, без удаления старого pipeline.

## Что добавлено
- `engine/autoChainEngine.js` — отдельный строгий движок PART-промтов.
- Блок `02B Auto-Chain Strict Engine · Вариант 2` в `/storyboard`.
- Режимы:
  - `World + Hero` — один мир + главный герой, когда герой есть в сценарии.
  - `World Only` — разные персонажи, но единый мир/стиль.
- Reference modes:
  - `Hero anchor + previous PART`
  - `Previous PART only`
  - `Hero anchor only`
- Экспорт всех PART-промтов в `.txt`.
- Экспорт структуры V2 в `.json`.
- VIDEO PACK для выбранного PART.

## Принцип
Источник правды — уже созданный storyboard из текущего варианта 1.
V2 не выдумывает новые действия, локации или объекты, а строит промты строго по кадрам сценария.

## Важно
Hero/Previous PART картинки используются как visual DNA: стиль, свет, фактура, мир и recurring character identity.
Промт специально запрещает копировать один и тот же референс в каждую ячейку.
