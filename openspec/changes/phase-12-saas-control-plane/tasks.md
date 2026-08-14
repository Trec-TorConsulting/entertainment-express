# Tasks: Phase 12 — SaaS Control Plane (Full)

## 1. DocTypes
- [x] 1.1 Subscription, Usage Record (append-only), SaaS Invoice.
- [x] 1.2 Plan fields: price_annual, stripe prices, grace_days.

## 2. Billing & lifecycle
- [x] 2.1 Stripe subscription Checkout + webhook reconciliation (idempotent).
- [x] 2.2 Trial → active; payment fail → past_due → suspend after grace; cancel at period end.
- [x] 2.3 Plan change re-applies entitlements; `require_entitlement`.
- [x] 2.4 Suspend/resume/deprovision; tenant site API 403 when suspended.

## 3. Metering & fleet
- [x] 3.1 Daily metering collect + Usage Record; overage hook.
- [x] 3.2 Operator `fleet_dashboard` API.

## 4. Tests
- [x] 4.1 Subscription state machine (paid / failed / cancel).
- [x] 4.2 Suspended tenant blocked; entitlement deny.
- [x] 4.3 Usage records append-only (amend raises).

## Definition of Done
A tenant can start a trial, convert via Stripe, be dunned and suspended, and the operator can see fleet MRR and health.
