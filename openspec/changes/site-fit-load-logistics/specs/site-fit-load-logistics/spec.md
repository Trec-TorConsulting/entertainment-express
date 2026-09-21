## ADDED Requirements

### Requirement: Site-Fit Clearance Validation
The system SHALL validate physical equipment pathway clearance against venue gate widths, stair counts, and overhead obstructions before confirming an equipment delivery.

#### Scenario: Equipment wider than garden gate
- **WHEN** a customer books an obstacle course requiring a 48-inch pathway clearance
- **AND** the venue profile specifies a 36-inch gate width
- **THEN** the system flags a high-priority site blocker and alerts both the customer and dispatcher.

### Requirement: Power & Anchoring Compatibility Gates
The system SHALL automatically check power proximity and ground surface types, mandating generator rentals when outlets are distant or sandbag ballasts when staking is prohibited.

#### Scenario: Outdoor park setup on asphalt
- **WHEN** an inflatable is booked on an `Asphalt` surface
- **THEN** ground stake anchoring is disabled and the required quantity of 50-lb sandbag ballasts is automatically appended to the pull sheet.

### Requirement: Vehicle Weight & Cube Load Balancing
The system SHALL calculate aggregate cargo weight and cargo volume for every dispatch trip, alerting dispatchers if a vehicle exceeds GVWR or cubic capacity.

#### Scenario: Dispatch truck overloaded
- **WHEN** dispatch assigns 3 large inflatables totaling 3,200 lbs to a cargo van with a 2,800 lb payload limit
- **THEN** the load planning board renders a red warning indicating 114% payload utilization.
