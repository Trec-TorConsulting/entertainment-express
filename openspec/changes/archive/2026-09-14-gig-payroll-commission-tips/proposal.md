## Why

Event labor compensation is one of the most frustrating, error-prone operational bottlenecks for mobile entertainment companies. Event staff frequently work on non-traditional compensation models: flat gig fees, hourly rates with travel bonuses, sales rep closing commissions, and customer tips collected via digital checkout. In traditional setups, operators spend hours every Sunday night manually transcribing timesheets, calculating commissions from spreadsheets, and attempting to divide credit card tips across DJs, assistants, and photo booth operators.

ERPNext has a complete, enterprise `Payroll Entry`, `Salary Structure`, `Salary Component`, and `Salary Slip` payroll engine. By integrating this engine with Entertainment Express's event scheduling, timesheets, and digital tipping pipeline, we create an automated **Gig Payroll, Commission & Tip Splitting Engine** that calculates exact earnings, distributes client gratuities transparently, and generates verified payroll drafts with a single click.

## What Changes

- **Gig Rate Cards & Tiered Worker Pay**: Define flexible pay rates on `Employee` / `Worker Profile` records: flat gig fee by event type, hourly base rate with overtime multipliers, and role differentials (e.g. Lead DJ vs Assistant Attendant vs Roadie).
- **Automated Sales & Booking Commission Engine**: Configurable commission rules (percentage of gross booking or percentage of net event profit) automatically calculated and credited to the booking agent upon customer invoice payment.
- **Client Tip Aggregation & Automated Splitting**: Pulls digital gratuities collected via Stripe/Square hosted checkout or post-event client tipping links and splits them across assigned on-site crew based on configurable policies (Equal Split, Hours-Worked Ratio, or Lead-Weighted).
- **Single-Click Post-Gig Payroll Settlement**: An owner dashboard that gathers all approved gig timesheets, commissions, and tip allocations for any pay period, compiling them into ERPNext `Payroll Entry` and itemized `Salary Slip` records.
- **Worker Transparent Pay Stubs & Earnings Hub**: Surfaces clear, itemized earning statements in `/employee/timesheets` and the Field PWA showing base gig pay, hourly breakdown, commission details, and assigned tip shares.

## Capabilities

### New Capabilities
- `gig-payroll-commission-tips`: Gig rate cards, automated sales commission rules, post-event tip pool splitting, and single-click ERPNext payroll batch compilation.

### Modified Capabilities
- `hr-workforce`: Extend worker profiles with gig rate structures and commission assignments.
- `billing-payments`: Route collected customer gratuities to the booking tip pool.
- `owner-portal`: Add Payroll Settlement Cockpit to `/owner/money`.
- `employee-portal`: Add worker earnings statements and tip breakdown views.

## Impact

- **Backend Architecture**:
  - `entertainment_express/doctype/gig_rate_card/` (new DocType): Defines pay rules by role, event type, and duration.
  - `entertainment_express/doctype/commission_rule/` (new DocType): Calculates sales rep commissions on invoice payment.
  - `entertainment_express/doctype/tip_distribution/` (new DocType): Tracks tip pool calculation and allocation per booking.
  - Integration with ERPNext `Salary Structure`, `Salary Component`, and `Salary Slip`.
- **Portal UI Surfaces**:
  - `/owner/money`: New "Payroll & Settlement" tab with one-click batch review.
  - `/employee/timesheets`: Itemized earnings breakdown per event.
- **Compliance & Multi-Tenancy**:
  - W2 and 1099 classification separation; all salary and payout records strictly isolated per tenant site database.
