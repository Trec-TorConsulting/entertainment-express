"""
Unit tests for Post-Event Ledger Settlement, Journal Entry Creation, and Cost Center Lock Enforcement.
"""

import sys
from types import ModuleType, SimpleNamespace
import pytest

# Ensure a mock 'frappe' module is available if running outside a full Frappe environment
if "frappe" not in sys.modules:
    mock_frappe = ModuleType("frappe")
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})
    mock_frappe.get_roles = lambda *a, **k: ["EE Crew"]
    mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
    mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
    mock_frappe.log_error = lambda *a, **k: None

    mock_utils = ModuleType("frappe.utils")
    mock_utils.cint = lambda v: int(v or 0)
    mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
    mock_utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):,.2f}"
    mock_utils.now_datetime = lambda: "2026-09-14 12:00:00"
    mock_utils.get_datetime = lambda v=None: "2026-09-14 12:00:00"
    mock_utils.add_days = lambda dt, d: "2026-09-07 12:00:00"

    mock_doc_module = ModuleType("frappe.model.document")
    class Document:
        def __init__(self, *args, **kwargs):
            self.name = kwargs.get("name", "DOC-001")
            for k, v in kwargs.items():
                setattr(self, k, v)
        def is_new(self):
            return False
        def save(self, *a, **k):
            return self
        def insert(self, *a, **k):
            return self

    mock_doc_module.Document = Document

    mock_frappe.utils = mock_utils
    mock_frappe.model = ModuleType("frappe.model")
    mock_frappe.model.document = mock_doc_module
    mock_frappe.defaults = SimpleNamespace(get_user_default=lambda *_: "Test Company")
    mock_frappe.session = SimpleNamespace(user="admin@entx.app")
    mock_frappe.db = SimpleNamespace(
        get_default=lambda *_: "USD",
        exists=lambda *a, **k: False,
        table_exists=lambda *_: True,
        get_value=lambda *a, **k: None,
        get_single_value=lambda *a, **k: None,
        get_all=lambda *a, **k: [],
        set_value=lambda *a, **k: None,
    )
    mock_frappe.get_meta = lambda dt: SimpleNamespace(has_field=lambda f: True)
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_utils
    sys.modules["frappe.model"] = mock_frappe.model
    sys.modules["frappe.model.document"] = mock_doc_module

from entertainment_express.job_costing import settlement
from entertainment_express.billing_payments.doctype.event_cost_sheet.event_cost_sheet import EventCostSheet


class _MockSettlementDb:
    def __init__(self):
        self.docs = {}
        self.single_values = {
            ("EE Portal Settings", "auto_lock_cost_center_days"): 7,
            ("EE Portal Settings", "low_margin_warning_threshold"): 25.0,
        }

    def table_exists(self, name):
        return True

    def exists(self, doctype, name):
        return (doctype, name) in self.docs

    def get_value(self, doctype, filters, fieldname="name"):
        if isinstance(filters, dict):
            for (dt, n), doc in self.docs.items():
                if dt == doctype and all(getattr(doc, k, None) == v for k, v in filters.items()):
                    return getattr(doc, fieldname, n)
        doc = self.docs.get((doctype, filters))
        return getattr(doc, fieldname, None) if doc else None

    def get_single_value(self, doctype, fieldname):
        return self.single_values.get((doctype, fieldname))

    def get_all(self, doctype, filters=None, fields=None, pluck=None, **k):
        res = []
        for (dt, n), doc in self.docs.items():
            if dt == doctype:
                matches = True
                if filters:
                    for fk, fv in filters.items():
                        if getattr(doc, fk, None) != fv:
                            matches = False
                if matches:
                    if pluck:
                        res.append(getattr(doc, pluck, n))
                    else:
                        item = {"name": n}
                        if fields:
                            for f in fields:
                                item[f] = getattr(doc, f, None)
                        res.append(item)
        return res


class _MockEnv:
    def __init__(self):
        self.db = _MockSettlementDb()
        self.session = SimpleNamespace(user="owner@entx.app")
        self.defaults = SimpleNamespace(get_user_default=lambda *_: "Test Company")
        self.ValidationError = type("ValidationError", (ValueError,), {})
        self.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
        self.PermissionError = type("PermissionError", (Exception,), {})
        self._roles = ["EE Crew"]

    def get_roles(self):
        return list(self._roles)

    def throw(self, msg, exc=None):
        exc_class = exc or Exception
        raise exc_class(msg)

    def get_doc(self, doctype, name=None):
        if isinstance(doctype, dict):
            dt = doctype.get("doctype")
            doc = SimpleNamespace(**doctype)
            doc.name = f"JE-{len(self.db.docs)+1}"
            doc.insert = lambda *a, **k: self._insert(dt, doc)
            doc.save = lambda *a, **k: self._save(dt, doc)
            return doc

        doc = self.db.docs.get((doctype, name))
        if not doc:
            raise self.DoesNotExistError(f"{doctype} {name} not found")
        return doc

    def _insert(self, doctype, doc):
        self.db.docs[(doctype, doc.name)] = doc
        return doc

    def _save(self, doctype, doc):
        self.db.docs[(doctype, doc.name)] = doc
        return doc


