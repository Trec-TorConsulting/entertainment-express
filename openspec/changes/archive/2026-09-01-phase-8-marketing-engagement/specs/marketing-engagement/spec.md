## ADDED Requirements

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
