## ADDED Requirements

### Requirement: Register Verified Domain Without Tenant DB Cross-Connect
The system SHALL accept signed domain-registration callbacks from tenant sites that upsert `Tenant Domain` rows (hostname, tenant/site claim, verified, tls_status) on the control-plane database only. Tenant request handlers SHALL NOT open the admin site database.

#### Scenario: Verify notifies control plane
- **WHEN** a tenant site successfully verifies a custom hostname
- **THEN** a `Tenant Domain` row is upserted on the control plane and `/ops` can list it with TLS status

#### Scenario: Spoofed site claim rejected
- **WHEN** a registration claims a hostname for a site_name that does not match the authenticated caller
- **THEN** the control plane rejects the request
