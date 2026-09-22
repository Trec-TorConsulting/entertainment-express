# Capability: Frontend Test Plan & Quality Gates

## Requirements

### Requirement: Frontend Surface Routing
The frontend platform SHALL restrict top-level URL routes to `/owner`, `/employee`, `/client`, and `/`. Standalone top-level `/dispatch` and `/crew` URLs SHALL redirect cleanly to `/employee`.

#### Scenario: Dispatch or Crew URL Access
- **Given** a user navigates to `/dispatch` or `/crew`
- **When** the request is processed
- **Then** the application redirects to `/employee` or `/employee/dispatch` without breaking navigation.

### Requirement: Owner Full Lifecycle & CRUD Automation
The test suite SHALL automate the complete Owner persona lifecycle: account setup, catalog/inventory CRUD, lead-to-booking sales funnel, dispatch assignment, invoicing, payment recording, and financial cost center settlement.

#### Scenario: Owner End-to-End Execution
- **Given** an Owner user on `/owner`
- **When** creating catalog items, converting leads to bookings, assigning crew, and processing invoice payments
- **Then** all CRUD mutations succeed and the event reaches completed settlement with 0 errors.

### Requirement: Employee Ops & Field Milestone Automation
The test suite SHALL automate the complete Employee persona lifecycle: inspecting run sheets, advancing event day milestones, scanning equipment, reporting gear damage, submitting timesheets, and checking earnings.

#### Scenario: Employee Field Progression Execution
- **Given** an Employee user on `/employee`
- **When** advancing milestones from dispatched to cleared and logging gear checks
- **Then** milestone state updates persist without UI or backend exceptions.

### Requirement: Client Self-Service Proposal & Planning Automation
The test suite SHALL automate the complete Client persona lifecycle: public quote requests, tokenized proposal e-signatures, deposit payments, planning forms, timeline editing, and music choices.

#### Scenario: Client Booking & Planning Execution
- **Given** a Client user on `/client` or `/w/<token>`
- **When** executing a contract, paying a deposit, and completing event planning forms
- **Then** booking state updates to confirmed with 0 errors.
