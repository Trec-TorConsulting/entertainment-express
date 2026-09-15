# owner-portal-complete-parity Specification

## Purpose
TBD - created by archiving change owner-portal-complete-parity. Update Purpose after archive.
## Requirements
### Requirement: Company Studio Enterprise Settings
The system SHALL provide a dedicated Company Studio in `/owner/settings` enabling business owners to configure core financial, operational, and organizational parameters without logging into `/app`.

#### Scenario: Owner updates tax rules
- **WHEN** an owner accesses `/owner/settings/taxes` and adds a 7.5% state sales tax rule
- **THEN** an ERPNext `Item Tax Template` and `Sales Taxes and Charges Template` are created/updated and immediately apply to new quotations and bookings

#### Scenario: Owner updates payment gateway credentials
- **WHEN** an owner configures live Stripe API keys and Terminal reader locations in `/owner/settings/payments`
- **THEN** credentials are saved securely in tenant site config and verified with a live test ping

### Requirement: Schema-Driven Master Configuration Editor
The system SHALL dynamically render view, search, and edit forms for permitted master DocTypes inside `/owner/admin/data` based on Frappe metadata, allowing owners to update any underlying entity with full field validation.

#### Scenario: Owner edits terms and conditions
- **WHEN** an owner navigates to `/owner/admin/data/Terms and Conditions`
- **THEN** the system dynamically renders the standard list and form fields using portal-kit components, submits mutations through `frappe.client`, and enforces server-side validation

### Requirement: Auditable Emergency Override Controls
The system SHALL provide an Emergency Override Center in `/owner/operations/overrides` allowing owners to bypass operational locks (such as expired safety certificates or double-booking warnings) with mandatory justification notes and tamper-evident audit logs.

#### Scenario: Owner overrides safety dispatch lock
- **WHEN** an owner forcibly assigns an asset with a pending certificate renewal to an emergency event
- **THEN** the system requires an explicit justification, records an auditable override event with timestamp and owner user ID, and unblocks the dispatch schedule

