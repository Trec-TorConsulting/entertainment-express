"""Unit tests for AI Owner in the Box (ERP Intelligence):
- AI Receipt OCR & Expense Claim Automation
- Autonomous AR Dunning Agent
- 60-Second Instant Lead Quoting
- Stripe Payout Bank Reconciliation
"""

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
mock_frappe.new_doc = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []
mock_frappe.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None, info=lambda *a, **k: None)

mock_session = SimpleNamespace(user="owner@entx.app")
mock_frappe.session = mock_session

mock_db = SimpleNamespace()
mock_db.exists = lambda *a, **k: True
mock_db.get_value = lambda *a, **k: "CC-AUSTIN-PE"
mock_db.get_single_value = lambda *a, **k: "Premier Events LLC"
mock_db.set_value = lambda *a, **k: None
mock_db.commit = lambda: None
mock_db.count = lambda *a, **k: 2
mock_frappe.db = mock_db

mock_defaults = SimpleNamespace()
mock_defaults.get_user_default = lambda key: "Premier Events LLC"
mock_frappe.defaults = mock_defaults

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.nowdate = lambda: "2026-09-15"
mock_utils.getdate = lambda d: datetime.strptime(str(d), "%Y-%m-%d").date() if isinstance(d, str) else d
mock_utils.now_datetime = lambda: datetime(2026, 9, 15, 12, 0, 0)
sys.modules["frappe.utils"] = mock_utils


class MockDoc(SimpleNamespace):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "expenses" not in self.__dict__:
            self.expenses = []

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
        self.docstatus = 1
        return self

    def save(self, *a, **k):
        return self


# Import modules under test
import entertainment_express.api.ai_expense_scanner as expense_scanner
import entertainment_express.api.ai_dunning as dunning_agent
import entertainment_express.api.ai_smart_quote as smart_quote
import entertainment_express.api.ai_bank_recon as bank_recon


@pytest.fixture(autouse=True)
def setup_mocks(monkeypatch):
    mock_frappe.session.user = "owner@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Tenant Admin"]

    def mock_new_doc(dt):
        return MockDoc(doctype=dt, name=f"NEW-{dt}", docstatus=0)

    def mock_get_doc(dt, name=None):
        if isinstance(dt, dict):
            return MockDoc(**dt)
        if dt == "Event Booking":
            return MockDoc(name=name or "BK-2026-00042", customer_name="Alice Johnson", total_amount=2500.0, outstanding_amount=1000.0, event_date="2026-09-22", contact_email="alice@example.com")
        if dt == "Expense Claim":
            return MockDoc(name=name or "EXP-001", docstatus=0, approval_status="Draft")
        return MockDoc(doctype=dt, name=name or "DOC-001")

    monkeypatch.setattr(mock_frappe, "new_doc", mock_new_doc)
    monkeypatch.setattr(mock_frappe, "get_doc", mock_get_doc)


def test_receipt_parsing_and_expense_claim():
    """Verify receipt OCR parsing and expense claim creation."""
    parsed = expense_scanner.parse_receipt_image(file_content="Shell Gas Station Total: $45.50 Fuel")
    assert parsed["category"] == "Fuel"
    assert parsed["total"] == 45.50
    assert parsed["merchant"] == "Fuel Station"

    # Zero or negative amount should raise error
    with pytest.raises(mock_frappe.ValidationError):
        expense_scanner.create_expense_claim(merchant="Shell", total=0.0)

    # Valid claim
    res = expense_scanner.create_expense_claim(
        merchant="Shell",
        total=45.50,
        category="Fuel",
        booking_id="BK-2026-00042",
        description="Van refueling for wedding"
    )
    assert res["status"] == "success"
    assert res["amount"] == 45.50
    assert "EXP" in res["claim_name"] or "Expense Claim" in res["claim_name"]

    # Approve claim
    appr = expense_scanner.approve_expense_claim("EXP-001")
    assert appr["status"] == "success"


