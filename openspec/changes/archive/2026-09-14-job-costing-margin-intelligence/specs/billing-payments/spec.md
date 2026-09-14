## ADDED Requirements

### Requirement: Payment Processor Fee Allocation
The system SHALL capture payment gateway processing fees from Stripe, Square, and PayPal webhook execution payloads, deduct them from gross receipts, and post a fee journal line against the booking's `Cost Center`.

#### Scenario: Stripe webhook fee recording
- **WHEN** a Stripe `payment_intent.succeeded` or `charge.captured` webhook is processed with fee details
- **THEN** the system records the exact processing fee amount against the linked booking's `Event Cost Sheet` and posts an ERPNext expense entry to the gateway fees account

#### Scenario: Refund fee handling
- **WHEN** a partial or full refund is issued through the gateway
- **THEN** fee adjustments are reflected accurately in the event cost sheet without leaving orphaned fee balances
