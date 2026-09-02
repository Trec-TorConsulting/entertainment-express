# Tasks: Phase 38 — White-Label & Custom Domains

> Traceability: `white-label`, `platform-multitenancy`, `infrastructure-deployment`, portals, `notifications`, `identity-access`, `saas-control-plane`, `ui-design-system`, `multi-brand`, `booking-availability`.

## 1. Schema & helpers

- [x] 1.1 Extend `EE Portal Settings` with `brand_favicon`, `hide_product_chrome`, `email_from_name`, `primary_custom_domain`; migrate existing sites.
- [x] 1.2 Add `entertainment_express/white_label/urls.py` (`get_public_base_url`) and wire portal bootstrap (`www/portal_spa.py`) to expose branding + hide flag + favicon + canonical host.

## 2. Domains & control plane

- [x] 2.1 Upgrade `api/hardening.py`: CNAME/DNS guidance payload, optional CNAME-chain verify, set/clear primary domain, notify control plane on verify/unverify (no `frappe.connect` to admin).
- [x] 2.2 Control-plane `register_tenant_domain` API + Tenant Domain tls_status updates; reject spoofed site claims; `/ops` lists status.

## 3. Ingress reconciler

- [x] 3.1 Add `entertainment-express-custom-domains` Ingress + CronJob/script that publishes verified Tenant Domain hosts to frappe-python/socketio with HTTP-01 TLS; document certresolver in operator notes.

## 4. Portals & notifications

- [x] 4.1 Owner Brand + Security UI: white-label form, DNS wizard, verify, primary domain, TLS status.
- [x] 4.2 Employee/client SPAs + login: apply favicon, brand tokens, hide-product-chrome; preserve Host on role landing.
- [x] 4.3 Notification absolute URLs + from-name use canonical domain / white-label; booking share links same.

## 5. Tests & validation

- [x] 5.1 `tests/test_phase38_white_label_domains.py`: guest 403 on domain/settings; verify adds domains; canonical URL; isolation (tenant A host ≠ tenant B); brand host reuses pipeline.
- [x] 5.2 `openspec validate --specs`; run `bench --site <site> run-tests --app entertainment_express` and `python smoke_test.py` before PR.
