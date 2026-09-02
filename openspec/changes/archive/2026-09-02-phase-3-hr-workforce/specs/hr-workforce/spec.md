## ADDED Requirements

### Requirement: Workforce Without Desk
The system SHALL let a tenant admin onboard workers (W2 or 1099), set weekly hours and time-off, collect required documents, approve timesheets, and run payouts from `/owner` without Desk. Staff SHALL set their own hours and time-off from `/employee/me`.

#### Scenario: Owner onboard a 1099 DJ
- **WHEN** an `EE Tenant Admin` opens People, sets a person to 1099 with the DJ skill, a per-event rate, weekly hours, and a W9
- **THEN** that person is assignable to DJ jobs in their hours and appears in the next pay run after approved hours

#### Scenario: Staff set time-off
- **WHEN** a crew member saves time-off for a date on `/employee/me`
- **THEN** they are not suggested for jobs or consult slots on that date
