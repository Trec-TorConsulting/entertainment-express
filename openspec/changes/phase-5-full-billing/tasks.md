# Tasks: Phase 5 — Full Billing

## 1. DocTypes & processors
- [x] 1.1 Payment Schedule + milestones; EE Refund; Stored Payment Method.
- [x] 1.2 Processor interface + Stripe implementation + configured-or-error plugins for Square/PayPal/ACH/Authorize.Net.

## 2. Money flows
- [x] 2.1 Create schedule (deposit + balance) on booking confirm; balance reminder + pay link.
- [x] 2.2 Checkout tips + optional save card (token only).
- [x] 2.3 Refunds through Stripe + EE Refund + GL.
- [x] 2.4 Damage hold pre-auth, capture, release.
- [x] 2.5 Installment split + scheduled charge + retry/flag.
- [x] 2.6 Webhook: failed payment / dispute updates status and alerts staff.

## 3. Tests
- [x] 3.1 Schedule amounts sum to grand_total.
- [x] 3.2 Refund rejects over-refund; stored method stores last4 not PAN.
- [x] 3.3 Unconfigured processor raises ProcessorNotConfigured.
- [x] 3.4 Isolation: cannot refund another site's invoice.

## Definition of Done
A booking has a visible schedule, customers can pay balance with tip, staff can refund and release a hold, books stay balanced.
