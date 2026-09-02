## ADDED Requirements

### Requirement: Unconfigured Processor Never Charges
A processor without credentials SHALL raise a closed-fail error on charge, refund, and hosted checkout. It SHALL NOT record a successful Payment Entry.

#### Scenario: Square not connected
- **WHEN** Square checkout is requested and no Square token is configured
- **THEN** the request is rejected and no Payment Entry is created

### Requirement: Processor Webhook Dedupes
Inbound processor webhooks SHALL verify a signature, ignore duplicates by event id, and reconcile a Payment Entry at most once.

#### Scenario: Duplicate event
- **WHEN** the same processor event is posted twice
- **THEN** the second call reports already processed and does not create another Payment Entry
