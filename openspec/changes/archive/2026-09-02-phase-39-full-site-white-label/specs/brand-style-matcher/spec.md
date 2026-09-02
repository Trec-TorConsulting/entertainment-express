## ADDED Requirements

### Requirement: Import Style From Website Or Logo
The system SHALL let an `EE Tenant Admin` submit a public https company website URL and/or a logo file and receive a suggested white-label kit (colors, fonts, favicon/logo candidates) without storing scraped HTML. Suggestions SHALL NOT apply until the owner confirms.

#### Scenario: Suggest from website URL
- **WHEN** an owner pastes `https://www.acme-events.com` and runs Match style
- **THEN** the server returns suggested colors/fonts/logo candidates derived from that public page

#### Scenario: Suggest from logo only
- **WHEN** an owner uploads a logo and runs Match style without a URL
- **THEN** the server returns suggested primary/secondary colors sampled from the image

#### Scenario: SSRF blocked
- **WHEN** an owner submits a private or link-local URL
- **THEN** the server rejects the request

### Requirement: Preview And Apply Suggestion
The system SHALL let the owner preview the suggestion on public home and book chrome, then apply it to company white-label settings in one action.

#### Scenario: Apply after preview
- **WHEN** an owner applies a suggestion
- **THEN** EE Portal Settings update and subsequent tenant renders use the new kit
