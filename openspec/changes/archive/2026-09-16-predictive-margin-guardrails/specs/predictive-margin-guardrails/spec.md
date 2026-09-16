## ADDED Requirements

### Requirement: Pre-Quote Direct Cost & Margin Simulation
The system SHALL provide an API to calculate projected direct COGS (direct labor from assigned roles and duration, equipment wear, vehicle mileage/transit cost, sub-rental estimates, and card processing fees) and projected net margin percentage for any draft proposal or quote before it is issued to the client.

#### Scenario: Real-time simulation of draft proposal
- **GIVEN** a draft quote with $3,000 gross total, 2 crew roles totaling $600 in projected labor, $150 vehicle transit, $100 equipment wear, and $90 payment gateway fee
- **WHEN** the owner or sales rep requests a margin simulation via `/api/method/entertainment_express.job_costing.margin_simulator.simulate_quote_margin`
- **THEN** the system returns projected COGS of $940, net profit of $2,060, projected margin of 68.67%, and health status `healthy`

#### Scenario: Proposal discount falls below margin floor
- **GIVEN** a tenant with `minimum_margin_floor_percent` set to 35.0%
- **WHEN** a proposal discount drops projected margin to 22.0%
- **THEN** the simulation returns status `below_floor`, calculates the required price to achieve 35% margin ($1,446.15), and flags `override_required: true`

### Requirement: Real-Time Margin Drift Monitoring & Alerting
The system SHALL continuously compare actual rolled-up costs against projected costs for each booking, computing `margin_drift_percent = projected_margin_percent - actual_margin_percent`. If drift exceeds `margin_drift_warning_threshold`, the system SHALL trigger proactive alerts to tenant administrators.

#### Scenario: Overtime causes margin drift alert
- **GIVEN** a booking with a projected margin of 45.0% and a drift threshold of 5.0%
- **WHEN** crew timesheet submissions add 4 hours of unanticipated overtime, dropping actual margin to 36.0% (drift = 9.0%)
- **THEN** the system updates `Event Cost Sheet.margin_drift_percent` to 9.0%, sets `margin_status` to `warning`, and dispatches an immediate in-app and notification payload detailing the overtime labor variance

### Requirement: Automated Post-Event Ledger Settlement and Cost Center Lock
The system SHALL provide an automated workflow upon event completion (or tenant-configured grace period) that reconciles cost sheet variances, generates closing ERPNext `Journal Entry` records, and locks the booking's `Cost Center` against further journal postings.

#### Scenario: Booking completion closes cost center
- **GIVEN** an `Event Booking` transitioned to `completed` status with an unlocked Cost Center
- **WHEN** the post-event settlement process executes
- **THEN** the system sets `is_ledger_locked = 1` on `Event Cost Sheet`, creates a reconciliation `Journal Entry` for accrued equipment wear and overhead allocations, and disables direct debit postings to the Cost Center without admin unlock
