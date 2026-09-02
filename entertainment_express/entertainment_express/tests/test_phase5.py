"""Phase 5 — billing schedules, processors, refunds."""

from datetime import date, time

import frappe
import pytest

from entertainment_express.billing_payments.processors import ProcessorNotConfigured, get_processor
from entertainment_express.billing_payments.schedules import ensure_schedule


def _need_bill():
    db = getattr(frappe, "db", None)
    exists = getattr(db, "exists", None) if db is not None else None
    if not callable(exists):
        pytest.skip("live frappe required")
    try:
        if not exists("DocType", "Payment Schedule"):
            pytest.skip("migrate required")
    except Exception:
        pytest.skip("migrate required")


class TestProcessors:
    def test_square_unconfigured(self):
        proc = get_processor("square")
        with pytest.raises(ProcessorNotConfigured):
            proc.refund("txn", 100, "test")

    def test_unknown_processor(self):
        with pytest.raises(ProcessorNotConfigured):
            get_processor("bitcoin")


class TestSchedule:
    def setup_method(self):
        _need_bill()
        if not frappe.db.exists("Customer", "TEST-BILL-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-BILL-CUST"}).insert(ignore_permissions=True)

    def test_deposit_plus_balance_equals_total(self):
        if not frappe.db.exists("DocType", "Payment Schedule"):
            pytest.skip("migrate required")
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-BILL-CUST",
            "status": "confirmed",
            "event_name": "Invoice Event",
            "event_date": date(2034, 1, 15),
            "start_time": time(18, 0),
            "end_time": time(22, 0),
            "grand_total": 400,
            "deposit_percent": 25,
            "deposit_amount": 100,
            "balance_due": 300,
        }).insert(ignore_permissions=True)
        ensure_schedule(bk.name)
        sched = frappe.get_doc("Payment Schedule", bk.name)
        total = sum(m.amount for m in sched.milestones)
        assert abs(total - 400) < 0.02
        kinds = {m.kind for m in sched.milestones}
        assert "deposit" in kinds
        assert "balance" in kinds


class TestStoredMethodNoPan:
    def test_fields_are_token_only(self):
        _need_bill()
        if not frappe.db.exists("DocType", "Stored Payment Method"):
            pytest.skip("migrate required")
        meta = frappe.get_meta("Stored Payment Method")
        names = {f.fieldname for f in meta.fields}
        assert "last4" in names
        assert "brand" in names
        assert "pan" not in names
        assert "card_number" not in names
