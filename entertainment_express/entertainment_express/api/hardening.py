"""Owner security, custom domains, SSO status, operator backup stamp. This site only."""

from __future__ import annotations

import json
import os
import re
import socket

import frappe

from entertainment_express.security import audit
from entertainment_express.security.access import require_roles

GUEST_ROLE = "EE Event Guest"
OWNER = ["EE Tenant Admin", "System Manager"]
OPS = ["SaaS Operator", "System Manager"]
CREW = {"EE Crew", "EE Entertainer"}
HOST_RE = re.compile(r"^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,36}$")
RESERVED = {"admin", "www", "api"}
BACKUP_STAMP = os.path.join("sites", ".ee_last_backup")


def _user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest() -> None:
    user = _user()
    if user in ("Guest", "guest") or not user:
        frappe.throw("Not allowed.", frappe.PermissionError)
    roles = _roles()
    if GUEST_ROLE in roles and not roles.intersection(set(OWNER) | {"EE Sales", "EE Office"}):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_crew_write() -> None:
    _deny_guest()
    roles = _roles()
    if roles.intersection(CREW) and not roles.intersection(set(OWNER)):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _conf() -> dict:
    return getattr(frappe, "conf", None) or {}


def _set_conf(key: str, value) -> None:
    try:
        from frappe.installer import update_site_config

        update_site_config(key, value)
    except Exception:
        _conf()[key] = value


def _domains() -> list[dict]:
    raw = _conf().get("ee_custom_domains") or []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            raw = []
    return list(raw or [])


@frappe.whitelist()
def security_status() -> dict:
    _deny_guest()
    require_roles(*OWNER, "EE Office")
    sso = False
    try:
        from entertainment_express.integrations.credentials import is_enabled

        sso = bool(is_enabled("oidc"))
    except Exception:
        sso = False
    return {
        "require_2fa": int(_conf().get("ee_require_2fa") or 0),
        "sso_enabled": int(sso),
        "sso_status": "connected" if sso else "off",
        "default_host": getattr(frappe.local, "site", "") or "",
    }


@frappe.whitelist()
def set_require_2fa(enabled: int = 0) -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    flag = 1 if int(enabled or 0) else 0
    _set_conf("ee_require_2fa", flag)
    try:
        ss = frappe.get_single("System Settings")
        if hasattr(ss, "enable_two_factor_auth"):
            ss.enable_two_factor_auth = flag
            ss.save()
    except Exception:
        pass
    audit.write("set_require_2fa", extra={"enabled": flag})
    return {"require_2fa": flag}


@frappe.whitelist()
def list_audit(limit: int = 50) -> list[dict]:
    _deny_guest()
    require_roles(*OWNER, "EE Office")
    if not frappe.db.exists("DocType", "EE Audit Log"):
        return []
    rows = frappe.get_all(
        "EE Audit Log",
        fields=["action", "actor", "creation", "related_doctype", "related_name"],
        order_by="creation desc",
        limit_page_length=min(int(limit or 50), 100),
    )
    out = []
    for row in rows:
        get = row.get if isinstance(row, dict) else lambda k, d=None: getattr(row, k, d)
        out.append(
            {
                "action": get("action") or "",
                "actor": get("actor") or "",
                "when": str(get("creation") or ""),
                "related": get("related_name") or "",
            }
        )
    return out


@frappe.whitelist()
def list_custom_domains() -> list[dict]:
    _deny_guest()
    require_roles(*OWNER)
    return _domains()


@frappe.whitelist()
def request_custom_domain(hostname: str) -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    host = (hostname or "").strip().lower().rstrip(".")
    if not HOST_RE.match(host) or host.split(".")[0] in RESERVED:
        frappe.throw("That hostname is not allowed.")
    site = getattr(frappe.local, "site", "") or ""
    if host == site:
        frappe.throw("That is already this company's address.")
    rows = _domains()
    if any((r.get("hostname") if isinstance(r, dict) else "") == host for r in rows):
        return {"hostname": host, "verified": 0}
    rows.append({"hostname": host, "verified": 0, "tls_status": "pending"})
    _set_conf("ee_custom_domains", rows)
    audit.write("request_custom_domain", extra={"hostname": host})
    return {"hostname": host, "verified": 0}


def _ips(name: str) -> set[str]:
    try:
        return {item[4][0] for item in socket.getaddrinfo(name, 443)}
    except Exception:
        try:
            return {item[4][0] for item in socket.getaddrinfo(name, 80)}
        except Exception:
            return set()


def hostname_resolves_here(hostname: str, default_host: str) -> bool:
    custom = _ips(hostname)
    origin = _ips(default_host)
    return bool(custom and origin and custom.intersection(origin))


