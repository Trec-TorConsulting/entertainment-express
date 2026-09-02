## ADDED Requirements

### Requirement: Support Competitor Migration Presets
The system SHALL support the behaviors introduced for this phase in `phase-36-competitor-migration-presets` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-36-competitor-migration-presets` run on tenant A
- **THEN** tenant B data is never read or written
