## ADDED Requirements

### Requirement: Hours Feed Consult Slots
The system SHALL use staff weekly hours, date overrides, and time-off when computing appointment slots. Time-off already used for event dispatch SHALL also block consults.

#### Scenario: Time-off hides slots
- **WHEN** staff has time-off on a date
- **THEN** no consult slots are offered for that person on that date
