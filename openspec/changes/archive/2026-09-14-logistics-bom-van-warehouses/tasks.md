## 1. Data Model & Warehouse Setup

- [x] 1.1 Create `Production BOM` DocType (`entertainment_express/doctype/production_bom/`) with parent package reference and child table `Production BOM Item` (`item_code`, `qty`, `is_sub_assembly`, `is_consumable`).
- [x] 1.2 Create `Vehicle Loadout Session` DocType tracking `session_type` (`loadout`, `return_checkin`), `vehicle`, `booking`, `scanned_items` (child table), `status`.
- [x] 1.3 Create `Sub Rental Order` DocType linking `Event Booking`, `vendor`, `purchase_order_ref`, `delivery_date`, `return_deadline`, `markup_rate`.
- [x] 1.4 Hook `Fleet Vehicle` lifecycle to auto-provision an ERPNext child `Warehouse` under `Vehicles` group.

## 2. BOM Expansion & Pull-Sheet Generation

- [x] 2.1 Implement `expand_booking_bom(booking_name)` in `entertainment_express/logistics/bom_expander.py` resolving nested kits into flat pull-sheets.
- [x] 2.2 Wire booking dispatch checklist to display required sub-assemblies and individual serialized asset slots.

## 3. Scan-to-Truck & Return Reconciliation

- [x] 3.1 Implement barcode scanning validation API checking that scanned asset serial numbers match assigned booking requirements.
- [x] 3.2 Implement `commit_loadout_transfer(session_id)` generating an atomic ERPNext `Stock Entry (Material Transfer)` from `Main Warehouse` to `Van Warehouse`.
- [x] 3.3 Implement `commit_return_checkin(session_id)` transferring scanned items back to `Main Warehouse` and flagging missing items with `Missing in Transit` status.

## 4. Sub-Rental Procurement Flow

- [x] 4.1 Implement `create_sub_rental_po(booking_id, vendor_id, items, delivery_date, return_date)` drafting an ERPNext `Purchase Order` tagged to the event project.
- [x] 4.2 Implement scheduled check alerting dispatchers 24 hours prior to vendor return deadlines.

## 5. UI Surfaces

- [x] 5.1 Build `ScanToTruckScreen` in `frontend/crew-app/` with camera barcode scanner and real-time checklist feedback.
- [x] 5.2 Build `CheckinReturnScreen` in `frontend/crew-app/` highlighting missing unreturned items.
- [x] 5.3 Build `VanManifestPage` in `frontend/owner-portal/` displaying real-time contents of every fleet truck.
- [x] 5.4 Build `SubRentalTracker` widget in `/owner/pipeline` showing vendor arrival and return countdowns.

## 6. Verification & Tests

- [x] 6.1 Add unit tests in `entertainment_express/tests/test_van_logistics.py` verifying BOM expansion and stock transfer entries.
- [x] 6.2 Add test verifying missing item reconciliation and alert creation.
- [x] 6.3 Run `python3 smoke_test.py` to confirm all syntax, DocTypes, and OpenSpec checks pass.
