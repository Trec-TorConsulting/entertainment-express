## ADDED Requirements

### Requirement: Client Weather And Rain Date
The system SHALL show weather status on the client booking detail and allow accepting an open rain-date offer when the tenant enabled client accept. Event guests SHALL NOT accept rain dates.

#### Scenario: Accept rain date
- **WHEN** a paying customer accepts a rain-date offer
- **THEN** the booking reschedules and guests calling the accept API receive 403
