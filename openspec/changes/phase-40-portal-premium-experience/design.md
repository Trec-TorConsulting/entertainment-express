## Context

**Current state (honest assessment):**

| Area | Today | Gap vs enterprise bar |
|------|-------|------------------------|
| Dependencies | React 18 + React Router only; no UI primitives | No accessible headless layer, no utility CSS pipeline |
| Design tokens | ~20 CSS vars, system-ui font | No type scale, elevation, motion, dark mode |
| portal-kit | ~20 components, hand-rolled CSS | Missing dialogs, sheets, selects, charts, form validation UX |
| Owner SPA | `App.tsx` ~4,600 lines monolith | Unmaintainable; no code splitting; inconsistent patterns |
| Employee/Client | Same pattern, thinner polish | Functional empty states, table-heavy layouts |
| CI quality gates | API tests only | No Lighthouse, axe, or visual regression on portals |
| Prior phases | 21–25 specified "designed" portals | Delivered IA + APIs; visual execution stayed scaffold-grade |

**Stakeholders:** Tobey (product + sales credibility), prospective tenant admins (trial → paid), tenant staff,
paying customers and event guests. **Constraints:** Frappe www hosts SPAs; bootstrap + CSRF from server;
white-label tokens from `getSessionBootstrap()`; money always API strings; site-per-tenant isolation unchanged.

**Competitive bar (from `project.md` + `COMPETITIVE_GAP_NOTES.md`):** HoneyBook clientflow polish, Goodshuffle
operator density, Rentman logistics clarity, modern SaaS dashboards (Stripe/Linear-level craft on key screens).

## Goals / Non-Goals

**Goals:**

- One **portal-kit v2** component library with primitives, patterns, Storybook, and PQB enforcement.
- **Flagship screen** redesigns listed in `portal-premium-experience` spec (10 routes total).
- **SPA architecture** refactor: route modules, lazy loading, shared layouts per density.
- **CI gates:** Lighthouse budgets, axe, Playwright visual snapshots on flagship routes.
- **Sales-demo path:** trial login → owner Today → client Home looks paid-product quality in < 60 s.

**Non-Goals:**

- New backend DocTypes or business APIs (use existing `portal_owner`, `portal_employee`, `portal_client`, etc.).
- Restyling SaaS operator Desk (`/app`) or converting `www` marketing to React.
- Report builder, custom GL, or new collaboration features (phase-25 scope stays).
- Native mobile app (Expo crew app) reskin — may consume tokens later.
- Illustration commission / custom photography shoot (use icon-led + optional stock placeholders).
- Perfect pixel parity across every non-flagship route in one phase (PQB a11y/loading yes; full polish follows).

## Decisions

### D1 — Headless primitives + Tailwind in portal-kit

**Choice:** Add **Radix UI** primitives + **Tailwind CSS v4** (or v3) with tokens mapped from `tokens.css`
via `@theme` / preset. SPAs import compiled portal-kit styles once.

**Why:** Building accessible Dialog/Select/Menu from scratch is slow and error-prone. Radix is MIT, tree-shakeable,
battle-tested. Tailwind speeds consistent spacing/type without inventing a BEM taxonomy.

**Alternatives considered:**

| Alt | Rejected because |
|-----|------------------|
| shadcn/ui copy-paste | Good fit but still Radix+Tailwind; we vendor into portal-kit either way |
| MUI / Chakra | Heavier bundle, harder white-label theming |
| Pure CSS modules | Slower iteration; prior hand-rolled CSS produced current scaffold |
| Frappe UI (Vue) | Wrong stack for existing React SPAs |

### D2 — Icon set: Lucide React

Single stroke icon package, wrapped as `@portal-kit/icons`. Consistent with modern SaaS aesthetic; MIT license.

### D3 — Charts: lightweight SVG sparklines, not Chart.js

**Choice:** Custom `Sparkline` + `DonutProgress` in portal-kit using SVG paths; data from backend aggregates.

**Why:** Chart.js adds ~60 KB+; we only need trends and completion rings. No client-side financial aggregation.

### D4 — SPA structure

```
frontend/owner-portal/src/
  main.tsx
  app/
    App.tsx              # routes only (~100 lines)
    layouts/OwnerLayout.tsx
    routes/
      today/
      pipeline/
      money/
      brand/
      ...                # lazy import()
  shared/                  # owner-only helpers
```

Same pattern for employee and client. **portal-kit** owns all visual components; route folders own data hooks
calling `call()`.

### D5 — Dark mode

User toggle + `system` option in account panel; tokens duplicated under `[data-theme="dark"]`. Persist
`ee-theme` in localStorage. White-label brand colors adjust via OKLCH mixing for dark surfaces (design task).

### D6 — Command palette

Extend existing `CommandPalette.tsx` with fuzzy nav + recent items + actions (New inquiry, Go to Money). Uses
`cmdk` package (small, accessible).

### D7 — Visual regression: Playwright + screenshot compare

