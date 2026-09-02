## ADDED Requirements

### Requirement: Owner Security Workspace
The owner portal SHALL provide `/owner/security` for two-step requirement, custom domains, recent audit events, and optional SSO status. The SPA SHALL never display secret values. Guests and crew SHALL receive 403.

#### Scenario: Owner opens Security
- **WHEN** an `EE Tenant Admin` opens `/owner/security`
- **THEN** they see this site's two-step flag, domain list, and recent audit actions from this site only
