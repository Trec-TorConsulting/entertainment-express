## Why

Phases 0–26 are on main and `e2esmoke` is running `0.0.80-ee`, but operator docs still describe v0.0.1 / Helm / Stripe-only / no portals, `kubectl apply -f k8s-deployment.yaml` fails on immutable Jobs and the MariaDB StatefulSet, and website routes stay stale until someone remembers `bench --site all clear-cache`. An operator (or auditor) cannot tell what is actually live.

## What Changes

- Rewrite root `README.md`, `entertainment_express/README.md`, and replace `DEPLOYMENT_READINESS.md` so they match portals, kubectl (not Helm), image `0.0.80-ee+`, and honest pilot vs SaaS-SLA posture.
- Point `openspec/project.md` and `infrastructure-deployment` at `k8s-deployment.yaml` in this repo (not HomeLab-Redo).
- Add `scripts/deploy.sh` that applies mutable resources, rolls Frappe, clears website cache, and curls tenant health — Jobs/MariaDB STS are skipped on an existing cluster.
- Flush website cache when `frappe-python` starts so `/book` and other hook routes are live after an image roll.
- MariaDB NetworkPolicy: only Frappe pods in this namespace may reach port 3306.
- `smoke_test.py` must not fail 9/10 when a partial Frappe stub is on `PYTHONPATH`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `infrastructure-deployment`: manifests live in this repo; existing-cluster apply must not require mutating Jobs or MariaDB `volumeClaimTemplates`; python pods flush this bench’s website cache on start; MariaDB accepts 3306 only from EE Frappe pods.

## Impact

- Docs: `README.md`, `entertainment_express/README.md`, `DEPLOYMENT_READINESS.md`, `openspec/project.md`, `openspec/changes/ROADMAP.md`.
- Cluster: `k8s-deployment.yaml` (python start command, NetworkPolicy), `scripts/deploy.sh`, `scripts/k8s_apply.py`.
- Tests: `smoke_test.py`.
- No tenant DocTypes, no money math, no secrets in git.
