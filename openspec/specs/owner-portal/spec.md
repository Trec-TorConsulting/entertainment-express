# Capability: Owner Portal

## Purpose
The dedicated, modern business cockpit for a tenant's **owner/operator** (`EE Tenant Admin`), served at
`/owner`. It replaces the Frappe Desk (`/app`) as the owner's day-to-day home so owners run their company
through a purpose-built, task-first, mobile-responsive experience instead of the raw admin UI. The Frappe
Desk at `/app` is reserved for the SaaS platform operator (`System Manager` / `SaaS Operator`) only.

The Owner Portal is an **experience surface over the existing single backend** — it consumes the same
whitelisted REST APIs and enforces the same server-side permissions as the rest of EE. It never introduces a
separate backend or database.

### Role
- **EE Tenant Admin** — the tenant owner/operator. This is the only role whose home is `/owner`.

## Requirements

### Requirement: Owner Access Boundary
The system SHALL make `/owner` the post-login home for `EE Tenant Admin` users, SHALL deny them the platform
operator Desk at `/app`, and SHALL deny non-owner users access to `/owner` — all enforced server-side,
independent of UI state.

#### Scenario: Owner lands on the owner portal
- **WHEN** an `EE Tenant Admin` logs into their tenant site
- **THEN** they are taken to `/owner`, not `/app`, and see their business cockpit

#### Scenario: Owner is kept out of the operator Desk
- **WHEN** an `EE Tenant Admin` requests `/app` (or any `/app/...` route) while enforcement is active
- **THEN** they are routed to `/owner` and never reach the Frappe/ERPNext Desk

#### Scenario: Non-owner cannot open the owner portal
- **WHEN** an employee, customer, or guest requests `/owner`
- **THEN** access is denied (guests are sent to login; authenticated non-owners are sent to their own portal)

### Requirement: Business Cockpit Dashboard
The system SHALL present the owner a dashboard of the business's key metrics — revenue, booking pipeline,
upcoming/at-risk events, utilization, and outstanding balances — for a selectable date range, scoped strictly
to that tenant.

#### Scenario: Owner reviews performance
- **WHEN** an owner opens `/owner` and selects a date range
- **THEN** the cockpit shows revenue, new bookings, pipeline value, at-risk events, and outstanding balances
  for that range, computed server-side from the tenant's own data only

#### Scenario: Empty state guides first actions
- **WHEN** a brand-new tenant with no data opens the cockpit
- **THEN** each panel shows a helpful empty state with a next-step action instead of a blank or broken widget

### Requirement: Approvals & Exceptions Queue
The system SHALL surface items that require the owner's decision (e.g., discounts above threshold, refunds,
reschedule/cancellation requests, crew payouts) in a single queue with approve/reject actions that write back
through the existing backend documents and are audited.

#### Scenario: Owner approves an exception
- **WHEN** an owner approves or rejects an item in the approvals queue
- **THEN** the underlying document is updated through the standard backend flow and the decision is recorded
  in the audit log with actor, timestamp, and before/after

### Requirement: Financial Overview
The system SHALL give the owner a read-focused financial overview (revenue, deposits, outstanding balances,
upcoming payouts) without exposing the full accounting Desk, using currency-safe values.

#### Scenario: Owner checks money owed
- **WHEN** an owner opens the financial overview
- **THEN** they see outstanding customer balances and upcoming payouts with amounts formatted via the
  backend's currency precision (never float-math), scoped to their tenant

### Requirement: Team & Access Management
The system SHALL let the owner invite staff, assign and revoke EE roles, and deactivate accounts from the
portal, with every role change enforced and audited server-side.

#### Scenario: Owner invites an employee
- **WHEN** an owner invites a new staff member and assigns an EE role
- **THEN** the account is created/invited with exactly that role, can reach only `/employee`, and the change
  is written to the audit log

#### Scenario: Owner cannot escalate to platform operator
- **WHEN** an owner attempts to grant `System Manager` or `SaaS Operator`
- **THEN** the action is rejected server-side — owners may only manage EE staff/customer roles

### Requirement: Catalog, Pricing & Portal Settings
The system SHALL let the owner configure the sellable catalog (service items, packages, add-ons, pricing
rules) and tenant-level portal settings (branding/white-label, feature toggles) without using the Desk.

