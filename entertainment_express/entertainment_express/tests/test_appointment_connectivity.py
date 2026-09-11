"""Unit and isolation tests for Client Booking to Owner Acceptance connectivity."""

import sys
from datetime import datetime, timedelta
from types import ModuleType, SimpleNamespace
import pytest

# Ensure a mock 'frappe' module is available if running outside a full Frappe bench environment
if "frappe" not in sys.modules:
    mock_frappe = ModuleType("frappe")
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})
    mock_frappe.get_roles = lambda *a, **k: ["EE Tenant Admin", "System Manager", "EE Customer"]
    mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
    mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
    mock_frappe.cache = lambda: SimpleNamespace(get=lambda *a, **k: None, get_value=lambda *a, **k: 0, setex=lambda *a, **k: None, set_value=lambda *a, **k: None, incrby=lambda *a, **k: 1, expire=lambda *a, **k: None)
    mock_frappe.parse_json = lambda val: {}
    mock_frappe.session = SimpleNamespace(user="client@example.local")
    mock_frappe.logger = lambda: SimpleNamespace(error=lambda *_: None)
    mock_frappe._ = lambda msg, *args, **kwargs: msg

    mock_utils = ModuleType("frappe.utils")
    mock_utils.cint = lambda v: int(v or 0)
    mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
    mock_utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):,.2f}"
    mock_utils.now_datetime = lambda: datetime(2026, 9, 11, 12, 0, 0)
    mock_utils.getdate = lambda v=None: datetime(2026, 9, 11).date() if not v else (v if hasattr(v, "year") else datetime.strptime(str(v)[:10], "%Y-%m-%d").date())
    mock_utils.get_datetime = lambda v: v if isinstance(v, datetime) else datetime.strptime(str(v)[:19], "%Y-%m-%d %H:%M:%S")
    mock_utils.add_days = lambda d, n: d + timedelta(days=n)
    mock_utils.add_to_date = lambda d, **kwargs: d + timedelta(days=kwargs.get("days", 0))
    mock_utils.get_url = lambda *a, **k: "http://localhost:8000"
    mock_utils.today = lambda: "2026-09-11"
    mock_utils.nowdate = lambda: "2026-09-11"

    mock_frappe.utils = mock_utils
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_utils

from entertainment_express.api import appointments, portal_owner


class MockDoc:
    def __init__(self, data, store=None, dt=None):
        self.__dict__.update(data)
        self._store = store
        self._dt = dt or data.get("doctype")
        if not hasattr(self, "name"):
            self.name = f"APPT-TEST-{data.get('doctype', 'DOC')}"
        if not hasattr(self, "meta"):
            self.meta = SimpleNamespace(has_field=lambda f: True)

    def insert(self, ignore_permissions=False):
        if self._store and self._dt:
            self._store.setdefault(self._dt, {})[self.name] = self.__dict__
        return self

    def save(self, ignore_permissions=False):
        if self._store and self._dt:
            self._store.setdefault(self._dt, {})[self.name] = self.__dict__
        return self

    def get(self, key, default=None):
        return getattr(self, key, default)

    def set(self, key, value):
        setattr(self, key, value)


