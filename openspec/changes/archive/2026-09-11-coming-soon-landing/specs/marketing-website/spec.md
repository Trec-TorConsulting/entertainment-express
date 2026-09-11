## ADDED Requirements

### Requirement: Coming Soon Gating and Teaser Landing Page
The system SHALL support an operator-configurable "Coming Soon" mode for public marketing pages. When active, all unauthenticated guest visits to public marketing pages (`/`, `/features`, `/pricing`, `/solutions`, `/blog`, `/demo`, etc.) SHALL be routed to a dedicated Coming Soon landing page (`/coming-soon`), while exempting login, API, asset, and authentication endpoints.

#### Scenario: Unauthenticated guest visits marketing pages during coming soon mode
- **WHEN** `coming_soon_mode` is enabled in `Marketing Settings` or site configuration
- **AND** an unauthenticated visitor requests `/` or any public marketing page
- **THEN** the visitor is routed to the `/coming-soon` landing page presenting brand value propositions, what to expect, and an early-access waitlist signup form.

#### Scenario: Authenticated developers and staff bypass coming soon mode
- **WHEN** `coming_soon_mode` is enabled
- **AND** an authenticated user with an internal role (Administrator, System Manager, SaaS Operator, EE Tenant Admin, or EE staff role) requests any marketing or portal route
- **THEN** the request is not routed to `/coming-soon` and the user views the requested page normally.

#### Scenario: Invited beta tester unlocks bypass with passcode
- **WHEN** an unauthenticated visitor provides a valid beta access passcode via query parameter `?beta_key=...` or via the Coming Soon unlock dialog
- **THEN** the system sets a secure HTTP cookie (`ee_beta_access`) and permits the visitor to view the public marketing site and portals without registering a Frappe user account.

### Requirement: Early Access Waitlist Capture
The system SHALL capture early access / VIP waitlist submissions from the Coming Soon page and persist them into the control-plane `Lead` DocType with `lead_type="waitlist"`, including name, email, company name, vertical interest, attribution metadata, and honeypot bot prevention.

#### Scenario: Visitor submits early access waitlist form
- **WHEN** a visitor enters their name, email, company, and vertical on the Coming Soon waitlist form
- **AND** submits the form
- **THEN** a `Lead` record is created with `ee_lead_type="waitlist"`, `status="Lead"`, and the visitor receives on-page confirmation.
