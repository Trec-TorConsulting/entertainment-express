## ADDED Requirements

### Requirement: Public Book Is Site-Scoped
The system SHALL allow guest POST to book an appointment only on the current tenant site, with rate limits. Guests SHALL NOT receive `EE Customer` from booking a consult.

#### Scenario: Consult book does not mint a payer
- **WHEN** a guest books a consult
- **THEN** a Lead is created and the user is not granted `EE Customer` or `System Manager`
