## ADDED Requirements

### Requirement: Lead-to-Cash End-to-End Workflow
The test suite SHALL verify the complete revenue lifecycle spanning Owner, Employee, and Client personas from lead creation through payment collection.

#### Scenario: Full lead-to-cash flow
- **WHEN** the test executes the complete lead-to-cash flow:
  1. Owner creates a new inquiry with client contact details
  2. Owner qualifies the lead and advances pipeline status to "Proposal Sent"
  3. Owner creates a booking from the qualified lead with event details and contract total
  4. Owner dispatches the booking by assigning a crew member
  5. Employee accepts the offered shift via Field Board
  6. Employee transitions through shift states (Accepted → En Route → On Site → Complete)
  7. Owner creates an invoice for the completed booking
  8. Client views the invoice on Payments & Invoices page
  9. Owner records a payment against the invoice
- **THEN** each step persists correctly via API, the booking reaches "Complete" status, and the invoice shows as "Paid"

### Requirement: Quote to Contract to Signature Workflow
The test suite SHALL verify the complete quote→contract→e-sign flow spanning Owner and Client.

#### Scenario: Full quote-contract-sign flow
- **WHEN** the test executes the complete quote-to-signature flow:
  1. Owner creates a quote with line items and pricing
  2. Owner generates a contract from the quote
  3. Owner sends the contract to the client
  4. Client opens the Contracts & Docs page and sees the pending contract
  5. Client opens the contract and completes the e-sign process (name + signature)
  6. Owner views the contract and sees "Client Signed" status
- **THEN** the contract audit trail records the client's signature timestamp and IP, and the contract status is "Signed" via API

### Requirement: Booking to Dispatch to Crew Workflow
The test suite SHALL verify the complete booking→dispatch→crew assignment flow.

#### Scenario: Full booking-dispatch-crew flow
- **WHEN** the test executes the dispatch flow:
  1. Owner creates a booking with event details
  2. Owner navigates to Dispatch and selects the booking date
  3. Owner assigns a crew member from the Person dropdown
  4. Owner clicks "Offer shift"
  5. Employee logs in and navigates to Field Board
  6. Employee sees the offered shift and clicks "I'm in"
  7. Employee transitions to "On the way" → "Arrived" → "Wrap Up" → "Complete"
- **THEN** each state transition is confirmed via `field.my_jobs` API, and the Owner's dispatch view reflects the crew member's real-time status

### Requirement: Invoice to Payment Workflow
The test suite SHALL verify the complete invoice creation and payment recording flow.

#### Scenario: Full invoice-payment flow
- **WHEN** the test executes the invoice-payment flow:
  1. Owner creates an invoice for an existing booking with line items
  2. Owner sends the invoice
  3. Client navigates to Payments & Invoices and sees the outstanding invoice
  4. Client views the invoice details with correct amounts
  5. Owner records a payment against the invoice (simulating a Stripe payment callback)
- **THEN** the invoice status changes to "Paid" and both Owner (Money page) and Client (Payments page) see the updated payment status

### Requirement: Planning Form Submission Workflow
The test suite SHALL verify the Owner→Client planning form flow.

#### Scenario: Full planning form flow
- **WHEN** the test executes the planning form flow:
  1. Owner has a booking that requires planning form completion
  2. Client navigates to Planning Hub and sees the pending planning form
  3. Client fills out all planning form fields (must-play songs, do-not-play songs, pronunciation guides, special instructions, timeline preferences)
  4. Client saves a draft, then reopens and continues filling
  5. Client submits the completed form
  6. Owner navigates to the booking's planning tab and reviews the submitted data
- **THEN** all form responses are visible to the Owner and the planning form status shows "Submitted" via API

### Requirement: Music Selection Workflow
The test suite SHALL verify the Client→Owner music selection flow.

#### Scenario: Full music selection flow
- **WHEN** the test executes the music selection flow:
  1. Client navigates to the event's Music tab or Planning Hub music section
  2. Client adds must-play songs with Song Name and Artist
  3. Client adds do-not-play songs
  4. Client adds special-moment songs (first dance, cake cutting, etc.)
  5. Owner views the booking's music selections
- **THEN** all song selections (must-play, do-not-play, special moment) appear in the Owner's view and are confirmed via the `music` API

### Requirement: Crew Shift Lifecycle Full Workflow
The test suite SHALL verify the complete crew shift lifecycle from offer through completion with all state transitions.

#### Scenario: Full shift lifecycle flow
- **WHEN** the test executes the complete shift lifecycle:
  1. Owner offers a shift to an Employee via Dispatch
  2. Employee sees offer on Field Board
  3. Employee accepts the shift ("I'm in")
  4. At event time, Employee clicks "On the way" (En Route)
  5. Employee clicks "Arrived" (On Site)
  6. Employee takes a break, then resumes
  7. Employee clicks "Wrap Up"
  8. Employee clicks "Complete"
- **THEN** each transition is confirmed via `field.my_jobs` API with correct status values (offered → accepted → en-route → on-site → break → on-site → wrap-up → complete) and timestamps

### Requirement: Proposal Flow Workflow
The test suite SHALL verify the complete proposal creation and client acceptance flow.

#### Scenario: Full proposal flow
- **WHEN** the test executes the proposal flow:
  1. Owner navigates to Pipeline and creates a new deal
  2. Owner builds a proposal with package selection and pricing
  3. Owner sends the proposal to the client
  4. Client receives and opens the proposal
  5. Client selects a package option
  6. Client signs the attached contract
  7. Client makes a deposit payment
- **THEN** the deal status updates to "Booked", a confirmed booking is created, and the deposit payment is recorded via API
