# Deployment readiness — Entertainment Express (homelab pilot)

**Date:** 2026-09-03  
**Status:** Pilot on K3s — **not** a SaaS-SLA / SOC2 production claim  
**Image (matches `k8s-deployment.yaml`):** `registry.maddscientist.com/entertainment-express/bench:0.0.85-ee`  
**Namespace:** `entertainment-express`

Phases **0–39** are implemented (OpenSpec archives). Live tenant smoke (`e2esmoke.entx.app`) includes
catalog/booking data (phase-1 task 10.2 is **done**, not pending). White-label phases 38–39 are on
`0.0.82-ee` with `phase38` / `phase39` patches applied on `e2esmoke.entx.app`.

---

## What is live

- Site-per-tenant Frappe + ERPNext + this app
- Public: home, `/book`, `/catalog`, `/request-quote`, login; marketing `www.entx.app`
- Logged-in portals: `/owner`, `/employee`, `/client` (login-gated; walkthrough is a human session)
- Field PWA for crew (not a native React Native store app as the primary client)
- Payments: Stripe + Square + PayPal paths; **Stripe Connect and W2 payroll remain stubs**
- Apply path: [`scripts/deploy.sh`](scripts/deploy.sh) — **not Helm**

---

## Operator checklist

- [x] Secrets exist in-cluster (`ee-secrets`, `ee-stripe-secrets`); never commit real values
- [x] Image tag in `k8s-deployment.yaml` matches what you built and pushed
- [x] `TENANT_HOST=e2esmoke.entx.app ./scripts/deploy.sh` exits 0
- [x] `GET https://e2esmoke.entx.app/api/method/ping` and `GET …/book` return 200
- [x] After a python roll, `/book` is 200 **without** a manual `bench --site all clear-cache`
- [x] `python3 smoke_test.py` and `openspec validate --specs` pass locally

---

## Known gaps (do not paper over)

- Homelab mixed-arch nodes; **bench images are linux/amd64** today — Frappe/Redis/MariaDB Deployments
  and bench CronJobs pin `kubernetes.io/arch=amd64` so pods do not schedule on ARM nodes
- Full `kubectl apply -f k8s-deployment.yaml` fails on completed Jobs and Helm-era MariaDB STS — use `scripts/deploy.sh`
- Logged-in portal QA is not automated (human walkthrough)
- Ticketing / marketplace / AI event decks are out of scope (phase 26 non-goals)
- No NetworkPolicy default-deny on the whole namespace (would break Traefik); MariaDB 3306 is restricted

## Custom domains (phase 38)

- Owner verifies DNS (CNAME → `{slug}.app.{base}`); site adds Host to Frappe `domains`.
- Control plane records `Tenant Domain`; CronJob `entertainment-express-domain-reconcile` publishes
  Ingress `entertainment-express-custom-domains`.
- Traefik certresolver for custom hosts: **`letsencrypt`** (HTTP-01). Confirm the cluster resolver
  accepts HTTP-01 for arbitrary hostnames; wildcard DNS-01 on `*.app.*` stays on the main Ingress.
- Set `ee_control_plane_url` + `ee_domain_register_secret` on tenant sites (same secret as
  `domain-register-secret` in secrets). Without these, verify still works locally; ingress sync waits
  for operator/backfill.

## Full-site white-label (phase 39)

- After migrate, `EE Portal Settings.white_label_mode` is `full` if hide-product was on, else `portals`.
- Owner Brand (`/owner/brand`): extended kit (colors/fonts/logos/footer), Match style from https URL
  and/or logo, preview iframes (`?ee_brand_preview=1`), then Apply.
- Tenant public pages + portal chrome + client email wrappers use the kit when mode is `full`.
- EE SaaS marketing (`www` / control plane) does **not** load tenant kit.
- Style matcher is rate-limited (10/hour/user) and rejects private/link-local URLs (SSRF guard).
- `bench --site <tenant> migrate` applies `phase39_full_site_white_label` patch.

---

## Rollback

Remove the MariaDB NetworkPolicy; revert the `frappe-python` start command if cache flush causes a start loop (`|| true` is already on `clear-cache`).
