## Why

`/owner/reports` and `/employee/reports` already export a canned pack, but billed/deposits/payouts/pipeline/utilization are stubs, Today does not show period revenue, nobody can email a weekly snapshot, and the SaaS operator has no fleet MRR/churn view on control-plane data.

## What Changes

- Fill the **company pack** for a date range from ERPNext invoices and this site’s jobs: billed, outstanding, tax, deposits held, payouts due, pipeline conversion, average deal, crew/gear utilization, revenue by offering. Amounts are `flt` + `fmt_money` strings. No GL browser. No report builder.
- Wire **Today** billed and pipeline from the same snapshot.
- **EE Report Schedule** — named weekly/monthly email of the canned pack via `notifications.send`. Missing mail does not crash.
- **Control-plane fleet** at `/ops` for `SaaS Operator` / `System Manager`: MRR, active tenants, signups, churn this month, usage totals. Reads only Tenant / Subscription / Usage Record / Signup Application on the current site. Never opens another tenant database.
- **Override:** no Metabase/Looker, no Chart of Accounts in portals, no `/admin`, no custom SQL builder.
- Guests 403. No `tenant`/`site` API args. No DocType names in portal copy. No `/app` in owner/employee product flows (`/ops` is operator-only).

## Capabilities

### New Capabilities

- (none) — `reporting-bi` already exists.

### Modified Capabilities

- `reporting-bi`: real canned KPIs, period filter, scheduled email, control-plane `/ops`.
- `owner-portal` / `employee-portal`: Reports and Today show backend-formatted metrics.
- `notifications`: `report_digest` template.
- `identity-access`: guests cannot read reports or schedules; crew still cannot call the owner pack.
- `saas-control-plane`: fleet snapshot from control-plane DocTypes only.

## Impact

- Backend: `api/portal_reports.py`, `api/control_analytics.py`; DocType `EE Report Schedule`; `www/ops`.
- Frontend: owner/employee Reports; rebuild `public/{owner,employee}/`.
- Tests: `tests/test_phase10_reporting.py`.
- Cluster: bump `0.0.66-ee` → `0.0.67-ee`.
- Depends on: phase-25 canned packs, phase-1 invoices/jobs, phase-2 dispatch analytics, control-plane Tenant/Subscription.
