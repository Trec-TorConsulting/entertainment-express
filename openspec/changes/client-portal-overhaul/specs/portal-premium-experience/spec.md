## ADDED Requirements

### Requirement: Client Portal Full PQB Coverage
Every screen in the `/client` customer portal SHALL adhere to the Premium Quality Bar (PQB) standards for visual hierarchy, consumer spacing density, contrast ratios (WCAG 2.1 AA), responsive tap targets (≥ 44px), instant skeleton feedback, and theme persistence.

#### Scenario: Mobile viewport navigation
- **WHEN** a client opens any route on a 390px mobile viewport
- **THEN** fixed bottom navigation allows one-tap switching between Home, Events, Pay, Planning, and More, with visible indicator badges

#### Scenario: Theme switching
- **WHEN** a client toggles dark mode in Account settings
- **THEN** theme variables update immediately and persist across sessions via localStorage
