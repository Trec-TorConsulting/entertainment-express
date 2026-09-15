## Context

Mobile entertainment operations require immediate, decisive intervention during event-day emergencies and market shifts. This design introduces an autonomous agent layer that handles call-outs, computer-vision equipment audits, conversational phone reception, yield pricing, and online reputation management.

## Goals / Non-Goals

**Goals:**
- Provide automated emergency dispatch broadcasts that fill empty shifts in minutes with pre-approved bonus structures.
- Use multimodal vision to audit van loading and detect post-gig equipment damage.
- Provide 24/7 conversational phone call intake via Twilio Voice and text-to-speech pipelines.
- Automate peak-date surge pricing based on asset saturation.
- Funnel happy customers to Google/Yelp and intercept unhappy customers before public reviews are posted.

**Non-Goals:**
- Autonomous phone calls to end customers for collections (phone AI is for inbound inquiry intake and FAQ answering).
- Permanent cancellation of confirmed client bookings without owner intervention.

## Decisions

### 1. Emergency Dispatch Broadcast State Machine
- Broadcast states: `pending_acceptance`, `tier_1_sent`, `tier_2_escalated`, `confirmed`, `exhausted_owner_alert`.
- First-to-respond rule: Worker replies `YES` via Twilio SMS; system validates worker still available, binds assignment, and notifies other candidates that the shift has been filled.

### 2. Vision Load-Out Auditing
- Crew captures a single wide photo or video sweep of the van cargo.
- Cloud vision model parses visible serialized asset tags and equipment models, comparing against the `Production BOM` / `Event Booking Pull Sheet`.

### 3. Voice Inbound Call Flow
- Twilio Voice Webhook points to `entertainment_express.api.voice_receptionist.handle_call`.
- Gathers caller intent, checks date availability via REST query, and sends an SMS proposal link.

## Risks / Trade-offs

- **[Risk] High Emergency Bonus Costs**: Emergency bonus broadcasts might overpay crew if not capped.
  - *Mitigation*: The owner defines maximum allowable bonus amounts per role in `EE Dispatch Settings`.
- **[Risk] Twilio Voice Latency**: Conversational lag can feel unnatural.
  - *Mitigation*: Stream audio using fast streaming voice endpoints (Twilio Media Streams + low-latency TTS) with concise fallback responses.
