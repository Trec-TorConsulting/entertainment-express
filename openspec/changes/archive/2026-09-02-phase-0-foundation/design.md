# Design: Phase 0 — Foundation & Deployment

> Read `openspec/project.md` §5, §8 (repo layout, infra conventions) before starting. All values shown as
> `{base_domain}` default production value: `entx.app`.

## 1. Custom Frappe app skeleton

Create the app with the bench CLI (inside a Frappe bench dev environment or the build container):

```bash
bench new-app entertainment_express \
  --app-title "Entertainment Express" \
  --app-description "Multi-tenant SaaS ERP/CRM for mobile entertainment companies" \
  --app-publisher "Trec-Tor Consulting" \
  --app-license "Proprietary"
```

Resulting structure to commit to this workspace:

```
entertainment_express/
├─ pyproject.toml
├─ license.txt
├─ README.md
└─ entertainment_express/
   ├─ __init__.py                 # __version__ = "0.0.1"
   ├─ hooks.py                    # app_name, required_apps = ["erpnext"], fixtures list
   ├─ modules.txt                 # one line per EE module (see below)
   ├─ patches.txt                 # empty for now
   ├─ config/                     # desktop.py, docs.py
   ├─ api/                        # __init__.py (whitelisted endpoints added in later phases)
   ├─ www/                        # public web pages (booking site — phase-1)
   ├─ templates/                  # portal pages/includes
   ├─ public/                     # js/css/pwa assets
   ├─ fixtures/                   # roles.json (EE roles), custom fields (later phases)
   ├─ patches/
   └─ tests/
       └─ test_isolation.py       # placeholder multi-tenant isolation test (skipped until phase-1)
```

**Modules** (`modules.txt`) — create the module folders now, fill DocTypes in later phases:
```
Entertainment Express Core
Service Catalog
Booking
Scheduling Dispatch
Workforce
Billing Payments
Marketing
Integrations
AI Assistant
Control Plane
Event Planning
Music
Appointments
Venues Vendors
Data Migration
```

**`hooks.py` essentials:**
```python
app_name = "entertainment_express"
app_title = "Entertainment Express"
required_apps = ["erpnext"]
fixtures = [
    {"dt": "Role", "filters": [["name", "like", "EE %"]]},
]
```

**EE roles fixture** (`fixtures/role.json`) — create these Roles so later phases attach permissions:
`EE Tenant Admin`, `EE Sales`, `EE Dispatcher`, `EE Accounting`, `EE Marketing`, `EE Crew`, `EE Customer`,
`SaaS Operator`.

## 2. Container image (bench with ERPNext + EE)

Use the official Frappe/ERPNext container approach. Create `HomeLab-Redo/entertainment-express/Dockerfile`
based on `frappe/erpnext` (or a custom bench build) that also installs `entertainment_express` from this
repo. Must produce a **multi-arch** image (`linux/amd64,linux/arm64`) because the cluster is mixed ARM64/
x86_64.

```dockerfile
# Base on a pinned frappe/erpnext image matching the target Frappe/ERPNext version.
FROM frappe/erpnext:v15  # pin exact tag
# Copy and install the custom app into the bench
COPY entertainment_express /home/frappe/frappe-bench/apps/entertainment_express
RUN cd /home/frappe/frappe-bench && \
    ./env/bin/pip install -e apps/entertainment_express && \
    echo "entertainment_express" >> sites/apps.txt
```

Build & push (documented; may be manual for phase-0):
```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t 192.168.4.10:30500/entertainment-express/bench:0.0.1 --push \
  -f HomeLab-Redo/entertainment-express/Dockerfile .
```

> If a single multi-arch bench image is impractical initially, pin app workloads to x86_64 nodes
> (node06/07) via node affinity and note it — but the target is multi-arch.

## 3. Kubernetes manifests (`HomeLab-Redo/entertainment-express/`)

Mirror the existing `HomeLab-Redo/frappe/` patterns (which serve www.trector.com) but in the **new**
`entertainment-express` namespace. Files:

