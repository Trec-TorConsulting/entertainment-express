# Capability: Multi-Brand

## Purpose
Multiple brands/DBAs under one tenant site with brand-scoped storefronts and communications.

## Requirements

### Requirement: Brand Registry
The system SHALL let a tenant define multiple brands (name, slug, logo, colors, optional host/path) within the same site database.

#### Scenario: Create second brand
- **WHEN** an owner creates a Game Truck brand alongside the default brand
- **THEN** both brands exist on the same tenant site without a second database

### Requirement: Brand Scoped Storefront
The system SHALL resolve the public booking site to a brand and show only packages assigned to that brand (plus explicitly shared packages).

#### Scenario: Filtered catalog
- **WHEN** a guest opens the Game Truck brand storefront
- **THEN** bounce-house-only packages for another brand are not listed

### Requirement: Brand On Booking Communications
The system SHALL stamp bookings with a brand and use that brand's identity on client-facing notifications when configured.

#### Scenario: Email from brand
- **WHEN** a confirmation is sent for a branded booking
- **THEN** the from-name matches the brand configuration for this tenant
