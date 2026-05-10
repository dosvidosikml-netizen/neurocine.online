# NeuroCine v64 — Mobile AI App Shell + Create Hub

## Что добавлено

Внедрён первый слой мобильной AI Video Factory оболочки без новых API, SQL и ENV.

### Новые возможности

- Мобильная верхняя панель NeuroCine:
  - меню
  - логотип
  - центральный быстрый `+`
  - настройки
  - RU/EN
  - профиль / план

- Нижняя мобильная навигация:
  - Главная
  - Проекты
  - `+` Создать
  - Studio
  - Пакет

- Create Hub:
  - Storyboard Studio
  - Сценарий
  - Виральные Shorts
  - Обложка
  - Создать фото
  - Умная правка
  - Создать видео
  - Motion Control
  - AI-аватар
  - Lip Sync
  - Голос и аудио
  - SEO / Social Pack
  - Project Library
  - Все инструменты

- Side Drawer:
  - Панель проекта
  - Storyboard Studio
  - Production Pipeline
  - Production Pack
  - Project Library
  - группы инструментов

- Tools Registry:
  - единый каталог инструментов NeuroCine
  - active / UI-ready / planned статусы
  - это фундамент для будущего AI Orchestrator и Pipeline Builder

## Важное

- Ничего не удалено.
- Текущий storyboard workflow сохранён.
- Новые AI-провайдеры не подключались.
- SQL не нужен.
- ENV не нужен.
- OWNER/Admin не добавлялись в публичные меню.

## Новые файлы

- `lib/toolsRegistry.js`
- `components/ToolCard.js`
- `components/CreateHub.js`
- `components/MobileBottomNav.js`
- `components/SideDrawer.js`
- `components/TopActionBar.js`

## Изменённые файлы

- `app/storyboard/page.js`
- `app/globals.css`
- `README.md`

## Проверка

Запускалась проверка синтаксиса JS-файлов через `node --check`.

