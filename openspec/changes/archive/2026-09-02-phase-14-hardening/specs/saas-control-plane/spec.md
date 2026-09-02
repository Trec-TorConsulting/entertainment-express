## ADDED Requirements

### Requirement: Fleet Shows Backup And Probe
The control-plane `/ops` page SHALL show last backup time and ready status for the operator. Tenant Domain rows MAY be listed from the control-plane database only.

#### Scenario: Operator sees backup stamp
- **WHEN** a SaaS Operator opens `/ops`
- **THEN** last backup and probe ok/fail are visible without opening a tenant database
