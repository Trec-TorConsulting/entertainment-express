# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import sys
from unittest.mock import MagicMock

if "frappe" not in sys.modules:
    mock_frappe = MagicMock()
    mock_frappe._ = lambda x: x
    mock_frappe.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    mock_frappe.utils.now_datetime = lambda: "2026-09-16 12:00:00"
    mock_frappe.utils.add_to_date = lambda d, minutes=0: "2026-09-16 12:15:00"
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_frappe.utils

from entertainment_express.copilot.timeline_synthesizer import generate_run_of_show
from entertainment_express.copilot.emergency_dispatch import (
    trigger_emergency_replacement_ladder,
    claim_emergency_shift,
)
from entertainment_express.copilot.document_parser import parse_pdf_rider


def test_generate_run_of_show(monkeypatch):
    """Verify run-of-show timeline synthesis with sunset and curfew moments."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda *args, **kwargs: False)

    q_data = {
        "event_date": "2026-09-16",
        "start_time": "16:00",
        "end_time": "23:00",
        "event_type": "Wedding Reception"
    }

    res = generate_run_of_show(booking_id=None, questionnaire_data=q_data)

    assert res["ok"] is True
    assert res["moments_count"] >= 5
    assert "solar" in res
    assert res["solar"]["sunset"] is not None


def test_trigger_emergency_replacement_ladder(monkeypatch):
    """Verify emergency dispatch ladder generates tokenized shift offers."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda doctype, name: True)
    monkeypatch.setattr(frappe, "get_doc", lambda *args, **kwargs: MagicMock())
    monkeypatch.setattr(frappe, "get_all", lambda *args, **kwargs: [
        {"name": "dj_alex@example.com", "full_name": "Alex DJ", "email": "alex@example.com"},
        {"name": "dj_sam@example.com", "full_name": "Sam DJ", "email": "sam@example.com"},
    ])
    monkeypatch.setattr(frappe.db, "commit", lambda: None)

    res = trigger_emergency_replacement_ladder("EB-2026-001", required_role="Lead DJ")

    assert res["ok"] is True
    assert res["candidates_count"] == 2
    assert len(res["dispatch_ladder"]) == 2
    assert res["dispatch_ladder"][0]["token"] is not None


def test_parse_pdf_rider(monkeypatch):
    """Verify PDF rider extraction returns structured specs."""
    import frappe
    monkeypatch.setattr(frappe.db, "exists", lambda *args, **kwargs: False)

    sample_pdf_text = "Client: Corporate Events LLC\nDate: 2026-10-20\nVenue: Metropolitan Center"
    res = parse_pdf_rider(pdf_text=sample_pdf_text)

    assert res["ok"] is True
    assert res["extracted_specs"]["client_name"] == "Corporate Events LLC"
    assert res["extracted_specs"]["event_date"] == "2026-10-20"
    assert len(res["extracted_specs"]["required_equipment"]) >= 2
