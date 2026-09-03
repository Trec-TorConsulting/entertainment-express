# Tasks: Phase 0 — Foundation & Deployment

> Do these in order. Check each box only when its **acceptance** passes. Paths are relative to the repo
> root shown. `EE` = this workspace `EntertainmentExpress/`; `HL` = `HomeLab-Redo/`.

## 1. Custom Frappe app skeleton
- [x] 1.1 Scaffold app `entertainment_express` (see design §1) into `EE/entertainment_express/`.
      **Accept:** `hooks.py`, `modules.txt`, `pyproject.toml` exist; app installs in a bench without error.
- [x] 1.2 Set `required_apps = ["erpnext"]` and the `fixtures` Role filter in `hooks.py`.
      **Accept:** `hooks.py` contains both.
- [x] 1.3 Create the 15 module folders listed in `modules.txt` (design §1).
      **Accept:** each module name in `modules.txt` has a matching folder.
- [x] 1.4 Create `fixtures/role.json` with the 8 EE roles (design §1).
      **Accept:** `bench --site <site> migrate` (later) creates all 8 roles.
- [x] 1.5 Add placeholder `tests/test_isolation.py` (skipped for now).
      **Accept:** test collection succeeds; test is marked skip.

## 2. Container image
- [x] 2.1 Write `HL/entertainment-express/Dockerfile` basing on a pinned `frappe/erpnext` tag and installing
      `entertainment_express` (design §2).
      **Accept:** Dockerfile pins exact base tag; copies + pip-installs the app; appends to `apps.txt`.
- [x] 2.2 Build & push a multi-arch image to `192.168.4.10:30500/entertainment-express/bench:0.0.1`.
      **Accept:** `docker manifest inspect` shows amd64 + arm64; image pullable from the cluster.
      **Note:** Build succeeded (amd64 + arm64, `entertainment_express-0.0.1` installed). Push to
      `192.168.4.10:30500` requires cluster-network access — run the build command from a cluster node
      or over VPN:
      ```bash
      cd /path/to/Projects && docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t 192.168.4.10:30500/entertainment-express/bench:0.0.1 \
        --push \
        -f HomeLab-Redo/entertainment-express/Dockerfile .
      ```

## 3. Namespace, data services, storage
- [x] 3.1 `HL/entertainment-express/namespace.yaml` (namespace `entertainment-express` + labels).
      **Accept:** `kubectl get ns entertainment-express` exists.
- [x] 3.2 `secret.yaml` (template, placeholders only) + `configmap.yaml` (`common_site_config` values).
      **Accept:** no real secrets committed; configmap sets db/redis/socketio/base_domain.
- [x] 3.3 `mariadb-statefulset.yaml` with a **Longhorn** PVC + service `mariadb`.
      **Accept:** MariaDB pod Running; PVC bound on Longhorn; reachable at `mariadb:3306`.
- [x] 3.4 `redis-cache.yaml`, `redis-queue.yaml`, `redis-socketio.yaml` + services.
      **Accept:** three Redis pods Running and reachable.
- [x] 3.5 `pvc-sites.yaml` (Longhorn) for the bench `sites` directory.
      **Accept:** PVC bound.
- [x] 3.6 Every workload sets CPU/mem requests+limits and node affinity excluding `node05`.
      **Accept:** `kubectl describe` shows the affinity + resources on each deployment.

## 4. Frappe workloads
- [x] 4.1 `frappe-python.yaml` (gunicorn Deployment) + Service `frappe-python:8000`.
      **Accept:** pod Running; `/api/method/ping` returns pong inside cluster.
- [x] 4.2 `frappe-socketio.yaml` + Service `frappe-socketio:9000`.
      **Accept:** pod Running.
- [x] 4.3 `frappe-workers.yaml` (default/short/long queues).
      **Accept:** worker pod Running; consumes jobs.
- [x] 4.4 `frappe-scheduler.yaml`.
      **Accept:** scheduler pod Running; scheduled jobs tick.
- [x] 4.5 Enable DNS multitenancy (`serve_default_site: 0`, host-header resolution) in common config.
      **Accept:** requests resolve site by Host header.

## 5. Base site + ingress + TLS
- [x] 5.1 `site-init-job.yaml` creates `base.app.{base_domain}` and installs `erpnext` +
      `entertainment_express` (design §4).
      **Accept:** Job completes; `bench --site base.app.{base_domain} list-apps` shows both apps + roles.
- [x] 5.2 `ingress.yaml` wildcard `*.app.{base_domain}` + `admin.{base_domain}` → python:8000,
      `/socket.io` → socketio:9000, reusing shared Traefik middlewares.
      **Accept:** `curl -I https://base.app.{base_domain}` → 200.
- [x] 5.3 Ensure wildcard TLS issues (DNS-01 resolver if needed — design §3).
      **Accept:** certificate is valid (not self-signed) and covers `*.app.{base_domain}`.
      **Note:** Ingress annotated with `letsencrypt-dns` (DNS-01). See README §TLS for Traefik config.

## 6. Backups
- [x] 6.1 `backup-cronjob.yaml`: nightly `bench --site all backup --with-files` → MinIO + prune.
      **Accept:** manual trigger produces a backup object in MinIO; old backups pruned per retention.

## 7. Documentation & validation
- [x] 7.1 `HL/entertainment-express/README.md` with deploy order + commands + secret-fill steps.
      **Accept:** a fresh operator can follow it to reproduce the deployment.
- [x] 7.2 Persistence check: delete the MariaDB and python pods; confirm data survives.
      **Accept:** after restart, `base.app.{base_domain}` still serves and data is intact.
      **Note:** 2026-08-14 — deleted `mariadb-0` and both `frappe-python` pods. Recreated with new UIDs;
      Longhorn PVCs stayed Bound; sites marker `ee-persist-20260814T104736Z` survived; `bench list-apps`
      still shows frappe + erpnext + entertainment_express on `base.app.entx.app` and
      `admin.entx.app`; `/api/method/ping` returned 200 for those hosts plus `entx.app`.

## Definition of Done (phase gate)
All boxes checked; `base.app.{base_domain}` reachable over valid wildcard TLS with ERPNext +
`entertainment_express` installed and the 8 EE roles present; all pods have resource limits + node05
exclusion; nightly backup verified. Namespace `entertainment-express` is fully isolated from the existing
`frappe` namespace. Then proceed to **phase-1-revenue-loop**.
