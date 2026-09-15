## Why

Traditional mobile entertainment management software (InflatableOffice, Goodshuffle, HoneyBook, DJEP) functions as passive databases. When crises occur on event days—such as a lead DJ calling out sick 3 hours before a wedding, missing critical cables at setup, or a client posting an angry review—the software does nothing.

By building autonomous operational agents that act in real-time, Entertainment Express shifts from an administrative system of record to an active operational co-pilot. This change specifies five category-defining capabilities:
1. Event Day Emergency Dispatch Copilot (instant automated broadcast & call-out replacement)
2. Computer Vision "Smart Van Eye" (gear load-out checklist verification & teardown damage quarantine)
3. AI Voice Phone Receptionist (24/7 inquiry capture and instant proposal dispatch via Twilio Voice)
4. Dynamic Surge & Yield Pricing (real-time demand-based pricing adjustments for peak dates)
5. AI Review Interceptor & Reputation Catalyst (smart routing of happy clients to Google/Yelp and interception of unhappy experiences)

## What Changes

1. **Event Day Emergency Copilot**:
   - Detects worker call-outs or vehicle breakdowns.
   - Instantly calculates qualified replacement workers matching skills, radius, and overtime rules.
   - Broadcasts tiered emergency bonus SMS offers and re-routes van inventory automatically upon acceptance.
2. **Computer Vision Smart Van Eye**:
   - Scans camera photos/video of loaded vans against the event's Production BOM.
   - Alerts crew to missing gear before departure.
   - Performs automated teardown damage inspection of inflatables, speakers, and booths, automatically placing a hold on the client's damage pre-authorization deposit.
3. **AI Voice Intake & Phone Receptionist**:
   - Answers inbound calls via Twilio Voice with conversational AI.
   - Answers tenant FAQs, checks live date availability, captures event specs, and sends the caller an instant SMS proposal link.
4. **Dynamic Surge & Yield Pricing Engine**:
   - Analyzes inquiry velocity, seasonal saturation (e.g. October Saturdays, New Year's Eve), and historical win-rates.
   - Recommends or automatically applies dynamic price escalators (+15% to +35%) or minimum booking requirements on peak dates.
5. **AI Review Interceptor & Reputation Catalyst**:
   - Parses post-event surveys, photo gallery engagement, and wrap-up notes.
   - Routes ecstatic customers to Google/Yelp with personalized review keyword suggestions.
   - Intercepts negative feedback, alerts the owner with high priority, and generates an apology resolution draft before public review posting.

## Capabilities

### New Capabilities
- `ai-autonomous-operations`: Autonomous event operations, covering emergency dispatch call-out resolution, computer vision gear load-out & damage quarantine, AI voice phone answering, dynamic yield surge pricing, and review interception.

### Modified Capabilities
- `scheduling-dispatch`: Integrate emergency broadcast matching and dynamic crew replacement.
- `equipment-inventory-fleet`: Integrate computer vision load-out verification and damage quarantine.
- `service-catalog`: Add dynamic surge multipliers and peak date yield pricing rules.
- `marketing-engagement`: Add sentiment-based review routing and negative feedback interception.

## Impact

- **Backend**:
  - `entertainment_express/api/emergency_dispatch.py`
  - `entertainment_express/api/vision_van_inspection.py`
  - `entertainment_express/api/voice_receptionist.py`
  - `entertainment_express/api/dynamic_pricing.py`
  - `entertainment_express/api/review_interceptor.py`
- **Integrations**: Twilio Voice, Cloud Vision APIs (Gemini/OpenAI), Webhooks.
- **Frontend**: Operational emergency banner on `/owner`, load-out camera scanner in `/employee`.
