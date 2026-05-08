# NeuroCine v62–v63 — Studio UI + Production Pack Polish

Большой, но безопасный продуктовый апдейт поверх v55–v60 Core SaaS Hardening.

## Цель

Сделать студию визуально понятнее и ближе к готовому SaaS-продукту без риска сломать основной генератор:

- чистая цепочка работы `01 Сценарий → 02 Storyboard → 03 Pipeline → 04 Production Pack → 05 Export`;
- убрать публичные dev-версии из ключевых блоков;
- сделать Production Pack понятным как финальный рабочий пакет;
- подчеркнуть, что Production Pack сохраняется в Cloud snapshot;
- улучшить мобильный UX без редизайна всего сайта;
- не трогать платежи и OWNER Auto Editor.

## Что изменено

### 1. Новый Studio Flow Panel

Добавлен файл:

```txt
components/StudioFlowPanel.js
```

Он показывает статус проекта по шагам:

```txt
01 Сценарий
02 Storyboard
03 Pipeline
04 Production Pack
05 Export
```

Панель отображает режим доступа:

```txt
FREE Preview
PRO ждёт AI-ключ
PRO LIVE
OWNER LIVE
```

### 2. Production Pack polish

Файл:

```txt
components/ProductionPack.js
```

Добавлен статус-блок:

```txt
Script
Storyboard
Access
Cloud
```

Теперь пользователь видит, что Production Pack сохраняется в Cloud snapshot проекта.

### 3. Cloud Projects language cleanup

Файл:

```txt
components/CloudProjectsPanel.js
```

Убраны dev-подписи вида `v57` из публичного заголовка. Блок теперь называется:

```txt
Project Library
```

Кнопки стали продуктово понятнее:

```txt
Сохранить проект
Обновить
Сохранить копией
Переименовать
Дублировать
```

### 4. User Dashboard cleanup

Файл:

```txt
components/UserDashboard.js
```

Убраны лишние публичные упоминания внутренней версии `v54/v55` из текста. Блок стал более SaaS-ориентированным.

### 5. Auth/locked screen cleanup

Файл:

```txt
app/storyboard/page.js
```

Убраны публичные подписи:

```txt
NeuroCine Auth Gate · v46
Workspace locked · v52
```

Заменены на чистые продуктовые подписи.

### 6. CSS

Файл:

```txt
app/globals.css
```

Добавлены стили:

```txt
studio-flow-v62
pack-status-v62
```

## Файлы для замены

```txt
app/storyboard/page.js
app/globals.css
components/StudioFlowPanel.js
components/ProductionPack.js
components/CloudProjectsPanel.js
components/UserDashboard.js
README.md
README_v62_63_studio_ui_production_pack_polish.md
supabase/schema_v62_63_studio_ui_production_pack_polish.sql
```

## SQL

Новая SQL-миграция не требуется для работы сайта. Файл `supabase/schema_v62_63_studio_ui_production_pack_polish.sql` оставлен как безопасная проверка совместимости.

## Проверка

Проверено:

```txt
node --check по всем JS-файлам app/components/engine/lib — OK
```

## Что не входит

Не входит:

```txt
v61 Payments
OWNER Auto Editor
полный редизайн всей студии
новые AI-провайдеры кроме OpenRouter
```

Эти блоки лучше делать отдельными пакетами после стабилизации v62–v63.
