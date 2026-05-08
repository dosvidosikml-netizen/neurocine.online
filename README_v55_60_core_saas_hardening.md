# NeuroCine v55–v60 Core SaaS Hardening

Большой контролируемый пакет поверх v54.

## Что вошло

- v55 PRO/FREE UX cleanup: PRO без ключа больше не выглядит как FREE, статус показывает `PRO активен · LIVE ждёт AI-ключ`.
- v56 server-side API guard: дорогие AI endpoints уже требуют access guard, а локальные `/api/video`, `/api/cover`, `/api/analyze` теперь требуют авторизованного пользователя.
- v57 Cloud Project Manager: поиск, rename, duplicate, delete, open, save as new.
- v58 Production Pack Cloud Save: изменения Production Pack теперь триггерят Cloud autosave через production cache tick; cache входит в snapshot.
- v59 Admin Panel basic: OWNER-видимый блок пользователей и API `/api/admin/users` для ручного FREE/PRO/ADMIN.
- v60 Repo Cleanup: старые README/AUTO_CHAIN перенесены в `docs/archive/`, корень проекта чище.

## Новые / изменённые файлы

- `app/storyboard/page.js`
- `app/globals.css`
- `components/AuthPanel.js`
- `components/UserDashboard.js`
- `components/CloudProjectsPanel.js`
- `components/ProductionPack.js`
- `components/AdminPanel.js`
- `lib/apiAccess.js`
- `lib/serverSupabase.js`
- `lib/ownerGuard.js`
- `app/api/admin/users/route.js`
- `app/api/video/route.js`
- `app/api/cover/route.js`
- `app/api/analyze/route.js`
- `.env.example`
- `.env.local.example`
- `supabase/schema_v55_60_core_saas_hardening.sql`

## ENV

Key Vault уже требует:

```env
API_KEY_ENCRYPTION_SECRET=long_random_secret_32_chars_min
```

Для OWNER Admin Panel basic добавь в Render только на сервере:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Не добавляй service role key в `NEXT_PUBLIC_*` и не показывай его на скринах.

## SQL

После deploy можно выполнить:

```txt
supabase/schema_v55_60_core_saas_hardening.sql
```

SQL безопасный: ничего не удаляет, только добавляет/нормализует нужные поля и индексы.

## Проверка

1. Гость: рабочая зона закрыта.
2. FREE: видит FREE Preview, LIVE доступен в PRO, real AI не вызывается.
3. PRO без ключа: видит PRO активен, LIVE ждёт AI-ключ.
4. PRO с ключом: LIVE работает через user key.
5. OWNER: видит Admin Panel и использует platform key.
6. Cloud Projects: search / rename / duplicate / delete / open.
7. Production Pack: результат попадает в cloud snapshot при autosave/save.