@pytest.fixture
def mock_db_env(monkeypatch):
    store = {
        "EE Appointment": {},
        "EE Meeting Type": {
            "MT-1": {
                "name": "MT-1",
                "type_name": "Planning Consultation",
                "active": 1,
                "duration_minutes": 30,
                "video_url": "https://meet.google.com/ee-consult",
                "buffer_before": 0,
                "buffer_after": 0,
                "assigned_staff": "EMP-001",
            }
        },
        "Event Booking": {
            "EE-BK-2026-0002": {
                "name": "EE-BK-2026-0002",
                "event_name": "Smith-Johnson Wedding Gala",
            }
        },
        "Employee": {
            "EMP-001": {
                "name": "EMP-001",
                "employee_name": "Lead DJ Alex",
                "status": "Active",
            }
        },
        "Customer": {
            "CUST-001": {
                "name": "CUST-001",
                "customer_name": "Jane Smith",
                "email_id": "client@example.local",
            }
        },
        "Lead": {},
    }

    db = SimpleNamespace()
    db.table_exists = lambda dt: dt in store
    db.has_column = lambda dt, col: True
    db.exists = lambda dt, name: name in store.get(dt, {})
    db.get_value = lambda dt, filters, fieldname=None, as_dict=False: (
        store.get(dt, {}).get(filters if isinstance(filters, str) else list(store.get(dt, {}).keys())[0], {}).get(fieldname)
        if isinstance(filters, str)
        else (
            next((v.get(fieldname) for v in store.get(dt, {}).values() if all(v.get(k) == val for k, val in (filters or {}).items())), None)
            if isinstance(filters, dict)
            else None
        )
    )
    def fake_count(dt, filters=None):
        records = list(store.get(dt, {}).values())
        if not filters:
            return len(records)
        count = 0
        for r in records:
            match = True
            for k, v in filters.items():
                if isinstance(v, list) and len(v) == 2 and v[0] == "in":
                    if r.get(k) not in v[1]:
                        match = False
                        break
                elif r.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    db.count = fake_count
    db.get_default = lambda key: "USD"
    db.get_single_value = lambda dt, key: ""

    created_docs = []

    def fake_get_doc(doctype_or_data, name=None):
        if isinstance(doctype_or_data, dict):
            dt = doctype_or_data.get("doctype", "EE Appointment")
            doc = MockDoc(doctype_or_data, store=store, dt=dt)
            created_docs.append(doc)
            store.setdefault(dt, {})[doc.name] = doc.__dict__
            return doc
        dt = doctype_or_data
        data = store.get(dt, {}).get(name, {"name": name, "doctype": dt})
        return MockDoc(data, store=store, dt=dt)

    def fake_get_all(doctype, filters=None, fields=None, **kwargs):
        records = list(store.get(doctype, {}).values())
        if filters:
            filtered = []
            for r in records:
                match = True
                for k, v in filters.items():
                    if isinstance(v, list) and len(v) == 2 and v[0] == "in":
                        if r.get(k) not in v[1]:
                            match = False
                    elif r.get(k) != v:
                        match = False
                if match:
                    filtered.append(r)
            records = filtered
        return records

    fake_frappe = SimpleNamespace(
        db=db,
        session=SimpleNamespace(user="client@example.local"),
        get_roles=lambda *a, **k: ["EE Customer", "EE Tenant Admin"],
        throw=lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg)),
        get_doc=fake_get_doc,
        get_all=fake_get_all,
        logger=lambda: SimpleNamespace(error=lambda *_: None),
        PermissionError=Exception,
        ValidationError=ValueError,
        whitelist=lambda *a, **k: (lambda fn: fn),
        local=SimpleNamespace(request_ip="127.0.0.1"),
    )

    monkeypatch.setattr(appointments, "frappe", fake_frappe)
    monkeypatch.setattr(portal_owner, "frappe", fake_frappe)
    monkeypatch.setattr(appointments, "_notify", lambda *a, **k: None)
    monkeypatch.setattr(portal_owner, "_audit", lambda *a, **k: None)

    return fake_frappe, store, created_docs


def test_book_appointment_for_booking_creates_requested_status(mock_db_env):
    """Test client booking a consult for EE-BK-2026-0002 generates requested status and stores event_booking."""
    fake_frappe, store, created_docs = mock_db_env

    res = appointments.book_appointment(
        slot="MT-1|2026-09-15 14:00:00|EMP-001",
        appointment_type="video",
        notes="Review playlist vibe and ceremony cues",
        booking="EE-BK-2026-0002",
    )

    assert res["ok"] is True
    assert res["status"] == "requested"

    # Find created appointment
    appts = [d for d in created_docs if d.doctype == "EE Appointment"]
    assert len(appts) == 1
    appt = appts[0]
    assert appt.event_booking == "EE-BK-2026-0002"
    assert appt.status == "requested"
    assert appt.appointment_type == "video"
    assert "Review playlist vibe" in appt.notes


