## Why

While Entertainment Express recently introduced job-level costing to roll up direct costs (labor, subcontractor invoices, consumable stock issues, gateway fees) after an event is booked, operators still suffer from two severe financial blindspots:
1. **Quoting In the Dark (Pre-Event Risk)**: During the sales and proposal phase, sales reps or owners discount packages without knowing the true direct cost floor (drive-time fuel, gig wages, sub-rentals, card fees), inadvertently committing the company to zero-margin or negative-margin jobs.
2. **Margin Drift & Rogue Expenses (Post-Event Risk)**: During and after the event, unscheduled crew overtime, replacement equipment dispatches, or unexpected vendor bills erode margins without immediate alerts, and unclosed ledgers allow rogue late expenses to contaminate historical event accounting indefinitely.

Implementing **Predictive Margin Guardrails** transforms the costing system from a reactive historical record into a proactive financial firewall—providing real-time margin simulations during quoting, instant alerts when active costs drift beyond thresholds, and automated ERPNext ledger locks post-event.

## What Changes

- **Pre-Quote Margin Simulator**: Interactive real-time cost and margin simulator in `/owner/pipeline` and the proposal builder that forecasts direct COGS (crew wages from rate cards, vehicle mileage/fuel, sub-rental quotes, gateway fees, asset wear) before sending proposals to clients.
- **Dynamic Floor & Discount Guardrails**: Configurable minimum margin floors (e.g. 35%) with visual warning gauges; proposals falling below the floor require explicit owner override or price recalculation.
- **Real-Time Margin Drift Engine**: Automated background detector that compares estimated vs. actual expenses as timesheets, subcontract invoices, and stock issues arrive, flagging jobs where actual margin degrades by > 5% against quote targets.
- **Automated Anomaly & Leakage Notifications**: Immediate multi-channel alerts (Owner Portal notification, email, Twilio SMS) when crew overtime or unauthorized gear additions trigger margin warnings.
- **Automated Ledger Settlement & Cost Center Locking**: Automated workflow upon booking status transition to `completed` that reconciles variances, generates closing ERPNext `Journal Entry` records, and locks the booking's `Cost Center` to prevent retroactive expense pollution.

## Capabilities

### New Capabilities
- `predictive-margin-guardrails`: Pre-quote direct cost simulation, margin floor validation, real-time margin drift monitoring, and post-event ERPNext cost center locking and journal entry settlement.

### Modified Capabilities
- `job-costing-margin-intelligence`: Extend `Event Cost Sheet` with projected vs. actual variance fields, drift percentage, and ledger lock state.
- `owner-portal`: Add live Margin Simulator gauge in Proposal Builder and Margin Drift inspector drawer in `/owner/money`.

## Impact

- **Backend Architecture**:
  - `entertainment_express/job_costing/margin_simulator.py`: Calculation engine estimating COGS from proposal items, staff requirements, venue distance, and payment terms.
  - `entertainment_express/job_costing/drift_monitor.py`: Background job and event hooks checking margin deviation on `Timesheet`, `Purchase Invoice`, and `Stock Entry` submissions.
  - `entertainment_express/job_costing/settlement.py`: ERPNext `Journal Entry` generator and `Cost Center` freezing upon booking completion.
- **DocTypes**:
  - Extend `Event Cost Sheet` with `projected_cogs`, `projected_margin_percent`, `margin_drift_percent`, `is_ledger_locked`, `locked_at`, and `settlement_journal_entry`.
  - Extend `EE Portal Settings` with `minimum_margin_floor_percent`, `margin_drift_warning_threshold`, and `auto_lock_cost_center_days`.
- **Portals**:
  - `/owner` Proposal editor adds dynamic profitability meter and floor override prompt.
  - `/owner/money` adds "Margin Drift & Anomaly" tab with filtered variance tracking.
