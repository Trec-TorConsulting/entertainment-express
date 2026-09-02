# Capability: Site Fit & Logistics

## Purpose
Site suitability gates, fulfillment modes (attended/drop-off/self-serve), delivery/pickup windows, and weight-aware vehicle loads.

## Requirements

### Requirement: Fulfillment Modes
The system SHALL support service fulfillment modes `attended`, `drop_off`, and `self_serve` that drive crew requirements at booking confirm.

#### Scenario: Drop-off skips attendant role
- **WHEN** a drop_off inflatable is confirmed
- **THEN** an attendant crew role is not required unless the item still lists other required roles

### Requirement: Site Fit Evaluation
The system SHALL evaluate structured site requirements (area, surface, power, clearance, water) against booking/venue answers and return `ok`, `warn`, or `block` per tenant policy.

#### Scenario: Insufficient clearance blocks
- **WHEN** policy is block and clearance is below the item minimum
- **THEN** instant booking is refused and staff see the unmet requirement

### Requirement: Delivery And Pickup Windows
The system SHALL store delivery and pickup windows on bookings and expose them to dispatch.

#### Scenario: Window on dispatch board
- **WHEN** a booking has a delivery window
- **THEN** the dispatch board shows that window for routing

### Requirement: Weight Aware Load Check
The system SHALL sum assigned asset shipping weights against vehicle max payload and warn (or block per policy) when overweight.

#### Scenario: Overweight warning
- **WHEN** assigned assets exceed vehicle payload
- **THEN** dispatch sees an overweight warning before finalize
