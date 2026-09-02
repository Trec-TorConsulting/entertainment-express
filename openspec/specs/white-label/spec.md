# Capability: White-Label

## Purpose
Per-tenant company identity chrome (logo, color, favicon, hide product marks, email from-name,
canonical domain) applied to portals, login, public booking, and outbound absolute links.

## Requirements

### Requirement: Company White-Label Identity
The system SHALL let an `EE Tenant Admin` configure company white-label identity on this site (name, logo, brand color, favicon, email from-name, and a flag to hide Entertainment Express product chrome) without using the Desk. Settings SHALL apply to `/owner`, `/employee`, `/client`, login, and the public booking surface for this tenant only.

#### Scenario: Owner sets company chrome
- **WHEN** an owner saves logo, color, favicon, and hide-product-chrome in portal settings
- **THEN** those portals and login on this site render with that identity and without EE product marks when the hide flag is on

#### Scenario: Guest cannot change white-label
- **WHEN** a Guest or `EE Event Guest` attempts to update white-label settings
- **THEN** the server returns 403

### Requirement: Canonical Public Base URL
The system SHALL resolve a single canonical HTTPS base URL for this tenant (verified primary custom domain if set, else first verified custom domain, else the default site host) and use it for absolute links in notifications and portal redirects.

#### Scenario: Notification uses custom domain
- **WHEN** a verified primary custom domain is configured and a client notification includes a portal link
- **THEN** the link host is that custom domain, not the EE subdomain
