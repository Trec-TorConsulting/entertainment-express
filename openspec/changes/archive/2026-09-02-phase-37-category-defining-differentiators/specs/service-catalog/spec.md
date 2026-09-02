## ADDED Requirements

### Requirement: Support Category-Defining Differentiators
The system SHALL support the behaviors introduced for this phase in `phase-37-category-defining-differentiators` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-37-category-defining-differentiators` run on tenant A
- **THEN** tenant B data is never read or written
