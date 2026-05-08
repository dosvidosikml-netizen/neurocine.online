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
- OWNER всегда получает LIVE доступ через platform API без лимитов.
- Для обычных пользователей остаётся DEMO/FREE/LIVE LOCK.

Render ENV:
```txt
NEXT_PUBLIC_ADMIN_EMAILS=dosvidosikml@gmail.com
ADMIN_EMAILS=dosvidosikml@gmail.com
```

После деплоя: выйти из аккаунта и войти через Google заново.
SQL: можно выполнить `supabase/schema_v48_admin_owner_access.sql` целиком, чтобы профиль владельца сразу стал admin в Supabase.


## v50 Auth Cleanup + Normal User UX

- Вход работает только через Supabase Auth / Google Provider.
- Обычный DEMO/FREE пользователь больше не видит активный LIVE-переключатель: только DEMO MODE + отдельное объяснение LIVE lock.
- OWNER/ADMIN получает LIVE автоматически через platform API.
- Локальные черновики остаются разделёнными по `user.id`.
- `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в Render больше не нужны для Supabase OAuth. Google Client ID/Secret должны храниться в Supabase → Authentication → Providers → Google.

После замены файлов: redeploy Render. SQL для v50 не нужен, если профильный SQL repair уже выполнен.

---

## v53 — PRO Own Keys Model

- Убран публичный BYO/API/ADMIN wording.
- Для обычного пользователя: DEMO → PRO.
- PRO теперь означает: доступ к Studio + собственные API-ключи пользователя.
- OWNER/ADMIN остаётся скрытым внутренним режимом владельца.
- Platform API не должны использоваться обычными PRO-пользователями.
- Добавлен SQL `supabase/schema_v53_pro_own_keys.sql` для подготовки полей API-key status.
