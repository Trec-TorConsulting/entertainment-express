## Context

Delivery failure is the leading cause of refunded orders, driver overtime, and 1-star reviews for party rental and mobile entertainment operators. Commercial inflatables weigh between 250 lbs and 1,200 lbs; staging decks, photo booths, and large speakers require continuous level rolling pathways or ramps. By encoding physical constraints into Frappe, we prevent impossible deliveries before contracts are finalized.

## Goals / Non-Goals

**Goals:**
- Enforce gate width validation: `if item.min_gate_clearance_inches > venue.gate_width_inches: flag_blocker()`.
- Enforce power validation: `if item.requires_power and venue.power_distance_ft > 100: mandate_generator_rental()`.
- Enforce surface anchoring: `if venue.surface_type in ['Asphalt', 'Concrete', 'Indoor'] and item.requires_staking: mandate_sandbag_ballasts()`.
- Calculate vehicle load capacities: `total_weight <= vehicle.max_payload_lbs` and `total_cuft <= vehicle.cargo_volume_cuft`.
- Present clean, offline-cached site instructions to field drivers on mobile.

**Non-Goals:**
- Full turn-by-turn navigation engine (hand off GPS coordinates to Google Maps / Apple Maps / Waze).
- 3D truck packing Tetris simulation (volume and weight heuristics are sufficient).

## Architecture & DocType Definitions

### 1. `EE Venue Site Profile`
- **Fields:**
  - `venue`: Link to `Venue`
  - `gate_width_inches`: Int (default 36)
  - `has_stairs`: Check (default 0)
  - `stair_step_count`: Int (default 0)
  - `surface_type`: Select (`Grass`, `Asphalt`, `Concrete`, `Artificial Turf`, `Indoor Gymnasium`, `Dirt/Gravel`)
  - `power_source`: Select (`Dedicated 20A Within 50ft`, `Dedicated 20A Within 100ft`, `Over 100ft Away`, `No Power Available`)
  - `water_source_distance_ft`: Int (for water slides)
  - `overhead_clearance_ft`: Int (default 20)
  - `access_gate_code`: Data
  - `driver_parking_notes`: Small Text
  - `site_map_photo`: Attach Image

### 2. `EE Vehicle Load Manifest`
- **Fields:**
  - `vehicle`: Link to `Vehicle`
  - `dispatch_trip`: Link to `Dispatch Trip`
  - `max_payload_lbs`: Float
  - `cargo_volume_cuft`: Float
  - `current_payload_lbs`: Float
  - `current_volume_cuft`: Float
  - `weight_utilization_pct`: Percent
  - `volume_utilization_pct`: Percent
  - `is_overloaded`: Check (calculated: payload > max or volume > max)

## Server APIs & Python Hooks

File: `entertainment_express/scheduling_dispatch/api.py`

```python
import frappe

@frappe.whitelist()
def validate_site_fit(booking_id):
    """
    Checks all items on booking against EE Venue Site Profile.
    Returns: {"compatible": bool, "issues": [{"type": "gate"|"power"|"surface", "message": str, "action_required": str}]}
    """
    pass

@frappe.whitelist()
def check_vehicle_load_balance(vehicle_id, booking_ids_json):
    """
    Computes cumulative weight and volume of all items across assigned bookings.
    Returns: {"valid": bool, "total_weight_lbs": float, "weight_pct": float, "total_cuft": float, "volume_pct": float}
    """
    pass

@frappe.whitelist()
def get_driver_site_packet(booking_id):
    """
    Returns sanitized field packet for driver: gate code, surface, power, photos, map link.
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/owner/dispatch/LoadPlanning.tsx`
- **Components:**
  - `VehicleLoadCard`: Visual truck graphic showing weight and cubic fill progress bars with danger thresholds (>90% Amber, >100% Red).
  - `SiteRiskChip`: Warning badges displayed on dispatch cards (e.g. "Gate < 36in", "No Power - Gen Needed", "Asphalt - Sandbags").
  - `DriverWaypointSheet`: Mobile-optimized view in `/employee/field` with large tap targets for calling on-site contacts and 1-tap gate code copy.

## Multi-Tenant Isolation & Security

- Vehicle profiles and site credentials (gate codes, site contacts) are strictly isolated within the tenant's MariaDB site database.
- Driver waypoint API verifies the requesting crew member is assigned to that specific booking.

## Risks & Mitigations

- **Risk:** Client enters inaccurate gate width measurements during booking intake.
- **Mitigation:** Include reference photos in client questionnaire (e.g. "Standard single yard gate = 36 inches", "Double gate = 72 inches") and include a mandatory client waiver affirming gate clearance.
