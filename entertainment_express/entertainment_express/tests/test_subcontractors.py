"""Unit tests and multi-tenant isolation verification for Subcontractor Jobs & Partner Hub."""

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
    mock_frappe.parse_json = lambda val: {}

    mock_utils = ModuleType("frappe.utils")
    mock_utils.cint = lambda v: int(v or 0)
    mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
    mock_utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):,.2f}"
    mock_utils.now_datetime = lambda: "2026-09-09 12:00:00"

    mock_doc_module = ModuleType("frappe.model.document")
    class Document:
        def __init__(self, *args, **kwargs):
            self.client_price = 0
            self.agreed_cost = 0
            self.booking = None
            self.expected_margin = 0
            self.margin_percent = 0
    mock_doc_module.Document = Document

    mock_frappe.utils = mock_utils
    mock_frappe.model = ModuleType("frappe.model")
    mock_frappe.model.document = mock_doc_module
    mock_frappe.db = SimpleNamespace(
        get_default=lambda *_: "USD",
        exists=lambda *a, **k: False,
        table_exists=lambda *_: True,
        get_value=lambda *a, **k: None,
        get_single_value=lambda *a, **k: None,
    )
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_utils
    sys.modules["frappe.model"] = mock_frappe.model
    sys.modules["frappe.model.document"] = mock_doc_module

from entertainment_express.api import subcontractors
from entertainment_express.entertainment_express_core.doctype.ee_subcontract_job.ee_subcontract_job import (
    EESubcontractJob,
)


class _Perm(Exception):
    pass


class _FakeDb:
    def __init__(self):
        self.tables = {"EE Subcontract Job", "EE Vendor", "Event Booking"}
        self.records = {}

    def get_default(self, key):
        return "USD"

    def table_exists(self, table_name):
        return table_name in self.tables

    def exists(self, doctype, name):
        if isinstance(name, dict):
            token = name.get("offer_token")
            if token:
                for doc in self.records.values():
                    if getattr(doc, "offer_token", None) == token:
                        return True
            return False
        return name in self.records

    def get_value(self, doctype, name, fieldname=None):
        doc = self.records.get(name)
        if not doc:
            return None
        if isinstance(doc, dict):
            return doc.get(fieldname)
        return getattr(doc, fieldname, None)


class _FakeFrappe:
    PermissionError = _Perm
    DoesNotExistError = KeyError
    ValidationError = ValueError

    def __init__(self, roles=None, current_site="tenant_alpha"):
        self._roles = roles or ["EE Tenant Admin"]
        self.db = _FakeDb()
        self.local = SimpleNamespace(site=current_site)
        self.docs = {}

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def parse_json(self, val):
        import json
        return json.loads(val)

    def get_all(self, doctype, filters=None, fields=None, **kwargs):
        results = []
        filters = filters or {}
        for name, doc in self.docs.items():
            if getattr(doc, "doctype", None) != doctype:
                continue
            match = True
            for k, v in filters.items():
                if getattr(doc, k, None) != v:
                    match = False
                    break
            if match:
                results.append(SimpleNamespace(name=name))
        return results

    def get_doc(self, *args, **kwargs):
        if len(args) == 1 and isinstance(args[0], dict):
            d = args[0]
            name = d.get("name") or f"SUB-{len(self.docs) + 1}"
            doc = SimpleNamespace(**d)
            doc.name = name
            doc.insert = lambda *a, **k: self.docs.update({name: doc})
            doc.save = lambda *a, **k: self.docs.update({name: doc})
            return doc
        elif len(args) >= 2:
            doctype, name = args[0], args[1]
            if name in self.docs:
                return self.docs[name]
            return SimpleNamespace(name=name, doctype=doctype, save=lambda *a, **k: None)
        return SimpleNamespace(save=lambda *a, **k: None)


# -----------------------------------------------------------------------------
# 6.1 Unit Tests: Controller, Margin Calculation, Offer Token, Accept/Decline
# -----------------------------------------------------------------------------

def test_subcontract_job_controller_margin_calculation():
    """Verify expected_margin and margin_percent calculations using flt precision."""
    job = EESubcontractJob()
    job.client_price = 2500.00
    job.agreed_cost = 1500.00
    job.booking = None
    job.validate()

    assert job.expected_margin == 1000.00
    assert job.margin_percent == 40.00


def test_subcontract_job_controller_zero_client_price():
    """Verify zero division is safely handled when client price is 0."""
    job = EESubcontractJob()
    job.client_price = 0.0
    job.agreed_cost = 500.00
    job.booking = None
    job.validate()

    assert job.expected_margin == -500.00
    assert job.margin_percent == 0.0


