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

wait_http() {
  local url="$1"
  local i code
  for i in 1 2 3 4 5 6 7 8; do
    code="$(curl -sS -o /tmp/ee-deploy-http.body -w '%{http_code}' --max-time 20 "${url}" || echo 000)"
    if [[ "${code}" == "200" ]]; then
      cat /tmp/ee-deploy-http.body
      echo
      return 0
    fi
    echo "retry ${i}: ${url} -> ${code}" >&2
    sleep 5
  done
  echo "GET ${url} last=${code}, expected 200" >&2
  return 1
}

echo "Checking https://${TENANT_HOST}/api/method/ping" >&2
wait_http "https://${TENANT_HOST}/api/method/ping"

echo "Checking https://${TENANT_HOST}/book" >&2
wait_http "https://${TENANT_HOST}/book" >/dev/null
echo "GET /book 200" >&2
