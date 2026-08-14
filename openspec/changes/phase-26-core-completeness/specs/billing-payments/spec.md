## ADDED Requirements

### Requirement: Deposit From Proposal And Client Pay
The system SHALL capture the deposit through existing processors when the client completes Proposal sign-and-pay or `/client/pay`. Guests SHALL NOT create Payment Entries.

#### Scenario: Proposal deposit
- **WHEN** a customer completes Proposal payment for the required deposit percent
- **THEN** a Payment Entry (or processor equivalent) is recorded against the deposit invoice using `flt` and webhook reconciliation rules already in force

#### Scenario: Guest payment rejected
- **WHEN** a guest submits a pay API for the booking
- **THEN** the call is 403 and no processor charge is created
