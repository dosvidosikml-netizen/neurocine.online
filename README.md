# NeuroCine Online Studio — Full Site v2

Полный Next.js проект со структурой:

- `/app/page.js` — главный экран
- `/app/chat/page.js` — чат/генератор сценария
- `/app/storyboard/page.js` — Storyboard Studio
- `/app/api/chat/route.js` — API чат-генерации
- `/app/api/storyboard/route.js` — API storyboard JSON
- `/engine/sceneEngine.js` — локальный fallback pipeline + нормализация
- `/components/*` — UI компоненты студии

## Запуск

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Открыть:

```txt
http://localhost:3000
```

## Важно

Если API ключ не задан, storyboard всё равно работает через локальный fallback pipeline.

## NeuroCine V43 — User Profiles / Roles / Cloud Projects

Added full user layer on top of Google Login + Supabase:

- Account dashboard in Studio
- Roles: demo, free, pro, admin, byo_api
- Access matrix: DEMO mock, FREE live lock, PRO live, BYO API, ADMIN
- Supabase Cloud Projects: save/open/delete full NeuroCine project snapshots
- New SQL migration: `supabase/schema_v43_profiles_projects.sql`

Run the SQL file in Supabase SQL Editor after deploy.


## NeuroCine V44 Cloud Studio Update

Added full Supabase Cloud Studio schema and hardened Cloud Projects save/load.

Run this SQL once in Supabase SQL Editor after deploy:

```txt
supabase/schema_v44_full_cloud_studio.sql
```

This migration is safe to run multiple times. It creates or extends:
- `profiles`
- `projects`
- `user_settings`
- `usage_events`
- `api_keys`
- auth/profile triggers
- updated_at triggers
- RLS policies

Cloud Projects now stores full NeuroCine project snapshots plus indexed fields: topic, script, storyboard, duration, aspect ratio, style preset, mode, target and Production Pack cache.
