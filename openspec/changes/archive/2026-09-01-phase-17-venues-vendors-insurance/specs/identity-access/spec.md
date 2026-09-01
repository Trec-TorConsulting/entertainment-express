## ADDED Requirements

### Requirement: Guest Is Not The Risk Payer
The system SHALL deny `EE Event Guest` (without `EE Customer`) on waiver sign, damage hold, and vendor commission APIs.

#### Scenario: Guest denied waiver
- **WHEN** a guest signs a waiver
- **THEN** the request is denied (403) and the waiver is unchanged
