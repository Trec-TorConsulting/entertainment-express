## ADDED Requirements

### Requirement: Damage Hold Uses Existing Processor
The system SHALL place, capture, and release damage holds only through the existing billing preauth APIs. Amounts SHALL use `flt`. Guests SHALL NOT call hold APIs.

#### Scenario: Guest denied hold
- **WHEN** an `EE Event Guest` calls create-damage-hold
- **THEN** access is denied and no Payment Intent is created
