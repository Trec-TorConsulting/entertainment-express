## ADDED Requirements

### Requirement: Today Dashboard Interactive Coverage
The test suite SHALL verify every interactive element on the Owner Today dashboard page at `/owner/`.

#### Scenario: Today dashboard loads with expected widgets
- **WHEN** an Owner navigates to `/owner/`
- **THEN** the page displays revenue summary cards, upcoming bookings list, action items, and a quick-actions toolbar without JS errors

#### Scenario: Quick action buttons are clickable
- **WHEN** an Owner clicks each quick-action button on the Today dashboard (e.g., "+ New Inquiry", "Add Booking")
- **THEN** the corresponding dialog or navigation occurs without errors and the owner can dismiss/cancel back to the dashboard

### Requirement: Calendar and Booking CRUD Coverage
The test suite SHALL verify full CRUD operations for bookings through the Calendar page at `/owner/calendar`.

#### Scenario: Creating a new booking via Calendar
- **WHEN** an Owner clicks "Add Booking", fills in Event Name, Client Host Name, Event Date, Start Time, End Time, Location, Contract Total, and Notes, then clicks Save
- **THEN** the booking dialog closes, the booking appears on the calendar view, and a `portal_crud.list_records` API call confirms the booking exists with status "Confirmed"

#### Scenario: Editing an existing booking
- **WHEN** an Owner clicks an existing booking on the calendar and modifies the Event Name and Contract Total fields, then saves
- **THEN** the updated values persist and are confirmed via API

#### Scenario: Cancelling a booking
- **WHEN** an Owner opens a booking and clicks "Cancel Booking" and confirms the cancellation
- **THEN** the booking status changes to "Cancelled" and is confirmed via API

#### Scenario: Calendar view navigation
- **WHEN** an Owner switches between Month, Week, and Day views and navigates forward/backward through dates
- **THEN** each view renders correctly without JS errors and bookings display in the correct date slots

### Requirement: Schedule Page Coverage
The test suite SHALL verify the Owner Schedule page at `/owner/schedule` renders correctly with all interactive elements.

#### Scenario: Schedule page loads with crew availability
- **WHEN** an Owner navigates to `/owner/schedule`
- **THEN** the page displays a schedule grid showing crew availability, bookings, and time slots without errors

### Requirement: Pipeline CRM Full Coverage
The test suite SHALL verify all pipeline/CRM operations including the full lead lifecycle.

#### Scenario: Creating a new inquiry
- **WHEN** an Owner clicks "+ New Inquiry", fills in Client/Contact Name, Email Address, Phone, Event Date, Event Type, and Notes, then clicks "Create Deal"
- **THEN** the inquiry dialog closes, the deal appears in the pipeline view, and the record exists via API with status "New"

#### Scenario: Moving a deal through pipeline stages
- **WHEN** an Owner edits a deal and changes Pipeline Status through each stage (New → Qualified → Proposal Sent → Booked → Lost)
- **THEN** each status change persists via API and the deal card moves to the correct pipeline column

#### Scenario: Filtering and searching deals
- **WHEN** an Owner types a client name into the pipeline filter field
- **THEN** only deals matching the filter text are displayed

#### Scenario: Reviewing deal details
- **WHEN** an Owner clicks "Review" on a deal card
- **THEN** a detail drawer/panel opens showing all deal information including contact details, event details, and activity history

### Requirement: Dispatch Board Full Coverage
The test suite SHALL verify all dispatch board operations at `/owner/dispatch` including crew assignment and shift management.

#### Scenario: Viewing dispatch board for a specific date
- **WHEN** an Owner navigates to Dispatch and selects a date that has bookings
- **THEN** booking cards appear with event details, time, location, and crew assignment controls

#### Scenario: Assigning crew to a booking
- **WHEN** an Owner selects a crew member from the Person dropdown on a booking card and clicks "Offer shift"
- **THEN** the card updates to show "Waiting on them" and the `portal_dispatch.job_crew` API confirms the crew assignment with status "offered"

#### Scenario: Reassigning crew
- **WHEN** an Owner changes the assigned crew member on a booking that already has an assignment
- **THEN** the previous assignment is removed and the new assignment is created

### Requirement: Fleet and Safety Page Coverage
The test suite SHALL verify the Fleet & Safety page at `/owner/fleet` including vehicle health monitoring.

#### Scenario: Fleet health dashboard loads
- **WHEN** an Owner navigates to `/owner/fleet`
- **THEN** the page displays vehicle/asset health cards, maintenance status, and inspection alerts without errors

#### Scenario: Van manifest page loads
- **WHEN** an Owner navigates to `/owner/fleet/vans`
- **THEN** the van manifest view displays all registered vehicles with their load status and assignment details

### Requirement: Emergency Overrides Page Coverage
The test suite SHALL verify the Emergency Overrides page at `/owner/operations/overrides`.

