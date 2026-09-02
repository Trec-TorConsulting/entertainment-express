# Design: Phase 20 — Role-Based Portals (`/owner`, `/employee`, `/app` for operators)

> Prereq: **phase-1 Definition of Done met** (identity/roles, provisioning, `/client` portal, `Plan`).
> Read `openspec/project.md` §3 (stack), §4 (multi-tenancy), §7 (Frappe conventions), §9 (security), and the
> baseline specs `openspec/specs/owner-portal/spec.md`, `openspec/specs/employee-portal/spec.md`,
> `openspec/specs/identity-access/spec.md`, `openspec/specs/customer-portal/spec.md`.
>
> **File-path convention:** app paths are relative to `entertainment_express/entertainment_express/` (the
> inner app package), written as `app/...`. Frontend SPA paths are relative to the repo `frontend/` folder.
> Infra paths are relative to `HomeLab-Redo/entertainment-express/` (referred to as `HL/`).
>
> **Golden rules for this change:** one backend only (never a second DB/service/namespace); every boundary
> and permission check is **server-side**; money is currency-safe (`frappe.utils.flt`, never float math);
> multi-tenant isolation is never crossed; enforcement is **staged and reversible**.

---

## A. Architecture decision (read first)

**Decision: one backend, four role-based frontends. Do NOT build separate backends.**

- **One backend.** Keep the single `entertainment_express` Frappe app, one MariaDB DB per tenant site, one
  whitelisted-API + role-permission layer. `/owner`, `/employee`, and `/client` are **frontends** that call
  the **same** APIs. This preserves the isolation guarantee (`project.md` §4) and the "reuse, don't reinvent"
  principle (§7). Separate backends would duplicate business logic and fracture permissions — explicitly
  rejected.
- **Four experience surfaces, gated by role tier:**

  | Surface | Route | Allowed roles | Tech |
  |---------|-------|---------------|------|
  | Operator Desk | `/app` (Frappe Desk) | `System Manager`, `SaaS Operator` | Frappe Desk (unchanged) |
  | Owner Portal | `/owner` | `EE Tenant Admin` | React+Vite+TS SPA (new) |
  | Employee Portal | `/employee` | all other EE staff roles | React+Vite+TS SPA (new) |
  | Customer Portal | `/client` | `EE Customer` / authenticated non-staff | existing `www/client` + SPA |

- **Why SPAs for `/owner` and `/employee` (not Frappe-native pages):** the existing `frontend/customer-portal`
  and `frontend/dispatch-portal` already establish React + Vite + TypeScript + Tailwind + React Query +
  Zustand + React Router as the app-like-experience stack. Owner/employee portals are app-like (dashboards,
  boards, forms), so they use the **same** stack for consistency and reuse. (This differs from phase-19's
  marketing site, which is Frappe-native because it is public/SEO content — a different problem.)
- **Security model:** the SPA is only a shell. Every route is **guarded server-side** at the `www` host page
  before the shell is served, and **every API the shell calls re-checks role + record permissions**. The UI
  never grants access; the server does.

---

## B. Role tiers & the backend boundary (`app/security/request_guards.py`)

Extend the **existing** guard file (already wired in `hooks.py` via `before_request`). Do not create a new
mechanism — build on `sanitize_backend_urls` / `enforce_backend_boundary` / `get_website_user_home_page`.

### B.1 Role sets (define at module top, replacing the single `INTERNAL_BACKEND_ROLES` usage)
```python
SUPER_ADMIN_ROLES = {"System Manager", "SaaS Operator"}
OWNER_ROLES       = {"EE Tenant Admin"}
# Employee = any EE staff role that is NOT owner and NOT customer.
EMPLOYEE_ROLES    = {
    "EE Sales", "EE Dispatcher", "EE Accounting", "EE Marketing",
    "EE HR", "EE Office", "EE Entertainer", "EE Crew",
}
CUSTOMER_ROLES    = {"EE Customer"}
# Keep INTERNAL_BACKEND_ROLES = SUPER_ADMIN_ROLES | OWNER_ROLES | EMPLOYEE_ROLES for backward-compat with
# any existing imports, but the boundary logic below uses the tiered sets.
```

