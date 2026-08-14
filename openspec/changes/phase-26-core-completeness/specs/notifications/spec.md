## ADDED Requirements

### Requirement: Proposal And Checklist Notifications
The system SHALL send proposal-sent, proposal-viewed (to staff), unsigned/unpaid proposal follow-up, and workflow-task-due messages on existing channels. Missing SMS credentials SHALL NOT crash the request.

#### Scenario: Staff notified on view
- **WHEN** a customer opens a sent Proposal
- **THEN** a proposal-viewed notification is queued for the sales owner

#### Scenario: Twilio down
- **WHEN** Twilio is unconfigured and a proposal is sent
- **THEN** email still queues (if configured) and the send API does not raise
