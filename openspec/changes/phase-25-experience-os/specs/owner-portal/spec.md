## ADDED Requirements

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
