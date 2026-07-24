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
