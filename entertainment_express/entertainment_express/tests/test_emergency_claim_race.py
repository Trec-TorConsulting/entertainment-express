"""Unit tests for emergency shift claim concurrency: atomic claim lock and recipient token isolation."""

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
    m.get_roles = lambda *a, **k: ["EE Dispatcher"]
    m.session = SimpleNamespace(user="staff@test.com")
    m.generate_hash = lambda length=16: "TOK-9999"
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        set_value=lambda *a, **k: None,
        commit=lambda: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import emergency_dispatch  # noqa: E402


def test_atomic_emergency_shift_claim_race_condition(monkeypatch):
    """Simulate 5 concurrent workers attempting to claim shift; assert exactly ONE winner."""
    callout_state = {"status": "broadcasting", "claimed_by": None}

    def fake_get_value(dt, filters, field=None):
        if callout_state["status"] == "broadcasting":
            return "CALLOUT-01"
        return None

    def fake_set_value(dt, name, values):
        callout_state["status"] = values["status"]
        callout_state["claimed_by"] = values["claimed_by"]

    fake_frappe = SimpleNamespace(
        db=SimpleNamespace(
            table_exists=lambda dt: True,
            get_value=fake_get_value,
            set_value=fake_set_value,
            commit=lambda: None,
        ),
        session=SimpleNamespace(user="EMP-01"),
        whitelist=lambda *a, **k: (lambda f: f),
        PermissionError=Exception,
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )

    monkeypatch.setattr(emergency_dispatch, "frappe", fake_frappe)

    results = []
    for worker_id in ["EMP-01", "EMP-02", "EMP-03", "EMP-04", "EMP-05"]:
        res = emergency_dispatch.claim_emergency_shift(token="tok-999", worker_id=worker_id)
        results.append(res)

    winners = [r for r in results if r["winner"] is True]
    losers = [r for r in results if r["winner"] is False]

    assert len(winners) == 1
    assert len(losers) == 4
    assert winners[0]["worker_id"] == "EMP-01"
    assert losers[0]["status"] == "already_claimed"


def test_emergency_crew_cascade_token_generation(monkeypatch):
    mock_candidates = [
        {"employee_id": "EMP-101", "name": "Marcus Vance", "phone": "+155501", "score": 95},
        {"employee_id": "EMP-102", "name": "Elena Rostova", "phone": "+155502", "score": 90},
    ]

    fake_frappe = SimpleNamespace(
        get_roles=lambda: ["EE Dispatcher"],
        db=SimpleNamespace(
            table_exists=lambda dt: True,
            commit=lambda: None,
        ),
        get_doc=lambda dt: SimpleNamespace(insert=lambda ignore_permissions=True: None),
        generate_hash=lambda length=16: "TOK-UNIQUE-1234",
        whitelist=lambda *a, **k: (lambda f: f),
        session=SimpleNamespace(user="dispatcher@test.com"),
    )

    monkeypatch.setattr(emergency_dispatch, "frappe", fake_frappe)
    monkeypatch.setattr(emergency_dispatch, "_assert_dispatch_access", lambda: None)
    monkeypatch.setattr(emergency_dispatch, "find_replacement_candidates", lambda b, required_role="Lead DJ": mock_candidates)

    res = emergency_dispatch.launch_emergency_crew_cascade("BK-100", required_role="Lead DJ", bonus_amount=150.0)
    assert res["status"] == "cascade_launched"
    assert len(res["recipients"]) == 2
    assert res["recipients"][0]["worker_id"] == "EMP-101"
    assert res["recipients"][0]["claim_url"] == "/claim/TOK-UNIQUE-1234"
