# system-wide-portal-crawler Specification

## Purpose
TBD - created by archiving change system-wide-portal-crawler. Update Purpose after archive.
## Requirements
### Requirement: Automated Multi-Role E2E Link Crawler
The system SHALL provide an automated Playwright test suite that authenticates under 5 distinct security roles (Owner, Employee/Dispatcher, Crew Member, Customer, and Guest) and crawls all client-side routes and DOM links across all Entertainment Express web portals on `e2esmoke.entx.app`.

#### Scenario: Multi-role portal navigation crawl
- **WHEN** the test suite executes against `https://e2esmoke.entx.app`
- **THEN** it authenticates each role session, visits all routes for Owner, Employee, Dispatch, Crew, and Customer portals, and logs zero unhandled route navigation failures.

### Requirement: Real-Time Frontend Telemetry and Error Boundary Interception
The crawler SHALL listen for browser console errors, unhandled JavaScript exceptions, missing React bundle chunk 404s, and HTTP 4xx/5xx network API failures during portal traversal.

#### Scenario: Catching frontend client errors
- **WHEN** a visited route or clicked tab throws a JavaScript exception or renders a React Error Boundary fallback
- **THEN** the test suite records the failure, captures a full-page PNG screenshot of the DOM, and flags the route in the test report.

### Requirement: Action Safety Filtering for Destructive UI Triggers
The crawler SHALL analyze DOM elements before interaction and filter out destructive state-mutating buttons or links to prevent corrupting test environment data.

#### Scenario: Skipping destructive UI triggers
- **WHEN** an interactive element matches destructive safety keywords (`delete`, `cancel`, `purge`, `destroy`, `reset`) or carries a `data-destructive` flag
- **THEN** the crawler logs the element as a safe discovered action target without executing a click event.

### Requirement: Backend Frappe Error Log Snapshot Correlation
The test framework SHALL query the Frappe REST API (`/api/resource/Error Log`) on `e2esmoke.entx.app` before and after execution to catch any server-side Python tracebacks, database errors, or HTTP 500 exceptions triggered during frontend traversal.

#### Scenario: Correlating server tracebacks to crawler run
- **WHEN** the crawler finishes navigating all portal routes
- **THEN** it fetches all Frappe `Error Log` entries created after the test start timestamp and asserts zero new server-side tracebacks were logged.

### Requirement: Automated HTML and Markdown Health Report Generation
The test runner SHALL generate a summary report in Markdown and HTML detailing visited routes count, list of broken links, detected console errors, backend tracebacks, and paths to failure screenshots.

#### Scenario: Generating crawler summary report
- **WHEN** the test execution completes
- **THEN** a formatted summary report is written to `tests/e2e/reports/system-crawler-report.md` and `tests/e2e/reports/system-crawler-report.html`.

