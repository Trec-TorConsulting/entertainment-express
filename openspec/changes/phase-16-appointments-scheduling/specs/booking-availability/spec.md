## ADDED Requirements

### Requirement: Event Work Blocks Consults
The system SHALL treat overlapping confirmed/in-progress Event Booking crew assignments as busy for appointment slot calculation for that staff member.

#### Scenario: Saturday gig blocks Saturday consult
- **WHEN** staff is assigned to a confirmed booking 2pm–6pm
- **THEN** consult slots overlapping that window are not offered
