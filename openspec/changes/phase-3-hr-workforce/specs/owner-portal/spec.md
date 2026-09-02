## ADDED Requirements

### Requirement: People Workforce
The owner portal SHALL manage worker type, skills, pay, weekly hours, time-off, compliance files, timesheet approval, and pay runs on `/owner/people` (and pay runs on Money) without Desk. Copy SHALL use person/job language, never DocType names.

#### Scenario: Owner pays crew for a period
- **WHEN** an `EE Tenant Admin` creates a pay run for a date range after timesheets are approved
- **THEN** each worker’s pay is event fees plus approved hours plus attributed tips, and the owner can mark the run paid without using `/app`

#### Scenario: Guest denied
- **WHEN** a guest calls a People workforce API
- **THEN** access is denied
