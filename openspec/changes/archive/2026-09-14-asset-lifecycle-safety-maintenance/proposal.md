## Why

Equipment failure during a live event is catastrophic for a mobile entertainment company. A punctured inflatable, a blown amplifier, a failing moving-head light, or a stalled delivery truck destroys brand reputation, triggers client refunds, and creates immense legal liability. Most rental and event software (Inflatable Office, Goodshuffle, HoneyBook) treats inventory as static counters without tracking serial-specific operating hours, safety compliance certificates (ASTM inflatable inspections, PAT electrical safety tagging), or maintenance history.

By leveraging ERPNext's industrial `Asset`, `Asset Maintenance`, `Maintenance Schedule`, and `Maintenance Log` modules, Entertainment Express can deliver an enterprise-grade equipment health and safety compliance moat that proactively schedules servicing, enforces hard dispatch gates for uncertified gear, and enables field crew to instantly quarantine damaged assets during event teardown.

## What Changes

- **Serialized Equipment Health & Usage Telemetry**: Track operating hours, event count, and mileage per serialized unit (inflatables, speakers, lighting fixtures, photo booths, vehicles).
- **Automated Preventative Maintenance Schedules**: Define periodic (calendar-based) or usage-threshold triggers (e.g. "Inspect blower every 20 events", "PAT test lighting cables every 12 months", "Service box truck every 5,000 miles").
- **Safety Compliance & Certification Registry**: Track state inflatable safety stickers, fire retardant certificates, and electrical safety tags with automated expiry notifications and hard booking dispatch blocks for non-compliant equipment.
- **On-Site Teardown Damage Quarantine**: Field crew can report damaged equipment directly from the Mobile Field App PWA during teardown with photos and defect severity. Reporting damage immediately flips the asset status to `Quarantined`, blocks it from subsequent dispatch matching, and auto-creates an ERPNext `Asset Maintenance Log`.
- **Maintenance Work Orders & Repair Costing**: Manage repair status (Diagnosing, Parts Ordered, In Repair, Tested & Cleared) and record repair costs, parts used, and labor into ERPNext asset value adjustments.
- **Fleet & Asset Radar in `/owner`**: A dedicated Equipment Health & Safety dashboard displaying fleet readiness, upcoming certificate renewals, and the active quarantine queue.

## Capabilities

### New Capabilities
- `asset-lifecycle-safety-maintenance`: Serialized usage telemetry, recurring and usage-triggered preventative maintenance schedules, safety compliance certificates with dispatch gates, and automated teardown quarantine workflows.

### Modified Capabilities
- `equipment-inventory-fleet`: Integrate usage meters, maintenance schedules, and quarantine status into asset availability calculations.
- `mobile-field-app`: Add post-event equipment damage inspection and instant quarantine capture.
- `owner-portal`: Add Equipment Health Cockpit, maintenance log history, and quarantine release actions.

## Impact

- **Backend Architecture**:
  - `entertainment_express/doctype/equipment_maintenance_schedule/` (new DocType): Configurable rule engine for service triggers.
  - `entertainment_express/doctype/safety_certificate/` (new DocType): Tracks governing certificates, issuing bodies, inspection dates, and expiry.
  - Integration with ERPNext `Asset` and `Asset Maintenance Log`.
  - Dispatch availability engine (`booking_availability.py`) updated to evaluate safety certificate validity and quarantine status.
- **Field & Portal UI**:
  - Field PWA (`frontend/crew-app/`): Teardown checklist updated with quick defect flagging.
  - Owner Portal (`frontend/owner-portal/`): New Fleet Readiness & Maintenance cockpit under `/owner/fleet-health`.
- **Multi-Tenancy**:
  - All asset, certificate, and maintenance records remain strictly isolated within the tenant's site database.
