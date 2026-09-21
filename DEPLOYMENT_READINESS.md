# Deployment readiness — Entertainment Express (homelab pilot)

**Date:** 2026-09-14  
**Status:** Hardened for initial production launch  
**Image (matches `k8s-deployment.yaml`):** `registry.maddscientist.com/entertainment-express/bench:0.1.10-ee`  
**Namespace:** `entertainment-express`

Phases **0–41** and all post-41 platform capabilities (Zero-Signal Field Sync, Autonomous Event Copilot, B2B Overflow Exchange, Instant Crew Payouts, Live Event Flight Deck, Predictive Margin Guardrails) are implemented
and verified (OpenSpec archives). Live tenant smoke (`e2esmoke.entx.app`) includes
catalog/booking data (phase-1 task 10.2 is **done**, not pending). White-label phases 38–39 are on
`0.0.82-ee` with `phase38` / `phase39` patches applied on `e2esmoke.entx.app`.

---

## Production URL Architecture

The platform uses a clean, two-tier URL model:

1. **`entx.app` (and `www.entx.app`)** — Main PaaS / SaaS Site:
   - Public marketing homepage, product features, pricing, blog, contact, FAQ
   - New tenant onboarding & signup registration
   - Platform operator control plane & management
2. **`<client>.entx.app` (e.g., `funkytown.entx.app`, `e2esmoke.entx.app`)** — Client Company Site:
   - Client's customer booking portal (`/book`), equipment catalog (`/catalog`), quote requests
   - Client's crew & dispatch application (`/dispatch`, `/employee`)
   - Client's company admin Desk (`/app`) for bookings, inventory, invoicing, and crew management

> [!NOTE]
> `admin.entx.app`, `base.entx.app`, and `gke-admin.entx.app` have been retired and removed from Ingresses and routes. All platform traffic routes cleanly through `entx.app` (main PaaS) or `<client>.entx.app` (tenant site).

---

## What is live

- Site-per-tenant Frappe + ERPNext + this app
- Main PaaS / SaaS on `entx.app` and `www.entx.app`
- Client sites on `*.entx.app` (home, `/book`, `/catalog`, `/request-quote`, login)
- Logged-in portals: `/owner`, `/employee`, `/client` (login-gated; walkthrough is a human session)
- Field PWA for crew (not a native React Native store app as the primary client)
- Payments: Stripe + Square + PayPal paths; **Stripe Connect and W2 payroll remain stubs**
- Apply path: K3S deployment via `promote-image.sh --apply` in HomeLab-Redo (see deploy-entx skill)


---

## Operator checklist

- [x] Secrets exist in-cluster (`ee-secrets`, `ee-stripe-secrets`); never commit real values
- [x] Image tag in `k8s-deployment.yaml` matches what you built and pushed
- [x] `TENANT_HOST=e2esmoke.entx.app ./scripts/deploy.sh` exits 0 (or promote-image --apply for dual-cluster)
- [x] `GET https://e2esmoke.entx.app/api/method/ping` and `GET .../book` return 200
- [x] `GET https://e2esmoke.entx.app/api/method/entertainment_express.api.health.ready` returns `{"ok": true}` (DB-aware readiness probe)
- [x] After a python roll, `/book` is 200 **without** a manual `bench --site all clear-cache`
- [x] `python3 smoke_test.py` and `openspec validate --specs` pass locally
- [x] Traefik `ee-public-ratelimit` and `ee-auth-ratelimit` middlewares applied: `kubectl -n entertainment-express get middleware`
- [x] Twilio/FCM credentials configured via Frappe Desk → EE Notification Settings (not K8s Secrets — see H-9 below)

---

## Known gaps (do not paper over)

- Homelab mixed-arch nodes; **bench images are linux/amd64** today — Frappe/Redis/MariaDB Deployments
  and bench CronJobs pin `kubernetes.io/arch=amd64` so pods do not schedule on ARM nodes
- Full `kubectl apply -f k8s-deployment.yaml` fails on completed Jobs and Helm-era MariaDB STS — use `scripts/deploy.sh`
- Logged-in portal QA is not automated (human walkthrough)
- Ticketing / marketplace / AI event decks are out of scope (phase 26 non-goals)
- No NetworkPolicy default-deny on the whole namespace (would break Traefik); MariaDB 3306 is restricted

---

## H-5: auto_migrate behavior (important for operators)

`common_site_config.json` sets `"auto_migrate": 1`. This causes Frappe to run `bench migrate`
automatically on **every pod restart** (including rollouts). For a solo-operator homelab deployment
this is the correct behavior — it ensures schema is always current without a manual step.

**Risk:** If a schema migration fails mid-way (e.g. a bad patch), every restart will re-attempt
it and could block gunicorn from starting. Symptoms: pod restarts in a loop, `bench migrate`
errors in logs.

**Recovery if a migration blocks startup:**
```bash
# Check what's failing
kubectl -n entertainment-express logs deploy/frappe-python -c frappe-python | grep -i "migrate\|error\|patch"
# Disable auto_migrate temporarily (requires pod exec or patching the ConfigMap)
kubectl -n entertainment-express exec deploy/frappe-python -c frappe-python -- \
  bash -lc "bench --site <site> set-config auto_migrate 0"
# Fix the failing patch, push a new image, then re-enable
```

