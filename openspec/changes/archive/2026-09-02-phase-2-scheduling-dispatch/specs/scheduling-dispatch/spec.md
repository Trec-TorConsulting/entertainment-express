## MODIFIED Requirements

### Requirement: Route Optimization
The system SHALL sequence a day's events by call time and attach travel minutes when maps are connected. Event windows stay fixed; the planner SHALL NOT move a job's start to shorten drive time.

#### Scenario: Optimized route
- **WHEN** a dispatcher generates routes for the day's multi-stop jobs
- **THEN** stops are ordered by start time, travel minutes appear when a maps key is present, and a Route Plan can be saved for that day

### Requirement: Crew & Asset Assignment
The system SHALL assign qualified crew and available assets to a booking, respecting role requirements and availability, with full CRUD on assignments. Auto-suggest SHALL work without an AI provider.

#### Scenario: Auto-suggest assignments
- **WHEN** a dispatcher opens an unassigned confirmed booking
- **THEN** the system suggests available, qualified crew ranked by role match then availability that day
