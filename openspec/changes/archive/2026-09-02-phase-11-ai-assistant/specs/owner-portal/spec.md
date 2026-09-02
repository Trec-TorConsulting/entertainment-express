## ADDED Requirements

### Requirement: Assistant On Company OS
The system SHALL provide `/owner/assistant` as a chat workspace that calls the AI APIs, with no Desk URL and no DocType names in copy.

#### Scenario: Owner asks
- **WHEN** an `EE Tenant Admin` opens Assistant and sends a question
- **THEN** the reply is shown in the shell; if the backend is degraded the page still loads and shows `AI suggestion unavailable`

### Requirement: Suggest On Proposal And Today Forecast
The system SHALL expose quote suggestions from the proposal workspace and a forecast strip on Today, using backend-formatted money only.

#### Scenario: Suggest a package
- **WHEN** the owner clicks Suggest a package on a proposal
- **THEN** packaged lines and a price range appear for accept/edit; the SPA does not add money itself
