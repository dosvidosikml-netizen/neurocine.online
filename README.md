# NeuroCine Online Studio

Актуальная сборка: **v55–v60 Core SaaS Hardening**.

NeuroCine — AI production studio: сценарий → storyboard JSON → PART pipeline → video prompts → Production Pack → Cloud Projects.

## Access model

- **FREE** — preview/демо после Google login, Cloud Projects до лимита, без real platform API.
- **PRO** — полный workflow и LIVE через собственные AI API-ключи пользователя.
- **OWNER / ADMIN** — служебный доступ владельца, LIVE через platform API из Render ENV.

## Important ENV

```env
NEXT_PUBLIC_SITE_URL=https://neurocine.online
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_ADMIN_EMAILS=dosvidosikml@gmail.com
ADMIN_EMAILS=dosvidosikml@gmail.com
OPENROUTER_API_KEY=owner_platform_key
API_KEY_ENCRYPTION_SECRET=long_random_secret_32_chars_min
SUPABASE_SERVICE_ROLE_KEY=server_only_for_owner_admin_panel
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in `NEXT_PUBLIC_*`.

## SQL

Latest SQL:

```txt
supabase/schema_v55_60_core_saas_hardening.sql
```

Old migration notes are archived in `docs/archive/`.
