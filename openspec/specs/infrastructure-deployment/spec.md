# Capability: Infrastructure & Deployment

## Purpose
Defines the K3S deployment of the EE Frappe bench (ERPNext + `entertainment_express`) in the
`entertainment-express` namespace, including data services, ingress, storage, provisioning tooling, and
backups. Kubernetes manifests live in this repo (`k8s-deployment.yaml`, applied with `scripts/deploy.sh`);
the bench **Dockerfile** lives at the product repo root.

### Components
- **Frappe bench image**: ERPNext + `entertainment_express`, multi-arch, built from repo-root `Dockerfile`, pushed to `192.168.4.10:30500`.
- **Workloads**: `frappe-python` (gunicorn, :8000), `frappe-socketio` (:9000), `frappe-workers` (RQ),
  `frappe-scheduler`.
- **Data**: MariaDB (StatefulSet, Longhorn PVC), Redis (cache/queue/socketio).
- **Ingress**: Traefik wildcard `*.app.{base_domain}` + `admin.{base_domain}`, LetsEncrypt TLS.
- **Provisioner**: Job/CronJob that runs `bench new-site` + installs + bootstrap for new tenants.
- **Backups**: CronJob running per-site `bench backup` to MinIO.

## Requirements

### Requirement: Isolated Namespace Deployment
The system SHALL deploy all EE workloads in a dedicated `entertainment-express` namespace, separate from the
existing `frappe` namespace (www.trector.com).

#### Scenario: Namespace isolation
- **WHEN** EE is deployed
- **THEN** all EE resources live in `entertainment-express` and no existing namespace's resources are
  modified

### Requirement: Frappe Multi-Site Bench Runtime
The system SHALL run a Frappe bench capable of hosting multiple tenant sites, with python, socketio, worker,
and scheduler workloads scaled independently.

#### Scenario: Bench serves multiple sites
- **WHEN** two tenant sites exist on the bench
- **THEN** both are served by the same python/socketio/worker/scheduler deployments, resolved by Host header

#### Scenario: Workloads avoid GPU node
- **WHEN** EE non-AI workloads are scheduled
- **THEN** node affinity excludes node05 (GPU-only), and pods run on node01–04/06–07 with CPU/memory
  requests and limits set

### Requirement: Wildcard Ingress & TLS
The system SHALL expose tenants via Traefik with wildcard TLS routing tenant subdomains to `frappe-python`
(:8000) and `/socket.io` to `frappe-socketio` (:9000).

#### Scenario: Wildcard routing
- **WHEN** a request arrives for `anytenant.app.{base_domain}`
- **THEN** Traefik routes it to `frappe-python` with valid wildcard TLS, and `/socket.io` to
  `frappe-socketio`

### Requirement: Persistent Storage on Longhorn
The system SHALL use Longhorn PVCs for MariaDB data and the Frappe sites volume (shared assets/config).

#### Scenario: Data survives pod restart
- **WHEN** a MariaDB or Frappe pod restarts
- **THEN** site data and databases persist via their Longhorn PVCs

### Requirement: Tenant Provisioning Tooling
The system SHALL provide a containerized provisioner (Job/CronJob) that creates and bootstraps tenant sites
on demand, driven by the control plane.

#### Scenario: Provisioner creates a site
- **WHEN** the control plane enqueues a provisioning request
- **THEN** the provisioner runs `bench new-site`, installs `erpnext` + `entertainment_express`, runs
  bootstrap, and reports success/failure back to the control plane

### Requirement: Automated Backups
The system SHALL back up each tenant site's database and files on a schedule to MinIO with retention.

#### Scenario: Nightly backup
- **WHEN** the backup CronJob runs
- **THEN** each active site is backed up to MinIO, old backups beyond the retention window are pruned, and
  failures are surfaced

### Requirement: Secrets & Config Management
The system SHALL source all credentials (DB, Redis, Stripe, Twilio, SMTP, S3, AI keys) from Kubernetes
Secrets, with repo files containing placeholders only.

#### Scenario: No plaintext secrets in repo
- **WHEN** the manifests are inspected
- **THEN** `secret.yaml` contains placeholder values only, and running pods read real values from cluster
  Secrets

### Requirement: Ollama On The GPU Node
The system SHALL run Ollama in namespace `entertainment-express` scheduled only on node05 with the `gpu-only` toleration. Frappe bench pods SHALL continue to exclude node05.

#### Scenario: GPU isolation
- **WHEN** the Ollama Deployment is applied
- **THEN** it targets node05 with `gpu-only:NoSchedule` toleration, and frappe-python node affinity still NotIn node05

### Requirement: Backup Last-Run Visible To Operator
The system SHALL record the last successful backup timestamp on the sites volume and show it on `/ops` for `SaaS Operator` / `System Manager`. Restore SHALL remain an operator bench procedure, not a tenant whitelist.

#### Scenario: Operator reads last backup
- **WHEN** a SaaS Operator opens `/ops` after a backup job has written the stamp file
- **THEN** they see the last backup time without MinIO credentials

### Requirement: Site Readiness Probe
The system SHALL expose a guest-allowed ready probe that checks this site's database only and returns `{ok: true}` without naming other sites.

#### Scenario: Ready checks this database
- **WHEN** the probe runs
- **THEN** it queries the current site connection and does not call `frappe.init` or `frappe.connect` for another site

### Requirement: Manifests In This Repo
Kubernetes for Entertainment Express SHALL live in this product repo as `k8s-deployment.yaml` (plus `scripts/deploy.sh` / `scripts/k8s_apply.py`). Docs SHALL NOT tell operators the live manifests are only in HomeLab-Redo.

#### Scenario: Operator finds the apply path
- **WHEN** they open the root README
- **THEN** deploy steps point at `k8s-deployment.yaml` and `scripts/deploy.sh` in this repository

### Requirement: Existing Cluster Apply Is Safe
On a cluster that already has MariaDB and completed site-init Jobs, applying SHALL update Frappe Deployments and related mutable objects without requiring a successful patch of those Jobs or of MariaDB `volumeClaimTemplates`.

#### Scenario: Redeploy after an image or command change
- **WHEN** an operator runs `scripts/deploy.sh`
- **THEN** the command exits 0 and `frappe-python` rolls; Job and MariaDB STS errors are not a failed deploy

### Requirement: Website Cache Flush On Python Start
Each `frappe-python` start SHALL flush this bench’s website cache so `website_route_rules` from the running app are visible without a manual `bench --site all clear-cache`.

#### Scenario: /book after a roll
- **WHEN** python pods start after a route-rule change
- **THEN** `GET https://{tenant}/book` is not a stale 404 from the previous missing `book` page

### Requirement: MariaDB Only From This Namespace Frappe
MariaDB in `entertainment-express` SHALL accept TCP 3306 only from pods labeled `app.kubernetes.io/name=entertainment-express` in that namespace.

#### Scenario: Unrelated pod cannot speak SQL
- **WHEN** a NetworkPolicy is applied
- **THEN** non-matching pods cannot connect to MariaDB:3306; Frappe python/workers/scheduler still can