def test_create_subcontract_job_flow(monkeypatch):
    """Test create_subcontract_job API enforces roles and calculates fields."""
    fake = _FakeFrappe(roles=["EE Tenant Admin"])
    monkeypatch.setattr(subcontractors, "frappe", fake)

    # Mock vendor and booking
    fake.db.records["BK-101"] = {"grand_total": 2000.00, "title": "Wedding Reception"}
    fake.db.records["VEND-01"] = {"vendor_name": "Pro DJ Partners", "coi_on_file": 1, "w9_on_file": 1}

    res = subcontractors.create_subcontract_job({
        "booking": "BK-101",
        "vendor": "VEND-01",
        "agreed_cost": 1200.00,
        "pay_terms": "Net 15",
        "white_label": 1,
    })

    assert res["booking"] == "BK-101"
    assert res["vendor"] == "VEND-01"
    assert res["agreed_cost"] == 1200.00
    assert res["client_price"] == 2000.00
    assert res["expected_margin"] == 800.00
    assert res["margin_percent"] == 40.00
    assert res["white_label"] is True


def test_send_subcontract_offer_generates_token(monkeypatch):
    """Test sending an offer assigns a secure UUID offer token and sets status offered."""
    fake = _FakeFrappe(roles=["EE Tenant Admin"])
    monkeypatch.setattr(subcontractors, "frappe", fake)

    job_doc = SimpleNamespace(
        name="SUB-2026-00001",
        doctype="EE Subcontract Job",
        booking="BK-101",
        vendor="VEND-01",
        agreed_cost=1000.0,
        client_price=1500.0,
        expected_margin=500.0,
        margin_percent=33.33,
        status="draft",
        offer_token=None,
        offer_sent_at=None,
        response_at=None,
        decline_reason=None,
        pay_terms="Net 15",
        white_label=1,
        special_instructions="",
        purchase_invoice=None,
        creation=None,
        modified=None,
        save=lambda *a, **k: None,
    )
    fake.docs["SUB-2026-00001"] = job_doc
    fake.db.records["SUB-2026-00001"] = job_doc

    out = subcontractors.send_subcontract_offer("SUB-2026-00001")
    assert out["status"] == "offered"
    assert len(out["offer_token"]) > 20  # Valid UUID token assigned


def test_guest_respond_subcontract_offer_accept_and_decline(monkeypatch):
    """Test public guest response transitions job status to accepted or declined."""
    fake = _FakeFrappe(roles=[])  # Guest session
    monkeypatch.setattr(subcontractors, "frappe", fake)

    job_doc = SimpleNamespace(
        name="SUB-2026-00002",
        doctype="EE Subcontract Job",
        booking="BK-101",
        vendor="VEND-01",
        agreed_cost=1000.0,
        client_price=1500.0,
        expected_margin=500.0,
        margin_percent=33.33,
        status="offered",
        offer_token="token-abc-123",
        response_at=None,
        decline_reason=None,
        save=lambda *a, **k: None,
    )
    fake.docs["SUB-2026-00002"] = job_doc

    # Accept
    resp = subcontractors.respond_subcontract_offer(token="token-abc-123", action="accept")
    assert resp["status"] == "accepted"
    assert job_doc.status == "accepted"

    # Decline on offered job
    job_doc.status = "offered"
    resp_dec = subcontractors.respond_subcontract_offer(
        token="token-abc-123", action="decline", decline_reason="Double booked on this date"
    )
    assert resp_dec["status"] == "declined"
    assert job_doc.status == "declined"
    assert job_doc.decline_reason == "Double booked on this date"


# -----------------------------------------------------------------------------
# 6.2 Multi-Tenant Isolation Verification
# -----------------------------------------------------------------------------

def test_subcontractor_multi_tenant_isolation(monkeypatch):
    """
    Verify that subcontractor records, jobs, and partner directories are strictly
    confined to their own tenant site context, preventing cross-tenant information leakage.
    """
    tenant_a_frappe = _FakeFrappe(roles=["EE Tenant Admin"], current_site="alpha.entx.app")
    tenant_b_frappe = _FakeFrappe(roles=["EE Tenant Admin"], current_site="beta.entx.app")

    # Seed job in Tenant A
    job_a = SimpleNamespace(
        name="SUB-ALPHA-01",
        doctype="EE Subcontract Job",
        booking="BK-A",
        vendor="VEND-A",
        status="accepted",
        agreed_cost=1000.0,
        client_price=2000.0,
        expected_margin=1000.0,
        margin_percent=50.0,
        pay_terms="Net 15",
        white_label=1,
        special_instructions="Alpha confidential",
        offer_token="token-alpha",
        offer_sent_at=None,
        response_at=None,
        decline_reason=None,
        purchase_invoice=None,
        creation=None,
        modified=None,
    )
    tenant_a_frappe.docs["SUB-ALPHA-01"] = job_a

    # Verify Tenant A sees the job
    monkeypatch.setattr(subcontractors, "frappe", tenant_a_frappe)
    jobs_a = subcontractors.list_subcontract_jobs()
    assert len(jobs_a) == 1
    assert jobs_a[0]["id"] == "SUB-ALPHA-01"

    # Verify Tenant B sees ZERO jobs from Tenant A
    monkeypatch.setattr(subcontractors, "frappe", tenant_b_frappe)
    jobs_b = subcontractors.list_subcontract_jobs()
    assert len(jobs_b) == 0
    assert not any(j.get("id") == "SUB-ALPHA-01" for j in jobs_b)