### B.2 Route constants
```python
EE_OWNER_PORTAL    = "/owner"
EE_EMPLOYEE_PORTAL = "/employee"
EE_CLIENT_PORTAL   = "/client"   # existing
EE_OPERATOR_HOME   = "/app/workspace/entertainment-express"  # existing EE_BACKEND_HOME
```

### B.3 Portal resolver
Add one helper that maps a user to their home portal (used by both the boundary rewrite and the login
landing):
```python
def resolve_home_portal(user: str) -> str:
    roles = set(frappe.get_roles(user) or [])
    if roles & SUPER_ADMIN_ROLES:  return EE_OPERATOR_HOME
    if roles & OWNER_ROLES:        return EE_OWNER_PORTAL
    if roles & EMPLOYEE_ROLES:     return EE_EMPLOYEE_PORTAL
    return EE_CLIENT_PORTAL
```

### B.4 Staged enforcement flag (reversible rollout — REQUIRED)
Read a mode from `EE Portal Settings` (see §F), falling back to `frappe.conf.get("ee_portal_mode")`, default
`"warn"`:
- `"off"` — no boundary change; legacy behavior (owners/employees may use `/app`).
- `"warn"` — owners/employees may still reach `/app`, but the portals are live and a dismissible banner tells
  them to move; used during rollout and parity verification.
- `"enforce"` — owners/employees requesting `/app` are rewritten to their portal (below). Flip here only
  after §J parity checks pass. Flip back to `"warn"` instantly if anything is missing.

### B.5 Boundary behavior for `/app` and `/desk` (extend `sanitize_backend_urls`)
For backend paths (`/app`, `/desk`, and their subpaths), after the existing brand-sanitizing logic, apply the
tiered rule. **Follow the existing pattern of rewriting `PATH_INFO` (never raising `Redirect` in
`before_request`, per the note already in the file):**
- `Guest` → existing behavior (rewrite to `/client`, which itself redirects to login).
- `System Manager` / `SaaS Operator` → allow (no change).
- mode `enforce` and user in `OWNER_ROLES` → `req.environ["PATH_INFO"] = "/owner"; frappe.local.path = "owner"`.
- mode `enforce` and user in `EMPLOYEE_ROLES` → rewrite to `/employee` likewise.
- mode `enforce` and customer/other → rewrite to `/client`.
- mode `warn`/`off` → leave `/app` reachable (banner handled in the Desk via a lightweight injected notice).

### B.6 Deep API defense-in-depth (`enforce_backend_boundary`)
Keep throwing `frappe.PermissionError` for any `/api/method/frappe.desk...` or `/app/...` deep call from a
non-super-admin **when mode is `enforce`**, so a hand-crafted request cannot bypass the shell. In `warn`/`off`
keep the current lenient behavior.

### B.7 New portal login guards (mirror `require_client_login`)
Add two guards used by the new `www` host pages' `get_context`:
```python
def require_owner_login():    # Guest -> /login?redirect-to=/owner ; wrong role -> resolve_home_portal()
def require_employee_login(): # Guest -> /login?redirect-to=/employee ; wrong role -> resolve_home_portal()
```
Each: if `Guest` → redirect to `/login?redirect-to=<path>` (use the existing `_redirect` helper, which is safe
in `get_context`). If authenticated but role not permitted → redirect to `resolve_home_portal(user)`.

### B.8 Post-login landing (`get_website_user_home_page`)
Extend the existing hook to use `resolve_home_portal(user)` for authenticated users so owners land on
`/owner`, employees on `/employee`, customers on `/client`. Super admins still resolve to the operator Desk.
Because Frappe may still send system users to `/app` on login, the §B.5 rewrite (mode `enforce`) is the
backstop that bounces them to the right portal — no login-flow surgery needed.

> **Audit:** any role grant/revoke performed from the owner portal (§E.3) MUST write an audit entry
> (`identity-access` → *Audit of Access & Permission Changes*). Reuse the existing audit utility; do not
> invent a new log.

---

## C. Server routes & host pages (create these exactly)

Both SPAs are hosted by a **role-guarded Frappe `www` page** so the boundary is enforced before any shell
loads. Client-side routing is handled by the SPA; a catch-all route rule sends deep links to the host.