@frappe.whitelist()
def verify_custom_domain(hostname: str) -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    host = (hostname or "").strip().lower().rstrip(".")
    site = getattr(frappe.local, "site", "") or ""
    default = (_conf().get("host_name") or "").replace("https://", "").replace("http://", "").split("/")[0] or site
    ok = hostname_resolves_here(host, default)
    rows = _domains()
    found = False
    for row in rows:
        if isinstance(row, dict) and row.get("hostname") == host:
            row["verified"] = 1 if ok else 0
            found = True
    if not found:
        rows.append({"hostname": host, "verified": 1 if ok else 0, "tls_status": "pending"})
    _set_conf("ee_custom_domains", rows)
    if ok:
        live = list(_conf().get("domains") or [])
        if host not in live:
            live.append(host)
            _set_conf("domains", live)
        audit.write("verify_custom_domain", extra={"hostname": host, "verified": 1})
    return {"hostname": host, "verified": int(ok)}


@frappe.whitelist()
def save_sso(issuer: str = "", client_id: str = "", client_secret: str = "", enabled: int = 0) -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    creds = {}
    if client_secret or client_id or issuer:
        creds = {"issuer": issuer, "client_id": client_id, "client_secret": client_secret}
    if frappe.db.exists("DocType", "Integration Config"):
        payload = json.dumps(creds)
        settings = json.dumps({"issuer": issuer, "client_id": client_id})
        if frappe.db.exists("Integration Config", "oidc"):
            doc = frappe.get_doc("Integration Config", "oidc")
            doc.enabled = 1 if int(enabled or 0) else 0
            doc.settings = settings
            if creds:
                doc.credentials = payload
            doc.status = "connected" if doc.enabled else "disconnected"
            doc.save()
        else:
            frappe.get_doc(
                {
                    "doctype": "Integration Config",
                    "provider": "oidc",
                    "enabled": 1 if int(enabled or 0) else 0,
                    "status": "connected" if int(enabled or 0) else "disconnected",
                    "settings": settings,
                    "credentials": payload,
                }
            ).insert()
        frappe.db.commit()
    audit.write("save_sso", extra={"enabled": int(enabled or 0), "issuer": issuer})
    return {"sso_enabled": int(enabled or 0), "sso_status": "connected" if int(enabled or 0) else "off"}


@frappe.whitelist()
def backup_status() -> dict:
    require_roles(*OPS)
    user = _user()
    if user in ("Guest", "guest"):
        frappe.throw("Not allowed.", frappe.PermissionError)
    if GUEST_ROLE in _roles():
        frappe.throw("Not allowed.", frappe.PermissionError)
    stamp = ""
    candidates = [
        "/home/frappe/frappe-bench/sites/.ee_last_backup",
        os.path.join(os.getcwd(), BACKUP_STAMP),
    ]
    for path in candidates:
        try:
            if os.path.isfile(path):
                with open(path, encoding="utf-8") as handle:
                    stamp = handle.read().strip()
                    break
        except Exception:
            continue
    return {"last_backup": stamp, "restore": "Operator restore is bench --site <site> restore from MinIO ee-backups/."}


@frappe.whitelist()
def record_tenant_domain(tenant: str, hostname: str, verified: int = 0) -> dict:
    """Control plane only. `tenant` is a Tenant DocType name on this admin site, not a DB switch."""
    require_roles(*OPS)
    if not getattr(frappe.local, "conf", None) and not _conf().get("ee_control_plane"):
        if not int((_conf().get("ee_control_plane") or 0)):
            # still allow System Manager on admin hostnames
            site = getattr(frappe.local, "site", "") or ""
            if not site.startswith("admin."):
                frappe.throw("Not allowed.", frappe.PermissionError)
    host = (hostname or "").strip().lower()
    if not HOST_RE.match(host):
        frappe.throw("That hostname is not allowed.")
    if not frappe.db.exists("DocType", "Tenant Domain") or not frappe.db.exists("Tenant", tenant):
        frappe.throw("Not found.")
    doc = frappe.get_doc(
        {
            "doctype": "Tenant Domain",
            "tenant": tenant,
            "hostname": host,
            "type": "custom",
            "verified": 1 if int(verified or 0) else 0,
            "tls_status": "pending",
        }
    )
    doc.insert()
    frappe.db.commit()
    return {"hostname": host, "tenant": tenant}


@frappe.whitelist()
def list_tenant_domains() -> list[dict]:
    require_roles(*OPS)
    if not frappe.db.exists("DocType", "Tenant Domain"):
        return []
    rows = frappe.get_all("Tenant Domain", fields=["tenant", "hostname", "verified", "tls_status"], limit_page_length=200)
    out = []
    for row in rows:
        get = row.get if isinstance(row, dict) else lambda k, d=None: getattr(row, k, d)
        out.append({"tenant": get("tenant"), "hostname": get("hostname"), "verified": int(get("verified") or 0), "tls_status": get("tls_status") or "pending"})
    return out
