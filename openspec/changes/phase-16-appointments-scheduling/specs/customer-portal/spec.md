## ADDED Requirements

### Requirement: Client Books Consults
The system SHALL let a signed-in `EE Customer` book, reschedule, and cancel their own appointments from `/client`. Event guests SHALL NOT book as the paying customer.

#### Scenario: Customer reschedules
- **WHEN** a customer picks a new offered slot for their consult
- **THEN** the Appointment times update, the old slot is released, and both parties are notified

#### Scenario: Guest cannot book as payer
- **WHEN** an `EE Event Guest` calls the customer book-appointment API
- **THEN** the request is denied (403)
