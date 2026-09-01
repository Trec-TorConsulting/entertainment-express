## ADDED Requirements

### Requirement: Customer Checkout On Own Invoice
The system SHALL allow an `EE Customer` to create a Stripe Checkout session only for a Sales Invoice whose Customer matches that user’s customer record. Staff roles keep existing checkout access. Guests SHALL be denied.

#### Scenario: Payer checkout
- **WHEN** the customer of invoice `SINV-1` starts checkout
- **THEN** a Checkout session is created for `SINV-1`

#### Scenario: Other customer denied
- **WHEN** a different customer starts checkout on `SINV-1`
- **THEN** access is denied and no Stripe session is created
