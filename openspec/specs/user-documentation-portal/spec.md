# User Documentation Portal Spec

## Purpose

Provide an enterprise-grade, on-brand, searchable User Documentation and Help Knowledge Base native to the Frappe framework, serving self-service user guides, workflow playbooks, and API references for Tenant Owners, Field Crew, Clients, and Operators.

## Requirements

### Requirement: Documentation Portal Route and Navigation
The system SHALL expose a public and authenticated enterprise documentation portal at route `/docs` (and alias `/help`), providing structured navigation by category, user role, and search query.

#### Scenario: Navigating to documentation home
- **WHEN** any user visits `/docs` or `/help`
- **THEN** the documentation home page renders with featured categories, role filters, quick start guides, and search bar.

#### Scenario: Viewing a documentation article by slug
- **WHEN** a user visits `/docs/<article-slug>` or `/docs/<category-slug>/<article-slug>`
- **THEN** the system resolves the matching `Help Article` from Frappe or seed content, rendering formatted HTML with breadcrumbs, table of contents, and related articles.

### Requirement: Documentation Instant Search and Filtering
The system SHALL provide interactive search with live auto-complete and client-side or server-side filtering across help articles.

#### Scenario: Searching documentation with Cmd+K
- **WHEN** a user presses `Cmd+K` or types in the documentation search box
- **THEN** a search overlay appears with instant matching results grouped by category and relevance score.

### Requirement: Seed Data for Enterprise Production-Ready Docs
The system SHALL automatically seed comprehensive, enterprise-grade help categories and user guides during setup and migration if missing.

#### Scenario: App installation or migration
- **WHEN** `bench migrate` or app setup executes
- **THEN** standard help categories ("Getting Started", "Owner Ops & Inventory", "Field Crew Playbook", "Client Experience", "REST API & Webhooks") and detailed articles are populated into Frappe `Help Category` and `Help Article` records.

### Requirement: Contextual In-App Help Navigation
The system SHALL integrate contextual doc links into the product portals (`/owner`, `/employee`, `/client`).

#### Scenario: Clicking contextual help in owner portal
- **WHEN** a tenant owner clicks "Help & Documentation" in `/owner` top bar or sidebar
- **THEN** a new window or drawer opens pointing directly to `/docs` or relevant module user guide.
