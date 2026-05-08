# NeuroCine v47 — DEMO topic-safe mock + stuck generation fix

Changed files:
- `app/storyboard/page.js`
- `lib/mockData.js`
- `README.md`

Fixes:
- DEMO script no longer always returns old Tunguska text.
- DEMO mock script is now generated from the current topic.
- DEMO storyboard follows the current topic instead of old Siberia frames.
- Switching DEMO/LIVE resets stuck generation flags.
- DEMO script/storyboard branch force-stops busy state so UI cannot hang on “Генерация…”.

No SQL changes required if v44/v45 schema was already applied.


## v48 Admin Owner Access

Добавлено:
- OWNER/ADMIN распознаётся по email `dosvidosikml@gmail.com` и по ENV `NEXT_PUBLIC_ADMIN_EMAILS`.
- OWNER всегда получает LIVE доступ без BYO ключей и без лимитов.
- Для обычных пользователей остаётся DEMO/FREE/LIVE LOCK.

Render ENV:
```txt
NEXT_PUBLIC_ADMIN_EMAILS=dosvidosikml@gmail.com
ADMIN_EMAILS=dosvidosikml@gmail.com
```

После деплоя: выйти из аккаунта и войти через Google заново.
SQL: можно выполнить `supabase/schema_v48_admin_owner_access.sql` целиком, чтобы профиль владельца сразу стал admin в Supabase.