| Route | File(s) | Purpose |
|-------|---------|---------|
| `/owner` (+ `/owner/*`) | `app/www/owner/index.html` + `app/www/owner/index.py` | guard via `require_owner_login()`, then render the owner SPA host shell |
| `/employee` (+ `/employee/*`) | `app/www/employee/index.html` + `app/www/employee/index.py` | guard via `require_employee_login()`, then render the employee SPA host shell |

- **`index.py`** (`get_context`): call the matching guard first; set `context.no_cache = 1`; inject the built
  asset URLs (read from the Vite manifest, see §I) and a small bootstrap JSON (`csrf_token`, current user,
  roles, tenant branding from `EE Portal Settings`). Set `context.no_sidebar`/full-width so the SPA owns the
  viewport.
- **`index.html`**: minimal Jinja that renders `<div id="root"></div>`, the bootstrap `<script>`, and the
  hashed JS/CSS `<script>/<link>` tags from the manifest. No portal UI in Jinja — the SPA renders everything.
- **Route rules** in `hooks.py` `website_route_rules` (add):
  ```python
  {"from_route": "/owner/<path:app_path>",    "to_route": "owner"},
  {"from_route": "/employee/<path:app_path>", "to_route": "employee"},
  ```
  so `/owner/approvals`, `/employee/dispatch`, etc. all resolve to the guarded host and the SPA router takes
  over on the client.

---

## D. Frontend SPAs & shared UI kit (`frontend/`)

Mirror the **existing** `frontend/customer-portal` and `frontend/dispatch-portal` setup exactly (Vite +
React 18 + TS + Tailwind + `@tanstack/react-query` + `zustand` + `react-router-dom`). A lower-capability model
should **copy an existing project's config files** and adapt.

### D.1 Shared UI kit — `frontend/portal-kit/`
One small internal package consumed by owner + employee (and adoptable by customer) portals so all portals are
modern and consistent:
- `src/tokens.css` — design tokens (color, spacing, typography, radius, shadow) as CSS variables.
- `tailwind-preset.js` — shared Tailwind preset importing the tokens; each SPA's `tailwind.config` extends it.
- `src/components/` — `AppShell` (responsive nav + header), `DataTable` (sort/filter/**saved views**/bulk
  actions), `StatCard`, `EmptyState` (icon + message + primary action), `CommandPalette` (global search + quick
  actions), `Toast`, `FormField`, `Money` (renders currency-safe strings from the API — never formats money
  itself), `Skeleton`.
- `src/api/client.ts` — a thin `fetch` wrapper that sends the Frappe CSRF token, credentials, and base path;
  helpers `call(method, args)` (whitelisted RPC) and `resource(doctype)` (REST). Centralizes error handling so
  every portal shows consistent, safe errors (no stack traces).
- `src/api/session.ts` — reads the bootstrap JSON injected by the host page (user, roles, branding).

### D.2 Owner Portal — `frontend/owner-portal/`
Standard Vite React TS structure. `vite.config.ts` sets `base: "/assets/entertainment_express/owner/"` and
`build.outDir` to `app/public/owner` with `manifest: true`. Routes (React Router):

| Path | View | Data source |
|------|------|-------------|
| `/owner` | **Cockpit** — StatCards (revenue, new bookings, pipeline, at-risk, outstanding), date-range picker | `api.portal_owner.get_owner_dashboard` |
| `/owner/approvals` | **Approvals queue** — list + approve/reject | `get_approvals` / `act_on_approval` |
| `/owner/finances` | **Financial overview** — outstanding balances, upcoming payouts (read-focused) | `get_financial_overview` |
| `/owner/team` | **Team & access** — list staff, invite, assign/revoke EE role, deactivate | `list_staff` / `invite_staff` / `set_staff_roles` |
| `/owner/catalog` | **Catalog & pricing** — service items, packages, add-ons, pricing | existing catalog API (`api/catalog.py`) |
| `/owner/settings` | **Portal settings** — branding/white-label + feature toggles | `EE Portal Settings` (REST) |

