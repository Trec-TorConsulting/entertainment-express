## ADDED Requirements

### Requirement: Visual Website Builder Workspace
The system SHALL provide a dedicated visual Website Builder workspace at `/owner/website` in the Owner Portal matching the "Today" design system, enabling owners to edit homepage sections, custom pages, and widget embed snippets.

#### Scenario: Owner edits homepage sections
- **WHEN** an owner navigates to `/owner/website` and edits the hero headline, subhead, and section visibility toggles
- **THEN** saving the configuration persists changes to `EE Portal Settings` and immediately updates the live public tenant homepage

#### Scenario: Owner manages custom marketing pages
- **WHEN** an owner creates or publishes a custom page with title and route
- **THEN** the page is accessible at `/p/<route>` with the tenant's brand styling and header/footer
