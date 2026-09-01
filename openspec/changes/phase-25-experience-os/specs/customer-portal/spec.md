## ADDED Requirements

### Requirement: Client Operating System
The system SHALL make `/client` the place the paying customer does all of their work for their events: home next action, events, pay, documents/contracts, planning, invite people, chat, and deliverables. The customer SHALL NOT be sent to Frappe Desk.

#### Scenario: Client home next action
- **WHEN** a customer with an unsigned contract or unpaid deposit opens `/client`
- **THEN** the home highlights Sign or Pay for that event using existing contract/payment APIs

### Requirement: Event People And Guest Experience
The system SHALL let the paying customer invite and revoke event guests (`event-collaboration`). Accepted guests using `/client` SHALL see only that event’s planning, chat, and published photos — not Pay, not invoices, not the ability to invite others (v1).

#### Scenario: Guest lands on the event
- **WHEN** an accepted `EE Event Guest` opens their invite link
- **THEN** they see that event’s planning hub and chat, and do not see other customers or Pay

#### Scenario: Customer pays, guest does not
- **WHEN** the customer pays a deposit from `/client`
- **THEN** the payment succeeds through existing billing APIs; the same action is unavailable in the guest UI and API
