from types import SimpleNamespace

import pytest

from entertainment_express.api import portal_collaboration, portal_reports


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.utils = SimpleNamespace(
            now=lambda: "2026-08-14 12:00:00",
            add_to_date=lambda dt, hours=0, **k: dt,
        )
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            count=lambda *a, **k: 0,
            get_default=lambda *_: "USD",
            set_value=lambda *a, **k: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc):
        raise exc(message)

    def get_all(self, *a, **k):
        return []

    def logger(self):
        return SimpleNamespace(error=lambda *a, **k: None)


def test_guest_denied_owner_reports(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.owner_pack()


def test_guest_denied_client_money_if_not_customer(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.client_money_summary()


def test_staff_is_booking_member(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], user="owner@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.is_booking_member("EB-1", "owner@test.local") is True


def test_stranger_is_not_member(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.is_booking_member("EB-1", "stranger@test.local") is False


def test_require_member_denies_stranger(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    with pytest.raises(_Perm):
        portal_collaboration.list_messages("EB-1")


def test_list_my_events_guest_without_invites(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.list_my_events() == []


def test_unread_chat_is_zero_without_memberships(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="stranger@test.local")
    monkeypatch.setattr(portal_collaboration, "frappe", fake)
    assert portal_collaboration.unread_chat_count() == 0


def test_simple_pdf_bytes():
    raw = portal_reports.simple_pdf("Company reports", ["Jobs: 3", "Billed: $1.00"])
    assert raw.startswith(b"%PDF")
    assert b"%%EOF" in raw


def test_event_guest_role_fixture():
    import json
    from pathlib import Path

    path = Path(__file__).resolve().parents[1] / "fixtures" / "role.json"
    roles = {row["name"] for row in json.loads(path.read_text())}
    assert "EE Event Guest" in roles
