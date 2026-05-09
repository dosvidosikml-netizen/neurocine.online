# NeuroCine v61.1 — Billing Public UX Fix

Patch after v61 Billing foundation.

## Fixed

- OWNER billing card is no longer visible to FREE/PRO users.
- FREE users now see only public FREE/PRO tariff information.
- The "Купить / активировать PRO" button now gives immediate visible feedback.
- In manual billing mode the button changes to "Заявка отправлена" after a successful request.
- No SQL migration is required.

## Changed files

- `components/BillingPanel.js`
- `README_v61_1_billing_public_fix.md`

## Notes

Real payment provider integration still comes later. Current mode is manual PRO request + OWNER activation in Admin Panel.
