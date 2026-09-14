## Why

Entertainment and mobile event operators frequently book high-dollar events ($3,000–$25,000) with virtually zero real-time visibility into their actual net margin. Between crew wages, subcontractor payouts, vehicle fuel/mileage, consumable depletion (fog fluid, confetti, wristbands), equipment wear-and-tear, and credit card processing fees (2.9% + $0.30), a seemingly lucrative booking often yields negative or razor-thin margins. Traditional vertical tools (Goodshuffle, HoneyBook, Inflatable Office) lack double-entry accounting and job costing, forcing operators to wait for annual tax returns to discover which services lose money.

Because Entertainment Express runs on Frappe and ERPNext, we can harness ERPNext's native `Project`, `Cost Center`, `Journal Entry`, and `Timesheet` architectures to provide real-time, automated **Job-Level Costing & Margin Intelligence** per booking without manual accounting overhead.

## What Changes

- **Automated Event Cost Center & Project Provisioning**: Upon confirming any `Event Booking`, the system automatically provisions an isolated ERPNext `Cost Center` and linked `Project` tagged to that booking.
- **Direct Labor Cost Rollup**: Automatically rolls up verified crew timesheets, hourly rates, and gig fees from `Crew Assignment` into direct labor COGS (Cost of Goods Sold) against the booking's Cost Center.
- **Subcontractor & Vendor Expense Ingestion**: Directly associates `Purchase Order` and `Purchase Invoice` records from third-party partners (e.g. outsourced photo booth, specialty performers) to the booking project.
- **Equipment Wear & Amortization Factor**: Configurable per-asset or per-service wear surcharge automatically accrued into the event cost sheet upon booking execution.
- **Consumable Stock Depletion**: Auto-creates ERPNext `Stock Entry` (Material Issue) for booked consumables, charging their valuation rate directly to event COGS.
- **Gateway Fee Accounting**: Automatically captures Stripe/Square processing fee deductions from webhook payloads and records them into the booking expense ledger.
- **Real-Time Event P&L Surface in `/owner`**: A comprehensive, Stripe-minimal Event P&L drawer and summary on `/owner/money` and `/owner/pipeline` showing Gross Revenue, Total Cost, Net Profit, and Margin %.
- **Margin Alert Thresholds**: Proactive warning badges when estimated or actual margin falls below tenant-configured targets (e.g. < 40% margin).

## Capabilities

### New Capabilities
- `job-costing-margin-intelligence`: Automated provisioning of ERPNext Cost Center and Project per event booking, real-time COGS rollup (crew labor, sub-rentals, consumables, gateway fees, asset wear), and automated net margin calculation.

### Modified Capabilities
- `billing-payments`: Capture gateway transaction fees from payment processor webhooks and account for net deposit settlement into the event cost center.
- `owner-portal`: Add live Event P&L ledger drawers, margin health indicators, and profitability widgets to `/owner/money` and `/owner/pipeline`.
- `reporting-bi`: Add tenant-wide Job Profitability Breakdown report and margin variance analysis.

## Impact

- **Backend Architecture**:
  - `entertainment_express/doctype/event_booking/`: Hook `on_submit` / confirmation to generate or link ERPNext `Cost Center` and `Project`.
  - `entertainment_express/doctype/event_cost_sheet/` (new child/summary DocType): Maintains cached, materialized cost rollups for rapid portal queries.
  - `entertainment_express/api/job_costing.py` (new API module): Whitelisted methods for fetching event P&L, line-item ledger audit, and margin analytics.
- **Integrations**:
  - Payment webhooks (`stripe.py`, `square.py`) enhanced to record fee amounts into `Payment Entry` deduplicated fee ledgers.
- **Portals**:
  - `/owner` portal updated with P&L inspect modal, profit margins in booking tables, and margin filter presets.
- **Isolation & Compliance**:
  - Strictly tenant-isolated; all Cost Centers and Projects are scoped strictly within the tenant's site database.
