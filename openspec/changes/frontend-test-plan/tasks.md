# Tasks: Frontend Test Plan Execution

- [x] Redirect standalone `/dispatch` and `/crew` routes to `/employee`
- [x] Configure Playwright to target `/owner`, `/employee`, `/client`, and `/`
- [x] Click every owner, employee, and client sidebar page after a real login (`tests/e2e/portal-click-through.spec.ts`)
- [x] Golden path: package, booked lead, confirmed booking, crew offer, en-route milestone, balance invoice (`tests/e2e/golden-path.spec.ts`)
- [x] Fail on page exceptions, console errors, and HTTP 500s
- [x] Read saved records back through the whitelisted APIs
- [x] Run the suites in `.github/workflows/live-portal-qa.yml` against the QA tenant
