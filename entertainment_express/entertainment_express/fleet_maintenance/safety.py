# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.utils import add_days, getdate, nowdate


def get_asset_safety_certificate_status(asset_name: str, on_date=None) -> dict:
    """
    Check if the asset is governed by any expired safety certificates.
    Returns:
        {
            "valid": True/False,
            "expired_cert": cert_name or None,
            "expiry_date": str or None,
            "reason": str or None,
            "certificates": [...]
        }
    """
    check_date = getdate(on_date) if on_date else getdate(nowdate())

    # Find safety certificate parent records that govern this asset
    cert_assets = frappe.get_all(
        "Safety Certificate Asset",
        filters={"asset": asset_name},
        fields=["parent", "asset"],
    )

    if not cert_assets:
        # No safety certificate requirement registered
        return {"valid": True, "expired_cert": None, "expiry_date": None, "reason": None, "certificates": []}

    certs = []
    for ca in cert_assets:
        parent_name = ca.get("parent") if isinstance(ca, dict) else getattr(ca, "parent", None)
        if not parent_name:
            continue
        cert_doc = frappe.get_doc("Safety Certificate", parent_name)
        c_name = getattr(cert_doc, "certificate_name", None) or cert_doc.name
        c_exp = getattr(cert_doc, "expiry_date", None)
        certs.append({
            "name": cert_doc.name,
            "certificate_name": c_name,
            "expiry_date": str(c_exp) if c_exp else None,
            "issuing_body": getattr(cert_doc, "issuing_body", None),
        })

        if c_exp and getdate(c_exp) < check_date:
            return {
                "valid": False,
                "expired_cert": c_name,
                "expiry_date": str(c_exp),
                "reason": f"Safety Certificate '{c_name}' expired on {c_exp}",
                "certificates": certs,
            }

    return {"valid": True, "expired_cert": None, "expiry_date": None, "reason": None, "certificates": certs}


def check_expiring_safety_certificates() -> list[dict]:
    """
    Daily scheduled task to alert on safety certificates expiring within 30, 14, and 1 days,
    or certificates that have already expired.
    """
    emails = []
    try:
        from entertainment_express.api.fleet_ops import _admin_emails
        emails = _admin_emails()
    except Exception:
        emails = []
    today = getdate(nowdate())

    alerts_sent = []
    certs = frappe.get_all(
        "Safety Certificate",
        fields=["name", "certificate_name", "issuing_body", "certificate_number", "expiry_date"],
    )

    for cert in certs:
        if not cert.expiry_date:
            continue

        exp = getdate(cert.expiry_date)
        days_left = (exp - today).days

        title = None
        detail = None
        severity = "info"

        if days_left <= 0:
            title = f"Safety Certificate EXPIRED: {cert.certificate_name or cert.name}"
            detail = f"Certificate {cert.certificate_number or cert.name} from {cert.issuing_body or 'Issuer'} expired on {cert.expiry_date}."
            severity = "critical"
        elif days_left in (1, 14, 30) or days_left <= 7:
            title = f"Safety Certificate Renewal Notice ({days_left}d left): {cert.certificate_name or cert.name}"
            detail = f"Certificate {cert.certificate_number or cert.name} expires in {days_left} days ({cert.expiry_date})."
            severity = "warning"

        if title and detail:
            alerts_sent.append({
                "certificate": cert.name,
                "title": title,
                "days_left": days_left,
                "severity": severity,
            })
            if emails:
                for email in emails:
                    try:
                        send("fleet_alert", email, {"title": title, "detail": detail})
                    except Exception:
                        pass

    return alerts_sent
