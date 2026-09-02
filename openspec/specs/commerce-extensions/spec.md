# Capability: Commerce Extensions

## Purpose
Gift cards, store credit, late fees, and corporate net terms / PO numbers on top of billing-payments.

## Requirements

### Requirement: Gift Cards
The system SHALL issue gift cards with codes, balances, and expiry, redeemable against invoices using `flt` and ERPNext payment documents.

#### Scenario: Redeem gift card
- **WHEN** a customer applies a valid gift card to an open invoice
- **THEN** the balance decreases and the invoice outstanding reduces accordingly

### Requirement: Store Credit
The system SHALL maintain per-customer store credit and allow application to invoices on that customer only.

#### Scenario: Credit applies to owner of credit
- **WHEN** store credit exists for customer A
- **THEN** it cannot be applied to customer B's invoice

### Requirement: Late Fees
The system SHALL optionally assess late fees on overdue invoices after a configured grace period via an idempotent scheduled job.

#### Scenario: Idempotent late fee
- **WHEN** the late-fee job runs twice for the same overdue period
- **THEN** only one late-fee charge exists

### Requirement: Net Terms And PO
The system SHALL support net payment terms and purchase-order numbers on quotes and invoices for corporate customers.

#### Scenario: Net-30 due date
- **WHEN** a customer on net-30 is invoiced
- **THEN** the invoice due date is thirty days from posting (or tenant-configured basis)
