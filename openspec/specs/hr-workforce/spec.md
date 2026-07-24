# Capability: HR & Workforce

## Purpose
Manage the people who deliver events: W2 employees and 1099/gig contractors — onboarding, skills,
availability, timesheets, payroll/payouts, and compliance. Built on ERPNext HR/Payroll extended for gig and
event-based work.

### Data Model
- **Worker** = ERPNext **Employee** extended: employment_type (`w2|1099`), skills/roles (child),
  certifications (child, with expiry), pay_basis (`hourly|per_event|salary`), pay_rates by role, home_base,
  service_areas, rating.
- **Availability**: worker (link), recurring availability + time-off/blackouts.
- **Timesheet** (ERPNext, extended): booking (link), check_in/out, hours, role, approved (bool).
- **Payout/Pay Run**: period, workers, computed pay (event fees + hours + tips), status, processor
  (`stripe_connect|manual|payroll`).
- **Compliance Doc**: worker (link), doc_type (`w9|contract|background_check|license`), file, expiry, status.

## Requirements

### Requirement: Worker Onboarding & Profiles
The system SHALL onboard W2 and 1099 workers with profiles, skills/roles, certifications, and pay rates,
with full CRUD.

#### Scenario: Onboard a gig DJ
- **WHEN** a 1099 DJ is onboarded with the "DJ" skill, a per-event rate, and a signed W9
- **THEN** they become assignable to DJ-role bookings and eligible for payout, with their W9 on file

#### Scenario: Certification expiry gate
- **WHEN** a worker's required certification/license expires
- **THEN** they are flagged and optionally blocked from assignments requiring that certification

### Requirement: Skills & Role Matching
The system SHALL match workers to bookings by required role/skill and service area for dispatch.

#### Scenario: Only qualified workers assignable
- **WHEN** dispatch searches crew for a role
- **THEN** only workers with the matching skill, in the service area, and available are returned

### Requirement: Availability & Time-Off
The system SHALL capture worker availability and time-off so scheduling only offers shifts they can work.

#### Scenario: Respect time-off
- **WHEN** a worker has declared time-off for a date
- **THEN** they are not suggested/offerable for shifts on that date

### Requirement: Timesheets
The system SHALL record hours from field check-in/out against bookings and support approval, with full CRUD.

#### Scenario: Auto timesheet from field
- **WHEN** a crew member checks in and out of an event via the mobile app
- **THEN** a timesheet entry is created with hours linked to the booking, pending approval

#### Scenario: Approval flow
- **WHEN** a manager approves a timesheet
- **THEN** the approved hours become eligible for payroll/payout

### Requirement: Payroll & Contractor Payouts
The system SHALL compute pay (event fees, hours, tips) and process payouts for W2 (payroll) and 1099
(contractor payout, e.g., Stripe Connect), with an auditable record.

#### Scenario: Contractor payout run
- **WHEN** a pay run is executed for 1099 crew for a period
- **THEN** each worker's pay (per-event + hours + attributed tips) is computed and paid out via the
  configured processor, with records for 1099 reporting

#### Scenario: Tip attribution
- **WHEN** tips were captured for events a worker staffed
- **THEN** those tips are attributed to the worker in the payout calculation

### Requirement: Compliance & Documents
The system SHALL store worker compliance documents with expiry tracking and required-document gating.

#### Scenario: Missing required doc blocks assignment
- **WHEN** a worker is missing a required compliance document (e.g., signed contract, background check)
- **THEN** they are flagged and cannot be assigned to work requiring it until resolved
