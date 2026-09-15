## Context

Entertainment Express establishes a strict architectural boundary: `/app` is for SaaS operators; `/owner` is for tenant company owners. Business owners require full power to configure their accounting, tax, email, staff, and master data. Rather than building static bespoke screens for hundreds of ERPNext DocTypes, this design combines curated setup wizards for core workflows with a dynamic, schema-driven metadata renderer for deep master configuration.

## Goals / Non-Goals

**Goals:**
- Guarantee that a tenant owner never needs to enter `/app` to run their business.
- Provide curated setup wizards for Company Profile, Tax Templates, Chart of Accounts mapping, Payment Gateways, and Communication Templates.
- Provide a schema-driven master editor in `/owner/admin/data` that renders any permitted DocType dynamically with portal-kit styling.
- Provide an auditable Emergency Override Center for safety certificates and dispatch locks.

**Non-Goals:**
- Allowing tenant owners to modify Frappe framework internals (e.g. creating raw database doctypes, changing Python codebase, or modifying server-level site configurations).
- Permitting cross-tenant multi-site administration (isolated strictly to the calling tenant's site).

## Decisions

### 1. Dual-Interface Hybrid Architecture
- **Curated Tier**: Polished, dedicated React components for high-frequency settings (`/owner/settings/*`).
- **Dynamic Schema Tier**: Generic `DocTypeView` component in React that fetches `frappe.get_meta(doctype)`, maps Frappe fieldtypes (Data, Select, Currency, Link, Check, Table) to portal-kit primitives, and posts updates to standard Frappe REST endpoints.

### 2. Whitelisted Permitted DocTypes for Master Explorer
- To protect system integrity, only business and master configuration DocTypes are accessible via the Schema Explorer (e.g., `Terms and Conditions`, `Address`, `Contact`, `Item Tax Template`, `Notification Template`, `Salary Component`, `Holiday List`, `Cost Center`). System-level DocTypes (e.g., `User`, `DocType`, `Module Def`) remain restricted.

## Risks / Trade-offs

- **[Risk] Complex Custom Scripts & Client Events in Frappe Desk**: Standard Frappe client-side `cur_frm` scripts do not execute inside React SPAs.
  - *Mitigation*: All business logic and validation rules are executed server-side via Frappe controller validation hooks (`validate`, `before_save`), ensuring data integrity regardless of frontend client.
