## Why

Tenants sell under their own company name. Today they get a logo/color on portals and a partial custom-domain verify path, but Traefik TLS is still an operator follow-up and `/owner`, `/employee`, and `/client` still feel like Entertainment Express on the default subdomain. Rivals (IO, HoneyBook, Goodshuffle) win deals when the client and crew experience looks like the tenant’s brand on the tenant’s domain.

## What Changes

- **Company white-label** beyond logo/color: favicon, hide EE product chrome, login/portal titles, email from-name, and canonical public base URL — all from `/owner` without Desk.
- **Custom domains end-to-end**: owner DNS wizard → verify → Frappe `domains` + control-plane `Tenant Domain` → automated Traefik host + LetsEncrypt TLS (HTTP-01) so `https://events.acme.com/owner|employee|client|/book` serves this tenant site.
- Absolute links in notifications, portal redirects, and share URLs use the verified primary custom domain when set.
- Multi-brand brand hosts continue to resolve on the same site; company white-label is the default chrome when no brand host matches.
- Non-goals: WordPress hosting; serving `admin.` / `www.` marketing on tenant domains; separate DB per brand; PBX; changing site-per-tenant isolation.

## Capabilities

### New Capabilities

- `white-label`: Per-tenant company identity chrome (logo, color, favicon, hide product marks, email from identity, canonical domain) applied to portals, login, public booking, and outbound links.

### Modified Capabilities

- `platform-multitenancy`: Verified custom domain becomes live with TLS and serves all tenant paths including portals.
- `infrastructure-deployment`: Ingress reconciler for verified custom hostnames + HTTP-01 certs to frappe-python/socketio.
- `owner-portal`: White-label Brand settings + custom-domain DNS wizard with TLS status; Security page upgraded.
- `employee-portal`: Branded chrome on custom (or default) host; no EE product marketing when white-label hide is on.
- `customer-portal`: Same white-label chrome and custom-host access for `/client`.
- `notifications`: Absolute action URLs and from-name use company white-label / primary domain.
- `identity-access`: Role landing and auth redirects preserve Host / canonical domain.
- `saas-control-plane`: Tenant Domain sync from verify; `/ops` shows TLS status; no tenant→admin DB opens.
- `ui-design-system`: Tenant token overrides + optional product-chrome suppression.
- `multi-brand`: Clarify company custom domain (site) vs brand host (logical brand on same site); both need ingress when verified.
- `booking-availability`: Public book/catalog URLs honor primary custom domain.

## Impact

- App: `EE Portal Settings` fields, `api/hardening.py` + white-label helpers, portal SPAs, login/www hosts, notification URL builders, tests `test_phase38_white_label_domains.py`.
- Infra: custom-domain Ingress reconcile Job/controller in `k8s-deployment.yaml` / scripts; control-plane `Tenant Domain` updates via signed API (not `frappe.connect` to admin from tenant).
- Isolation tests required: custom host for tenant A never resolves to tenant B; guests cannot manage domains.
- Depends on: phase-14 domain APIs, phase-20 portal settings, phase-34 multi-brand hosts, phase-25 portals.
