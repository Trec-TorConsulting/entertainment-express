## ADDED Requirements

### Requirement: Portal Completion Path
The system SHALL expose planning-form read/save on `/client/planning` for the booking’s customer (and guests for non-payer fields where the template allows). Staff SHALL see completion percent on the job in `/owner` without Desk.

#### Scenario: Owner sees incomplete form
- **WHEN** a confirmed booking has a planning form below 100% complete
- **THEN** the owner job view shows incomplete and Today can list it as a next action
