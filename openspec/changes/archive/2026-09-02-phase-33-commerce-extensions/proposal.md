## Why

HoneyBook and rental platforms support gift cards, store credit, late fees, and B2B terms (PO/net-30). EE has deposits, installments, tips, and multi-processors but not these commerce extensions.

## What Changes

- Gift cards and store credit ledgers with redemption on invoices.
- Configurable late fees on overdue balances.
- Corporate payment terms: net-15/30, PO number on quotes/invoices.
- Non-goals: new payment processors; cryptocurrency.

## Capabilities

### New Capabilities

- `commerce-extensions`: Gift cards, store credit, late fees, net-30 / PO corporate terms on top of existing billing.

### Modified Capabilities

- `billing-payments`: Apply gift card/credit; assess late fees; net terms due dates.
- `crm`: PO number and payment terms on quote/proposal.
- `customer-portal`: Redeem gift card; view store credit; pay within terms.
- `owner-portal`: Issue gift cards/credit; configure late fee and terms.
- `reporting-bi`: Gift card liability and aged receivables views.
- `identity-access`: Guests cannot redeem or view another customer's credit.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
