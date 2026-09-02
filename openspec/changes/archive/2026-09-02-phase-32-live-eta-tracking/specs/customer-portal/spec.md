## ADDED Requirements

### Requirement: Support Live Client ETA Tracking
The system SHALL support the behaviors introduced for this phase in `phase-32-live-eta-tracking` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-32-live-eta-tracking` run on tenant A
- **THEN** tenant B data is never read or written
