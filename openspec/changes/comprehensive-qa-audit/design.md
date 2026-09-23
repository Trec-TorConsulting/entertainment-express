## Context

Entertainment Express has 4 portal frontends (Owner, Employee, Customer, Dispatch), a public marketing site, 89 API modules, and a React Native crew mobile app. The current E2E test suite consists of 4 Playwright spec files (17 tests total) that verify pages load without errors and execute one golden-path business workflow. This covers ~5% of the interactive surface.

The existing test infrastructure (`tests/e2e/support/session.ts`) provides solid foundations: login/logout per persona, sidebar navigation, `watchPage` error telemetry, and `callMethod` for API assertions. The Playwright config is minimal (single project, workers=1, Desktop Chrome only).

The QA tenant is accessed via `EE_E2E_BASE` environment variable. Three personas (Owner, Employee, Client) are seeded via `scripts/seed_qa_personas.py`. Tests run against a live Frappe/ERPNext bench instance — there is no mock server or test database.

## Goals / Non-Goals

**Goals:**
- Full click-by-click interactive coverage of every portal page, form, dialog, tab, and button
- API contract tests for all 12 major API module groups (89 files total)
- 8 cross-persona end-to-end business workflow tests
- Role-based access control verification on every API endpoint
- Form validation error testing (required fields, invalid inputs)
- Test data lifecycle management (create → assert → cleanup)
- Granular test execution (by suite, by persona, tagged subsets)

**Non-Goals:**
- Performance/load testing (separate concern, different tooling)
- Visual regression screenshots (already covered by `portal-quality-gates.spec.ts`)
- Accessibility/Axe scans (already covered by `portal-quality-gates.spec.ts`)
- React Native crew app testing (requires Detox/Appium, not Playwright)
- Stripe real-charge testing (use test-mode keys only; never charge real cards)
- Multi-tenant isolation testing (requires control-plane access; separate spec)
- Application code changes (this change is test-only)

## Decisions

### Decision 1: Live-tenant testing, not mocks
**Choice:** Run all tests against a live QA tenant via `EE_E2E_BASE`.
**Rationale:** The existing infrastructure already works this way. Live tests catch real integration bugs (database, permissions, API responses) that mocks would miss. The trade-off is speed (network latency) and test data management, but for a system handling money and contracts, real-stack confidence outweighs mock speed.
**Alternative considered:** Mock API server — rejected because Frappe's permission system, CSRF handling, and controller logic can't be faithfully mocked.

### Decision 2: Test file organization by persona + concern
**Choice:** Organize tests into numbered directories (`01-owner/`, `02-employee/`, `03-client/`, `04-public/`, `05-workflows/`, `06-api/`).
**Rationale:** The numbered prefixes enforce execution order (persona-specific before cross-persona workflows). Each file maps 1:1 to a portal page or API module, making it easy to find and maintain tests. The directory structure mirrors the application architecture.
**Alternative considered:** Flat structure with naming conventions — rejected because 80+ files in one directory is unmanageable.

### Decision 3: Extend session.ts, don't replace
**Choice:** Build new support modules (`api-client.ts`, `fixtures.ts`, `assertions.ts`) that compose with the existing `session.ts` rather than rewriting it.
**Rationale:** `session.ts` is proven in production tests. The `watchPage`, `login`, `clickNav`, `callMethod`, and `assertShell` functions are battle-tested. Adding typed wrappers and factories on top preserves backward compatibility with existing tests.

### Decision 4: Playwright projects for suite isolation
**Choice:** Add named projects in `playwright.config.ts` for each suite directory.
**Rationale:** Enables running `npx playwright test --project=api` for fast API-only testing during development, while the full suite still runs with the default command. Projects share the same browser configuration but can be independently filtered.

### Decision 5: Test data factories with cleanup
**Choice:** Each test creates its own test data with unique timestamps and cleans up via API after the test.
**Rationale:** Tests must be independently runnable and not depend on pre-existing data (beyond the seeded personas). Unique timestamp suffixes prevent name collisions when tests run in parallel or are rerun. Cleanup prevents the QA tenant from accumulating stale test records over time.
**Alternative considered:** Shared test fixtures created once in global setup — rejected because it creates hidden dependencies between tests and makes debugging failures harder.

### Decision 6: E-sign testing via programmatic canvas
**Choice:** Test e-signature by programmatically drawing on the signature canvas via `page.evaluate()` JavaScript injection rather than simulating mouse/touch drawing.
**Rationale:** Mouse-based canvas drawing is flaky across viewports and headless browsers. Programmatic canvas fill produces a deterministic, non-empty signature that triggers the same code path as real drawing. The API-level assertion confirms the signature was processed correctly.

### Decision 7: Stripe test mode with Stripe test card numbers
**Choice:** Use Stripe's official test card numbers (`4242 4242 4242 4242`) in payment flow tests, relying on Stripe Elements in test mode.
**Rationale:** Stripe's test mode + test cards exercise the full payment flow (UI → tokenize → charge) without real money. If Stripe test keys aren't configured on the QA tenant, payment submission tests should skip with a descriptive message rather than fail.

## Risks / Trade-offs

**[Flakiness from live-tenant dependency]** → Mitigation: Global setup pre-flight health check (`ping` endpoint). Each test has generous timeouts (inherited from existing 180s config). `watchPage` catches real errors vs. false positives by ignoring known benign console messages.

**[Test data accumulation on QA tenant]** → Mitigation: Cleanup functions in fixtures. Additionally, a periodic tenant reset script can be scheduled if accumulation becomes a problem.

**[QA tenant unavailability blocks all tests]** → Mitigation: Global setup fails fast with a descriptive error message. API contract tests could potentially run against a local dev bench as a fallback.

**[Test execution time (~80 files × ~5 tests each)]** → Mitigation: Suite-level projects enable running targeted subsets. API tests (fastest) can serve as a fast smoke gate. Workers=1 is required for session-based tests but could be relaxed for stateless API tests.

**[Stripe test-mode keys may not be configured]** → Mitigation: Payment flow tests check for Stripe configuration and skip with `test.skip()` if not available, rather than failing the entire suite.

## Open Questions

- **QA tenant stability:** Is the QA tenant (`e2esmoke.entx.app` or equivalent) reliably available? Should we add a liveness cron to alert if it goes down?
- **CI integration:** Should these tests run on every PR, nightly, or on-demand only? The full suite may take 30-60 minutes against a live tenant.
- **Test data seeding beyond personas:** Some tests (e.g., invoice payment, event photos) require pre-existing data (bookings, uploaded media). Should we expand `seed_qa_personas.py` to seed test bookings and sample data, or have each test create its own prerequisites?
