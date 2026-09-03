# Phase 40 — Portal Premium Experience

> **Sub-phases:** 40a (kit + CI) → 40b (owner) → 40c (client + employee). Complete each sub-phase's DoD
> before starting the next.

> Maps to requirements in `portal-premium-experience`, `ui-design-system`, `owner-portal`,
> `employee-portal`, `customer-portal` delta specs.

## 40a — Portal kit & quality gates

- [x] 1.1 Add Tailwind, Radix, Lucide, cmdk to `frontend/portal-kit/package.json`; configure Vite + PostCSS in
      each SPA to consume portal-kit styles. **Accept:** `npm run build` succeeds in owner-portal.
- [x] 1.2 Expand `frontend/portal-kit/src/tokens.css` with type scale, elevation, motion, spacing, z-index,
      dark-mode overrides. Mirror into `tailwind.config.ts` `@theme`. **Accept:** Storybook swatch page shows all
      tokens.
- [x] 1.3 Create `frontend/portal-kit/PREMIUM_QUALITY_BAR.md` with Lighthouse, axe, bundle, and visual-regression
      thresholds from spec. **Accept:** doc matches `portal-premium-experience` budgets.
- [x] 1.4 Scaffold Storybook in `frontend/portal-kit/storybook/` with stories for tokens and Button. **Accept:**
      `npm run storybook` renders Button at three densities.
- [x] 1.5 Add `premium_ui_enabled` Check field to `EE Portal Settings` (default 0); expose in session bootstrap.
      **Accept:** test toggles flag and bootstrap reflects it.

## 2. Component primitives (portal-kit)

- [x] 2.1 Implement primitives: Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Badge, Card.
      **Accept:** each has Storybook states (default, disabled, loading, focus).
- [x] 2.2 Implement primitives: Dialog, Sheet, DropdownMenu, Tabs, Tooltip, Popover, Avatar, Separator,
      ScrollArea, Progress, Skeleton, Spinner, Alert. **Accept:** Dialog traps focus; Sheet slides on mobile.
- [x] 2.3 Implement Toast provider + hook; wire into portal-kit `call()` error helper. **Accept:** failed API shows
      toast with retry.
- [x] 2.4 Implement Lucide icon wrapper `Icon` with size tokens. **Accept:** owner nav icon import compiles.
- [x] 2.5 Implement dark mode: `ThemeProvider`, `data-theme` attribute, localStorage `ee-theme`. **Accept:** toggle
      in Storybook switches light/dark tokens.

## 3. Pattern components (portal-kit)

- [x] 3.1 PageHeader, StatGrid, MetricCard, TrendChip (backend strings only). **Accept:** unit test rejects
      client-side currency parse in TrendChip.
- [x] 3.2 DataTable v2 (sortable columns, row actions slot, mobile card fallback). **Accept:** sorts without full
      page reload.
- [x] 3.3 FilterBar, RecordDrawer, Timeline, BottomNav, SidebarNav (collapsible groups). **Accept:** SidebarNav
      supports 25 items in 3 groups.
- [x] 3.4 CommandPalette v2 with cmdk (nav + actions). **Accept:** ⌘K lists Money route.
- [x] 3.5 Sparkline, DonutProgress, PlanningProgress, ChatThread shell. **Accept:** Sparkline renders from numeric
      array without Chart.js.
- [x] 3.6 AppShell v2 replacing `AppShell.tsx` + CSS: collapsible rail, bottom nav, density classes. **Accept:**
      mobile 390 px shows bottom tabs for owner.

**40a Definition of done:** Storybook covers primitives; CI runs Lighthouse/axe/visual on shell fixture; PQB doc
merged; `premium_ui_enabled` flag in bootstrap.

## 40b — Owner portal

## 4. Owner portal — architecture

- [x] 4.1 Refactor `frontend/owner-portal/src/App.tsx` into `app/App.tsx` routes + `app/layouts/OwnerLayout.tsx`;
      lazy-load route modules. **Accept:** `App.tsx` < 150 lines; routes unchanged.
