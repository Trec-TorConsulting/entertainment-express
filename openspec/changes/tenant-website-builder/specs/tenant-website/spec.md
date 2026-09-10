## ADDED Requirements

### Requirement: Rich Branded Default Homepage
The system SHALL serve a responsive, conversion-focused default landing page at `https://<tenant>.entx.app/` displaying the tenant's brand colors, configured hero headline, service highlights, packages showcase, trust badges, and direct booking call-to-actions.

#### Scenario: Guest views tenant homepage
- **WHEN** an unauthenticated guest visits `https://<tenant>.entx.app/`
- **THEN** the page renders the tenant's branded hero, value props, active storefront packages, and direct booking buttons with zero unstyled blank canvas

### Requirement: Owner Onboarding Guide Banner
The system SHALL display an actionable quick-start guide banner on the public tenant homepage when viewed by an authenticated owner or manager, providing in-context guidance on how to customize their site in the Website Builder.

#### Scenario: Owner visits own public site
- **WHEN** a logged-in user with owner privileges visits `https://<tenant>.entx.app/`
- **THEN** a dismissible header banner is rendered with a direct link to `/owner/website` to customize sections and branding
