"""Phase 7 — photos membership, guest 403 on changes, unpublished hidden."""

from __future__ import annotations

import inspect
from types import SimpleNamespace

import pytest

from entertainment_express.api import booking_changes, deliverables


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = Exception

    def __init__(self, roles, user="host@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.ValidationError = Exception
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: True,
            table_exists=lambda *_: True,
            get_default=lambda *_: "USD",
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace(published=0, booking="BK-1", content_b64="", file_name="a.jpg")


def test_guest_denied_change_request(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(booking_changes, "frappe", fake)
    with pytest.raises(_Perm):
        booking_changes.request_change("BK-1", "reschedule", requested_date="2030-06-01")


def test_guest_cannot_upload_photo(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(deliverables, "frappe", fake)
    with pytest.raises(_Perm):
        deliverables.save_deliverable("BK-1", "After", "aaaa", file_name="a.jpg")


def test_list_hides_unpublished_from_members(monkeypatch):
    seen = {}
    fake = _Fake(["EE Customer"], user="host@test.local")

    def get_all(doctype, filters=None, **k):
        seen["filters"] = dict(filters or {})
        return []

    fake.get_all = get_all
    monkeypatch.setattr(deliverables, "frappe", fake)
    monkeypatch.setattr(deliverables, "is_booking_member", lambda *_a, **_k: True)
    monkeypatch.setattr(deliverables, "_is_staff", lambda: False)
    deliverables.list_deliverables("BK-1")
    assert seen["filters"]["booking"] == "BK-1"
    assert seen["filters"]["published"] == 1
    assert "tenant" not in seen["filters"]
    assert "site" not in seen["filters"]


def test_list_never_returns_content():
    src = inspect.getsource(deliverables.list_deliverables)
    assert "content_b64" not in src


def test_change_apis_have_no_tenant_args():
    for fn in (booking_changes.request_change, deliverables.list_deliverables, deliverables.get_deliverable):
        params = inspect.signature(fn).parameters
        assert "tenant" not in params
        assert "site" not in params


def test_addon_apply_uses_flt():
    src = inspect.getsource(booking_changes._apply)
    assert "flt(" in src


def test_client_photos_is_not_stub():
    from pathlib import Path

    app = Path(__file__).resolve().parents[3] / "frontend" / "customer-portal" / "src" / "App.tsx"
    text = app.read_text(encoding="utf-8")
    assert "list_deliverables" in text
    assert "Galleries show here after the event." not in text
    assert "EE Deliverable" not in text
