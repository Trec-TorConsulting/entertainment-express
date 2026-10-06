## ADDED Requirements

### Requirement: System vs Client Email Classification and Isolation
The system SHALL strictly classify outgoing communications as System Emails vs Client Operational Emails and isolate the outgoing SMTP infrastructure used for each category.

#### Scenario: System email routing
- **WHEN** a system notification (e.g., password reset, staff user invite, or control plane alert) is dispatched
- **THEN** delivery is routed using the primary platform system SMTP account (`Notifications` / `info@entx.app`)

#### Scenario: Client operational email routing with tenant SMTP
- **WHEN** a client operational email (e.g., proposal, quote, invoice, booking confirmation, or customer message) is dispatched for a tenant with custom SMTP configured
- **THEN** delivery is routed using the tenant's own custom `Email Account` SMTP credentials

#### Scenario: Zero fallback to system SMTP for unconfigured tenant client emails
- **WHEN** a client operational email is dispatched for a tenant that has NOT configured a custom outgoing SMTP server
- **THEN** the system MUST NOT send the email via the platform system SMTP, delivery MUST be logged with error `tenant_smtp_not_configured`, and a warning prompt MUST be presented in the tenant owner dashboard
