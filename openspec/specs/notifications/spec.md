# Capability: Notifications

## Purpose
Unified multi-channel delivery service used by all other capabilities to reach customers and crew via
**email**, **SMS (Twilio)**, **WhatsApp (Twilio/Meta)**, and **mobile push (FCM)**, with templates,
preferences, opt-outs, delivery tracking, and quiet hours.

### Data Model
- **Notification Template**: key, channel(s), subject/body with variables, tenant-overridable.
- **Notification Log**: recipient, channel, template, status (`queued|sent|delivered|failed|bounced`),
  provider_message_id, timestamps. (Append-only.)
- **Notification Preference**: user/customer, per-channel opt-in/out, quiet hours, locale.

## Requirements

### Requirement: Multi-Channel Delivery
The system SHALL send notifications over email, SMS, WhatsApp, and push using a common interface, selecting
channels per template and recipient preference.

#### Scenario: Booking confirmation across channels
- **WHEN** a booking is confirmed
- **THEN** the confirmation is delivered on the recipient's opted-in channels using the booking-confirmation
  template

#### Scenario: Channel fallback
- **WHEN** a preferred channel fails or is unavailable
- **THEN** the system falls back per policy (e.g., SMS→email) and records the outcome

### Requirement: Templates & Personalization
The system SHALL render templates with booking/customer variables and support tenant-level overrides and
localization.

#### Scenario: Personalized reminder
- **WHEN** a balance reminder is sent
- **THEN** the message includes the customer name, event date, amount due, and a pay link, using the tenant's
  branded template

### Requirement: Preferences, Opt-Out & Quiet Hours
The system SHALL honor per-recipient channel preferences, opt-outs, and quiet hours, and comply with
messaging regulations.

#### Scenario: Respect opt-out
- **WHEN** a recipient has opted out of SMS
- **THEN** no SMS is sent to them; transactional-only policy is applied where legally required

#### Scenario: Quiet hours deferral
- **WHEN** a non-urgent notification would send during a recipient's quiet hours
- **THEN** delivery is deferred until quiet hours end

### Requirement: Delivery Tracking & Retries
The system SHALL track delivery status via provider webhooks and retry transient failures.

#### Scenario: Delivery status update
- **WHEN** a provider reports delivered/failed for a message
- **THEN** the Notification Log updates via webhook and transient failures are retried with backoff

### Requirement: Asynchronous Sending
The system SHALL enqueue all sends to background workers so web requests never block on provider calls.

#### Scenario: Non-blocking send
- **WHEN** an action triggers notifications
- **THEN** the sends are enqueued and processed by workers, and the triggering request returns immediately

### Requirement: Booking Collaboration Notifications
The system SHALL notify booking-chat members of new messages and SHALL notify invitees when they are invited, using existing email/SMS/push channels and failing closed (log, do not crash) when a channel is unconfigured.

#### Scenario: Invite email
- **WHEN** a customer invites a guest
- **THEN** an invite notification is queued to that email (and SMS if a phone was provided)

#### Scenario: Chat notify assigned talent
- **WHEN** the customer posts in booking chat
- **THEN** assigned entertainer(s) receive a notification through configured channels

### Requirement: Proposal And Checklist Notifications
The system SHALL send proposal-sent, proposal-viewed (to staff), unsigned/unpaid proposal follow-up, and workflow-task-due messages on existing channels. Missing SMS credentials SHALL NOT crash the request.

#### Scenario: Staff notified on view
- **WHEN** a customer opens a sent Proposal
- **THEN** a proposal-viewed notification is queued for the sales owner

#### Scenario: Twilio down
- **WHEN** Twilio is unconfigured and a proposal is sent
- **THEN** email still queues (if configured) and the send API does not raise

### Requirement: Appointment Notifications
The system SHALL send appointment-booked, reminder, rescheduled, and canceled messages on existing channels. Missing SMS credentials SHALL NOT crash book or cancel.

#### Scenario: Twilio down on book
- **WHEN** Twilio is unconfigured and a consult is booked
- **THEN** email still queues if configured and the book API does not raise

### Requirement: Compliance Reminders
The system SHALL send COI-missing, waiver-needed, and policy-expiry messages on existing channels. Missing Twilio SHALL NOT crash the job.

#### Scenario: Twilio down on COI reminder
- **WHEN** Twilio is unconfigured and a COI reminder runs
- **THEN** email still queues if configured and the job does not raise

### Requirement: Preference Matches The Inbox
Notification Preference SHALL apply when the send recipient matches the customer or user email on the preference row, not only when callers pass party_type and party.

#### Scenario: Opt-out by email
- **WHEN** a customer opted out of SMS on their portal profile and a send targets that email
- **THEN** SMS is blocked even if the caller omitted party

### Requirement: Absolute Links Use Canonical Domain
The system SHALL build absolute action URLs in tenant notifications using the company canonical public base URL (custom domain when verified).

#### Scenario: Deposit reminder link
- **WHEN** a payment reminder email is sent and a primary custom domain is verified
- **THEN** the pay/portal link host is that custom domain

### Requirement: From-Name Uses Company White-Label
The system SHALL use the company white-label email from-name (or brand from-name when a booking brand is set) for client-facing notifications when configured.

#### Scenario: Confirmation from company name
- **WHEN** `email_from_name` is set on portal settings and a confirmation is sent without a brand override
- **THEN** the from-name matches that company setting

### Requirement: Email Chrome Uses White-Label Kit
The system SHALL wrap client-facing email bodies with company from-name and optional header logo/footer text from the white-label kit when configured.

#### Scenario: Confirmation email branded
- **WHEN** a booking confirmation email is sent with full white-label configured
- **THEN** the from-name and header/footer reflect the company kit, not Entertainment Express product copy
