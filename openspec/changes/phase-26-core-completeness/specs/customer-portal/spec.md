## ADDED Requirements

### Requirement: Working Pay Screen
The system SHALL list the paying customer’s open invoices and deposits on `/client/pay` and start checkout through existing billing APIs. The screen SHALL NOT be an empty state that links to itself.

#### Scenario: Customer pays a deposit
- **WHEN** a customer with an unpaid deposit invoice opens `/client/pay` and completes checkout
- **THEN** the processor capture succeeds through existing billing, the invoice updates, and amounts shown are backend strings

#### Scenario: Guest denied pay
- **WHEN** an `EE Event Guest` requests `/client/pay` or the pay API
- **THEN** access is denied and no Payment Entry is created

### Requirement: Working Documents And Sign
The system SHALL list the customer’s contracts and receipts on `/client/documents`. Unsigned contracts SHALL be signable in the portal using the existing e-sign audit trail.

#### Scenario: Customer signs in portal
- **WHEN** a customer opens an unsigned contract on `/client/documents` and signs
- **THEN** the contract is `signed` with signer, timestamp, and signature payload stored as today

#### Scenario: Guest cannot sign
- **WHEN** a guest calls sign for that booking’s contract
- **THEN** the request is denied (403)

### Requirement: Working Planning Hub
The system SHALL load planning forms, timeline, and music lists for the selected booking on `/client/planning` using existing phase-15 APIs plus event-collaboration suggest/vote.

#### Scenario: Customer completes a planning form
- **WHEN** a customer saves answers on `/client/planning`
- **THEN** the Planning Form Instance updates and completion percent is stored

#### Scenario: Guest sees planning not money
- **WHEN** an accepted guest opens `/client/planning`
- **THEN** they can view/suggest planning items for that booking only and do not see invoices

## MODIFIED Requirements

### Requirement: Client Operating System
The system SHALL make `/client` the place the paying customer does all of their work for their events: home next action, events, pay, documents/contracts, planning, invite people, chat, and deliverables. The customer SHALL NOT be sent to Frappe Desk.

#### Scenario: Client home next action
- **WHEN** a customer with an unsigned contract or unpaid deposit opens `/client`
- **THEN** the home highlights Sign or Pay for that event using existing contract/payment APIs

#### Scenario: Home prefers sign then pay
- **WHEN** both an unsigned contract and an unpaid deposit exist
- **THEN** Home’s primary action is Sign, then Pay after signature
