## ADDED Requirements

### Requirement: Owner Connections Workspace
The owner portal SHALL list this site's external connections (calendar, maps, signing, books, music) with status and last error, and SHALL let the owner enable/disable and save credentials. The SPA SHALL never display secret values. Guests and crew SHALL receive 403.

#### Scenario: Owner opens Connections
- **WHEN** an `EE Tenant Admin` opens `/owner/connections`
- **THEN** they see each provider's connected/error/off state from this site only

#### Scenario: Missing provider keys degrade
- **WHEN** a provider is not configured
- **THEN** core booking/sign/pay still works and the page explains the connection is off
