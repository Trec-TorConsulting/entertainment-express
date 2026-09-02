## Context
B2B schools/HOAs need PO + net terms; consumer gift cards drive off-season revenue.

## Goals / Non-Goals
**Goals:** Gift card DocType; store credit; late fee job; terms on Customer/Quote.
**Non-Goals:** Complex loyalty points tiers; Affirm/Klarna (optional later).

## Decisions
### D1 — EE Gift Card + EE Store Credit Entry
Gift card: code, balance, expiry; credit: customer ledger entries. Redemption creates Payment Entry / credit note via ERPNext with `flt`.

### D2 — Late fees
Scheduler: overdue invoice past grace → fee item invoice; idempotent per period.

### D3 — Terms
Customer `ee_payment_terms` net_0|net_15|net_30; Quote/Invoice `po_number`; due date from terms.

### D4 — Files
`api/commerce.py`, tests `test_phase33_commerce.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
