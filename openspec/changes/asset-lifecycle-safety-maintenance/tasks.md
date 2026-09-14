## 1. DocTypes & Data Modeling

- [ ] 1.1 Create `Safety Certificate` DocType (`entertainment_express/doctype/safety_certificate/`) with fields: `certificate_name`, `issuing_body`, `certificate_number`, `issue_date`, `expiry_date`, `document_file`, `governed_assets` (child table).
- [ ] 1.2 Create `Equipment Maintenance Schedule` DocType with fields: `rule_name`, `asset_category`, `trigger_type` (`calendar`, `operating_hours`, `event_count`, `mileage`), `interval_value`, `service_checklist`.
- [ ] 1.3 Create `Equipment Defect Report` DocType with fields: `reported_by`, `booking_ref`, `asset_ref`, `severity`, `defect_description`, `photos`, `resolution_status`.
- [ ] 1.4 Add telemetry fields to `Service Asset`: `operating_hours`, `event_count`, `current_mileage`, `condition_status` (`Available`, `Dispatched`, `In Use`, `Quarantined`, `In Repair`, `Pending Inspection`), `quarantine_reason`.

## 2. Usage Telemetry & Maintenance Triggers

- [ ] 2.1 Implement `increment_asset_usage(booking)` in `entertainment_express/fleet_maintenance/telemetry.py` triggered when a booking completes.
- [ ] 2.2 Implement maintenance rule evaluator that compares cumulative meters against `Equipment Maintenance Schedule` and creates ERPNext `Asset Maintenance Log` records when triggered.
- [ ] 2.3 Implement scheduled daily cron checking expiring safety certificates (30-day, 14-day, and 1-day notifications).

## 3. Dispatch Safety Gates & Quarantine Engine

- [ ] 3.1 Update `booking_availability.py` and `scheduling_dispatch.py` to check certificate expiration and quarantine state, raising validation exceptions if invalid.
- [ ] 3.2 Implement `quarantine_asset(asset_id, reason, defect_report_id)` that revokes availability, scans future bookings within 14 days, and generates dispatcher swap alerts.
- [ ] 3.3 Implement `release_quarantine(asset_id, repair_cost, technician_notes)` restoring condition to `Available`.

## 4. API Endpoints

- [ ] 4.1 Implement `report_damage()` endpoint in `entertainment_express/api/fleet_maintenance.py` supporting multipart photo upload, offline timestamp, and immediate quarantine execution.
- [ ] 4.2 Implement `get_fleet_health_summary()` returning readiness percentage, count of quarantined units, overdue maintenance, and expiring certificates.
- [ ] 4.3 Implement `list_quarantined_assets()` with defect history and repair status.

## 5. UI Surfaces (Field PWA & Owner Cockpit)

- [ ] 5.1 Build `DamageReportModal` in `frontend/crew-app/` with photo capture, severity selector, and offline IndexedDB fallback.
- [ ] 5.2 Build `FleetHealthPage` in `frontend/owner-portal/src/app/routes/fleet/FleetHealthPage.tsx` showing fleet readiness gauges, quarantine queue table, and certificate renewal actions.
- [ ] 5.3 Add quarantine badge indicator to asset rows in `/owner/pipeline` and `/employee/dispatch`.

## 6. Testing & Multi-Tenant Verification

- [ ] 6.1 Add unit tests in `entertainment_express/tests/test_fleet_maintenance.py` verifying usage increments, threshold triggers, and dispatch safety locks.
- [ ] 6.2 Add test for teardown damage reporting verifying that reporting damage revokes asset availability across concurrent bookings.
- [ ] 6.3 Run `python3 smoke_test.py` to confirm all syntax, DocTypes, and OpenSpec checks pass.
