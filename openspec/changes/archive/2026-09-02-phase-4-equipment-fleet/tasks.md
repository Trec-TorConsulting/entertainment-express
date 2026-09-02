# Tasks: Phase 4 — Equipment, Inventory & Fleet

> Backend DocTypes already exist. This pass is portals, packing lookup, and isolation tests.

## 1. Packing lookup + portal API
- [x] 1.1 Resolve Packing List by booking (then name) in `packing_status` / `mark_packed`.
- [x] 1.2 `api/portal_fleet.py`: vehicles, stock transfer, sub-rental, utilization, wrap scan/pack/damage. Guests 403. Crew cannot transfer or sub-rent.

## 2. UI
- [x] 2.1 `/owner/gear` vehicles, stock move, sub-rental; unit utilization on the gear page.
- [x] 2.2 `/employee` pull sheet: packed, scan, check out/in, damage. Rebuild both public SPAs.

## 3. Tests + ship
- [x] 3.1 `tests/test_phase4_surfaces.py`; skip live `test_phase4_equipment.py` without migrate.
- [x] 3.2 Patch `phase4_equipment_fleet`; image `0.0.76-ee` → `0.0.77-ee`; ROADMAP folder linked.

## Definition of Done
Owner parks a truck and moves stock without Desk. Crew packs a pull sheet, scans gear out/in, and reports damage. Overlapping truck assign still blocked. Guests 403.
