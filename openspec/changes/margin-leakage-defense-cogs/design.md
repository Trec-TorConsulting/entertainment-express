## Context

ERPNext includes powerful Cost Center and Project accounting, but standard setups require manual accounting entries that event operators never have time to execute. By automating the creation of Cost Centers and auto-tagging timesheets, purchase invoices, and payment fee entries, Entertainment Express provides Wall Street-grade unit economics with zero manual bookkeeping.

## Goals / Non-Goals

**Goals:**
- Compute expected COGS before quote dispatch:
  - `Labor = sum(shift.hours * worker.hourly_rate_or_default)`
  - `Travel = round_trip_miles * vehicle.cost_per_mile`
  - `Gateway = quote_total * 0.029 + 0.30`
  - `Consumables = sum(item.consumables_cost)`
  - `Wear = sum(item.asset_wear_amortization)`
- If `(quote_total - COGS) / quote_total < target_floor`: block submission or show "Low Margin Warning".
- Auto-create ERPNext `Cost Center` and `Project` on Booking confirmation.
- Post Stripe gateway processing fee expenses directly to the event's Cost Center upon charge confirmation.
- Provide a slide-over Event P&L Drawer showing budget vs. actuals in the Owner Portal.

**Non-Goals:**
- Complex corporate tax bracket calculation (handled by external CPA / tax accountants).
- Depreciation schedules for multi-year corporate tax filings (handled by standard ERPNext Asset Depreciation).

## Architecture & DocType Definitions

### 1. `EE Job Costing Rule` (Single per Tenant)
- **Fields:**
  - `default_mileage_cost_per_mile`: Currency (default 0.67, IRS rate)
  - `target_gross_margin_pct`: Percent (default 50%)
  - `minimum_margin_floor_pct`: Percent (default 35%)
  - `stripe_fee_pct`: Percent (default 2.9%)
  - `stripe_fixed_fee`: Currency (default 0.30)
  - `default_wear_amortization_pct`: Percent (default 1.5% of equipment book value)

### 2. `EE Booking Profitability`
- **Fields:**
  - `booking`: Link to `Booking` (unique index)
  - `cost_center`: Link to `Cost Center`
  - `project`: Link to `Project`
  - `quoted_revenue`: Currency
  - `actual_revenue`: Currency
  - `labor_expense`: Currency
  - `subcontractor_expense`: Currency
  - `mileage_expense`: Currency
  - `consumables_expense`: Currency
  - `wear_amortization`: Currency
  - `gateway_fee_expense`: Currency
  - `total_realized_expense`: Currency
  - `net_profit_amount`: Currency
  - `net_profit_pct`: Percent
  - `margin_drift_amount`: Currency (actual net profit minus quoted profit)
  - `has_margin_drift_alert`: Check (default 0)

## Server APIs & Python Hooks

File: `entertainment_express/job_costing/api.py`

```python
import frappe

@frappe.whitelist()
def simulate_quote_cogs(quotation_id):
    """
    Computes direct labor, transit, supplies, wear, and gateway fees for a quote.
    Returns: {"estimated_cogs": float, "gross_profit": float, "margin_pct": float, "below_floor": bool}
    """
    pass

@frappe.whitelist()
def get_event_pl_drawer_data(booking_id):
    """
    Fetches real-time P&L breakdown combining ERPNext General Ledger entries for the booking's Cost Center.
    """
    pass

def auto_provision_event_cost_center(booking_doc, method):
    """Hook on Booking submit: creates ERPNext Cost Center and Project."""
    pass

def record_stripe_fee_to_cost_center(payment_doc, method):
    """Hook on Payment Entry submit: creates Journal Entry for gateway processing fees."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/owner/money/EventPlDrawer.tsx`
- **Subcomponents:**
  - `MarginGauge`: Circular progress meter displaying net margin % (Green: >50%, Amber: 35-50%, Red: <35%).
  - `RevenueVsExpenseWaterfall`: Visual breakdown showing Gross Revenue minus Labor, Subcontractors, Fuel, Consumables, and Fees.
  - `MarginDriftBanner`: Alert banner highlighting unexpected overtime or extra dispatched equipment.

## Multi-Tenant Isolation & Security

- Cost Centers and General Ledger records are strictly isolated within the tenant's Frappe site database.
- Profitability metrics are restricted to `EE Tenant Admin` and hidden from general staff.

## Risks & Mitigations

- **Risk:** Staff forget to log timesheets, creating artificially inflated margin numbers.
- **Mitigation:** Event checkout gate in field app mandates clock-out confirmation before closing the gig.
