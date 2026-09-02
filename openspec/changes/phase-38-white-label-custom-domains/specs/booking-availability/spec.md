## ADDED Requirements

### Requirement: Booking URLs Honor Canonical Domain
The system SHALL expose public booking and catalog absolute URLs using the tenant canonical public base URL when a custom domain is verified.

#### Scenario: Share book link
- **WHEN** an owner copies a public book link and a primary custom domain is verified
- **THEN** the URL uses that custom domain host
