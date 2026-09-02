## ADDED Requirements

### Requirement: Support Media Delivery Pipeline
The system SHALL support the behaviors introduced for this phase in `phase-31-media-delivery-pipeline` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-31-media-delivery-pipeline` run on tenant A
- **THEN** tenant B data is never read or written
