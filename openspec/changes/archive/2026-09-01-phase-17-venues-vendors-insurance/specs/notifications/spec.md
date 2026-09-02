## ADDED Requirements

### Requirement: Compliance Reminders
The system SHALL send COI-missing, waiver-needed, and policy-expiry messages on existing channels. Missing Twilio SHALL NOT crash the job.

#### Scenario: Twilio down on COI reminder
- **WHEN** Twilio is unconfigured and a COI reminder runs
- **THEN** email still queues if configured and the job does not raise
