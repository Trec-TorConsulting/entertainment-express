## ADDED Requirements

### Requirement: Client Portal On Custom Host
The system SHALL load `/client` with company white-label chrome when the Host is this tenant's default or verified custom domain.

#### Scenario: Client uses company domain
- **WHEN** a customer opens `https://{custom}/client` on a verified domain for this site
- **THEN** the client portal loads for this tenant only with company branding
