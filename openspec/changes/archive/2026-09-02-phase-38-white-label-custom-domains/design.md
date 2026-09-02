## Context

Phase 14 shipped owner `request_custom_domain` / `verify_custom_domain` (DNS IP overlap check → `site_config.domains`) and control-plane `Tenant Domain` for `/ops`, but Traefik still only terminates wildcard `*.app.{base_domain}` — custom hosts need manual operator work. Phase 20+ branding is logo/name/color on `EE Portal Settings` injected by `www/portal_spa.py`; product chrome and absolute URLs still default to the EE subdomain and “Entertainment Express” copy.

## Goals / Non-Goals

**Goals:**
- Company white-label chrome on `/owner`, `/employee`, `/client`, login, and public book.
- Custom domain DNS wizard + verify + automated ingress/TLS so those paths work on the tenant’s hostname.
- Canonical public base URL for notifications and redirects.
- Isolation preserved (no tenant DB cross-connect; no admin/www on tenant domains).

**Non-Goals:**
- WordPress / full CMS hosting (phase 30 covers tenant pages).
- Separate MariaDB per brand (phase 34).
- Apex EE marketing or control plane on a tenant domain.
- Automatic DNS record creation at the tenant’s registrar.

## Decisions

### D1 — Extend `EE Portal Settings` for white-label (not a new DocType)

| Field | Type | Purpose |
|-------|------|---------|
| `brand_favicon` | Attach Image | Favicon for portals + login |
| `hide_product_chrome` | Check | Suppress EE product name/marks in portal chrome |
| `email_from_name` | Data | Outbound from-name fallback when brand has none |
| `primary_custom_domain` | Data | Hostname chosen as canonical (must be verified) |
| existing `brand_name` / `brand_logo` / `brand_color` | — | Unchanged |

Rationale: Single is already the portal branding source; avoid a second settings document.

### D2 — Canonical URL helper

`entertainment_express.white_label.urls.get_public_base_url()`:
1. If `primary_custom_domain` is in verified `ee_custom_domains` → `https://{that}`
2. Else first verified custom domain
3. Else `https://{frappe.local.site}` (or `host_name`)

All notification links, portal absolute redirects, and booking share URLs call this helper. Relative portal navigation stays path-based (`/owner/...`) so Host switching just works.

### D3 — Custom domain live path

```
Owner enters hostname
  → request_custom_domain (pending)
  → UI shows CNAME target = default site host (e.g. acme.app.{base})
  → verify_custom_domain (IP intersection OR CNAME chain to default host)
  → append site_config.domains
  → signed POST to control-plane /api/method/...register_tenant_domain
       (site identity + HMAC/shared provisioner secret — never frappe.connect admin)
  → control plane upserts Tenant Domain (verified=1, tls_status=pending)
  → domain-ingress reconciler Job applies Ingress entertainment-express-custom-domains
  → Traefik HTTP-01 cert → tls_status=active; owner list_custom_domains shows status
```

Alternatives considered: DNS-01 per custom host (needs per-tenant DNS API — rejected); manual `/ops` only (rejected — product gap).

### D4 — Ingress shape

One Ingress `entertainment-express-custom-domains` in namespace `entertainment-express`:
- One rule per verified hostname → `frappe-python:8000` (`/`) and `frappe-socketio:9000` (`/socket.io`)
- Annotation `traefik.ingress.kubernetes.io/router.tls.certresolver: letsencrypt` (HTTP-01 capable resolver; wildcard DNS-01 stays for `*.app.*`)
- Reconciler reads **only** control-plane `Tenant Domain` rows (verified=1); never scans tenant MariaDB

### D5 — Portal host behavior

Frappe already maps Host → site via `domains`. Ensure www routes `/owner`, `/employee`, `/client`, `/book`, login remain site-relative. Bootstrap adds `canonical_host`, `hide_product_chrome`, `favicon`. SPAs set `document.title` / favicon from bootstrap; hide EE footer/marks when flag set.

### D6 — Multi-brand hosts

Brand `custom_host` verification reuses the same domain pipeline (site `domains` + Tenant Domain + ingress). Brand host selects brand chrome; company white-label is default when Host is primary company domain or default subdomain.

### D7 — Files

| Area | Path |
|------|------|
| Settings | `doctype/ee_portal_settings/ee_portal_settings.json` |
| URL helper | `entertainment_express/white_label/urls.py` |
| Domain APIs | `api/hardening.py` (wizard copy, CNAME check, primary domain, notify CP) |
| CP register | `api/control_plane_domains.py` (admin site only) |
| Bootstrap | `www/portal_spa.py`, login template hooks |
| Ingress | `k8s-deployment.yaml` + `scripts/reconcile_custom_domains.py` (or CronJob) |
| Owner UI | `frontend/owner-portal` Brand + Security workspaces |
| Tests | `tests/test_phase38_white_label_domains.py` |

## Risks / Trade-offs

- [HTTP-01 rate limits / failed certs] → Surface `tls_status=error` + retry; keep subdomain working always.
- [Stale Ingress after domain remove] → Soft-delete/unverify removes host from reconciler set within one Job interval.
- [Tenant spoofs another site’s domain] → Verify requires DNS pointing at **this** site’s addresses; CP registration includes site name claim checked against Tenant.site_name.
- [Cookie/CSRF across hosts] → Same site DB; session cookie `Domain` not set to parent EE domain; each host gets its own host-only cookie (document expected login-per-host).

## Migration Plan

1. Migrate `EE Portal Settings` fields (defaults: hide off, no primary domain).
2. Deploy reconciler + empty custom Ingress.
3. Existing verified `ee_custom_domains` backfill → CP register on next verify or one-shot patch.
4. Rollback: disable reconciler; subdomain + existing branding continue.

## Open Questions

- Exact Traefik certresolver name for HTTP-01 on the homelab (may differ from DNS-01 `letsencrypt`) — confirm in cluster before apply; document in operator notes.
