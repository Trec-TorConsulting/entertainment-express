## ADDED Requirements

### Requirement: Stripe Connect Instant Worker Payouts
The system SHALL support initiating instant payouts to worker connected accounts (debit cards or bank accounts) via Stripe Connect within 30 minutes of event teardown verification.

#### Scenario: Worker requests instant payout after teardown
- **GIVEN** a crew member with $250 in approved gig fees and $40 in tip allocation from booking `EB-2026-008`
- **AND** the lead supervisor has submitted the post-event equipment return checklist with zero damage flags
- **WHEN** the worker clicks "Instant Payout" in `/employee/earnings`
- **THEN** the system executes a Stripe transfer and payout to the worker's connected account, deducts any processing fee (e.g. 1.5%), creates an `EE Instant Payout` record, and updates the booking's cost ledger

#### Scenario: Payout blocked due to pending damage inspection
- **GIVEN** an active booking where post-event teardown reported a damaged speaker
- **WHEN** a crew member attempts an instant payout
- **THEN** the system blocks the transaction with reason `gear_damage_quarantine` until tenant management reviews the incident

### Requirement: Algorithmic Crew Reliability Scoring
The system SHALL compute an objective Reliability Score (0.0 to 100.0) for every active crew member, dynamically recalculated upon the completion of each event.

#### Scenario: Scoring weights and vectors
- **GIVEN** a worker profile with historical bookings
- **WHEN** the reliability engine executes upon booking completion
- **THEN** it calculates:
  - Punctuality Score (40% weight): Ratio of on-time geofence arrivals vs. late arrivals
  - Checklist Fidelity (25% weight): Completion rate of mandatory setup/teardown check items
  - Asset Care (20% weight): Frequency of damaged gear incidents on assigned shifts
  - Client Feedback CSAT (15% weight): Average star rating from client post-event reviews

### Requirement: Reliability-Weighted Crew Dispatch
The system SHALL incorporate the Worker Reliability Score into the automated crew suggestion algorithm in `scheduling-dispatch`, boosting high-reliability workers for complex packages.

#### Scenario: High-profile booking staffing suggestion
- **GIVEN** a $10,000 corporate gala requiring a Master DJ
- **WHEN** the dispatcher requests crew suggestions
- **THEN** workers with Reliability Score >= 90 are ranked above lower-rated workers regardless of proximity
