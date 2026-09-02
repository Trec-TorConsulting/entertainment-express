## ADDED Requirements

### Requirement: Full Tenant Site White-Label
The system SHALL apply the company white-label kit to all customer-facing surfaces on this tenant site when `white_label_mode` is `full`, including public home, `/book`, `/catalog`, login, sign, appointment booking pages, portal SPAs, and shared footers — with no Entertainment Express product marks visible to Guests or customers.

#### Scenario: Public book matches company brand
- **WHEN** full white-label mode is on and a Guest opens `/book` on this tenant
- **THEN** the page uses company colors/fonts/logo/footer and does not show Entertainment Express product branding

#### Scenario: EE marketing site unchanged
- **WHEN** a Guest opens the SaaS marketing site at `www.{base_domain}`
- **THEN** Entertainment Express product branding remains (tenant kit does not apply)

### Requirement: Extended Brand Kit
The system SHALL let an `EE Tenant Admin` configure primary, secondary, accent, background, and text colors; heading and body fonts; light/dark logos; favicon; social image; footer text; and white-label mode without Desk.

#### Scenario: Owner saves extended kit
- **WHEN** an owner saves secondary color, fonts, and footer text
- **THEN** those values persist in portal settings and drive CSS variables on the next public/portal render
