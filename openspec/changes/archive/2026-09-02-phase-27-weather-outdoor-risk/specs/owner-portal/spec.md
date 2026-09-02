## ADDED Requirements

### Requirement: Weather Policy On Company OS
The system SHALL let the owner configure Weather Policy and see booking weather status on the job risk strip without `/app`.

#### Scenario: Save weather policy
- **WHEN** an owner updates wind threshold on Company OS
- **THEN** the policy is saved for this tenant and applies to subsequent forecast jobs
