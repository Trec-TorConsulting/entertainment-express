## 1. Costing DocTypes & Settings

- [x] 1.1 Create `EE Job Costing Rule` Single DocType storing default mileage, wear %, and margin floor thresholds.
- [x] 1.2 Create `EE Booking Profitability` DocType tracking cached unit economics and margin drift.
- [x] 1.3 Add hook on Booking confirmation to auto-create ERPNext `Cost Center` and `Project`.

## 2. Server APIs & Accounting Automations

- [x] 2.1 Implement `simulate_quote_cogs` calculating estimated labor, mileage, consumables, wear, and gateway fees.
- [x] 2.2 Implement auto-tagging of Timesheet wages and Purchase Invoices to the booking's Cost Center.
- [x] 2.3 Implement payment hook creating Stripe fee expense Journal Entries tagged to the event Cost Center.
- [x] 2.4 Implement `get_event_pl_drawer_data` compiling live General Ledger entries into a structured P&L.

## 3. Owner Portal UI & Margin Guardrails

- [x] 3.1 Build `EventPlDrawer.tsx` on `/owner/money` displaying visual revenue vs. expense waterfall breakdown.
- [x] 3.2 Add Margin Floor warning modal in Quote Builder when calculated margin drops below minimum floor.
- [x] 3.3 Add margin drift alert indicators to completed events.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_margin_defense.py` verifying COGS calculation accuracy, Cost Center creation, and GL entry rollups.
