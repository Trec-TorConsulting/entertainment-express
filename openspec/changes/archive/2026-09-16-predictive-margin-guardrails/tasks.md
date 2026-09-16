# Tasks: Predictive Margin Guardrails

- [x] 1. Schema & Settings Expansion
  - [x] 1.1 Add predictive and ledger lock fields to `Event Cost Sheet` DocType schema in `entertainment_express/doctype/event_cost_sheet/event_cost_sheet.json`
  - [x] 1.2 Add `minimum_margin_floor_percent`, `margin_drift_warning_threshold`, and `auto_lock_cost_center_days` to `EE Portal Settings` DocType
  - [x] 1.3 Update smoke test schema validators for new DocType fields

- [x] 2. Margin Simulation Engine
  - [x] 2.1 Implement `entertainment_express/job_costing/margin_simulator.py` with direct cost projection math
  - [x] 2.2 Wire vehicle mileage transit cost estimation using venue distance and tenant fleet mileage rates
  - [x] 2.3 Expose whitelisted API `simulate_quote_margin` and add unit tests in `entertainment_express/tests/test_margin_simulator.py`

- [x] 3. Margin Drift Detection & Alerting
  - [x] 3.1 Implement `entertainment_express/job_costing/drift_monitor.py` comparing actual rolled-up costs against projected baseline
  - [x] 3.2 Add doc event hooks on `Timesheet`, `Purchase Invoice`, and `Stock Entry` to trigger drift evaluation
  - [x] 3.3 Connect drift breaches to `notifications.py` to fire email/SMS alerts to tenant owners

- [x] 4. Post-Event Ledger Settlement & Cost Center Lock
  - [x] 4.1 Implement `entertainment_express/job_costing/settlement.py` to reconcile variances and generate closing ERPNext `Journal Entry`
  - [x] 4.2 Enforce write-protection on locked Cost Centers in doc_events validating against `is_ledger_locked`
  - [x] 4.3 Add scheduled daily job in `hooks.py` to auto-settle completed bookings older than `auto_lock_cost_center_days`

- [x] 5. Owner Portal UI Integration
  - [x] 5.1 Implement `MarginSimulationMeter.tsx` in `frontend/owner-portal/src/app/components/`
  - [x] 5.2 Integrate margin simulator into Proposal Builder drawer in `/owner/pipeline`
  - [x] 5.3 Add Margin Drift inspector and 1-click Settlement CTA to `/owner/money` Event P&L drawer
  - [x] 5.4 Verify frontend portal build with `npm run build`
