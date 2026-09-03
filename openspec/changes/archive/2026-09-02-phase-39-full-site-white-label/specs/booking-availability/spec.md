## ADDED Requirements

### Requirement: Public Booking Surfaces Use Full White-Label
The system SHALL render `/book`, `/catalog`, and the tenant public home with the company white-label kit when full white-label mode is enabled.

#### Scenario: Catalog footer is company text
- **WHEN** full white-label is on and footer text is set
- **THEN** `/catalog` shows that footer text instead of Entertainment Express copyright
