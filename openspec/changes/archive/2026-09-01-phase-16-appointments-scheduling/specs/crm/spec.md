## ADDED Requirements

### Requirement: Appointment Creates Lead
The system SHALL create or match a Lead on the current tenant when a public appointment is booked (email match). The Appointment SHALL store the Lead link. No other tenant’s Leads SHALL be read or written.

#### Scenario: New prospect
- **WHEN** a new email books a consult
- **THEN** a Lead is created on this site with that email and the appointment is linked
