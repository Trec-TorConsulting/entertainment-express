"""Unit tests for Owner Portal Complete Parity: Company Studio, Master Data Explorer & Emergency Overrides."""

import os
import sys
from types import ModuleType, SimpleNamespace
from datetime import date, datetime
import pytest

repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
app_dir = os.path.join(repo_dir, "entertainment_express")
if repo_dir not in sys.path:
    sys.path.insert(0, repo_dir)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Mock frappe module
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

mock_frappe.get_roles = lambda user=None: ["EE Tenant Admin"]
mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
mock_frappe.log_error = lambda *a, **k: None
mock_frappe.sendmail = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.new_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []
mock_frappe.delete_doc = lambda *a, **k: None
mock_frappe.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None, info=lambda *a, **k: None)

mock_session = SimpleNamespace(user="owner@entx.app")
mock_frappe.session = mock_session

mock_db = SimpleNamespace()
mock_db.exists = lambda *a, **k: True
mock_db.get_value = lambda *a, **k: None
mock_db.get_single_value = lambda *a, **k: "Premier Events LLC"
mock_db.set_value = lambda *a, **k: None
mock_db.commit = lambda: None
mock_db.has_column = lambda *a, **k: True
mock_db.count = lambda *a, **k: 1
mock_frappe.db = mock_db

mock_defaults = SimpleNamespace()
mock_defaults.get_user_default = lambda key: "Premier Events LLC"
mock_frappe.defaults = mock_defaults

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.now_datetime = lambda: datetime(2026, 9, 15, 12, 0, 0)
sys.modules["frappe.utils"] = mock_utils


class MockDoc(SimpleNamespace):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "references" not in self.__dict__:
            self.references = []
        if "taxes" not in self.__dict__:
            self.taxes = []

    def append(self, key, value):
        if not hasattr(self, key):
            setattr(self, key, [])
        if isinstance(value, dict):
            getattr(self, key).append(SimpleNamespace(**value))
        else:
            getattr(self, key).append(value)

    def insert(self, *a, **k):
        return self

    def submit(self, *a, **k):
        return self

    def save(self, *a, **k):
        return self

    def update(self, d):
        for k, v in d.items():
            setattr(self, k, v)
        return self

    def as_dict(self):
        return self.__dict__.copy()

    def get(self, key, default=None):
        return getattr(self, key, default)


# Mock DocType metadata
class MockField(SimpleNamespace):
    pass

class MockMeta:
    def __init__(self, dt):
        self.doctype = dt
        self.title_field = "title" if dt == "Terms and Conditions" else "name"
        self.search_fields = "name"
        self.fields = [
            MockField(fieldname="name", label="ID", fieldtype="Data", reqd=0, in_list_view=1, read_only=1, options="", default="", description=""),
            MockField(fieldname="title", label="Title", fieldtype="Data", reqd=1, in_list_view=1, read_only=0, options="", default="", description=""),
            MockField(fieldname="terms", label="Terms", fieldtype="Text", reqd=1, in_list_view=0, read_only=0, options="", default="", description=""),
            MockField(fieldname="disabled", label="Disabled", fieldtype="Check", reqd=0, in_list_view=1, read_only=0, options="", default="0", description=""),
            MockField(fieldname="docstatus", label="Status", fieldtype="Int", reqd=0, in_list_view=0, read_only=1, options="", default="", description=""),
            MockField(fieldname="modified_by", label="Modified By", fieldtype="Data", reqd=0, in_list_view=0, read_only=1, options="", default="", description=""),
        ]

mock_frappe.get_meta = lambda dt: MockMeta(dt)

# Import modules under test
import entertainment_express.api.company_setup as company_setup
import entertainment_express.api.owner_admin as owner_admin
import entertainment_express.api.owner_overrides as owner_overrides


