## ADDED Requirements

### Requirement: Weather Alert Notifications
The system SHALL send weather watch, warning, block, and rain-date-offer messages on existing notification channels. Missing Twilio SHALL NOT crash the job.

#### Scenario: Warning queued
- **WHEN** a booking enters `warning` status
- **THEN** configured staff (and optionally the client) receive a weather warning notification for this site only
