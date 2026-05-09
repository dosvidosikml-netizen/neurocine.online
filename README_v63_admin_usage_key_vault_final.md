# NeuroCine v63 — Admin + Usage + Key Vault Final Check

## Что добавлено

- Admin Panel теперь показывает usage analytics: последние API-события, источник API, модель, статус OK/error.
- Admin API отдаёт `usage_events`, usage summary и per-user usage counters.
- Добавлен `lib/usageLogger.js` — best-effort server-side логирование без риска сломать генерацию.
- Логируются основные endpoints: script, storyboard, video prompt, cover, music, SEO, social, TTS, explore, key vault test/save/delete, analyze stub.
- В списке пользователей видно usage count, usage errors и последний endpoint.
- SQL v63 добавляет недостающие поля в `usage_events` безопасно и не удаляет данные.

## После деплоя

Выполнить в Supabase SQL Editor:

```txt
supabase/schema_v63_admin_usage_key_vault_final.sql
```

ENV новые не нужны. Требуется уже существующий:

```txt
SUPABASE_SERVICE_ROLE_KEY
API_KEY_ENCRYPTION_SECRET
```

## Проверка

1. OWNER → открыть Admin Panel → должен появиться блок `Последние usage events`.
2. Сделать любую генерацию или нажать test key.
3. Нажать `Обновить` в Admin Panel.
4. Событие должно появиться в usage.

Если `usage_events` пусто — это нормально до первой генерации после v63.
