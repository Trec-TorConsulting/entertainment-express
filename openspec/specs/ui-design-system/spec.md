# Capability: UI Design System

## Purpose
The shared visual language for Entertainment Express public pages and authenticated portals. Tokens live
in `frontend/portal-kit/src/tokens.css` (and the Tailwind preset) and are mirrored into
`public/marketing/marketing.css` so marketing and portals do not drift.

This capability does **not** own portal IA or backend APIs. Those stay in `owner-portal`,
`employee-portal`, `customer-portal`, and `marketing-website`.

## Requirements

### Requirement: Canonical Token File
The design system SHALL live in `frontend/portal-kit/src/tokens.css` (and Tailwind preset) as the
source of truth for `--ee-*` variables.

#### Scenario: Token change propagates
- **WHEN** `--ee-brand` is updated in tokens.css and portals/marketing are rebuilt
- **THEN** buttons and links using the brand token reflect the new value without per-app hard-coded hex

### Requirement: Tenant Token Overrides And Chrome Suppression
The design system SHALL allow portal bootstrap to override `--ee-brand` (and related tokens) from company white-label settings and to suppress product chrome classes when hide-product-chrome is enabled.

#### Scenario: Brand color on custom host
- **WHEN** portals load with a brand color and hide-product-chrome
- **THEN** CSS uses the tenant brand token and EE product marks are not shown in portal chrome

### Requirement: Extended Tenant Token Set
The design system SHALL expose CSS variables for secondary, accent, background, text, and display/body fonts overridden from the white-label kit on tenant pages and portals.

#### Scenario: Secondary token applies
- **WHEN** secondary brand color is set and pages rebuild/render
- **THEN** components using `--ee-brand-2` reflect that color
