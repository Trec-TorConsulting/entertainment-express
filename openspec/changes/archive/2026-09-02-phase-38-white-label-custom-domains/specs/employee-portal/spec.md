## ADDED Requirements

### Requirement: Employee Portal On Custom Host
The system SHALL load `/employee` with company white-label chrome when the Host is this tenant's default or verified custom domain, applying hide-product-chrome when configured.

#### Scenario: Crew uses company domain
- **WHEN** a staff user opens `https://{custom}/employee` on a verified domain for this site
- **THEN** the employee portal loads with tenant branding and role guards unchanged
