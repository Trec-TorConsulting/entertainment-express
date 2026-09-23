## ADDED Requirements

### Requirement: Portal CRUD API Contract Coverage
The test suite SHALL verify the `portal_crud` API module with full CRUD operations for every supported record kind, authenticated as each persona, and asserting correct role-based access control.

#### Scenario: List records returns correct shape for each kind
- **WHEN** an authenticated Owner calls `portal_crud.list_records` with `kind` set to each supported value (package, inquiry, job, invoice, venue, partner, asset, person, etc.)
- **THEN** the API returns HTTP 200 with `{ ok: true, rows: Array }` where each row contains the expected fields for that kind

#### Scenario: Unauthenticated access returns 403
- **WHEN** an unauthenticated request calls `portal_crud.list_records`
- **THEN** the API returns HTTP 403

#### Scenario: Create record via API
- **WHEN** an Owner calls `portal_crud.save_record` with valid data for a new package
- **THEN** the API returns HTTP 200 with the created record including a generated `name`/`id`

#### Scenario: Update record via API
- **WHEN** an Owner calls `portal_crud.save_record` with an existing record's ID and modified fields
- **THEN** the API returns HTTP 200 and a subsequent `list_records` call returns the updated values

#### Scenario: Delete record via API
- **WHEN** an Owner calls `portal_crud.delete_record` with a valid record ID
- **THEN** the API returns HTTP 200 and a subsequent `list_records` call no longer includes the deleted record

#### Scenario: Invalid kind returns error
- **WHEN** an Owner calls `portal_crud.list_records` with `kind: "nonexistent"`
- **THEN** the API returns an error response (HTTP 400 or 417)

### Requirement: Portal Owner API Contract Coverage
The test suite SHALL verify all `portal_owner` API endpoints with Owner-authenticated access and role restrictions.

#### Scenario: Owner dashboard stats return data
- **WHEN** an Owner calls `portal_owner.dashboard_stats`
- **THEN** the API returns revenue metrics, booking counts, and pipeline summary data

#### Scenario: Employee cannot access owner APIs
- **WHEN** an Employee calls `portal_owner.dashboard_stats`
- **THEN** the API returns HTTP 403 or a Frappe PermissionError

#### Scenario: Client cannot access owner APIs
- **WHEN** a Client calls `portal_owner.dashboard_stats`
- **THEN** the API returns HTTP 403 or a Frappe PermissionError

### Requirement: Portal Employee API Contract Coverage
The test suite SHALL verify all `portal_employee` API endpoints.

#### Scenario: Employee-specific views return data
- **WHEN** an Employee calls employee-specific API endpoints
- **THEN** the API returns the employee's own data (shifts, earnings, profile) without exposing other employees' data

#### Scenario: Owner cannot see employee-only endpoints as employee data
- **WHEN** an Owner calls employee-specific view endpoints
- **THEN** the API returns data scoped to the Owner's role, not employee-specific views

### Requirement: Portal Client API Contract Coverage
The test suite SHALL verify all `portal_client` API endpoints.

#### Scenario: Client views return client-scoped data
- **WHEN** a Client calls client-specific API endpoints
- **THEN** the API returns only the client's own events, invoices, and documents — never another client's data

#### Scenario: Owner cannot access client portal APIs as client
- **WHEN** an Owner calls `portal_client` endpoints
- **THEN** the API returns appropriate data or a permission error based on the endpoint's access rules

### Requirement: Portal Dispatch API Contract Coverage
The test suite SHALL verify all `portal_dispatch` API endpoints.

#### Scenario: Job crew list returns crew assignments
- **WHEN** an Owner calls `portal_dispatch.job_crew` with a valid job ID
- **THEN** the API returns an array of crew assignments with person, status_key, and role fields

#### Scenario: Job crew with invalid job returns empty or error
- **WHEN** an Owner calls `portal_dispatch.job_crew` with a nonexistent job ID
- **THEN** the API returns an empty array or a descriptive error

