# Capability: Reporting & BI

## Purpose
Give tenants (and the SaaS operator, on the control plane) actionable insight: operational dashboards, KPIs,
financial reports, utilization, and exports. Built on Frappe/ERPNext report + dashboard tooling with
EE-specific metrics.

## Requirements

### Requirement: Operational Dashboards
The system SHALL provide role-based dashboards summarizing the business at a glance (bookings, revenue,
pipeline, utilization, crew).

#### Scenario: Owner dashboard
- **WHEN** a tenant owner opens their dashboard
- **THEN** they see period revenue, upcoming events, pipeline value, deposit balances due, and asset/crew
  utilization, scoped to their tenant

### Requirement: Financial Reporting
The system SHALL produce financial reports (revenue, receivables, deposits, tax, payouts) from ERPNext
ledgers.

#### Scenario: Revenue report
- **WHEN** a user runs a revenue report for a period
- **THEN** recognized revenue, outstanding balances, and taxes are reported accurately from the GL

### Requirement: Utilization & Operations KPIs
The system SHALL report asset and crew utilization, on-time performance, and booking conversion.

#### Scenario: Asset utilization
- **WHEN** a manager views utilization
- **THEN** each asset/crew's booked-vs-available and revenue contribution is shown for the period

#### Scenario: Funnel conversion
- **WHEN** viewing sales performance
- **THEN** lead→quote→booking conversion rates and average deal value are reported

### Requirement: Custom Reports & Exports
The system SHALL allow saved custom reports and exports (CSV/Excel/PDF) with permission scoping.

#### Scenario: Export a report
- **WHEN** a permitted user exports a report
- **THEN** the export contains only data they may access and is generated in the requested format

### Requirement: Scheduled Report Delivery
The system SHALL email scheduled reports to stakeholders on a cadence.

#### Scenario: Weekly summary email
- **WHEN** a weekly summary schedule is configured
- **THEN** the report is generated and emailed to recipients each week via `notifications`

### Requirement: Control-Plane Analytics (SaaS Operator)
The system SHALL provide the SaaS operator fleet-level analytics (MRR, churn, active tenants, usage) on the
control plane, aggregated without breaching tenant isolation.

#### Scenario: SaaS metrics
- **WHEN** the operator views control-plane analytics
- **THEN** MRR, churn, signups, and per-tenant usage are shown from control-plane data only
