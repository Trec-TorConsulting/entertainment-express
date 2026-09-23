## ADDED Requirements

### Requirement: Typed API Client Wrapper
The test suite SHALL provide a typed TypeScript API client module at `tests/e2e/support/api-client.ts` that wraps the existing `callMethod` function with per-persona session management, typed response interfaces, and automatic CSRF token handling.

#### Scenario: Calling an API method with typed response
- **WHEN** a test calls `apiClient.call("entertainment_express.api.portal_crud.list_records", { kind: "package" })` using an authenticated owner session
- **THEN** the client returns a typed response object with `ok: boolean`, `status: number`, and `message` containing `rows: Array` with the expected field shapes

#### Scenario: Automatic CSRF token refresh
- **WHEN** a test makes multiple sequential API calls within the same persona session
- **THEN** the client reuses the CSRF token from the initial login and refreshes it automatically if a 403 CSRF error is returned

### Requirement: Test Data Factories
The test suite SHALL provide a test data factory module at `tests/e2e/support/fixtures.ts` that generates deterministic, collision-free test data with unique timestamp-based identifiers for all major entity types.

#### Scenario: Creating a test package with unique name
- **WHEN** a test calls `fixtures.createPackage(page, { title: "DJ Gold" })`
- **THEN** a package is created via the UI with a unique name like `DJ Gold 482915` and the factory returns `{ name: string, cleanup: () => Promise<void> }`

#### Scenario: Creating a test booking with linked entities
- **WHEN** a test calls `fixtures.createBooking(page, { eventName: "Wedding", clientName: "Smith" })`
- **THEN** a booking is created via the UI with unique identifiers, linked to a client record, and the factory returns the booking details plus a cleanup function

### Requirement: Reusable Assertion Helpers
The test suite SHALL provide an assertion helper module at `tests/e2e/support/assertions.ts` with reusable functions for common test assertions across all portal suites.

#### Scenario: Asserting a dialog closed after save
- **WHEN** a test calls `assertions.assertDialogClosed(page, "Create New Catalog Package")`
- **THEN** the assertion waits up to 20 seconds for the named dialog to be hidden and fails with a descriptive message if it remains visible

#### Scenario: Asserting form data persisted via API
- **WHEN** a test calls `assertions.assertRecordSaved(page, "package", { item_name: "DJ Gold 482915" })`
- **THEN** the assertion calls the `portal_crud.list_records` API and verifies a matching record exists with the expected field values

#### Scenario: Asserting role-restricted access
- **WHEN** a test calls `assertions.assertRoleDenied(page, "entertainment_express.api.portal_owner.dashboard_stats")` while logged in as a Client persona
- **THEN** the assertion verifies the API returns HTTP 403 or a Frappe PermissionError

### Requirement: Global Test Setup and Teardown
The test suite SHALL provide a global setup module at `tests/e2e/support/global-setup.ts` that verifies QA tenant health and seeds required personas before any test suite runs.

#### Scenario: Pre-flight tenant health check
- **WHEN** the Playwright global setup executes before the first test
- **THEN** it pings `EE_E2E_BASE/api/method/ping` and fails fast with a descriptive error if the QA tenant is unreachable

#### Scenario: Persona verification
- **WHEN** the global setup runs
- **THEN** it verifies all three personas (owner, employee, client) can successfully authenticate against the QA tenant

### Requirement: Per-Suite Playwright Projects
The test suite SHALL configure `playwright.config.ts` with separate projects for each test suite directory (`01-owner`, `02-employee`, `03-client`, `04-public`, `05-workflows`, `06-api`) enabling independent execution.

#### Scenario: Running only owner tests
- **WHEN** an operator runs `npx playwright test --project=owner`
- **THEN** only tests under `tests/e2e/01-owner/` execute

#### Scenario: Running the full suite
- **WHEN** an operator runs `npx playwright test`
- **THEN** all 6 suite projects execute sequentially with workers=1

### Requirement: Granular npm Scripts
The `package.json` SHALL include named scripts for each test suite and a combined `test:e2e:all` script.

#### Scenario: Running API tests only
- **WHEN** an operator runs `npm run test:e2e:api`
- **THEN** only tests under `tests/e2e/06-api/` execute via `npx playwright test --project=api`
