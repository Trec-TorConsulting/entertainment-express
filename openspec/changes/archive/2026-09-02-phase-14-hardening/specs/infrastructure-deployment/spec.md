## ADDED Requirements

### Requirement: Backup Last-Run Visible To Operator
The system SHALL record the last successful backup timestamp on the sites volume and show it on `/ops` for `SaaS Operator` / `System Manager`. Restore SHALL remain an operator bench procedure, not a tenant whitelist.

#### Scenario: Operator reads last backup
- **WHEN** a SaaS Operator opens `/ops` after a backup job has written the stamp file
- **THEN** they see the last backup time without MinIO credentials

### Requirement: Site Readiness Probe
The system SHALL expose a guest-allowed ready probe that checks this site's database only and returns `{ok: true}` without naming other sites.

#### Scenario: Ready checks this database
- **WHEN** the probe runs
- **THEN** it queries the current site connection and does not call `frappe.init` or `frappe.connect` for another site
