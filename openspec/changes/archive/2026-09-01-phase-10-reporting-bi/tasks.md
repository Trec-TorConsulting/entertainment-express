# Tasks: Phase 10 — Reporting & BI

> Canned packs exist. Fill real KPIs, schedules, and operator fleet. No builder.

## 1. Schema

- [x] 1.1 DocType `EE Report Schedule`.
      **Accept:** pack owner/employee; cadence weekly/monthly; recipients text.

## 2. API

- [x] 2.1 `owner_pack` period snapshot: invoices, tax, deposits, payouts, funnel, utilization, by offering; `fmt_money`.
      **Accept:** guests 403; crew cannot call owner pack; no `tenant`/`site` args.
- [x] 2.2 Schedules CRUD + daily `run_schedules`; `control_analytics.fleet` from control-plane DocTypes only.
      **Accept:** missing mail/FCM does not raise; fleet source has no `frappe.connect`.

## 3. Portal

- [x] 3.1 `/owner/reports` period + KPIs + schedule; Today uses snapshot billed/pipeline.
      **Accept:** no `/app`; no DocType names; EmptyState only when pack fails.
- [x] 3.2 `/ops` operator snapshot; employee pack uses Employee for field hours.
      **Accept:** guest 403.

## 4. Ship

- [x] 4.1 `tests/test_phase10_reporting.py`; patch; bump `0.0.66-ee` → `0.0.67-ee`.
      **Accept:** py_compile; migrate after image roll.
