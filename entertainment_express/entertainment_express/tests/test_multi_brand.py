"""Unit tests for multi-brand umbrella operations: brand theme by host, comms routing, Stripe statement descriptor, cost center linkage."""

from __future__ import annotations

import sys
from types import ModuleType, SimpleNamespace
import pytest


def _install_frappe_stub() -> None:
    if "frappe" in sys.modules and hasattr(sys.modules["frappe"], "whitelist"):
        return
    m = ModuleType("frappe")
    m.whitelist = lambda *a, **k: (lambda f: f)
    m.PermissionError = type("PermissionError", (Exception,), {})
    m.utils = ModuleType("frappe.utils")
    m.utils.cint = lambda x, *a, **k: int(float(x or 0))
    m.utils.flt = lambda x, *a, **k: float(x or 0)
    m.get_roles = lambda *a, **k: ["System Manager"]
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        get_value=lambda *a, **k: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import brand  # noqa: E402
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS  # noqa: E402


class _FakeDoc:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


def test_brand_fields_present_in_custom_fields():
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Item"]}
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Quotation"]}
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Sales Invoice"]}
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Opportunity"]}


def test_get_brand_theme_by_host(monkeypatch):
    brand_doc = _FakeDoc(
        name="BR-AUSTIN",
        brand_name="Austin Bounce Party",
        primary_color="#3b82f6",
        secondary_color="#60a5fa",
        logo="/files/logo.png",
        email_from="info@austinbounce.com",
        twilio_phone_number="+15125550199",
        statement_descriptor="AUSTIN BOUNCE",
    )

    fake_frappe = SimpleNamespace(
        db=SimpleNamespace(
            table_exists=lambda *_: True,
            get_value=lambda dt, filters, field=None: "BR-AUSTIN" if dt == "EE Brand" else None,
        ),
        get_doc=lambda dt, name: brand_doc,
        whitelist=lambda *a, **k: (lambda f: f),
    )
    monkeypatch.setattr(brand, "frappe", fake_frappe)

    res = brand.get_brand_theme_by_host("austinbounce.com")
    assert res["brand_name"] == "Austin Bounce Party"
    assert res["primary_color"] == "#3b82f6"
    assert res["statement_descriptor"] == "AUSTIN BOUNCE"


def test_stripe_statement_descriptor(monkeypatch):
    def get_value(dt, name, field=None):
        if dt == "EE Brand" and field == "statement_descriptor":
            return "AUSTIN BOUNCE PARTY"
        return None

    fake_frappe = SimpleNamespace(
        db=SimpleNamespace(
            exists=lambda dt, name: name == "BR-AUSTIN",
            get_value=get_value,
        ),
        whitelist=lambda *a, **k: (lambda f: f),
    )
    monkeypatch.setattr(brand, "frappe", fake_frappe)

    desc = brand.get_stripe_statement_descriptor("BR-AUSTIN")
    assert desc == "AUSTIN BOUNCE PARTY"


def test_sales_transaction_cost_center_linkage(monkeypatch):
    fake_frappe = SimpleNamespace(
        db=SimpleNamespace(
            exists=lambda dt, filters: True if dt == "Cost Center" else False,
            get_value=lambda dt, filters, field=None: "Cost Center - Austin Bounce" if dt == "Cost Center" else None,
        ),
    )
    monkeypatch.setattr(brand, "frappe", fake_frappe)

    invoice = _FakeDoc(ee_brand="Austin Bounce")
    brand.on_sales_transaction_validate(invoice)
    assert invoice.cost_center == "Cost Center - Austin Bounce"
