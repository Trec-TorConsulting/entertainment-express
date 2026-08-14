## ADDED Requirements

### Requirement: Owner Cockpit Layout
The owner UI at `/owner` SHALL show Overview, Approvals, Money, Team, Catalog, and Settings in
persistent nav, using shared tokens.

#### Scenario: Owner finds approvals
- **WHEN** an owner has pending exceptions
- **THEN** Overview surfaces the count and Approvals is one click from nav

#### Scenario: Employee denied /owner
- **WHEN** an `EE Sales` user requests `/owner`
- **THEN** access is denied and they are sent to `/employee`
