## 1. Setup & Authentication Infrastructure

- [x] 1.1 Create `scripts/verify_backend_error_logs.py` to query `/api/resource/Error Log` on `e2esmoke.entx.app` before and after test runs.
- [x] 1.2 Implement multi-role authentication helper in Playwright for Owner, Employee, Dispatch, Crew, and Client roles.

## 2. Playwright Crawler Core

- [x] 2.1 Create `tests/e2e/system-wide-portal-crawler.spec.ts` with BFS (Breadth-First Search) dynamic link and route crawler logic.
- [x] 2.2 Add Action Safety Filter to detect and skip destructive UI buttons (`delete`, `cancel`, `purge`, `reset`).
- [x] 2.3 Implement event listeners for JS console errors, unhandled rejections, React Error Boundaries, and HTTP 4xx/5xx network API failures.

## 3. Reporting & Verification

- [x] 3.1 Implement Markdown and HTML report generator to output visited routes, broken links, console errors, backend tracebacks, and screenshot paths.
- [x] 3.2 Add `npm run test:e2e:crawler` command script to `package.json` and verify full run against `e2esmoke.entx.app`.
