## ADDED Requirements

### Requirement: Production Bill of Materials (BOM) Expansion
The system SHALL expand composite service packages into nested production BOMs, generating hierarchical pull-sheets that specify required primary assets, sub-assemblies, and ancillary accessories.

#### Scenario: Expanding package into sub-assemblies
- **WHEN** a booking includes a "Full Stage Lighting & Sound Rig"
- **THEN** the dispatch pull-sheet lists the master kit along with required sub-assemblies (2x Subwoofers, 4x Line Arrays, 1x Amp Rack, 8x DMX Fixtures, 1x Cabling Trunk)

#### Scenario: Preventing incomplete dispatch
- **WHEN** a required cable trunk or sub-assembly component is missing from the load-out scan
- **THEN** the system prevents marking the vehicle load-out as complete until all required BOM line items are scanned or an authorized exception is approved

### Requirement: Rolling Van Warehouses and Stock Transfers
The system SHALL maintain an ERPNext child `Warehouse` for each `Fleet Vehicle` and execute serialized `Stock Entry` transfers between the central warehouse and vehicles upon loading and unloading.

#### Scenario: Scanning gear into vehicle
- **WHEN** crew scans equipment barcode tags during truck load-out
- **THEN** the system executes an ERPNext `Stock Entry` (Material Transfer) moving the scanned serialized assets from `Main Warehouse` to `Van Warehouse`

#### Scenario: Missing equipment detection on return
- **WHEN** an event concludes and the vehicle is unloaded back into the `Main Warehouse`
- **THEN** any item currently recorded in the `Van Warehouse` that is not scanned upon return is flagged with status `Missing in Transit`, alerting the warehouse manager

### Requirement: Automated Sub-Rental Procurement
The system SHALL generate an ERPNext `Purchase Order` to a designated partner vendor when booked equipment is outsourced or inventory capacity is exceeded.

#### Scenario: Creating sub-rental purchase order
- **WHEN** an operator selects "Source from Vendor" on a booked line item
- **THEN** the system creates an ERPNext `Purchase Order` specifying the vendor, agreed sub-rental fee, required delivery date to the venue/warehouse, and agreed return date

#### Scenario: Tracking sub-rental return deadline
- **WHEN** a sub-rented unit is due for return to the third-party supplier
- **THEN** the system alerts dispatch 24 hours prior to the return window to prevent late vendor penalty fees
