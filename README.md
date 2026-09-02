# Entertainment Express

> Multi-tenant SaaS **ERP/CRM platform for mobile entertainment companies** — DJs, event production, staffing agencies, and equipment-rental operators.

![Platform](https://img.shields.io/badge/platform-Frappe%20v15%20%2F%20ERPNext-0089FF)
![Python](https://img.shields.io/badge/python-3.11%2B-3776AB)
![Delivery](https://img.shields.io/badge/delivery-Kubernetes%20(K3s)%20%2B%20kubectl-326CE5)
![Tenancy](https://img.shields.io/badge/tenancy-database--per--company-6E4AFF)
![License](https://img.shields.io/badge/license-Proprietary-red)

Entertainment Express is a **site-per-tenant** Frappe/[ERPNext](https://erpnext.com/) product: each
company is one Frappe site with its own MariaDB database. A shared gunicorn/RQ/scheduler tier serves
every site; the request host selects the tenant (`dns_multitenant`).

This repo is a **homelab pilot**, not a SaaS-SLA production claim. Phases 0–26 are on `main`. Live
image tag in [`k8s-deployment.yaml`](k8s-deployment.yaml) is **`0.0.80-ee`**. Honest operator
checklist: [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md).

---

## Capabilities

| Domain | What it does |
|---|---|
| **Control plane** | Operator site at `admin.<domain>` — signup, plans, provisioning jobs, tenant lifecycle. |
| **Booking** | Event bookings, holds, catalog at `/book` and `/catalog`, quotes and contracts. |
| **Scheduling & dispatch** | Crew assignment, run sheets, equipment checklists, at-risk flags. |
| **Workforce** | Roster, availability, compliance docs, pay runs (W2 payroll and Stripe Connect still stubs). |
| **Service catalog** | Packages, assets, service areas, travel fees. |
| **Billing & payments** | Quotes, e-sign, deposits; **Stripe**, Square, PayPal, ACH — processor tokens only. |
| **Tenant UI** | Logged-in portals: **`/owner`**, **`/employee`**, **`/client`**. Field PWA for crew. Operator Desk (`/app`) is for SaaS Operator / System Manager. |

---

## Architecture

**Tenancy — one Frappe site per company.** Shared compute; per-tenant MariaDB; Redis for cache/queue.

```
                         ┌──────────────────────────────┐
   admin.<domain>  ─────▶│  Control plane (operator site)│  provisions tenants
                         └───────────────┬───────────────┘
                                         │ bench new-site + install + migrate
        <slug>.<domain> ─────────────────▼──────────────────────────────┐
   ┌───────────┐   ┌───────────────┐   ┌───────────────┐   ┌────────────┐│
   │  Traefik  │──▶│ Frappe python │──▶│   MariaDB     │   │   Redis    ││
   │  ingress  │   │ gunicorn+RQ   │   │ 1 DB / tenant │   │ cache/queue││
   └───────────┘   └───────────────┘   └───────────────┘   └────────────┘│
                         Shared, stateless compute • per-tenant isolation ┘
```

Live tenant example: `e2esmoke.entx.app`. Marketing: `www.entx.app`.

---

## Repository layout

```
entertainment_express/     # Frappe app (DocTypes, APIs, www, patches)
frontend/
  owner-portal/            #   /owner SPA
  employee-portal/         #   /employee SPA
  customer-portal/         #   /client SPA
  dispatch-portal/         #   dispatch board assets
  crew-app/                #   field PWA
openspec/                  # Spec-first (31 baseline specs; phases 0–26 archived)
Dockerfile                 # Bench image (live builds are linux/amd64)
k8s-deployment.yaml        # Namespace, data services, Frappe, ingress, Jobs
scripts/deploy.sh          # Existing-cluster apply (skips Jobs / MariaDB STS)
secrets.example.yaml       # Placeholders only
smoke_test.py              # Post-change smoke checks
```

---

## Tech stack

- **Backend:** Frappe v15, ERPNext, Python 3.11+, MariaDB 10.11, Redis
- **Frontend:** React + Vite portals served from Frappe `www`; Field PWA for crew
- **Payments:** Stripe (primary), Square, PayPal, ACH
- **Delivery:** Docker **linux/amd64** bench image, Kubernetes (K3s), Traefik ingress, Longhorn, Let's Encrypt. **kubectl YAML in this repo** — not Helm as the live apply path.

---

## Deployment

Use [`scripts/deploy.sh`](scripts/deploy.sh) on a cluster that already has MariaDB and completed
site-init Jobs. A raw `kubectl apply -f k8s-deployment.yaml` is expected to fail on those Jobs and
on the Helm-era MariaDB StatefulSet `volumeClaimTemplates`; that is not a failed Frappe roll.

```bash
# 1) Build linux/amd64 and load (homelab registry is HTTP — see Dockerfile comments)
docker buildx build --builder ee-insecure-http --platform linux/amd64 \
  -t 192.168.4.10:30500/entertainment-express/bench:0.0.80-ee --load -f Dockerfile .

# 2) Secrets (edit a local copy — never commit real values)
kubectl -n entertainment-express apply -f secrets.example.yaml

# 3) Existing cluster: Deployments / Ingress / NetworkPolicy, wait python, curl tenant
TENANT_HOST=e2esmoke.entx.app ./scripts/deploy.sh
```

Fresh bootstrap only: delete the one-shot Jobs, then apply the full manifest (MariaDB STS is
created once). After that, always prefer `scripts/deploy.sh`.

Secrets stay out of git. `base-domain` in cluster config must match ingress hosts.

---

## Development

- Frappe **bench** (`bench --site <site> migrate`, …).
- Spec-first via **OpenSpec** (`openspec/`). `openspec validate --specs` (not per-change — “no deltas” is expected).
- **Trunk-based:** changes land on `main` through a pull request.

```bash
python3 smoke_test.py
```

---

## Security

- **Isolation:** database-per-tenant; no cross-site queries from tenant code.
- **Secrets:** Kubernetes Secrets only; placeholders in git.
- MariaDB TCP 3306 is limited by NetworkPolicy to pods labeled `app.kubernetes.io/name=entertainment-express`.

---

## Contributing

Single-maintainer, proprietary. The repository is public for transparency; **external pull requests are not accepted.**

---

## License

**Proprietary.** Copyright © 2024–present **Trec-Tor Consulting** (Tobey Rector). All rights
reserved. See [`entertainment_express/license.txt`](entertainment_express/license.txt).
