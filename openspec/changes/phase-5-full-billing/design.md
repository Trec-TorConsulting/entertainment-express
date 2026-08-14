# Design: Phase 5 — Full Billing

## A. Data model

| DocType | Key fields |
|---|---|
| Payment Schedule | booking, policy_name, status, milestones (child) |
| Payment Schedule Milestone | kind (`deposit`/`balance`/`installment`/`damage_hold`), due_date, amount, invoice, status |
| EE Refund | payment_entry, invoice, amount, reason, processor, processor_refund_id, status |
| Stored Payment Method | customer, processor, processor_customer_id, processor_payment_method_id, brand, last4, exp_month, exp_year, is_default |
| Processor Settings | Single: enabled processors, credentials via env (`EE_STRIPE_*`, `EE_SQUARE_*`, `EE_PAYPAL_*`, `EE_ACH_*`, `EE_AUTHORIZENET_*`) — never stored in DocType |

Sales Invoice: `ee_tip_amount`, `ee_is_balance`, `ee_is_damage_hold`, `ee_payment_intent_id`.
Payment Entry: `ee_processor`, `ee_processor_txn_id`, `ee_tip_amount`.

## B. Processor interface

`billing_payments.processors.base.Processor`: `charge`, `refund`, `save_method`, `preauth`, `capture`, `release`.
Stripe implements all. Square/PayPal/ACH/Authorize.Net implement the interface and `raise ProcessorNotConfigured` unless env keys exist; when keys exist they call the real HTTP APIs.

## C. Flows

1. On booking confirm: existing deposit invoice **and** Payment Schedule (deposit + balance due `balance_days_before_event`, default 7).
2. Daily: unpaid milestones due in 3 days → `balance_reminder` with checkout link.
3. `create_checkout` accepts `tip_amount`, `save_card`, `milestone`.
4. Refunds: Stripe Refund API + EE Refund + Payment Entry reverse / GL via ERPNext.
5. Pre-auth: PaymentIntent `capture_method=manual`; capture/release APIs.
6. Installments: split remaining balance into N milestones; charge saved method on due date; retry once next day then flag.

## D. Security

No PAN. Webhooks stay signature-verified. Isolation: invoices scoped to site DB.
