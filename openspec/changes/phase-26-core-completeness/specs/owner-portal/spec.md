## ADDED Requirements

### Requirement: Send Proposal Without Desk
The system SHALL let the owner create, preview, and send a Proposal from Pipeline or a job on `/owner`.

#### Scenario: Send from pipeline
- **WHEN** an owner opens an inquiry and sends a Proposal
- **THEN** the customer can open it on `/client` and the owner sees sent/viewed/accepted status without `/app`

### Requirement: Clone Job
The system SHALL let the owner duplicate a job or save it as a reusable template from `/owner` Calendar. Clone SHALL NOT copy payments, signatures, chat, or guests.

#### Scenario: Duplicate last weekend’s setup
- **WHEN** an owner clones a completed job to a new date
- **THEN** packages, hidden warehouse lines, and timeline structure copy; invoices and signatures do not

### Requirement: Conflict Banner On Quotes
The system SHALL show potential and actual resource conflicts when the owner builds or sends a Proposal.

#### Scenario: Two quotes one booth
- **WHEN** two sent proposals need the same unique asset on the same slot
- **THEN** each shows a potential-conflict warning and sending is still allowed

### Requirement: Reminders Are Live
The system SHALL make `/owner/automations` list workflow templates and notification toggles (deposit chase, planning-form reminder, proposal follow-up) backed by existing notification settings — not an empty state.

#### Scenario: Owner turns off deposit chase
- **WHEN** an owner disables deposit chase
- **THEN** the scheduler does not send that reminder for this tenant
