## ADDED Requirements

### Requirement: Tenant Token Overrides And Chrome Suppression
The design system SHALL allow portal bootstrap to override `--ee-brand` (and related tokens) from company white-label settings and to suppress product chrome classes when hide-product-chrome is enabled.

#### Scenario: Brand color on custom host
- **WHEN** portals load with a brand color and hide-product-chrome
- **THEN** CSS uses the tenant brand token and EE product marks are not shown in portal chrome
