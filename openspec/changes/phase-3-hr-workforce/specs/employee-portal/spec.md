## ADDED Requirements

### Requirement: Staff Hours And Pay
`EE Crew` / `EE Entertainer` SHALL set their own weekly hours and time-off on `/employee/me`. `EE Accounting` SHALL approve timesheets and process pay runs on `/employee/accounting`. Crew SHALL NOT open company pay-run totals APIs.

#### Scenario: Crew cannot run payroll
- **WHEN** an `EE Crew` user requests create or process pay run
- **THEN** access is denied
