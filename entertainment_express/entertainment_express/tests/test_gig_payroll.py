"""Unit tests for Gig Rate Cards, Automated Sales Commissions, Digital Tip Pool Splitting,
and ERPNext Salary Slip Payroll Batch Compilation.
"""

import sys
from types import ModuleType, SimpleNamespace
from datetime import date, datetime, timedelta
import pytest

# Ensure a mock 'frappe' module is available if running outside Frappe bench
if "frappe" in sys.modules:
    mock_frappe = sys.modules["frappe"]
else:
    mock_frappe = ModuleType("frappe")
    sys.modules["frappe"] = mock_frappe

if not hasattr(mock_frappe, "PermissionError"):
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
if not hasattr(mock_frappe, "DoesNotExistError"):
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
if not hasattr(mock_frappe, "ValidationError"):
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})

mock_frappe.get_roles = lambda *a, **k: ["EE Tenant Admin", "EE Finance", "EE Dispatcher"]
mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
mock_frappe.log_error = lambda *a, **k: None
mock_frappe.sendmail = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.nowdate = lambda: str(date.today())
mock_utils.today = lambda: str(date.today())
mock_utils.getdate = lambda d=None: (
    d if isinstance(d, date)
    else datetime.strptime(str(d)[:10], "%Y-%m-%d").date() if d
    else date.today()
)
mock_utils.add_days = lambda d, n: str(mock_utils.getdate(d) + timedelta(days=n))
mock_utils.now_datetime = lambda: "2026-09-14 12:00:00"

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

    def append(self, fieldname, value):
        if not hasattr(self, fieldname):
            setattr(self, fieldname, [])
        val = getattr(self, fieldname)
        if isinstance(value, dict):
            obj = SimpleNamespace(**value)
            val.append(obj)
        else:
            val.append(value)
        return value

mock_doc_module.Document = Document

mock_frappe.utils = mock_utils
mock_frappe.model = ModuleType("frappe.model")
mock_frappe.model.document = mock_doc_module
mock_frappe.defaults = SimpleNamespace(get_user_default=lambda *_: "Test Ent Co")
if not hasattr(mock_frappe, "db") or not mock_frappe.db:
    mock_frappe.db = SimpleNamespace()

mock_frappe.db.get_default = lambda *_: "USD"
mock_frappe.db.exists = lambda *a, **k: False
mock_frappe.db.table_exists = lambda *_: True
mock_frappe.db.get_value = lambda *a, **k: None
mock_frappe.db.get_single_value = lambda *a, **k: None
mock_frappe.db.get_all = lambda *a, **k: []
mock_frappe.db.set_value = lambda *a, **k: None
mock_frappe.db.count = lambda *a, **k: 0
mock_frappe.db.commit = lambda: None
mock_frappe.db.sql = lambda *a, **k: []
mock_frappe.get_meta = lambda dt: SimpleNamespace(has_field=lambda f: True)
mock_frappe.session = SimpleNamespace(user="Administrator")

sys.modules["frappe"] = mock_frappe
sys.modules["frappe.utils"] = mock_utils
sys.modules["frappe.model"] = mock_frappe.model
sys.modules["frappe.model.document"] = mock_doc_module

import frappe
from entertainment_express.payroll.rate_engine import calculate_gig_earnings, get_rate_card
from entertainment_express.payroll.commissions import (
    accrue_booking_commission,
    clawback_booking_commission,
)
from entertainment_express.payroll.tip_splitter import (
    distribute_booking_tips,
    lock_tip_distribution,
)
from entertainment_express.payroll.payroll_compiler import compile_payroll_batch
from entertainment_express.payroll.salary_components import (
    DEFAULT_SALARY_COMPONENTS,
    seed_salary_components,
)


