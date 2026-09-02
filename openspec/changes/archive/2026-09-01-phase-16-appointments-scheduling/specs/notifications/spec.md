## ADDED Requirements

### Requirement: Appointment Notifications
The system SHALL send appointment-booked, reminder, rescheduled, and canceled messages on existing channels. Missing SMS credentials SHALL NOT crash book or cancel.

#### Scenario: Twilio down on book
- **WHEN** Twilio is unconfigured and a consult is booked
- **THEN** email still queues if configured and the book API does not raise