def test_ar_dunning_agent(monkeypatch):
    """Verify AR aging scan and dunning message generation with Stripe pay links."""
    mock_bookings = [
        SimpleNamespace(
            name="BK-2026-00042",
            customer_name="Alice Johnson",
            contact_email="alice@example.com",
            contact_phone="+15551234567",
            event_date="2026-09-22",
            total_amount=2500.0,
            outstanding_amount=1000.0,
            status="Confirmed"
        )
    ]
    monkeypatch.setattr(mock_frappe, "get_all", lambda *a, **k: mock_bookings)

    aging = dunning_agent.scan_ar_aging()
    assert len(aging) == 1
    assert aging[0]["booking_id"] == "BK-2026-00042"
    assert "stripe_pay_url" in aging[0]
    assert aging[0]["urgency"] in ("low", "medium", "high", "critical")

    msg = dunning_agent.generate_dunning_message("BK-2026-00042", tier="Pre-Event Final Balance Notice")
    assert "stripe_pay_url" in msg
    assert "https://entx.app/pay/BK-2026-00042" in msg["email_body"]
    assert "https://entx.app/pay/BK-2026-00042" in msg["sms_body"]

    send_res = dunning_agent.send_dunning_notice("BK-2026-00042", channel="email")
    assert send_res["status"] == "success"


def test_smart_quoting_pipeline():
    """Verify 60-second instant inquiry parsing and 3-tier quotation generation."""
    parsed = smart_quote.parse_inquiry_text("Hi, looking for a wedding DJ on 2026-10-15 with photo booth for 150 guests.")
    assert parsed["event_type"] == "Wedding"
    assert "DJ/MC Performance" in parsed["services"]
    assert "Digital Photo Booth" in parsed["services"]

    avail = smart_quote.check_instant_availability("2026-10-15")
    assert avail["event_date"] == "2026-10-15"
    assert "utilization_pct" in avail
    assert avail["is_available"] is True

    quote = smart_quote.generate_tiered_quotation(
        customer_name="Robert Smith",
        event_date="2026-10-15",
        event_type="Wedding",
        venue_address="Austin, TX",
        guest_count=150
    )
    assert "packages" in quote
    assert "good" in quote["packages"]
    assert "better" in quote["packages"]
    assert "best" in quote["packages"]
    assert quote["packages"]["best"]["total"] > quote["packages"]["better"]["total"] > quote["packages"]["good"]["total"]

    approval = smart_quote.approve_and_send_quotation(quote["quotation_id"], "robert@example.com", "better")
    assert approval["status"] == "success"
    assert "proposal_url" in approval


def test_stripe_bank_reconciliation():
    """Verify lumped Stripe payout decomposition and fee expensing."""
    decomp = bank_recon.decompose_stripe_payout("po_test_001", payout_amount=4854.10)
    assert decomp["payout_id"] == "po_test_001"
    assert decomp["gross_sales"] > 0
    assert decomp["stripe_processing_fees"] > 0
    assert decomp["net_deposit"] > 0
    assert decomp["matched_count"] >= 1

    recon = bank_recon.auto_reconcile_payout(
        payout_id="po_test_001",
        gross_amount=5000.0,
        fee_amount=145.90,
        booking_ids=["BK-01", "BK-02"]
    )
    assert recon["status"] == "success"
    assert recon["fee_expensed"] == 145.90
    assert recon["net_deposit"] == 4854.10

    batches = bank_recon.get_unreconciled_batches()
    assert len(batches) >= 1


def test_multi_tenant_isolation_and_auth():
    """Verify that unauthenticated guests and unauthorized roles are strictly blocked."""
    mock_frappe.session.user = "Guest"
    with pytest.raises(mock_frappe.PermissionError):
        expense_scanner.create_expense_claim("Vendor", 10.0)
    with pytest.raises(mock_frappe.PermissionError):
        dunning_agent.scan_ar_aging()
    with pytest.raises(mock_frappe.PermissionError):
        smart_quote.generate_tiered_quotation("Client", "2026-10-01")
    with pytest.raises(mock_frappe.PermissionError):
        bank_recon.get_unreconciled_batches()

    # Crew cannot access bank recon or AR dunning
    mock_frappe.session.user = "crew@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Crew"]
    with pytest.raises(mock_frappe.PermissionError):
        dunning_agent.scan_ar_aging()
    with pytest.raises(mock_frappe.PermissionError):
        bank_recon.decompose_stripe_payout("po_001")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