def test_gig_rate_card_calculations(monkeypatch):
    """Test flat fee, hourly, and flat_plus_hourly rate card calculations with overtime."""
    cards_db = {
        "RC-DJ-WEDDING": SimpleNamespace(
            name="RC-DJ-WEDDING",
            role="Lead DJ",
            event_type="Wedding",
            calculation_type="flat_fee",
            base_rate=500.0,
            overtime_rate=75.0,
            standard_duration_hours=4.0,
            is_active=1,
        ),
        "RC-CREW-HOURLY": SimpleNamespace(
            name="RC-CREW-HOURLY",
            role="Roadie",
            event_type="All",
            calculation_type="hourly",
            base_rate=25.0,
            overtime_rate=37.5,
            standard_duration_hours=4.0,
            is_active=1,
        ),
        "RC-BOOTH-FLAT-HOURLY": SimpleNamespace(
            name="RC-BOOTH-FLAT-HOURLY",
            role="Booth Attendant",
            event_type="",
            calculation_type="flat_plus_hourly",
            base_rate=200.0,
            overtime_rate=30.0,
            standard_duration_hours=3.0,
            is_active=1,
        ),
    }

    monkeypatch.setattr(
        frappe.db,
        "get_value",
        lambda dt, filters, fieldname=None, as_dict=False: (
            "RC-DJ-WEDDING" if filters.get("role") == "Lead DJ" and filters.get("event_type") == "Wedding"
            else "RC-CREW-HOURLY" if filters.get("role") == "Roadie"
            else "RC-BOOTH-FLAT-HOURLY" if filters.get("role") == "Booth Attendant"
            else None
        ) if dt == "Gig Rate Card" else None,
    )
    monkeypatch.setattr(
        frappe,
        "get_doc",
        lambda dt, name=None: cards_db.get(name) if dt == "Gig Rate Card" else None,
    )

    # 1. Lead DJ working 4 hours (Standard Flat Fee, zero OT)
    dj_standard = calculate_gig_earnings(
        assignment={"worker": "EMP-DJ-01", "role": "Lead DJ", "event_type": "Wedding"},
        timesheet=4.0,
    )
    assert dj_standard["base_pay"] == 500.0
    assert dj_standard["overtime_pay"] == 0.0
    assert dj_standard["gross_pay"] == 500.0

    # 2. Lead DJ working 6 hours (2 hours OT @ $75/hr = $150)
    dj_ot = calculate_gig_earnings(
        assignment={"worker": "EMP-DJ-01", "role": "Lead DJ", "event_type": "Wedding"},
        timesheet=6.0,
    )
    assert dj_ot["base_pay"] == 500.0
    assert dj_ot["overtime_pay"] == 150.0
    assert dj_ot["gross_pay"] == 650.0

    # 3. Roadie working 6 hours on hourly ($25 * 4 = $100 base, 2 hrs @ $37.5 = $75 OT)
    roadie_calc = calculate_gig_earnings(
        assignment={"worker": "EMP-CREW-01", "role": "Roadie"},
        timesheet=6.0,
    )
    assert roadie_calc["base_pay"] == 100.0
    assert roadie_calc["overtime_pay"] == 75.0
    assert roadie_calc["gross_pay"] == 175.0

    # 4. Booth Attendant flat_plus_hourly: 5 hours (3 hrs covered by $200, 2 extra hrs @ $30 = $60)
    booth_calc = calculate_gig_earnings(
        assignment={"worker": "EMP-BOOTH-01", "role": "Booth Attendant"},
        timesheet=5.0,
    )
    assert booth_calc["base_pay"] == 200.0
    assert booth_calc["overtime_pay"] == 60.0
    assert booth_calc["gross_pay"] == 260.0


