## ADDED Requirements

### Requirement: Sub-Rental Vendor Accounting Integration
The system SHALL link sub-rental `Purchase Order` and `Purchase Invoice` records to the relevant booking project, ensuring vendor payable liabilities flow directly into the event cost sheet.

#### Scenario: Vendor billing linked to event
- **WHEN** a vendor submits an invoice for dry ice or an LED wall sub-rental
- **THEN** the invoice is matched against the booking's `Purchase Order` and updates the event's actual sub-rental expenses