### D.3 Employee Portal — `frontend/employee-portal/`
Same setup; `base: "/assets/entertainment_express/employee/"`, `outDir` `app/public/employee`. The home is
**role-adaptive**: it reads the user's roles from the bootstrap/session and renders only the permitted
workspace cards. Routes:

| Path | View | Visible to | Data source |
|------|------|-----------|-------------|
| `/employee` | **My Day** — my tasks, my assignments, today's schedule | all staff | `api.portal_employee.get_my_day` |
| `/employee/sales` | Leads / quotes / bookings | `EE Sales` | existing CRM/quote/booking APIs |
| `/employee/dispatch` | Dispatch board / assignments / run sheets | `EE Dispatcher` | existing dispatch API (reuse `dispatch-portal` components) |
| `/employee/field` | My events / run sheet / check-in-out / media | `EE Crew`, `EE Entertainer` | existing `api/mobile_api_v2.py` |
| `/employee/accounting` | Invoices / payments / payouts | `EE Accounting` | existing billing APIs |

- **Reuse, don't rebuild:** the Dispatch workspace should import/reuse the board+map components already in
  `frontend/dispatch-portal`; the Field workspace should consume the same `mobile_api_v2` endpoints the crew
  app uses. Extract shared pieces into `portal-kit` where clean, otherwise import directly.
- **Command palette** (`portal-kit`) is mounted globally for global search + quick actions.

### D.4 Modernization requirements (apply across both portals — the "modern & user-friendly" ask)
- Role-based landing (no generic dashboard); **task-first** home cards (Today / Urgent / Waiting / Approvals).
- Consistent `DataTable` everywhere: saved views, filters, bulk actions.
- Helpful **empty states** with a guided next action (never a blank panel).
- Inline validation + plain-language errors (map backend errors to friendly copy in `portal-kit`).
- Mobile-first layouts; primary actions reachable on small screens.
- One design system via `portal-kit` tokens + preset; a documented performance budget (first meaningful paint
  and interaction latency targets) checked in §J.

---

## E. New APIs (thin, read-optimized, role-checked)

Create only the aggregate/dashboard endpoints below; everything else reuses existing APIs. All are
`@frappe.whitelist()`, start with an explicit server-side role check, are tenant-scoped by construction (they
run on the tenant site), and never float-math money.

### E.1 `app/api/portal_owner.py` (guard: caller must hold `EE Tenant Admin`)
- `get_owner_dashboard(from_date, to_date)` → `{revenue, new_bookings, pipeline_value, at_risk_count, outstanding_balance, series:[...]}` (money as currency-safe strings via `flt`/`fmt_money`).
- `get_approvals()` → list of pending items (discount/refund/reschedule/payout) with type, ref doctype+name, requested_by, amount, summary.
- `act_on_approval(approval_type, doctype, name, decision, note)` → applies through the standard document; writes an audit entry; idempotent (re-approving a decided item is a no-op).
- `get_financial_overview()` → `{outstanding:[...], upcoming_payouts:[...]}` (read-only, currency-safe).
- `list_staff()` / `invite_staff(email, full_name, roles[])` / `set_staff_roles(user, roles[])` / `deactivate_staff(user)` — **reject any attempt to grant `System Manager`/`SaaS Operator`**; only EE roles allowed; every change audited.

### E.2 `app/api/portal_employee.py` (guard: caller must hold any `EMPLOYEE_ROLES` role)
- `get_my_day()` → role-adaptive payload: `{roles:[...], tasks:[...], assignments:[...], schedule:[...]}` built only from the caller's permitted data.
- `search(query)` → command-palette results across bookings/customers/events, filtered by the caller's read permissions (never leak records they can't see).

> Both files must have unit tests asserting a **wrong-role caller gets 403** and that record scoping holds
> (§J).

---

## F. Data model (minimal)

**No new business DocTypes.** One optional configuration Single:

**`EE Portal Settings`** — Single, module **Entertainment Express Core** (or the existing settings module).
Owner-editable via `/owner/settings`.

| Fieldname | Type | Notes |
|-----------|------|-------|
| `portal_mode` | Select `off\|warn\|enforce` | staged enforcement flag read by §B.4 (default `warn`) |
| `brand_logo` | Attach Image | white-label logo for all tenant portals |
| `brand_color` | Data | primary brand color (hex) applied via `portal-kit` tokens |
| `brand_name` | Data | display name shown in portal headers |
| `feature_flags` | Small Text (JSON) | per-tenant portal feature toggles |

