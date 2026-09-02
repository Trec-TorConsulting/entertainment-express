## ADDED Requirements

### Requirement: Import Is Owner And Site Scoped
The system SHALL deny guests and non-owners on import/export APIs. Import SHALL NOT accept a site or tenant argument.

#### Scenario: Guest denied import
- **WHEN** an `EE Event Guest` starts an import
- **THEN** the request is denied (403) and no job is created
