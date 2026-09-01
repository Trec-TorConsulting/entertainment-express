# Tasks: Phase 18 — Data Migration & Onboarding

> CSV move-in on `/owner`. Dry-run first. Dedupe by natural key. No competitor OAuth. No GL import.

## 1. Schema

- [x] 1.1 DocTypes `EE Import Job` + child `EE Import Error`, `EE Export Job`.
      **Accept:** migrate on a tenant site.

## 2. Import / export API

- [x] 2.1 `api/migration.py` parse CSV, presets, dry-run, enqueue commit for the eight targets.
      **Accept:** dry-run inserts 0; guest 403; no `tenant`/`site` args.
- [x] 2.2 Re-run skips existing natural keys; per-row errors stored on the job.
      **Accept:** second commit of the same emails does not duplicate Customers.
- [x] 2.3 Export CSV for the same targets, this site only.
      **Accept:** pytest.

## 3. Portal

- [x] 3.1 `/owner/move` upload, map, dry-run, commit, download export.
      **Accept:** not EmptyState; no `/app`; no DocType names in copy.
- [x] 3.2 Onboarding checklist on Today (brand, catalog, payments, import, first job).
      **Accept:** missing package shows that step.

## 4. Ship

- [x] 4.1 `tests/test_phase18_migration.py`: isolation, guest 403, dry-run, dedupe.
      **Accept:** pytest on tenant site.
- [x] 4.2 Rebuild `public/owner/`; bump bench image `0.0.62-ee` → `0.0.63-ee`; migrate tenant sites.
      **Accept:** `/owner/move` loads for the owner.
