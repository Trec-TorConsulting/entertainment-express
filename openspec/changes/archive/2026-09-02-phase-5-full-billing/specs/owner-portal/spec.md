## ADDED Requirements

### Requirement: Money Without Desk
The owner portal SHALL refund invoices, place/capture/release damage holds, split a balance into installments, and view a job’s payment schedule on `/owner/money` without Desk.

#### Scenario: Owner refunds a deposit
- **WHEN** an `EE Tenant Admin` refunds part of a paid invoice
- **THEN** the refund is sent through the original processor and recorded on this site only

#### Scenario: Guest denied
- **WHEN** a guest calls a money API
- **THEN** access is denied
