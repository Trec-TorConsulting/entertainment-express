## 1. DocType Schemas & Database Layer

- [x] 1.1 Create `EE Equipment Reservation` DocType with fields for `booking`, `asset`, `item_code`, `reserved_qty`, `event_start`, `event_end`, `buffer_start`, `buffer_end`, and `status`.
- [x] 1.2 Create `EE Category Buffer Rule` DocType to configure category prep, teardown, and sanitization minutes.
- [x] 1.3 Create `EE Equipment Quarantine` DocType to track damaged, dirty, or missing equipment locks.
- [x] 1.4 Add composite database index on `tabEE Equipment Reservation` for `(item_code, buffer_start, buffer_end, status)`.

## 2. Server-Side APIs & Temporal Logic

- [x] 2.1 Implement `entertainment_express.equipment_fleet.api.check_temporal_availability` with buffer window expansion.
- [x] 2.2 Implement `entertainment_express.equipment_fleet.api.quarantine_asset` and `release_asset_quarantine` hooks.
- [x] 2.3 Integrate reservation booking hook: automatically create `EE Equipment Reservation` rows on Booking submission and release on cancellation.
- [x] 2.4 Add multi-tenant unit tests verifying zero cross-site reservation leakage.

## 3. Frontend Timeline & Quarantine Management

- [x] 3.1 Implement `AvailabilityTimeline.tsx` in `/owner/inventory/availability` with interactive Gantt-style resource view.
- [x] 3.2 Add `QuarantineDrawer.tsx` allowing owners to view quarantined gear and clear locks.
- [x] 3.3 Add field crew teardown quarantine button to the mobile field app.

## 4. Verification & Smoke Testing

- [x] 4.1 Write automated Python test suite `test_temporal_availability.py` testing double-booking prevention, buffer clashes, and quarantine blocks.
- [x] 4.2 Verify E2E smoke flow on local test bench site.
