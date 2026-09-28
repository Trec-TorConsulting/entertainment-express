## Context

Entertainment Express is an enterprise multi-tenant ERP platform serving complex operational workflows for DJs, photo booths, game trucks, event rentals, and performers. Users require high-quality, clear, on-brand documentation to master the platform quickly. 

Frappe provides native `Help Article` and `Help Category` DocTypes. We will build an enterprise-grade documentation portal at `/docs` (with aliases `/help`, `/docs/<category>`, `/docs/<article_slug>`) that dynamically renders articles stored in Frappe's `Help Article` DocType while maintaining a fall-back seed of pre-packaged enterprise guides when database articles are empty or initializing.

## Goals / Non-Goals

**Goals:**
- Provide an enterprise-grade, responsive, dark-mode ready documentation hub at `/docs` and `/docs/<category_or_article>`.
- Full integration with Frappe `Help Article` and `Help Category` DocTypes.
- Provide a robust seed module (`entertainment_express.setup.documentation_seed`) that automatically creates standard documentation categories and comprehensive production-ready articles on app installation / migration.
- Provide interactive instant search (with `Cmd+K` keyboard shortcut), role badge filtering (Owner, Field Crew, Client, Developer/API), visual breadcrumbs, copyable code blocks, and feedback collection ("Was this article helpful?").
- Contextual in-app help links from `/owner`, `/employee`, and `/client` portals.

**Non-Goals:**
- Creating a separate external documentation hosting site (e.g., GitBook or Docusaurus) — keeping everything native in Frappe app guarantees site-per-tenant white-label consistency and zero extra infrastructure cost.

## Decisions

1. **Native Frappe WWW Pages + Dynamic Python Controller**:
   - `entertainment_express/www/docs/index.py` & `index.html` handle category listing, search API, and article rendering seamlessly under Frappe's website framework.
   - Rationale: Fully compatible with Frappe's multi-tenant bench, white-labeling, and zero external deployment dependencies.

2. **Enterprise Default Seed Articles**:
   - Create comprehensive default guides covering all 5 core learning paths:
     1. Getting Started & Account Setup
     2. Operations & Inventory Management
     3. Mobile Field Crew Playbook
     4. Client & Guest Experience
     5. REST API & Integration Webhooks
   - Rationale: Ensures out-of-the-box 100% production readiness even before tenant admins customize articles.

3. **In-Portal Contextual Direct Linking**:
   - Add help triggers in `/owner` topbar, `/employee` navigation, and `/client` footer directing users straight to relevant doc paths.

## Risks / Trade-offs

- [Database query latency on large doc searches] → Mitigated by caching help categories and articles in Redis with key `ee_docs_categories` and client-side instant filter.
