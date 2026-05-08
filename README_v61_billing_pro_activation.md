# NeuroCine v61 — Payments / PRO Activation Foundation

This update adds the billing foundation without locking the project to one payment provider.

## What changed

- Public billing/pricing panel in Studio.
- FREE users can request/launch PRO checkout.
- OWNER can still manually grant PRO from Admin Panel.
- Generic secure webhook route for a future payment provider.
- Billing ledger tables: `billing_events`, `billing_subscriptions`.
- Profile billing fields: `billing_status`, `billing_provider`, `pro_activated_at`, etc.

## New API routes

- `POST /api/billing/checkout`
- `GET /api/billing/status`
- `POST /api/billing/webhook`

## Required ENV already used from previous versions

```txt
SUPABASE_SERVICE_ROLE_KEY=...
```

## Optional ENV for external checkout

```txt
BILLING_CHECKOUT_URL=https://your-payment-page.example/checkout
NEXT_PUBLIC_PRO_CHECKOUT_URL=https://your-payment-page.example/checkout
```

If no checkout URL is set, the site stays in manual PRO activation mode: the request is logged, and OWNER can grant PRO in Admin Panel.

## Optional ENV for generic webhook

```txt
BILLING_WEBHOOK_SECRET=long_random_secret
```

Webhook requests must include:

```txt
x-neurocine-billing-secret: <BILLING_WEBHOOK_SECRET>
```

Example payload:

```json
{
  "email": "user@example.com",
  "plan": "pro",
  "status": "paid",
  "provider": "external",
  "provider_event_id": "payment_123"
}
```

## SQL

Run once in Supabase SQL Editor:

```txt
supabase/schema_v61_billing_pro_activation.sql
```

## Important

This is a provider-neutral billing foundation. Real automatic payments need one selected provider later: Stripe, WayForPay, LiqPay, Fondy, Mono, etc.
