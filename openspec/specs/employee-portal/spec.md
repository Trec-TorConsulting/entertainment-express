# Capability: Employee Portal

## Purpose
The dedicated, role-adaptive operations workspace for a tenant's **staff and field crew**, served at
`/employee`. It becomes the daily home for every non-owner staff role (`EE Sales`, `EE Dispatcher`,
`EE Accounting`, `EE Marketing`, `EE HR`, `EE Office`, `EE Entertainer`, `EE Crew`), replacing the Frappe
Desk (`/app`) so employees work through a focused, mobile-first experience tailored to their role rather than
the full admin UI.

The Employee Portal is an **experience surface over the existing single backend**. It consumes the same
whitelisted REST APIs (including the existing mobile API) and enforces the same server-side permissions as
the rest of EE. It never introduces a separate backend or database. Where richer per-role experiences already
exist (the crew mobile app, the dispatch portal), the Employee Portal integrates with or reuses them rather
than duplicating them.

### Roles
- `EE Sales`, `EE Dispatcher`, `EE Accounting`, `EE Marketing`, `EE HR`, `EE Office`, `EE Entertainer`,
  `EE Crew` — any EE staff role that is **not** `EE Tenant Admin` (owner) and **not** `EE Customer`.

## Requirements

### Requirement: Employee Access Boundary
The system SHALL make `/employee` the post-login home for staff roles, SHALL deny them the platform operator
Desk at `/app`, and SHALL deny non-staff users access to `/employee` — all enforced server-side, independent
of UI state.

#### Scenario: Employee lands on the employee portal
- **WHEN** a staff user (e.g., `EE Dispatcher`) logs into their tenant site
- **THEN** they are taken to `/employee`, not `/app`, and see their role's workspace

#### Scenario: Employee is kept out of the operator Desk
- **WHEN** a staff user requests `/app` (or any `/app/...` route) while enforcement is active
- **THEN** they are routed to `/employee` and never reach the Frappe/ERPNext Desk

#### Scenario: Non-staff cannot open the employee portal
- **WHEN** an owner, customer, or guest requests `/employee`
- **THEN** access is denied (guests are sent to login; authenticated non-staff are sent to their own portal)

### Requirement: Role-Adaptive Home
The system SHALL render an employee's home adapted to their assigned role(s), surfacing a "My Day" view of
that user's tasks, assignments, and schedule, showing only capabilities their role permits.

#### Scenario: Two roles see different homes
- **WHEN** an `EE Sales` user and an `EE Crew` user each open `/employee`
- **THEN** Sales sees leads/quotes/bookings actions while Crew sees today's assigned events and check-in/out —
  each seeing only what their role permits, enforced server-side

#### Scenario: Multi-role user
- **WHEN** a user holds more than one staff role
- **THEN** the home combines the permitted workspaces and lets the user switch context between them

### Requirement: Sales Workspace
The system SHALL give `EE Sales` a workspace to work leads, build quotes, and manage bookings through the
existing CRM/quote/booking backend.

#### Scenario: Salesperson advances a lead
- **WHEN** a salesperson updates a lead or creates a quote in the workspace
- **THEN** the change persists through the standard backend documents and respects role permissions

### Requirement: Dispatch Workspace
The system SHALL give `EE Dispatcher` a workspace for the dispatch board, crew/asset assignment, and run
sheets, reusing the existing dispatch experience rather than duplicating it.

#### Scenario: Dispatcher assigns crew
- **WHEN** a dispatcher assigns crew and an asset to an event
- **THEN** the assignment is written through the standard dispatch backend and the affected crew are notified

### Requirement: Field & Crew Workspace
The system SHALL give `EE Crew`/`EE Entertainer` a mobile-first field workspace to see assigned events,
open run sheets, check in/out, and upload media, integrating with the existing mobile API and crew app.

#### Scenario: Crew checks in on site
- **WHEN** a crew member checks in to an event from the field workspace
- **THEN** the check-in is recorded through the mobile API with the correct event, time, and (where required)
  location, and appears to dispatch in real time

### Requirement: Accounting Workspace
The system SHALL give `EE Accounting` a workspace to view and act on invoices, payments, and payouts through
the existing billing backend, using currency-safe values.

