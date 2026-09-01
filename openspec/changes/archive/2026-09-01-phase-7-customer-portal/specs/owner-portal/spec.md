## ADDED Requirements

### Requirement: Change Requests On Company OS
The system SHALL show pending booking change requests on `/owner` Today and let the owner approve or decline without `/app`. Approve SHALL apply through existing booking APIs.

#### Scenario: Owner approves a reschedule
- **WHEN** an owner approves a pending date change
- **THEN** `reschedule_booking` runs and the request is marked applied
