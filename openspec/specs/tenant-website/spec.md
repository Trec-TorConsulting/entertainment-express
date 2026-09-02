# Capability: Tenant Website & Widgets

## Purpose
Tenant marketing pages and embeddable availability/catalog/wishlist/book widgets for external sites.

## Requirements

### Requirement: Tenant Marketing Pages
The system SHALL let a tenant publish branded marketing pages (title, body, SEO) on their public site host with sanitization.

#### Scenario: Publish about page
- **WHEN** an owner publishes an About page
- **THEN** guests can view it on the tenant host and unpublished pages return 404

### Requirement: Embeddable Booking Widgets
The system SHALL provide embeddable widgets for availability, catalog, wishlist, and book CTA that call site-scoped public APIs.

#### Scenario: Availability widget on external site
- **WHEN** a page loads the EE embed with a valid public embed key for tenant A
- **THEN** availability results are only for tenant A inventory

### Requirement: Embed Rate Limits And Isolation
The system SHALL rate-limit embed APIs and reject keys that do not match the resolved tenant site.

#### Scenario: Wrong key
- **WHEN** an embed key from tenant B is used on tenant A host
- **THEN** the API rejects the request without leaking tenant B data
