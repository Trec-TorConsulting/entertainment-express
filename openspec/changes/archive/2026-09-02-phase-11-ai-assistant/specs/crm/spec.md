## ADDED Requirements

### Requirement: Lead Conversion Score
The system SHALL store a 0–100 `ee_lead_score` on Lead for this site and update it when a lead is created.

#### Scenario: New inquiry scored
- **WHEN** a new Lead is inserted
- **THEN** `ee_lead_score` is set from this site’s heuristic (and optional LLM nudge) without reading another site
