# Tasks: Production operator readiness

> Prereq: phases 0–26 on main. No tenant DocTypes. Secrets stay out of git.

## 1. Specs and operator docs
- [x] 1.1 Sync `infrastructure-deployment` delta into `openspec/specs/infrastructure-deployment/spec.md`. Fix `openspec/project.md` layout so K8s is this repo’s `k8s-deployment.yaml`. Add a ROADMAP note after phase 26 for this change.
      **Accept:** `openspec validate --specs` passes; project.md does not say manifests live only in HomeLab-Redo.
- [x] 1.2 Rewrite `README.md` and `entertainment_express/README.md`. Replace `DEPLOYMENT_READINESS.md` with a short honest checklist (pilot, not SaaS-SLA).
      **Accept:** no Helm-as-the-deploy-path; portals `/owner` `/employee` `/client`; image tag matches `k8s-deployment.yaml`; 10.2 not “pending”.

## 2. Apply + cache + MariaDB policy
- [x] 2.1 `scripts/k8s_apply.py` + `scripts/deploy.sh`: skip Jobs; skip MariaDB STS if it exists; apply the rest; wait `frappe-python`; `bench --site all clear-cache`; curl tenant `/api/method/ping` and `/book`.
      **Accept:** running `python3 scripts/k8s_apply.py --dry-run` omits Jobs; script documents `TENANT_HOST`.
- [x] 2.2 `frappe-python` container command runs `bench --site all clear-cache || true` before gunicorn.
      **Accept:** command in `k8s-deployment.yaml` contains `clear-cache`.
- [x] 2.3 NetworkPolicy on MariaDB: ingress TCP 3306 only from `app.kubernetes.io/name=entertainment-express`.
      **Accept:** policy in `k8s-deployment.yaml`; backup CronJob pod template keeps that name label.

## 3. Smoke
- [x] 3.1 `smoke_test.py` API import: skip `ImportError` / missing stub helpers; fail other errors.
      **Accept:** `python3 smoke_test.py` with a stub missing `add_to_date` is not a failed suite solely for `api.booking`.
