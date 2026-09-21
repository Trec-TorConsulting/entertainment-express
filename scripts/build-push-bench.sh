#!/usr/bin/env bash
# Build the EE bench image and push to Homelab K3S registry.
#
# Homelab K3S: registry.maddscientist.com/entertainment-express/bench:<tag>
#
# Usage:
#   ./scripts/build-push-bench.sh 0.0.128-ee
#   ./scripts/build-push-bench.sh 0.0.128-ee --amd64-only
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
PLATFORMS="linux/amd64,linux/arm64"
if [[ "${AMD64_ONLY}" -eq 1 ]]; then
  PLATFORMS="linux/amd64"
fi

TAGS=(-t "${HOMELAB_REPO}:${TAG}")

echo "Building platforms=${PLATFORMS} tag=${TAG}"
echo "Targets: ${TAGS[*]}"

docker buildx build \
  --no-cache \
  --platform "${PLATFORMS}" \
  "${TAGS[@]}" \
  --push \
  -f "${ROOT}/Dockerfile" \
  "${ROOT}"

echo "OK pushed ${TAG}"
echo "Next (homelab repo): entertainment-express/scripts/promote-image.sh ${TAG} --apply"

