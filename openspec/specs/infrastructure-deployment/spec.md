# Capability: Infrastructure & Deployment

## Purpose
Defines the K3S deployment of the EE Frappe bench (ERPNext + `entertainment_express`) in the
`entertainment-express` namespace of the HomeLab-Redo cluster, including data services, ingress, storage,
provisioning tooling, and backups. Manifests live in `HomeLab-Redo/entertainment-express/`.

### Components
- **Frappe bench image**: ERPNext + `entertainment_express`, multi-arch, pushed to `192.168.4.10:30500`.
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
