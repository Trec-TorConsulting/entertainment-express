## ADDED Requirements

### Requirement: Extended Tenant Token Set
The design system SHALL expose CSS variables for secondary, accent, background, text, and display/body fonts overridden from the white-label kit on tenant pages and portals.

#### Scenario: Secondary token applies
- **WHEN** secondary brand color is set and pages rebuild/render
- **THEN** components using `--ee-brand-2` reflect that color
