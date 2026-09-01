# Capability: Marketing & Engagement

## Purpose
Grow and retain a tenant's customer base: email/SMS/WhatsApp campaigns, automated lifecycle journeys,
review generation, referrals, coupons/promotions, and lead-nurture. Integrates with `notifications` for
delivery and `crm` for audiences.

## Requirements

### Requirement: Audience Segmentation
The system SHALL build customer/lead segments from CRM and booking data for targeting.

#### Scenario: Segment by criteria
- **WHEN** a marketer defines a segment (e.g., "customers with weddings in the last 12 months")
- **THEN** the matching audience is computed from tenant data and usable as a campaign target

### Requirement: Campaigns (Email/SMS/WhatsApp)
The system SHALL create and send campaigns across email, SMS, and WhatsApp with templates and tracking, with
full CRUD, respecting opt-outs.

#### Scenario: Send email campaign
- **WHEN** a marketer sends an email campaign to a segment
- **THEN** messages are delivered via `notifications`, opens/clicks are tracked, and unsubscribes are honored

#### Scenario: Opt-out enforced
- **WHEN** a recipient has opted out of a channel
- **THEN** they are excluded from campaigns on that channel, and compliance (CAN-SPAM/TCPA) footers apply

### Requirement: Lifecycle Automations
The system SHALL run automated journeys triggered by events (new lead, quote sent, event completed,
anniversary) with configurable steps.

#### Scenario: Post-event follow-up journey
- **WHEN** an event is marked completed
- **THEN** the configured journey runs (thank-you, review request, rebooking offer) on schedule

### Requirement: Review Generation & Management
The system SHALL solicit reviews post-event and route/track responses across platforms (e.g., Google).

#### Scenario: Review request
- **WHEN** an event completes and the customer is eligible
- **THEN** a review request is sent, positive intent is routed to public review platforms, and results are
  tracked

### Requirement: Referrals & Promotions
The system SHALL support referral programs and promo/coupon codes with tracking and reward fulfillment.

#### Scenario: Referral reward
- **WHEN** a referred customer completes their first booking
- **THEN** the referrer's reward (credit/coupon) is issued and tracked

#### Scenario: Promo code usage
- **WHEN** a promo code is used within its limits
- **THEN** the discount applies (via `service-catalog` pricing) and usage is tracked for ROI reporting

### Requirement: Campaign Analytics
The system SHALL report campaign and channel performance (delivery, engagement, conversions, revenue
attributed).

#### Scenario: Campaign ROI
- **WHEN** a marketer views a campaign report
- **THEN** sends, opens/clicks, bookings, and attributed revenue are shown

### Requirement: Grow Lists And Campaigns On Company OS
The system SHALL let the owner define a segment, send a campaign on email/SMS/WhatsApp through existing notifications, skip opted-out recipients, and see sent/skipped/opened/clicked counts. Guests SHALL be denied.

#### Scenario: Send email campaign
- **WHEN** an owner sends an email campaign to a completed-jobs list
- **THEN** opted-in recipients are enqueued via `notifications.send` and opted-out rows are skipped

#### Scenario: Opt-out enforced
- **WHEN** a customer has email promotional opt-out
- **THEN** they are not sent that campaign

### Requirement: Post-Event Review Ask
The system SHALL send a thank-you and review request after a job is completed when a review URL is configured.

#### Scenario: Review request
- **WHEN** a job is completed and the owner has a review URL
- **THEN** a review request is recorded and sent

### Requirement: Promo Codes And Client Referrals
The system SHALL apply promo codes with `flt` within max uses and expiry, and SHALL issue a reward code when a referred customer completes a first job.

#### Scenario: Promo code usage
- **WHEN** a valid code is applied to a quote
- **THEN** the discount is stored with `flt` and usage increments

#### Scenario: Referral reward
- **WHEN** the referred customer’s first job completes
- **THEN** the referrer receives a reward promo code
