## ADDED Requirements

### Requirement: Ops Visual Density
The employee portal SHALL use shared tokens in a compact ops density (tables, chips, sticky headers)
distinct from the marketing home.

#### Scenario: Dispatcher scans the day
- **WHEN** an `EE Dispatcher` opens `/employee` on desktop
- **THEN** My Day shows today's jobs and at-risk items in a scannable list, not a marketing hero

### Requirement: Field Bottom Nav
On viewports below 768px the employee shell SHALL use a bottom nav with Home, the role's primary
ops destination, Search, and Me.

#### Scenario: Crew on a phone
- **WHEN** an `EE Crew` user opens `/employee` on a phone
- **THEN** primary check-in/out or today's assignment is reachable from the bottom nav
