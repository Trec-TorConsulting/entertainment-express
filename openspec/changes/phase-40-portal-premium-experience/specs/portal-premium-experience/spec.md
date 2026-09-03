## ADDED Requirements

### Requirement: Premium Quality Bar
The authenticated portals (`/owner`, `/employee`, `/client`) SHALL meet a documented **Premium Quality Bar**
(PQB) covering visual hierarchy, interaction feedback, loading states, accessibility, and performance. The PQB
SHALL be versioned in `frontend/portal-kit/PREMIUM_QUALITY_BAR.md` and enforced in CI.

#### Scenario: CI blocks regressions
- **WHEN** a pull request reduces Lighthouse Performance, Accessibility, or Best Practices below the PQB
  thresholds on any portal entry URL
- **THEN** CI fails with a report naming the regressed URL and metric

#### Scenario: Manual review checklist
- **WHEN** a phase-40 task is marked complete
- **THEN** the implementer has checked the PQB checklist items for that screen (contrast, focus ring, skeleton,
  empty state, error state, mobile tap targets)

### Requirement: Perceived Performance Budgets
Each portal SPA entry (`/owner`, `/employee`, `/client`) SHALL meet these budgets on a cold load over TLS on
a simulated **Fast 3G** profile (Lighthouse mobile preset):

| Metric | Budget |
|--------|--------|
| Largest Contentful Paint (LCP) | ≤ 2.5 s |
| Cumulative Layout Shift (CLS) | ≤ 0.1 |
| Total blocking time (TBT) | ≤ 300 ms |
| First route JS (gzip) | ≤ 180 KB |

Subsequent client-side navigations SHALL paint the main content region within 100 ms when data is cached.

#### Scenario: Owner entry meets budget
- **WHEN** Lighthouse runs against `/owner` on a tenant site with white-label enabled
- **THEN** LCP, CLS, and TBT are within budget and first-route JS is ≤ 180 KB gzip

### Requirement: Loading And Skeleton States
Every portal screen that fetches data SHALL show a **skeleton layout** matching the final content structure
within one animation frame of mount. Skeletons SHALL NOT flash for less than 200 ms (minimum display) to avoid
flicker. Hard failures SHALL show a recoverable error panel with retry — never a blank main region.

#### Scenario: Today loads gracefully
- **WHEN** an owner opens `/owner` on a slow network
- **THEN** stat cards, job list, and inbox regions each show skeleton placeholders until data arrives or errors

#### Scenario: API failure is recoverable
- **WHEN** a portal API returns 5xx
- **THEN** the user sees an inline error with a Retry action; the shell nav remains usable

### Requirement: Empty States With Next Action
Empty lists and first-run panels SHALL use illustrated or icon-led empty states with **one primary next
action** (never a dead end). Copy SHALL be plain language aligned with portal audience (owner / staff /
customer).

#### Scenario: New tenant owner
- **WHEN** an owner with zero bookings opens Today
- **THEN** they see a welcoming empty state with a primary action to create their first inquiry or booking

### Requirement: Motion And Reduced Motion
The design system SHALL define standard motion durations (fast 120 ms, normal 200 ms, slow 320 ms) and easing
curves. Decorative motion SHALL respect `prefers-reduced-motion: reduce` and disable non-essential transitions.

#### Scenario: Reduced motion honored
- **WHEN** the OS has reduced motion enabled
- **THEN** page transitions and celebratory animations are suppressed while focus and opacity feedback remain

### Requirement: Accessibility Baseline
All three portals SHALL meet **WCAG 2.1 Level AA** for color contrast, keyboard operability, focus
visibility, form labels, and landmark regions. Interactive targets SHALL be at least 44×44 CSS px on touch
viewports.

#### Scenario: Keyboard navigation
- **WHEN** a user tabs through the owner shell
- **THEN** focus order follows visual order, skip-to-content is available, and no keyboard trap occurs in modals

#### Scenario: Automated a11y scan
- **WHEN** axe runs on `/owner`, `/employee`, and `/client` home routes
- **THEN** zero critical or serious violations are reported

### Requirement: Visual Regression Gate
The portal-kit and each SPA SHALL maintain **visual regression snapshots** for flagship screens (listed in
`portal-premium-experience` design.md) at desktop (1280×800) and mobile (390×844) viewports. Unintentional
diffs SHALL fail CI; intentional diffs require updated baselines in the same PR.

#### Scenario: Unintended style change caught
- **WHEN** a CSS change alters the owner Today hero layout beyond a 0.1% pixel diff threshold
- **THEN** the visual regression job fails

### Requirement: Flagship Screen Acceptance
The following screens SHALL be redesigned to the Premium Quality Bar before phase close:

| Portal | Flagship routes |
|--------|-----------------|
| Owner | `/owner` (Today), `/owner/pipeline` (+ job workspace), `/owner/money`, `/owner/brand` |
| Employee | `/employee` (My Day), `/employee/dispatch` |
| Client | `/client`, `/client/events/:id`, `/client/pay`, `/client/planning` |

Non-flagship routes SHALL adopt the new component library but MAY retain legacy layout until a follow-up
polish pass if they pass PQB accessibility and loading requirements.

#### Scenario: Sales demo path
- **WHEN** a prospect tenant admin completes trial login
- **THEN** Today, Pipeline, and Client Home each present polished flagship layouts without scaffold artifacts
  (unstyled tables, raw JSON debug, system-only fonts as the sole typeface)

### Requirement: No Client-Side Money Math
Premium visualizations (charts, trend chips, progress rings) SHALL display amounts only from backend-formatted
strings or aggregate counts. The SPA SHALL NOT parse currency strings for arithmetic.

#### Scenario: Revenue trend chip
- **WHEN** Today shows a revenue trend
- **THEN** the percentage and amounts are returned by `portal_owner` APIs; the chart layer only renders labels
