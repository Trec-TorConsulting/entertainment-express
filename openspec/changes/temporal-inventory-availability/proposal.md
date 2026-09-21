## Why

Generic ERP systems and basic event CRMs treat inventory as a static count of stock on hand, creating a fatal blind spot for mobile entertainment and party rental operators (DJs, inflatables, photo booths, AV gear, staging). Availability is not a stock quantity problem; it is a **date and time reservation problem** combined with prep, load-out, travel, teardown, sanitization, and maintenance turnaround buffers. When items return damaged or uncleaned, manual spreadsheets fail to quarantine them, leading to double-bookings, chaotic warehouse mornings, and compromised client trust.

## What Changes

- Introduce a high-performance **Temporal Reservation Matrix** in Frappe that calculates equipment availability across any requested datetime range, accounting for buffer windows (prep, transit, teardown, turnaround/cleaning).
- Introduce automated **Turnaround & Sanitization Buffers** configured per equipment category or serial item (e.g. bounce houses require 12 hours sanitization/drying; high-end cameras require 4 hours battery charging & sensor inspection).
- Introduce **Automated Maintenance Quarantine Locks** that trigger when field crews flag an item as damaged, dirty, or needing inspection during post-event teardown, immediately removing that item from future availability pools until cleared.
- Add an interactive **Timeline Availability Grid** in the Owner Portal (`/owner/inventory/availability`) with visual conflict detection, date-range scrubbers, and shortage alert badging.
- Provide an automated **Sub-Rental Shortage Alert & Procurement Hook** that flags when high-demand dates exceed owned capacity and generates draft sub-rental RFQs to trusted vendor partners.

## Capabilities

### New Capabilities
- `temporal-inventory-availability`: Real-time calendar-based equipment reservation engine with automated turnaround/sanitization buffers, maintenance quarantine locks, and sub-rental shortage detection.

### Modified Capabilities
- `equipment-inventory-fleet`: Augmented with temporal reservation child tables and quarantine status state machines.
- `booking-availability`: Booking validation hooks now enforce temporal equipment availability gates before confirming quotes or bookings.

## Impact

- **DocTypes**:
  - `EE Equipment Reservation`: Child table or standalone ledger linking `booking`, `asset`, `item_code`, `qty`, `start_window`, `end_window`, `status`.
  - `EE Equipment Category Buffer`: Configurable buffer profile (prep minutes, teardown minutes, sanitization minutes) linked to Equipment Category.
  - `EE Maintenance Quarantine Log`: Audit log tracking quarantine reason, flagged by crew, inspect date, released by owner.
- **Server APIs**:
  - `entertainment_express.equipment_fleet.api.check_temporal_availability(item_codes, start_datetime, end_datetime, site_location)`
  - `entertainment_express.equipment_fleet.api.quarantine_equipment(asset_id, reason, notes)`
  - `entertainment_express.equipment_fleet.api.release_quarantine(asset_id, notes)`
- **Portal UI**:
  - New Route: `/owner/inventory/availability` displaying an interactive resource timeline grid (similar to Rentman/Goodshuffle).
- **Multi-Tenant Isolation**:
  - All queries strictly enforce `frappe.db.get_list` and SQL filters scoped to the active tenant site DB.
