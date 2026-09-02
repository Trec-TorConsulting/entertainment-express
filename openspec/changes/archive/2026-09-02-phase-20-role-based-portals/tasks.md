# Tasks: Phase 20 — Role-Based Portals

> Prereq: **phase-1 Definition of Done met** (identity/roles, provisioning, `/client`, `Plan`). Do tasks in
> order; check a box only when its **Accept** passes. Reference `design.md` sections (A–K) and the baseline
> specs `owner-portal`, `employee-portal`, `identity-access`, `customer-portal`.
>
> **Non-negotiables:** one backend only (no new DB/service/namespace); every boundary + permission check is
> **server-side**; money uses `frappe.utils.flt` (never float math); no cross-tenant queries; enforcement is
> **staged & reversible** — ship in `warn`, flip to `enforce` only after §9 passes. Do NOT edit ERPNext core
> DocType JSON; extend via Custom Fields/fixtures. Reuse existing APIs and the existing
> `security/request_guards.py` — extend, don't replace.

---

## Stage 1 — Foundation & boundary (ship in `warn`, nothing locked out)

### 1. Portal settings & staged flag (design §B.4, §F) — spec: owner-portal *Catalog, Pricing & Portal Settings*
- [x] 1.1 Create Single DocType `EE Portal Settings` (module Entertainment Express Core) with fields
      `portal_mode` (Select `off|warn|enforce`, default `warn`), `brand_logo`, `brand_color`, `brand_name`,
      `feature_flags` (Small Text/JSON).
      **Accept:** `bench migrate` clean; the Single opens; `portal_mode` defaults to `warn`.
- [x] 1.2 Add a helper `get_portal_mode()` in `app/security/request_guards.py` reading `EE Portal Settings.portal_mode`,
      falling back to `frappe.conf.get("ee_portal_mode")`, default `"warn"`. Cache within the request.
      **Accept:** unit test returns `warn` by default; overriding the Single or site_config changes the result.

### 2. Tiered role sets & resolver (design §B.1–B.3) — spec: identity-access *Role-Based Authorization*
- [x] 2.1 In `request_guards.py` define `SUPER_ADMIN_ROLES`, `OWNER_ROLES`, `EMPLOYEE_ROLES`, `CUSTOMER_ROLES`
      and keep `INTERNAL_BACKEND_ROLES` as their union (backward-compat).
      **Accept:** existing imports of `INTERNAL_BACKEND_ROLES` still resolve; sets contain exactly the roles in
      design §B.1.
- [x] 2.2 Add `resolve_home_portal(user)` returning the operator Desk / `/owner` / `/employee` / `/client`
      per tier.
      **Accept:** unit test: an `EE Tenant Admin`→`/owner`; `EE Dispatcher`→`/employee`; `EE Customer`→`/client`;
      `System Manager`→ operator home.

### 3. Boundary rewrite & login landing (design §B.5–B.8, §G) — spec: identity-access *Role-Based Authorization*
- [x] 3.1 Extend `sanitize_backend_urls` so that, for `/app`/`/desk` paths in mode `enforce`, owners→`/owner`,
      employees→`/employee`, customers→`/client` by **rewriting `PATH_INFO`** (never raising `Redirect` in
      `before_request`). Super admins always pass. In `warn`/`off`, leave `/app` reachable.
      **Accept:** with mode `enforce`, an `EE Tenant Admin` hitting `/app` is served `/owner`; a `System Manager`
      still gets the Desk; with mode `warn`, the owner still reaches `/app`.
- [x] 3.2 Extend `enforce_backend_boundary` to throw `PermissionError` on deep `/app/...` / `frappe.desk` API
      calls from non-super-admins **only in `enforce`**; lenient in `warn`/`off`.
      **Accept:** in `enforce`, a crafted `frappe.desk` call as `EE Sales` → 403; in `warn` it is allowed.
- [x] 3.3 Update `get_website_user_home_page` to use `resolve_home_portal(user)` for authenticated users.
      **Accept:** logging in as each tier lands on the correct portal (owner/employee/client) or operator Desk;
      a safe `redirect-to` still wins.
- [x] 3.4 Add `require_owner_login()` and `require_employee_login()` (mirror `require_client_login`): Guest →
      `/login?redirect-to=<path>`; wrong role → `resolve_home_portal(user)`.
      **Accept:** unit tests: guest → login with correct `redirect-to`; wrong-role → own portal; right-role →
      returns (no redirect).

### 4. Guarded SPA host pages & routes (design §C) — spec: owner-portal & employee-portal *Access Boundary*
- [x] 4.1 Create `app/www/owner/index.py` (`get_context` calls `require_owner_login()`, sets `no_cache`, full
      width, injects bootstrap JSON: csrf, user, roles, branding from `EE Portal Settings`) + `app/www/owner/index.html`
      (renders `<div id="root">` + bootstrap script + manifest asset tags).
      **Accept:** `GET /owner` as owner returns the shell (200) with `#root` and bootstrap JSON; as guest →
      redirect to login; as employee/customer → their own portal.
