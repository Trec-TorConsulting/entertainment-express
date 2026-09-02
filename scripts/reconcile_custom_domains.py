#!/usr/bin/env python3
"""Reconcile verified Tenant Domain hostnames into a Traefik Ingress.

Reads hosts from sites/ee_custom_domains.json (written by control-plane
`write_hosts_file`) or from --hosts. Applies Ingress
`entertainment-express-custom-domains` in namespace entertainment-express.

Certs: Traefik annotation uses certresolver `letsencrypt` (HTTP-01 for arbitrary
customer hostnames). Wildcard DNS-01 on `*.app.*` is unchanged on the main Ingress.

Requires kubectl in PATH and RBAC to get/patch Ingress in the namespace.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_JSON = "/home/frappe/frappe-bench/sites/ee_custom_domains.json"
NAMESPACE = os.environ.get("EE_NAMESPACE", "entertainment-express")
INGRESS_NAME = "entertainment-express-custom-domains"
CERT_RESOLVER = os.environ.get("EE_CUSTOM_DOMAIN_CERT_RESOLVER", "letsencrypt")


def load_hosts(path: str | None, cli_hosts: list[str]) -> list[str]:
    hosts: list[str] = []
    if cli_hosts:
        hosts.extend(cli_hosts)
    target = path or DEFAULT_JSON
    if Path(target).is_file():
        data = json.loads(Path(target).read_text(encoding="utf-8"))
        hosts.extend(data.get("hosts") or [])
    cleaned = sorted({h.strip().lower().rstrip(".") for h in hosts if h and "." in h})
    return cleaned


def ingress_yaml(hosts: list[str]) -> str:
    rules = []
    tls_hosts = []
    for host in hosts:
        tls_hosts.append(f"    - {host}")
        rules.append(
            f"""  - host: "{host}"
    http:
      paths:
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: frappe-socketio
            port:
              number: 9000
      - path: /
        pathType: Prefix
        backend:
            service:
              name: frappe-python
              port:
                number: 8000"""
        )
    tls_block = "\n".join(tls_hosts) if tls_hosts else "    - placeholder.invalid"
    rules_block = "\n".join(rules) if rules else """  - host: "placeholder.invalid"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frappe-python
            port:
              number: 8000"""
    return f"""apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {INGRESS_NAME}
  namespace: {NAMESPACE}
  labels:
    app.kubernetes.io/name: entertainment-express
    app.kubernetes.io/component: custom-domains
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: "web,websecure"
    traefik.ingress.kubernetes.io/router.tls.certresolver: "{CERT_RESOLVER}"
    traefik.ingress.kubernetes.io/router.middlewares: "traefik-redirect-https@kubernetescrd,traefik-gzip-compress@kubernetescrd,traefik-security-headers@kubernetescrd"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
{tls_block}
  rules:
{rules_block}
"""


def apply(hosts: list[str], dry_run: bool = False) -> int:
    body = ingress_yaml(hosts)
    if dry_run:
        print(body)
        return 0
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as handle:
        handle.write(body)
        path = handle.name
    try:
        result = subprocess.run(
            ["kubectl", "apply", "-f", path],
            check=False,
            capture_output=True,
            text=True,
        )
        sys.stdout.write(result.stdout)
        sys.stderr.write(result.stderr)
        return result.returncode
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hosts-file", default=None)
    parser.add_argument("--host", action="append", default=[])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    hosts = load_hosts(args.hosts_file, args.host)
    print(f"Reconciling {len(hosts)} custom domain(s) → Ingress {INGRESS_NAME}", file=sys.stderr)
    return apply(hosts, dry_run=args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
