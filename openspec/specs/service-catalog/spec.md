# Capability: Service Catalog

## Purpose
The configurable engine that models **what a tenant sells** and **what physical resources deliver it**,
across every vertical (DJ, inflatable, booth, game truck, casino/karaoke, performer). This is the heart of
the "generic engine": no vertical is hard-coded. Built on ERPNext **Item** for sellable products, extended
with EE **Service Asset** for bookable resources and pricing rules.

### Data Model
- **Service Item** = ERPNext **Item** extended: item_type (`service|rental|package|addon`), vertical_tag,
  duration, unit (`event|hour|day|unit`), base_price, requires_asset (bool), requires_crew (bool),
  crew_roles_required (child), setup_minutes, teardown_minutes, taxable, active.
- **Service Package**: name, included items (child: item, qty), package_price, active.
- **Add-on**: item flagged `addon`, attachable to items/packages, price.
- **Service Asset**: name, asset_type (`inflatable|booth|truck|dj_rig|casino_table|karaoke_rig|prop|other`),
  identifier/serial, status (`available|maintenance|retired`), quantity (for fungible pools), home_location,
  linked service_items, maintenance schedule ref, images.
- **Pricing Rule** (ERPNext extended): date/seasonal/day-of-week multipliers, volume discounts,
  service-area travel fees, coupon codes.
- **Service Area**: name, geometry (zip list / radius / polygon), travel_fee_rule, min_order, active.

## Requirements

### Requirement: Configurable Service Items
The system SHALL let a tenant define sellable service items of any vertical with pricing, duration, and
resource requirements, with full CRUD.

#### Scenario: Create a DJ package and an inflatable rental
- **WHEN** a tenant creates a "4-Hour Wedding DJ" service item (requires crew: DJ) and a "Castle Bounce
  House" rental item (requires asset)
- **THEN** both persist with their pricing, duration, and resource requirements and become sellable in quotes
  and the booking site

#### Scenario: Item requires resources
- **WHEN** a service item is flagged `requires_asset` or `requires_crew`
- **THEN** quoting and booking enforce that a matching available asset/crew role must be assigned before the
  booking can be confirmed/dispatched

### Requirement: Packages & Add-ons
The system SHALL support bundling items into packages and attaching optional add-ons with their own pricing.

#### Scenario: Package pricing
- **WHEN** a customer selects a package that bundles DJ + uplighting + photo booth
- **THEN** the package price applies instead of the sum of individual items, and included items are itemized
  on the quote

#### Scenario: Add-on upsell
- **WHEN** an add-on (e.g., "extra hour", "fog machine") is attached to a booking
- **THEN** its price is added and the associated resource/time requirements adjust accordingly

### Requirement: Service Assets
The system SHALL model bookable physical assets with availability tracking to prevent double-booking, with
full CRUD.

#### Scenario: Asset uniqueness enforced
- **WHEN** a unique asset (a specific 360 booth unit) is already booked for a date/time
- **THEN** it cannot be assigned to a second overlapping event; the system offers alternatives or flags a
  conflict

#### Scenario: Fungible asset pool
- **WHEN** a tenant has a quantity pool (e.g., 10 identical chairs / 3 identical karaoke rigs)
- **THEN** availability decrements against the pool quantity for overlapping bookings and blocks overbooking
  beyond the pool size

### Requirement: Dynamic Pricing Rules
The system SHALL support pricing modifiers: seasonal/date/day-of-week rates, volume discounts, coupons, and
service-area travel fees.

#### Scenario: Weekend + peak-season pricing
- **WHEN** an event falls on a Saturday in peak season
- **THEN** the applicable pricing multipliers apply automatically to the quote

#### Scenario: Coupon application
- **WHEN** a valid coupon code is applied within its validity/usage limits
- **THEN** the discount is applied and the coupon's remaining usage decrements

### Requirement: Service Areas & Travel Fees
The system SHALL define geographic service areas that gate booking eligibility and compute travel fees.

#### Scenario: Out-of-area booking
- **WHEN** a requested event location is outside all defined service areas
- **THEN** the booking site either blocks it or flags it for manual review per tenant policy

#### Scenario: Travel fee computed
- **WHEN** an event location falls in a service area with a distance/zone travel-fee rule
- **THEN** the travel fee is computed and added to the quote automatically

### Requirement: Event-Type Package Grouping
The system SHALL let tenants group packages by event type so customers see only relevant packages for their
selected event type on the booking site.

#### Scenario: Filtered packages by event type
- **WHEN** a customer selects "Wedding" as their event type on the booking site
- **THEN** only wedding-tagged packages/items are shown, hiding packages meant for other event types

### Requirement: Product Variations
The system SHALL support item variations (e.g., color, size, theme) under a parent item, each with its own
price/stock where applicable.

#### Scenario: Choose a variation
- **WHEN** an item (e.g., bounce house) has theme/size variations
- **THEN** the customer selects a variation, and its specific price and availability apply to the booking

### Requirement: Client-Visible Package Lines
The system SHALL allow each Service Package (and quote) line to be marked client-visible or warehouse-only. Client-facing Proposals and invoices SHALL omit warehouse-only labels. Totals SHALL still include those lines using `flt`.

#### Scenario: Hidden cable on a DJ package
- **WHEN** a package includes a warehouse-only cable line at a non-zero rate
- **THEN** the Proposal subtotal includes the cable amount and the client line list does not show the cable name

### Requirement: Package Images For Storefront
The system SHALL store an image per published Service Package for the public catalog and Proposal.

#### Scenario: Catalog shows package photo
- **WHEN** a published package has an image
- **THEN** the public catalog and Proposal render that image for this tenant only
