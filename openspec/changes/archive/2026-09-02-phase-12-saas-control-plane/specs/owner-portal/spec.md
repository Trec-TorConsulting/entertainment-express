## ADDED Requirements

### Requirement: Owner Plan Workspace
The owner portal SHALL show this company's Entertainment Express plan status, formatted price, and period end from site_config only, with Pay (Stripe Checkout) and cancel-at-period-end actions. Guests and crew SHALL receive 403. The SPA SHALL NOT compute money.

#### Scenario: Owner reads plan
- **WHEN** an `EE Tenant Admin` opens `/owner/plan`
- **THEN** they see plan name, status, backend-formatted price, and period end from this site's flags — never another site's data

#### Scenario: Owner cancels
- **WHEN** the owner requests cancel
- **THEN** access continues until period end (flagged on this site); the control plane later suspends
