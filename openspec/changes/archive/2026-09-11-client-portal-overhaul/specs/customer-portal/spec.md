## ADDED Requirements

### Requirement: Modern Modular Client Route Architecture
The customer portal SHALL implement dedicated route components for each primary client capability under `frontend/customer-portal/src/app/routes/` (`home`, `events`, `event`, `pay`, `planning`, `documents`, `appointments`, `people`, `chat`, `photos`, `account`), completely deprecating monolithic or legacy inline scaffolds.

#### Scenario: Navigating to documents
- **WHEN** a customer opens `/client/documents`
- **THEN** the modern `DocumentsPage` renders with agreements, waivers, receipts, and e-signature actions using `@portal-kit` primitives

#### Scenario: Navigating to appointments
- **WHEN** a customer opens `/client/appointments`
- **THEN** the modern `AppointmentsPage` renders with scheduled meetings, staff availability slots, and booking modal

### Requirement: In-Portal E-Signature Capture & Audit
The system SHALL provide an accessible in-portal dialog allowing paying customers to review full agreement terms, type or draw their legal signature, confirm acceptance, and persist the executed document with an immutable audit trail (timestamp, IP, signer).

#### Scenario: Customer signs contract in modal
- **WHEN** a customer clicks "Review & Sign" on an open contract and confirms their signature
- **THEN** `entertainment_express.api.portal_client.sign_contract` executes, marking the contract signed and updating portal home next-action

### Requirement: Interactive Multi-Processor Pay Flow
The `/client/pay` route SHALL fetch open invoices from `portal_client.list_invoices`, query configured payment gateways from `portal_billing.list_processors`, allow tip addition and promo code verification, and dispatch checkout via `portal_client.start_checkout`.

#### Scenario: Complete deposit checkout
- **WHEN** a customer selects an invoice, chooses a processor, adds a tip, and initiates checkout
- **THEN** the system requests checkout URL from the backend and routes the user smoothly with return confirmation and celebration
