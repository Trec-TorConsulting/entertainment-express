# Entertainment Express

> Multi-tenant SaaS **ERP/CRM platform for mobile entertainment companies** — DJs, event production, staffing agencies, and equipment-rental operators.

![Platform](https://img.shields.io/badge/platform-Frappe%20v15%20%2F%20ERPNext-0089FF)
![Python](https://img.shields.io/badge/python-3.11%2B-3776AB)
![Delivery](https://img.shields.io/badge/delivery-Kubernetes%20(K3s)%20%2B%20Helm-326CE5)
![Tenancy](https://img.shields.io/badge/tenancy-database--per--company-6E4AFF)
![License](https://img.shields.io/badge/license-Proprietary-red)

Entertainment Express is a production-grade, **multi-tenant Platform-as-a-Service** built on
[Frappe](https://frappeframework.com/)/[ERPNext](https://erpnext.com/). Every company ("tenant")
runs as a **fully isolated Frappe site with its own database**, provisioned and governed by a
dedicated **control plane**. The platform includes purpose-built client apps for crew, customers,
and dispatch, and is delivered to a **Kubernetes (K3s)** cluster via Helm with automated,
idempotent site bootstrapping.

---

## Capabilities

| Domain | What it does |
|---|---|
| **Control plane** | Self-service tenant onboarding — Signup → approval → `Provisioning Job` → a brand-new isolated site. Plans, entitlements, and tenant lifecycle management. |
| **Booking** | Event bookings, holds/reservations with resource locking, line items, and asset assignment. |
| **Scheduling & dispatch** | Crew assignment, run sheets, equipment checklists, and at-risk-event flagging. |
| **Workforce** | Crew roster, availability, compliance documents, pay runs, and payout tracking. |
| **Service catalog** | Service packages, assets, and service-area coverage with travel-fee logic. |
| **Billing & payments** | Quotes, contracts (e-sign flow), deposits, and **Stripe** payment/webhook processing. |
| **Client apps** | Native crew app, customer portal, and dispatcher console. |

---

## Architecture

**Tenancy model — one Frappe *site* per company.** Each tenant's data (employees, clients,
equipment, bookings, billing) lives in a separate MariaDB database. A shared, stateless compute
tier serves every tenant; the requested host name selects the site (`dns_multitenant`).

```
                         ┌──────────────────────────────┐
   admin.<domain>  ─────▶│  Control plane (operator site)│  provisions tenants
                         └───────────────┬───────────────┘
                                         │ bench new-site + install + migrate
        <slug>.app.<domain> ─────────────▼──────────────────────────────┐
   ┌───────────┐   ┌───────────────┐   ┌───────────────┐   ┌────────────┐│
   │  Traefik  │──▶│ Frappe (web)  │──▶│   MariaDB     │   │   Redis    ││
   │  ingress  │   │ gunicorn+RQ   │   │ 1 DB / tenant │   │ cache/queue││
   └───────────┘   └───────────────┘   └───────────────┘   └────────────┘│
                         Shared, stateless compute • per-tenant isolation ┘
```

- **Compute (shared, stateless):** gunicorn web, Socket.IO realtime, RQ workers
  (default/short/long), and a singleton scheduler.
- **Data (per tenant):** one MariaDB database per site; Redis for cache/queue/realtime.
- **Provisioning:** an approved signup enqueues a long-running `Provisioning Job` that creates and
  bootstraps the tenant site — no infrastructure change required (wildcard ingress + wildcard TLS).

---

## Repository layout

```
entertainment_express/     # Frappe/ERPNext application (the core platform)
  control_plane/           #   tenant, plan, signup, provisioning-job doctypes + provisioner
  booking/ scheduling_dispatch/ hr_workforce/ billing_payments/ service_catalog/
  api/                     #   whitelisted API layer (booking, dispatch, payments, mobile v2, …)
  setup/                   #   install hooks, custom fields, plan seeds
frontend/
  crew-app/                # Crew mobile app
  customer-portal/         # Customer-facing portal
  dispatch-portal/         # Dispatcher operations console
openspec/                  # Spec-driven change management (specs + changes)
Dockerfile                 # Multi-arch bench image (linux/amd64 + linux/arm64)
k8s-deployment.yaml        # Reference Kubernetes manifest
smoke_test.py              # Post-deploy smoke checks
```

---

## Tech stack

- **Backend:** Frappe Framework v15, ERPNext, Python 3.11+, MariaDB 10.11, Redis
- **Frontend:** TypeScript / React Native client apps
- **Payments:** Stripe
- **Delivery:** Docker (multi-arch amd64 + arm64), Kubernetes (K3s), Helm, Traefik ingress,
  Longhorn storage, Let's Encrypt via Cloudflare DNS-01

---

## Deployment

The application is packaged as a multi-arch container image (official `frappe/erpnext` base +
this app) and deployed to a K3s cluster via a Helm chart. Bootstrapping of the base and
control-plane sites runs automatically as idempotent Helm post-install/upgrade hooks; per-tenant
sites are then created on demand by the control plane.

```bash
# Build & push the multi-arch bench image
docker buildx build --platform linux/amd64,linux/arm64 \
  -t <registry>/entertainment-express/bench:<tag> --push -f Dockerfile .
```

> The production Helm chart and cluster configuration are maintained in the private
> infrastructure repository. Secrets are **never** committed — they are supplied at deploy time
> via Kubernetes Secrets.

---

## Development

- Standard Frappe **bench** workflow (`bench get-app`, `bench --site <site> migrate`, …).
- Changes are proposed and tracked spec-first via **OpenSpec** (`openspec/`).
- **Trunk-based:** all changes land on `main` through a pull request with linear history.

---

## Security & production readiness

- **Isolation:** database-per-tenant; namespace-scoped deployment; wildcard TLS per environment.
- **Secrets:** provided as Kubernetes Secrets; nothing sensitive is committed to the repo.
- **Branch protection on `main`:** pull-request required, linear history enforced, force-push and
  deletion blocked, conversation resolution required, and secret-scanning push protection enabled.

---

## Contributing

This is a **single-maintainer, proprietary** project. The repository is public for transparency
and reference; **external pull requests and reviews are not accepted at this time.**

---

## License

**Proprietary.** Copyright © 2024–present **Trec-Tor Consulting** (Tobey Rector). All rights
reserved. See [`entertainment_express/license.txt`](entertainment_express/license.txt).
