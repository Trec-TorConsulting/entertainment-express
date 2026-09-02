"""Phase 5 surfaces — processors closed, guests 403, webhook dedupe, isolation."""

from __future__ import annotations

import hashlib
import hmac
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import billing_webhooks, portal_billing
from entertainment_express.billing_payments.processors import ProcessorNotConfigured, get_processor


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(
            site="e2esmoke.entx.app",
            request=SimpleNamespace(get_data=lambda as_text=True: "{}", headers={}),
            response=SimpleNamespace(http_status_code=200),
        )
        self.PermissionError = _Perm
        self.form_dict = {}
        self.db = SimpleNamespace(
            exists=lambda *a, **k: False,
            get_value=lambda *a, **k: None,
            sql=lambda *a, **k: None,
            commit=lambda: None,
            set_value=lambda *a, **k: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def whitelist(self, *a, **k):
        return lambda f: f


def test_square_unconfigured_never_charges():
    proc = get_processor("square")
    with pytest.raises(ProcessorNotConfigured):
        proc.hosted_checkout(1000, "usd", success_url="https://example.com")
    with pytest.raises(ProcessorNotConfigured):
        proc.refund("txn", 100, "test")


def test_guest_denied_money(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_billing, "frappe", fake)
    with pytest.raises(_Perm):
        portal_billing.refund_invoice("INV-1", 10, "x")
    with pytest.raises(_Perm):
        portal_billing.create_damage_hold("BK-1", 50)
    with pytest.raises(_Perm):
        portal_billing.start_checkout("INV-1", processor="square")


def test_crew_cannot_refund(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_billing, "frappe", fake)
    with pytest.raises(_Perm):
        portal_billing.refund_invoice("INV-1", 10, "x")
    with pytest.raises(_Perm):
        portal_billing.create_installments("BK-1", 3)


def test_webhook_rejects_bad_signature(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(billing_webhooks, "frappe", fake)
    monkeypatch.setenv("EE_SQUARE_WEBHOOK_SECRET", "whsec")
    fake.local.request = SimpleNamespace(
        get_data=lambda as_text=True: json.dumps({"id": "evt_1"}),
        headers={"X-EE-Signature": "nope"},
    )
    out = billing_webhooks.processor_webhook("square")
    assert out["error"] == "invalid signature"
    assert fake.local.response.http_status_code == 400


def test_webhook_dedupes(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    seen = {"n": 0}

    def exists(dt, name=None):
        return seen["n"] > 0

    def sql(*a, **k):
        seen["n"] += 1

    fake.db.exists = exists
    fake.db.sql = sql
    payload = json.dumps({"id": "evt_dup", "metadata": {"invoice_name": "INV-1"}})
    sig = hmac.new(b"whsec", payload.encode(), hashlib.sha256).hexdigest()
    fake.local.request = SimpleNamespace(get_data=lambda as_text=True: payload, headers={"X-EE-Signature": sig})
    monkeypatch.setattr(billing_webhooks, "frappe", fake)
    monkeypatch.setattr(billing_webhooks, "apply_succeeded", lambda *a, **k: {"status": "paid"})
    monkeypatch.setenv("EE_SQUARE_WEBHOOK_SECRET", "whsec")
    first = billing_webhooks.processor_webhook("square")
    second = billing_webhooks.processor_webhook("square")
    assert first["status"] == "received"
    assert second["status"] == "already_processed"


def test_no_cross_site_connect():
    src = Path(portal_billing.__file__).read_text(encoding="utf-8") + Path(billing_webhooks.__file__).read_text(
        encoding="utf-8"
    )
    assert "frappe.connect" not in src
    assert "frappe.init" not in src


def test_money_ui_has_billing_copy():
    owner = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    employee = Path(__file__).resolve().parents[3] / "frontend" / "employee-portal" / "src" / "App.tsx"
    client = Path(__file__).resolve().parents[3] / "frontend" / "customer-portal" / "src" / "App.tsx"
    owner_src = owner.read_text(encoding="utf-8")
    emp_src = employee.read_text(encoding="utf-8")
    client_src = client.read_text(encoding="utf-8")
    chunk = owner_src.split("function BillingTools")[1].split("function MoneyWorkspace")[0]
    assert "portal_billing.refund_invoice" in owner_src
    assert "portal_billing.create_installments" in owner_src
    assert "/app" not in chunk
    assert "portal_billing.refund_invoice" in emp_src
    assert "tip_amount" in client_src
    assert "processor" in client_src
