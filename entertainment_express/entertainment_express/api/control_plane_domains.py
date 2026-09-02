"""Control-plane custom domain registration and ingress host listing. Admin site only."""

from __future__ import annotations

import hashlib
import hmac
import json

import frappe

from entertainment_express.security.access import require_roles

OPS = ["SaaS Operator", "System Manager"]
HOST_RE = __import__("re").compile(r"^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,36}$")


def _conf() -> dict:
    return getattr(frappe, "conf", None) or {}


def _require_control_plane() -> None:
    site = getattr(frappe.local, "site", "") or ""
    if int(_conf().get("ee_control_plane") or 0):
        return
    if site.startswith("admin."):
        return
    frappe.throw("Not allowed.", frappe.PermissionError)


def _verify_signature(raw: bytes, signature: str) -> bool:
    secret = (_conf().get("ee_domain_register_secret") or "").encode("utf-8")
    if not secret or not signature:
        return False
    expected = hmac.new(secret, raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.strip().lower())


def _upsert_domain(tenant: str, hostname: str, verified: int, tls_status: str) -> str:
    existing = frappe.db.get_value("Tenant Domain", {"tenant": tenant, "hostname": hostname}, "name")
    if existing:
        frappe.db.set_value(
            "Tenant Domain",
            existing,
            {
                "verified": 1 if int(verified or 0) else 0,
                "tls_status": tls_status or "pending",
            },
        )
        return existing
    doc = frappe.get_doc(
        {
            "doctype": "Tenant Domain",
            "tenant": tenant,
            "hostname": hostname,
            "type": "custom",
            "verified": 1 if int(verified or 0) else 0,
            "tls_status": tls_status or "pending",
        }
    )
    doc.insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist(allow_guest=True)
def register_tenant_domain(
    site_name: str | None = None,
    hostname: str | None = None,
    verified: int = 0,
    tls_status: str = "pending",
) -> dict:
    """
    Upsert Tenant Domain from a signed tenant-site callback.
    Never opens a tenant database. Rejects spoofed site_name claims.
    """
    _require_control_plane()
    raw = b""
    sig = ""
    try:
        raw = getattr(frappe.request, "get_data", lambda **k: b"")(as_text=False) or b""
    except Exception:
        raw = b""
    if not raw and frappe.form_dict:
        # form-encoded fallback
        body = {
            "site_name": site_name or frappe.form_dict.get("site_name"),
            "hostname": hostname or frappe.form_dict.get("hostname"),
            "verified": int(verified or frappe.form_dict.get("verified") or 0),
            "tls_status": tls_status or frappe.form_dict.get("tls_status") or "pending",
        }
        raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    try:
        sig = frappe.get_request_header("X-EE-Domain-Signature") or ""
    except Exception:
        sig = ""
    if not _verify_signature(raw, sig):
        frappe.throw("Not allowed.", frappe.PermissionError)

    try:
        payload = json.loads(raw.decode("utf-8"))
    except Exception:
        frappe.throw("Invalid payload.")

    claim_site = (payload.get("site_name") or "").strip()
    host = (payload.get("hostname") or "").strip().lower().rstrip(".")
    verified_flag = int(payload.get("verified") or 0)
    status = (payload.get("tls_status") or "pending").strip() or "pending"

    if not claim_site or not HOST_RE.match(host):
        frappe.throw("That hostname is not allowed.")
    if not frappe.db.exists("DocType", "Tenant") or not frappe.db.exists("DocType", "Tenant Domain"):
        frappe.throw("Not found.")

    tenant = frappe.db.get_value("Tenant", {"site_name": claim_site}, "name")
    if not tenant:
        # Also accept exact name match when site_name equals tenant name
        if frappe.db.exists("Tenant", claim_site):
            tenant = claim_site
            site_on_record = frappe.db.get_value("Tenant", tenant, "site_name") or ""
            if site_on_record and site_on_record != claim_site:
                frappe.throw("Not allowed.", frappe.PermissionError)
        else:
            frappe.throw("Not allowed.", frappe.PermissionError)

    name = _upsert_domain(tenant, host, verified_flag, status)
    frappe.db.commit()
    return {"ok": True, "name": name, "tenant": tenant, "hostname": host, "verified": verified_flag, "tls_status": status}