def test_sales_commissions_and_clawback(monkeypatch):
    """Test commission accrual on invoice payment and proportional clawback on refund."""
    rules_db = {
        "CR-PERCENT-GROSS": SimpleNamespace(
            name="CR-PERCENT-GROSS",
            agent="REP-ALICE",
            commission_type="percent_gross",
            rate_value=10.0,
            is_active=1,
        ),
        "CR-PERCENT-PROFIT": SimpleNamespace(
            name="CR-PERCENT-PROFIT",
            agent="REP-BOB",
            commission_type="percent_profit",
            rate_value=20.0,
            is_active=1,
        ),
    }

    monkeypatch.setattr(
        frappe.db,
        "get_value",
        lambda dt, filters, fieldname=None, as_dict=False: (
            "CR-PERCENT-GROSS" if filters.get("agent") == "REP-ALICE"
            else "CR-PERCENT-PROFIT" if filters.get("agent") == "REP-BOB"
            else None
        ) if dt == "Commission Rule" else None,
    )
    monkeypatch.setattr(
        frappe,
        "get_doc",
        lambda dt, name=None: rules_db.get(name) if dt == "Commission Rule"
        else SimpleNamespace(sales_agent="REP-ALICE", grand_total=2500.0) if dt == "Event Booking"
        else None,
    )

    # 1. REP-ALICE on 10% percent_gross on a $2,500.00 invoice
    inv_alice = {"booking": "BK-WEDDING-1", "grand_total": 2500.0, "sales_partner": "REP-ALICE"}
    comm_alice = accrue_booking_commission(inv_alice)
    assert comm_alice["accrued"] is True
    assert comm_alice["commission_amount"] == 250.0  # 10% of 2500

    # 2. Proportional clawback on $500 refund (20% of invoice refunded -> $50 commission clawback)
    cb = clawback_booking_commission(inv_alice, refund_amount=500.0)
    assert cb["original_commission"] == 250.0
    assert cb["clawback_amount"] == 50.0
    assert cb["net_commission"] == 200.0


def test_digital_tip_pool_splitting(monkeypatch):
    """Test Equal, Hours-Weighted, and Lead-Weighted tip pool distribution policies."""
    tip_dist_doc = frappe.model.document.Document(
        name="TIP-BK-001",
        event_booking="BK-001",
        total_tip_pool=300.0,
        allocation_policy="equal",
        status="accruing",
        allocation_lines=[],
    )

    monkeypatch.setattr(frappe.db, "get_value", lambda *a, **k: "TIP-BK-001")
    monkeypatch.setattr(frappe, "get_doc", lambda *a, **k: tip_dist_doc)

    crew = [
        {"worker": "EMP-01", "worker_name": "Dave Lead", "role": "Lead DJ", "is_lead": True, "hours": 6.0},
        {"worker": "EMP-02", "worker_name": "Sam Roadie", "role": "Roadie", "is_lead": False, "hours": 4.0},
        {"worker": "EMP-03", "worker_name": "Alex Booth", "role": "Attendant", "is_lead": False, "hours": 2.0},
    ]

    # 1. Equal Split ($300 pool / 3 crew = $100 each)
    equal_res = distribute_booking_tips("BK-001", tip_pool_amount=300.0, policy="equal", assigned_crew=crew)
    assert len(equal_res["allocations"]) == 3
    for a in equal_res["allocations"]:
        assert a["allocated_amount"] == 100.0

    # 2. Hours-Weighted Split (Total hours = 6 + 4 + 2 = 12 hrs)
    # Dave: 6/12 * 300 = $150
    # Sam: 4/12 * 300 = $100
    # Alex: 2/12 * 300 = $50
    hrs_res = distribute_booking_tips("BK-001", tip_pool_amount=300.0, policy="hours_weighted", assigned_crew=crew)
    dave_hrs = next(a for a in hrs_res["allocations"] if a["worker"] == "EMP-01")
    sam_hrs = next(a for a in hrs_res["allocations"] if a["worker"] == "EMP-02")
    alex_hrs = next(a for a in hrs_res["allocations"] if a["worker"] == "EMP-03")

    assert dave_hrs["allocated_amount"] == 150.0
    assert sam_hrs["allocated_amount"] == 100.0
    assert alex_hrs["allocated_amount"] == 50.0
    assert sum(a["allocated_amount"] for a in hrs_res["allocations"]) == 300.0

    # 3. Lead-Weighted Split (Lead weight 1.5, others 1.0 -> total weight 3.5)
    lead_res = distribute_booking_tips("BK-001", tip_pool_amount=350.0, policy="lead_weighted", assigned_crew=crew)
    dave_lead = next(a for a in lead_res["allocations"] if a["worker"] == "EMP-01")
    sam_lead = next(a for a in lead_res["allocations"] if a["worker"] == "EMP-02")
    # Dave: 1.5/3.5 * 350 = $150
    # Sam: 1.0/3.5 * 350 = $100
    assert dave_lead["allocated_amount"] == 150.0
    assert sam_lead["allocated_amount"] == 100.0


