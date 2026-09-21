"""Unit tests for DJ live music performance suite: playlist XML/CSV syntax, Do-Not-Play conflict triggers, and poll requests."""

from __future__ import annotations

import sys
from types import ModuleType, SimpleNamespace
import pytest


def _install_frappe_stub() -> None:
    if "frappe" in sys.modules and hasattr(sys.modules["frappe"], "whitelist"):
        return
    m = ModuleType("frappe")
    m.whitelist = lambda *a, **k: (lambda f: f)
    m.PermissionError = type("PermissionError", (Exception,), {})
    m.utils = ModuleType("frappe.utils")
    m.utils.cint = lambda x, *a, **k: int(float(x or 0))
    m.utils.flt = lambda x, *a, **k: float(x or 0)
    m.get_roles = lambda *a, **k: ["System Manager", "EE Dispatcher", "EE Crew"]
    m.session = SimpleNamespace(user="dj@test.com")
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import music, music_export  # noqa: E402


def test_playlist_serato_csv_and_rekordbox_xml_syntax():
    rows = [
        {"song": "Etta James - At Last", "category": "special_moment", "moment": "First Dance", "free_text": "", "notes": ""},
        {"song": "Earth, Wind & Fire - September", "category": "must_play", "moment": "Open Floor", "free_text": "", "notes": ""},
    ]

    csv_data = music_export.export_serato_csv(rows)
    assert "Etta James" in csv_data
    assert "September" in csv_data

    xml_data = music_export.export_rekordbox_xml(rows)
    assert 'Artist="Etta James"' in xml_data
    assert "<DJ_PLAYLISTS" in xml_data


def test_poll_live_dj_requests_dnp_conflict_checking(monkeypatch):
    mock_selections = [
        {"name": "1", "category": "do_not_play", "song": "Chicken Dance", "free_text": "Chicken Dance"},
        {"name": "2", "category": "general_request", "song": "Chicken Dance", "free_text": "Chicken Dance"},
        {"name": "3", "category": "general_request", "song": "Uptown Funk", "free_text": "Uptown Funk"},
    ]

    fake_frappe = SimpleNamespace(
        get_roles=lambda: ["EE Dispatcher"],
        get_all=lambda dt, filters=None, **k: mock_selections,
        whitelist=lambda *a, **k: (lambda f: f),
    )
    monkeypatch.setattr(music, "frappe", fake_frappe)
    monkeypatch.setattr(music, "assert_booking_access", lambda b: None)
    monkeypatch.setattr(music, "require_roles", lambda *r: None)

    res = music.poll_live_dj_requests("BK-DJ-01")
    assert len(res["requests"]) == 1
    assert res["requests"][0]["song"] == "Uptown Funk"
    assert len(res["flagged_dnp_conflicts"]) == 1
    assert res["flagged_dnp_conflicts"][0]["song"] == "Chicken Dance"