def test_post_event_settlement_locks_cost_center(monkeypatch):
    """
    Spec Scenario: Booking completion closes cost center:
    - GIVEN an Event Booking transitioned to 'completed' status
    - WHEN post-event settlement executes
    - THEN sets is_ledger_locked = 1, creates Journal Entry for equipment wear, locks Cost Center.
    """
    env = _MockEnv()
    monkeypatch.setattr(settlement, "frappe", env)
    monkeypatch.setattr("entertainment_express.job_costing.settlement.frappe", env)

    booking = SimpleNamespace(
        name="BK-SETTLE-01",
        status="completed",
        company="Company Alpha",
        cost_sheet="ECS-BK-SETTLE-01",
        cost_center="CC-BK-SETTLE-01",
    )
    env.db.docs[("Event Booking", "BK-SETTLE-01")] = booking

    sheet = EventCostSheet()
    sheet.name = "ECS-BK-SETTLE-01"
    sheet.event_booking = "BK-SETTLE-01"
    sheet.gross_revenue = 2500.0
    sheet.labor_cost = 600.0
    sheet.subcontractor_cost = 0.0
    sheet.consumable_cost = 0.0
    sheet.equipment_wear_cost = 45.0  # Accrued wear
    sheet.gateway_fees = 0.0
    sheet.is_ledger_locked = 0
    sheet.calculate_totals()
    sheet.save = lambda *a, **k: sheet
    env.db.docs[("Event Cost Sheet", "ECS-BK-SETTLE-01")] = sheet

    cost_center = SimpleNamespace(name="CC-BK-SETTLE-01", disabled=0)
    cost_center.save = lambda *a, **k: cost_center
    env.db.docs[("Cost Center", "CC-BK-SETTLE-01")] = cost_center

    monkeypatch.setattr(
        "entertainment_express.job_costing.settlement.recompute_event_cost_sheet",
        lambda name: {"gross_revenue": 2500.0},
    )

    res = settlement.settle_event_cost_center("BK-SETTLE-01")

    assert res["locked"] is True
    assert res["booking_name"] == "BK-SETTLE-01"
    assert res["journal_entry"] is not None
    assert sheet.is_ledger_locked == 1
    assert sheet.locked_by == "owner@entx.app"
    assert cost_center.disabled == 1


def test_locked_ledger_rejects_expense_postings(monkeypatch):
    """
    Spec Scenario: Post-settlement ledger lock enforcement:
    - WHEN is_ledger_locked = 1 on an Event Cost Sheet
    - THEN subsequent attempt to post a Timesheet / Purchase Invoice raises ValidationError for non-admin.
    """
    env = _MockEnv()
    env._roles = ["EE Crew"]
    monkeypatch.setattr(settlement, "frappe", env)

    booking = SimpleNamespace(
        name="BK-LOCKED-01",
        status="completed",
        cost_sheet="ECS-BK-LOCKED-01",
    )
    env.db.docs[("Event Booking", "BK-LOCKED-01")] = booking

    sheet = SimpleNamespace(
        name="ECS-BK-LOCKED-01",
        event_booking="BK-LOCKED-01",
        is_ledger_locked=1,
    )
    env.db.docs[("Event Cost Sheet", "ECS-BK-LOCKED-01")] = sheet

    doc = SimpleNamespace(doctype="Timesheet", name="TS-LATE-001", ee_booking="BK-LOCKED-01")

    with pytest.raises(env.ValidationError) as excinfo:
        settlement.validate_expense_against_locked_ledger(doc)

    assert "locked post-event settlement" in str(excinfo.value)

    # When role is EE Tenant Admin: validation passes without error
    env._roles = ["EE Tenant Admin"]
    settlement.validate_expense_against_locked_ledger(doc)


def test_auto_settle_completed_bookings_job(monkeypatch):
    """
    Daily scheduled task finds completed bookings older than auto_lock_cost_center_days
    and auto-settles them.
    """
    env = _MockEnv()
    monkeypatch.setattr(settlement, "frappe", env)

    b1 = SimpleNamespace(name="BK-AUTO-1", status="completed", modified="2026-09-01 10:00:00", cost_sheet="ECS-1")
    s1 = EventCostSheet()
    s1.name = "ECS-1"
    s1.event_booking = "BK-AUTO-1"
    s1.gross_revenue = 1000.0
    s1.labor_cost = 300.0
    s1.subcontractor_cost = 0.0
    s1.consumable_cost = 0.0
    s1.equipment_wear_cost = 0.0
    s1.gateway_fees = 0.0
    s1.is_ledger_locked = 0
    s1.calculate_totals()
    s1.save = lambda *a, **k: s1

    env.db.docs[("Event Booking", "BK-AUTO-1")] = b1
    env.db.docs[("Event Cost Sheet", "ECS-1")] = s1

    monkeypatch.setattr(
        "entertainment_express.job_costing.settlement.recompute_event_cost_sheet",
        lambda name: {"gross_revenue": 1000.0},
    )

    settled_count = settlement.auto_settle_completed_bookings()

    assert settled_count == 1
    assert s1.is_ledger_locked == 1
