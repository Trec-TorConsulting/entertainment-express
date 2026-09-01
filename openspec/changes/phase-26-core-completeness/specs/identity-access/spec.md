## ADDED Requirements

### Requirement: Guests Stay Non-Payers On Money APIs
The system SHALL deny `EE Event Guest` (without `EE Customer`) on invoice checkout and contract sign APIs even when the booking membership check would pass.

#### Scenario: Guest checkout denied
- **WHEN** an event guest calls `start_checkout` or `sign_contract` portal methods
- **THEN** the request is denied
