## Context

Every tenant in Entertainment Express receives a dedicated sub-domain (e.g. `https://<tenant>.entx.app/`) mapped to their tenant site. Currently, `tenant_home.html` displays a bare, 3-button placeholder. Owners who wish to establish their web presence or customize their homepage have no visual editor; the legacy `/website` workspace is an unstyled, rudimentary form that only supports basic raw HTML pages and embed keys.

This design introduces a high-converting default homepage template for all tenants, an owner-facing onboarding guide on the public site, and a visual Website Builder in the Owner Portal matching the "Today" design system.

## Goals / Non-Goals

**Goals:**
- Provide an out-of-the-box, premium default landing page on `https://<tenant>.entx.app/` featuring the company's brand colors, hero headline, service packages, trust badges, and lead capture.
- Display an onboarding helper banner for logged-in owners viewing their tenant site with a direct deep-link to the Website Builder.
- Replace the legacy `/website` form with a flagship `WebsitePage` component in `frontend/owner-portal/src/app/routes/website/WebsitePage.tsx` adhering to the "Today" page layout (`max-w-5xl mx-auto`, hero header, elevated cards).
- Support homepage section controls (Hero, Featured Packages, Reviews & Trust Signals, Contact & Inquiries).
- Retain existing custom pages (`/p/<route>`) and embeddable widget capabilities with an uplifted UI.

**Non-Goals:**
- Arbitrary drag-and-drop WYSIWYG DOM builders (e.g. Elementor/Webflow clone); the platform enforces a clean, vertical-appropriate structured section builder.
- Multi-theme switching engine outside of the white-label branding tokens.

## Decisions

### Decision 1: Section-Based Configuration stored in `EE Portal Settings`
- **Choice**: Store homepage section settings (`hero_headline`, `hero_subtitle`, `hero_cta_text`, `hero_cta_url`, `hero_image`, `show_packages`, `show_reviews`, `show_contact`, `value_props_json`) directly on `EE Portal Settings`.
- **Rationale**: `EE Portal Settings` already handles brand identity, public embed keys, and portal configuration. Adding structured website builder fields avoids creating yet another DocType while preserving single-record site isolation.
- **Alternative Considered**: Creating a new `EE Website Config` DocType. Rejected to avoid redundant singleton migrations when `EE Portal Settings` already holds brand metadata.

### Decision 2: Hybrid SSR Landing Page with Live Storefront Data
- **Choice**: `tenant_home.html` renders using server-side Jinja in Frappe, injecting tenant branding, active service packages (`Event Package` DocTypes), and review metrics into the template.
- **Rationale**: Guarantees zero latency on initial load, optimal SEO indexing for tenant Google rankings, and native compatibility with Frappe's web caching.

### Decision 3: Authenticated Owner Quick-Start Banner
- **Choice**: If `frappe.session.user` has an owner or manager role when viewing `tenant_home.html`, render a dismissible top banner:
  > *"👋 Welcome to your storefront! Edit this page, customize packages, and update your branding in the **[Website Builder](/owner/website)**."*
- **Rationale**: Directly solves owner confusion when visiting their new site by providing clear in-context guidance on where and how to customize it.

### Decision 4: Flagship React Website Builder in Owner Portal
- **Choice**: Create `frontend/owner-portal/src/app/routes/website/WebsitePage.tsx` using `@portal-kit` primitives (`Card elevated`, `FormField`, `Tabs`, `Button`, `Input`).
- **Layout**:
  - Hero Header with "View Live Website" button.
  - Tab 1: **Homepage Sections** (Hero, Value Props, Section Toggles).
  - Tab 2: **Custom Pages** (Table of `/p/<route>` pages with status badges and create/edit modal).
  - Tab 3: **Embeddable Widgets** (Code generator, copy button, key rotation).
  - Live Side-by-Side Preview of changes.

## Risks / Trade-offs

- **[Risk]** Jinja SSR styling might conflict with custom white-label overrides.  
  &rarr; **Mitigation**: Use pure CSS variables (`var(--ee-brand)`, `var(--ee-text)`, `var(--ee-bg)`) and standard responsive utilities scoped to `.ee-tenant-home`.
- **[Risk]** Package showcase on homepage might show unapproved or internal packages.  
  &rarr; **Mitigation**: Filter packages by `is_active = 1` and `show_in_storefront = 1` matching public booking storefront logic.
