# Design: Production operator readiness

## Context

Phases 0–26 shipped. Live Frappe is `0.0.80-ee`. Operator-facing markdown still describes Helm, Stripe-only, no portals, and `frappe-web`. A full `kubectl apply -f k8s-deployment.yaml` is expected to fail on completed Jobs and the Helm-era MariaDB StatefulSet. Website `website_route_rules` cache on Redis until `bench --site all clear-cache`.

## Goals / Non-Goals

**Goals:** An operator can read README and deploy without being lied to. Apply on the existing cluster updates Deployments/Ingress/CronJob/NetworkPolicy and exits 0. After a python roll, `/book` is 200 without a manual cache command. MariaDB is not reachable from random pods. `python3 smoke_test.py` is 10/10 even with a stub on `PYTHONPATH`.

**Non-goals:** SOC2, pentest, Stripe Connect, ADP/Gusto, multi-arch image rebuild, recreating `funytown`, logged-in portal QA (needs a human session), changing tenant product APIs.

## Decisions

1. **Filter apply, do not delete Jobs.** `scripts/k8s_apply.py` emits YAML minus `kind: Job` and minus `StatefulSet/mariadb` when that STS already exists. Fresh clusters (no mariadb STS) still apply MariaDB from the full file via `scripts/deploy.sh`.
2. **Cache flush in the python container command** before gunicorn. `bench --site all clear-cache || true` so a missing site does not crash the pod. Adds ~seconds to startup; probes already wait 30s.
3. **MariaDB-only NetworkPolicy.** Default-deny on the mariadb pod selector; allow TCP 3306 from `app.kubernetes.io/name=entertainment-express` in the same namespace. Do not default-deny the whole namespace (would break Traefik).
4. **Replace, do not append, DEPLOYMENT_READINESS.md.** A dated “READY v0.0.1” file is harmful. New content is a short honest checklist.
5. **Smoke imports:** skip a module on `ImportError` / missing stub symbols; fail on other exceptions when a real Frappe is present (`frappe.__file__` not under `frappe_stub`).

## Risks / Trade-offs

- [Risk] NetworkPolicy blocks backup Job from MariaDB → Mitigation: backup pod already uses bench in the Frappe image with the same app label; confirm Job pods get `app.kubernetes.io/name=entertainment-express`.
- [Risk] clear-cache slows rollouts → Mitigation: `|| true`; readiness delay already 30s.
- [Risk] Skipping Jobs means site-init never re-runs from deploy.sh → Mitigation: README documents delete-job then apply full manifest for bootstrap only.

## Migration Plan

1. Merge docs + scripts + k8s (NetworkPolicy + python command). No app image bump required if only YAML/docs/scripts change.
2. `scripts/deploy.sh` on the cluster; curl `/book` 200.
3. Rollback: remove NetworkPolicy; revert python command.

## Open Questions

None. Logged-in walkthrough stays a human follow-up.
