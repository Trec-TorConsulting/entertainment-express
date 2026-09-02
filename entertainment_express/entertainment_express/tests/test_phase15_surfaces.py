"""Phase 15 surfaces — isolation, guests 403, missing keys fail clearly."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import music, planning, timeline
from entertainment_express.event_planning import attach, crew_view, forms


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    DoesNotExistError = Exception

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site="e2esmoke.entx.app")
        self.PermissionError = _Perm
        self.conf = {}
        self.db = SimpleNamespace(
            exists=lambda *a, **k: True,
            get_value=lambda *a, **k: None,
            get_all=lambda *a, **k: [],
            commit=lambda: None,
            set_value=lambda *a, **k: None,
            count=lambda *a, **k: 0,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def whitelist(self, *a, **k):
        return lambda f: f

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: None, save=lambda **kw: None, as_dict=lambda: {"items": []})


def test_conditionals_hide_until_yes():
    field = SimpleNamespace(conditional_on_field="ceremony", conditional_on_value="Yes")
    assert forms.is_visible(field, {"ceremony": "No"}) is False
    assert forms.is_visible(field, {"ceremony": "Yes"}) is True


def test_list_form_templates_staff_only(monkeypatch):
    fake = _Fake([])
    monkeypatch.setattr(planning, "frappe", fake)

    def boom(*a, **k):
        raise _Perm("no")

    monkeypatch.setattr(planning, "require_roles", boom)
    with pytest.raises(_Perm):
        planning.list_form_templates()


def test_youtube_import_without_key_is_setup_copy(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(music, "frappe", fake)
    monkeypatch.setattr(music, "os", SimpleNamespace(environ={}))
    monkeypatch.setattr("entertainment_express.integrations.credentials.secrets", lambda *_: {})
    with pytest.raises(Exception) as err:
        music._youtube_tracks("https://www.youtube.com/playlist?list=abc")
    assert "connect YouTube" in str(err.value) or "not configured" in str(err.value)


def test_no_cross_site_connect():
    files = [
        Path(planning.__file__),
        Path(timeline.__file__),
        Path(music.__file__),
        Path(crew_view.__file__),
        Path(attach.__file__),
    ]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src


def test_attach_matches_event_type_only():
    src = inspect.getsource(attach.attach_forms)
    assert "event_type" in src
    assert "frappe.init" not in src
