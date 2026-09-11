# Capability: Owner Portal

## ADDED Requirements

### Requirement: Subcontractors Flagship Workspace
The system SHALL provide a dedicated `/owner/subcontractors` flagship workspace in the Owner Portal featuring a qualified partner directory, active subbed-out jobs list, offer acceptance status tracking, margin analytics, and quick sub-out actions.

#### Scenario: Owner navigates to Subcontractors section
- **WHEN** an `EE Tenant Admin` navigates to `/owner/subcontractors`
- **THEN** the workspace renders partner companies, pending and active subbed jobs with profit margins, and quick actions to issue new sub-out requests

#### Scenario: Owner subs out job from booking view
- **WHEN** an owner reviews a booking in `/owner/pipeline` or `/owner/dispatch` and clicks "Sub Out Job"
- **THEN** a sub-out modal opens pre-populated with booking date, venue, and service items, prompting for subcontractor selection, agreed payout, and privacy preferences
