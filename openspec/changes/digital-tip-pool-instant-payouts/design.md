## Context

Crew retention is the lifeblood of high-volume entertainment operations. Elite DJs, audio engineers, and delivery drivers work where they get paid the fastest and treated with the most transparency. Offering instant payouts right as they finish loading the van on a Saturday night gives operators an unbeatable recruiting and retention moat.

## Goals / Non-Goals

**Goals:**
- Provide zero-friction public tipping via Stripe Payment Intents supporting Apple Pay and Google Pay.
- Split tips automatically across on-site crew when the lead marks "Teardown Verified".
- Transfer funds to worker debit cards via Stripe Connect Custom / Express Transfers with instant payout capability.
- Display exact tip math in the Employee Portal so every worker sees why they received their exact amount.

**Non-Goals:**
- Handling physical cash reconciliation in-person (cash tips can be manually logged by the lead worker if desired).
- Providing banking services or issuing physical branded debit cards.

## Architecture & DocType Definitions

### 1. `EE Tip Pool`
- **Fields:**
  - `booking`: Link to `Booking` (unique)
  - `total_collected_amount`: Currency (default 0.0)
  - `tip_count`: Int (default 0)
  - `split_rule`: Select (`Equal Split`, `Hours Weighted`, `Role Weighted`)
  - `is_settled`: Check (default 0)
  - `settled_datetime`: Datetime
  - `splits`: Table (`EE Tip Split Line`)

### 2. `EE Tip Split Line` (Child Table)
- **Fields:**
  - `worker`: Link to `Worker`
  - `role_name`: Data
  - `hours_clocked`: Float
  - `split_percentage`: Percent
  - `allocated_tip_amount`: Currency
  - `payout_status`: Select (`Pending`, `Paid`, `Failed`)
  - `stripe_transfer_id`: Data

### 3. `EE Worker Payout Account`
- **Fields:**
  - `worker`: Link to `Worker` (unique)
  - `stripe_account_id`: Data (e.g. `acct_1M...`)
  - `instant_payout_eligible`: Check (default 0)
  - `payout_preference`: Select (`Instant Debit Card`, `Weekly Direct Deposit`)
  - `onboarding_status`: Select (`Pending`, `Active`, `Restricted`)

## Server APIs & Python Hooks

File: `entertainment_express/gig_payroll/api.py`

```python
import frappe
import stripe

@frappe.whitelist(allow_guest=True)
def create_guest_tip_intent(event_token, amount):
    """Generates Stripe client_secret for mobile Apple Pay guest tip."""
    pass

@frappe.whitelist()
def settle_event_tip_pool(booking_id):
    """
    Computes split math for all on-site crew based on booking tip rule,
    records split lines, and triggers payout if configured for instant payout.
    """
    pass

@frappe.whitelist()
def trigger_stripe_instant_payout(payout_line_id):
    """Executes Stripe Transfer + Payout to worker debit card."""
    pass

@frappe.whitelist()
def get_worker_earnings_dashboard(worker_id):
    """Returns summarized earnings, pending tips, and historical gig payouts."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/public/DigitalTipJar.tsx` (`/tip/:token`)
  - Mobile UI with quick preset chips ($5, $10, $20, $50, Custom) and native Apple Pay / Google Pay button.
- **Path:** `apps/portal-kit/src/pages/employee/earnings/EarningsView.tsx`
  - Big balance card ("Available for Instant Cashout: $285.00"), 1-tap "Cash Out Now" button, and gig history table with tip lines.
- **Path:** `apps/portal-kit/src/pages/owner/money/TipManagement.tsx`
  - Owner review table of all event tip pools, split distributions, and Stripe transfer logs.

## Multi-Tenant Isolation & Security

- Tip payments route directly into the tenant's connected Stripe account.
- Stripe account IDs and worker bank data are tokenized via Stripe Connect; no raw bank account or debit card numbers are ever stored in MariaDB.

## Risks & Mitigations

- **Risk:** Client disputes a tip charge after it was already paid out to workers.
- **Mitigation:** Operator terms of service specify that digital tips are non-refundable gratuities, and a reserve threshold (e.g. 5%) is maintained for disputed transactions.
