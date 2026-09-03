## ADDED Requirements

### Requirement: Employee Premium Ops Chrome
The employee portal SHALL use **ops density** with a compact header, role badge, shift-aware greeting on My Day,
and bottom navigation on mobile (Home, Work, Search, Inbox, Me). Desktop SHALL use a narrow icon rail plus
expandable section labels. Dispatch SHALL embed in a **full-bleed board frame** with portal chrome minimized.

#### Scenario: Role badge visible
- **WHEN** an `EE Dispatcher` opens `/employee`
- **THEN** the header shows their primary role and they cannot access owner-only routes from chrome

### Requirement: My Day Flagship
`/employee` (My Day) SHALL show: **now/next** assignment card with check-in CTA, **today's timeline** (calls,
consults, tasks), **at-risk banner** when dispatch APIs report gaps, and **quick actions** filtered by role
(offer shift, log time, open run sheet). Field users SHALL see large tap targets and offline-tolerant cached
shell (service worker) for the My Day layout.

#### Scenario: Crew check-in prominent
- **WHEN** a crew member has an assignment starting within 2 hours
- **THEN** My Day shows a primary Check in button above the fold on a 390 px viewport

### Requirement: Dispatch Embed Polish
`/employee/dispatch` SHALL wrap the existing dispatch board in portal-kit chrome with: date picker, filter chips
(unassigned, at-risk, outdoor), legend, and fullscreen toggle. Loading SHALL show board-shaped skeletons, not a
spinner alone.

#### Scenario: Fullscreen dispatch
- **WHEN** a dispatcher toggles fullscreen
- **THEN** the board uses the entire viewport; Esc exits fullscreen

## MODIFIED Requirements

### Requirement: Role-Adaptive Home
The system SHALL render an employee's home adapted to their assigned role(s), surfacing a "My Day" view of
that user's tasks, assignments, and schedule, showing only capabilities their role permits. The home SHALL use
**card-based sections** with progressive disclosure (expand for details) rather than raw tables as the default
layout.

#### Scenario: Two roles see different homes
- **WHEN** an `EE Sales` user and an `EE Crew` user each open `/employee`
- **THEN** Sales sees leads/quotes/bookings actions while Crew sees today's assigned events and check-in/out —
  each seeing only what their role permits, enforced server-side
