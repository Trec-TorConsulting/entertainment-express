# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import sys
from unittest.mock import MagicMock

if "frappe" not in sys.modules:
    mock_frappe = MagicMock()
    mock_frappe._ = lambda x: x
    mock_frappe.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    mock_frappe.utils.now_datetime = lambda: "2026-09-16 12:00:00"
    mock_frappe.utils.today = lambda: "2026-09-16"
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_frappe.utils

from entertainment_express.exchange.client import (
    publish_overflow_job,
    browse_network_listings,
    accept_network_job,
)
from entertainment_express.exchange.compliance import verify_partner_coi, get_white_label_packet
from entertainment_express.exchange.escrow import complete_and_release_escrow


def test_publish_overflow_job(monkeypatch):
    """Verify overflow job publication creates anonymized EE Exchange Listing."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda *args, **kwargs: False)

    mock_doc = MagicMock(name="EE-EXL-001", control_plane_listing_id="CP-EXL-123456")
    monkeypatch.setattr(frappe, "get_doc", lambda d: mock_doc)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    res = publish_overflow_job(booking_id=None, payout_budget=600.0, category="DJ/MC")

    assert res["ok"] is True
    assert res["payout_budget"] == 600.0
    assert res["status"] == "Published"


def test_verify_partner_coi():
    """Verify COI validation gates partner job acceptance."""
    res = verify_partner_coi(required_minimum=1000000.0)
    assert res["ok"] is True
    assert res["verified"] is True
    assert res["coverage_amount"] >= 1000000.0


def test_complete_and_release_escrow(monkeypatch):
    """Verify mutual sign-off disburses escrow funds."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name: True)

    mock_txn = MagicMock(
        name="EE-EXT-001",
        completion_signoff_origin=0,
        completion_signoff_partner=0,
        escrow_amount=600.0,
        escrow_status="Pledged"
    )
    monkeypatch.setattr(frappe, "get_doc", lambda doctype, name: mock_txn)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    res = complete_and_release_escrow("EE-EXT-001", origin_signoff=True, partner_signoff=True)

    assert res["ok"] is True
    assert res["escrow_status"] == "Disbursed"


def test_tenant_isolation_no_direct_cross_db():
    """Sacred Rule #1 Audit: Ensure no direct cross-tenant SQL queries exist in exchange module."""
    import os
    import re

    exchange_dir = os.path.dirname(os.path.dirname(__file__)) + "/exchange"
    for filename in os.listdir(exchange_dir):
        if filename.endswith(".py"):
            filepath = os.path.join(exchange_dir, filename)
            with open(filepath, "r") as f:
                content = f.read()
                # Check that no cross-tenant site switching or raw db connects exist
                assert "frappe.init(" not in content
                assert "frappe.connect(" not in content
