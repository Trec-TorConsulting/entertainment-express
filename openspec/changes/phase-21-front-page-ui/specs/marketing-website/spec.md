## ADDED Requirements

### Requirement: Shared Visual Tokens
The system SHALL publish a single token set (color, type, space, radius, shadow, focus) used by
marketing CSS and portal-kit, so public pages and authenticated portals do not diverge in brand color
or type.

#### Scenario: Same brand color
- **WHEN** a visitor views the SaaS home and a tenant user views `/client`
- **THEN** the default brand color token matches unless the tenant has overridden brand color in
  `EE Portal Settings` (tenant pages only)

### Requirement: Designed SaaS Home
The system SHALL render the SaaS front page with a sticky nav, hero + dual CTA, how-it-works, feature
grid, pricing teaser sourced from `Plan`, and footer, usable at a 375px viewport.

#### Scenario: Convert on a phone
- **WHEN** a Guest opens `www.{base_domain}` on a 375px-wide viewport
- **THEN** they can reach Start trial without horizontal scroll or clipped primary CTA

### Requirement: Designed Tenant Home
The system SHALL render the tenant public home with tenant branding and book/quote CTAs, using only
that tenant's data.

#### Scenario: Tenant branding scoped
- **WHEN** a Guest opens `{slug}.app.{base_domain}/`
- **THEN** they see that tenant's logo/brand color and never another tenant's or the SaaS marketing
  headline unless the tenant has not set branding (then a generic tenant-safe default)
