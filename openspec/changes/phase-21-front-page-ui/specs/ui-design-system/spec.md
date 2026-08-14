## ADDED Requirements

### Requirement: Canonical Token File
The design system SHALL live in `frontend/portal-kit/src/tokens.css` (and Tailwind preset) as the
source of truth for `--ee-*` variables.

#### Scenario: Token change propagates
- **WHEN** `--ee-brand` is updated in tokens.css and portals/marketing are rebuilt
- **THEN** buttons and links using the brand token reflect the new value without per-app hard-coded hex
