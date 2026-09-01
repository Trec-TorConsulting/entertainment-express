"""Phase 9 — Field PWA: guest 403, own-shift, no tenant args, FCM devices."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import field
from entertainment_express import notifications


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="crew@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://acme.test")

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace()


def test_guest_denied_field_mutations(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    monkeypatch.setattr(field, "frappe", fake)
    with pytest.raises(_Perm):
        field.check_in("CA-1")
    with pytest.raises(_Perm):
        field.report_issue("CA-1", "damage", "Broken speaker")
    with pytest.raises(_Perm):
        field.upload_photo("CA-1", "Setup", "aaaa")
    with pytest.raises(_Perm):
        field.capture_signature("CA-1", "Host")
    with pytest.raises(_Perm):
        field.register_push_token("tok")


def test_guest_user_denied(monkeypatch):
    fake = _Fake(["Guest"], user="Guest")
    monkeypatch.setattr(field, "frappe", fake)
    with pytest.raises(_Perm):
        field.my_jobs()


def test_no_tenant_or_site_args():
    for fn in (
        field.my_jobs,
        field.check_in,
        field.check_out,
        field.set_stage,
        field.toggle_checklist,
        field.upload_photo,
        field.capture_signature,
        field.report_issue,
        field.register_push_token,
    ):
        names = inspect.signature(fn).parameters
        assert "tenant" not in names
        assert "site" not in names


def test_not_own_shift(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(field, "frappe", fake)
    monkeypatch.setattr(field._pd, "_require_field", lambda: None)

    def _nope(*_a, **_k):
        raise _Perm("That shift is not yours.")

    monkeypatch.setattr(field._pd, "_assert_own_or_dispatch", _nope)
    with pytest.raises(_Perm):
        field.check_in("CA-OTHER")


def test_fcm_uses_push_devices():
    src = inspect.getsource(notifications._push_tokens) + inspect.getsource(notifications._fcm)
    assert "EE Push Device" in src
    assert "not_configured" in inspect.getsource(notifications._fcm)


def test_fieldboard_is_pwa_not_desk():
    board = Path(__file__).resolve().parents[3] / "frontend" / "portal-kit" / "src" / "components" / "FieldBoard.tsx"
    text = board.read_text(encoding="utf-8")
    assert "entertainment_express.api.field." in text
    assert "/app" not in text
    assert "Crew Assignment" not in text
    assert "EE Field Issue" not in text
    assert "Navigate" in text
    assert "Check in" in text
    assert "Saved on this phone" in text
