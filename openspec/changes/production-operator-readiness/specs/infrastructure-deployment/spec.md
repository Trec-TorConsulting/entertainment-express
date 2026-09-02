## ADDED Requirements

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
