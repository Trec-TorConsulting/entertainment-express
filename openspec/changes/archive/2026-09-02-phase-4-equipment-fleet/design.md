# Design: Phase 4 — Equipment, Inventory & Fleet (portals)

## Context

DocTypes and `fleet_ops.py` already exist. `/owner/gear` is CRUD on Service Asset only. `/employee` pull sheet lists lines but cannot pack, scan, or report damage. `packing_status` / `mark_packed` sometimes treat the job name as the Packing List name.

## Decisions

1. **Reuse APIs.** `portal_fleet.py` wraps `fleet_ops` with role splits: owner/dispatcher for vehicles, stock, sub-rental, maintenance; crew+dispatcher+owner for pack/scan/damage.
2. **Packing list key is the job.** Resolve `Packing List` by `booking`, then by name.
3. **UI.** Owner Gear keeps the unit list and adds vehicles, stock move, sub-rental. Gear editor shows utilization %. Employee pull sheet: packed toggle, scan field, check out/in, damage note.
4. **Guests 403.** No cross-site connect. Copy: gear, truck, pull sheet — not DocType names.
5. **Image** `0.0.76-ee` → `0.0.77-ee`.

## Risks

- [No barcode yet] → `checkout` / pack-by-code asks to print/save a code; `_ensure_barcode` on generate.
- [Crew on stock transfer] → 403 from portal_fleet even if fleet_ops allowed crew.