#### Scenario: Owner adjusts a package price
- **WHEN** an owner edits a package's price in the owner portal
- **THEN** the change persists through the standard backend document and is reflected in booking/quote flows

#### Scenario: Owner white-labels the portals
- **WHEN** an owner sets a logo and brand color in portal settings
- **THEN** the `/owner`, `/employee`, and `/client` portals render with that branding for the tenant

### Requirement: Mobile-Responsive Cockpit
The system SHALL render the owner portal usably on phone, tablet, and desktop, keeping primary actions
reachable on small screens.

#### Scenario: Owner uses a phone
- **WHEN** an owner opens `/owner` on a phone
- **THEN** the cockpit, approvals, and navigation are fully usable without horizontal scrolling or clipped
  controls

### Requirement: Company Operating System
The system SHALL present `/owner` as the tenant owner’s full company OS (not a metric-only cockpit): Today, Calendar, Pipeline, Dispatch, Catalog, Gear, People, Money, Reports, Automations, and Brand — in plain language, using existing backend documents. The owner SHALL be able to perform every tenant-admin action these modules expose without using `/app`.

#### Scenario: Owner runs the week from Today
- **WHEN** an `EE Tenant Admin` opens `/owner`
- **THEN** they see this week’s jobs, money in/out (API strings), at-risk jobs, and an inbox of approvals plus unread booking chats, with a single next action per empty panel

#### Scenario: Owner edits pipeline without desk
- **WHEN** an owner opens `/owner/pipeline`
- **THEN** they can list, open, create, update, and remove inquiries without using `/app`

#### Scenario: Owner is not technical
- **WHEN** the owner opens Catalog or Money
- **THEN** labels are business words (Packages, What customers owe) and no DocType or ERP module names are shown

### Requirement: Company And Talent Modes
The system SHALL show a Company | Talent switch when the owner also holds `EE Entertainer` or `EE Crew`. Company mode SHALL remain full OS. Talent mode SHALL show that user’s field My Day (assignments, check-in, run sheet) without hiding Company navigation permanently.

#### Scenario: Owner who performs
- **WHEN** the user has `EE Tenant Admin` and `EE Entertainer` and opens `/owner`
- **THEN** they can switch to Talent and see their own gigs; switching back restores the company OS

#### Scenario: Owner who only runs the show
- **WHEN** the user has `EE Tenant Admin` and no entertainer/crew role
- **THEN** no Talent switch is shown and they still have full Company access including other people’s dispatch/assignments

### Requirement: Owner Report Pack
The system SHALL offer canned company reports on `/owner/reports` with CSV/PDF export: period jobs and revenue, outstanding and deposits held, pipeline conversion, at-risk jobs, gear and people utilization, payouts due, and revenue by service type. Amounts SHALL be backend-formatted. The pack SHALL NOT include general ledger or chart of accounts.

#### Scenario: Owner exports outstanding
- **WHEN** the owner runs Outstanding balances for a date range and exports CSV
- **THEN** the file contains only that tenant’s invoices and money strings from the backend

### Requirement: Send Proposal Without Desk
The system SHALL let the owner create, preview, and send a Proposal from Pipeline or a job on `/owner`.

#### Scenario: Send from pipeline
- **WHEN** an owner opens an inquiry and sends a Proposal
- **THEN** the customer can open it on `/client` and the owner sees sent/viewed/accepted status without `/app`

### Requirement: Clone Job
The system SHALL let the owner duplicate a job or save it as a reusable template from `/owner` Calendar. Clone SHALL NOT copy payments, signatures, chat, or guests.

#### Scenario: Duplicate last weekend’s setup
- **WHEN** an owner clones a completed job to a new date
- **THEN** packages, hidden warehouse lines, and timeline structure copy; invoices and signatures do not

### Requirement: Conflict Banner On Quotes
The system SHALL show potential and actual resource conflicts when the owner builds or sends a Proposal.

#### Scenario: Two quotes one booth
- **WHEN** two sent proposals need the same unique asset on the same slot
- **THEN** each shows a potential-conflict warning and sending is still allowed

### Requirement: Reminders Are Live
The system SHALL make `/owner/automations` list workflow templates and notification toggles (deposit chase, planning-form reminder, proposal follow-up) backed by existing notification settings — not an empty state.

#### Scenario: Owner turns off deposit chase
- **WHEN** an owner disables deposit chase
- **THEN** the scheduler does not send that reminder for this tenant
