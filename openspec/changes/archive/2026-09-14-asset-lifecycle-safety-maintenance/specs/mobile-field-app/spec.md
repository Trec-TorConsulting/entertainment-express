## ADDED Requirements

### Requirement: Teardown Equipment Defect and Damage Capture
The system SHALL provide a frictionless damage reporting flow in the Mobile Field App PWA during event pack-down, supporting camera photo capture, issue categorization (cosmetic, degraded, inoperable, safety-critical), and offline queuing.

#### Scenario: Submitting teardown damage offline
- **WHEN** crew flags a torn seam on a bounce house while offline at a rural venue
- **THEN** the defect report and photo are saved to local IndexedDB and synced immediately upon network reconnection, triggering the quarantine workflow
