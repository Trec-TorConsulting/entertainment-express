## Context
Switching cost often is “my website.” BCN/IO win by bundling site+booking. EE should own the booking OS and offer pages + embeds.

## Goals / Non-Goals
**Goals:** Simple page CMS; embed JS snippet; public read APIs.
**Non-Goals:** Theme marketplace; arbitrary PHP; control-plane marketing site changes.

## Decisions
### D1 — EE Website Page DocType
`route`, `title`, `body` (HTML sanitized), `published`, `seo_*`. Served under tenant host `/p/{route}` or root mapping for home.

### D2 — Embed snippet
`/assets/entertainment_express/embed.js` loads widgets with `data-tenant` + `data-widget`. Calls `/api/method/entertainment_express.api.embed.*` with site resolution from host or public site key.

### D3 — Public site key
`EE Portal Settings.public_embed_key` rotated by owner; rate limit Redis per key.

### D4 — Files
`api/embed.py`, `www/` page renderer, owner Website workspace, tests `test_phase30_tenant_website.py`.

## Migration

Fixtures + patches; rollback by feature flag / unused fields.
