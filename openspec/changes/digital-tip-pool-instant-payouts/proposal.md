## Why

Compensation friction and cash tip disputes are a leading cause of crew churn in mobile entertainment, bands, and party rental operations. Today, party guests rarely carry cash, so tips are captured haphazardly via personal Venmo accounts or lost entirely. Band leaders and crew leads struggle to divide pooled cash, sparking bitter accusations of favoritism or pocketing funds to offset overhead. Furthermore, workers who endure grueling 2 AM teardowns hate waiting two weeks for a standard payroll cycle. Operators need an automated digital tip jar, algorithmic tip distribution, and instant debit card payouts via Stripe Connect.

## What Changes

- Introduce a **Digital Tip Jar & Pool Engine**: event guests scan an on-site QR code (`/tip/:event_token`) to tip the performer or crew using Apple Pay, Google Pay, or Credit Card without downloading apps.
- Implement **Algorithmic Tip Splitting Rules** configurable per tenant:
  1. *Equal Split*: Divided evenly across all clocked-in on-site staff.
  2. *Hours-Weighted Split*: Proportional to verified timesheet hours worked.
  3. *Role-Weighted Split*: Custom percentage tiers (e.g. Lead 50%, Second Op 25%, Roadie 25%).
- Enable **Stripe Connect Instant Crew Payouts**: 30 minutes after post-gig teardown completion and damage-free verification, workers receive an automated instant payout directly to their connected debit cards.
- Provide a **Worker Earnings Ledger** in the Employee Portal (`/employee/earnings`) with complete transparency on base gig rate, surge pay, tip split allocation, and year-to-date 1099/W2 earnings.

## Capabilities

### New Capabilities
- `digital-tip-pool-instant-payouts`: Mobile digital guest tip jar, algorithmic multi-tier tip pool splitting, and Stripe Connect instant debit card payouts upon teardown verification.

### Modified Capabilities
- `gig-payroll-commission-tips`: Enhanced with real-time digital tip splitting and instant payout triggers.
- `employee-portal`: Adds earnings dashboard and Stripe Connect onboarding flow.

## Impact

- **DocTypes**:
  - `EE Tip Pool`: Linked to `Booking`, tracks total collected tips, split method (`Equal`, `Hours`, `Role`), split execution timestamp, and status.
  - `EE Worker Payout`: Individual payout transaction, base wage, tip share, payout method (`Stripe Instant`, `Payroll Batch`), transfer ID, status.
- **Server APIs**:
  - `entertainment_express.gig_payroll.api.submit_guest_tip(token, amount, guest_name)`
  - `entertainment_express.gig_payroll.api.split_event_tip_pool(booking_id)`
  - `entertainment_express.gig_payroll.api.execute_instant_payout(payout_id)`
  - `entertainment_express.gig_payroll.api.get_worker_earnings_history(worker_id)`
- **Portal UI**:
  - Public Guest Route: `/tip/:token` (Mobile clean tip pad with 1-tap Apple Pay).
  - Employee Route: `/employee/earnings` (Earnings breakdown, instant payout balance, debit card settings).
  - Owner Route: `/owner/money/tips` (Tip pool reconciliation and payout approvals).
