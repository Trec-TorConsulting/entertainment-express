## Context

Entertainment Express currently manages static equipment assets and serial numbers under `equipment_fleet`. However, booking creation only checks general catalog flags rather than discrete timeline locks. When an operator books a 4-hour bounce house rental from 1 PM to 5 PM, the equipment is actually unavailable from 11 AM (loading/transit) through 10 AM the following morning (teardown, return transit, pressure washing, drying, sanitization).

## Goals / Non-Goals

**Goals:**
- Provide a deterministic SQL/ORM temporal overlap query that verifies whether `requested_qty <= (total_stock - reserved_in_window - quarantined_in_window)`.
- Support category-level and item-level custom buffer rules (prep minutes, cleanup/sanitization minutes, travel padding).
- Instantly reflect teardown field app condition reports: if a field worker reports "torn seam" or "blown speaker driver", create an active `EE Maintenance Quarantine Log` and block future bookings in that window.
- Provide high-density timeline visualization for owners to visually identify booking gaps and double-booking risks.

**Non-Goals:**
- Predictive maintenance AI (covered in later AI phases).
- Dynamic market surge pricing (handled by pricing rule engine).

## Architecture & DocType Definitions

### 1. `EE Equipment Reservation`
- **Fields:**
  - `booking`: Link to `Booking` (required)
  - `asset`: Link to `Item` or `Asset` (optional if serialized)
  - `item_code`: Link to `Item` (required)
  - `reserved_qty`: Int (default 1)
  - `event_start`: Datetime
  - `event_end`: Datetime
  - `buffer_start`: Datetime (event_start minus prep/transit buffer)
  - `buffer_end`: Datetime (event_end plus teardown/sanitization buffer)
  - `status`: Select (`Reserved`, `Dispatched`, `Returned`, `Quarantined`, `Released`)
  - `warehouse`: Link to `Warehouse`

### 2. `EE Category Buffer Rule`
- **Fields:**
  - `category`: Link to `Item Group`
  - `prep_minutes`: Int (default 60)
  - `teardown_minutes`: Int (default 60)
  - `turnaround_sanitization_minutes`: Int (default 180)
  - `requires_post_gig_inspection`: Check (0 or 1)

### 3. `EE Equipment Quarantine`
- **Fields:**
  - `asset`: Link to `Asset`
  - `item_code`: Link to `Item`
  - `quarantine_status`: Select (`Quarantined`, `In Repair`, `Inspected & Cleared`)
  - `flagged_by`: Link to `User`
  - `flagged_datetime`: Datetime
  - `reason`: Select (`Damage`, `Sanitization Needed`, `Failed Inspection`, `Missing Parts`)
  - `notes`: Text
  - `resolved_by`: Link to `User`
  - `resolved_datetime`: Datetime

## Server APIs & Python Hooks

File: `entertainment_express/equipment_fleet/api.py`

```python
import frappe
from frappe.utils import get_datetime, add_to_date

@frappe.whitelist()
def check_temporal_availability(items_json, start_datetime, end_datetime, warehouse=None):
    """
    items_json: list of dicts [{"item_code": "BH-01", "qty": 1}]
    Returns: {"available": bool, "details": [...], "conflicts": [...]}
    """
    pass

@frappe.whitelist()
def quarantine_asset(asset_id, reason, notes=None):
    """
    Creates EE Equipment Quarantine record and updates Asset status to 'In Maintenance'.
    """
    pass

@frappe.whitelist()
def release_asset_quarantine(quarantine_id, resolution_notes=None):
    """
    Releases the quarantine and restores asset to available pool.
    """
    pass

@frappe.whitelist()
def get_timeline_availability_matrix(start_date, end_date, item_group=None):
    """
    Aggregates reservations, maintenance locks, and total capacity per day/hour for React grid.
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/owner/inventory/AvailabilityTimeline.tsx`
- **Components:**
  - `ResourceTimelineScrubber`: Horizontal interactive date/time timeline with zoom levels (Day, Week, Month).
  - `AvailabilityStatusBadge`: Color-coded indicator (Green: Available, Yellow: Buffer Conflict / Tight Turnaround, Red: Shortage / Overbooked).
  - `QuarantineDrawer`: Side drawer to view damage logs, photos from field app, and 1-click release button.

## Multi-Tenant Isolation & Security

- All queries filter strictly by `frappe.db.get_list` or parameterized SQL using `site_name` connection context.
- Permissions: `check_temporal_availability` permitted for `EE Tenant Admin`, `EE Staff`, and public booking engine (with rate limiting). `quarantine_asset` permitted for field crew and admin.

## Risks & Mitigations

- **Risk:** High-frequency temporal overlap checks could degrade database query speeds during peak booking seasons.
- **Mitigation:** Maintain indexed `buffer_start` and `buffer_end` on `EE Equipment Reservation` with compound B-tree index on `(item_code, buffer_start, buffer_end, status)`.
