## ADDED Requirements

### Requirement: Event P&L Drawer and Cost Ledger
The system SHALL display an interactive Event Profit & Loss Drawer on `/owner/money` and `/owner/pipeline`, detailing gross revenue, direct labor, subcontractors, equipment wear, consumable stock, payment processing fees, net profit, and net margin percentage.

#### Scenario: Opening Event P&L drawer
- **WHEN** an owner clicks the margin badge or "Inspect P&L" action on a booking card in `/owner/money`
- **THEN** the system slides open a detailed ledger drawer itemizing all revenue sources and expense categories with direct links to underlying timesheets and purchase invoices

#### Scenario: Real-time margin updates
- **WHEN** new expenses (such as overtime or subcontractor invoices) are posted to a booking
- **THEN** the P&L drawer and pipeline card margin badges update immediately without requiring manual recalculation
