# NeuroCine v63 — Admin + Usage + Key Vault Final Check

Актуальная сборка: SaaS Studio с FREE / PRO Own Keys / OWNER доступом, Cloud Projects, Billing Foundation, AI Key Vault, Admin Panel и usage analytics.

См. также: `README_v63_admin_usage_key_vault_final.md`.

---

## Current access model

```txt
FREE / DEMO
- preview access
- Cloud Projects limited
- no LIVE platform API

PRO
- full Studio workflow
- LIVE only through user's own AI API key
- no use of OWNER platform API

OWNER / ADMIN
- platform API from Render ENV
- Admin Panel
- manual PRO activation
- usage analytics
```

## Important ENV

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
API_KEY_ENCRYPTION_SECRET=
ADMIN_EMAILS=
NEXT_PUBLIC_ADMIN_EMAILS=
NEXT_PUBLIC_SITE_URL=

# Optional future billing provider
BILLING_CHECKOUT_URL=
NEXT_PUBLIC_PRO_CHECKOUT_URL=
BILLING_WEBHOOK_SECRET=
```

## Latest SQL migration

Run after deploy:

```txt
supabase/schema_v63_admin_usage_key_vault_final.sql
```

Core migrations already used:

```txt
supabase/schema_v54_public_ux_key_vault_access_guard.sql
supabase/schema_v55_60_core_saas_hardening.sql
supabase/schema_v61_billing_pro_activation.sql
supabase/schema_v62_63_studio_ui_production_pack_polish.sql
```

## Main files

```txt
app/storyboard/page.js
components/UserDashboard.js
components/BillingPanel.js
components/AdminPanel.js
components/CloudProjectsPanel.js
components/ProductionPack.js
components/StudioFlowPanel.js
lib/accountRoles.js
lib/apiAccess.js
lib/serverSupabase.js
lib/usageLogger.js
```

## v63 notes

- Admin Panel shows recent `billing_events` and `usage_events`.
- Usage events are best-effort; failed logging never breaks generation.
- PRO users must connect their own AI API key for LIVE.
- OWNER uses platform API from Render ENV.
- FREE does not use real AI API.

## v64 — Mobile AI App Shell + Create Hub

Добавлена мобильная оболочка AI Video Factory: верхняя панель, нижняя навигация, центральная кнопка `+`, Create Hub, Side Drawer и Tools Registry. Это UX-фундамент для будущих инструментов: Motion Control, Lip Sync, AI Avatar, Text-to-Video, Smart Edit и Workflow Builder.

SQL и ENV не требуются.

## v65 — Quick Storygrid + Viral Shorts Tools

Добавлен блок `Быстрый старт` для мобильной AI Video Factory:

- Quick Storygrid: идея → длина → формат → сцены → стиль → storyboard
- Viral Shorts: hook, структура, cover text, TTS, music, SEO и hashtags
- новые карточки в Create Hub / Tools Registry
- без новых API, SQL и ENV

Подробности: `README_v65_quick_storygrid_viral_tools.md`
