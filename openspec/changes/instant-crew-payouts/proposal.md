## Why

The entertainment operations industry is plagued by high gig worker turnover and talent shortages. DJs, photobooth attendants, lighting technicians, and delivery drivers work demanding weekend night shifts, yet typically wait 1–2 weeks for bi-weekly payroll runs to receive their gig fees and earned tips. Furthermore, operators lack an objective, data-driven mechanism to reward punctual, careful crew members over chronic latecomers who mishandle expensive gear.

**Crew Instant Payouts & Micro-Incentives** solves this by embedding financial services directly into the crew lifecycle:
1. **Same-Day Instant Worker Payouts**: When an event lead completes teardown and submits a verified damage-free equipment checklist in `/employee`, gig workers can trigger an instant payout of their earned gig fees and tip share directly to their debit card via Stripe Connect Instant Payouts.
2. **Algorithmic Reliability Scoring**: The system automatically compiles a worker "Reliability & Skill Rating" computed from clock-in punctuality, verified checklist completions, client survey feedback, and zero-damage equipment logs—automatically prioritizing top-tier workers for future high-paying bookings.

## What Changes

- **Instant Debit Card Payouts via Stripe Connect**: Integration with Stripe Connect Instant Payouts allowing 1099 contractor crew and W2 workers to receive funds in their bank accounts or debit cards within 30 minutes of event sign-off.
- **Teardown Sign-Off Payout Gate**: Payouts are gated upon completion of the digital post-event checkout: equipment scan check-in, venue damage waiver, and lead supervisor sign-off.
- **Automated Digital Tip Allocation & Immediate Split**: Aggregates tips collected via client credit card payments and splits them automatically (equal, hours-weighted, or lead-weighted) into crew payout allocations.
- **Algorithmic Reliability Engine**: Continuously scores crew members on a 0–100 scale across 4 vectors: Punctuality (on-time geofence arrivals), Checklist Fidelity (thoroughness and timeliness), Asset Care (zero damage reports), and Client CSAT.
- **Priority Dispatch Weighting**: Connects the reliability score directly to the dispatch suggest engine, recommending 90+ rated crew for premier VIP events.
- **Worker Earnings Wallet in `/employee`**: Itemized wallet dashboard showing available balance, pending tips, past instant transfers, and personal reliability badge breakdown.

## Capabilities

### New Capabilities
- `instant-crew-payouts`: Stripe Connect Instant Payout integration, post-teardown instant fund disbursements, and automated worker reliability scoring engine.

### Modified Capabilities
- `gig-payroll-commission-tips`: Add instant payout method, fee deduction accounting, and ledger reconciliation against ERPNext Salary Slip / Payment Entry.
- `scheduling-dispatch`: Incorporate worker Reliability Score as a weighted factor in deterministic crew recommendations.
- `employee-portal`: Add Wallet & Instant Transfer card in `/employee/earnings` and personal Reliability Scorecard.
- `owner-portal`: Add Instant Payouts ledger audit, payout balance controls, and crew reliability leaderboard in `/owner/talent`.

## Impact

- **Backend Architecture**:
  - `entertainment_express/payouts/instant_transfer.py`: Stripe Connect transfer and payout execution.
  - `entertainment_express/payouts/reliability_engine.py`: Scoring algorithm updating worker profiles.
  - `entertainment_express/payouts/gates.py`: Teardown validation check enforcing gear return before release.
- **DocTypes**:
  - Extend `EE Worker Profile` with `reliability_score`, `punctuality_rating`, `asset_care_rating`, `stripe_connect_account_id`, `instant_payout_enabled`.
  - New `EE Instant Payout`: Records transaction ID, worker reference, booking, amount, instant fee, and status (`pending`, `paid`, `failed`).
- **Integrations**:
  - Stripe Connect custom/express accounts with instant payout capability.
