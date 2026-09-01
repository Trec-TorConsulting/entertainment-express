## ADDED Requirements

### Requirement: Public Catalog And Wishlist
The system SHALL publish the tenant’s active catalog on the public booking site and SHALL let a logged-in `EE Customer` save items to a wishlist on that tenant only.

#### Scenario: Guest browses packages
- **WHEN** a visitor opens the tenant public catalog
- **THEN** they see active packages/add-ons for that tenant and no other tenant’s items

#### Scenario: Customer saves a wishlist item
- **WHEN** a customer saves a package to their wishlist
- **THEN** it appears on their `/client` Planning or Events extras for that tenant only