def test_get_approvals_includes_requested_consult(mock_db_env):
    """Test get_approvals in portal_owner returns requested appointments with booking details."""
    fake_frappe, store, created_docs = mock_db_env

    # Seed an appointment in requested status
    store["EE Appointment"]["APPT-001"] = {
        "name": "APPT-001",
        "meeting_type": "MT-1",
        "invitee_name": "Jane Smith",
        "start": "2026-09-15 14:00:00",
        "status": "requested",
        "event_booking": "EE-BK-2026-0002",
        "notes": "Discuss song selections",
        "appointment_type": "video",
    }

    approvals = portal_owner.get_approvals()
    appt_approvals = [a for a in approvals if a.get("type") == "appointment"]
    assert len(appt_approvals) == 1
    item = appt_approvals[0]
    assert item["id"] == "APPT-001"
    assert item["doctype"] == "EE Appointment"
    assert item["event"] == "EE-BK-2026-0002"
    assert "Jane Smith" in item["summary"]


def test_act_on_approval_approves_appointment(mock_db_env):
    """Test act_on_approval approves requested consultation and transitions status to scheduled."""
    fake_frappe, store, created_docs = mock_db_env

    store["EE Appointment"]["APPT-001"] = {
        "name": "APPT-001",
        "meeting_type": "MT-1",
        "invitee_name": "Jane Smith",
        "invitee_email": "jane@example.local",
        "start": "2026-09-15 14:00:00",
        "status": "requested",
        "cancel_token": "token-123",
    }

    res = portal_owner.act_on_approval(
        approval_type="appointment",
        doctype="EE Appointment",
        name="APPT-001",
        decision="approved",
    )
    assert res["ok"] is True
    assert store["EE Appointment"]["APPT-001"]["status"] == "scheduled"


def test_accept_appointment_endpoint(mock_db_env):
    """Test direct accept_appointment endpoint sets status to scheduled."""
    fake_frappe, store, created_docs = mock_db_env

    store["EE Appointment"]["APPT-002"] = {
        "name": "APPT-002",
        "meeting_type": "MT-1",
        "invitee_name": "Jane Smith",
        "invitee_email": "jane@example.local",
        "start": "2026-09-16 11:00:00",
        "status": "requested",
        "cancel_token": "token-456",
    }

    res = appointments.accept_appointment("APPT-002")
    assert res["ok"] is True
    assert res["status"] == "scheduled"
    assert store["EE Appointment"]["APPT-002"]["status"] == "scheduled"


def test_my_appointments_filters_by_booking(mock_db_env):
    """Test my_appointments returns requested and scheduled appointments for specific booking."""
    fake_frappe, store, created_docs = mock_db_env

    store["EE Appointment"]["APPT-A"] = {
        "name": "APPT-A",
        "meeting_type": "MT-1",
        "invitee_name": "Jane Smith",
        "start": "2026-09-15 14:00:00",
        "end": "2026-09-15 14:30:00",
        "status": "requested",
        "event_booking": "EE-BK-2026-0002",
        "customer": "CUST-001",
        "notes": "Planning notes",
        "appointment_type": "video",
    }
    store["EE Appointment"]["APPT-B"] = {
        "name": "APPT-B",
        "meeting_type": "MT-1",
        "invitee_name": "Jane Smith",
        "start": "2026-09-18 15:00:00",
        "end": "2026-09-18 15:30:00",
        "status": "scheduled",
        "event_booking": "EE-BK-OTHER-9999",
        "customer": "CUST-001",
        "notes": "Other gig",
        "appointment_type": "phone",
    }

    # Filter for EE-BK-2026-0002
    results = appointments.my_appointments(booking="EE-BK-2026-0002")
    assert len(results) == 1
    assert results[0]["id"] == "APPT-A"
    assert results[0]["status"] == "requested"
    assert results[0]["event_booking"] == "EE-BK-2026-0002"
