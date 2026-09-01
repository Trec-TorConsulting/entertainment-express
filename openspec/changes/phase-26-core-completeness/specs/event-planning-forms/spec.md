## ADDED Requirements

### Requirement: Portal Planning Forms
The system SHALL render the booking’s planning form on `/client/planning` and `/owner` job detail using existing phase-15 form APIs, not an ideas-only list.

#### Scenario: Client completes the questionnaire
- **WHEN** a paying customer submits the planning form for their booking
- **THEN** answers persist on that booking and appear on the crew run sheet
