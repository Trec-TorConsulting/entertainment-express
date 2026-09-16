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
    mock_frappe.utils.getdate = lambda d=None: "2026-09-16"
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_frappe.utils

from entertainment_express.live_ops.flight_deck import (
    haversine_distance,
    get_active_flight_deck,
    update_field_milestone,
)
from entertainment_express.live_ops.timeline_pacing import shift_timeline_pacing
from entertainment_express.live_ops.incident_desk import report_incident, resolve_incident


def test_haversine_distance():
    """Verify Haversine distance calculation in meters."""
    # Distance between same points should be 0
    dist_zero = haversine_distance(40.7128, -74.0060, 40.7128, -74.0060)
    assert round(dist_zero, 1) == 0.0

    # Distance between NYC and Newark (~15km)
    dist_nyc_newark = haversine_distance(40.7128, -74.0060, 40.7357, -74.1724)
    assert 14000 <= dist_nyc_newark <= 16000


def test_update_field_milestone(monkeypatch):
    """Verify field milestone status update and geofence verification."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name: True)
    monkeypatch.setattr(frappe.db, "set_value", lambda *args, **kwargs: None)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    res = update_field_milestone("EB-2026-001", "on_site", latitude=40.7128, longitude=-74.0060)
    assert res["ok"] is True
    assert res["geofence_verified"] is True
    assert res["new_status"] == "on_site"


def test_shift_timeline_pacing(monkeypatch):
    """Verify live timeline delay calculator shifts moments."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name=None: True)
    monkeypatch.setattr(frappe.db, "set_value", lambda *args, **kwargs: None)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)
    monkeypatch.setattr(frappe, "get_all", lambda *args, **kwargs: [{"name": "M-1"}, {"name": "M-2"}])

    res = shift_timeline_pacing("EB-2026-001", offset_minutes=20, reason="Speech running late")

    assert res["ok"] is True
    assert res["offset_minutes"] == 20
    assert res["shifted_moments_count"] == 2


def test_report_and_resolve_incident(monkeypatch):
    """Verify live incident reporting and resolution desk."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name=None: True)
    def mock_get_doc(d):
        m = MagicMock()
        m.name = "EE-INC-001"
        return m

    monkeypatch.setattr(frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(frappe.db, "set_value", lambda *args, **kwargs: None)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    rep = report_incident("EB-2026-001", severity="Major", category="Audio/Visual Equipment", description="Wireless mic feedback")
    assert rep["ok"] is True
    assert rep["incident_id"] == "EE-INC-001"

    res = resolve_incident("EE-INC-001", resolution_notes="Frequency changed")
    assert res["ok"] is True
    assert res["status"] == "Resolved"
