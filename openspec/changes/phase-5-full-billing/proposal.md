# Change: Phase 5 — Full Billing & Multi-Processor Payments

## Why
Phase 1 collects a single Stripe deposit. Real operators need balance schedules, refunds, tips, saved cards,
damage holds, installments, and a processor plugin model — with ERPNext GL always in balance.

## What Changes
Payment schedules (deposit + balance), balance reminders with pay links, Stripe refunds and tips, stored
payment methods (token + brand/last4 only), card pre-authorization (manual capture), installment plans with
scheduled charges, a processor adapter interface. Square, PayPal, ACH, and Authorize.Net adapters are
implemented as first-class plugins that refuse to charge unless credentials are configured (no silent success).

## Impact
- New billing DocTypes; extend Sales Invoice / Payment Entry usage; scheduler for due dates and installments.
- Stripe Checkout/PaymentIntent extended for tips, setup of future usage, and captures.
- Depends on: phase-1 invoices + Stripe webhook.

## Non-Goals
- SaaS subscription billing (phase-12).
- Insurance policy products (phase-17) beyond the damage-hold primitive.

## Requirements delivered
- `billing-payments`: Deposits & Payment Schedules; Multi-Processor Payments (Stripe live; others pluggable);
  Webhook Reconciliation (chargeback/fail); Refunds; Tips; Accounting Integrity; Security/Damage Pre-Auth;
  Installments; Additional Processors (adapter + config, live charge when keys present).