- [x] 4.2 Extract Today into `app/routes/today/TodayPage.tsx` using pattern components only. **Accept:** meets O1
      visual baseline; PQB skeleton on load.
- [x] 4.3 Extract Pipeline into split-view module with stage stepper + RecordDrawer. **Accept:** send proposal flow
      with toast; meets O2 baseline.
- [x] 4.4 Extract Money into tabbed layout (Overview, Invoices, Payouts, Holds). **Accept:** tabular nums on
      amounts; meets O3 baseline.
- [x] 4.5 Extract Brand into guided workspace with live CSS-var preview. **Accept:** color change < 300 ms preview;
      meets O4 baseline.
- [x] 4.6 Migrate remaining owner routes to AppShell v2 + primitives (no inline style blocks > 20 lines). **Accept:**
      axe zero critical on sampled routes.

**40b Definition of done:** O1–O4 visual baselines pass; owner sales-demo path (Today → Pipeline) polished;
`premium_ui_enabled` dogfood on staging for owner only.

## 40c — Client & employee portals

## 5. Employee portal

- [x] 5.1 Refactor employee SPA structure (same pattern as 4.1). **Accept:** lazy routes; bundle chunk split.
- [x] 5.2 My Day flagship with now/next card, timeline, at-risk banner, role quick actions. **Accept:** meets E1
      baseline; crew check-in above fold on 390 px.
- [x] 5.3 Dispatch embed polish: fullscreen, filter chips, board skeleton. **Accept:** meets E2 baseline.
- [x] 5.4 Service worker shell cache for My Day read-only offline. **Accept:** airplane mode shows cached today list
      with stale badge.

## 6. Client portal

- [x] 6.1 Refactor client SPA structure. **Accept:** lazy routes; Pay tab badge from API string.
- [x] 6.2 Home flagship: next-action hero, event carousel, money summary, planning progress rings. **Accept:** meets
      C1 baseline; guest variant hides money.
- [x] 6.3 Event detail hub with sticky header + tabs. **Accept:** meets C2 baseline with fixture booking.
- [x] 6.4 Pay flagship: trust panel, line items, checkout skeleton, success celebration (reduced-motion safe).
      **Accept:** meets C3 baseline.
- [x] 6.5 Planning hub: section cards, autosave indicator, completion celebration. **Accept:** meets C4 baseline.

## 7. CI, tests & deploy

- [x] 7.1 Add Playwright visual regression job for flagship routes O1–C4; store baselines. **Accept:** CI fails on
      unintended diff.
- [x] 7.2 Add Lighthouse CI job on `/owner`, `/employee`, `/client` against staging; enforce PQB budgets. **Accept:**
      PR fails when LCP > 2.5 s on owner.
- [x] 7.3 Add axe-playwright scan on home routes; zero critical/serious. **Accept:** wired in CI.
- [x] 7.4 Add `entertainment_express/tests/test_portal_premium_bootstrap.py` for `premium_ui_enabled` flag. **Accept:**
      bench tests pass.
- [x] 7.5 Rebuild `public/{owner,employee,client}/`; update `FRONTEND_DEPLOYMENT.md` with kit v2 build steps. **Accept:**
      deploy script produces assets; smoke_test.py portals section passes.
- [x] 7.6 Enable `premium_ui_enabled` on staging; dogfood checklist signed off. **Accept:** sales demo path recorded
      (login → Today → client Home) under 60 s without scaffold artifacts.

## 8. Roadmap & spec sync

- [x] 8.1 Add Phase 40 entry to `openspec/changes/ROADMAP.md` after phase-39. **Accept:** links to this folder.
- [x] 8.2 On phase close: archive change; sync deltas to baseline specs; run `openspec validate --specs`. **Accept:**
      validate passes.

## Definition of done

- All flagship routes (O1–O4, E1–E2, C1–C4) pass visual regression, Lighthouse PQB, and axe gates.
- `portal-premium-experience` requirements demonstrably met on staging with `premium_ui_enabled=1`.
- No new backend money or isolation regressions; `bench --site <site> run-tests --app entertainment_express` green.
- Sales-demo path usable without apologizing for UI.
