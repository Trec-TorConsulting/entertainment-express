---
name: deploy-entx
description: "Build and roll Entertainment Express (EntX) to the K3S cluster with the bench image tag. Use when: deploying EntX from this product repo, pushing bench images to maddscientist, promote-image in HomeLab-Redo, helm upgrade, verifying entx.app and tenant sites."
---

# Deploy Entertainment Express (K3S Production)

**You are in this product repo** (`EntertainmentExpress/`). Build and push happen here; tag bump + helm apply happen in sibling **HomeLab-Redo**.

Ship **bench image tag** to the homelab **K3S cluster**.

## When to Use

- Rolling EntX code to K3S production
- Pushing a new `bench:<tag>` from this repo to `registry.maddscientist.com`
- Bumping `image.tag` in HomeLab chart (`chart/values.yaml` and `chart/values-prod.yaml`)
- Verifying the application and tenant sites after a roll

## Hard Rules (do not skip)

1. Secrets are never committed to the repo.
2. Code ≠ data — image promote rolls code only.
3. Pre-flight smoke test (`python3 smoke_test.py`) must pass before building or promoting.

## Paths

| Role | Location |
|------|----------|
| **This repo** — source + build/push | `~/Projects/Personal/EntertainmentExpress/` (`./scripts/build-push-bench.sh`) |
| Promote + apply | `~/Projects/Personal/HomeLab-Redo/entertainment-express/scripts/promote-image.sh` |
| K3S chart / values | `~/Projects/Personal/HomeLab-Redo/entertainment-express/chart/` |

## Registry

| Cluster | Image |
|---------|--------|
| K3S (homelab) | `registry.maddscientist.com/entertainment-express/bench:<tag>` |

Homelab registry is **LAN-only**. Push from this Mac on LAN.

## Full Code Roll Workflow

### 0. Pre-flight smoke validation (mandatory)

```bash
python3 smoke_test.py
```

Do not proceed if any smoke test fails.

### 1. Build + push (this repo)

```bash
cd ~/Projects/Personal/EntertainmentExpress
./scripts/build-push-bench.sh 0.0.128-ee
```

### 2. Promote & apply (HomeLab)

```bash
cd ~/Projects/Personal/HomeLab-Redo
./entertainment-express/scripts/promote-image.sh 0.0.128-ee --apply
```

### 3. Verify

```bash
curl -sS https://entx.app/api/method/ping
curl -sS https://e2esmoke.entx.app/api/method/ping
kubectl -n entertainment-express get pods
```
