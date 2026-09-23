## ADDED Requirements

### Requirement: My Day Dashboard Coverage
The test suite SHALL verify every interactive element on the Employee My Day page at `/employee/`.

#### Scenario: My Day loads with today's shifts
- **WHEN** an Employee navigates to `/employee/`
- **THEN** the page displays today's shift cards with event name, time, location, and status badges without JS errors

#### Scenario: Clock-in button interaction
- **WHEN** an Employee clicks the clock-in button on an active shift card
- **THEN** the shift status transitions to "Clocked In" and the timestamp is recorded

#### Scenario: Clock-out button interaction
- **WHEN** an Employee clicks the clock-out button on a clocked-in shift
- **THEN** the shift status transitions to "Clocked Out" and total hours are calculated

### Requirement: Dispatch Embed Page Coverage
The test suite SHALL verify the Employee Dispatch view at `/employee/dispatch`.

#### Scenario: Dispatch embed loads
- **WHEN** an Employee navigates to Dispatch
- **THEN** the embedded dispatch board renders showing the employee's assigned and upcoming bookings

#### Scenario: Viewing booking details from dispatch
- **WHEN** an Employee clicks on a booking card in the dispatch view
- **THEN** the booking detail expands showing event name, client, location, time, and any special instructions

### Requirement: Pull Sheet Page Coverage
The test suite SHALL verify the Pull Sheet page at the Employee portal.

#### Scenario: Pull sheet loads with equipment checklist
- **WHEN** an Employee navigates to Pull Sheet for an upcoming booking
- **THEN** the page displays the equipment checklist with item names, quantities, and check-off boxes

#### Scenario: Checking off equipment items
- **WHEN** an Employee clicks the checkbox next to an equipment item on the pull sheet
- **THEN** the item is marked as loaded/checked and the change persists

#### Scenario: Adding notes to pull sheet
- **WHEN** an Employee types notes in the pull sheet notes field and saves
- **THEN** the notes persist and are visible on subsequent page loads

### Requirement: Field Board Shift State Machine Coverage
The test suite SHALL verify the complete shift state machine on the Employee Field Board.

#### Scenario: Accepting an offered shift
- **WHEN** an Employee sees an offered shift on the Field Board and clicks "I'm in"
- **THEN** the shift status changes to "Accepted" and the `field.my_jobs` API confirms status "accepted"

#### Scenario: Transitioning to en-route
- **WHEN** an Employee clicks "On the way" on an accepted shift
- **THEN** the shift status changes to "En Route" and the API confirms status "en-route"

#### Scenario: Arriving on site
- **WHEN** an Employee clicks "Arrived" on an en-route shift
- **THEN** the shift status changes to "On Site" and the API confirms status "on-site"

#### Scenario: Starting and ending a break
- **WHEN** an Employee clicks "Break" on an on-site shift and later clicks "Resume"
- **THEN** the shift transitions through "Break" and back to "On Site" with break duration tracked

#### Scenario: Wrapping up
- **WHEN** an Employee clicks "Wrap Up" on an on-site shift
- **THEN** the shift status changes to "Wrap Up" and the API confirms status "wrap-up"

#### Scenario: Completing a shift
- **WHEN** an Employee clicks "Complete" on a wrap-up shift
- **THEN** the shift status changes to "Complete" and the API confirms status "complete"

#### Scenario: Declining an offered shift
- **WHEN** an Employee sees an offered shift and clicks "Decline" or equivalent
- **THEN** the shift is removed from the Field Board and the API confirms status "declined"

### Requirement: My Earnings Page Coverage
The test suite SHALL verify the Employee My Earnings page.

#### Scenario: Earnings page loads with pay history
- **WHEN** an Employee navigates to My Earnings
- **THEN** the page displays a list of pay periods, amounts earned, and payment status without errors

#### Scenario: Filtering earnings by date range
- **WHEN** an Employee applies a date range filter on the earnings page
- **THEN** only earnings within the selected date range are displayed

#### Scenario: Viewing pay stub details
- **WHEN** an Employee clicks on a specific pay period entry
- **THEN** the pay stub detail displays breakdown of hours, rate, tips, and deductions

### Requirement: Employee Reports Page Coverage
The test suite SHALL verify the Employee Reports page.

#### Scenario: Employee reports page loads
- **WHEN** an Employee navigates to Reports
- **THEN** the page displays employee-specific reports (shift history, hours summary, earnings) without errors

#### Scenario: Generating an employee report
- **WHEN** an Employee selects a report type and date range
- **THEN** the report renders with the employee's data

### Requirement: My Profile Page Coverage
The test suite SHALL verify all profile editing operations on the Employee My Profile page.

#### Scenario: Viewing profile information
- **WHEN** an Employee navigates to My Profile
- **THEN** the page displays current profile information including name, email, phone, emergency contact, and certifications

#### Scenario: Editing personal information
- **WHEN** an Employee modifies their phone number and emergency contact name, then saves
- **THEN** the changes persist and are confirmed via API

#### Scenario: Updating certifications
- **WHEN** an Employee adds or updates a certification entry
- **THEN** the certification is saved and appears in the profile
