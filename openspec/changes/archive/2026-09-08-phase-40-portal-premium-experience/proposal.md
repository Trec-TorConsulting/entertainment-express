## Why

Phases 20–39 delivered **functional** `/owner`, `/employee`, and `/client` portals with correct IA, APIs,
and white-label hooks — but the experience still reads as an internal scaffold, not a product tenants would
pay enterprise SaaS prices for. The gap is not missing backend features; it is **visual craft, interaction
design, information hierarchy, performance, and perceived quality**. Prospective tenants judge EE on these
surfaces during trial; end clients judge the tenant on `/client`. We cannot credibly charge HoneyBook /
Goodshuffle-class pricing until the three portals feel modern, confident, and production-grade.

## What Changes

- Introduce a **Portal Premium Experience** quality bar: motion, loading, empty/error states, typography,
  density modes, accessibility, and performance budgets that apply to all three authenticated portals.
- Rebuild **`frontend/portal-kit`** from a minimal token file + hand-rolled CSS into a **documented component
  library** (primitives → patterns → screens) consumed identically by owner, employee, and client SPAs.
- **Refactor portal SPAs** out of monolithic `App.tsx` files into route-based modules; add route-level code
  splitting and consistent layout shells per density (cockpit / ops / consumer).
- **Flagship screen redesigns** (highest traffic, highest judgment):
  - `/owner` — Today, Pipeline job workspace, Money, Brand
  - `/employee` — My Day, Dispatch board embed, field bottom nav
  - `/client` — Home next-action, Events detail, Pay, Planning hub
- Add **data visualization** for owner Today and Reports (sparklines, trend chips, utilization rings) using
  backend-formatted strings only — no client-side money math.
- Add **interaction polish**: command palette (⌘K), contextual actions, toast/inline feedback, optimistic
  list updates where safe, skeleton loaders, focus management, reduced-motion respect.
- **BREAKING (visual):** replaces the phase-21/25 scaffold look (system-ui stack, flat cards, dense tables
  as default). Routes and APIs stay; only presentation and front-end structure change.
- **Aesthetic north star:** **Stripe-minimal** — restrained typography, high whitespace, subtle elevation,
  brand accent used sparingly; consumer warmth on `/client` achieved through copy and photography slots, not
  bubbly UI chrome.
- **Phasing:** **40a** (portal-kit + CI gates) → **40b** (`/owner`) → **40c** (`/client` + `/employee`).
  Marketing `www` uplift is explicitly **out of scope** until portals are approved; tokens will be exportable
  for a later marketing match pass.
- **Does NOT** change backend business logic, DocTypes, money flows, tenant isolation, or SaaS operator Desk
  (`/app`). **Does NOT** convert marketing `www` to React (may consume shared tokens only).

## Capabilities

### New Capabilities

- `portal-premium-experience`: Cross-portal quality bar — performance budgets, accessibility, motion,
  loading/empty/error patterns, flagship screen acceptance criteria, and visual regression gates.

### Modified Capabilities

- `ui-design-system`: Expand from token file only to full type scale, elevation, iconography, component
  primitives, density modes, and Storybook (or equivalent) documentation.
- `owner-portal`: Add premium UX requirements for cockpit density, Today/Pipeline/Money flagship screens,
  and navigation wayfinding at scale (20+ nav items).
- `employee-portal`: Add premium UX requirements for ops density, My Day, dispatch embed chrome, and
  phone-first field patterns.
- `customer-portal`: Add premium UX requirements for consumer warmth, trust signals on Pay/Sign, and
  planning-hub delight (progress, celebration micro-moments).

## Impact

- **Frontends:** `frontend/portal-kit/**`, `frontend/owner-portal/**`, `frontend/employee-portal/**`,
  `frontend/customer-portal/**`; rebuild `entertainment_express/public/{owner,employee,client}/`.
- **Dependencies:** Likely adds a headless primitive layer (e.g. Radix) + Tailwind (or CSS-modules with
  token pipeline) to portal-kit; no new backend services.
- **Tests:** Visual regression snapshots, a11y lint (axe), Lighthouse CI budgets on three portal entry URLs;
  existing API/integration tests unchanged.
- **Specs delivered:** `portal-premium-experience` (new baseline after archive), deltas to four capabilities
  above.
- **Depends on:** phases 20–25 (portal shells + APIs), 21 (tokens), 38–39 (white-label). **Unblocks:**
  credible demo/sales, tenant retention, and future mobile-web parity.
- **Cluster:** bench image bump after SPA rebuild; no ingress or namespace changes.
