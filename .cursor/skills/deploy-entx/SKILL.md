---
name: deploy-entx
description: "Build and roll Entertainment Express (EntX) to both K3S and GKE with the same bench image tag. Use when: deploying EntX from this product repo, dual-pushing bench images to maddscientist + Artifact Registry, promote-image in HomeLab-Redo, helm upgrade, entertainment-express-gke apply.sh, pre-cutover code sync, verifying admin.entx.app and gke-admin.entx.app."
---

# Deploy Entertainment Express (K3S + GKE)

**You are usually in this product repo** (`EntertainmentExpress/`). Build and dual-push happen here; tag bump + helm/apply happen in sibling **HomeLab-Redo**.

Ship **one bench image tag** to **both** clusters. Until DNS cutover, production Hostnames stay on homelab K3S; GKE is a code/data mirror only.

Delegate judgment to **`entx-admin`**. Use this skill for the mechanical build → promote → verify loop.

## When to Use

- Rolling EntX code to production (K3S) and the GKE POC together
- Dual-pushing a new `bench:<tag>` from this repo
- Bumping `image.tag` in HomeLab chart + GKE values
- Verifying both fronts after a roll
- Syncing MinIO migrate export → GCS (data path — separate from code)

## Hard Rules (do not skip)

1. **Same tag on both registries and both HomeLab values files** during pre-cutover sync.
2. **Do not point production DNS** (`admin.entx.app`, `*.entx.app`) at GKE load balancers.
3. **Do not publish** `entertainmentexpress.app` on the public Gateway.
4. **Secrets never committed**.
5. **Code ≠ data** — image promote rolls code only.
6. Prefer the scripts below over hand-edited image fields, ad-hoc `kubectl set image`, or using only `scripts/deploy.sh` for a dual-cluster roll.
7. `scripts/deploy.sh` / `k8s-deployment.yaml` are **not** the dual K3S+GKE production path.

## Paths

| Role | Location |
|------|----------|
| **This repo** — source + dual-push | `~/Projects/Personal/EntertainmentExpress/` (`./scripts/build-push-bench.sh`) |
| Promote + optional apply | `~/Projects/Personal/HomeLab-Redo/entertainment-express/scripts/promote-image.sh` |
| K3S chart / values | `~/Projects/Personal/HomeLab-Redo/entertainment-express/chart/` |
| GKE apply | `~/Projects/Personal/HomeLab-Redo/entertainment-express-gke/apply.sh` |
| Data sync MinIO → GCS | `~/Projects/Personal/HomeLab-Redo/entertainment-express/scripts/sync-ee-migrate-to-gcs.sh` |

Set helpers if useful:

```bash
EE=~/Projects/Personal/EntertainmentExpress
HL=~/Projects/Personal/HomeLab-Redo
```

## Registries

| Cluster | Image |
|---------|--------|
| K3S (homelab) | `registry.maddscientist.com/entertainment-express/bench:<tag>` |
| GKE | `us-east1-docker.pkg.dev/trector-gke-lab/ee-bench/bench:<tag>` |

Homelab registry is **LAN-only**. Dual-push from this Mac on LAN (or self-hosted runner). GitHub **Bench image** workflow is **AR-only**.

## Prerequisites

- Docker buildx; LAN to maddscientist; `gcloud` auth for Artifact Registry
- kubectl: homelab context for K3S; `gke_trector-gke-lab_us-east1_trector` for GKE
- GKE secrets already present if applying there

## Full code roll (preferred)

Pick a tag (example: `0.0.120-ee`). Same tag everywhere.

### 0. Pre-flight smoke validation (mandatory)

Verify all unit tests, DocType definitions, and multi-tenant isolation tests pass locally before building or pushing:

```bash
python3 smoke_test.py
```

Do not proceed with building or promoting images if any smoke test fails.

### 1. Build + dual-push (this repo)

```bash
cd ~/Projects/Personal/EntertainmentExpress
./scripts/build-push-bench.sh 0.0.120-ee
```

| Variant | When |
|---------|------|
| `./scripts/build-push-bench.sh <tag>` | Normal dual sync (multi-arch, both registries) |
| `./scripts/build-push-bench.sh <tag> --amd64-only` | Faster; prefer full multi-arch for mixed-arch K3S |
| `HOMELAB_ONLY=1 …` / `AR_ONLY=1 …` | Single registry — **breaks dual sync**; only with explicit user intent |

After GH AR-only build, still dual-push (or `HOMELAB_ONLY=1`) from LAN before promoting K3S.

### 2. Bump values (HomeLab)

```bash
cd ~/Projects/Personal/HomeLab-Redo
./entertainment-express/scripts/promote-image.sh 0.0.120-ee
```

Updates: `chart/values.yaml`, `chart/values-prod.yaml`, `entertainment-express-gke/values-gke.yaml`.

### 3. Apply both clusters

```bash
./entertainment-express/scripts/promote-image.sh 0.0.120-ee --apply
```

`--apply`: K3S `helm upgrade --install entertainment-express` + GKE `entertainment-express-gke/apply.sh` (release `ee-gke`).

### 4. Verify

```bash
# K3S production
curl -sS https://admin.entx.app/api/method/ping
kubectl -n entertainment-express get pods

# GKE POC only
CTX=gke_trector-gke-lab_us-east1_trector
kubectl --context "$CTX" -n entertainment-express get pods,svc
curl -sS https://gke-admin.entx.app/api/method/ping
```

## Order of operations

```
(in EE)  python3 smoke_test.py (pre-flight check)
    → (in EE) build-push both registries
    → (in HL) promote-image three values files
    → (in HL) promote --apply  OR  helm + apply.sh
    → ping admin.entx.app + gke-admin.entx.app
```

## Data path (not every code deploy)

```bash
kubectl -n entertainment-express create job --from=cronjob/ee-gcs-migrate-export \
  ee-gcs-migrate-export-manual
~/Projects/Personal/HomeLab-Redo/entertainment-express/scripts/sync-ee-migrate-to-gcs.sh
```

Image roll does **not** refresh GKE MariaDB/sites.

## Rollback

Re-promote a previous known-good tag through the same path so both clusters stay aligned. Avoid lone `kubectl rollout undo` unless emergency, then re-promote.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| K3S ImagePullBackOff | Tag missing on maddscientist — dual-push / `HOMELAB_ONLY=1` from LAN |
| GKE ImagePullBackOff | Tag missing on AR — dual-push / GH Bench image / `AR_ONLY=1` |
| `apply.sh` refuses context | Needs `gke_*` context |
| Used only `scripts/deploy.sh` | That is not dual-cluster promote — use this skill |
| Sites/DB wrong on GKE after code roll | Expected — migrate sync / restore |

## Agent output checklist

1. Tag used  
2. Registries pushed  
3. Whether HomeLab `--apply` ran  
4. Ping `admin.entx.app` (+ `gke-admin.entx.app` if applied)  
5. DNS/cutover **not** changed  
