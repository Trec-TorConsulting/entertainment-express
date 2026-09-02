## ADDED Requirements

### Requirement: Support DJ Software Playlist Export
The system SHALL support the behaviors introduced for this phase in `phase-35-dj-software-export` with site-per-tenant isolation.

#### Scenario: Tenant scoped
- **WHEN** features from `phase-35-dj-software-export` run on tenant A
- **THEN** tenant B data is never read or written