#### Scenario: Emergency overrides page loads
- **WHEN** an Owner navigates to Emergency Overrides
- **THEN** the page displays active overrides, emergency contacts, and quick-action controls without errors

### Requirement: Event Details Page Coverage
The test suite SHALL verify the Event Details page at `/owner/event-details`.

#### Scenario: Event details page displays booking information
- **WHEN** an Owner navigates to Event Details for an existing booking
- **THEN** all tabs (Details, Crew, Timeline, Planning, Music, Financials) render correctly and switch without errors

### Requirement: Packages Catalog Full CRUD Coverage
The test suite SHALL verify full CRUD for service packages at `/owner/catalog`.

#### Scenario: Creating a new package
- **WHEN** an Owner clicks "Create Package" and fills in Package Title, Package Base Rate, Description, and Category, then clicks Save
- **THEN** the dialog closes, the package appears in the catalog list, and the record exists via API

#### Scenario: Editing a package
- **WHEN** an Owner clicks an existing package, modifies the title and rate, and saves
- **THEN** the updated values persist and are confirmed via API

#### Scenario: Archiving a package
- **WHEN** an Owner clicks archive/deactivate on a package
- **THEN** the package is removed from the active catalog view and its status changes via API

### Requirement: Gear and Assets Full CRUD Coverage
The test suite SHALL verify full CRUD for equipment/assets at `/owner/gear`.

#### Scenario: Adding a new asset
- **WHEN** an Owner clicks "Add Asset" and fills in Asset Name, Category, Serial Number, Condition, and Purchase Date, then saves
- **THEN** the asset appears in the gear list and the record exists via API

#### Scenario: Editing an asset
- **WHEN** an Owner modifies an asset's condition status and notes, then saves
- **THEN** the changes persist via API

#### Scenario: Retiring an asset
- **WHEN** an Owner marks an asset as retired/decommissioned
- **THEN** the asset status updates and it moves to the retired view

### Requirement: People and Team Management Coverage
The test suite SHALL verify team member management at `/owner/people`.

#### Scenario: Adding a team member
- **WHEN** an Owner clicks "Add Person" and fills in Name, Email, Phone, and Role, then saves
- **THEN** the team member appears in the people list and the record exists via API

#### Scenario: Editing a team member
- **WHEN** an Owner modifies a team member's role or contact information, then saves
- **THEN** the changes persist via API

#### Scenario: Deactivating a team member
- **WHEN** an Owner deactivates/removes a team member
- **THEN** the team member is removed from the active roster

### Requirement: Places and Venues Full CRUD Coverage
The test suite SHALL verify full CRUD for venue management at `/owner/places`.

#### Scenario: Adding a new venue
- **WHEN** an Owner clicks "Add Venue" and fills in Venue Name, Address, Contact Name, Contact Phone, Load-in Instructions, Parking Notes, and Power Availability, then saves
- **THEN** the venue appears in the places list and the record exists via API

#### Scenario: Editing a venue
- **WHEN** an Owner modifies a venue's logistics fields, then saves
- **THEN** the changes persist via API

### Requirement: Partners and Vendors Coverage
The test suite SHALL verify vendor/partner management at `/owner/partners`.

#### Scenario: Adding a new partner
- **WHEN** an Owner clicks "Add Partner" and fills in Partner Name, Category, Email, and Phone, then saves
- **THEN** the partner appears in the partners list and the record exists via API

### Requirement: Subcontractors Page Coverage
The test suite SHALL verify subcontractor management at `/owner/subcontractors`.

#### Scenario: Subcontractors page loads with listings
- **WHEN** an Owner navigates to Subcontractors
- **THEN** the page displays subcontractor listings, job postings, and management controls without errors

### Requirement: Money and Invoices Full Coverage
The test suite SHALL verify all financial operations at `/owner/money`.

#### Scenario: Creating an invoice
- **WHEN** an Owner clicks "+ Create Invoice", selects a Booking, reviews the line items and total, then clicks "Create balance invoice"
- **THEN** the invoice is created with a unique invoice number and is confirmed via API

#### Scenario: Viewing invoice details
- **WHEN** an Owner clicks on an existing invoice
- **THEN** the invoice detail view shows line items, payment status, and action buttons (Send, Record Payment)

#### Scenario: Filtering invoices
- **WHEN** an Owner filters invoices by status (Draft, Sent, Paid, Overdue)
- **THEN** only invoices matching the filter are displayed

### Requirement: Payroll Settlement Coverage
The test suite SHALL verify payroll operations at `/owner/money/payroll`.

#### Scenario: Payroll settlement page loads
- **WHEN** an Owner navigates to Money → Payroll
- **THEN** the page displays pending timesheets, approved amounts, and settlement controls without errors

### Requirement: Reports Page Coverage
The test suite SHALL verify the reports dashboard at `/owner/reports`.

