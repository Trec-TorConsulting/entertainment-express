## ADDED Requirements

### Requirement: Dispatcher Suggestions Without Auto Assign
The system SHALL let a dispatcher request ranked crew suggestions for an unassigned job from `/employee` Dispatch. Applying a row SHALL call the existing offer/assign API, not a silent write from the LLM.

#### Scenario: Suggest crew
- **WHEN** a dispatcher requests suggestions for an unassigned event
- **THEN** a ranked list of available crew is shown and no Crew Assignment is created until they apply one

#### Scenario: Crew cannot open company chat
- **WHEN** an `EE Crew` user calls `ask`
- **THEN** the request is denied (403)
