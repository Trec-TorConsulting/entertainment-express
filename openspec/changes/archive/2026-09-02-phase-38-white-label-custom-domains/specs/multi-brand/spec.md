## ADDED Requirements

### Requirement: Brand Host Uses Same Domain Pipeline
The system SHALL treat an EE Brand custom host as a site hostname that must be verified and ingress-published like a company custom domain, while brand resolution still selects that brand's catalog/chrome on the same tenant database.

#### Scenario: Brand host on same site
- **WHEN** a Game Truck brand host is verified for this tenant
- **THEN** requests to that host serve this tenant site and resolve the Game Truck brand without a second database
