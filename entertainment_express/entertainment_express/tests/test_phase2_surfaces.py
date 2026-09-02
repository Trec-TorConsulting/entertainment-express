"""Phase 2 surfaces — isolation, guests 403, routes by call time, no AI required."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import dispatch, portal_dispatch


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

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
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def whitelist(self, *a, **k):
        return lambda f: f


def test_guest_denied_dispatch_board(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_dispatch, "frappe", fake)
    with pytest.raises(_Perm):
        portal_dispatch.board("2026-09-02")


def test_guest_denied_suggest(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_dispatch, "frappe", fake)
    with pytest.raises(_Perm):
        portal_dispatch.suggest("BK-1")


def test_crew_cannot_open_dispatch_board(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_dispatch, "frappe", fake)
    with pytest.raises(_Perm):
        portal_dispatch.board("2026-09-02")


def test_suggest_ranks_role_first(monkeypatch):
    monkeypatch.setattr(dispatch, "_check_role", lambda *_: None)
    monkeypatch.setattr(
        dispatch,
        "list_available_crew",
        lambda **k: [
            {"employee": "E2", "employee_name": "Sam", "roles": ["Driver"]},
            {"employee": "E1", "employee_name": "Alex", "roles": ["DJ"]},
        ],
    )
    monkeypatch.setattr(dispatch.frappe, "get_doc", lambda *a, **k: SimpleNamespace(event_date="2026-09-02"))
    ranked = dispatch.suggest_crew("BK", role_name="DJ")
    assert ranked[0]["employee"] == "E1"
    assert "role" in ranked[0]["reason"].lower()


def test_route_follows_start_time(monkeypatch):
    jobs = [
        {"name": "B", "event_name": "Late", "start_time": "18:00:00", "venue_address": "B St"},
        {"name": "A", "event_name": "Early", "start_time": "10:00:00", "venue_address": "A St"},
    ]
    monkeypatch.setattr(
        dispatch,
        "get_dispatch_board",
        lambda d: sorted(jobs, key=lambda j: str(j["start_time"])),
    )
    monkeypatch.setattr(dispatch.frappe, "db", SimpleNamespace(get_value=lambda *a, **k: ""))
    payload = dispatch.compute_day_route("2026-09-02")
    assert [s["booking"] for s in payload["stops"]] == ["A", "B"]
    assert all(s["travel_minutes"] is None for s in payload["stops"])


def test_no_cross_site_connect():
    files = [
        Path(dispatch.__file__),
        Path(portal_dispatch.__file__),
    ]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
    assert "tenant" not in inspect.getsource(portal_dispatch.board)
    assert "site" not in inspect.getsource(dispatch.suggest_crew)


def test_board_ui_uses_deterministic_suggest():
    board = Path(__file__).resolve().parents[3] / "frontend" / "portal-kit" / "src" / "components" / "DispatchBoard.tsx"
    src = board.read_text(encoding="utf-8")
    assert "portal_dispatch.suggest" in src
    assert "ai.suggest_dispatch" not in src
    assert "Issue run sheet" in src
    assert "Drive order" in src
    assert "DocType" not in src
