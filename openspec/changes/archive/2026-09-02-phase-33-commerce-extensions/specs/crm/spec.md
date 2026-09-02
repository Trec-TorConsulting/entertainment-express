## ADDED Requirements

### Requirement: Support Commerce Extensions
The system SHALL support the behaviors introduced for this phase in `phase-33-commerce-extensions` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-33-commerce-extensions` run on tenant A
- **THEN** tenant B data is never read or written
