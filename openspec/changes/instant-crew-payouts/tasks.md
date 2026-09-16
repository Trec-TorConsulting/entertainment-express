# Tasks: Crew Instant Payouts & Micro-Incentives

- [ ] 1. DocType & Database Foundation
  - [ ] 1.1 Create `EE Instant Payout` DocType schema in `entertainment_express/doctype/ee_instant_payout/ee_instant_payout.json`
  - [ ] 1.2 Extend `EE Worker Profile` with Stripe Connect fields and reliability score ratings
  - [ ] 1.3 Add instant payout configuration options to `EE Portal Settings`

- [ ] 2. Teardown Sign-Off & Damage Gates
  - [ ] 2.1 Implement `entertainment_express/payouts/gates.py` enforcing checklist completion and incident clearance
  - [ ] 2.2 Wire automatic gate checks to teardown checklist submission in `logistics` and `incident_desk`
  - [ ] 2.3 Add unit tests for payout gating scenarios in `entertainment_express/tests/test_payout_gates.py`

- [ ] 3. Stripe Connect Instant Transfers Engine
  - [ ] 3.1 Implement `entertainment_express/payouts/instant_transfer.py` using Stripe Connect Transfer and Payout APIs
  - [ ] 3.2 Implement fee deduction calculation and ERPNext `Payment Entry` creation
  - [ ] 3.3 Add Stripe webhook handler for `payout.paid` and `payout.failed` reconciliation

- [ ] 4. Algorithmic Reliability Engine
  - [ ] 4.1 Implement `entertainment_express/payouts/reliability_engine.py` evaluating punctuality, checklist, damage, and CSAT
  - [ ] 4.2 Hook reliability recalculation to booking completion doc events
  - [ ] 4.3 Update `scheduling-dispatch` crew suggest engine to weight worker reliability scores

- [ ] 5. Portal UI Integration
  - [ ] 5.1 Implement `InstantPayoutCard.tsx` and Stripe Connect onboarding button in `frontend/employee-portal/src/app/routes/earnings/`
  - [ ] 5.2 Implement `ReliabilityScorecard.tsx` in `/employee` profile view
  - [ ] 5.3 Implement `CrewReliabilityTable.tsx` and instant payout audit ledger in `/owner/talent`
  - [ ] 5.4 Verify frontend portal build with `npm run build`
