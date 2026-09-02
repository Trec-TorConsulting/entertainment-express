## ADDED Requirements

### Requirement: Places Partners And Coverage
The system SHALL offer `/owner/places`, `/owner/partners`, and `/owner/coverage` for venues, vendors, policies, COIs, and waiver templates without `/app`.

#### Scenario: Owner adds a hall
- **WHEN** an owner saves a venue with load-in notes
- **THEN** it can be picked on a job and the public/client UI never shows DocType names

### Requirement: Job Risk Strip
The system SHALL show venue, COI status, waiver status, and damage-hold status on the owner job view. Hold amounts SHALL be backend strings.

#### Scenario: Owner places a hold
- **WHEN** an owner starts a damage hold from the job
- **THEN** billing preauth runs and the job shows held with a money string