#### Scenario: Accountant records a payment
- **WHEN** an accountant records or reconciles a payment in the workspace
- **THEN** the entry is written through the standard billing/accounting documents so ledgers stay correct

### Requirement: Global Search & Quick Actions
The system SHALL provide employees a global search and a command palette for quick navigation and common
actions, returning only records the user is permitted to see.

#### Scenario: Employee jumps to a booking
- **WHEN** an employee searches for a customer or booking in the command palette
- **THEN** matching records the user may access are returned and selecting one opens it; records they may not
  access never appear

### Requirement: Mobile-First Field Use
The system SHALL render the employee portal usably on phones for field roles, keeping core field actions
(view assignment, run sheet, check-in/out, capture media) reachable on small screens and tolerant of poor
connectivity where practical.

#### Scenario: Crew uses a phone in the field
- **WHEN** a crew member opens `/employee` on a phone with a weak connection
- **THEN** their assignment and run sheet remain viewable and check-in/out actions queue and complete when
  connectivity allows

### Requirement: Same Product As Owner, Role Sliced
The system SHALL give staff the same booking/quote/invoice/dispatch objects as `/owner`, filtered server-side by role, in ops density. Crew and entertainers SHALL get a phone-first My Day (assignments, run sheet, check-in/out). Dispatch SHALL reuse the existing dispatch board rather than a second scheduler.

#### Scenario: Sales vs crew
- **WHEN** `EE Sales` and `EE Crew` each open `/employee`
- **THEN** Sales sees pipeline work they may access and Crew sees only their assignments — neither sees owner Brand/Automations or other customers' jobs outside permission

### Requirement: Staff Report Pack
The system SHALL offer canned reports on `/employee/reports` limited to the user's role: Sales (my pipeline/conversion/follow-ups), Dispatch (board load, at-risk, unassigned), Field (my hours and upcoming calls), Accounting (aging and deposits to apply). Field reports SHALL NOT include company profit and loss. Amounts SHALL be backend-formatted.

#### Scenario: Crew cannot open company profit reports
- **WHEN** an `EE Crew` user requests an owner company revenue report API
- **THEN** access is denied

### Requirement: Sales Sends Proposals
The system SHALL let `EE Sales` create and send Proposals from `/employee` using the same proposal APIs as the owner, scoped by sales permissions.

#### Scenario: Salesperson sends a quote
- **WHEN** an `EE Sales` user sends a Proposal for a lead they can read
- **THEN** the Proposal is sent and a salesperson who cannot read that Customer is denied

### Requirement: Field Sees Packing Lines
The system SHALL show warehouse-only package lines on crew packing lists / run sheets even when those lines are hidden from the client Proposal.

#### Scenario: Cables on the truck list
- **WHEN** a package includes a client-hidden cable line
- **THEN** `/employee` field/dispatch packing view lists the cable and the client Proposal does not name it

### Requirement: Sales Sees Own Appointments
The system SHALL show `EE Sales` their assigned appointments on `/employee`. They SHALL NOT see another salesperson’s appointments unless they are the assigned staff or an owner.

#### Scenario: Salesperson opens My Day
- **WHEN** an `EE Sales` user opens `/employee`
- **THEN** today’s assigned consults appear and another salesperson’s consults do not

### Requirement: Run Sheet Venue And Vendors
The system SHALL show venue logistics and other vendors on the employee run sheet / field view for assigned jobs only.

#### Scenario: Crew opens the job
- **WHEN** assigned crew opens the job
- **THEN** load-in, parking, power, curfew, and other-vendor contacts for that job appear

### Requirement: Dispatcher Suggestions Without Auto Assign
The system SHALL let a dispatcher request ranked crew suggestions for an unassigned job from `/employee` Dispatch. Applying a row SHALL call the existing offer/assign API, not a silent write from the LLM.

#### Scenario: Suggest crew
- **WHEN** a dispatcher requests suggestions for an unassigned event
- **THEN** a ranked list of available crew is shown and no Crew Assignment is created until they apply one

#### Scenario: Crew cannot open company chat
- **WHEN** an `EE Crew` user calls `ask`
- **THEN** the request is denied (403)
