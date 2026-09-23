## Why

The existing E2E test suite covers only navigation smoke-testing (does the page load?) and a single golden-path workflow (package → lead → booking → dispatch → invoice). This leaves **~95% of the application's interactive surface untested**: no form field validation, no CRUD lifecycle tests, no API contract assertions, no multi-step business workflows beyond the one golden path, no error/edge-case coverage, no contract/e-sign flows, no payment flows, no notification checks, and no data integrity assertions.

For an enterprise SaaS platform handling money, contracts, and crew safety, this gap is unacceptable. A client who can't sign a contract, an employee whose shift state gets stuck, or an owner whose invoice silently fails to save will churn. We need click-by-click coverage of **every** interactive element, **every** API endpoint, and **every** cross-persona business workflow so that regressions are caught before they reach production.

## What Changes

- **New test infrastructure**: Typed API client, test data factories, and reusable assertion helpers extending the existing `support/session.ts` foundation.
- **Owner portal full-coverage tests** (~29 test files): Every page (Today, Calendar, Schedule, Pipeline, Dispatch, Fleet & Safety, Emergency Overrides, Event Details, Packages, Gear, People, Places, Partners, Subcontractors, Money, Payroll, Reports, Assistant, Plan, Automations, Grow, Import, Company Studio, Master Data, Brand, Website, Coverage, Connections, Security) — every form opened, every field filled, every record created/read/updated/deleted, every tab clicked, every dialog validated.
- **Employee portal full-coverage tests** (~7 test files): My Day, Dispatch Embed, Pull Sheet, Field Board, My Earnings, Reports, My Profile — shift state machine transitions, clock-in/out, equipment checklists, pay stubs, profile edits.
- **Client portal full-coverage tests** (~11 test files): Home, My Events, Event Detail, Payments & Invoices, Planning Hub, Live Event Chat, Co-Hosts & Guests, Consultations, Contracts & Docs, Event Photos, Account & Preferences — including Stripe payment submission, e-signature, planning form fill, music selection, appointment scheduling.
- **Public/guest page tests** (~10 test files): Marketing homepage, Pricing, Solutions, Features, Signup/Trial, Tenant Home, Request Quote, Guest Music Requests, Public Schedule, Blog — form submissions, link validation, SEO assertions.
- **Cross-persona workflow tests** (~8 test files): Lead-to-Cash, Quote→Contract→Sign, Booking→Dispatch→Crew, Invoice→Payment, Planning Form Submit, Music Selection, Crew Shift Lifecycle, Proposal Flow — full business-critical journeys spanning Owner↔Employee↔Client.
- **API contract/regression tests** (~12 test files): Every whitelisted API endpoint (`portal_crud`, `portal_owner`, `portal_employee`, `portal_client`, `portal_dispatch`, `portal_billing`, `portal_hr`, `booking`, `contract`, `music`, `field`, `commerce`) — authenticated CRUD, role-based access control assertions, validation error responses, pagination/filter/sort.
- **Configuration updates**: Enhanced `playwright.config.ts` with per-suite projects and tagged test groups; new `package.json` scripts for granular test execution.

## Capabilities

### New Capabilities
- `e2e-test-infrastructure`: Shared test support layer — typed API client, test data factories, reusable assertion helpers, global setup/teardown, QA persona management
- `e2e-owner-portal-tests`: Full click-by-click coverage of all 29+ Owner portal pages including CRUD operations, form validation, dialog interactions, tabs, filters, and search
- `e2e-employee-portal-tests`: Full click-by-click coverage of all 7 Employee portal pages including shift state machine, clock-in/out, equipment checklists, earnings, profile
- `e2e-client-portal-tests`: Full click-by-click coverage of all 11 Client portal pages including payment flows, e-signature, planning forms, music selection, guest management
- `e2e-public-guest-tests`: Full click-by-click coverage of all 10 public/guest-facing pages including signup, quote request, music requests, blog, SEO checks
- `e2e-workflow-tests`: Cross-persona end-to-end business workflow tests covering the 8 critical revenue/operations paths
- `e2e-api-contract-tests`: API contract and regression tests for all 12 major API module groups covering CRUD, auth, role-based access, validation, and response shape assertions

### Modified Capabilities
- `system-wide-portal-crawler`: Extended scope — the existing crawler spec covers navigation-only; new tests add form interaction, CRUD, and data verification on top of the crawler's safety-filtering and error-boundary patterns

## Impact

- **New files**: ~80 new test files under `tests/e2e/`, 3 new support modules, updated `playwright.config.ts`, updated `package.json`
- **No application code changes**: This change is test-only; it does not modify any application source, DocTypes, APIs, or deployment manifests
- **CI/CD**: New npm scripts enable granular test execution; the existing `live-portal-qa.yml` GitHub workflow can be extended to run suite-specific tests
- **Dependencies**: No new npm dependencies required — uses existing `@playwright/test` and `@axe-core/playwright`
- **QA tenant**: Requires a running QA tenant with seeded personas (`scripts/seed_qa_personas.py`); Stripe test-mode keys recommended for payment flow tests
