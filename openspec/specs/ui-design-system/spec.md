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
