import os
import sys
from types import ModuleType, SimpleNamespace
from datetime import date, datetime
import pytest

repo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
app_dir = os.path.join(repo_dir, "entertainment_express")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)
if repo_dir not in sys.path:
    sys.path.insert(0, repo_dir)

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

mock_frappe.get_roles = lambda user=None: ["EE Tenant Admin", "EE Dispatcher", "EE Crew"]
mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
mock_frappe.log_error = lambda *a, **k: None
mock_frappe.sendmail = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.new_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []
mock_frappe.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None, info=lambda *a, **k: None)

mock_session = SimpleNamespace(user="dj.mike@example.com")
mock_frappe.session = mock_session

mock_db = SimpleNamespace()
mock_db.exists = lambda dt, name=None: True
mock_db.get_value = lambda *a, **k: None
mock_db.set_value = lambda *a, **k: None
mock_db.commit = lambda: None
mock_frappe.db = mock_db

mock_defaults = SimpleNamespace()
mock_defaults.get_user_default = lambda key: "Premier Events LLC"
mock_frappe.defaults = mock_defaults

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.now_datetime = lambda: datetime(2026, 9, 15, 12, 0, 0)
sys.modules["frappe.utils"] = mock_utils

mock_meta = SimpleNamespace(has_field=lambda f: True)
mock_frappe.get_meta = lambda dt: mock_meta


class MockDoc(SimpleNamespace):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "references" not in self.__dict__:
            self.references = []

    def append(self, key, value):
        if not hasattr(self, key):
            setattr(self, key, [])
        getattr(self, key).append(value)

    def insert(self, *a, **k):
        return self

    def submit(self, *a, **k):
        return self

    def get(self, key, default=None):
        return getattr(self, key, default)

    def save(self, *a, **k):
        return self


# Mock Stripe module
mock_stripe = ModuleType("stripe")
mock_stripe.api_key = "sk_test_mock"

class MockConnectionToken:
    secret = "pst_test_secret_mock_12345"

class MockReader:
    id = "tmr_mock_123"
    status = "online"

class MockPaymentIntent:
    id = "pi_mock_pos_123"
    client_secret = "pi_mock_pos_123_secret_xyz"
    status = "succeeded"
    amount = 62500  # $625.00
    metadata = {
        "invoice_name": "ACC-SINV-2026-00100",
        "booking_name": "BK-2026-00050",
        "base_amount": "500.0",
        "tip_amount": "125.0",
        "channel": "terminal_pos"
    }

mock_terminal = SimpleNamespace(
    ConnectionToken=SimpleNamespace(create=lambda: MockConnectionToken()),
    Reader=SimpleNamespace(
        create=lambda **k: MockReader(),
        list=lambda **k: SimpleNamespace(data=[MockReader()])
    )
)
mock_stripe.terminal = mock_terminal
mock_stripe.PaymentIntent = SimpleNamespace(
    create=lambda **k: MockPaymentIntent(),
    capture=lambda pid: MockPaymentIntent()
)
sys.modules["stripe"] = mock_stripe


# Import terminal module under test
import entertainment_express.api.terminal as terminal


@pytest.fixture(autouse=True)
def setup_mocks(monkeypatch):
    """Set up database and stripe mocks before each test."""
    mock_frappe.session.user = "crew_worker@entx.app"
    mock_frappe.get_roles = lambda u=None: ["EE Crew"]

    # Mock get_doc
    def mock_get_doc(dt, name=None):
        if dt == "Sales Invoice":
            return MockDoc(
                name="ACC-SINV-2026-00100",
                customer="Sarah Jenkins",
                company="Premier Events LLC",
                grand_total=500.0,
                outstanding_amount=500.0,
                ee_booking="BK-2026-00050",
                ee_tip_amount=0.0
            )
        elif dt == "Company":
            return MockDoc(
                name="Premier Events LLC",
                default_receivable_account="Debtors - PE",
                default_bank_account="Operating Bank - PE"
            )
        elif dt == "Event Booking":
            return MockDoc(
                name="BK-2026-00050",
                total_amount=1200.0,
                outstanding_amount=500.0,
                payment_status="Partially Paid"
            )
        elif dt == "EE Terminal Reader":
            return MockDoc(
                name="TR-001",
                reader_name="DJ Mobile Reader",
                device_type="stripe_reader_m2",
                status="Online"
            )
        return MockDoc(name=name or "DOC-MOCK")

    monkeypatch.setattr(mock_frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(mock_frappe, "new_doc", lambda dt: MockDoc(name=f"PE-{dt}-001"))
    monkeypatch.setattr(terminal, "_stripe", lambda: mock_stripe)


def test_get_connection_token_success():
    """Test generating ephemeral Terminal connection token."""
    res = terminal.get_connection_token()
    assert "secret" in res
    assert res["secret"] == "pst_test_secret_mock_12345"


def test_guest_access_rejected(monkeypatch):
    """Test that unauthenticated requests are blocked from Terminal endpoints."""
    mock_frappe.session.user = "Guest"
    with pytest.raises(mock_frappe.PermissionError):
        terminal.get_connection_token()


def test_unauthorized_role_rejected(monkeypatch):
    """Test that users without crew/dispatcher/admin roles cannot access POS."""
    mock_frappe.get_roles = lambda u=None: ["Customer", "Guest"]
    with pytest.raises(mock_frappe.PermissionError):
        terminal.get_connection_token()


def test_create_payment_intent():
    """Test creating on-site card-present PaymentIntent with booking metadata."""
    res = terminal.create_payment_intent(
        invoice_name="ACC-SINV-2026-00100",
        amount=500.0,
        tip_amount=125.0,
        booking_name="BK-2026-00050"
    )
    assert res["payment_intent_id"] == "pi_mock_pos_123"
    assert res["amount"] == 500.0
    assert res["tip_amount"] == 125.0
    assert res["total_amount"] == 625.0


def test_capture_payment_and_accounting_sync():
    """Test capturing authorized Terminal payment and generating ERPNext entries."""
    res = terminal.capture_payment("pi_mock_pos_123")
    assert res["status"] == "success"
    assert res["payment_intent_id"] == "pi_mock_pos_123"
    assert "payment_entry" in res
    assert res["total_captured"] == 625.0
    assert res["tip_amount"] == 125.0


def test_send_digital_receipt(monkeypatch):
    """Test dispatching digital receipt via SMS/email."""
    sms_dispatched = []
    def mock_send_sms(to, message):
        sms_dispatched.append((to, message))
        return {"status": "queued"}

    # Mock communications module
    mock_comms = ModuleType("entertainment_express.api.communications")
    mock_comms.send_sms = mock_send_sms
    monkeypatch.setitem(sys.modules, "entertainment_express.api.communications", mock_comms)

    res = terminal.send_digital_receipt(
        recipient="555-987-6543",
        method="sms",
        invoice_name="ACC-SINV-2026-00100",
        total_amount=625.0,
        tip_amount=125.0,
        last4="4242"
    )
    assert res["status"] == "dispatched"
    assert res["method"] == "sms"
    assert len(sms_dispatched) == 1
    assert "Receipt from Premier Events LLC" in sms_dispatched[0][1]
    assert "$625.00" in sms_dispatched[0][1]
    assert "•••• 4242" in sms_dispatched[0][1]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
