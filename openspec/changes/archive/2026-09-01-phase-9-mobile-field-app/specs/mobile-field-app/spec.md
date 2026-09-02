## ADDED Requirements

### Requirement: Employee Field PWA
The system SHALL expose crew field workflows as an installable progressive web app at `/employee/field` on the tenant host, without Desk or `/app`.

#### Scenario: Crew opens Field
- **WHEN** a user with `EE Crew` or `EE Entertainer` opens `/employee/field` (including from an installed PWA)
- **THEN** they see only their assignments with times, addresses, roles, and run-sheet actions

#### Scenario: Guest denied
- **WHEN** a Guest or `EE Event Guest` calls a field mutation
- **THEN** the API returns 403 and no assignment is updated