@pytest.fixture(autouse=True)
def setup_mocks(monkeypatch):
    mock_frappe.session.user = "owner@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Tenant Admin"]

    company_store = {
        "name": "Premier Events LLC",
        "default_currency": "USD",
        "country": "United States",
        "tax_id": "12-3456789",
        "phone_no": "555-123-4567",
        "email": "owner@entx.app",
        "website": "https://entx.app",
        "default_income_account": "Sales - PE",
        "default_expense_account": "COGS - PE",
        "default_receivable_account": "Debtors - PE",
        "default_bank_account": "Operating Bank - PE",
        "default_cash_account": "Cash - PE"
    }

    def mock_get_doc(dt, name=None):
        if dt == "Company":
            return MockDoc(**company_store)
        elif dt == "Sales Taxes and Charges Template":
            return MockDoc(name="TX-825", title="Texas State Tax", is_default=1, taxes=[SimpleNamespace(rate=8.25, account_head="Sales Tax - PE")])
        elif dt == "Event Booking":
            return MockDoc(name=name or "BK-2026-00042", total_amount=1500.0, ee_safety_lock_override=0)
        elif dt == "EE Audit Log":
            return MockDoc(name="AUD-001")
        elif dt == "Terms and Conditions":
            return MockDoc(name=name or "TC-001", title="Wedding Terms", terms="Terms text", disabled=0)
        return MockDoc(name=name or "MOCK-DOC")

    def mock_get_all(dt, *a, **k):
        if dt == "Sales Taxes and Charges Template":
            return [SimpleNamespace(name="TX-825", title="Texas State Tax", is_default=1, disabled=0)]
        return []

    monkeypatch.setattr(mock_frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(mock_frappe, "new_doc", lambda dt: MockDoc(doctype=dt, name=f"NEW-{dt}"))
    monkeypatch.setattr(mock_frappe, "get_all", mock_get_all)


def test_company_settings_get():
    """Verify owner can retrieve legal company settings."""
    res = company_setup.get_company_settings()
    assert res["company_name"] == "Premier Events LLC"
    assert res["default_currency"] == "USD"
    assert res["tax_id"] == "12-3456789"


def test_company_settings_save():
    """Verify owner can update company profile."""
    res = company_setup.save_company_settings({
        "phone_no": "555-999-0000",
        "default_currency": "USD"
    })
    assert res["status"] == "success"


def test_tax_template_crud():
    """Verify sales tax rule creation and listing."""
    res = company_setup.save_tax_rule(title="Austin Sales Tax", rate=8.25, is_default=1)
    assert res["status"] == "success"
    assert res["rate"] == 8.25

    templates = company_setup.get_tax_templates()
    assert len(templates) >= 1
    assert templates[0]["rate"] == 8.25


def test_chart_of_accounts_mapping():
    """Verify retrieval and update of core ledger mapping."""
    res = company_setup.get_chart_of_accounts_mapping()
    assert "mappings" in res
    assert res["mappings"]["default_income_account"] == "Sales - PE"

    update_res = company_setup.save_chart_of_accounts_mapping({
        "default_income_account": "Event Sales - PE"
    })
    assert update_res["status"] == "success"


def test_permitted_doctypes_and_schema_meta():
    """Verify owner can only inspect permitted DocTypes and sanitized schema fields."""
    dts = owner_admin.get_permitted_doctypes()
    assert len(dts) >= 10
    names = [d["doctype"] for d in dts]
    assert "Terms and Conditions" in names
    assert "Vehicle" in names
    assert "User" not in names  # Restricted!

    # Schema inspection
    meta = owner_admin.get_schema_meta("Terms and Conditions")
    fieldnames = [f["fieldname"] for f in meta["fields"]]
    assert "title" in fieldnames
    assert "terms" in fieldnames
    assert "modified_by" not in fieldnames  # Ignored field!
    assert "docstatus" not in fieldnames    # Ignored field!

    # Restricted DocType must raise PermissionError
    with pytest.raises(mock_frappe.PermissionError):
        owner_admin.get_schema_meta("User")


def test_master_data_crud(monkeypatch):
    """Verify CRUD lifecycle for permitted master DocTypes."""
    # List
    monkeypatch.setattr(mock_frappe, "get_all", lambda *a, **k: [{"name": "TC-001", "title": "Standard Terms"}])
    list_res = owner_admin.get_doc_list("Terms and Conditions", search="Standard")
    assert list_res["doctype"] == "Terms and Conditions"
    assert len(list_res["records"]) == 1

    # Detail
    detail = owner_admin.get_doc_detail("Terms and Conditions", "TC-001")
    assert detail["name"] == "TC-001"

    # Save
    save_res = owner_admin.save_doc("Terms and Conditions", {"title": "Updated Terms", "terms": "New text"})
    assert save_res["status"] == "success"

    # Delete
    del_res = owner_admin.delete_doc("Terms and Conditions", "TC-001")
    assert del_res["status"] == "success"


def test_emergency_overrides():
    """Verify emergency override center operations and audit logging."""
    # Short reason should fail
    with pytest.raises(Exception):
        owner_overrides.override_safety_lock(asset_id="AST-01", booking_id="BK-2026-00042", reason="too short")

    # Valid safety lock override
    res = owner_overrides.override_safety_lock(
        asset_id="AST-BOUNCE-01",
        booking_id="BK-2026-00042",
        reason="Owner verified physical condition on site; inspection certificate renewal pending."
    )
    assert res["status"] == "success"
    assert "audit_id" in res

    # Dispatch conflict override
    res2 = owner_overrides.override_dispatch_conflict(
        target_id="EMP-001",
        booking_id="BK-2026-00042",
        reason="Lead DJ authorized to double-book opening consultation slot."
    )
    assert res2["status"] == "success"

    # Margin lock override
    res3 = owner_overrides.override_margin_lock(
        booking_id="BK-2026-00042",
        target_margin_pct=10.0,
        reason="Charity gala sponsorship with subsidized booking margin."
    )
    assert res3["status"] == "success"


def test_guest_and_non_owner_blocked(monkeypatch):
    """Verify multi-tenant isolation and role enforcement across all admin APIs."""
    # Guest access blocked
    mock_frappe.session.user = "Guest"
    with pytest.raises(mock_frappe.PermissionError):
        company_setup.get_company_settings()
    with pytest.raises(mock_frappe.PermissionError):
        owner_admin.get_permitted_doctypes()
    with pytest.raises(mock_frappe.PermissionError):
        owner_overrides.override_safety_lock("A", "B", "Reason long enough here")

    # Crew access blocked
    mock_frappe.session.user = "crew@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Crew"]
    with pytest.raises(mock_frappe.PermissionError):
        company_setup.get_company_settings()
    with pytest.raises(mock_frappe.PermissionError):
        owner_admin.get_permitted_doctypes()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
