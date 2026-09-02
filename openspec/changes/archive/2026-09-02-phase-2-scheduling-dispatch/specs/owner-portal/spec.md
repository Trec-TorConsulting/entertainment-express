## ADDED Requirements

### Requirement: Dispatch Without Desk
The owner and employee portals SHALL staff jobs, offer shifts, issue run sheets, and view the day's drive order on `/owner/dispatch` and `/employee/dispatch` without Desk. Auto-suggest SHALL rank people who are free that day, with a matching role first. Drive order SHALL follow call times; drive minutes MAY be omitted when maps are not connected.

#### Scenario: Owner staffs an at-risk job
- **WHEN** an `EE Tenant Admin` opens Dispatch for a confirmed job with no confirmed crew
- **THEN** the board lists suggested people and the owner can offer a shift and issue a run sheet without using `/app`

#### Scenario: Drive order without maps
- **WHEN** a dispatcher opens a day with two or more jobs and no maps key is configured
- **THEN** jobs appear in call-time order and drive minutes are blank rather than blocking the board