**To do a coordinated migration (safer for large schema changes):**
1. Patch ConfigMap: `"auto_migrate": 0`, roll all pods.
2. Run `bench --site all migrate` manually in the python pod.
3. Verify, then re-enable `auto_migrate`.

---

## H-6: Restore from backup (runbook)

Backups run via the `entertainment-express-site-backup` CronJob → MinIO at
`s3://ee-backups/<site>/`. Each backup is a `bench backup` tarball: MariaDB dump + site files.

### Restore procedure

```bash
# 1. List available backups
kubectl -n entertainment-express exec deploy/frappe-python -c frappe-python -- \
  bash -lc "mc ls minio/ee-backups/<site>/ | tail -10"

# 2. Scale down frappe-python to avoid active DB connections during restore
kubectl -n entertainment-express scale deploy/frappe-python --replicas=0

# 3. Restore DB
kubectl -n entertainment-express exec deploy/frappe-python -c frappe-python -- \
  bash -lc "cd /home/frappe/frappe-bench && \
    bench --site <site> restore /tmp/<timestamp>-<site>-database.sql.gz"

# 4. Restore files (optional — if file storage was also affected)
kubectl -n entertainment-express exec deploy/frappe-python -c frappe-python -- \
  bash -lc "cd /home/frappe/frappe-bench/sites/<site> && \
    tar -xzf /tmp/<timestamp>-<site>-files.tar.gz"

# 5. Scale back up and verify
kubectl -n entertainment-express scale deploy/frappe-python --replicas=2
kubectl -n entertainment-express rollout status deploy/frappe-python
curl -sS "https://<site>/api/method/ping"
curl -sS "https://<site>/api/method/entertainment_express.api.health.ready"
```

**Note:** After restore, run `bench --site <site> migrate` to ensure schema matches the current
image. Restore does not re-run patches.

---

## H-7: Portal enforce mode — canary rollout

`ee_portal_mode` controls access boundary enforcement. Default in site config: `"warn"`.

| Mode | Behavior |
|------|----------|
| `off` | No enforcement; all users can reach Desk |
| `warn` | Non-admin Desk access logs a warning (default) |
| `enforce` | Non-admin hard-redirected to their portal; Desk is SaaS Operator/System Manager only |

**Canary rollout procedure:**
```bash
# Test on one tenant first
bench --site e2esmoke.entx.app set-config ee_portal_mode enforce
# Verify /owner, /employee, /client work for their respective roles
# Walk through each portal as each role before rolling globally
bench --site all set-config ee_portal_mode enforce
```

---

## H-9: Twilio/FCM/communications credentials

Unlike Stripe (K8s Secrets → env vars), Twilio and FCM credentials are configured **through
the Frappe Desk UI** — they are per-site settings and may differ across tenants.

**Control-plane site (entx.app):**
1. Login as SaaS Operator → Frappe Desk → EE Notification Settings
2. Enter: Twilio Account SID, Auth Token, From Number / WhatsApp Number; FCM Server Key

**Tenant sites:**
1. Login as EE Tenant Admin → `/owner` → Settings → Notifications
2. Each tenant has their own credentials (or operator shares sub-account credentials)

**Security:** Stored encrypted in each site's MariaDB (Frappe encryption key from `ee-secrets`).
Never committed to repo or K8s manifests.

---

## Custom domains (phase 38)

- Owner verifies DNS (CNAME → `{slug}.app.{base}`); site adds Host to Frappe `domains`.
- Control plane records `Tenant Domain`; CronJob `entertainment-express-domain-reconcile` publishes
  Ingress `entertainment-express-custom-domains`.
- Traefik certresolver for custom hosts: **`letsencrypt`** (HTTP-01). Confirm the cluster resolver
  accepts HTTP-01 for arbitrary hostnames; wildcard DNS-01 on `*.app.*` stays on the main Ingress.
- Set `ee_control_plane_url` + `ee_domain_register_secret` on tenant sites (same secret as
  `domain-register-secret` in secrets). Without these, verify still works locally; ingress sync waits
  for operator/backfill.

## Full-site white-label (phase 39)

- After migrate, `EE Portal Settings.white_label_mode` is `full` if hide-product was on, else `portals`.
- Owner Brand (`/owner/brand`): extended kit (colors/fonts/logos/footer), Match style from https URL
  and/or logo, preview iframes (`?ee_brand_preview=1`), then Apply.
- Tenant public pages + portal chrome + client email wrappers use the kit when mode is `full`.
- EE SaaS marketing (`www` / control plane) does **not** load tenant kit.
- Style matcher is rate-limited (10/hour/user) and rejects private/link-local URLs (SSRF guard).
- `bench --site <tenant> migrate` applies `phase39_full_site_white_label` patch.

---

## Rollback

Remove the MariaDB NetworkPolicy; revert the `frappe-python` start command if cache flush causes
a start loop (`|| true` is already on `clear-cache`).

For a code rollback: re-promote the previous known-good tag:
```bash
cd ~/Projects/Personal/HomeLab-Redo
./entertainment-express/scripts/promote-image.sh <prev-tag> --apply
```
Avoid lone `kubectl rollout undo` — re-promote through `promote-image.sh --apply` to keep HomeLab chart values aligned.
