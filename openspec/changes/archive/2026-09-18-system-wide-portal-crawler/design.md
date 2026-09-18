## Context

Entertainment Express operates multiple web portals and web applications (Owner Portal, Employee Portal, Dispatch Portal, Crew App, Customer Portal, and Public Marketing pages) backed by Frappe/ERPNext on tenant hosts like `e2esmoke.entx.app`.

To avoid bad user experiences (such as dead links, 404s, client JS crashes, missing asset chunks, unhandled React rendering errors, or server-side Python 500 exceptions), we require an automated, full system-wide crawler test that navigates every route under real user session permissions and correlates frontend behavior with backend error logs.

## Goals / Non-Goals

**Goals:**
- **Exhaustive Multi-Role Route Discovery**: Crawl all routes across Owner (`/owner/*`), Employee (`/employee/*`), Dispatch (`/dispatch/*`), Crew (`/crew/*`), Customer (`/client/*`), and Public (`/*`) surfaces.
- **Frontend Exception Catching**: Log and fail on JS console errors, unhandled rejections, React Error Boundary fallbacks, and 4xx/5xx network responses.
- **Backend Error Correlation**: Snapshot Frappe `Error Log` (`/api/resource/Error Log`) before and after the crawler run to detect Python tracebacks triggered during navigation.
- **Action Safety Heuristics**: Prevent test data corruption by filtering out destructive state-mutating actions (e.g. Delete, Cancel, Purge).
- **Automated Artifact Reporting**: Produce a human-readable Markdown/HTML report with visited routes, broken links, console errors, backend tracebacks, and screenshots of failed views.

**Non-Goals:**
- Synthetic load testing / stress testing (this is functional and visual link integrity testing).
- Penetration testing or vulnerability scanning.
- Testing non-tenant external third-party domains (e.g., external Stripe checkout URLs are verified for status but not recursively crawled).

## Decisions

1. **Playwright as Primary Crawler Engine**:
   - *Rationale*: Playwright supports Chromium headless execution, multi-context browser storage states (allowing 5 distinct role sessions concurrently), network interception, console listener hooks, and automatic screenshot capture.
   - *Alternative Considered*: Python `requests` or `BeautifulSoup` script — rejected because SPAs (Vite / React Router) render dynamic client-side routes and require real browser JS evaluation.

2. **Action Safety Filter via CSS/Attribute Regex**:
   - *Rationale*: When dynamically discovering clickable elements, buttons/links matching `/delete|cancel|remove|destroy|reset|purge|charge|stripe/i` or `[data-destructive="true"]` are logged as "discovered action buttons" but not clicked, ensuring the smoke environment (`e2esmoke`) remains stable.

3. **Backend Frappe `Error Log` Snapshotting**:
   - *Rationale*: UI navigation might catch 200 OK responses on initial API calls while background workers or asynchronous hook triggers crash on Frappe. Fetching `/api/resource/Error Log` filtered by creation timestamp catches all server tracebacks.

## Risks / Trade-offs

- **[Risk]**: Deep dynamic modal dialogs or endless pagination controls could cause crawler loops.
  - **Mitigation**: Set a maximum crawl depth per portal (`maxDepth: 4`) and track visited normalized URL paths in a `Set<string>`.
- **[Risk]**: Unauthenticated redirects during crawler execution if authentication cookies expire.
  - **Mitigation**: Pre-authenticate each role session using automated login tokens before crawling, and fail early if a route unexpected redirects to `/login`.

## Migration Plan

1. Implement `tests/e2e/system-wide-portal-crawler.spec.ts`.
2. Implement `scripts/verify_backend_error_logs.py`.
3. Add `npm run test:e2e:crawler` to `package.json`.
4. Run locally and against `https://e2esmoke.entx.app`.
