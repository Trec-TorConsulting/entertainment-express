# Deployment readiness — Entertainment Express (homelab pilot)

**Date:** 2026-09-02  
**Status:** Pilot on K3s — **not** a SaaS-SLA / SOC2 production claim  
**Image (matches `k8s-deployment.yaml`):** `192.168.4.10:30500/entertainment-express/bench:0.0.80-ee`  
**Namespace:** `entertainment-express`

Phases 0–26 are on `main`. Live tenant smoke (`e2esmoke.entx.app`) includes catalog/booking data
(phase-1 task 10.2 is **done**, not pending).

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

- [ ] Secrets exist in-cluster (`ee-secrets`, `ee-stripe-secrets`); never commit real values
- [ ] Image tag in `k8s-deployment.yaml` matches what you built and pushed
- [ ] `TENANT_HOST=e2esmoke.entx.app ./scripts/deploy.sh` exits 0
- [ ] `GET https://e2esmoke.entx.app/api/method/ping` and `GET …/book` return 200
- [ ] After a python roll, `/book` is 200 **without** a manual `bench --site all clear-cache`
- [ ] `python3 smoke_test.py` and `openspec validate --specs` pass locally

---

## Known gaps (do not paper over)

- Homelab mixed-arch nodes; **bench images are linux/amd64** today
- Full `kubectl apply -f k8s-deployment.yaml` fails on completed Jobs and Helm-era MariaDB STS — use `scripts/deploy.sh`
- Logged-in portal QA is not automated
- Ticketing / marketplace / AI event decks are out of scope (phase 26 non-goals)
- No NetworkPolicy default-deny on the whole namespace (would break Traefik); MariaDB 3306 is restricted

---

## Rollback

Remove the MariaDB NetworkPolicy; revert the `frappe-python` start command if cache flush causes a start loop (`|| true` is already on `clear-cache`).
