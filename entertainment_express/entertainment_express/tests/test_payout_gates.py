# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import sys
from unittest.mock import MagicMock

if "frappe" not in sys.modules:
    mock_frappe = MagicMock()
    mock_frappe._ = lambda x: x
    mock_frappe.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    mock_frappe.utils.now_datetime = lambda: "2026-09-16 12:00:00"
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_frappe.utils

from entertainment_express.payouts.gates import validate_teardown_payout_gate
from entertainment_express.payouts.instant_transfer import get_available_payout_balance, execute_instant_payout
from entertainment_express.payouts.reliability_engine import calculate_reliability_score, recompute_worker_reliability


def test_validate_teardown_payout_gate(monkeypatch):
    """Verify teardown gate approves clear bookings and blocks missing items."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name=None: True if doctype == "Event Booking" else False)

    res = validate_teardown_payout_gate("EB-2026-001", "worker@example.com")
    assert res["approved"] is True

    # Test blocked by open unreturned items
    monkeypatch.setattr(frappe.db, "exists", lambda *args, **kwargs: True)
    monkeypatch.setattr(frappe, "get_all", lambda doctype, **kwargs: [{"name": "ITEM-1"}] if doctype == "EE Booking Item" else [])

    res_blocked = validate_teardown_payout_gate("EB-2026-001", "worker@example.com")
    assert res_blocked["approved"] is False
    assert "incomplete" in res_blocked["reason"].lower()


def test_calculate_reliability_score():
    """Verify weighted reliability formula calculation."""
    # 0.40*100 + 0.25*100 + 0.20*100 + 0.15*100 = 100.0
    score_perfect = calculate_reliability_score(100.0, 100.0, 100.0, 100.0)
    assert score_perfect == 100.0

    # 0.40*80 + 0.25*80 + 0.20*80 + 0.15*80 = 80.0
    score_80 = calculate_reliability_score(80.0, 80.0, 80.0, 80.0)
    assert score_80 == 80.0


def test_execute_instant_payout(monkeypatch):
    """Verify instant payout creation upon clear gate check."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name=None: True if doctype == "Event Booking" else False)
    monkeypatch.setattr(frappe, "get_doc", lambda d: MagicMock(name="EE-IPO-001"))
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    res = execute_instant_payout("EB-2026-001", worker="worker@example.com")

    assert res["ok"] is True
    assert res["status"] == "Paid"
    assert res["net_payout"] > 0
