## Context
Phase-18 built import framework; this stocks presets competitors' CSVs actually use.

## Goals / Non-Goals
**Goals:** Preset JSON maps; dry-run; docs in onboarding checklist.
**Non-Goals:** Scraping competitor UIs; password sharing.

## Decisions
### D1 — Preset pack files
`entertainment_express/data_migration/presets/{io,ers,bcn,goodshuffle,djep,dji}.json`

### D2 — Dry-run
Same idempotent job with `dry_run=1` producing row error report.

### D3 — Files
Extend `api/migration.py`, tests `test_phase36_presets.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
