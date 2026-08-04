## Why

Today every staff member — the tenant **owner** and **all employees** — works inside the raw Frappe/ERPNext
Desk at `/app`, while customers use `/client`. That means one dense admin UI serves people with very
different jobs, which is hard to learn, easy to misuse, and not mobile-friendly. The platform operator
(`System Manager` / `SaaS Operator`) also shares that same `/app` with tenants.

This change modernizes the experience layer by giving **each audience its own purpose-built portal** over the
**same single backend**, and by reserving the operator Desk for the platform operator:

- `/app` (Frappe Desk) → **platform operator only** (`System Manager`, `SaaS Operator`).
- `/owner` → **tenant owner** business cockpit (`EE Tenant Admin`).
- `/employee` → **staff & field crew** role-adaptive operations workspace (all other EE staff roles).
- `/client` → **customers** (existing customer portal; ownership unchanged).

Crucially, the answer to "should we build separate `/owner`, `/employee`, `/client` backends?" is **no** —
we keep **one backend** (one Frappe app, one DB per tenant, one API + permission layer) and build
**role-based frontends** over it. Separate backends would duplicate business logic, fracture permissions, and
break the multi-tenant isolation guarantees in `project.md` §4. Role-based portals give the UX benefits with
none of that risk.

## What Changes

- **Tighten the backend boundary.** Reserve `/app` for `System Manager` / `SaaS Operator`. Route
  `EE Tenant Admin` → `/owner`, staff roles → `/employee`, customers → `/client`. Enforced server-side in
  `security/request_guards.py` (extends the existing guard), behind a **staged enforcement flag**
  (`off | warn | enforce`) so no owner or employee is locked out before their portal reaches parity.
- **New Owner Portal** at `/owner`: a React + Vite + TypeScript + Tailwind SPA (same stack as the existing
  `customer-portal` / `dispatch-portal`) served by a role-guarded Frappe `www` host page — business cockpit,
  approvals queue, financial overview, team/access management, catalog & portal settings.
- **New Employee Portal** at `/employee`: same stack — a role-adaptive "My Day" home that surfaces the Sales,
  Dispatch, Field/Crew, and Accounting workspaces, reusing the existing dispatch portal and mobile API.
- **Role-based post-login routing** so each user lands on their portal, not the Desk.
- **A small set of read-optimized aggregate APIs** for the dashboards (owner cockpit, employee "My Day"),
  all `@frappe.whitelist()` with server-side role checks; everything else reuses existing APIs.
- **One optional Single DocType** `EE Portal Settings` for per-tenant portal branding + feature toggles.
- **A shared portal UI kit** (design tokens, Tailwind preset, base components, command palette, empty-state
  and saved-view patterns) so both new portals are modern and consistent by construction.
- **Deployment**: build both SPAs into the app's `public/` and serve them through the existing Traefik
  ingress on the tenant host — no new services or namespaces.

## Capabilities

### New Capabilities
- `owner-portal`: owner access boundary, business cockpit, approvals & exceptions, financial overview,
  team & access management, catalog/pricing/portal settings, mobile-responsive.
  (Spec: `openspec/specs/owner-portal/spec.md`.)
- `employee-portal`: employee access boundary, role-adaptive home, Sales/Dispatch/Field/Accounting
  workspaces, global search & command palette, mobile-first field use.
  (Spec: `openspec/specs/employee-portal/spec.md`.)

### Modified Capabilities
- `identity-access`: split the backend boundary into tiers (operator vs owner vs employee vs customer) and
  add role-based post-login landing. Delivers/uses **Role-Based Authorization** and **Audit of Access &
  Permission Changes**. (Spec: `openspec/specs/identity-access/spec.md`.)
- `customer-portal`: no ownership change; `/client` is aligned to the shared portal UI kit and the tiered
  boundary. (Spec: `openspec/specs/customer-portal/spec.md`.)

## Impact

- **Backend:** extends `security/request_guards.py`; adds `api/portal_owner.py` and `api/portal_employee.py`;
  adds two role-guarded `www` host pages and website route rules; one optional Single DocType.
- **Frontend:** two new Vite SPA projects (`frontend/owner-portal`, `frontend/employee-portal`) + one shared
  UI kit package, all in the established React/TS/Tailwind stack.
- **No new backend, database, service, or namespace.** Multi-tenant isolation is unchanged.
- **Reversible rollout:** the `off → warn → enforce` flag means Desk access for owners/employees is only
  removed after their portal is verified at parity; flip back to `warn` instantly if needed.
- **Depends on:** phase-1 (identity/roles, provisioning, `/client`), and reuses phase-2 dispatch and the
  phase-4/9 mobile API where present. Enhanced later by phase-10 (reporting/BI feeds the cockpit) and
  phase-12 (full control plane).
