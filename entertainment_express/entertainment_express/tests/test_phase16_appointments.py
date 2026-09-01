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
