## ADDED Requirements

### Requirement: Guest Cannot Change The Job
The system SHALL deny `EE Event Guest` (without `EE Customer`) on booking change-request APIs. Import-style `tenant`/`site` arguments SHALL NOT exist.

#### Scenario: Guest denied change request
- **WHEN** an `EE Event Guest` requests a reschedule
- **THEN** the request is denied (403) and no change record is created
