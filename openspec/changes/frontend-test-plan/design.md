# Design: Comprehensive Frontend Test Architecture

## Architecture & Test Harness
- **Framework**: Playwright TypeScript E2E suite (`tests/e2e/system-wide-portal-crawler.spec.ts`).
- **Target Surfaces**:
  1. `/owner/` - Owner Portal SPA routes (Today, Pipeline, Money, Catalog, Fleet, Fleet/Gear, Operations/Calendar, Settings, Security).
  2. `/employee/` - Employee Portal SPA routes (My Day, Dispatch, Earnings, Profile, Timeoff, Workspaces).
  3. `/client/` - Customer Portal SPA routes (Dashboard, Bookings, Quotes, Invoices, Contracts, Planning, Deliverables).
  4. `/` - Marketing & Tenant Public Pages (Home, Pricing, Solutions, Blog, Contact).
- **Telemetry Collection**:
  - `page.on('console')`: Fail on any level="error" message.
  - `page.on('pageerror')`: Fail on any unhandled JS exception.
  - `page.on('response')`: Fail on any HTTP 4xx/5xx status code (excluding intentional 401/403/429 checks).
  - DOM Inspector: Check for React Error Boundary message nodes.
- **Reporting**: Output Markdown (`system-crawler-report.md`) and HTML (`system-crawler-report.html`) containing URL metrics and error logs.
