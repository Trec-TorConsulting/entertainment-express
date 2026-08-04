# Entertainment Express — production bench image
#
# Multi-arch (linux/amd64 + linux/arm64) image built on the official
# frappe/erpnext base with the entertainment_express app baked in. This is the
# single, self-contained image used to deploy the platform to production
# (see k8s-deployment.yaml).
#
# Build & push (from the repo root):
#   docker buildx build \
#     --platform linux/amd64,linux/arm64 \
#     -t <registry>/entertainment-express/bench:<tag> \
#     --push -f Dockerfile .
#
# Pinned base for reproducible builds — bump when upgrading Frappe/ERPNext.
FROM frappe/erpnext:v15.65.2

# ── Install the entertainment_express app ───────────────────────────────────
# COPY paths are relative to the build context (this repo's root).
COPY entertainment_express/entertainment_express \
     /home/frappe/frappe-bench/apps/entertainment_express/entertainment_express
COPY entertainment_express/pyproject.toml \
     /home/frappe/frappe-bench/apps/entertainment_express/pyproject.toml
COPY entertainment_express/license.txt \
     /home/frappe/frappe-bench/apps/entertainment_express/license.txt
COPY entertainment_express/README.md \
     /home/frappe/frappe-bench/apps/entertainment_express/README.md

# Install the app into the bench virtualenv (editable so Frappe resolves it)
# and include pytest so bench run-tests works in newly rolled pods.
RUN /home/frappe/frappe-bench/env/bin/pip install --no-cache-dir \
     -e /home/frappe/frappe-bench/apps/entertainment_express \
     pytest

# Register the app. The base image's apps.txt has no trailing newline, so
# normalize with awk (guarantees a newline per entry) and only append if missing
# — a naive `echo >>` would concatenate onto the last entry.
RUN awk 'NF' /home/frappe/frappe-bench/sites/apps.txt > /tmp/apps.txt && \
    grep -qxF 'entertainment_express' /tmp/apps.txt || echo 'entertainment_express' >> /tmp/apps.txt && \
    mv /tmp/apps.txt /home/frappe/frappe-bench/sites/apps.txt && \
    echo "── apps.txt ──" && cat /home/frappe/frappe-bench/sites/apps.txt

# ── Image labels ────────────────────────────────────────────────────────────
LABEL org.opencontainers.image.title="Entertainment Express Bench"
LABEL org.opencontainers.image.description="Frappe/ERPNext bench with the Entertainment Express app"
LABEL org.opencontainers.image.vendor="Trec-Tor Consulting"
LABEL org.opencontainers.image.source="https://github.com/Trec-TorConsulting/entertainment-express"
