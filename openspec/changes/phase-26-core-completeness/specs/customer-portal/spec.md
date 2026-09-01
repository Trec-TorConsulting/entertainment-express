## ADDED Requirements

### Requirement: Client Pay And Documents
The system SHALL list the paying customer’s invoices and contracts on `/client/pay` and `/client/documents`. The customer SHALL be able to start Stripe Checkout on an outstanding invoice they own and sign a contract they own. Amounts SHALL be backend-formatted strings. `EE Event Guest` SHALL be denied these APIs.

#### Scenario: Customer pays own invoice
- **WHEN** a paying customer starts checkout on their outstanding invoice
- **THEN** Stripe Checkout opens for that invoice only

#### Scenario: Guest cannot pay
- **WHEN** an `EE Event Guest` calls checkout or contract-sign APIs
- **THEN** the request is denied and no payment or signature is stored

#### Scenario: Home prefers Sign then Pay
- **WHEN** a customer has an unsigned contract and an unpaid balance
- **THEN** `/client` Home highlights Sign first, then Pay
