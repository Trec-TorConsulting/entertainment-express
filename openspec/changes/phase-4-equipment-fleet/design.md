# Design: Phase 4 — Equipment, Inventory & Fleet

## A. Service Asset extensions
`condition` (excellent/good/fair/poor/damaged), `current_location` (Link EE Location), `barcode` (unique Data),
status adds `out_of_service`. Availability already blocks non-`available`; also block overlapping Maintenance
and open check-out logs.

## B. New DocTypes (module Equipment Fleet)

| DocType | Key fields |
|---|---|
| EE Location | location_name, location_type (warehouse/venue/vehicle/other), address |
| Vehicle | vehicle_name, plate, vin, vehicle_type, capacity, status, assigned_crew, odometer, fuel_level, registration_expiry, insurance_expiry, home_location, barcode |
| Vehicle Assignment | vehicle, booking, status |
| Maintenance Record | resource_type (asset/vehicle), asset, vehicle, mtype, due_on, performed_on, cost, vendor, status, next_due, blocks_booking |
| Damage Report | resource_type, asset, vehicle, booking, description, photos, severity, cost, status |
| Asset Check Log | resource_type, asset, vehicle, booking, direction (out/in), at, condition_before, condition_after, scanned_code, crew |
| Packing List | booking (unique), status, items (child: kind asset/consumable/subrental, asset, item, qty, packed, scanned) |
| Stock Balance | location, item_code, qty, reorder_level (unique location+item) |
| Stock Transfer | from_location, to_location, item_code, qty, status |
| Sub Rental | booking, item_name, qty, supplier, cost, status |

## C. APIs (`api/fleet_ops.py`)
`utilization`, `scan_code`, `checkout`, `checkin`, `report_damage`, `generate_packing_list`, `mark_packed`,
`assign_vehicle`, `transfer_stock`, `consume_for_booking`, `create_sub_rental`.

QR payload = `{barcode}` printed on `/api/method/...` labels; scan accepts barcode string.

## D. Scheduler
Daily: registration/insurance expiry (30d), maintenance due, stock below reorder → Notification Template
`fleet_alert` to EE Tenant Admin / dispatcher.
