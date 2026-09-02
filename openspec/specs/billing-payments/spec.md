# Capability: Billing & Payments

## Purpose
All money movement for a tenant's customers: deposits/retainers, invoices, payments, refunds, tips, and
accounting. Built on ERPNext Accounting/Selling (Sales Invoice, Payment Entry, GL) with pluggable payment
processors. (SaaS subscription billing that we charge tenants lives in `saas-control-plane`; this capability
is the tenant charging *their* customers.)

### Data Model
- **Sales Invoice** (ERPNext, extended): booking (link), deposit vs balance flag, due_date, event_date.
- **Payment** = ERPNext **Payment Entry** extended: processor (`stripe|square|paypal|ach|manual`),
  processor_txn_id, method, tip_amount, status.
- **Payment Method (stored)**: customer (link), processor token/customer_id, brand/last4 (no PAN), default.
- **Refund**: payment (link), amount, reason, processor_refund_id, status.
- **Payment Schedule**: booking (link), milestones (deposit due, balance due N days before event).

## Requirements

### Requirement: Deposits & Payment Schedules
The system SHALL support configurable deposits/retainers and milestone payment schedules tied to a booking.

#### Scenario: Deposit on confirmation
- **WHEN** a booking is confirmed with a 25% deposit policy
- **THEN** a deposit invoice for 25% is generated and the balance is scheduled per policy (e.g., due 7 days
  before the event)

#### Scenario: Balance auto-reminder
- **WHEN** a balance due date approaches
- **THEN** an automated reminder with a pay link is sent to the customer (see `notifications`)

### Requirement: Multi-Processor Payments
The system SHALL accept payments via Stripe, Square, PayPal, and ACH, tokenizing payment methods and never
storing raw card data.

#### Scenario: Online card payment
- **WHEN** a customer pays an invoice online via the tenant's enabled processor
- **THEN** the charge is processed, a Payment Entry is recorded against the invoice, and the booking balance
  updates

#### Scenario: Saved payment method
- **WHEN** a customer opts to save a card
- **THEN** only a processor token + brand/last4 are stored (no PAN), reusable for future charges

#### Scenario: ACH payment
- **WHEN** a customer pays via ACH/bank transfer
- **THEN** the pending/settled states are tracked and the invoice is marked paid on settlement

### Requirement: Webhook Reconciliation
The system SHALL reconcile payment state from processor webhooks idempotently, verifying signatures and
deduping by event id.

#### Scenario: Webhook marks invoice paid
- **WHEN** a processor sends a `payment_succeeded` webhook
- **THEN** the signature is verified, the event is deduped, and the corresponding invoice/Payment Entry is
  reconciled exactly once

#### Scenario: Disputed/failed payment
- **WHEN** a chargeback or failed-payment webhook arrives
- **THEN** the payment status updates, the booking balance is corrected, and staff are alerted

### Requirement: Refunds
The system SHALL process full/partial refunds through the original processor with an audit trail.

#### Scenario: Partial refund on cancellation
- **WHEN** a booking is canceled with a partially-refundable deposit
- **THEN** the refundable amount is refunded via the original processor and recorded against the payment/GL

### Requirement: Tips & Gratuity
The system SHALL support optional tips/gratuity captured at payment and attributable to crew for payout.

#### Scenario: Tip capture
- **WHEN** a customer adds a tip during checkout
- **THEN** the tip is recorded separately, added to the payment, and made available to HR/payroll for crew
  attribution

### Requirement: Accounting Integrity
The system SHALL keep ERPNext ledgers correct for every financial event and support tax handling and
financial reporting.

#### Scenario: Ledger correctness
- **WHEN** any invoice, payment, refund, or tip is processed
- **THEN** the corresponding GL entries are created through ERPNext so the books always balance

#### Scenario: Tax application
- **WHEN** taxable items are invoiced in a jurisdiction with configured tax rules
- **THEN** the correct tax is applied and reported

### Requirement: Security / Damage Deposits & Card Pre-Authorization
The system SHALL support refundable security/damage deposits via card pre-authorization holds or charges,
with capture, release, or forfeiture (coordinated with `insurance-compliance`).

#### Scenario: Pre-authorization hold
- **WHEN** a booking requires a refundable damage deposit taken as a card hold
- **THEN** a pre-authorization hold is placed (not charged), and on undamaged return it is released; on damage
  the appropriate amount is captured

### Requirement: Installment Payment Plans
The system SHALL support installment payment plans (e.g., split the balance into 3/6/monthly payments) with
automated scheduled charges to a saved payment method.

#### Scenario: Monthly installment plan
- **WHEN** a customer opts into a monthly installment plan for their balance
- **THEN** the balance is split into scheduled installments, each auto-charged on its due date with receipts,
  and failures are retried and flagged

### Requirement: Additional Processors (Authorize.Net)
The system SHALL support Authorize.Net in addition to Stripe, Square, PayPal, and ACH, selectable per tenant.

#### Scenario: Connect Authorize.Net
- **WHEN** a tenant connects Authorize.Net
- **THEN** it becomes a selectable processor for customer payments with the same tokenization and webhook
  reconciliation guarantees

### Requirement: Deposit From Proposal And Client Pay
The system SHALL capture the deposit through existing processors when the client completes Proposal sign-and-pay or `/client/pay`. Guests SHALL NOT create Payment Entries.

#### Scenario: Proposal deposit
- **WHEN** a customer completes Proposal payment for the required deposit percent
- **THEN** a Payment Entry (or processor equivalent) is recorded against the deposit invoice using `flt` and webhook reconciliation rules already in force

#### Scenario: Guest payment rejected
- **WHEN** a guest submits a pay API for the booking
- **THEN** the call is 403 and no processor charge is created

### Requirement: Damage Hold Uses Existing Processor
The system SHALL place, capture, and release damage holds only through the existing billing preauth APIs. Amounts SHALL use `flt`. Guests SHALL NOT call hold APIs.

#### Scenario: Guest denied hold
- **WHEN** an `EE Event Guest` calls create-damage-hold
- **THEN** access is denied and no Payment Intent is created

### Requirement: Unconfigured Processor Never Charges
A processor without credentials SHALL raise a closed-fail error on charge, refund, and hosted checkout. It SHALL NOT record a successful Payment Entry.

#### Scenario: Square not connected
- **WHEN** Square checkout is requested and no Square token is configured
- **THEN** the request is rejected and no Payment Entry is created

### Requirement: Processor Webhook Dedupes
Inbound processor webhooks SHALL verify a signature, ignore duplicates by event id, and reconcile a Payment Entry at most once.

#### Scenario: Duplicate event
- **WHEN** the same processor event is posted twice
- **THEN** the second call reports already processed and does not create another Payment Entry
