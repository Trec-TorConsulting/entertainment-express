# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import sys
from unittest.mock import MagicMock

# Mock frappe before importing offline_sync if frappe is not present
if "frappe" not in sys.modules:
    mock_frappe = MagicMock()
    mock_frappe._ = lambda x: x
    mock_frappe.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    mock_frappe.utils.now_datetime = lambda: "2026-09-16 12:00:00"
    mock_frappe.utils.getdate = lambda d=None: "2026-09-16"
    mock_frappe.utils.today = lambda: "2026-09-16"
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_frappe.utils

from entertainment_express.api.offline_sync import (
    get_day_offline_manifest,
    sync_offline_batch,
)


def test_get_day_offline_manifest(monkeypatch):
    """Verify get_day_offline_manifest constructs complete payload with worker and manifests."""
    mock_bookings = [
        {
            "name": "EB-2026-001",
            "customer_name": "Acme Corp",
            "event_name": "Annual Gala",
            "event_date": "2026-09-16",
            "venue": "Grand Ballroom",
        }
    ]

    import frappe
    monkeypatch.setattr(frappe, "session", MagicMock(user="crew_lead@example.com"))
    monkeypatch.setattr(frappe, "get_all", lambda doctype, **kwargs: mock_bookings if doctype == "Event Booking" else [])
    monkeypatch.setattr(frappe.db, "exists", lambda *args, **kwargs: True)

    manifest = get_day_offline_manifest(worker="crew_lead@example.com", target_date="2026-09-16")

    assert manifest["worker"] == "crew_lead@example.com"
    assert manifest["date"] == "2026-09-16"
    assert len(manifest["manifests"]) == 1
    assert manifest["manifests"][0]["booking"]["name"] == "EB-2026-001"


def test_sync_offline_batch_idempotency(monkeypatch):
    """Verify sync_offline_batch prevents double processing of identical mutation UUIDs."""
    import frappe

    logged_uuids = set()

    def mock_get_value(doctype, filters, fields=None, as_dict=False):
        if filters and isinstance(filters, dict) and filters.get("client_uuid") in logged_uuids:
            return {"status": "Success", "error_message": None}
        return None

    def mock_insert(self, ignore_permissions=False):
        logged_uuids.add(self.client_uuid)
        return self

    def mock_get_doc(d):
        m = MagicMock()
        m.client_uuid = d.get("client_uuid")
        m.insert = lambda ignore_permissions=False: mock_insert(m, ignore_permissions)
        return m

    monkeypatch.setattr(frappe.db, "get_value", mock_get_value)
    monkeypatch.setattr(frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(frappe.db, "commit", lambda: None)
    monkeypatch.setattr(frappe, "session", MagicMock(user="worker@example.com"))

    mutations = [
        {
            "mutation_uuid": "uuid-111-222-333",
            "action": "scan_asset_loaded",
            "booking": "EB-2026-001",
            "barcode": "BARCODE-001",
            "client_timestamp": "2026-09-16T12:00:00Z"
        },
        {
            "mutation_uuid": "uuid-111-222-333",  # Duplicate UUID
            "action": "scan_asset_loaded",
            "booking": "EB-2026-001",
            "barcode": "BARCODE-001",
            "client_timestamp": "2026-09-16T12:00:05Z"
        }
    ]

    res = sync_offline_batch(mutations)

    assert res["ok"] is True
    assert res["processed_count"] == 2
    assert res["results"][0]["status"] == "Success"
    assert res["results"][1]["status"] == "Success"
    assert "Idempotent skip" in res["results"][1].get("note", "")


def test_sync_offline_batch_invalid_input():
    """Verify graceful handling of invalid or empty mutation payloads."""
    res = sync_offline_batch(None)
    assert res["ok"] is False

    res_empty = sync_offline_batch([])
    assert res_empty["ok"] is False
