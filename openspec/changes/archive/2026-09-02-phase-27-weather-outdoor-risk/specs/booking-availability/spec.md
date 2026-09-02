## ADDED Requirements

### Requirement: Rain-Date Hold Uses Availability Engine
The system SHALL create rain-date candidate holds through the existing hold/availability engine so assets and crew cannot be double-booked.

#### Scenario: Conflicting rain date rejected
- **WHEN** staff offer a rain date that conflicts with a confirmed booking for the same unique asset
- **THEN** the offer is rejected and the original booking is unchanged
