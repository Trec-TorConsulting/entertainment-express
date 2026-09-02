## ADDED Requirements

### Requirement: Preference Matches The Inbox
Notification Preference SHALL apply when the send recipient matches the customer or user email on the preference row, not only when callers pass party_type and party.

#### Scenario: Opt-out by email
- **WHEN** a customer opted out of SMS on their portal profile and a send targets that email
- **THEN** SMS is blocked even if the caller omitted party
