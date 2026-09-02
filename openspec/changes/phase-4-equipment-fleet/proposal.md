## Why

Gear is in Desk DocTypes and a thin `/owner/gear` list. Crew cannot scan check-out/in, mark a pull sheet packed, or record damage without Desk. Owners cannot park a truck, move stock, or sub-rent a shortage from `/owner`. Dispatch still guesses what is on the truck.

## What Changes

- Keep existing Equipment Fleet DocTypes and `api/fleet_ops.py`. Add `api/portal_fleet.py` for `/owner` and `/employee` (person/job language, never DocType names).
- `/owner/gear`: units plus vehicles, stock moves, sub-rentals, utilization on a unit. Out-of-service / maintenance stay unbookable.
- `/employee` Pull sheet: generate, check off / scan packed, scan gear out and back, report damage. Missing items flagged before departure.
- Crew cannot transfer stock or create sub-rentals. Guests 403. No `frappe.connect` / `frappe.init`.
- Fix packing list lookup by job (booking field), not assumed document name.

## Impact

- Frontends: owner + employee SPAs; rebuild `public/{owner,employee}/`.
- Tests: `tests/test_phase4_surfaces.py`; live `test_phase4_equipment.py` skips without migrate.
- Image `0.0.76-ee` → `0.0.77-ee`. Patch `v0_0_3.phase4_equipment_fleet`.
- Depends on: phase-1 Service Asset, phase-2 dispatch, phase-26 warehouse-only lines.

## Non-Goals

- Phase-17 vendor CRM. Sub-rental is supplier name + cost.
- Hardware barcode printers. Codes are on the asset/vehicle and typed/scanned.
- Desk fleet workspace work.

## Requirements delivered

- `equipment-inventory-fleet`: Asset Registry & Condition, Consumable Inventory, Fleet / Vehicle Management, Maintenance Scheduling (due list + block), Check-out / Check-in & Damage, Barcode / QR, Packing Lists / Pull Sheets, Multi-Location Stock, Sub-Rentals.
- `owner-portal`: Gear fleet without Desk.
- `employee-portal`: Pull sheet pack/scan/damage without Desk.