Run against `bench` test site fixtures in CI (or static Storybook URLs for kit). Threshold 0.1% per flagship
screen. Store baselines in `frontend/portal-kit/e2e/baselines/`.

### D8 — Service worker (employee My Day only, v1)

Cache shell assets + last My Day JSON for offline **read** of today's assignments; mutations queue via existing
`offlineQueue.ts`. Owner/client offline deferred.

### D9 — Implementation order (vertical slices)

1. Kit foundations (tokens v2, Tailwind, Button→Dialog primitives, Storybook)
2. AppShell v2 (sidebar collapse, bottom nav, dark mode)
3. Owner Today (proves cockpit patterns)
4. Client Home + Pay (proves consumer trust patterns)
5. Employee My Day + Dispatch chrome
6. Owner Pipeline workspace + Money + Brand
7. Client Event hub + Planning
8. CI gates + PQB doc
9. Roll non-flagship routes to new primitives (best-effort)

### D10 — Bundle strategy

Vite `manualChunks`: `vendor-react`, `vendor-radix`, `portal-kit`. Route-level `React.lazy`. Target first-route
JS ≤ 180 KB gzip per PQB.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large PR / long review | Ordered tasks; flagship slices demoable independently; Storybook for kit review without full bench |
| Tailwind + Frappe asset pipeline | Single build step in each SPA `vite build` → `public/{portal}/`; document in FRONTEND_DEPLOYMENT.md |
| White-label contrast failures | Automated contrast check in Storybook for sample brand colors; warn in Brand preview |
| Visual regression flake | Disable animations in test env; fixed viewport; wait for network idle |
| Monolith refactor regressions | Keep route URLs identical; API tests unchanged; e2e smoke on flagship paths |
| Scope creep to marketing site | Explicit non-goal; token export only |

## Migration Plan

1. Land portal-kit v2 behind feature flag `EE Portal Settings.premium_ui_enabled` default **off**.
2. Ship flagship screens; enable flag on staging tenants; dogfood.
3. Flip default **on** for new tenants; email existing tenants "UI refresh" with screenshot.
4. Remove flag after 30 days when PQB CI green.
5. **Rollback:** disable flag; previous `public/{owner,employee,client}/` assets from prior image tag.

## Open Questions

**Resolved (2026-09-03, product owner):**

| Question | Decision |
|----------|----------|
| Aesthetic north star | **Stripe-minimal** — typographic, restrained, enterprise SaaS credibility |
| Dark mode | **Ship in v1** — toggle + system preference on all three portals |
| Phasing | **40a → 40b → 40c** (kit/CI, then owner, then client+employee) |
| Marketing site | **Portals only** now; marketing match pass after portal style is approved |
| Component stack | **Radix + Tailwind** in portal-kit |

## Sub-phase breakdown

### Phase 40a — Portal Kit & Quality Gates
Tasks 1.x–3.x, 7.1–7.3, 8.1. Delivers: tokens v2, primitives/patterns, Storybook, AppShell v2, PQB doc,
Lighthouse/axe/visual CI. No SPA flagship screens yet (Storybook + shell demo only).

### Phase 40b — Owner Premium
Tasks 4.x, owner portions of 7.4–7.6. Delivers: owner SPA refactor + O1–O4 flagship routes on AppShell v2.

### Phase 40c — Client & Employee Premium
Tasks 5.x–6.x, remaining 7.x. Delivers: E1–E2, C1–C4, service worker, staging dogfood, spec sync (8.2).

## Flagship routes (visual regression list)

| ID | Route | Viewports |
|----|-------|-----------|
| O1 | `/owner` | 1280×800, 390×844 |
| O2 | `/owner/pipeline` | 1280×800, 390×844 |
| O3 | `/owner/money` | 1280×800 |
| O4 | `/owner/brand` | 1280×800 |
| E1 | `/employee` | 390×844 |
| E2 | `/employee/dispatch` | 1280×800 |
| C1 | `/client` | 390×844 |
| C2 | `/client/events/{fixture}` | 390×844 |
| C3 | `/client/pay` | 390×844 |
| C4 | `/client/planning` | 390×844 |

## File touch map

| Path | Change |
|------|--------|
| `frontend/portal-kit/src/tokens.css` | v2 token scale |
| `frontend/portal-kit/tailwind.config.ts` | new |
| `frontend/portal-kit/src/primitives/*` | Radix wrappers |
| `frontend/portal-kit/src/patterns/*` | composites |
| `frontend/portal-kit/storybook/*` | docs |
| `frontend/portal-kit/PREMIUM_QUALITY_BAR.md` | PQB |
| `frontend/{owner,employee,customer}-portal/src/app/**` | route refactor |
| `entertainment_express/.../control_plane/doctype/ee_portal_settings/*` | `premium_ui_enabled` flag |
| `.github/workflows/portals-vercel.yml` or new `portals-quality.yml` | Lighthouse + visual |
| `entertainment_express/tests/test_portal_premium_*.py` | bootstrap flag + a11y smoke hooks |