def test_payroll_batch_compiler_and_idempotency(monkeypatch):
    """Test compiling timesheets, commissions, and tips into ERPNext Salary Slip drafts."""
    created_slips = []
    created_pay_runs = []

    class MockSalarySlip(frappe.model.document.Document):
        def insert(self, *a, **k):
            self.name = f"SLIP-{len(created_slips)+1}"
            created_slips.append(self)
            return self

        def submit(self):
            self.docstatus = 1
            return self

    class MockPayRun(frappe.model.document.Document):
        def insert(self, *a, **k):
            self.name = f"PR-{len(created_pay_runs)+1}"
            created_pay_runs.append(self)
            return self

    timesheets = [
        SimpleNamespace(name="TS-001", employee="EMP-01", employee_name="DJ John", total_hours=5.0, parent_project="BK-01"),
    ]

    assignments = []
    invoices = []
    tip_dists = [
        SimpleNamespace(
            name="TIP-01",
            event_booking="BK-01",
            total_tip_pool=100.0,
            status="locked",
        ),
    ]

    tip_doc = SimpleNamespace(
        name="TIP-01",
        allocation_lines=[
            SimpleNamespace(worker="EMP-01", worker_name="DJ John", allocated_amount=100.0),
        ],
    )

    def mock_get_doc(dt, name=None):
        if isinstance(dt, dict):
            if dt.get("doctype") == "Salary Slip":
                return MockSalarySlip(**dt)
            if dt.get("doctype") == "Pay Run":
                return MockPayRun(**dt)
            return frappe.model.document.Document(**dt)
        if dt == "Tip Distribution":
            return tip_doc
        return frappe.model.document.Document()

    def mock_get_all(dt, filters=None, **k):
        if dt == "Pay Run" and filters.get("status"):
            return []  # No overlapping finalized pay runs
        if dt == "Timesheet":
            return timesheets
        if dt == "Staff Assignment":
            return assignments
        if dt == "Sales Invoice":
            return invoices
        if dt == "Tip Distribution":
            return tip_dists
        return []

    monkeypatch.setattr(frappe, "get_all", mock_get_all)
    monkeypatch.setattr(frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(
        frappe.db,
        "get_value",
        lambda dt, filters, fieldname=None, as_dict=False: (
            "2026-09-10" if dt == "Event Booking" else None
        ),
    )
    monkeypatch.setattr(
        frappe.db,
        "exists",
        lambda dt, name=None: True if dt in ("DocType", "Salary Slip", "Pay Run") else False,
    )

    batch = compile_payroll_batch(start_date="2026-09-01", end_date="2026-09-14", submit=False)
    assert batch["worker_count"] == 1
    slip = batch["slips"][0]
    assert slip["employee"] == "EMP-01"

    # Verify earnings salary components
    components = {e["salary_component"]: e["amount"] for e in slip["earnings"]}
    assert "Gig Base Pay" in components
    assert "Client Tip Share" in components
    assert components["Client Tip Share"] == 100.0

    # Overlapping run detection
    monkeypatch.setattr(
        frappe,
        "get_all",
        lambda dt, filters=None, **k: (
            [SimpleNamespace(name="PR-FINAL-001")] if dt == "Pay Run" and filters.get("status") else []
        ),
    )

    with pytest.raises(Exception) as exc_info:
        compile_payroll_batch(start_date="2026-09-01", end_date="2026-09-14")
    assert "overlaps with finalized pay runs" in str(exc_info.value)