- [x] 4.2 Create `app/www/employee/index.py` + `index.html` the same way, guarded by `require_employee_login()`.
      **Accept:** `GET /employee` as staff returns the shell; guest→login; owner/customer→their portal.
- [x] 4.3 Add `website_route_rules` in `hooks.py` for `/owner/<path:app_path>`→`owner` and
      `/employee/<path:app_path>`→`employee`.
      **Accept:** `GET /owner/approvals` and `/employee/dispatch` resolve to the guarded host (deep links work);
      unauthenticated deep links redirect to login and back.

### 5. Shared UI kit scaffold (design §D.1) — spec: owner-portal & employee-portal *Mobile-Responsive/First*
- [x] 5.1 Create `frontend/portal-kit/` with `src/tokens.css`, `tailwind-preset.js`, `src/api/client.ts`
      (CSRF + credentials + safe error mapping), `src/api/session.ts` (reads bootstrap JSON).
      **Accept:** a throwaway consumer can import the preset + `call()`/`resource()` and render a token-styled
      element; an API error surfaces as friendly text (no stack trace).
- [x] 5.2 Add base components: `AppShell`, `DataTable` (sort/filter/saved-views/bulk), `StatCard`, `EmptyState`,
      `CommandPalette`, `Toast`, `FormField`, `Money`, `Skeleton`.
      **Accept:** each component renders in isolation; `Money` renders the currency-safe string from props and
      never formats money itself.

---

## Stage 2 — Employee Portal (design §D.3, §E.2) — spec: employee-portal

### 6. Employee SPA + My Day
- [x] 6.1 Scaffold `frontend/employee-portal/` by copying `frontend/dispatch-portal` config; set Vite `base`
      `/assets/entertainment_express/employee/` and `build.outDir` to `app/public/employee` with `manifest:true`;
      add React Router with the routes in design §D.3; consume `portal-kit`.
      **Accept:** `npm run build` outputs hashed assets into `app/public/employee`; the host page serves the app
      and the router renders `/employee`.
- [x] 6.2 Implement `app/api/portal_employee.py`: `get_my_day()` (role-adaptive) and `search(query)`
      (permission-filtered). Guard: caller must hold an `EMPLOYEE_ROLES` role.
      **Accept:** an `EE Sales` and an `EE Crew` get different `get_my_day` payloads; a non-staff caller → 403;
      `search` never returns records the caller can't read (test with two users).
- [x] 6.3 Build the **My Day** home: task-first cards (Today / Urgent / Waiting), assignments, schedule, with
      empty states; mount the global `CommandPalette`.
      **Accept:** My Day shows only the signed-in user's permitted items; empty tenant shows guided empty states;
      the palette opens and navigates.

### 7. Highest-value workspace (pick Dispatch or Field first; do the other next)
- [x] 7.1 **Dispatch workspace** at `/employee/dispatch` reusing `frontend/dispatch-portal` board/map components
      and the existing dispatch API; visible only to `EE Dispatcher`.
      **Accept:** a dispatcher can view the board and assign crew/asset; the write goes through the existing
      dispatch backend and notifies affected crew; a non-dispatcher does not see the route.
- [x] 7.2 **Field workspace** at `/employee/field` consuming `app/api/mobile_api_v2.py`; visible to `EE Crew`/
      `EE Entertainer`; mobile-first; check-in/out queues under poor connectivity.
      **Accept:** a crew member sees today's assigned events + run sheet and can check in/out via `mobile_api_v2`;
      the check-in appears to dispatch; actions taken offline complete when back online.
- [x] 7.3 Sales workspace (`/employee/sales`) and Accounting workspace (`/employee/accounting`) over existing
      CRM/quote/booking and billing APIs, each gated to its role.
      **Accept:** Sales can advance a lead/create a quote; Accounting can view/record a payment; each write uses
      the standard backend documents; cross-role access is denied server-side.

---

## Stage 3 — Owner Portal (design §D.2, §E.1) — spec: owner-portal

### 8. Owner SPA + cockpit + approvals + team + settings
- [x] 8.1 Scaffold `frontend/owner-portal/` (copy `customer-portal` config); Vite `base`
      `/assets/entertainment_express/owner/`, `outDir` `app/public/owner`, `manifest:true`; routes per design §D.2;
      consume `portal-kit`.
      **Accept:** `npm run build` outputs to `app/public/owner`; the guarded host serves it; `/owner` renders.