### Requirement: Portal Billing API Contract Coverage
The test suite SHALL verify all `portal_billing` API endpoints.

#### Scenario: Invoice creation via API
- **WHEN** an Owner calls the billing API to create an invoice for an existing booking
- **THEN** the API returns the created invoice with a unique number, correct line items, and "Draft" status

#### Scenario: Payment recording via API
- **WHEN** an Owner calls the billing API to record a payment against an invoice
- **THEN** the invoice status updates to "Paid" and the payment amount matches the invoice total

### Requirement: Portal HR API Contract Coverage
The test suite SHALL verify all `portal_hr` API endpoints.

#### Scenario: Team list returns team members
- **WHEN** an Owner calls `portal_hr` team listing endpoints
- **THEN** the API returns a list of team members with name, email, role, and status fields

#### Scenario: Role-based access on HR APIs
- **WHEN** an Employee or Client calls HR management APIs (add/remove team member)
- **THEN** the API returns HTTP 403

### Requirement: Booking API Contract Coverage
The test suite SHALL verify all `booking` API endpoints.

#### Scenario: Create booking via API
- **WHEN** an Owner calls the booking API with valid event details (name, date, time, location, client, total)
- **THEN** the API returns HTTP 200 with the created booking including a unique ID and "Confirmed" status

#### Scenario: Availability check via API
- **WHEN** an Owner calls the booking availability API with a date and service type
- **THEN** the API returns available time slots and/or conflicting bookings

#### Scenario: Booking with missing required fields returns validation error
- **WHEN** an Owner calls the booking API without a required field (e.g., missing event_date)
- **THEN** the API returns a validation error with a descriptive message

### Requirement: Contract API Contract Coverage
The test suite SHALL verify all `contract` API endpoints.

#### Scenario: Contract generation from booking
- **WHEN** an Owner calls the contract API to generate a contract for a booking
- **THEN** the API returns the generated contract with content, status "Draft", and linked booking ID

#### Scenario: Contract signing via API
- **WHEN** a Client calls the contract sign API with signature data and name confirmation
- **THEN** the contract status changes to "Signed" with a timestamp and audit trail entry

### Requirement: Music API Contract Coverage
The test suite SHALL verify all `music` API endpoints.

#### Scenario: Adding song requests via API
- **WHEN** a Client calls the music API to add a must-play song with title and artist
- **THEN** the API returns HTTP 200 and the song appears in subsequent list calls with category "must-play"

#### Scenario: Listing music selections via API
- **WHEN** an Owner calls the music API to list all song selections for a booking
- **THEN** the API returns categorized lists (must-play, do-not-play, special-moment, general-request)

### Requirement: Field API Contract Coverage
The test suite SHALL verify all `field` API endpoints.

#### Scenario: My jobs returns employee's shifts
- **WHEN** an Employee calls `field.my_jobs`
- **THEN** the API returns only the authenticated employee's shift assignments with job, status, and stage fields

#### Scenario: Shift state transition via API
- **WHEN** an Employee calls the field API to transition a shift to the next state
- **THEN** the API updates the shift status and returns the new state

### Requirement: Commerce API Contract Coverage
The test suite SHALL verify all `commerce` API endpoints.

#### Scenario: Storefront products load
- **WHEN** a Guest calls the commerce storefront API
- **THEN** the API returns available products/packages with pricing and availability

### Requirement: API Pagination and Filtering
The test suite SHALL verify that all list endpoints support pagination, filtering, and sorting parameters.

#### Scenario: Paginated list requests
- **WHEN** an Owner calls `portal_crud.list_records` with `page_size: 5` and `page: 1`
- **THEN** the API returns at most 5 records and includes pagination metadata (total count, has_next)

#### Scenario: Filtered list requests
- **WHEN** an Owner calls `portal_crud.list_records` with filter parameters
- **THEN** only records matching the filter criteria are returned

#### Scenario: Sorted list requests
- **WHEN** an Owner calls `portal_crud.list_records` with a sort parameter
- **THEN** the records are returned in the specified sort order
