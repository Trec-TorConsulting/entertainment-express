## Context

Phase 25 shipped `portal_reports.owner_pack` / `employee_pack` / `client_money_summary` with CSV/PDF. Several owner metrics are hardcoded zeros. Dispatch already has `get_dispatch_analytics`. Control plane already stores `Subscription.mrr` and `Usage Record`.

## Goals / Non-Goals

**Goals:** period company snapshot from invoices + bookings; utilization; funnel strings; schedule email; operator `/ops`.

**Non-Goals:** report builder, GL inquiry, Excel pivot, Metabase, querying tenant MariaDB from the control plane, `/admin`.

## Decisions

1. **ERPNext “ledgers” = Sales Invoice.** Portals must not browse accounts. Tax = `total_taxes_and_charges`. Deposits held = submitted deposit invoices (`ee_is_deposit`) with outstanding 0. Payouts due = `Pay Run.total_amount` in `pending_payout` / `submitted` / `finalized`.
2. **Period** `from_date`/`to_date` default to the current month. SPA sends dates; never computes money.
3. **Saved reports** = `EE Report Schedule` (pack `owner|employee`, cadence `weekly|monthly`, recipients, weekday 0=Mon). Not a query builder.
4. **Email** `report_digest` with HTML lines of the pack. No PDF attach required (link to `/owner/reports`).
5. **Fleet** never calls `frappe.connect` / `frappe.init` for another site. Missing control-plane tables return zeros.
6. **Image** `0.0.66-ee` → `0.0.67-ee`.

## Schema

**EE Report Schedule:** `title`, `pack` (`owner`/`employee`), `cadence` (`weekly`/`monthly`), `weekday` (Int 0–6), `recipients` (Small Text), `active`, `last_sent` (Date).

## API

`portal_reports.owner_pack(from_date, to_date)`, schedules CRUD, `run_schedules()`.
`control_analytics.fleet()` / `fleet_csv()`.

## UI

Owner `/owner/reports`: date range, KPI cards, by-offering list, utilization, funnel, “Email me this each week”.
Employee reports: richer role cards (still no company P&amp;L for crew).
`/ops`: operator HTML snapshot + spreadsheet download.
