## ADDED Requirements

### Requirement: Phase Support For Tenant Website & Embed Widgets
The system SHALL expose the behaviors required by `tenant-website` for this capability without cross-tenant leakage.

#### Scenario: Site scoped
- **WHEN** a user on tenant A uses the new phase-30-tenant-website-widgets features
- **THEN** only tenant A data is read or written
