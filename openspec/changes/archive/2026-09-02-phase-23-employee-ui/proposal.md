## Why

`/employee` is the daily home for sales, dispatch, office, and field staff. Phase 20 shipped a
role-adaptive shell; it is not yet a designed operations product. Staff will keep using Desk unless
My Day, queues, and field flows feel faster than `/app`.

## What Changes

- Redesign `/employee` to the phase-21 visual system: dense-but-scannable ops UI (not a marketing page).
- Role-adaptive **My Day** with a visible next action, not a generic dashboard.
- Workspaces (Sales, Dispatch, Field, Accounting) get consistent list/detail/filter chrome from
  portal-kit (DataTable, CommandPalette, EmptyState).
- Mobile-first for `EE Crew` / `EE Entertainer` (thumb targets, offline-tolerant empty states).
- Reuse dispatch portal patterns where they already exist; do not duplicate a second dispatch board.
- No new backend. Server-side role checks stay as in phase-20.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `employee-portal`: add UX requirements for My Day density, workspace chrome, field mobile, a11y.
- `ui-design-system`: consume ops-density variants (compact tables, status chips) defined in phase-21.

## Impact

- `frontend/employee-portal/src/**`, `app/www/employee/index.html`.
- Optional visual alignment of `frontend/dispatch-portal` so dispatch opened from `/employee` does not
  look like a different product.
- Rebuild `public/employee/` and roll the bench image.
- **Depends on:** phase-21, phase-20, phase-2 dispatch APIs.
