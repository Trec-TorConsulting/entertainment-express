# Capability: White-Label

## ADDED Requirements

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
