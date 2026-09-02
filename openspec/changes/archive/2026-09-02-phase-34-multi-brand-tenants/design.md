## Context
Multi-brand operators want one inventory/dispatch brain and many storefront faces.

## Goals / Non-Goals
**Goals:** Brand DocType; host/path routing; catalog filter; notification identity.
**Non-Goals:** Separate MariaDB per brand; franchise billing across legal entities (use multiple tenants).

## Decisions
### D1 — EE Brand inside tenant site
Fields: name, slug, logo, primary_color, custom_host optional, path_prefix, email_from. Default brand always exists.

### D2 — Routing
Hostname alias or `/{slug}` on tenant booking site selects brand; inventory can be shared or brand-filtered via package.brand.

### D3 — Files
`api/brand.py`, www brand resolve, tests `test_phase34_multi_brand.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
