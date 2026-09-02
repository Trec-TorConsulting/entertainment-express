## ADDED Requirements

### Requirement: Accounting Money Without Desk
`EE Accounting` SHALL refund, hold, and split balances from `/employee/accounting` without Desk. Crew SHALL NOT refund or place holds.

#### Scenario: Crew cannot refund
- **WHEN** an `EE Crew` user requests a refund
- **THEN** access is denied
