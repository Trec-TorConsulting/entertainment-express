# Capability: Mobile Field App

## Purpose
A mobile-first **PWA** for field crew and talent to run events from their phone: see assigned jobs, navigate,
access run sheets, check in/out, capture photos/signatures, upload deliverables, and report issues — with
offline tolerance for poor-connectivity venues. Consumes the same REST APIs as the rest of the platform;
scoped to the `EE Crew` role.

## Requirements

### Requirement: Crew Job List & Details
The system SHALL show each crew member their assigned upcoming and current jobs with full run-sheet detail.

#### Scenario: See today's jobs
- **WHEN** a crew member opens the app
- **THEN** they see their assigned jobs for today/upcoming with times, addresses, roles, and run sheets,
  scoped to only their assignments

### Requirement: Navigation & Check-In/Out
The system SHALL provide turn-by-turn navigation to venues and check-in/out with timestamp and optional
geolocation.

#### Scenario: Navigate and check in
- **WHEN** a crew member taps navigate and later checks in on site
- **THEN** a maps route opens, and check-in records time/location, updating dispatch and starting the
  timesheet

### Requirement: On-Site Workflows
The system SHALL guide setup/teardown checklists and let crew mark stage completion (en-route, on-site,
setup-complete, complete).

#### Scenario: Complete checklist
- **WHEN** a crew member completes the setup checklist and marks setup complete
- **THEN** the status and timestamps propagate to the dispatch board and booking

### Requirement: Media & Signature Capture
The system SHALL let crew capture photos (setup, condition, event, damage), collect on-site customer
signatures, and upload deliverables.

#### Scenario: Capture and upload media
- **WHEN** a crew member photographs setup and the finished event
- **THEN** media uploads to object storage attached to the booking (queued/retried if offline) and becomes
  available to staff/customer per policy

#### Scenario: On-site signature
- **WHEN** a customer signs on the crew's device (e.g., delivery acceptance)
- **THEN** the signature is stored with audit metadata on the booking

### Requirement: Offline Tolerance
The system SHALL function for core crew actions with intermittent/no connectivity and sync when back online.

#### Scenario: Offline check-in and photos
- **WHEN** a crew member checks in and captures photos with no signal
- **THEN** actions are queued locally and synced automatically when connectivity returns, without data loss

### Requirement: Issue Reporting & Push
The system SHALL let crew report problems (damage, no-show, access issues) and receive push notifications for
assignments and changes.

#### Scenario: Push on new assignment
- **WHEN** a crew member is assigned or a job changes
- **THEN** they receive an FCM push notification and the job list updates

#### Scenario: Report an issue
- **WHEN** a crew member reports an on-site issue with detail/photos
- **THEN** an incident is created, dispatch/managers are alerted, and it links to the booking
