## ADDED Requirements

### Requirement: Clone Respects Availability
The system SHALL run the existing availability engine when cloning a job to a new window and SHALL reject the clone on unique-asset or pool-quantity conflict.

#### Scenario: Clone collides with a booked asset
- **WHEN** the owner clones a job onto a date where a unique asset is already confirmed
- **THEN** the clone is rejected and no new booking is inserted
