## ADDED Requirements

### Requirement: Sales Sees Own Appointments
The system SHALL show `EE Sales` their assigned appointments on `/employee`. They SHALL NOT see another salesperson’s appointments unless they are the assigned staff or an owner.

#### Scenario: Salesperson opens My Day
- **WHEN** an `EE Sales` user opens `/employee`
- **THEN** today’s assigned consults appear and another salesperson’s consults do not
