## ADDED Requirements

### Requirement: Custom Domain Stored On This Site
The system SHALL let an `EE Tenant Admin` request a custom hostname for this site, verify it resolves to the same addresses as this site's default host, and then add it to this site's domain list. APIs SHALL NOT accept a tenant or site argument that switches databases.

#### Scenario: Unverified hostname is not live
- **WHEN** an owner saves a hostname that does not yet resolve to this site
- **THEN** it is stored as unverified and is not added to the live domain list

#### Scenario: Guest cannot add a domain
- **WHEN** a Guest or `EE Event Guest` requests a custom hostname
- **THEN** the server returns 403
