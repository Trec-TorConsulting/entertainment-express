## ADDED Requirements

### Requirement: Support Multi-Brand Tenants
The system SHALL support the behaviors introduced for this phase in `phase-34-multi-brand-tenants` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-34-multi-brand-tenants` run on tenant A
- **THEN** tenant B data is never read or written