| File | Purpose |
|------|---------|
| `namespace.yaml` | `Namespace entertainment-express` with labels |
| `secret.yaml` | **template** — DB root/app pw, admin pw, Stripe/Twilio/SMTP/S3/AI keys (placeholders) |
| `configmap.yaml` | `common_site_config.json` values: db host, redis URLs, socketio, base_domain |
| `mariadb-statefulset.yaml` | MariaDB 10.6+, Longhorn PVC (e.g. 20Gi), service `mariadb` |
| `redis-cache.yaml` / `redis-queue.yaml` / `redis-socketio.yaml` | three Redis deployments+services |
| `pvc-sites.yaml` | Longhorn PVC for `/home/frappe/frappe-bench/sites` (ReadWriteMany if supported, else RWO with single writer) |
| `frappe-python.yaml` | Deployment (gunicorn) + Service `frappe-python:8000` |
| `frappe-socketio.yaml` | Deployment + Service `frappe-socketio:9000` |
| `frappe-workers.yaml` | Deployment: RQ workers (default/short/long queues) |
| `frappe-scheduler.yaml` | Deployment: `bench schedule` |
| `site-init-job.yaml` | Job: `bench new-site` for the base site + install apps + set base config |
| `ingress.yaml` | Traefik wildcard `*.app.{base_domain}` + `admin.{base_domain}` → python:8000, `/socket.io`→socketio:9000 |
| `backup-cronjob.yaml` | CronJob: `bench --site all backup` → push to MinIO, prune |
| `README.md` | Deploy order + commands |

**Scheduling rules (every workload):**
```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: NotIn
          values: ["node05"]   # GPU-only node, exclude
resources:
  requests: { cpu: "...", memory: "..." }
  limits:   { cpu: "...", memory: "..." }
```

**Ingress (wildcard) essentials** (reuse shared Traefik middlewares like the existing frappe ingress):
```yaml
metadata:
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
    traefik.ingress.kubernetes.io/router.tls.certresolver: letsencrypt
spec:
  ingressClassName: traefik
  tls:
  - hosts: ["*.app.{base_domain}", "admin.{base_domain}"]
  rules:
  - host: "*.app.{base_domain}"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: frappe-python, port: { number: 8000 } } }
      - path: /socket.io
        pathType: Prefix
        backend: { service: { name: frappe-socketio, port: { number: 9000 } } }
```
> Wildcard TLS requires a DNS-01 LetsEncrypt resolver in Traefik. If the cluster's `letsencrypt` resolver is
> HTTP-01 only, add a DNS-01 resolver (documented in the README) — HTTP-01 cannot issue wildcard certs.

**Frappe multi-tenant config:** set `common_site_config.json` with `"maintenance_mode": 0`,
`"serve_default_site": 0`, and enable host-header site resolution so each `Host` maps to a site of the same
name (`bench config dns_multitenant on`).

## 4. Base site bring-up (site-init Job)

The `site-init-job.yaml` runs once:
```bash
bench new-site base.app.{base_domain} \
  --db-host mariadb --admin-password "$ADMIN_PW" --mariadb-root-password "$DB_ROOT_PW" --no-mariadb-socket
bench --site base.app.{base_domain} install-app erpnext
bench --site base.app.{base_domain} install-app entertainment_express
bench --site base.app.{base_domain} set-config host_name https://base.app.{base_domain}
```
This proves routing + TLS + app install. The real control-plane/tenant provisioning is phase-1.

## 5. Backups

`backup-cronjob.yaml` (nightly): `bench --site all backup --with-files`, then upload to MinIO
(`s3://ee-backups/{site}/{date}/`) and prune older than the retention window. Failures logged to stdout for
`kubectl logs`.

## 6. Verification

- `kubectl -n entertainment-express get pods` → all Running.
- `curl -I https://base.app.{base_domain}` → 200 with valid TLS.
- Socket.IO connects (no console errors in the desk).
- MariaDB and sites data survive a pod delete (Longhorn persistence).
- Backup CronJob produces an artifact in MinIO.
