## ADDED Requirements

### Requirement: Custom Domain Serves Portals
The system SHALL serve `/owner`, `/employee`, `/client`, and public booking paths for this tenant when the request Host is a verified custom domain mapped to this site, with the same authorization rules as on the default subdomain.

#### Scenario: Owner opens custom domain portal
- **WHEN** `events.acme.com` is verified for this tenant and an `EE Tenant Admin` opens `https://events.acme.com/owner`
- **THEN** the owner portal loads for this tenant site over TLS

#### Scenario: Other tenant host rejected
- **WHEN** a hostname verified for tenant A is requested
- **THEN** Frappe resolves only tenant A's site database (never tenant B)

### Requirement: DNS Wizard Guidance
The system SHALL show the owner the DNS target (CNAME to this site's default host) and verification/TLS status for each requested custom hostname.

#### Scenario: Pending domain instructions
- **WHEN** an owner requests `events.acme.com` before DNS is ready
- **THEN** the hostname is stored unverified and the UI shows the CNAME target equal to this site's default host
