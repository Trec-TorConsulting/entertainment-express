## ADDED Requirements

### Requirement: Owner Premium Cockpit Chrome
The owner portal SHALL use **cockpit density** with a collapsible sidebar (icon-only collapsed state on
desktop), grouped navigation with icons, a persistent **global command palette** (⌘K / Ctrl+K), and a header
showing company context, search, notifications, and account menu. The sidebar SHALL accommodate 20+ nav items
without overwhelming via collapsible sections and a "More" overflow on narrow desktop widths.

#### Scenario: Command palette navigation
- **WHEN** an owner presses ⌘K and types "money"
- **THEN** Money appears as a navigable result and Enter routes to `/owner/money`

#### Scenario: Collapsed sidebar
- **WHEN** an owner collapses the sidebar on desktop
- **THEN** icons remain visible with tooltips; main content gains horizontal space; state persists per device

### Requirement: Today Flagship Dashboard
`/owner` (Today) SHALL present a **hero strip** (greeting, date, weather/at-risk summary), a **metric grid**
(revenue, outstanding, pipeline value, jobs this week) with trend chips when the backend provides them, an
**inbox panel** (approvals + unread chat) with inline actions, a **week schedule strip** (horizontal scroll on
mobile), and a **setup checklist** for new tenants that collapses when complete. Layout SHALL use a 12-column
responsive grid.

#### Scenario: At-risk job highlighted
- **WHEN** Today loads with at-risk jobs
- **THEN** the week strip and inbox surface those jobs with warning styling and one-click navigation to the job

### Requirement: Pipeline Job Workspace
`/owner/pipeline` SHALL use a **split view**: list/board on the left, record workspace on the right (full
width on mobile). The workspace SHALL show a **stage stepper** (inquiry → quote → contract → booked), proposal
preview, conflict banner, and a sticky action bar (Send proposal, Mark won, Archive). Kanban column view SHALL
be available as a toggle when the backend supplies stage counts.

#### Scenario: Send proposal from workspace
- **WHEN** an owner reviews a quote in the workspace and clicks Send
- **THEN** a confirmation dialog shows recipient and amount strings from the API; success shows toast + status
  chip update without full page reload

### Requirement: Money Flagship Layout
`/owner/money` SHALL group content into tabs: **Overview** (balances, deposits held, payouts due), **Invoices**
(filterable table), **Payouts**, **Holds**. Amounts SHALL use tabular figures (`font-variant-numeric:
tabular-nums`). Charts SHALL be optional sparklines fed by backend aggregates only.

#### Scenario: Invoice row actions
- **WHEN** an owner opens the invoice overflow menu
- **THEN** Refund, Send reminder, and Download PDF appear based on server-provided `allowed_actions`

### Requirement: Brand Flagship Workspace
`/owner/brand` SHALL combine style matcher, live **split preview** (portal + public book), extended kit editor
(colors, fonts, logos, footer, hide-product-chrome), and domain status in one guided layout with save
feedback. Preview SHALL update within 300 ms of token changes (client-side CSS vars only).

#### Scenario: Live preview
- **WHEN** an owner changes primary color in Brand
- **THEN** the preview pane updates immediately; Save persists via existing white-label APIs

## MODIFIED Requirements

### Requirement: Mobile-Responsive Cockpit
The system SHALL render the owner portal usably on phone, tablet, and desktop, keeping primary actions
reachable on small screens. On viewports below 768 px, primary navigation SHALL move to a **bottom tab bar**
(Today, Pipeline, Dispatch, Money, More) while secondary items remain in the More sheet.

#### Scenario: Owner uses a phone
- **WHEN** an owner opens `/owner` on a phone
- **THEN** the cockpit, approvals, and navigation are fully usable without horizontal scrolling or clipped
  controls
