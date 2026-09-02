"""Phase 16 — appointment isolation and overlap. No money fields."""

from types import SimpleNamespace

import pytest

from entertainment_express.api import appointments


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            count=lambda *a, **k: 0,
            table_exists=lambda *_: True,
            get_default=lambda *_: "USD",
            get_single_value=lambda *a, **k: "",
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace()


def test_guest_denied_complete(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(appointments, "frappe", fake)
    with pytest.raises(_Perm):
        appointments.complete("APPT-1")


def test_event_guest_denied_list_mine(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(appointments, "frappe", fake)
    with pytest.raises(_Perm):
        appointments.list_mine()


def test_overlaps_detects_event_window():
    from datetime import datetime

    start = datetime(2030, 6, 1, 15, 0)
    end = datetime(2030, 6, 1, 15, 30)
    windows = [(datetime(2030, 6, 1, 14, 0), datetime(2030, 6, 1, 18, 0))]
    assert appointments._overlaps(start, end, windows) is True
    later = [(datetime(2030, 6, 1, 18, 0), datetime(2030, 6, 1, 20, 0))]
    assert appointments._overlaps(start, end, later) is False


def test_busy_windows_only_query_this_staff(monkeypatch):
    seen = []
    fake = _Fake(["Guest"])
    fake.db.table_exists = lambda *_: True
    fake.db.get_value = lambda *a, **k: None

    def get_all(doctype, filters=None, **k):
        seen.append((doctype, dict(filters or {})))
        return []

    fake.get_all = get_all
    monkeypatch.setattr(appointments, "frappe", fake)
    appointments._busy_windows("EMP-A", "2030-06-01")
    assert seen
    for doctype, filters in seen:
        assert "tenant" not in filters
        if doctype == "EE Appointment":
            assert filters["staff"] == "EMP-A"
        if doctype == "Crew Assignment":
            assert filters["crew_member"] == "EMP-A"


def test_sales_list_mine_omits_other_staff(monkeypatch):
    captured = {}
    fake = _Fake(["EE Sales"], user="sales-a@test.local")
    fake.db.get_value = lambda *a, **k: "EMP-A" if a and a[0] == "Employee" else "Consult"

    def get_all(doctype, filters=None, **k):
        captured["filters"] = dict(filters or {})
        return []

    fake.get_all = get_all
    monkeypatch.setattr(appointments, "frappe", fake)
    appointments.list_mine()
    assert captured["filters"]["staff"] == "EMP-A"


def test_book_is_rate_limited(monkeypatch):
    class TooMany(Exception):
        pass

    fake = _Fake(["Guest"], user="Guest")
    fake.ValidationError = TooMany
    monkeypatch.setattr(appointments, "frappe", fake)

    def limited(*a, **k):
        fake.throw("Too many requests. Please try again later.", TooMany)

    import entertainment_express.api.marketing as marketing

    monkeypatch.setattr(marketing, "_check_rate_limit", limited)
    with pytest.raises(TooMany):
        appointments.book("MT", "2030-06-01 10:00:00", "Ada", "ada@test.local")


def test_book_does_not_grant_customer_role():
    import inspect

    src = inspect.getsource(appointments.book)
    assert "add_roles" not in src
    assert "Has Role" not in src
    assert "EE Customer" not in src or "PAYER_ROLE" in src


def test_guest_denied_complete_is_not_payer(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    monkeypatch.setattr(appointments, "frappe", fake)
    with pytest.raises(_Perm):
        appointments.complete("APPT-1", "completed")
    with pytest.raises(_Perm):
        appointments.list_mine()
