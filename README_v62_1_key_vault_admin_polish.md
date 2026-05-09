# NeuroCine v62.1 — Key Vault + Admin Panel Polish

## Цель
Доработка без платежки: довести PRO/FREE/OWNER UX, Key Vault и OWNER Admin Panel до понятного состояния.

## Что изменено

- PRO без ключа больше не выглядит как FREE: статус показывает `PRO · ключ нужен`.
- После проверки OpenRouter key UI показывает отдельный статус: ключ проверен, можно сохранить.
- После сохранения ключа показывается `LIVE включён`, `API source: user key`.
- Удаление ключа возвращает PRO в состояние `LIVE ждёт AI-ключ`.
- Верхний переключатель режима больше не пишет `FREE` для PRO без ключа.
- Admin Panel получила фильтр FREE/PRO/ADMIN/AI keys, быстрые статистики и последние billing-заявки.
- Admin Panel показывает PRO LIVE / PRO KEY PENDING / FREE / OWNER.
- Admin API теперь возвращает последние billing_events и привязывает последний event к пользователю.
- PRO по-прежнему не использует platform API владельца.
- OWNER по-прежнему использует Render ENV platform API.

## Изменённые файлы

- `components/UserDashboard.js`
- `components/AdminPanel.js`
- `app/api/admin/users/route.js`
- `app/api/user-keys/route.js`
- `app/storyboard/page.js`
- `app/globals.css`

## SQL
Не нужен. Используются таблицы и поля, уже созданные в v54 / v55-v60 / v61.

## ENV
Ничего нового не требуется. Нужны уже добавленные переменные:

- `API_KEY_ENCRYPTION_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` для OWNER

## Проверка после deploy

1. FREE user: видит FREE Preview, не видит OWNER, не может LIVE.
2. PRO без ключа: видит `PRO · ключ нужен`, AI Key Vault, LIVE ждёт ключ.
3. PRO с ключом: после сохранения OpenRouter key видит `PRO LIVE`, LIVE готов.
4. OWNER: видит Admin Panel, статистики, billing requests, пользователей.
5. Admin Panel: фильтр, поиск, выдать PRO, забрать PRO работают.
