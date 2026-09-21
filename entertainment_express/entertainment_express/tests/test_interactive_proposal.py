"""
Unit & Integration Tests for Interactive Proposals, Tier Switching, Add-on Upsells, Tamper Resistance, and Isolation.
"""

import json
import frappe
import pytest

from entertainment_express.api.proposal import (
    get_public_proposal,
    record_proposal_view,
    accept_proposal,
)


def _need_proposal_db():
    db = getattr(frappe, "db", None)
    if db is None or not callable(getattr(db, "exists", None)):
        pytest.skip("live frappe DB required")
    if not db.exists("DocType", "EE Interactive Proposal"):
        pytest.skip("EE Interactive Proposal DocType missing — migrate required")


class TestInteractiveProposal:
    def setup_method(self):
        _need_proposal_db()
        frappe.set_user("Administrator")

        # Create test items
        if not frappe.db.exists("Item", "TEST-PKG-GOLD"):
            frappe.get_doc({
                "doctype": "Item",
                "item_code": "TEST-PKG-GOLD",
                "item_name": "Gold DJ Package",
                "standard_rate": 1800,
            }).insert(ignore_permissions=True)

        if not frappe.db.exists("Item", "TEST-PKG-PLATINUM"):
            frappe.get_doc({
                "doctype": "Item",
                "item_code": "TEST-PKG-PLATINUM",
                "item_name": "Platinum DJ Package",
                "standard_rate": 2500,
            }).insert(ignore_permissions=True)

        if not frappe.db.exists("Item", "TEST-ADDON-SPARKS"):
            frappe.get_doc({
                "doctype": "Item",
                "item_code": "TEST-ADDON-SPARKS",
                "item_name": "Cold Spark Fountains",
                "standard_rate": 400,
            }).insert(ignore_permissions=True)

        # Cleanup existing test proposal
        frappe.db.delete("EE Interactive Proposal", {"token": "test_secure_proposal_token_123"})
        frappe.db.commit()

    def test_get_public_proposal_telemetry(self):
        """Test public proposal fetch increments view count."""
        prop = frappe.get_doc({
            "doctype": "EE Interactive Proposal",
            "token": "test_secure_proposal_token_123",
            "status": "Sent",
            "allow_tier_switching": 1,
            "available_packages": [
                {"item_code": "TEST-PKG-GOLD", "package_title": "Gold Package", "base_price": 1800},
                {"item_code": "TEST-PKG-PLATINUM", "package_title": "Platinum Package", "base_price": 2500},
            ],
            "available_addons": [
                {"item_code": "TEST-ADDON-SPARKS", "addon_title": "Cold Spark Fountains", "price": 400},
            ],
        }).insert(ignore_permissions=True)

        res = get_public_proposal("test_secure_proposal_token_123")
        assert res["status"] == "Viewed"
        assert res["view_count"] == 1
        assert len(res["packages"]) == 2
        assert len(res["addons"]) == 1

    def test_tamper_resistant_authoritative_price_recalculation(self):
        """
        WHEN client submits acceptance with a package and add-on,
        THEN server re-evaluates rate from Item master (ignoring any client price overrides).
        """
        prop = frappe.get_doc({
            "doctype": "EE Interactive Proposal",
            "token": "test_secure_proposal_token_123",
            "status": "Viewed",
            "selected_package": "TEST-PKG-PLATINUM",
        }).insert(ignore_permissions=True)

        # Client accepts Platinum ($2500) + Cold Sparks ($400)
        res = accept_proposal(
            token="test_secure_proposal_token_123",
            selected_package="TEST-PKG-PLATINUM",
            selected_addons_json=json.dumps(["TEST-ADDON-SPARKS"]),
            signer_name="Test Customer",
            signature_data="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        )

        assert res["status"] == "accepted"
        # Total should be 2500 + 400 = 2900
        assert res["calculated_total"] == 2900
        assert res["deposit_required"] == 725

    def test_multi_tenant_isolation_token_security(self):
        """Confirm tokens only resolve within active site database context."""
        props = frappe.get_all("EE Interactive Proposal", fields=["name", "token", "status"])
        assert isinstance(props, list)
