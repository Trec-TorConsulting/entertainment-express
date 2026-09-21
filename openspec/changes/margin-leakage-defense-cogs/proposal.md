## Why

In the mobile entertainment and event rental industry, operators suffer from chronic "phantom revenue." An owner closes a $3,000 corporate package and assumes it was a huge win. In reality, $1,100 went to crew labor and unexpected overtime, $450 to round-trip fuel and tolls, $300 to sub-rented lighting gear, $120 to photo paper and consumable supplies, $100 to equipment depreciation/maintenance wear, and $90 to Stripe processing fees. The actual net margin was under 10%. Without pre-quote direct COGS simulations and automated job-costing accounting rollups, businesses scale their revenue while secretly bleeding cash.

## What Changes

- Introduce **Pre-Quote Direct COGS & Margin Simulation** in the Quotation builder, calculating estimated crew labor costs, travel/mileage fuel, consumable depletion, payment gateway fees, and equipment depreciation before a quote is sent.
- Implement **Dynamic Margin Floor Guardrails**: warn sales staff or require owner manager approval if an edited quote drops gross margin below a target floor (e.g. 50%).
- Automate **ERPNext Job Costing Accounting**: upon booking confirmation, the system auto-provisions a dedicated `Cost Center` and `Project` named `PRJ-{Booking}`.
- All timesheet wages, subcontractor bills, fuel expenses, and Stripe fee journal entries post directly to the event's Cost Center.
- Deliver an interactive **Event P&L Drawer** on `/owner/money` and the booking details page, displaying real-time Revenue vs. Realized Costs, Net Margin ($ and %), and Margin Drift alerts.

## Capabilities

### New Capabilities
- `margin-leakage-defense-cogs`: Real-time pre-quote direct COGS simulation, automated ERPNext Cost Center provisioning per event, and live event P&L tracking with margin drift defense.

### Modified Capabilities
- `crm`: Quotation extended with simulated COGS and margin percentage indicators.
- `billing-payments`: Automatically rolls up payment gateway processing fees into event cost centers.

## Impact

- **DocTypes**:
  - `EE Job Costing Rule`: Configurable rates for vehicle mileage ($/mile), gateway fee %, equipment wear amortization %, and consumable depletion rates.
  - `EE Booking Profitability`: Cached rollup document linking `booking`, `total_revenue`, `direct_labor_cost`, `subcontractor_cost`, `mileage_cost`, `consumables_cost`, `wear_amortization_cost`, `gateway_fees`, `net_margin_amount`, `margin_pct`.
- **Server APIs**:
  - `entertainment_express.job_costing.api.simulate_quote_cogs(quotation_id)`
  - `entertainment_express.job_costing.api.get_booking_pl_summary(booking_id)`
  - `entertainment_express.job_costing.api.recalculate_realized_margin(booking_id)`
- **Portal UI**:
  - Owner Route: Real-time Event P&L Drawer on `/owner/money` and `/owner/pipeline/:id`.
  - Margin Floor Warning Modal on quote discount edits.
