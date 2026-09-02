"""Phase 3 surfaces — hours, time-off, compliance, tips, guests 403, isolation."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import appointments, hr_workforce, portal_hr


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = Exception

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site="e2esmoke.entx.app")
        self.PermissionError = _Perm
        self.ValidationError = Exception
        self.conf = {}
        self.form_dict = {}
        self._time_off = []
        self._wa = {}
        self._docs = []
        self._tips = []
        self._crew = []
        self.db = SimpleNamespace(
            exists=lambda *a, **k: True,
            get_value=self._get_value,
            get_all=self._get_all,
            count=self._count,
            table_exists=lambda *_: True,
            commit=lambda: None,
            set_value=lambda *a, **k: None,
        )
        self.utils = SimpleNamespace(
            flt=lambda x, *a, **k: float(x or 0),
            getdate=lambda v: v,
            get_datetime=lambda v: v,
            now_datetime=lambda: "2026-09-02 12:00:00",
            random_string=lambda n: "x" * n,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_doc(self, *a, **k):
        name = a[1] if len(a) > 1 else None
        if name in self._wa:
            return self._wa[name]
        return SimpleNamespace(insert=lambda **kw: None, save=lambda **kw: None, workers=[], timesheets_detail=[])

    def get_all(self, *a, **k):
        return self.db.get_all(*a, **k)

    def whitelist(self, *a, **k):
        return lambda f: f

    def _get_value(self, doctype, filters=None, fieldname=None, as_dict=False):
        if doctype == "Worker Availability":
            emp = filters.get("employee") if isinstance(filters, dict) else None
            for name, wa in self._wa.items():
                if getattr(wa, "employee", None) == emp:
                    return name if fieldname in (None, "name") else wa
            return None
        if doctype == "Employee":
            return "1099" if fieldname == "ee_employment_type" else None
        if doctype == "Event Booking":
            return "2026-09-02"
        if doctype == "Compliance Document":
            emp = filters.get("employee") if isinstance(filters, dict) else None
            kind = filters.get("doc_type") if isinstance(filters, dict) else None
            for doc in self._docs:
                if doc["employee"] == emp and doc["doc_type"] == kind:
                    return SimpleNamespace(**doc) if as_dict else doc["name"]
            return None
        return None

    def _get_all(self, doctype, filters=None, fields=None, **k):
        if doctype == "Worker Time Off":
            emp = (filters or {}).get("employee")
            day = None
            if (filters or {}).get("start_date"):
                day = (filters or {}).get("end_date")
            return [row for row in self._time_off if row["employee"] == emp]
        if doctype == "Compliance Document":
            emp = (filters or {}).get("employee")
            return [d for d in self._docs if not emp or d["employee"] == emp]
        if doctype == "Sales Invoice":
            return list(self._tips)
        if doctype == "Crew Assignment":
            booking = (filters or {}).get("booking")
            emp = (filters or {}).get("crew_member")
            rows = self._crew
            if booking:
                rows = [r for r in rows if r.get("booking") == booking]
            if emp:
                rows = [r for r in rows if r.get("crew_member") == emp]
            return rows
        return []

    def _count(self, doctype, filters=None):
        if doctype == "Event Booking" and (filters or {}).get("status") == "time_off":
            return 0
        return 0


def test_guest_denied_pay_and_people(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_hr, "frappe", fake)
    with pytest.raises(_Perm):
        portal_hr.list_people()
    with pytest.raises(_Perm):
        portal_hr.process_payout("PR-1")
    with pytest.raises(_Perm):
        portal_hr.create_pay_run("2026-09-01", "2026-09-07")


def test_crew_cannot_run_payroll(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_hr, "frappe", fake)
    with pytest.raises(_Perm):
        portal_hr.process_payout("PR-1")
    with pytest.raises(_Perm):
        portal_hr.create_pay_run("2026-09-01", "2026-09-07")
    with pytest.raises(_Perm):
        portal_hr.approve_hours("TS-1")


def test_time_off_blocks_hours(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._time_off = [{"employee": "EMP-1", "start_date": "2026-09-02", "end_date": "2026-09-02"}]
    monkeypatch.setattr(hr_workforce, "frappe", fake)
    monkeypatch.setattr(hr_workforce, "getdate", lambda v: __import__("datetime").date(2026, 9, 2) if "09-02" in str(v) or v == fake._time_off[0]["start_date"] else __import__("datetime").date(2026, 9, 2))
    monkeypatch.setattr(hr_workforce, "get_datetime", lambda v: __import__("datetime").datetime(2026, 9, 2, 14, 0) if "14" in str(v) or "end" not in str(v).lower() else __import__("datetime").datetime(2026, 9, 2, 16, 0))
    ok, reason = hr_workforce.hours_cover_window("EMP-1", "2026-09-02 14:00:00", "2026-09-02 16:00:00")
    assert ok is False
    assert "time-off" in reason.lower()


def test_missing_hours_row_is_available(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(hr_workforce, "frappe", fake)
    from datetime import datetime

    monkeypatch.setattr(hr_workforce, "getdate", lambda v: datetime(2026, 9, 2).date())
    monkeypatch.setattr(hr_workforce, "get_datetime", lambda v: datetime(2026, 9, 2, 14, 0) if "14" in str(v) else datetime(2026, 9, 2, 16, 0))
    ok, reason = hr_workforce.hours_cover_window("EMP-1", "2026-09-02 14:00:00", "2026-09-02 16:00:00")
    assert ok is True
    assert reason == ""


def test_expired_cert_blocks_assign(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._docs = [{"employee": "EMP-1", "doc_type": "driver_license", "status": "expired", "expiry_date": "2026-01-01", "name": "CD-1"}]
    monkeypatch.setattr(hr_workforce, "frappe", fake)
    monkeypatch.setattr(hr_workforce, "getdate", lambda v=None: __import__("datetime").date(2026, 9, 2))
    reason = hr_workforce.assignment_block_reason("EMP-1")
    assert reason and "expired" in reason.lower()


def test_missing_w9_blocks_onboarded_1099(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._wa = {"WA-1": SimpleNamespace(employee="EMP-1", monday_start_time="10:00:00", monday_end_time="22:00:00")}
    fake._docs = [
        {"employee": "EMP-1", "doc_type": "contract", "status": "verified", "expiry_date": None, "name": "C1"},
        {"employee": "EMP-1", "doc_type": "background_check", "status": "verified", "expiry_date": None, "name": "C2"},
    ]
    monkeypatch.setattr(hr_workforce, "frappe", fake)
    monkeypatch.setattr(hr_workforce, "getdate", lambda v=None: __import__("datetime").date(2026, 9, 2))
    reason = hr_workforce.assignment_block_reason("EMP-1")
    assert reason and "w9" in reason.lower()


def test_tip_share_splits_among_completed_crew(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._tips = [{"name": "INV-1", "ee_booking": "BK-1", "ee_tip_amount": 100}]
    fake._crew = [
        {"crew_member": "EMP-1", "booking": "BK-1", "status": "completed"},
        {"crew_member": "EMP-2", "booking": "BK-1", "status": "completed"},
    ]
    monkeypatch.setattr(hr_workforce, "frappe", fake)
    monkeypatch.setattr(hr_workforce, "getdate", lambda v=None: __import__("datetime").date(2026, 9, 2) if v else __import__("datetime").date(2026, 9, 2))
    share = hr_workforce.attributed_tips("EMP-1", "2026-09-01", "2026-09-07")
    assert share == 50.0


def test_consult_time_off_uses_workforce(monkeypatch):
    fake = _Fake(["EE Sales"])
    monkeypatch.setattr(appointments, "frappe", fake)
    monkeypatch.setattr(hr_workforce, "worker_on_time_off", lambda *_: True)
    assert appointments._time_off("EMP-1", "2026-09-02") is True


def test_no_cross_site_connect():
    files = [
        Path(hr_workforce.__file__),
        Path(portal_hr.__file__),
    ]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
    assert "tenant" not in inspect.getsource(portal_hr.process_payout)


def test_people_ui_has_worker_copy():
    owner = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    employee = Path(__file__).resolve().parents[3] / "frontend" / "employee-portal" / "src" / "App.tsx"
    owner_src = owner.read_text(encoding="utf-8")
    emp_src = employee.read_text(encoding="utf-8")
    chunk = owner_src.split("function TeamWorkspace")[1].split("function CatalogWorkspace")[0]
    assert "portal_hr.save_profile" in owner_src
    assert "Pay crew" in owner_src
    assert "/app" not in chunk
    assert "save_my_hours" in emp_src
    assert "portal_hr.create_pay_run" in emp_src
