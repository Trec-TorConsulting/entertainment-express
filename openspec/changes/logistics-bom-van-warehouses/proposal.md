## Why

Live production and entertainment logistics are notoriously prone to asset loss and incomplete pack-outs. When an operator books a major production package (e.g. a festival stage, an inflatable park, or a multi-camera 360 booth), packing requires dozens of interdependent sub-components: power distributors, specialized cables, ballast sandbags, and control racks. Forgetting a single IEC power cable or stage clamp can derail an entire show. Furthermore, inventory regularly goes missing because gear is loaded into trucks without serialized transfer tracking, bouncing between vans and storage units indefinitely. Finally, when operators cross-rent equipment to fulfill larger jobs, sub-rentals are managed haphazardly across emails and text messages without formal purchase orders.

By integrating ERPNext's manufacturing `BOM` (Bill of Materials), `Item Bundle`, `Warehouse` hierarchy, and `Purchase Order` procurement cycles, Entertainment Express establishes an airtight logistics moat: multi-tier kit expansion, rolling "Van-as-a-Warehouse" inventory tracking with barcode scanning, automated missing item reconciliation, and one-click sub-rental procurement.

## What Changes

- **Hierarchical Production BOMs & Assembly Kitting**: Define multi-level production kits in ERPNext where booking a master service item (e.g. "Concert Audio/Visual Stage") automatically generates structured pick-sheets detailing all sub-assemblies (Speaker Arrays, Lighting Truss, Power Distro) and loose accessories.
- **Van-as-a-Warehouse (Mobile Rolling Warehouses)**: Every delivery truck, van, or trailer is modeled as an ERPNext child `Warehouse` (`Main Warehouse/Vehicles/Van 01`).
- **Scan-to-Truck Load-Out**: Crew uses the Field App or warehouse tablet to scan serialized barcodes or QR tags during load-out, executing an automated ERPNext `Stock Entry (Material Transfer)` from the Main Warehouse into the assigned vehicle.
- **Post-Event Check-In & Missing Gear Radar**: When unpacking gear back into the central warehouse, scanned items transfer out of the van. Any unreturned item triggers an immediate "Missing Equipment Alert" attributing the missing serial number to the specific truck and lead crew.
- **One-Click Sub-Rental Procurement**: When booking requirements exceed inventory capacity or require specialized third-party gear, the system automatically drafts an ERPNext `Purchase Order` to preferred equipment vendors with negotiated rates, required on-site delivery dates, return deadlines, and markup pricing.
- **Portal Manifest & Sub-Rental Cockpit**: Surface rolling van inventories, pick-sheet completion progress, and pending sub-rental supplier deliveries in `/owner` and `/employee`.

## Capabilities

### New Capabilities
- `logistics-bom-van-warehouses`: Multi-level production BOMs, mobile van warehouse hierarchy, barcode load-out/check-in transfers, missing gear reconciliation, and automated sub-rental purchase order creation.

### Modified Capabilities
- `equipment-inventory-fleet`: Add hierarchical item bundles and inter-warehouse stock transfer execution.
- `vendor-network`: Add sub-rental procurement workflows and vendor equipment return tracking.
- `mobile-field-app`: Add barcode scan workflows for truck loading and return verification.
- `owner-portal`: Add Van Warehouse manifests and Sub-Rental procurement tracking.

## Impact

- **Backend Architecture**:
  - `entertainment_express/doctype/production_bom/` (new DocType): Extends ERPNext `BOM` with event-specific staging templates.
  - `entertainment_express/doctype/sub_rental_order/` (new DocType): Bridges `Event Booking` with ERPNext `Purchase Order` and `Purchase Receipt`.
  - Warehouse provisioning: Automatically provisions a linked ERPNext `Warehouse` whenever a `Fleet Vehicle` is added.
- **Integrations**:
  - Barcode / QR scanner integration using web camera or handheld Bluetooth scanners.
- **Multi-Tenancy**:
  - All warehouse trees, stock entries, and vendor purchase orders remain strictly sandboxed within the tenant's isolated database.
