## ADDED Requirements

### Requirement: Same Product As Owner, Role Sliced
The system SHALL give staff the same booking/quote/invoice/dispatch objects as `/owner`, filtered server-side by role, in ops density. Crew and entertainers SHALL get a phone-first My Day (assignments, run sheet, check-in/out). Dispatch SHALL reuse the existing dispatch board rather than a second scheduler.

#### Scenario: Sales vs crew
- **WHEN** `EE Sales` and `EE Crew` each open `/employee`
- **THEN** Sales sees pipeline work they may access and Crew sees only their assignments — neither sees owner Brand/Automations or other customers' jobs outside permission

### Requirement: Staff Report Pack
The system SHALL offer canned reports on `/employee/reports` limited to the user's role: Sales (my pipeline/conversion/follow-ups), Dispatch (board load, at-risk, unassigned), Field (my hours and upcoming calls), Accounting (aging and deposits to apply). Field reports SHALL NOT include company profit and loss. Amounts SHALL be backend-formatted.

#### Scenario: Crew cannot open company profit reports
- **WHEN** an `EE Crew` user requests an owner company revenue report API
- **THEN** access is denied
