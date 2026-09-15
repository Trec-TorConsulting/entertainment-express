## ADDED Requirements

### Requirement: Stripe Terminal Hardware Discovery and Pairing
The system SHALL support discovery and pairing of Stripe Terminal physical card readers (Bluetooth Mobile Readers like Stripe Reader M2 and Cloud/WiFi Smart Readers like WisePOS E) directly from the Field App PWA (`/employee`).

#### Scenario: Bluetooth reader pairing
- **WHEN** a crew member clicks "Connect Reader" on mobile and selects Bluetooth
- **THEN** the Web Bluetooth API discovers nearby Stripe Reader M2 devices, connects using a secure connection token generated from the tenant's Stripe account, and displays a connected status badge with battery level

#### Scenario: Cloud reader pairing
- **WHEN** a crew member selects a registered Cloud/WiFi reader (WisePOS E)
- **THEN** the Terminal Web SDK connects to the reader over local network/cloud and sets it as the active checkout terminal

### Requirement: On-Site Balance and Overtime In-Person Collection
The system SHALL enable field crew to collect remaining event balances, day-of overtime, and additional service add-ons at event teardown via physical card tap, insert, or digital wallet.

#### Scenario: Collect outstanding balance with overtime
- **WHEN** a crew member initiates POS checkout for an event with $600 unpaid balance and adds 1 hour of overtime ($150)
- **THEN** the system generates a Stripe PaymentIntent for $750 with event metadata, sends the total to the connected reader, and prompts the client to tap or insert their card

#### Scenario: Successful card processing
- **WHEN** the customer taps their card/phone on the reader and payment succeeds
- **THEN** the Terminal captures the transaction, an ERPNext `Payment Entry` is created against the booking's `Sales Invoice`, the invoice balance drops to zero, and the booking status updates to Paid in Full

### Requirement: Digital Tip Prompts and Pool Allocation
The system SHALL present the customer with standard tip prompts during the in-person checkout flow and route collected tips into the event's digital tip pool.

#### Scenario: Customer selects percentage tip
- **WHEN** the reader presents the tip screen and the customer selects 20% on a $500 balance
- **THEN** $100 is added to the authorized charge, the full $600 is captured, the $100 tip is allocated to the event's `Digital Tip Pool`, and standard credit card processing fees are absorbed by the company account

#### Scenario: Customer chooses custom tip or skips
- **WHEN** the customer chooses "Custom Amount" or "No Tip"
- **THEN** the transaction accurately captures the selected amount without forcing a tip, and marks the tip pool state accordingly

### Requirement: Instant Digital Receipts and SMS Confirmation
The system SHALL offer the customer an instant digital receipt via SMS or email immediately following an approved in-person transaction.

#### Scenario: SMS receipt dispatch
- **WHEN** in-person payment is approved and the customer inputs their phone number
- **THEN** an SMS receipt is dispatched via Twilio containing the itemized balance, overtime, tip, payment last-4, and tenant branding
