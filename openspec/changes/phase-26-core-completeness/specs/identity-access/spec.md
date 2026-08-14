## ADDED Requirements

### Requirement: Proposal Money Is Payer-Only
The system SHALL allow Proposal accept, contract sign, and deposit pay only for the booking’s `EE Customer` (or a valid signing token bound to that contract). `EE Event Guest` SHALL NOT gain `EE Customer` via proposal links.

#### Scenario: Guest token cannot pay
- **WHEN** a guest uses an invite link and calls sign-and-pay
- **THEN** the request is denied and the Quotation is unchanged
