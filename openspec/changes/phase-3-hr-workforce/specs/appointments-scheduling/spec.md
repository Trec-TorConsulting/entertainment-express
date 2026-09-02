## ADDED Requirements

### Requirement: Consults Use Workforce Hours
Appointment slot computation SHALL use Worker Availability when consult hours are empty, and SHALL treat Worker Time Off the same as legacy Event Booking time-off.

#### Scenario: Time-off hides consults
- **WHEN** staff has Worker Time Off on a date
- **THEN** no consult slots are offered for that person on that date
