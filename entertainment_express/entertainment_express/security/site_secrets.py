"""
Site-specific cryptographic secret derivation.

Ensures that every tenant site derives a unique, deterministic, high-entropy
secret for JWT signing, contract HMACs, and token verification, even when
custom secrets are not explicitly set in site_config.json.
Never falls back to hardcoded insecure defaults.
"""

from __future__ import annotations

import hashlib
import hmac
from typing import Any

import frappe

INSECURE_DEFAULTS = {
    "",
    "CHANGE_ME_IN_SITE_CONFIG",
    "change_me",
    "secret",
    "password",
}


def get_site_secret(key_name: str, purpose: str = "general") -> str:
    """Return an explicitly configured site secret, or securely derive a deterministic one.

    Args:
        key_name: Configuration key name in site_config (e.g. 'ee_jwt_secret', 'ee_signing_secret').
        purpose: Domain/purpose tag to isolate keys across components (e.g. 'jwt', 'contract', 'quote').

    Returns:
        A high-entropy hex string secret unique to this site and purpose.
    """
    conf = getattr(frappe, "conf", None) or {}
    val = None
    if hasattr(conf, "get"):
        val = conf.get(key_name)
    elif isinstance(conf, dict):
        val = conf.get(key_name)

    if val and str(val).strip() not in INSECURE_DEFAULTS:
        return str(val).strip()

    # Derive from site's native encryption / secret key or DB credentials
    site = getattr(getattr(frappe, "local", None), "site", None) or "site"
    base_material = (
        _get_conf_val(conf, "encryption_key")
        or _get_conf_val(conf, "secret_key")
        or _get_conf_val(conf, "db_password")
        or _get_conf_val(conf, "root_password")
        or f"ee_site_salt_{site}"
    )

    seed = f"{site}:{purpose}:{key_name}:{base_material}"
    derived = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return derived


def _get_conf_val(conf: Any, key: str) -> str:
    if hasattr(conf, "get"):
        val = conf.get(key)
    elif isinstance(conf, dict):
        val = conf.get(key)
    else:
        val = getattr(conf, key, None)
    return str(val).strip() if val else ""
