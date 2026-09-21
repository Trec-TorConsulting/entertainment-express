## ADDED Requirements

### Requirement: Visual No-Code Page Builder
The system SHALL provide a drag-and-drop page builder in the Owner Portal enabling non-technical users to construct and publish custom marketing pages under `/p/<slug>`.

#### Scenario: Publishing a landing page
- **WHEN** an owner adds a Hero block, a Catalog block, and a Contact form on `/owner/website` with slug `bounce-houses`
- **AND** clicks "Publish Page"
- **THEN** navigating to `https://{tenant}.app.entx.app/p/bounce-houses` renders the page with responsive styling and verified SEO tags.

### Requirement: Embeddable JavaScript Widgets
The system SHALL provide a lightweight client-side widget library (`entx-widgets.js`) allowing external websites to embed live equipment catalogs, availability checkers, and quote submission forms.

#### Scenario: Embedding on external Squarespace site
- **WHEN** an external webpage embeds `<div data-entx-widget="availability" data-api-key="pk_live_123"></div>`
- **AND** the referring origin matches the domain whitelist configured on `EE Embed Key`
- **THEN** the widget renders the interactive availability date picker without throwing CORS or origin errors.

### Requirement: Origin Whitelist Enforcement
The widget API SHALL reject inquiries or availability queries when the HTTP `Origin` or `Referer` does not match the configured whitelist on the `EE Embed Key`.

#### Scenario: Rejecting unauthorized origins
- **WHEN** an inquiry is submitted with an embed key from an unlisted domain
- **THEN** the API returns HTTP 403 Forbidden with error `ORIGIN_NOT_WHITELISTED`.
