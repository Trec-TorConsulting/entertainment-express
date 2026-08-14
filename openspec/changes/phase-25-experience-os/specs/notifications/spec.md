## ADDED Requirements

### Requirement: Booking Collaboration Notifications
The system SHALL notify booking-chat members of new messages and SHALL notify invitees when they are invited, using existing email/SMS/push channels and failing closed (log, do not crash) when a channel is unconfigured.

#### Scenario: Invite email
- **WHEN** a customer invites a guest
- **THEN** an invite notification is queued to that email (and SMS if a phone was provided)

#### Scenario: Chat notify assigned talent
- **WHEN** the customer posts in booking chat
- **THEN** assigned entertainer(s) receive a notification through configured channels
