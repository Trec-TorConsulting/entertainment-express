## ADDED Requirements

### Requirement: Portal Proposal Flow
The system SHALL let an `EE Tenant Admin` (and `EE Sales` on records they may access) build a client proposal from `/owner` using the existing catalog, quotation, contract, and deposit-invoice documents — without `/app`.

#### Scenario: Owner sends a proposal
- **WHEN** the owner picks packages for an inquiry or job and sends a proposal
- **THEN** a quotation and contract exist for that client and the client’s `/client` Home next action is Sign or Pay
