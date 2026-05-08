# NeuroCine v53 — PRO Own Keys Model

## Что изменено

v53 переводит продуктовую логику в безопасную модель:

- DEMO/FREE — тестовый режим без реальных API.
- PRO — доступ к NeuroCine Studio и будущему подключению собственных API-ключей пользователя.
- OWNER/ADMIN — только владелец платформы, LIVE через Render ENV / platform API.

Публичный интерфейс больше не показывает BYO API или ADMIN как варианты для обычного пользователя.

## Почему так безопаснее

Обычный PRO-пользователь не должен списывать OPENROUTER_API_KEY владельца платформы. PRO продаёт доступ к системе, pipeline, cloud-проектам и профессиональному workflow, а реальные генерации должны идти через ключи самого пользователя.

## Изменённые файлы

- `lib/accountRoles.js`
- `components/AuthPanel.js`
- `components/UserDashboard.js`
- `components/ProductionPack.js`
- `app/storyboard/page.js`
- `.env.example`
- `supabase/schema_v53_pro_own_keys.sql`

## SQL

Если v44/v45/v48 уже выполнялись, v53 SQL не обязателен для запуска сайта, но рекомендуется выполнить:

```sql
supabase/schema_v53_pro_own_keys.sql
```

Он добавляет подготовительные поля:

- `api_keys_connected`
- `api_key_status`
- `pro_api_note`

и нормализует обычных пользователей в DEMO, а OWNER — в LIVE.

## Что дальше

v54 должен добавить полноценный Secure API Key Vault:

- ввод OpenRouter key пользователем;
- проверка ключа;
- хранение только в зашифрованном виде;
- выбор API source server-side;
- DEMO/FREE → mock;
- PRO → user keys;
- OWNER → platform keys.
