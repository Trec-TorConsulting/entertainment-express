## ADDED Requirements

### Requirement: Client Information Architecture
The system SHALL present `/client` with a persistent nav: Home, Bookings, Documents, Pay, Planning,
and Messages (Messages may be an empty state).

#### Scenario: Customer finds pay
- **WHEN** a customer with an outstanding deposit opens `/client`
- **THEN** Home shows a Pay next-action and Pay is reachable in one tap from nav

### Requirement: Consumer Visual Density
The client portal SHALL use the shared design tokens with comfortable spacing (not ops-compact tables
as the default).

#### Scenario: Readable on a phone
- **WHEN** a customer opens an upcoming booking on a 375px viewport
- **THEN** status, date/time, and the primary CTA are visible without horizontal scroll
