## ADDED Requirements

### Requirement: Pull Sheet Stock Lines
The system SHALL treat pull-sheet contents as stock/rental/warehouse lines from the booking, excluding pure service items.

#### Scenario: Service package is not a pack line
- **WHEN** a booking includes a DJ-hour service item and a fog-machine stock item
- **THEN** the pull sheet lists the fog machine and does not list the DJ-hour as a warehouse pick
