## ADDED Requirements

### Requirement: Clone Job
The system SHALL let the owner duplicate an existing job to a new date from `/owner/calendar`, copying package pattern and notes, clearing crew/asset assignments, and blocking the save when availability fails.

#### Scenario: Clone to an open date
- **WHEN** the owner clones a confirmed job to a free date
- **THEN** a new Event Booking exists in inquiry/quoted state for that date without copying assignments