@frappe.whitelist()
def set_tls_status(hostname: str, tls_status: str) -> dict:
    _require_control_plane()
    require_roles(*OPS)
    host = (hostname or "").strip().lower()
    status = (tls_status or "pending").strip()
    if status == "active":
        status = "issued"
    if status not in ("pending", "issued", "error"):
        frappe.throw("Invalid TLS status.")
    name = frappe.db.get_value("Tenant Domain", {"hostname": host}, "name")
    if not name:
        frappe.throw("Not found.")
    frappe.db.set_value("Tenant Domain", name, "tls_status", status)
    frappe.db.commit()
    return {"hostname": host, "tls_status": status}


@frappe.whitelist()
def list_verified_hosts() -> list[str]:
    """Hosts for the ingress reconciler (control plane only)."""
    _require_control_plane()
    require_roles(*OPS)
    if not frappe.db.exists("DocType", "Tenant Domain"):
        return []
    rows = frappe.get_all(
        "Tenant Domain",
        filters={"verified": 1, "type": "custom"},
        fields=["hostname"],
        limit_page_length=500,
    )
    return sorted({(r.hostname if hasattr(r, "hostname") else r.get("hostname") or "").lower() for r in rows if (r.hostname if hasattr(r, "hostname") else r.get("hostname"))})


@frappe.whitelist()
def write_hosts_file(path: str | None = None) -> dict:
    """Write verified hosts JSON for the reconciler CronJob (control plane)."""
    _require_control_plane()
    require_roles(*OPS)
    hosts = list_verified_hosts()
    target = path or "/home/frappe/frappe-bench/sites/ee_custom_domains.json"
    try:
        with open(target, "w", encoding="utf-8") as handle:
            json.dump({"hosts": hosts}, handle)
    except Exception as exc:
        frappe.throw(f"Could not write hosts file: {exc}")
    return {"path": target, "count": len(hosts), "hosts": hosts}


def _ingress_yaml(hosts: list[str], namespace: str = "entertainment-express") -> str:
    cert = (frappe.conf.get("ee_custom_domain_cert_resolver") if hasattr(frappe, "conf") else None) or "letsencrypt"
    name = "entertainment-express-custom-domains"
    if not hosts:
        hosts = ["placeholder.invalid"]
    tls = "\n".join(f"    - {h}" for h in hosts)
    rules = []
    for host in hosts:
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
    return f"""apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {name}
  namespace: {namespace}
  labels:
    app.kubernetes.io/name: entertainment-express
    app.kubernetes.io/component: custom-domains
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: "web,websecure"
    traefik.ingress.kubernetes.io/router.tls.certresolver: "{cert}"
    traefik.ingress.kubernetes.io/router.middlewares: "traefik-redirect-https@kubernetescrd,traefik-gzip-compress@kubernetescrd,traefik-security-headers@kubernetescrd"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
{tls}
  rules:
{chr(10).join(rules)}
"""


@frappe.whitelist()
def export_ingress_yaml(path: str | None = None) -> dict:
    """Write Ingress YAML for verified custom domains (control plane / CronJob)."""
    _require_control_plane()
    require_roles(*OPS)
    hosts = list_verified_hosts()
    target = path or "/home/frappe/frappe-bench/sites/ee_custom_domains_ingress.yaml"
    body = _ingress_yaml(hosts)
    with open(target, "w", encoding="utf-8") as handle:
        handle.write(body)
    write_hosts_file()
    return {"path": target, "count": len(hosts), "hosts": hosts}
