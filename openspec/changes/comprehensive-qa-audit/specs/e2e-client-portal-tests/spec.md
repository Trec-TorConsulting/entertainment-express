## ADDED Requirements

### Requirement: Client Home Dashboard Coverage
The test suite SHALL verify every interactive element on the Client Home page at `/client/`.

#### Scenario: Client home loads with event widgets
- **WHEN** a Client navigates to `/client/`
- **THEN** the page displays an upcoming event countdown, action items, payment summary, and quick-action links without JS errors

#### Scenario: Clicking quick-action links
- **WHEN** a Client clicks each quick-action link on the home dashboard
- **THEN** the correct page or dialog opens without errors

### Requirement: My Events List Coverage
The test suite SHALL verify the Client My Events page at `/client/events`.

#### Scenario: Events list loads
- **WHEN** a Client navigates to My Events
- **THEN** the page displays a list of all events with event name, date, status, and venue

#### Scenario: Filtering events by status
- **WHEN** a Client filters events by status (Upcoming, Past, Cancelled)
- **THEN** only events matching the filter are displayed

#### Scenario: Clicking into event detail
- **WHEN** a Client clicks on an event in the list
- **THEN** the event detail page loads at `/client/events/:id` with full event information

### Requirement: Event Detail Page Coverage
The test suite SHALL verify all tabs and interactions on the Client Event Detail page.

#### Scenario: Event detail tabs render
- **WHEN** a Client opens an event detail page
- **THEN** all tabs (Overview, Timeline, Planning, Music, Crew, Documents, Photos) render and switch correctly

#### Scenario: Editing allowed event fields
- **WHEN** a Client modifies editable fields on their event (e.g., special instructions, guest count) and saves
- **THEN** the changes persist via API

### Requirement: Payments and Invoices Coverage
The test suite SHALL verify the Client Payments page at `/client/pay` including payment initiation.

#### Scenario: Payments page loads with invoice list
- **WHEN** a Client navigates to Payments & Invoices
- **THEN** the page displays outstanding invoices, past payments, and total balance due

#### Scenario: Viewing invoice detail
- **WHEN** a Client clicks on an invoice
- **THEN** the invoice detail displays line items, amounts, due date, and a "Pay Now" button

#### Scenario: Initiating payment via Stripe
- **WHEN** a Client clicks "Pay Now" on an outstanding invoice
- **THEN** the Stripe payment form (Stripe Elements) renders with card input fields

#### Scenario: Payment form validation
- **WHEN** a Client submits the payment form with an invalid card number
- **THEN** a validation error message is displayed and the payment is not processed

### Requirement: Planning Hub Full Coverage
The test suite SHALL verify the Client Planning Hub at `/client/planning`.

#### Scenario: Planning hub loads with event planning forms
- **WHEN** a Client navigates to Planning Hub
- **THEN** the page displays available planning forms for their booked events

#### Scenario: Filling out a planning form
- **WHEN** a Client fills out a planning form with all fields (event type questions, pronunciation guides, special requests, timeline preferences) and clicks Submit
- **THEN** the form data persists via API and the form status changes to "Submitted"

#### Scenario: Saving a planning form draft
- **WHEN** a Client partially fills a planning form and clicks "Save Draft"
- **THEN** the form data is preserved and can be resumed later

#### Scenario: Conditional planning form fields
- **WHEN** a Client selects a specific event type that triggers additional conditional fields
- **THEN** the conditional fields appear and are fillable

### Requirement: Live Event Chat Coverage
The test suite SHALL verify the Client Live Event Chat page at `/client/chat`.

#### Scenario: Chat page loads
- **WHEN** a Client navigates to Live Event Chat
- **THEN** the page displays the chat interface with message input, send button, and conversation history

#### Scenario: Sending a chat message
- **WHEN** a Client types a message in the chat input and clicks Send
- **THEN** the message appears in the conversation thread

### Requirement: Co-Hosts and Guests Coverage
The test suite SHALL verify the Client Co-Hosts & Guests page at `/client/people`.

#### Scenario: People page loads
- **WHEN** a Client navigates to Co-Hosts & Guests
- **THEN** the page displays the guest list and co-host management interface

#### Scenario: Inviting a co-host
- **WHEN** a Client enters a co-host email address and clicks Invite
- **THEN** the co-host invitation is created and appears in the list

#### Scenario: Adding guests to guest list
- **WHEN** a Client adds guest names to the guest list
- **THEN** the guests appear in the list with RSVP status tracking

### Requirement: Consultations and Appointments Coverage
The test suite SHALL verify the Client Consultations page at `/client/appointments`.

#### Scenario: Consultations page loads
- **WHEN** a Client navigates to Consultations
- **THEN** the page displays scheduled and available consultation slots

#### Scenario: Scheduling a consultation
- **WHEN** a Client selects an available time slot, chooses a consultation type, and confirms
- **THEN** the appointment is booked and appears in the consultations list

#### Scenario: Cancelling a consultation
- **WHEN** a Client clicks cancel on a scheduled consultation
- **THEN** the appointment is cancelled and the time slot becomes available again

#### Scenario: Rescheduling a consultation
- **WHEN** a Client clicks reschedule on a scheduled consultation and selects a new time
- **THEN** the appointment moves to the new time slot

### Requirement: Contracts and Documents Coverage
The test suite SHALL verify the Client Contracts & Docs page at `/client/documents`.

#### Scenario: Documents page loads with contract list
- **WHEN** a Client navigates to Contracts & Docs
- **THEN** the page displays contracts, agreements, and other documents with status (Draft, Sent, Signed)

#### Scenario: Viewing a contract
- **WHEN** a Client clicks on a contract
- **THEN** the full contract text renders in a readable format with e-sign controls

#### Scenario: E-signing a contract
- **WHEN** a Client opens the e-sign interface and completes their signature (via type or draw), enters their full name confirmation, and clicks "Sign Contract"
- **THEN** the contract status changes to "Signed" and is confirmed via API with a timestamp and signature audit trail

#### Scenario: Downloading a contract PDF
- **WHEN** a Client clicks "Download PDF" on a signed contract
- **THEN** a PDF file downloads containing the contract text and signature

### Requirement: Event Photos Coverage
The test suite SHALL verify the Client Event Photos page at `/client/photos`.

#### Scenario: Photos page loads with gallery
- **WHEN** a Client navigates to Event Photos
- **THEN** the page displays a photo gallery with thumbnails from their events

#### Scenario: Downloading individual photos
- **WHEN** a Client clicks download on a single photo
- **THEN** the full-resolution photo downloads

#### Scenario: Sharing a gallery link
- **WHEN** a Client clicks "Share Gallery"
- **THEN** a shareable link is generated and can be copied

### Requirement: Account and Preferences Coverage
The test suite SHALL verify the Client Account & Preferences page at `/client/account`.

#### Scenario: Account page loads with profile information
- **WHEN** a Client navigates to Account & Preferences
- **THEN** the page displays profile fields (name, email, phone), notification preferences, and password change option

#### Scenario: Editing profile information
- **WHEN** a Client modifies their phone number and notification preferences, then saves
- **THEN** the changes persist via API

#### Scenario: Changing password
- **WHEN** a Client enters current password, new password, and confirm password, then submits
- **THEN** the password change succeeds (or fails with appropriate error if current password is wrong)
