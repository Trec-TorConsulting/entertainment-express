## ADDED Requirements

### Requirement: Phase Support For Site Fit, Delivery Windows & Load Planning
The system SHALL expose the behaviors required by `site-fit-logistics` for this capability without cross-tenant leakage.

#### Scenario: Site scoped
- **WHEN** a user on tenant A uses the new phase-28-site-fit-delivery-windows features
- **THEN** only tenant A data is read or written
