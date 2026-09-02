## ADDED Requirements

### Requirement: Gear Fleet Without Desk
The owner portal SHALL manage bookable units, vehicles, stock moves, sub-rentals, and utilization on `/owner/gear` without Desk. Copy SHALL use gear/truck language, never DocType names.

#### Scenario: Owner moves stock
- **WHEN** an `EE Tenant Admin` transfers qty from one location to another
- **THEN** both balances update and an auditable transfer is stored on this site only

#### Scenario: Guest denied
- **WHEN** a guest calls a gear fleet API
- **THEN** access is denied
