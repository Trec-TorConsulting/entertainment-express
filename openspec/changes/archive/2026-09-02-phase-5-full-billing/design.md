# Design: Phase 5 — Full Billing & Multi-Processor Payments (portals)

## Context

Schedules, refunds, holds, installments, and processor stubs already exist. UI is Stripe-only checkout plus an invoice list. Non-Stripe `charge`/`refund` raise “not implemented” even when keys are set.

## Decisions

1. **Reuse `billing.py`.** `portal_billing.py` wraps it with owner/accounting vs payer splits. Crew 403 on refund/hold.
2. **Hosted checkout per processor.** Each plugin returns a `checkout_url` when configured. ACH uses Stripe Checkout `us_bank_account`. Unconfigured → `ProcessorNotConfigured` (never a silent success).
3. **Webhook.** `api/billing_webhooks.py` verifies HMAC (`EE_{PROC}_WEBHOOK_SECRET`), dedupes on `Stripe Processed Event` name `{processor}:{id}`, then the existing Payment Entry reconcile path. Stripe’s existing endpoint stays.
4. **UI.** Owner Money + employee Money: refund, hold, installments, schedule. Client Pay: processor + optional tip. Connections group “Payments”.
5. **Installments.** Daily job charges due installment rows that have a stored token; otherwise the existing reminder fires.
6. **Image** `0.0.77-ee` → `0.0.78-ee`.

## Risks

- [Processor sandbox quirks] → fail closed; staff can still record a manual Payment Entry later.
- [Webhook spoof] → unsigned events rejected; duplicates no-op.
