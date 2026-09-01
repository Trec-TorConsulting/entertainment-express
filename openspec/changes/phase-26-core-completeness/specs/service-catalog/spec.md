## ADDED Requirements

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
