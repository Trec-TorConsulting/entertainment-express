## ADDED Requirements

### Requirement: Timeline On Client Planning
The system SHALL show the booking timeline on `/client/planning` with existing client-visible flags and suggestion/approval rules.

#### Scenario: Client opens timeline in SPA
- **WHEN** a customer opens Planning for a booking that has a timeline
- **THEN** client-visible items render in order and client-hidden items are omitted
