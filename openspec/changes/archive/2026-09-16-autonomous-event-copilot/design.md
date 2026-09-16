# Design: Autonomous Event Copilot & Agentic Ops

## 1. Overview
This design implements specialized agentic workflows for Entertainment Express: automated timeline production with sunset and curfew awareness, autonomous emergency sick-call replacement ladders, and PDF contract/rider document parsing.

## 2. Architecture & Copilot Execution Flow

```mermaid
flowchart TD
    subgraph Timeline Synthesis
        A[Client Questionnaire] --> B[solar.py: Sunset & Golden Hour]
        C[Venue Curfew Rules] --> D[timeline_synthesizer.py]
        B --> D
        D -->|Ollama Structured JSON| E[Event Timeline Moments]
    end

    subgraph Emergency Sick Call
        F[Worker Late Cancellation] --> G[emergency_dispatch.py]
        G --> H[Rank Qualified Talent: Skill + Proximity + Reliability]
        H --> I[Twilio Urgent SMS with 15m Expiry Token]
        I -->|1-Tap Accept Link| J[Reassign Crew & Notify Lead]
    end

    subgraph Document Parser
        K[Uploaded PDF Rider] --> L[document_parser.py]
        L --> M[pypdf / pdfplumber Extraction]
        M --> N[Structured Entity Prompting]
        N --> O[Pre-fill Event Booking & Asset Needs]
    end
```

## 3. Data Models

### New DocType: `EE Copilot Action`
- `event_booking` (Link to Event Booking, optional)
- `action_type` (Select: `Timeline Generation`, `Emergency Staffing`, `Document Ingestion`, `Conflict Warning`)
- `status` (Select: `Proposed`, `Accepted`, `Rejected`, `Expired`)
- `prompt_context` (Long Text)
- `output_payload` (JSON Text)
- `confidence_score` (Float)
- `reviewed_by` (Link to User)

## 4. Algorithmic Modules

### 1. `entertainment_express.copilot.solar.py`
- Implements standard solar position equations (sunrise, sunset, dusk, golden hour) given latitude, longitude, and date.
- Requires zero external API calls (offline mathematical execution).

### 2. `entertainment_express.copilot.emergency_dispatch.py`
- Triggered on cancellation status change.
- Evaluates active workers where `status == 'Active'` and `is_available == 1`.
- Filters workers holding required certifications/skills.
- Scores candidates by:
  $$\text{Priority} = (0.50 \times \text{Reliability Score}) + (0.30 \times \text{Proximity Score}) + (0.20 \times \text{Historical Role Match})$$
- Generates secure signed URL token (`/api/method/.../claim_shift?token=xyz`).

### 3. `entertainment_express.copilot.document_parser.py`
- Extracts text chunks from uploaded PDF attachments.
- Queries Ollama LLM with strict JSON schema forcing output keys: `date`, `start_time`, `end_time`, `venue_name`, `venue_address`, `required_gear`, `power_specs`, `curfew_notes`.

## 5. UI Implementation
- `/owner/pipeline/:id` and `/owner/bookings/:id`:
  - "Copilot Assistant" drawer with 1-click timeline generation preview.
  - PDF Rider Dropzone with extracted fields side-by-side verification.
- `/owner/dispatch`:
  - Emergency Sick Call ladder monitor showing real-time countdown timers for outbound SMS offers.
