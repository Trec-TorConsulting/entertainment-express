## ADDED Requirements

### Requirement: Assignment Respects Hours And Compliance
The system SHALL refuse to assign or suggest a person who is outside weekly hours, on time-off, or missing a required compliance document (W9 for 1099, contract, background check) or holding an expired required cert.

#### Scenario: Expired license blocks assign
- **WHEN** a dispatcher assigns a worker whose required license is expired
- **THEN** the assign is rejected with a reason the person can fix in People
