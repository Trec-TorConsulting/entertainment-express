## Why

New tenants still re-type customers, jobs, and catalog by hand. HoneyBook / DJ Event Planner / Check Cherry / Booqable all advertise CSV move-in. Without a guided, site-scoped import, switching cost stays high. Phase 17 added venues and vendors; those are now importable too.

## What Changes

- Add **Import Job** (CSV/Excel, column map, dry-run, background run, error report) for customers, leads, bookings, packages, gear, venues, vendors, songs — current tenant only.
- Add **competitor mapping presets** (HoneyBook, DJ Event Planner, Check Cherry, Booqable) as starting maps, editable before run.
- Imports are **idempotent** (dedupe by natural key) and **resumable**.
- Add **Export Job** for the same entities to CSV, permission-scoped.
- Add an **onboarding checklist** on `/owner` (brand, catalog, payments, import, first job).
- **Explicit non-goals:** live API pull from competitor OAuth, GL history import, multi-tenant bulk load from the control plane, Desk-only import.

## Capabilities

### New Capabilities

- (none) — `data-migration` already exists in baseline specs.

### Modified Capabilities

- `data-migration`: Portal-driven import/export and onboarding checklist without Desk.
- `owner-portal`: `/owner/move` (import/export) and setup checklist; no `/app`.
- `identity-access`: Owner-only; guests 403; never writes other sites.
- `crm`: Customer/Lead import uses existing DocTypes; email match does not grant roles.
- `service-catalog` / `equipment-inventory-fleet` / `venue-management` / `vendor-network` / `music-planning`: import targets only, no new public surfaces.

## Impact

- Backend: `api/migration.py`; DocTypes `EE Import Job`, child `EE Import Error`, `EE Export Job`; enqueue via `frappe.enqueue`.
- Frontend: `frontend/owner-portal`; rebuild `public/owner/`.
- Tests: `tests/test_phase18_migration.py` — isolation, guest 403, dry-run writes nothing, re-run dedupes.
- Cluster: bump bench image; migrate tenant sites.
- Depends on: phase-1 core entities, phase-17 venues/vendors.