Read by the host pages (§C) to inject branding into the bootstrap JSON. No customer PII; no money. Ship any
config via fixtures if a default row is needed.

---

## G. Login & redirect flow (end to end)

1. User submits credentials at `/login` (unchanged Frappe auth; 2FA/lockout per `identity-access`).
2. On success, `get_website_user_home_page` (§B.8) resolves the role-based home; a `redirect-to` param (set by
   the portal guards for deep links) takes precedence when present and safe.
3. If Frappe still routes a staff system-user to `/app`, the §B.5 rewrite (mode `enforce`) bounces them to
   their portal. In `warn`/`off`, `/app` remains reachable with a "move to your portal" banner.
4. The portal host page (§C) runs its guard again (defense in depth) before serving the shell.
5. The shell reads the bootstrap JSON and calls role-checked APIs; the server re-checks on every call.

---

## H. Deployment (no new infra)

- Build both SPAs in CI (`npm ci && npm run build` in each `frontend/*-portal`), output into
  `app/public/owner` and `app/public/employee`; Frappe serves them at
  `/assets/entertainment_express/owner/...` and `.../employee/...` (matches each SPA's Vite `base`).
- Served through the **existing** Traefik ingress on the tenant host (`{tenant}.app.{base_domain}`); `/owner`,
  `/employee`, `/client` are just routes on the same site. **No new Deployment, Service, Ingress, or
  namespace.** (`project.md` §8.)
- `bench build` / asset bundling picks up `public/owner` + `public/employee`; the host pages read the Vite
  manifest to emit hashed asset tags (cache-busting).

---

## I. Asset wiring detail

- Each SPA's `vite.config.ts`: `base` = its `/assets/entertainment_express/<owner|employee>/`,
  `build.outDir` = `../../entertainment_express/entertainment_express/public/<owner|employee>`,
  `build.manifest = true`, single entry `src/main.tsx`.
- Host `index.py` reads `public/<portal>/.vite/manifest.json`, resolves the entry chunk + CSS, and passes their
  `/assets/...` URLs to the template. Fail safe: if the manifest is missing, render a plain "portal building"
  message (never a stack trace).

---

## J. Testing & acceptance (gates for flipping to `enforce`)

- **Boundary tests** (`app/tests/`): for each tier, assert routing — owner→`/owner`, employee→`/employee`,
  customer→`/client`, operator→`/app`; and that a wrong-role request to a portal host is redirected, not
  served. Include a mode-matrix test (`off`/`warn`/`enforce`).
- **API permission tests:** wrong-role caller to `portal_owner.*` / `portal_employee.*` → 403; owner cannot
  grant `System Manager`/`SaaS Operator`; `search`/`get_my_day` never return records outside the caller's
  permissions.
- **Isolation test:** portal APIs return only the current tenant's data (run on two sites; no cross-leak).
- **Audit test:** a role change via `/owner/team` writes an audit entry with actor/when/before/after.
- **Money test:** dashboard/financial amounts equal the backend documents to full currency precision.
- **UX/a11y/perf:** portals usable on mobile + keyboard; automated a11y check has no critical violations;
  first-load and interaction meet the §D.4 performance budget.
- **Parity checklist (per role):** before flipping that role's tier to `enforce`, confirm every task the role
  previously did in `/app` is doable in its portal (or intentionally deferred and documented).

---

## K. Rollout stages (build in this order — see `tasks.md`)

1. **Foundation & boundary** (staged flag, tiered guards, login landing, two guarded host pages, `portal-kit`
   scaffold) — ship in `warn` so nothing is locked out.
2. **Employee Portal** — My Day + the highest-value workspace (Dispatch or Field), reusing existing apps/APIs.
3. **Owner Portal** — cockpit + approvals + team/access + settings.
4. **Modernization & `/client` alignment** — apply `portal-kit` across portals; polish empty states, command
   palette, saved views.
5. **Harden & enforce** — full tests (§J), per-role parity checks, then flip `portal_mode` to `enforce`.
