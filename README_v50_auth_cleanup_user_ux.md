# NeuroCine v50 — Auth Cleanup + Normal User UX

Заменить файлы:

- app/storyboard/page.js
- components/AuthPanel.js
- components/UserDashboard.js
- .env.example
- README.md

Что исправлено:

- Обычный DEMO/FREE пользователь больше не может визуально переключаться в LIVE LOCK.
- В topbar и профиле обычному пользователю показывается только DEMO MODE.
- LIVE lock вынесен как понятный статус доступа, а не как активный режим.
- OWNER/ADMIN остаётся в LIVE автоматически.
- Вход остаётся через Supabase Auth, без прямого Google OAuth route.
- Render больше не должен требовать GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET для входа.
- SQL не нужен, если уже выполнен repair для profiles/auth trigger.

Проверка:

1. Войти админом → должен быть LIVE OWNER / ADMIN, без LIVE LOCK.
2. Войти обычным пользователем → должен быть DEMO, LIVE заблокирован текстом, без активного переключателя LIVE.
3. Войти третьим новым аккаунтом → профиль создаётся, режим DEMO.
4. DEMO генерация не списывает API.
