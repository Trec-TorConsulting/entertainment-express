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

### Requirement: Brand Host Uses Same Domain Pipeline
The system SHALL treat an EE Brand custom host as a site hostname that must be verified and ingress-published like a company custom domain, while brand resolution still selects that brand's catalog/chrome on the same tenant database.

#### Scenario: Brand host on same site
- **WHEN** a Game Truck brand host is verified for this tenant
- **THEN** requests to that host serve this tenant site and resolve the Game Truck brand without a second database

### Requirement: Brand Host Can Override Company Kit
The system SHALL let an EE Brand on a brand host override company white-label tokens for public storefront chrome while the company kit remains the default on the primary domain.

#### Scenario: Brand host colors
- **WHEN** a Guest opens a verified brand host with brand-specific colors
- **THEN** that storefront uses the brand colors; the company primary domain keeps the company kit
