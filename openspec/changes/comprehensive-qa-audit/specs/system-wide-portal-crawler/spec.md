## MODIFIED Requirements

### Requirement: Automated Multi-Role E2E Link Crawler
The system SHALL provide an automated Playwright test suite that authenticates under 5 distinct security roles (Owner, Employee/Dispatcher, Crew Member, Customer, and Guest) and crawls all client-side routes and DOM links across all Entertainment Express web portals on `e2esmoke.entx.app`. The crawler SHALL be extended to interoperate with the comprehensive QA test infrastructure, sharing the typed API client, test data factories, and assertion helpers from `tests/e2e/support/`.

#### Scenario: Multi-role portal navigation crawl
- **WHEN** the test suite executes against `https://e2esmoke.entx.app`
- **THEN** it authenticates each role session, visits all routes for Owner, Employee, Dispatch, Crew, and Customer portals, and logs zero unhandled route navigation failures.

#### Scenario: Crawler uses shared session infrastructure
- **WHEN** the crawler authenticates personas for navigation
- **THEN** it uses the shared `support/session.ts` login, logout, and persona functions rather than duplicating authentication logic
