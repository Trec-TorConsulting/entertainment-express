## MODIFIED Requirements

### Requirement: Event Cost Sheet Schema Extension
The system SHALL store projected financial metrics alongside actuals on `Event Cost Sheet`, including projected COGS, projected net profit, projected margin %, drift %, and ledger lock status.

#### Scenario: Cost Sheet captures pre-event baseline
- **WHEN** an `Event Booking` is confirmed
- **THEN** `Event Cost Sheet` captures `projected_cogs`, `projected_margin_percent`, and sets `is_ledger_locked = 0` as the baseline comparison anchor

#### Scenario: Post-settlement ledger lock enforcement
- **WHEN** `is_ledger_locked = 1` on an `Event Cost Sheet`
- **THEN** any subsequent attempt to post a `Timesheet`, `Purchase Invoice`, or `Stock Entry` against the booking's Cost Center without explicit tenant admin override is rejected with a validation error
