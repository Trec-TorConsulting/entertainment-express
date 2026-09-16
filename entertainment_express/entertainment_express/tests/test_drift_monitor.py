"""
Unit tests for Real-Time Margin Drift Monitoring & Notification Alerts.
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
    mock_frappe.get_roles = lambda *a, **k: ["EE Tenant Admin"]
    mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
    mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
    mock_frappe.log_error = lambda *a, **k: None

    mock_utils = ModuleType("frappe.utils")
    mock_utils.cint = lambda v: int(v or 0)
    mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
    mock_utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):,.2f}"
    mock_utils.now_datetime = lambda: "2026-09-14 12:00:00"
    mock_utils.get_datetime = lambda v=None: "2026-09-14 12:00:00"

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

from entertainment_express.job_costing import drift_monitor
from entertainment_express.billing_payments.doctype.event_cost_sheet.event_cost_sheet import EventCostSheet


class _MockDriftDb:
    def __init__(self):
        self.docs = {}
        self.single_values = {
            ("EE Portal Settings", "margin_drift_warning_threshold"): 5.0,
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
                res.append(getattr(doc, pluck, n) if pluck else {"name": n})
        return res


class _MockEnv:
    def __init__(self):
        self.db = _MockDriftDb()

    def get_doc(self, doctype, name):
        doc = self.db.docs.get((doctype, name))
        if not doc:
            raise Exception(f"{doctype} {name} not found")
        return doc


def test_overtime_triggers_margin_drift_alert(monkeypatch):
    """
    Spec Scenario: Overtime causes margin drift alert:
    - Projected margin = 45.0%, threshold = 5.0%
    - Overtime causes actual margin to drop to 36.0% (drift = 9.0%)
    - Updates margin_drift_percent = 9.0%, sets margin_status to 'warning', dispatches alert.
    """
    env = _MockEnv()
    monkeypatch.setattr(drift_monitor, "frappe", env)
    monkeypatch.setattr("entertainment_express.job_costing.drift_monitor.frappe", env)

    booking = SimpleNamespace(
        name="BK-DRIFT-01",
        event_name="High School Prom",
        grand_total=3000.0,
        status="confirmed",
        cost_sheet="ECS-BK-DRIFT-01",
        cost_center="CC-BK-DRIFT-01",
        project="PRJ-BK-DRIFT-01",
        assigned_assets=[],
    )
    env.db.docs[("Event Booking", "BK-DRIFT-01")] = booking

    sheet = EventCostSheet()
    sheet.name = "ECS-BK-DRIFT-01"
    sheet.event_booking = "BK-DRIFT-01"
    sheet.gross_revenue = 3000.0
    sheet.projected_gross_revenue = 3000.0
    sheet.projected_labor_cost = 1250.0
    sheet.projected_subcontractor_cost = 400.0
    sheet.projected_consumable_cost = 0.0
    sheet.projected_equipment_wear = 0.0
    sheet.projected_gateway_fees = 0.0
    sheet.projected_total_cogs = 1650.0
    sheet.projected_net_profit = 1350.0
    sheet.projected_margin_percent = 45.0
    sheet.target_margin_percent = 40.0

    # Actuals with overtime labor: labor = 1520 + other cogs = 400 => total actual cogs = 1920
    # Net profit = 3000 - 1920 = 1080 => actual margin = 36.0%
    sheet.labor_cost = 1520.0
    sheet.subcontractor_cost = 400.0
    sheet.consumable_cost = 0.0
    sheet.equipment_wear_cost = 0.0
    sheet.gateway_fees = 0.0
    sheet.calculate_totals()
    sheet.save = lambda *a, **k: sheet

    env.db.docs[("Event Cost Sheet", "ECS-BK-DRIFT-01")] = sheet

    # Mock recompute_event_cost_sheet to keep our seeded sheet
    monkeypatch.setattr(
        "entertainment_express.job_costing.drift_monitor.recompute_event_cost_sheet",
        lambda name: {"gross_revenue": 3000.0, "labor_cost": 1520.0},
    )

    notifications_sent = []
    monkeypatch.setattr(
        "entertainment_express.job_costing.drift_monitor.send_margin_drift_alert",
        lambda **k: notifications_sent.append(k),
    )

    res = drift_monitor.evaluate_booking_margin_drift("BK-DRIFT-01")

    assert res["margin_drift_percent"] == 9.0
    assert res["drift_breached"] is True
    assert res["margin_status"] == "warning"
    assert res["alert_sent"] is True
    assert len(notifications_sent) == 1
    assert notifications_sent[0]["drift_percent"] == 9.0


def test_minor_expense_within_drift_threshold(monkeypatch):
    """
    When actual margin drops from 45.0% to 42.0% (drift = 3.0% <= 5.0%),
    no alert is sent and status remains healthy.
    """
    env = _MockEnv()
    monkeypatch.setattr(drift_monitor, "frappe", env)

    booking = SimpleNamespace(
        name="BK-DRIFT-02",
        event_name="Small Birthday Party",
        grand_total=1000.0,
        cost_sheet="ECS-BK-DRIFT-02",
        assigned_assets=[],
    )
    env.db.docs[("Event Booking", "BK-DRIFT-02")] = booking

    sheet = EventCostSheet()
    sheet.name = "ECS-BK-DRIFT-02"
    sheet.event_booking = "BK-DRIFT-02"
    sheet.gross_revenue = 1000.0
    sheet.projected_gross_revenue = 1000.0
    sheet.projected_labor_cost = 550.0
    sheet.projected_subcontractor_cost = 0.0
    sheet.projected_consumable_cost = 0.0
    sheet.projected_equipment_wear = 0.0
    sheet.projected_gateway_fees = 0.0
    sheet.projected_margin_percent = 45.0
    sheet.target_margin_percent = 40.0
    sheet.labor_cost = 580.0  # Actual margin = 42.0% (drift = 3.0%)
    sheet.subcontractor_cost = 0.0
    sheet.consumable_cost = 0.0
    sheet.equipment_wear_cost = 0.0
    sheet.gateway_fees = 0.0
    sheet.calculate_totals()
    sheet.save = lambda *a, **k: sheet
    sheet.save = lambda *a, **k: sheet

    env.db.docs[("Event Cost Sheet", "ECS-BK-DRIFT-02")] = sheet

    monkeypatch.setattr(
        "entertainment_express.job_costing.drift_monitor.recompute_event_cost_sheet",
        lambda name: {"gross_revenue": 1000.0},
    )

    notifications_sent = []
    monkeypatch.setattr(
        "entertainment_express.job_costing.drift_monitor.send_margin_drift_alert",
        lambda **k: notifications_sent.append(k),
    )

    res = drift_monitor.evaluate_booking_margin_drift("BK-DRIFT-02")

    assert res["margin_drift_percent"] == 3.0
    assert res["drift_breached"] is False
    assert res["alert_sent"] is False
    assert len(notifications_sent) == 0
