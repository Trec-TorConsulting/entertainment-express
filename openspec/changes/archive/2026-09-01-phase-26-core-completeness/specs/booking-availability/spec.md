## ADDED Requirements

### Requirement: Potential Quote Conflicts
The system SHALL classify resource conflicts as `actual` (confirmed bookings, active holds, maintenance) or `potential` (overlapping sent/open Quotations). Sending a quote SHALL remain allowed when only potential conflicts exist. Confirming a booking SHALL still be blocked on actual conflicts.

#### Scenario: Potential overlap on two quotes
- **WHEN** sales adds a unique asset to a second Open quotation that overlaps the first Open quotation
- **THEN** availability returns `potential` conflicts and does not mark the slot unavailable for quoting

#### Scenario: Actual conflict still blocks confirm
- **WHEN** a unique asset is already on a confirmed Event Booking for the same slot
- **THEN** a new booking confirm is rejected and alternatives may be suggested

### Requirement: Public Catalog And Wishlist
The system SHALL publish tenant Service Packages that are marked public on the tenant booking site with name, image, and formatted rate, and SHALL accept a wishlist or quote request that creates a Lead / inquiry for that tenant only.

#### Scenario: Guest requests a quote from the catalog
- **WHEN** a visitor adds public packages to a wishlist and submits contact details
- **THEN** a Lead (and tentative inquiry) is created on that tenant site with those packages and no other tenant’s catalog is shown

#### Scenario: Unpublished package hidden
- **WHEN** a package is not published
- **THEN** it does not appear on the public catalog
