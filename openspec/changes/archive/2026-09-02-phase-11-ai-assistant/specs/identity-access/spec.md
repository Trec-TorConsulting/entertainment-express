## ADDED Requirements

### Requirement: Guest Cannot Use AI
The system SHALL deny `EE Event Guest` (without `EE Customer`) and unauthenticated Guest on all AI APIs. Those APIs SHALL NOT accept a site or tenant argument.

#### Scenario: Guest denied ask
- **WHEN** an `EE Event Guest` calls `ask` or `suggest_quote`
- **THEN** the request is denied (403) and no LLM call is made
