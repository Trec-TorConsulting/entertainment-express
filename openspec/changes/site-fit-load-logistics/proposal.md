## Why

In the party rental, mobile entertainment, and staging industry, delivery and site complications cause immense operational friction. Drivers regularly arrive on site to discover that a 36-inch wide commercial bounce house cannot fit through a 30-inch garden gate, that an outdoor park venue has no electrical power within 200 feet, or that hard asphalt prohibits ground stakes without heavy sandbag ballasts. Furthermore, manual truck loading frequently results in overweight vehicles or gear left behind at the warehouse, creating domino delivery delays.

## What Changes

- Introduce **Site-Fit Qualification Gates** into the online booking and client planning portal, capturing gate clearance widths, pathway stairs, surface types (grass, asphalt, artificial turf), overhead wire heights, and electrical outlet distances.
- Implement **Automated Equipment-to-Site Compatibility Validation** that cross-references booked equipment physical dimensions, weight, blower amperage, and anchoring requirements against venue parameters, automatically flagging blockers or mandating generator/sandbag add-ons.
- Introduce a **Vehicle Weight & Cubic Volume Load Balancer** in dispatch that calculates aggregate payload weight and cubic foot volume against fleet vehicle Gross Vehicle Weight Rating (GVWR) and cargo box capacities.
- Deliver an **Optimized Delivery Window Generator** that calculates realistic call-times, driving buffers, staging/rigging minutes, and customer-facing delivery windows.
- Surface all site-fit waypoints, gate codes, and power schematics directly to the field crew mobile app (`/employee/field`).

## Capabilities

### New Capabilities
- `site-fit-load-logistics`: Automated site compatibility validation, electrical/anchoring requirement gating, vehicle weight/cube load planning, and delivery window optimization.

### Modified Capabilities
- `venue-management`: Extended with physical site access constraints and electrical profiles.
- `scheduling-dispatch`: Enhanced with vehicle load balancing and delivery window calculations.
- `mobile-field-app`: Enriched with site-fit arrival run sheets and gate codes.

## Impact

- **DocTypes**:
  - `EE Venue Site Profile`: Linked to `Venue` or `Address`, stores gate width, stair count, surface type, power distance, gate code, parking instructions.
  - `EE Vehicle Load Manifest`: Linked to `Dispatch Trip`, tracks vehicle assignment, cargo weight (lbs), cargo volume (cu ft), weight limit utilization %, volume utilization %.
  - `EE Equipment Physical Spec`: Child table or extension on `Item` storing packed weight, packed dimensions (L x W x H), blower power draw (amps/watts), staking mode.
- **Server APIs**:
  - `entertainment_express.site_fit.api.validate_site_compatibility(booking_id)`
  - `entertainment_express.scheduling_dispatch.api.calculate_vehicle_load(dispatch_id)`
  - `entertainment_express.scheduling_dispatch.api.generate_delivery_windows(date, dispatch_route_id)`
- **Portal UI**:
  - Client View: Interactive site checklist during booking / questionnaire.
  - Owner View: Dispatch board with vehicle load bars (weight & cube %) and site risk warnings.
  - Field Crew View: Mobile delivery packet with 1-click navigation, gate code reveal, and site photo references.
