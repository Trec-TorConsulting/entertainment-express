## Why

Money still bottoms out on Stripe checkout and Desk invoices. Owners cannot refund, split a balance, or place a damage hold from `/owner/money`. Clients cannot pick Square, PayPal, ACH, or Authorize.Net even when those processors are connected. Unconfigured processors must keep failing closed.

## What Changes

- Keep `api/billing.py`, Stripe checkout/webhooks, and processor plugins. Add `api/portal_billing.py` for `/owner`, `/employee`, and `/client` (invoice/pay language, never DocType names).
- Implement hosted checkout + refund on Square, PayPal, ACH (Stripe bank), and Authorize.Net when keys exist; otherwise `ProcessorNotConfigured`.
- Generic processor webhook: verify signature, dedupe by event id, reconcile Payment Entry once. Guests cannot refund, hold, or start checkout.
- `/owner/money` and `/employee/accounting`: refund, damage hold capture/release, installment split, payment schedule. `/client/pay`: processor + tip. Connections lists payment processors.
- No `frappe.connect` / `frappe.init`. Image `0.0.77-ee` → `0.0.78-ee`.

## Impact

- Frontends: owner, employee, customer SPAs.
- Tests: `tests/test_phase5_surfaces.py`; live `test_phase5.py` skips without migrate.
- Patch `v0_0_3.phase5_full_billing`.
- Depends on: phase-1 Stripe subset, phase-12 connections.

## Non-Goals

- SaaS subscription billing (`saas-control-plane`).
- Storing PAN. Tokens + last4 only.
- New payment brands beyond Stripe, Square, PayPal, ACH, Authorize.Net.

## Requirements delivered

- `billing-payments`: deposits/schedules, multi-processor, webhooks, refunds, tips, accounting integrity, damage holds, installments, Authorize.Net, client pay, guest denied.
- `owner-portal` / `employee-portal` / `customer-portal`: money without Desk.