#### Scenario: Reports page loads with available reports
- **WHEN** an Owner navigates to Reports
- **THEN** the page displays report cards/tiles for available reports (Revenue, Bookings, Crew Performance, etc.)

#### Scenario: Generating a report
- **WHEN** an Owner selects a report type and applies date range filters
- **THEN** the report renders with data visualizations and/or tabular data

### Requirement: AI Assistant Page Coverage
The test suite SHALL verify the AI Assistant page at `/owner/assistant`.

#### Scenario: AI Assistant page loads
- **WHEN** an Owner navigates to Assistant
- **THEN** the page displays the AI chat interface with input field and conversation history without errors

### Requirement: Plan and Subscription Page Coverage
The test suite SHALL verify the Plan page at `/owner/plan`.

#### Scenario: Plan page loads with current subscription
- **WHEN** an Owner navigates to Plan
- **THEN** the page displays current plan details, usage metrics, and upgrade/downgrade options

### Requirement: Automations Page Coverage
The test suite SHALL verify the Automations (Reminders) page at `/owner/automations`.

#### Scenario: Automations page loads
- **WHEN** an Owner navigates to Automations
- **THEN** the page displays configured automation rules, triggers, and toggle controls without errors

### Requirement: Grow Marketing Page Coverage
The test suite SHALL verify the Grow page at `/owner/grow`.

#### Scenario: Grow page loads with marketing tools
- **WHEN** an Owner navigates to Grow
- **THEN** the page displays marketing campaign tools, review management, and engagement metrics

### Requirement: Import and Migration Page Coverage
The test suite SHALL verify the Import/Migration page at `/owner/import`.

#### Scenario: Import page loads
- **WHEN** an Owner navigates to Import
- **THEN** the page displays import options, data mapping tools, and migration status without errors

### Requirement: Company Studio Page Coverage
The test suite SHALL verify the Company Studio settings page at `/owner/settings/studio`.

#### Scenario: Company Studio page loads
- **WHEN** an Owner navigates to Company Studio
- **THEN** the page displays company profile settings, business details, and configuration options

### Requirement: Master Data Explorer Coverage
The test suite SHALL verify the Master Data page at `/owner/admin/data`.

#### Scenario: Master Data page loads
- **WHEN** an Owner navigates to Master Data Explorer
- **THEN** the page displays DocType browser, record counts, and data exploration controls

### Requirement: Brand and White-Label Full Coverage
The test suite SHALL verify all brand/white-label operations at `/owner/brand`.

#### Scenario: Uploading a logo
- **WHEN** an Owner clicks the logo upload area and selects an image file
- **THEN** the logo preview updates and the change can be saved

#### Scenario: Changing brand colors
- **WHEN** an Owner selects new primary and accent colors via the color picker
- **THEN** the preview panel updates with the new colors and the changes can be saved

#### Scenario: Saving brand settings
- **WHEN** an Owner makes brand changes (logo, colors, fonts) and clicks Save
- **THEN** the brand settings persist via API and are confirmed via `portal_crud.list_records` for brand configuration

### Requirement: Website Builder Coverage
The test suite SHALL verify the Website Builder at `/owner/website`.

#### Scenario: Website builder page loads
- **WHEN** an Owner navigates to Website
- **THEN** the page displays the website builder interface with page list, editor controls, and publish options

### Requirement: Coverage and Service Area Page Coverage
The test suite SHALL verify the Coverage page at `/owner/coverage`.

#### Scenario: Coverage page loads
- **WHEN** an Owner navigates to Coverage
- **THEN** the page displays service area configuration with map and zone controls without errors

### Requirement: Connections and Integrations Page Coverage
The test suite SHALL verify the Connections page at `/owner/connections`.

#### Scenario: Connections page loads
- **WHEN** an Owner navigates to Connections
- **THEN** the page displays available integrations (Stripe, Google Calendar, Twilio, etc.) with connect/disconnect controls

### Requirement: Security Settings Page Coverage
The test suite SHALL verify the Security page at `/owner/security`.

#### Scenario: Security page loads
- **WHEN** an Owner navigates to Security
- **THEN** the page displays security settings including password policy, 2FA configuration, and session management

### Requirement: Empty State Rendering
The test suite SHALL verify that every Owner page renders a clean empty state when no data exists for that view.

#### Scenario: Empty pipeline shows placeholder
- **WHEN** an Owner views the Pipeline page with no deals (after filtering to exclude test data)
- **THEN** an empty-state illustration or message is displayed rather than a broken or blank page

### Requirement: Form Validation Error Coverage
The test suite SHALL verify that required-field validation errors display correctly on Owner forms.

#### Scenario: Submitting a package form with empty required fields
- **WHEN** an Owner clicks "Save Package" on the Create Package dialog without filling in the Package Title
- **THEN** a validation error message is displayed and the dialog remains open