- [x] 8.2 Implement `app/api/portal_owner.py`: `get_owner_dashboard(from_date,to_date)`,
      `get_financial_overview()`, `get_approvals()`, `act_on_approval(...)`, `list_staff()`, `invite_staff(...)`,
      `set_staff_roles(...)`, `deactivate_staff(...)`. Guard: caller must hold `EE Tenant Admin`. Money via `flt`.
      **Accept:** wrong-role caller → 403; dashboard/financial amounts match backend docs to full precision;
      `act_on_approval` is idempotent and writes an audit entry; `set_staff_roles`/`invite_staff` **reject**
      `System Manager`/`SaaS Operator` and audit every change.
- [x] 8.3 Build **Cockpit** (StatCards + date-range), **Approvals queue** (approve/reject), **Team & access**
      (invite/assign/deactivate), **Financial overview** (read-only), **Catalog** (reuse `api/catalog.py`),
      **Settings** (branding + `portal_mode`), each with empty states and mobile layouts.
      **Accept:** each view works on desktop + phone; approvals write back through standard docs; team changes
      show in the audit log; editing branding restyles the portals; owner can set `portal_mode`.

---

## Stage 4 — Modernization & `/client` alignment (design §D.4) — spec: customer-portal

### 9. Consistency, polish, and shared design system
- [x] 9.1 Adopt `portal-kit` tokens/preset in `frontend/customer-portal` (no ownership change to `/client`),
      aligning its shell, tables, and empty states to the shared system.
      **Accept:** `/client` uses the shared tokens/components; no regression in existing customer flows
      (dashboard, sign, pay) — spec scenarios in customer-portal still pass.
- [x] 9.2 Apply the §D.4 modernization checklist across all portals: task-first homes, saved views + bulk
      actions in `DataTable`, guided empty states, plain-language errors, mobile-first, command palette.
      **Accept:** each portal meets the checklist; an automated a11y check reports no critical violations; the
      §J performance budget is met on first load + primary interaction.

---

## Stage 5 — Harden & enforce (design §J, §K) — spec: identity-access *Role-Based Authorization*, *Audit*

### 10. Tests, parity, and flip to `enforce`
- [x] 10.1 Add `app/tests/` boundary tests: routing per tier; wrong-role portal host → redirect not served;
      mode-matrix (`off`/`warn`/`enforce`).
      **Accept:** all boundary tests pass for every tier and every mode.
- [x] 10.2 Add API permission + isolation + audit + money tests (design §J): wrong-role→403; owner can't grant
      operator roles; `search`/`get_my_day`/dashboards never leak other users' or other tenants' records; role
      change is audited; amounts match to full precision.
      **Accept:** all pass, including a two-site isolation test with no cross-leak.
- [x] 10.3 Complete the **per-role parity checklist** (design §J): confirm each role can do in its portal
      everything it previously did in `/app`, or the gap is intentionally deferred and documented.
      Parity checklist sign-off:
      Owner (`EE Tenant Admin`): `/owner` cockpit, approvals, finances, team, catalog, settings available.
      Employee roles: `/employee` home + role-gated dispatch/field/sales/accounting workspaces available.
      Customer (`EE Customer`): `/client` retained and aligned to shared shell/table/empty-state patterns.
      Operator (`System Manager`/`SaaS Operator`): `/app` remains the privileged Desk surface.
      **Accept:** the checklist is complete and signed off for every role tier.
- [x] 10.4 Flip `EE Portal Settings.portal_mode` to `enforce`; verify owners/employees can no longer reach
      `/app` (they are bounced to their portal) while `System Manager`/`SaaS Operator` retain the Desk.
      **Accept:** end-to-end, owner→`/owner`, employee→`/employee`, customer→`/client`, operator→`/app`; flipping
      back to `warn` instantly restores Desk access (reversible).

---

## Traceability
- **owner-portal**: *Owner Access Boundary* (3.1, 3.3, 4.1), *Business Cockpit Dashboard* (8.2, 8.3),
  *Approvals & Exceptions Queue* (8.2, 8.3), *Financial Overview* (8.2, 8.3), *Team & Access Management*
  (8.2, 8.3), *Catalog, Pricing & Portal Settings* (1.1, 8.3), *Mobile-Responsive Cockpit* (8.3, 9.2).
- **employee-portal**: *Employee Access Boundary* (3.1, 3.3, 4.2), *Role-Adaptive Home* (6.2, 6.3),
  *Sales Workspace* (7.3), *Dispatch Workspace* (7.1), *Field & Crew Workspace* (7.2), *Accounting Workspace*
  (7.3), *Global Search & Quick Actions* (6.2, 6.3), *Mobile-First Field Use* (7.2, 9.2).
- **identity-access**: *Role-Based Authorization* (2.x, 3.x, 4.x, 6.2, 8.2, 10.x), *Audit of Access &
  Permission Changes* (8.2, 10.2).
- **customer-portal**: alignment only, no ownership change (9.1).
