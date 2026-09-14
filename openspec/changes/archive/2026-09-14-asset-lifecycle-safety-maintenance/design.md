## Context

Mobile entertainment equipment operates in rigorous, high-wear environments (outdoor weather, heavy patron usage, continuous transit, repeated packing/unpacking). Operators are legally obligated to maintain safety standards: state inspectors demand annual inflatable operation permits, venues require electrical safety certifications, and commercial vehicle enforcement audits truck logs. When an item breaks on-site, crew currently rely on verbal handoffs or group chat messages, causing broken gear to be loaded into the next truck without inspection.

ERPNext contains a robust `Asset` and `Asset Maintenance` framework. This design extends ERPNext's asset maintenance system into a real-time event operations safety net: tracking live usage meters, automating scheduled service work orders, enforcing hard dispatch blocks, and providing an on-site field quarantine workflow.

## Goals / Non-Goals

**Goals:**
- Provide serialized usage tracking (operating hours, event rental count, vehicle odometer miles).
- Automate preventative maintenance work orders triggered by usage meters or calendar schedules.
- Maintain a safety certificate compliance registry with hard dispatch locks for expired credentials.
- Enable field crew to flag damaged equipment during teardown in the PWA, automatically quarantining the unit and creating an ERPNext maintenance task.
- Build an Equipment Health & Quarantine Cockpit for `/owner`.

**Non-Goals:**
- Replacing physical inspection checklists or IoT telemetry hardware (e.g. OBD-II CAN bus streaming). Field crew and dispatchers enter odometer readings and inspection data directly via web/PWA.
- Manufacturing custom replacement parts; focus is on maintenance tracking, repair logging, and parts inventory consumption.

## Decisions

### 1. Linking Service Asset directly to ERPNext Asset
- **Choice**: Map each serialized `Service Asset` to an underlying ERPNext `Asset` record.
- **Rationale**: Reuses ERPNext's native depreciation schedule, maintenance team assignments, and asset value adjustment ledgers while keeping EE's fast booking availability engine decoupled and performant.

### 2. Condition State Machine
- **Choice**: Implement an explicit asset condition lifecycle:
  `Available` ➔ `Dispatched` ➔ `In Use` ➔ `Quarantined` (if damaged) ➔ `In Repair` ➔ `Pending Inspection` ➔ `Available`.
- **Rationale**: Guarantees that any unit requiring maintenance cannot be accidentally selected during automated dispatch suggest or manual booking assignment.

### 3. Safety Certificate Enforcement Engine
- **Choice**: Introduce `Safety Certificate` DocType with child table mapping to governed assets.
- **Rationale**: A single certificate (e.g. Master Liability Policy or State Annual Carnival Ride Permit) may cover multiple individual units, or an asset may require multiple individual certificates (ASTM inspection + Blower electrical test).

### 4. Offline Teardown Damage Queue
- **Choice**: Capture defect reports into IndexedDB in the field PWA before uploading photos and synchronizing state with the server.
- **Rationale**: Teardown often occurs late at night at outdoor venues with poor cellular reception. An offline queue ensures damage is never forgotten.

## Technical Architecture & File Map

1. **DocTypes**:
   - `entertainment_express/doctype/safety_certificate/safety_certificate.json`
   - `entertainment_express/doctype/equipment_maintenance_schedule/equipment_maintenance_schedule.json`
   - `entertainment_express/doctype/equipment_defect_report/equipment_defect_report.json`
   - Custom fields on `Service Asset`: `operating_hours`, `event_count`, `current_mileage`, `condition_status`, `quarantine_reason`, `last_inspection_date`, `next_service_due`.
2. **Backend Services & API**:
   - `entertainment_express/fleet_maintenance/telemetry.py`: Increments asset usage on event checkout/completion.
   - `entertainment_express/fleet_maintenance/quarantine.py`: Handles quarantine transitions, future booking conflict detection, and repair order creation.
   - `entertainment_express/api/fleet_maintenance.py`: Whitelisted endpoints:
     - `report_damage(asset_id, booking_id, description, photos, severity)`
     - `release_quarantine(asset_id, maintenance_notes, repair_cost)`
     - `get_fleet_health_summary()`
     - `renew_safety_certificate(cert_id, new_expiry, document_url)`
3. **Frontend Surfaces**:
   - `frontend/crew-app/src/features/teardown/DamageReportModal.tsx`
   - `frontend/owner-portal/src/app/routes/fleet/FleetHealthPage.tsx`
   - `frontend/owner-portal/src/app/routes/fleet/components/QuarantineQueueTable.tsx`
   - `frontend/owner-portal/src/app/routes/fleet/components/SafetyCertificatesCard.tsx`

## Risks / Trade-offs

- **[Risk] Quarantining an asset on Sunday night that is booked for Monday morning**:
  - *Mitigation*: The quarantine workflow automatically runs `detect_upcoming_conflicts(asset_id)`. If an upcoming booking is affected within 7 days, an urgent alert is dispatched to `/owner` and SMS/email notifications are sent to the dispatcher with suggested available replacement assets.
- **[Risk] Excessive photo storage overhead from damage reports**:
  - *Mitigation*: Photos are compressed in the browser (max 1600px, 80% JPEG quality) before uploading to S3/MinIO bucket.
