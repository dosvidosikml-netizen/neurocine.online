# NeuroCine v62.2 — Billing Request Reliability Fix

Исправляет ручную заявку PRO:

- `/api/billing/checkout` больше не показывает успех, если `billing_events` не записался.
- Если нет `SUPABASE_SERVICE_ROLE_KEY`, пользователь увидит ошибку вместо ложного успеха.
- При успешной заявке создаётся запись в `billing_events` и обновляется `profiles.billing_status = pro_requested`.
- Admin Panel всегда показывает блок последних billing-заявок, даже если список пустой.
- В строке пользователя показывается последняя заявка.

SQL не нужен. ENV новых нет.
