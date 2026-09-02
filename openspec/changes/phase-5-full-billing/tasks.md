# Tasks: Phase 5 — Full Billing & Multi-Processor Payments

> Backend schedules/refunds/holds exist. This pass is processors, portals, and isolation tests.

## 1. Processors + portal API
- [x] 1.1 Hosted checkout + refund on Square, PayPal, ACH, Authorize.Net; unconfigured stays closed.
- [x] 1.2 Signed processor webhook with event-id dedupe and Payment Entry reconcile.
- [x] 1.3 `api/portal_billing.py`: schedule, refund, hold, installments, checkout. Guests 403. Crew cannot refund.

## 2. UI
- [x] 2.1 `/owner/money` and `/employee/accounting`: refund, hold, split, schedule. Connections: payment processors.
- [x] 2.2 `/client/pay`: processor + tip. Rebuild owner, employee, customer SPAs.

## 3. Tests + ship
- [x] 3.1 `tests/test_phase5_surfaces.py`; skip live `test_phase5.py` without migrate.
- [x] 3.2 Patch `phase5_full_billing`; image `0.0.77-ee` → `0.0.78-ee`; ROADMAP linked.

## Definition of Done
Owner refunds and splits a balance without Desk. Client pays via a connected processor with an optional tip. Unconfigured processors never charge. Guests 403. Duplicate webhooks apply once.
