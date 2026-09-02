## ADDED Requirements

### Requirement: Guest Denied Connection APIs
The system SHALL reject guest and event-guest callers on connection list/save and geocode APIs with 403. Crew SHALL not save credentials.

#### Scenario: Guest cannot list connections
- **WHEN** a Guest or `EE Event Guest` (without `EE Customer`) calls connection APIs
- **THEN** the server returns 403
