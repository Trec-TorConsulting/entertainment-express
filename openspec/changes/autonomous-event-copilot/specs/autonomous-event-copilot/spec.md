## ADDED Requirements

### Requirement: Automated Run-of-Show Timeline Synthesis
The system SHALL provide an automated timeline generator that converts client questionnaire answers, event category templates, and venue environmental constraints into structured `Event Timeline Moment` records.

#### Scenario: Wedding questionnaire generates timeline with sunset cues
- **GIVEN** a wedding booking in Miami on November 15 with outdoor ceremony and dinner
- **WHEN** the user triggers "Auto-Generate Run-of-Show"
- **THEN** the system calculates sunset at 17:35, places "Golden Hour Bride & Groom Portraits" at 17:15–17:45, schedules reception entrance at 18:00, and generates complete moments with zero time conflicts

### Requirement: Emergency Sick Call Replacement Ladder
The system SHALL provide an automated emergency staffing pipeline triggered when an assigned worker submits a late cancellation (< 24 hours to call time).

#### Scenario: Emergency sick call triggers cascading SMS replacement offers
- **GIVEN** a lead sound technician cancels 4 hours before call time
- **WHEN** the cancellation is received
- **THEN** the system identifies the top 3 available, qualified workers within a 25-mile radius with Reliability Score >= 85, sends an urgent SMS offer with a 15-minute acceptance window, and escalates to the next candidate if unanswered

### Requirement: Technical Rider & Contract Document Extraction
The system SHALL provide an endpoint to parse uploaded PDF contracts, riders, or schedules, extracting structured booking metadata with confidence scores.

#### Scenario: PDF contract uploaded to pipeline
- **GIVEN** a 6-page festival production rider PDF
- **WHEN** the operator uploads the file via `/api/method/entertainment_express.copilot.document_parser.extract_rider_metadata`
- **THEN** the system returns structured JSON containing event dates, load-in call times, audio package requirements, stage power specifications, and flags clauses requiring human review
