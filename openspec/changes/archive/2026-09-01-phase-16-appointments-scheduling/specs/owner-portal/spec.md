## ADDED Requirements

### Requirement: Meeting Types On Company OS
The system SHALL let the owner create, edit, activate, and deactivate meeting types on `/owner` without `/app`. Labels SHALL be business language, not DocType names.

#### Scenario: Owner adds a consult type
- **WHEN** an owner creates a 30-minute video consultation type with weekday hours
- **THEN** it becomes self-bookable on the tenant public schedule page

### Requirement: Appointment Inbox
The system SHALL list upcoming appointments on `/owner` Today / Calendar. The owner SHALL confirm, complete, cancel, or mark no-show.

#### Scenario: Owner cancels a consult
- **WHEN** an owner cancels an appointment
- **THEN** the slot is released, the invitee is notified, and the Lead remains
