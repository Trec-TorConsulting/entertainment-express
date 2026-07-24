# Capability: Equipment, Inventory & Fleet

## Purpose
Track the physical resources a mobile-entertainment company owns and moves: bookable assets, consumable
inventory, and vehicles — including maintenance, condition, location, and utilization. Built on ERPNext
Stock/Asset plus EE Service Asset (from `service-catalog`).

### Data Model
- **Service Asset** (shared with service-catalog): the bookable unit; here we add condition, location,
  utilization, maintenance link.
- **Inventory Item** (ERPNext Stock): consumables (props, decorations, media supplies, fuel) with
  warehouse/stock levels.
- **Vehicle**: name, plate, VIN, type, capacity, status (`active|in_service|out_of_service`), assigned crew,
  odometer, fuel, registration/insurance expiry.
- **Maintenance Record**: asset/vehicle (link), type (`scheduled|repair|inspection`), due/performed dates,
  cost, vendor, status, next_due.
- **Damage/Incident Report**: asset/vehicle (link), booking (link), description, photos, severity, cost.
- **Check-out/Check-in Log**: asset/vehicle, booking, out/return timestamps, condition before/after.

## Requirements

### Requirement: Asset Registry & Condition
The system SHALL maintain a registry of bookable assets with condition, location, and status, with full CRUD.

#### Scenario: Asset out of service
- **WHEN** an asset is marked `maintenance`/`out_of_service`
- **THEN** it is excluded from availability and cannot be booked until returned to `available`

#### Scenario: Utilization tracking
- **WHEN** viewing an asset
- **THEN** its booking utilization (days booked vs available) over a period is reported

### Requirement: Consumable Inventory
The system SHALL track consumable stock levels with reorder points and deduction on use, via ERPNext Stock.

#### Scenario: Stock deduction on event
- **WHEN** a booking consumes consumable items
- **THEN** stock is deducted from the warehouse and low-stock reorder alerts trigger below reorder level

### Requirement: Fleet / Vehicle Management
The system SHALL manage vehicles including assignment, status, odometer/fuel, and registration/insurance
expiries, with full CRUD.

#### Scenario: Vehicle assignment conflict
- **WHEN** a vehicle is already assigned to an overlapping route/event
- **THEN** it cannot be double-assigned; the conflict is blocked

#### Scenario: Registration expiry alert
- **WHEN** a vehicle's registration or insurance nears expiry
- **THEN** an alert is raised to the fleet manager

### Requirement: Maintenance Scheduling
The system SHALL schedule and track preventive and repair maintenance for assets and vehicles.

#### Scenario: Scheduled maintenance due
- **WHEN** a maintenance interval (date or usage) is reached
- **THEN** a maintenance task is created, the resource can be blocked from booking during the window, and
  completion updates next-due

### Requirement: Check-out / Check-in & Damage
The system SHALL log asset/vehicle check-out and return with condition capture and damage reporting.

#### Scenario: Return with damage
- **WHEN** an asset is returned and a crew member reports damage with photos
- **THEN** a Damage/Incident Report is created, the asset may be flagged for maintenance, and repair cost is
  tracked

### Requirement: Barcode / QR Asset Tracking
The system SHALL support barcode/QR codes on assets for scan-based check-out/check-in and verification (web
and mobile app).

#### Scenario: Scan check-out
- **WHEN** a crew member scans an asset's barcode/QR during load-out for an event
- **THEN** the asset is checked out to that booking, and scanning it again on return checks it back in with
  condition capture

### Requirement: Packing Lists / Pull Sheets
The system SHALL generate per-event packing lists (pull sheets) of all assets and consumables required, and
support verifying items are packed (scan or check-off).

#### Scenario: Generate and verify a packing list
- **WHEN** an event's packing list is generated and crew pack the truck
- **THEN** each item can be checked off or scanned as packed, and the system flags any missing items before
  departure

### Requirement: Multi-Location Stock
The system SHALL track asset and consumable stock across multiple locations/warehouses, with per-location
availability and transfers.

#### Scenario: Availability by location
- **WHEN** a tenant operates from multiple warehouses
- **THEN** availability is computed per location, and stock can be transferred between locations with an
  auditable record

### Requirement: Sub-Rentals / Cross-Rental
The system SHALL support sourcing equipment from partner vendors (sub-rental) when internal stock is
insufficient, tracking cost and supplier.

#### Scenario: Sub-rent to cover shortage
- **WHEN** a booking needs more units than are available internally
- **THEN** a sub-rental from a partner vendor (see `vendor-network`) can be recorded with cost and supplier,
  covering the shortage without overbooking owned stock
