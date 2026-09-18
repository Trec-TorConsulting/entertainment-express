## Why

To guarantee a flawless end-user experience across all customer and crew touchpoints on tenant sites like `e2esmoke.entx.app`, we need an automated, system-wide end-to-end crawler test suite. Manual testing cannot guarantee zero broken routes, missing JS assets, client-side React rendering crashes, or hidden backend server exceptions across 30+ portal routes and multiple user role contexts.

## What Changes

- Add an automated system-wide Playwright crawler test ([`tests/e2e/system-wide-portal-crawler.spec.ts`](file:///Users/trecto282@cable.comcast.com/Projects/Personal/EntertainmentExpress/tests/e2e/system-wide-portal-crawler.spec.ts)) that logs into `e2esmoke.entx.app` under 5 distinct security roles (Owner, Employee/Dispatcher, Crew Member, Client/Customer, and Public Guest).
- Implement dynamic BFS (Breadth-First Search) link discovery to crawl every `<a href>`, navigation button, drawer link, sidebar tab, and client-side route across Owner Portal, Employee Portal, Dispatch Portal, Crew App, and Customer Portal.
- Implement an Action Safety Filter that detects state-mutating or destructive actions (e.g. Delete, Cancel, Purge, Charge) to safely skip destructive clicks while validating navigation paths and read-only views.
- Implement real-time frontend telemetry listeners for browser console errors, unhandled rejections, missing JS chunk asset failures, and HTTP network error responses (4xx/5xx).
- Add a backend health verification helper ([`scripts/verify_backend_error_logs.py`](file:///Users/trecto282@cable.comcast.com/Projects/Personal/EntertainmentExpress/scripts/verify_backend_error_logs.py)) that snapshots Frappe's `Error Log` doctype (`/api/resource/Error Log`) before and after execution to detect server-side Python tracebacks, DB exceptions, or 500 responses triggered during navigation.
- Add an HTML and Markdown test report generator that outputs visited route counts, broken links, console errors, backend exceptions, and screenshots of any failing view.

## Capabilities

### New Capabilities
- `system-wide-portal-crawler`: Automated multi-role link & route discovery crawler with frontend exception tracking, action safety filtering, and backend Frappe `Error Log` snapshot correlation.

### Modified Capabilities
- None.

## Impact

- **Test Infrastructure**: New Playwright test runner configuration and E2E crawler specification under `tests/e2e/system-wide-portal-crawler.spec.ts`.
- **Backend Verification**: New Python helper `scripts/verify_backend_error_logs.py` to inspect `/api/resource/Error Log` on `e2esmoke.entx.app`.
- **NPM & CI/CD Scripts**: New `npm run test:e2e:crawler` command to trigger full portal crawling during pre-cutover testing and smoke tests.
