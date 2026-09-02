## ADDED Requirements

### Requirement: AI Assistant Plan Flag
The system SHALL include a Plan entitlement `ai_assistant` (`0` on Starter, `1` on Professional and Enterprise). Tenant sites SHALL enforce that flag only via their own `site_config.ee_ai_assistant` (or EE AI Settings), never by opening the control-plane database.

#### Scenario: Starter seeds off
- **WHEN** default Plans are seeded
- **THEN** Starter has `ai_assistant` `0` and Professional has `ai_assistant` `1`
