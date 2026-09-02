"""Phase 29 — safety compliance: isolation, expiry gate, guest cannot sign payer."""

from __future__ import annotations

import inspect
import sys
from types import ModuleType, SimpleNamespace

import pytest


def _install_frappe_stub() -> None:
    # Always refresh utils attrs needed by compliance imports
    m = sys.modules.get("frappe")
    if m is None or not hasattr(m, "whitelist"):
        m = ModuleType("frappe")
        m.whitelist = lambda *a, **k: (lambda f: f)
        m.PermissionError = type("PermissionError", (Exception,), {})
        m.ValidationError = type("ValidationError", (Exception,), {})
        m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
        m.get_roles = lambda *a, **k: []
        m.parse_json = lambda v: v if isinstance(v, dict) else {}
        m.session = SimpleNamespace(user="Administrator")
        m.local = SimpleNamespace(request_ip="127.0.0.1")
        m.logger = lambda: SimpleNamespace(error=lambda *_: None)
        m.db = SimpleNamespace()
        m.defaults = SimpleNamespace(get_global_default=lambda *_: "USD")
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})

    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.getdate = lambda x: x
    utils.nowdate = lambda: "2026-09-02"
    utils.now_datetime = lambda: "2026-09-02 12:00:00"
    utils.get_url = lambda: "https://example.test"
    utils.add_days = lambda d, n: d
    utils.get_datetime = lambda x: x
    utils.get_time = lambda x: x
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import compliance, safety  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.local = SimpleNamespace(request_ip="1.2.3.4")
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            set_value=lambda *a, **k: None,
            commit=lambda: None,
            sql=lambda *a, **k: [],
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://example.test")

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_meta(self, *a, **k):
        return SimpleNamespace(has_field=lambda *_: True)

    def parse_json(self, value):
        return value if isinstance(value, dict) else {}


def test_guest_denied_staff_safety(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(safety, "frappe", fake)
    with pytest.raises(_Perm):
        safety.list_certificates()
    with pytest.raises(_Perm):
        safety.safety_overview()
    with pytest.raises(_Perm):
        safety.log_sanitization({"asset": "A1"})


def test_guest_can_load_attendee_not_payer_sign(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="Guest")
    monkeypatch.setattr(safety, "frappe", fake)
    monkeypatch.setattr(compliance, "frappe", fake)

    waiver = SimpleNamespace(
        name="W1",
        booking="BK-1",
        template=None,
        status="pending",
        waiver_kind="attendee",
        public_token="tok",
        save=lambda **k: None,
    )

    def get_value(dt, filters=None, field=None, *a, **k):
        if dt == "EE Waiver" and isinstance(filters, dict) and filters.get("public_token") == "tok":
            return "W1"
        if dt == "Event Booking":
            return "Party"
        return None

    fake.db.get_value = get_value
    fake.get_doc = lambda *a, **k: waiver
    out = safety.get_attendee_waiver("tok")
    assert out["waiver_kind"] == "attendee"
    assert out["can_sign"] is True

    with pytest.raises(_Perm):
        compliance.sign_waiver("W1", "Guest Person")


def test_inspection_block_when_expired(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(safety, "frappe", fake)
    fake.db.table_exists = lambda *_: True
    fake.get_all = lambda *a, **k: [
        SimpleNamespace(name="C1", expires_on="2025-01-01", certificate_no="TX-1", authority="TDI")
    ]
    monkeypatch.setattr(safety, "getdate", lambda x: x)
    monkeypatch.setattr(safety, "nowdate", lambda: "2026-09-02")
    reason = safety.inspection_block_reason("ASSET-1", on_date="2026-09-02")
    assert reason and "expired" in reason.lower()


def test_inspection_ok_when_current(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(safety, "frappe", fake)
    fake.db.table_exists = lambda *_: True
    fake.get_all = lambda *a, **k: [
        SimpleNamespace(name="C1", expires_on="2027-01-01", certificate_no="TX-1", authority="TDI")
    ]
    monkeypatch.setattr(safety, "getdate", lambda x: x)
    monkeypatch.setattr(safety, "nowdate", lambda: "2026-09-02")
    assert safety.inspection_block_reason("ASSET-1", on_date="2026-09-02") is None


def test_no_tenant_site_args():
    src = inspect.getsource(safety)
    assert "frappe.connect" not in src
    for name, fn in inspect.getmembers(safety, inspect.isfunction):
        if name.startswith("_"):
            continue
        sig = str(inspect.signature(fn))
        assert "tenant" not in sig
        assert ", site" not in sig
