# NeuroCine — SaaS Studio

Current build: **v61 Billing / PRO Activation Foundation** on top of v62–v63 Studio UI polish and v55–v60 Core SaaS Hardening.

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
```

## Important ENV

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
API_KEY_ENCRYPTION_SECRET=

# Optional billing foundation
BILLING_CHECKOUT_URL=
NEXT_PUBLIC_PRO_CHECKOUT_URL=
BILLING_WEBHOOK_SECRET=
```

## Important SQL migrations

Latest optional billing migration:

```txt
supabase/schema_v61_billing_pro_activation.sql
```

Core migrations already used:

```txt
supabase/schema_v54_public_ux_key_vault_access_guard.sql
supabase/schema_v55_60_core_saas_hardening.sql
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
```

## Billing v61

v61 does not force a payment provider. If `BILLING_CHECKOUT_URL` is empty, the PRO button creates/logs a manual request and OWNER can activate PRO from Admin Panel. A real provider can later call `/api/billing/webhook` with `BILLING_WEBHOOK_SECRET`.
