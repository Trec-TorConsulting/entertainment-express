## ADDED Requirements

### Requirement: Guest Cannot Market
The system SHALL deny `EE Event Guest` (without `EE Customer`) on campaign send, promo create, and referral APIs. Those APIs SHALL NOT accept a site or tenant argument.

#### Scenario: Guest denied campaign
- **WHEN** an `EE Event Guest` sends a campaign
- **THEN** the request is denied (403) and no campaign is sent
