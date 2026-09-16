## Why

Event planning and coordination involves immense manual cognitive toil:
1. **Run-of-Show Synthesis**: Event leads spend hours manually assembling minute-by-minute timelines from disjointed client planning questionnaires, often missing crucial logistics like golden hour sunset times for photography, venue sound curfews, and meal service pacing.
2. **Emergency Sick Calls & No-Shows**: When a key DJ, photobooth attendant, or truck driver calls in sick 3 hours before call time, operators panic—manually calling through staff lists while the clock ticks.
3. **Complex Rider & Contract Ingestion**: High-end corporate and municipal events arrive as 20-page PDF contracts and technical riders that must be manually keyed into line-item packages, power requirements, and load-in schedules.

The **Autonomous Event Copilot & Agentic Ops** change introduces specialized agentic workflows powered by Entertainment Express's Ollama / LLM infrastructure:
- **Intelligent Run-of-Show Generator**: Automatically synthesizes structured, minute-by-minute timelines matching astronomical sunset, venue curfews, and optimal entertainment energy curves.
- **Agentic Sick Call Auto-Resolver**: Instantly evaluates talent by skill matrix, proximity, reliability score, and overtime thresholds upon a worker cancellation, generating an automated replacement dispatch ladder with 1-click SMS acceptance.
- **Rider & Document Ingestion Agent**: Extracts equipment lists, stage dimensions, call times, and insurance clauses from client PDFs directly into structured `Event Booking` data.

## What Changes

- **AI Run-of-Show Production Engine**: Ingests completed client questionnaires and generates a fully timed `Event Timeline` with cues for music, lighting, speeches, and vendor transitions.
- **Astronomical & Curfew Constraints Integration**: Computes astronomical sunset, twilight, and local noise curfews based on venue coordinates and date, adjusting photo/outdoor segments automatically.
- **Automated Sick Call & No-Show Emergency Pipeline**: When a crew member cancels via `/employee`, the system evaluates eligible replacements, scores them by proximity and reliability, and dispatches cascading emergency SMS offers with expiration timers.
- **PDF Technical Rider & Contract Extractor**: Upload PDF contracts or riders in `/owner/pipeline` or `/owner/bookings` to auto-extract date, times, equipment needs, and client notes with a side-by-side verification drawer.
- **Copilot Action Cards in `/owner` and `/employee`**: Contextual AI recommendations ("3 moments lack assigned crew leads", "Sunset photo window overlaps with dinner toast").

## Capabilities

### New Capabilities
- `autonomous-event-copilot`: Automated timeline run-of-show synthesis, emergency staffing replacement ladder, and technical rider document extraction.

### Modified Capabilities
- `event-timeline`: Support programmatic bulk moment generation and constraint validation.
- `scheduling-dispatch`: Add emergency replacement dispatch mode with automated SMS escalation.
- `ai-assistant`: Add structured event planning and document parsing tools with schema guarantees.

## Impact

- **Backend Architecture**:
  - `entertainment_express/copilot/timeline_synthesizer.py`: Run-of-show generator with curfew and sunset calculations.
  - `entertainment_express/copilot/emergency_dispatch.py`: Automated sick call replacement ladder.
  - `entertainment_express/copilot/document_parser.py`: PDF rider text extraction and entity mapping.
  - `entertainment_express/copilot/solar.py`: Ephemeris/sunset calculation from latitude/longitude.
- **DocTypes**:
  - New `EE Copilot Action`: Tracks generated suggestions, audit trail, user acceptance/rejection.
- **Integrations**:
  - Ollama LLM endpoint (local GPU node05 with deterministic JSON output schemas).
  - Twilio SMS for 1-click emergency shift acceptances.
