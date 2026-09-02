## ADDED Requirements

### Requirement: Auth Redirects Preserve Tenant Host
The system SHALL keep post-login role landings on the same Host the user authenticated against when that Host maps to this tenant site (default subdomain or verified custom domain).

#### Scenario: Login on custom domain lands correctly
- **WHEN** an `EE Tenant Admin` logs in at `https://{custom}/login`
- **THEN** they are sent to `https://{custom}/owner` (not forced to the EE subdomain)
