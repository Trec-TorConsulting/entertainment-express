## Context

Live entertainment logistics operate under intense time constraints. Gear moves between a company's main storage depot and multiple mobile vans, trucks, and venue trailers. Without strict multi-warehouse custody tracking, assets are misplaced, cables are lost, and gear is cannibalized between trucks. When cross-renting gear to service large events, operators lack formal purchase orders, resulting in disputed vendor charges and missed return deadlines.

ERPNext has an established manufacturing Bill of Materials (BOM) engine, a multi-warehouse tree, and a complete procurement cycle (`Purchase Order`, `Purchase Receipt`, `Purchase Invoice`). This design harnesses ERPNext's inventory and procurement primitives to create a seamless event production supply chain.

## Goals / Non-Goals

**Goals:**
- Implement hierarchical Production BOMs for complex service packages.
- Model all fleet vehicles as ERPNext child `Warehouse` entities under the tenant's primary company.
- Support fast camera/barcode scanning to transfer assets between central warehouses and vehicles during load-out and unload.
- Detect missing equipment immediately upon post-event vehicle check-in.
- Provide automated Sub-Rental `Purchase Order` generation with delivery and return tracking.

**Non-Goals:**
- Physical GPS RFID gate reader automation; scanning uses standard 1D/2D barcodes (Code 128 / QR) via mobile camera or handheld Bluetooth wedge.
- Heavy manufacturing assembly runs; production BOMs are used for kitting and staging, not factory assembly lines.

## Decisions

### 1. Van-as-a-Warehouse Model
- **Choice**: Automatically create an ERPNext `Warehouse` whenever a `Fleet Vehicle` is registered in Entertainment Express (`{company} - Vehicles - {vehicle.name}`).
- **Rationale**: Reuses ERPNext's standard `Stock Entry` (Material Transfer) and serialized inventory ledger (`Stock Ledger Entry`) without introducing custom stock tables.

### 2. Barcode Scanning Staging Session
- **Choice**: Introduce `Vehicle Loadout Session` DocType to track in-flight scans during load-out and check-in before committing the batched ERPNext `Stock Entry`.
- **Rationale**: Avoids hammering MariaDB with a separate `Stock Entry` on every single cable scan. The crew scans 30 items rapidly into local state, reviews the manifest, and submits one atomic `Stock Entry`.

### 3. Missing Item Reconciliation
- **Choice**: On check-in, compare the initial vehicle load-out items against scanned return items. Unmatched serialized assets are moved to a virtual `Lost & Missing` warehouse and trigger an alert with the driver and event details.
- **Rationale**: Immediate accountability prevents items from disappearing for weeks.

### 4. Sub-Rental Purchase Orders
- **Choice**: Link ERPNext `Purchase Order` directly to the `Event Booking` with custom fields `is_sub_rental`, `venue_delivery_date`, `vendor_return_deadline`.
- **Rationale**: Keeps vendor liabilities within standard ERPNext Accounts Payable while surfacing fulfillment deadlines in the operator dispatch schedule.

## Technical Architecture & File Map

1. **DocTypes**:
   - `entertainment_express/doctype/production_bom/production_bom.json`
   - `entertainment_express/doctype/vehicle_loadout_session/vehicle_loadout_session.json`
   - `entertainment_express/doctype/sub_rental_order/sub_rental_order.json`
   - Custom fields on `Fleet Vehicle`: `linked_warehouse`, `current_load_weight`, `max_payload_weight`.
2. **Backend Services & API**:
   - `entertainment_express/logistics/bom_expander.py`: Generates hierarchical pull-sheets from booked packages.
   - `entertainment_express/logistics/van_transfer.py`: Commits `Stock Entry` transfers for vehicle load-out and return.
   - `entertainment_express/logistics/sub_rentals.py`: Creates and reconciles vendor `Purchase Order` documents.
   - `entertainment_express/api/logistics.py`: Endpoints:
     - `get_loadout_checklist(booking_id, vehicle_id)`
     - `commit_loadout(session_id)`
     - `commit_return_checkin(session_id)`
     - `list_sub_rental_deadlines()`
3. **Frontend Surfaces**:
   - `frontend/crew-app/src/features/loadout/ScanToTruckScreen.tsx`
   - `frontend/crew-app/src/features/loadout/CheckinReturnScreen.tsx`
   - `frontend/owner-portal/src/app/routes/fleet/VanManifestPage.tsx`
   - `frontend/owner-portal/src/app/routes/pipeline/components/SubRentalTracker.tsx`

## Risks / Trade-offs

- **[Risk] Slow scanning in dark warehouses**:
  - *Mitigation*: Supports high-contrast audio-visual feedback (beep on scan, green flash) and rapid manual fallback search by asset name or serial number.
- **[Risk] Sub-rental return date falls on a weekend when vendor is closed**:
  - *Mitigation*: System checks vendor operating hours/calendar and sets return deadlines to the next open business day.
