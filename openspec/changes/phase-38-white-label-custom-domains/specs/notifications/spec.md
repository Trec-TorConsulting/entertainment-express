## ADDED Requirements

### Requirement: Absolute Links Use Canonical Domain
The system SHALL build absolute action URLs in tenant notifications using the company canonical public base URL (custom domain when verified).

#### Scenario: Deposit reminder link
- **WHEN** a payment reminder email is sent and a primary custom domain is verified
- **THEN** the pay/portal link host is that custom domain

### Requirement: From-Name Uses Company White-Label
The system SHALL use the company white-label email from-name (or brand from-name when a booking brand is set) for client-facing notifications when configured.

#### Scenario: Confirmation from company name
- **WHEN** `email_from_name` is set on portal settings and a confirmation is sent without a brand override
- **THEN** the from-name matches that company setting
