## ADDED Requirements

### Requirement: Sales Sends Proposals
The system SHALL let `EE Sales` create and send Proposals from `/employee` using the same proposal APIs as the owner, scoped by sales permissions.

#### Scenario: Salesperson sends a quote
- **WHEN** an `EE Sales` user sends a Proposal for a lead they can read
- **THEN** the Proposal is sent and a salesperson who cannot read that Customer is denied

### Requirement: Field Sees Packing Lines
The system SHALL show warehouse-only package lines on crew packing lists / run sheets even when those lines are hidden from the client Proposal.

#### Scenario: Cables on the truck list
- **WHEN** a package includes a client-hidden cable line
- **THEN** `/employee` field/dispatch packing view lists the cable and the client Proposal does not name it
