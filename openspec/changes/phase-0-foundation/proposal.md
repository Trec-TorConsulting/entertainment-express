# Change: Phase 0 — Foundation & Deployment

## Why
Nothing exists yet. Before any business feature can be built, we need the `entertainment_express` custom
Frappe app scaffolded, a container image bundling ERPNext + our app, and a working K3S deployment in the
`entertainment-express` namespace with MariaDB, Redis, Traefik wildcard TLS ingress, and Longhorn storage.
This phase delivers a **running but empty** platform with one base tenant site reachable over its subdomain
and nightly backups. Everything after this builds on it.

## What Changes
- Create the custom Frappe app `entertainment_express` (skeleton: `hooks.py`, `modules.txt`, module folders,
  `api/`, `www/`, `templates/`, `public/`, `patches/`, `fixtures/`, `tests/`).
- Create a Frappe **bench container image** with `erpnext` + `entertainment_express` installed; push to the
  private registry `192.168.4.10:30500`.
- Create K8s manifests in `HomeLab-Redo/entertainment-express/`: namespace, MariaDB StatefulSet (Longhorn
  PVC), Redis (cache/queue/socketio), Frappe workloads (`frappe-python`, `frappe-socketio`,
  `frappe-workers`, `frappe-scheduler`), sites PVC, ConfigMap, Secret (templates), wildcard Ingress, backup
  CronJob, and a site-init Job.
- Seed EE roles + minimal defaults via fixtures (roles created here; feature permissions filled in later
  phases).
- Bring up one **base site** (`admin.{base_domain}` will host the control plane in phase-1; in phase-0 we
  create a first working tenant-style site to prove routing).

## Impact
- Affected specs delivered (subset): `infrastructure-deployment` (all requirements), `platform-multitenancy`
  (Site-Per-Tenant Isolation runtime, Wildcard Subdomain Addressing — automated provisioning job comes in
  phase-1).
- New code: `entertainment_express/` app skeleton in this workspace.
- New infra: `HomeLab-Redo/entertainment-express/` manifests + Dockerfile.
- No business logic yet. No breaking changes (greenfield).

## Non-Goals
- Automated tenant provisioning workflow (phase-1).
- Any CRM/booking/billing feature.
- CI/CD pipeline (manual build+push is acceptable for phase-0).

## Requirements delivered (traceability)
- `infrastructure-deployment`: Isolated Namespace Deployment; Frappe Multi-Site Bench Runtime; Wildcard
  Ingress & TLS; Persistent Storage on Longhorn; Automated Backups; Secrets & Config Management.
- `platform-multitenancy`: Site-Per-Tenant Isolation (runtime); Wildcard Subdomain Addressing.
