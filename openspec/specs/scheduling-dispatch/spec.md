# Capability: Scheduling & Dispatch

## Purpose
Turn confirmed bookings into executable field operations: assign crew and assets, sequence jobs, optimize
routes, issue run sheets, and track crew status from dispatch through completion.

### Data Model
- **Crew Assignment**: booking (link), crew_member (Employee/contractor link), role (DJ, attendant, driver,
  performer), status (`offered|accepted|declined|checked_in|completed|no_show`), pay_rate/basis, call_time.
- **Asset Assignment**: booking (link), asset (link), status, load/return timestamps.
- **Dispatch Board**: derived view of a day's events with assignments and route order.
- **Run Sheet**: booking (link), generated packet (event details, venue, access notes, setup checklist,
  client contact, emergency contacts, equipment list).
- **Route Plan**: date, vehicle/crew, ordered stops, travel times.

## Requirements

### Requirement: Crew & Asset Assignment
The system SHALL assign qualified crew and available assets to a booking, respecting role requirements and
availability, with full CRUD on assignments.

#### Scenario: Assign qualified crew
- **WHEN** a dispatcher assigns crew to a booking requiring a "DJ" role
- **THEN** only crew with the DJ skill/role and no conflicting commitment can be assigned; conflicts are
  blocked

#### Scenario: Auto-suggest assignments
- **WHEN** a dispatcher opens an unassigned confirmed booking
- **THEN** the system suggests available, qualified crew ranked by role match then availability that day; an AI provider is not required

### Requirement: Crew Offer & Acceptance
The system SHALL support offering shifts to crew (especially 1099/gig) and tracking accept/decline.

#### Scenario: Shift offer flow
- **WHEN** a shift is offered to a gig crew member
- **THEN** they receive a notification to accept/decline, and acceptance locks the assignment while decline
  reopens it for reassignment

### Requirement: Dispatch Board
The system SHALL provide a daily dispatch board showing all events, their assignments, readiness, and gaps.

#### Scenario: Unfilled assignment alert
- **WHEN** an event within the dispatch horizon still lacks required crew or assets
- **THEN** it is flagged on the board as at-risk so dispatchers can act

### Requirement: Route Optimization
The system SHALL sequence a day's events by call time and attach travel times when maps are connected. Event windows stay fixed; the planner SHALL NOT move a job's start to shorten drive time.

#### Scenario: Optimized route
- **WHEN** a dispatcher generates routes for the day's multi-stop jobs
- **THEN** stops are ordered by start time, travel minutes appear when a maps key is present, and a Route Plan can be saved for that day

### Requirement: Run Sheets
The system SHALL generate a run sheet for each event containing everything the crew needs on site.

#### Scenario: Run sheet available to crew
- **WHEN** a crew member opens an assigned event in the mobile app
- **THEN** the run sheet shows venue/address/navigation, times, setup checklist, equipment list, client
  contact, and notes

### Requirement: Field Status Tracking
The system SHALL track crew check-in/out, en-route, on-site, setup-complete, and job-complete states with
timestamps and optional geolocation.

#### Scenario: Check-in on arrival
- **WHEN** a crew member checks in on site via the mobile app
- **THEN** the assignment status and timestamp/location are recorded and visible on the dispatch board

#### Scenario: Completion triggers downstream
- **WHEN** a crew member marks the job complete
- **THEN** the booking advances to `completed`, final-balance/tip and review requests can trigger, and hours
  flow to timesheets/payroll

### Requirement: Assignment Respects Hours And Compliance
The system SHALL refuse to assign or suggest a person who is outside weekly hours, on time-off, or missing a required compliance document (W9 for 1099, contract, background check) or holding an expired required cert.

#### Scenario: Expired license blocks assign
- **WHEN** a dispatcher assigns a worker whose required license is expired
- **THEN** the assign is rejected with a reason the person can fix in People
