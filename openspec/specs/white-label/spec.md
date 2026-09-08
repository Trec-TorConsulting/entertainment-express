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

### Requirement: Built-In Platform URLs White-Labeling
The system SHALL apply the company white-label kit to all built-in platform pages on tenant sites, including `/login` (all state tabs: `#login`, `#forgot`, `#signup`, `#email_otp`, `#totp`), `/update-password`, and system HTTP error pages (`/404`, `/500`, `/403`), ensuring tenant logo, brand colors, custom fonts, favicon, and footer text render seamlessly while suppressing Entertainment Express product marks when `hide_product_chrome` or `full` white-label mode is enabled.

#### Scenario: Tenant client visits login page
- **WHEN** a client or staff member navigates to `/login` on a tenant site `{tenant}.entx.app` or custom domain
- **THEN** the login card and background inherit the tenant's brand name, logo, primary color, typography, and favicon, without displaying default Frappe or Entertainment Express branding if `hide_product_chrome` or `full` white-label mode is active

#### Scenario: SaaS operator visits base login page
- **WHEN** a user visits `/login` on `www.entx.app`, `admin.entx.app`, or apex domain
- **THEN** the login page renders with official Entertainment Express branding, logo, and marketing visual design matching `www.entx.app`

#### Scenario: Tenant visitor encounters 404 page
- **WHEN** a visitor encounters a non-existent route on a tenant site
- **THEN** the 404 error page renders using the tenant's white-label chrome and recovery links directing to the tenant home or portal
