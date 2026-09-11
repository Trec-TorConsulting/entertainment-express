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

This repo is an enterprise-grade Frappe application and deployment platform. All roadmap phases **0–41**
and platform enhancements (Subcontractor Jobs, Coming Soon Landing, Tenant Website Builder, Client Portal Overhaul,
Atomix VirtualDJ Integration & AI Virtual DJ Suite) are fully implemented and verified
(archived under `openspec/changes/archive/`). Live image tag in [`k8s-deployment.yaml`](k8s-deployment.yaml)
is **`0.1.1-ee`**. Honest operator checklist: [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md).

---

## Capabilities

| Domain | What it does |
|---|---|
| **Control plane** | Operator site at `admin.<domain>` — self-service signup, 3-tier plans (Starter / Pro / Scale), entitlement enforcement, provisioning jobs, tenant lifecycle. |
| **Marketing front door** | `www.<domain>` public acquisition engine — SEO-optimized vertical pages, competitor comparisons, interactive showcase, blog/resource center, and operator-configurable Coming Soon teaser mode with early-access waitlist. |
| **CRM & Booking** | Event bookings, holds, catalog at `/book` and `/catalog`, interactive proposals, contracts, and conflict detection. |
| **Scheduling & dispatch** | Crew assignment, automated suggestions, run sheets, equipment checklists, site-fit logistics, load planning, and live client ETA tracking. |
| **Subcontractor Jobs** | External partner registry, automated margin calculation, white-label gig packets, and external tokenized offer accept/decline workflows. |
| **Workforce** | Roster, worker availability, compliance docs (COI/W-9), timesheets, pay runs, and field checklists. |
| **Equipment & Fleet** | Asset registry, QR/barcode check-in/out, consumable stock, maintenance logs, and vehicle weight-aware load planning. |
| **Event Planning Suite** | Collaborative event timeline/run-of-show builder, conditional planning forms, guest voting/chat, and music planning. |
| **VirtualDJ & DJ Software** | Native Atomix VirtualDJ folder (`.vdjfolder`), Serato CSV, Rekordbox XML, and M3U exports; tokenized real-time live request polling feed ("Ask The DJ"); post-gig session history log parsing & fuzzy reconciliation. |
| **AI Assistant & Virtual DJ** | Pluggable local Ollama / OpenAI / Gemini backend — conversational business assistant, smart quoting, forecast analytics, lead scoring, and automated Virtual DJ set curation with energy curve pacing. |
| **Tenant Website Builder** | In-portal visual Website Builder at `/owner/website`, custom tenant marketing pages at `/p/<route>`, conversion-optimized default tenant homepages, and embeddable booking widgets. |
| **Billing & payments** | Quotes, e-sign, deposits, damage pre-auth holds; **Stripe**, Square, PayPal, ACH — processor tokens only. Interactive client pay flow with tips and promo codes. |
| **White-label & Custom Domains** | Company brand kit + custom domains with automated Traefik TLS; full-site mode; website/logo brand style matcher (`/owner` Brand). |
| **Role-Based Portals** | Dedicated React + Vite SPAs for **`/owner`** (Today, Pipeline, Money, Brand, Website, Subcontractors), **`/employee`** (My Day, Dispatch, Timesheets), and **`/client`** (Home, Events, Pay, Documents, Planning, Appointments, Chat, Photos). Field PWA for crew. Operator Desk (`/app`) reserved for SaaS Operator / System Manager. |

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
openspec/                  # Spec-first (44 baseline specs; phases 0–41 + enhancements archived)
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
  -t registry.maddscientist.com/entertainment-express/bench:0.0.85-ee --load -f Dockerfile .

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
