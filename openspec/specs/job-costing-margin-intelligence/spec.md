# job-costing-margin-intelligence Specification

## Purpose
TBD - created by archiving change job-costing-margin-intelligence. Update Purpose after archive.
## Requirements
### Requirement: Automated Cost Center and Project Provisioning
The system SHALL automatically provision an isolated ERPNext `Cost Center` and linked `Project` for each confirmed `Event Booking`, tagged with the booking ID and client reference.

#### Scenario: Cost Center creation on booking confirmation
- **WHEN** an `Event Booking` status transitions to `confirmed`
- **THEN** the system creates or verifies an ERPNext `Cost Center` named `{booking_id}` under the tenant's primary company cost center hierarchy and links an ERPNext `Project` to the booking

#### Scenario: Multi-tenant isolation for cost centers
- **WHEN** cost centers are generated for a booking on tenant site A
- **THEN** all cost center and project records are saved strictly within tenant site A's database and are inaccessible from tenant site B

### Requirement: Real-Time Event COGS Rollup
The system SHALL aggregate direct labor costs, subcontractor expenses, consumable material depletion, asset wear amortization, and payment gateway fees into an `Event Cost Sheet` linked to the booking's Cost Center.

#### Scenario: Labor cost aggregation from timesheets
- **WHEN** crew members submit approved timesheets or gig fees against an `Event Booking`
- **THEN** the labor cost is computed from verified worker rates and rolled into the `Event Cost Sheet` direct labor total

#### Scenario: Subcontractor purchase invoice linkage
- **WHEN** a `Purchase Invoice` or `Purchase Order` referencing the booking project is submitted
- **THEN** the expense amount is automatically tallied in the `Event Cost Sheet` subcontractor cost bucket

#### Scenario: Consumable stock issue calculation
- **WHEN** consumable inventory items (e.g. fog fluid, glow sticks, wristbands) are allocated to a booking
- **THEN** a `Stock Entry` of type `Material Issue` is generated against the booking Cost Center, and the item valuation rate is added to consumable COGS

### Requirement: Net Margin and Health Alert Calculation
The system SHALL calculate the event Net Profit (Gross Invoiced Revenue minus Total COGS) and Net Margin percentage (`Net Profit / Gross Revenue * 100`) in real-time, displaying alert badges if the margin drops below the tenant's configured threshold.

#### Scenario: Target margin exceeded
- **WHEN** an event generates $5,000 in gross revenue with $2,000 total costs (60% margin) and tenant target is 50%
- **THEN** the margin status is flagged as `healthy` with a positive margin indicator

#### Scenario: Low margin alert
- **WHEN** unexpected overtime or subcontractor costs reduce the event margin below the tenant threshold (e.g. 25% vs 40% target)
- **THEN** the system flags the booking with a `low-margin` warning badge and alerts the owner

