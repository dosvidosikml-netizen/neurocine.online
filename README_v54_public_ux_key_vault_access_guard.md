# NeuroCine v54 — Public UX + AI Key Vault + Access Guard

## Что изменено

v54 объединяет три больших слоя:

1. **Public UX Cleanup**
   - FREE-пользователь больше не видит технические слова `OWNER`, `ADMIN`, `BYO API`, `mock`, `platform API`, `API не списываются`.
   - Обычному пользователю показывается продуктовая схема: FREE для знакомства, PRO для полного рабочего режима.
   - OWNER-блоки видны только владельцу/админу.

2. **AI API Key Vault**
   - Добавлен UI-блок `AI API Keys` в профиле.
   - Первый поддержанный провайдер: OpenRouter.
   - Ключ проверяется через `/api/user-keys/test`.
   - Ключ сохраняется через `/api/user-keys` в Supabase в зашифрованном виде.
   - Полный ключ обратно в браузер не возвращается, только masked/last4.

3. **Server-side Access Guard**
   - OpenRouter endpoints теперь получают API key через серверный guard.
   - FREE/DEMO не может вызвать реальные AI API.
   - PRO может вызвать LIVE только при подключённом собственном ключе.
   - OWNER/ADMIN использует `OPENROUTER_API_KEY` из Render ENV.

## Новые файлы

```txt
lib/serverSupabase.js
lib/apiKeyCrypto.js
lib/apiAccess.js
app/api/user-keys/route.js
app/api/user-keys/test/route.js
app/api/user-keys/delete/route.js
supabase/schema_v54_public_ux_key_vault_access_guard.sql
README_v54_public_ux_key_vault_access_guard.md
```

## Изменённые основные файлы

```txt
app/storyboard/page.js
components/AuthPanel.js
components/UserDashboard.js
components/ProductionPack.js
lib/accountRoles.js
lib/modelRouter.js
app/api/chat/route.js
app/api/storyboard/route.js
app/api/explore/route.js
app/api/music-suno/route.js
app/api/seo-pack/route.js
app/api/social-pack/route.js
app/api/tts-studio/route.js
app/globals.css
.env.example
.env.local.example
README.md
```

## ENV Render

Добавить в Render → Environment:

```txt
API_KEY_ENCRYPTION_SECRET=<длинный_секрет_32+_символа>
```

Пример генерации секрета локально:

```bash
openssl rand -base64 48
```

Не показывать этот секрет в скринах.

## SQL Supabase

После деплоя выполнить:

```txt
supabase/schema_v54_public_ux_key_vault_access_guard.sql
```

Он создаёт:

```txt
public.user_api_keys
RLS policies
trigger защиты profiles от self-upgrade
поля api_keys_connected / api_key_status / pro_api_note
```

## Как выдать PRO вручную для теста

В Supabase SQL Editor:

```sql
update public.profiles
set plan = 'pro', role = 'user', default_mode = 'demo', cloud_project_limit = 100, updated_at = now()
where lower(email) = lower('user@example.com');
```

После этого пользователь увидит блок подключения AI-ключа. LIVE включится только после сохранения валидного OpenRouter key.

## Проверка после деплоя

### Гость
- Видит экран входа.
- Рабочая зона скрыта.
- API недоступны.

### FREE
- Видит FREE Preview.
- Видит: `LIVE-генерация доступна в PRO`.
- Не видит OWNER/ADMIN/BYO/API-технический текст.
- Реальные AI API не вызываются.

### PRO без ключа
- Видит PRO Studio.
- Видит блок AI API Keys.
- LIVE просит подключить ключ.
- Твой `OPENROUTER_API_KEY` не используется.

### PRO с ключом
- OpenRouter подключён.
- LIVE включён через ключ пользователя.

### OWNER
- `dosvidosikml@gmail.com` видит OWNER FULL ACCESS.
- LIVE идёт через `OPENROUTER_API_KEY` Render ENV.

## Проверка синтаксиса

```txt
node --check прошёл по всем JS-файлам app/components/engine/lib
```
