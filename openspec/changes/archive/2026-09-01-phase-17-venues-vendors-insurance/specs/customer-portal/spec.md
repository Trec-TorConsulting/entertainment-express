## ADDED Requirements

### Requirement: Client Signs Waivers
The system SHALL list required unsigned waivers on `/client/documents` for the paying customer. Event guests SHALL NOT sign.

#### Scenario: Customer signs a waiver
- **WHEN** a customer signs a pending waiver
- **THEN** the waiver is stored signed and guests cannot call that API
