# Capability: Autonomous Event Copilot & Agentic Ops

## Purpose
Provides specialized agentic workflows powered by Ollama/LLM infrastructure: solar-anchored run-of-show timeline synthesis, emergency sick-call replacement ladders with 1-click tokenized SMS dispatch, and technical rider PDF parsing.

## Requirements

### Requirement: Solar-Anchored Run-of-Show Synthesis
The timeline synthesizer (`generate_run_of_show`) SHALL compute solar position times (sunset, golden hour) offline and map questionnaire inputs into a structured minute-by-minute timeline respecting venue noise curfews.

#### Scenario: Synthesizing timeline with golden hour
- **WHEN** a questionnaire is submitted with venue lat/lng
- **THEN** sunset and golden hour photo windows are automatically scheduled

### Requirement: Emergency Replacement Ladder
When a crew member cancels, `trigger_emergency_replacement_ladder` SHALL rank available candidates by reliability, proximity, and role match, issuing tokenized 1-click shift offers with a 15-minute expiration timer.

#### Scenario: Crew call-out
- **WHEN** a lead DJ calls in sick 3 hours before call time
- **THEN** qualified replacement candidates receive 1-click SMS shift offers

### Requirement: Technical Rider PDF Extraction
The document parser (`parse_pdf_rider`) SHALL extract event specs, stage dimensions, power requirements, and equipment line items from uploaded PDF contracts/riders for owner verification.

#### Scenario: Uploading technical rider PDF
- **WHEN** a PDF contract is uploaded in owner portal
- **THEN** equipment line items and power specs are extracted for review
