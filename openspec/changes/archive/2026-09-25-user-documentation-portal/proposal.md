## Why

Entertainment Express lacks a comprehensive, enterprise-grade, on-brand User Documentation and Help Knowledge Base. Tenants (Owners, Staff/Crew, Clients, and Operators) require self-service user documentation, workflow guides, visual feature walkthroughs, and API/integration reference to successfully configure, run, and scale their entertainment business on the platform.

## What Changes

- **User Documentation Portal (`/docs` & `/help`)**: A fully responsive, searchable, on-brand documentation site served natively via Frappe web routes (`/docs`, `/docs/<category>`, `/docs/<article>`) and integrated with Frappe's native `Help Article` & `Help Category` DocTypes with offline fallback data seed.
- **Role-Based Content Taxonomy**: Structured documentation organized into 5 primary user learning paths:
  1. **Getting Started & Onboarding**: System setup, domain configuration, white-label branding, stripe billing.
  2. **Owner & Operations Guide**: Service catalog, equipment & asset management, inventory BOMs, pricing rules, job costing & margin defense.
  3. **Field Crew & Staff Playbook**: Mobile PWA app, digital run sheets, check-in/check-out, time tracking, damage quarantine, tip splitting.
  4. **Client & Guest Experience**: Interactive proposal e-signing, planning forms, music selection & live "Ask the DJ" request feeds.
  5. **API & Integrations Reference**: REST API endpoints, webhooks, calendar sync (Google/M365), Twilio SMS, Stripe/Square checkout.
- **Enterprise UI Components**: Interactive instant search with keyboard shortcuts (`Cmd+K` / `Ctrl+K`), visual breadcrumbs, copyable code snippets, role badge filters, feedback collection ("Was this helpful?"), and print-friendly export stylesheet.
- **Help Center Integration**: In-app contextual help links embedded across `/owner`, `/employee`, and `/client` portals pointing to relevant `/docs` articles.

## Capabilities

### New Capabilities
- `user-documentation-portal`: Enterprise user documentation engine, role-based user guides, interactive search, and native Frappe help center synchronization.

### Modified Capabilities
- `owner-portal`: Add contextual Help Documentation links and header trigger pointing to `/docs`.
- `employee-portal`: Add field guide documentation links pointing to `/docs/crew`.
- `customer-portal`: Add client help guide links pointing to `/docs/client`.

## Impact

- **Frontend/Web Routes**: `entertainment_express/www/docs/index.py`, `entertainment_express/www/docs/index.html`, `entertainment_express/www/docs/article.py`, `entertainment_express/www/docs/article.html`, CSS styling tokens matching portal-kit aesthetics.
- **Data & Fixtures**: Seed fixtures for `Help Category` and `Help Article` records in `entertainment_express/fixtures/` and custom bootstrap module `entertainment_express/setup/documentation_seed.py`.
- **Portal Navigation**: Update navigation items across `/owner`, `/employee`, `/client` to feature contextual doc triggers.
