# Design: Comprehensive Frontend Test Architecture

## Architecture & Test Harness
- **Framework**: Playwright. Public pages click through `https://www.entx.app` (`EE_E2E_PUBLIC`). Portal pages and the golden path use `EE_E2E_BASE`. `e2esmoke.entx.app` is not provisioned, so the tenant host is required and has no default.
- **Personas**: `EE_OWNER_EMAIL`, `EE_EMPLOYEE_EMAIL`, `EE_CLIENT_EMAIL` and matching passwords. Seed with `python3 scripts/seed_qa_personas.py` using `EE_ADMIN_PASSWORD`.
- **Click-through**: `tests/e2e/portal-click-through.spec.ts` logs in, then clicks every sidebar destination. A redirect back to `/login` fails the test.
- **Golden path**: `tests/e2e/golden-path.spec.ts` creates a package, marks a lead booked, saves a booking, offers a shift, advances it to en route, and creates a balance invoice. Each step is asserted through the whitelist API.
- **CI**: `.github/workflows/live-portal-qa.yml`. `python3 smoke_test.py` stays the image gate.
- **Telemetry**: fail on `pageerror`, console errors, and HTTP 500. Asset 404s fail. Playwright keeps a trace and screenshot when a test fails. Login redirects fail the test before any page is marked passed.
