## Context

There is no Import Job. Owners type records in portals. Isolation is site-per-tenant. Money on packages/bookings must use `flt`. Guests never import. Frappe File attach holds the CSV.

Stakeholders: `EE Tenant Admin`. Not guests, not other tenants.

## Goals / Non-Goals

**Goals:**
- Owner uploads a CSV, maps columns (or picks a preset), dry-runs, then commits.
- Re-run skips already-imported natural keys.
- Export downloads this tenant’s rows only.
- Today/setup shows a checklist until brand, a package, payments, import-or-skip, and a first job exist.

**Non-Goals:**
- Competitor OAuth / live API sync.
- Excel formulas, Google Sheets live link.
- Importing payment history or GL.
- Control-plane importing into many tenants at once.

## Decisions

### D1 — New DocTypes
**EE Import Job**: `source_type` (`csv|excel`), `target`, `mapping` (JSON), `status` (`pending|validating|running|completed|failed`), `rows_total`, `rows_ok`, `rows_failed`, `dry_run`, `file` (Attach), `error_report` (Attach).
**EE Import Error** (child): `row_number`, `message`.
**EE Export Job**: `target`, `status`, `file`.

**Alt:** write rows inline with no job. **Rejected** — not resumable, no audit.

### D2 — Natural keys
| Target | Dedupe |
|---|---|
| customers | email |
| leads | email |
| bookings | customer email + event_date + event_name |
| packages | item_name |
| gear | asset_name |
| venues | venue_name |
| vendors | vendor_name |
| songs | title + artist |

### D3 — Run in a worker
`start_import` validates mapping, sets pending, `frappe.enqueue` `run_import`. HTTP returns the job id. Dry-run sets status completed with counts and errors, **zero inserts**.

### D4 — Presets are starter maps
JSON in `api/migration_presets.py`. Owner can edit before run. Unknown columns stay unmapped.

### D5 — Files
| Area | Path |
|---|---|
| API | `api/migration.py` |
| DocTypes | `entertainment_express_core/doctype/ee_import_job`, `ee_import_error`, `ee_export_job` |
| Portal | owner `App.tsx` `/owner/move` |
| Tests | `tests/test_phase18_migration.py` |

### D6 — Money
Imported rates/amounts go through `flt`. Portal shows `fmt_money` strings only.

## Risks / Trade-offs

- [Bad CSV blows up] → dry-run first; per-row catch; never abort the whole site.
- [Excel without extra deps] → prefer CSV; if `openpyxl` missing, throw a clear “save as CSV”.
- [Huge files] → cap 5,000 rows per job.

## Migration Plan

1. DocTypes + patch; migrate.
2. API + owner SPA; bump `0.0.62-ee` → `0.0.63-ee`.
3. Rollback: hide `/owner/move`; jobs remain.

## Open Questions

- None blocking. Presets can grow without schema changes.
