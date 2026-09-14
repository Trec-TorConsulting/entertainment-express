## ADDED Requirements

### Requirement: Asset Quarantine Availability Exclusion
The system SHALL exclude any asset whose condition is `Quarantined`, `In Repair`, or `Pending Inspection` from dispatch eligibility and public booking availability calculations.

#### Scenario: Quarantined asset excluded from quote availability
- **WHEN** checking asset availability for an upcoming booking
- **THEN** units flagged as `Quarantined` are omitted from the available unit count, preventing double-booking or dispatching broken inventory

#### Scenario: Warning on existing booking if assigned unit is quarantined
- **WHEN** an assigned asset is quarantined and has future confirmed bookings within the repair window
- **THEN** the system generates an urgent dispatch conflict notification alerting the dispatcher to swap the assigned asset
