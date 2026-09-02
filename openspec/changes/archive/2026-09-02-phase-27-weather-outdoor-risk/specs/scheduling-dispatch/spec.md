## ADDED Requirements

### Requirement: Dispatch Weather Flags
The system SHALL flag weather-blocked or warning jobs on the dispatch board and include an outdoor-risk note on the run sheet when weather-sensitive.

#### Scenario: Blocked job on board
- **WHEN** a booking weather status is `block`
- **THEN** the dispatch board shows a weather block indicator for that job
