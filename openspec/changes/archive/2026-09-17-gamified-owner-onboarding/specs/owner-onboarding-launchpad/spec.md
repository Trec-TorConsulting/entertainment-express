# Owner Onboarding Launchpad Spec

## ADDED Requirements

### Requirement: Interactive Launchpad Widget in Owner Portal
The system SHALL render a gamified launchpad checklist on the `/owner` portal dashboard (`TodayPage.tsx`) displaying business setup progress and actionable quests.

#### Scenario: Display launchpad widget on dashboard
- **WHEN** an owner logs into the `/owner` portal
- **THEN** the system SHALL display the Launchpad progress bar (0-100%), completed quest counts, and launch quest cards.

### Requirement: 5 Core Launch Quests
The system SHALL track 5 specific launch quests: Connect Payments, Brand & Site, Build Catalog, Contracts & Forms, and Import Data.

#### Scenario: Completing a quest updates progress
- **WHEN** an owner configures Stripe payments or adds catalog items
- **THEN** the system SHALL dynamically update the completed status for that quest and increment the total progress percentage.

### Requirement: Contextual AI Assistant Quick Actions
The system SHALL provide an "Ask AI for Examples" button on each launch quest card that opens the AI Copilot (`/assistant`) with pre-filled context-aware prompts.

#### Scenario: Clicking Ask AI for Examples
- **WHEN** an owner clicks "Ask AI for Examples" on the Catalog quest
- **THEN** the system SHALL navigate to `/assistant` with a prompt requesting package and gear recommendations tailored to their business vertical.
