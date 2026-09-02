## ADDED Requirements

### Requirement: Event Guest Identity
The system SHALL seed an `EE Event Guest` role on tenant sites. Event invites SHALL assign only that role (plus Website User). Owners and staff SHALL NOT grant `System Manager` or `SaaS Operator`. Guests SHALL be authorized only for APIs in `event-collaboration` and read of that booking’s published planning/media.

#### Scenario: Invite does not create a payer
- **WHEN** a customer invites a guest
- **THEN** the new or linked user has `EE Event Guest` and does not have `EE Customer`

#### Scenario: Guest blocked from staff APIs
- **WHEN** an `EE Event Guest` calls owner or employee portal methods
- **THEN** access is denied
