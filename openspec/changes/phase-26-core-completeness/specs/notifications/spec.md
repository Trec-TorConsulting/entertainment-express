## ADDED Requirements

### Requirement: Proposal And Pay Notifications
The system SHALL notify the client when a proposal/contract is sent and when a deposit payment succeeds, using existing templates and failing closed if a channel is unconfigured.

#### Scenario: Contract to sign
- **WHEN** staff send a contract
- **THEN** the signer receives the existing contract-sent notification with a sign link
