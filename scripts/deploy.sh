#!/usr/bin/env bash
# Existing-cluster apply for Entertainment Express.
#
# Skips one-shot Jobs (immutable once completed). Skips StatefulSet/mariadb when
# that STS already exists (Helm-era volumeClaimTemplates cannot be patched).
#
# Fresh bootstrap: delete the site-init Jobs, then kubectl apply -f k8s-deployment.yaml
# (MariaDB is created once). After that, use this script.
#
# Usage:
#   TENANT_HOST=e2esmoke.entx.app ./scripts/deploy.sh
#   ./scripts/deploy.sh --dry-run
#
# Env:
#   TENANT_HOST   Tenant hostname to curl after roll (default: e2esmoke.entx.app)
#   NS            Kubernetes namespace (default: entertainment-express)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${ROOT}/k8s-deployment.yaml"
NS="${NS:-entertainment-express}"
TENANT_HOST="${TENANT_HOST:-e2esmoke.entx.app}"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

APPLY_ARGS=()
if kubectl -n "${NS}" get statefulset mariadb >/dev/null 2>&1; then
  APPLY_ARGS+=(--skip-mariadb)
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
  python3 "${ROOT}/scripts/k8s_apply.py" --dry-run "${APPLY_ARGS[@]}" "${MANIFEST}"
  echo "TENANT_HOST=${TENANT_HOST} (curl skipped in --dry-run)" >&2
  exit 0
fi

python3 "${ROOT}/scripts/k8s_apply.py" "${APPLY_ARGS[@]}" "${MANIFEST}" \
  | kubectl apply -f -

kubectl -n "${NS}" rollout status deploy/frappe-python --timeout=300s

kubectl -n "${NS}" exec deploy/frappe-python -c frappe-python -- \
  bash -lc 'cd /home/frappe/frappe-bench && bench --site all clear-cache || true'

echo "Checking https://${TENANT_HOST}/api/method/ping" >&2
curl -fsS "https://${TENANT_HOST}/api/method/ping"
echo >&2

echo "Checking https://${TENANT_HOST}/book" >&2
BOOK_CODE="$(curl -fsS -o /dev/null -w '%{http_code}' "https://${TENANT_HOST}/book")"
if [[ "${BOOK_CODE}" != "200" ]]; then
  echo "GET /book returned ${BOOK_CODE}, expected 200" >&2
  exit 1
fi
echo "GET /book ${BOOK_CODE}" >&2
