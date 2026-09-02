## ADDED Requirements

### Requirement: Move In Without Desk
The system SHALL offer `/owner/move` for import, dry-run, commit, and export without `/app`. Labels SHALL be business language.

#### Scenario: Owner imports a customer list
- **WHEN** an owner dry-runs then commits a customers CSV
- **THEN** the job shows how many landed and failed, with no Desk URL
