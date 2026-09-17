# AI Copilot Platform Knowledge Spec

## ADDED Requirements

### Requirement: Full Platform Route and Feature Awareness
The AI Assistant SHALL include complete platform route maps and feature definitions in its system prompt context when processing queries from tenant owners.

#### Scenario: Answering navigation and feature setup questions
- **WHEN** an owner asks the AI assistant "Where do I connect my Stripe terminal?" or "How do I set up my white-label domain?"
- **THEN** the AI assistant SHALL respond with step-by-step instructions and direct route links to `/connections` or `/brand`.

### Requirement: Vertical Best Practice Guidance
The AI Assistant SHALL provide tailored package, pricing, contract, and equipment recommendations matching the tenant's primary entertainment vertical.

#### Scenario: Requesting vertical package advice
- **WHEN** a DJ company owner asks "What packages should I offer?"
- **THEN** the AI assistant SHALL return structured DJ package tiers (e.g., Bronze/Silver/Gold DJ packages with lighting and wireless mic add-ons).

### Requirement: Direct Deep Link Rendering in Assistant UI
The system SHALL parse route links in AI assistant messages and render clickable action buttons in the `/assistant` chat UI.

#### Scenario: Clicking a route suggestion button in chat
- **WHEN** an AI response contains a route recommendation to `/connections`
- **THEN** the Assistant chat interface SHALL display an interactive "Go to Connections" button that navigates the user directly to that page.
