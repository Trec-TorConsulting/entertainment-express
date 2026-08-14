"""Phase 12 — SaaS control plane."""

import frappe
import pytest

from entertainment_express.control_plane.entitlements import require_entitlement
from entertainment_express.control_plane.lifecycle import suspend_tenant, resume_tenant
from entertainment_express.security.request_guards import enforce_tenant_suspension


class TestUsageAppendOnly:
    def test_cannot_amend_quantity(self):
        if not frappe.db.exists("DocType", "Usage Record"):
            pytest.skip("migrate required")
        if not frappe.db.exists("DocType", "Tenant"):
            pytest.skip("no tenant doctype")
        tenant = frappe.db.get_value("Tenant", {})
        if not tenant:
            pytest.skip("no tenant row")
        rec = frappe.get_doc({
            "doctype": "Usage Record",
            "tenant": tenant,
            "metric": "bookings",
            "period_start": "2030-01-01",
            "period_end": "2030-01-31",
            "quantity": 3,
        }).insert(ignore_permissions=True)
        rec.quantity = 99
        with pytest.raises(Exception):
            rec.save()


class TestEntitlement:
    def test_require_entitlement_allows_control_plane(self):
        # No Tenant for this site → has_entitlement returns True
        require_entitlement("anything")


class TestSuspend:
    def test_suspended_conf_blocks_api(self):
        frappe.conf["ee_suspended"] = 1

        class Req:
            path = "/api/method/entertainment_express.api.booking.convert_to_booking"

        frappe.local.request = Req()
        with pytest.raises(Exception):
            enforce_tenant_suspension()
        frappe.conf["ee_suspended"] = 0
