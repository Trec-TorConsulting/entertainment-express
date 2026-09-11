#!/usr/bin/env bash
# Build the EE bench image and push to BOTH registries (pre-DNS-cutover sync).
#
# Homelab K3S:  registry.maddscientist.com/entertainment-express/bench:<tag>
# GKE mirror:   us-east1-docker.pkg.dev/trector-gke-lab/ee-bench/bench:<tag>
#
# Requires: docker buildx, gcloud auth for AR, docker login for maddscientist.
# Homelab registry is LAN-only — run from a machine that can reach it (Mac on LAN
# or a self-hosted runner). GitHub-hosted runners can only push AR (see workflow).
#
# Usage:
#   ./scripts/build-push-bench.sh 0.0.120-ee
#   ./scripts/build-push-bench.sh 0.0.120-ee --amd64-only   # faster; GKE-only OK
#   HOMELAB_ONLY=1 ./scripts/build-push-bench.sh 0.0.120-ee
#   AR_ONLY=1 ./scripts/build-push-bench.sh 0.0.120-ee
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-}"
shift || true
AMD64_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --amd64-only) AMD64_ONLY=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if [[ -z "${TAG}" ]]; then
  echo "usage: $0 <tag> [--amd64-only]" >&2
  exit 2
fi

HOMELAB_REPO="${HOMELAB_REPO:-registry.maddscientist.com/entertainment-express/bench}"
AR_REPO="${AR_REPO:-us-east1-docker.pkg.dev/trector-gke-lab/ee-bench/bench}"
PLATFORMS="linux/amd64,linux/arm64"
if [[ "${AMD64_ONLY}" -eq 1 ]]; then
  PLATFORMS="linux/amd64"
fi

HOMELAB_ONLY="${HOMELAB_ONLY:-0}"
AR_ONLY="${AR_ONLY:-0}"

TAGS=()
if [[ "${AR_ONLY}" != "1" ]]; then
  TAGS+=(-t "${HOMELAB_REPO}:${TAG}")
fi
if [[ "${HOMELAB_ONLY}" != "1" ]]; then
  TAGS+=(-t "${AR_REPO}:${TAG}")
  # Ensure docker can push to AR
  gcloud auth configure-docker us-east1-docker.pkg.dev --quiet
fi

if [[ ${#TAGS[@]} -eq 0 ]]; then
  echo "no registries selected (HOMELAB_ONLY and AR_ONLY both set?)" >&2
  exit 2
fi

echo "Building platforms=${PLATFORMS} tag=${TAG}"
echo "Targets: ${TAGS[*]}"

docker buildx build \
  --platform "${PLATFORMS}" \
  "${TAGS[@]}" \
  --push \
  -f "${ROOT}/Dockerfile" \
  "${ROOT}"

echo "OK pushed ${TAG}"
echo "Next (homelab repo): entertainment-express/scripts/promote-image.sh ${TAG}"
