"""Phase 13 — Integrations: guests 403, no tenant args, secrets stay off the wire."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import integrations, music
from entertainment_express.integrations import accounting, calendar, http, maps, observe
from entertainment_express.integrations.doctype.integration_sync_log.integration_sync_log import (
    IntegrationSyncLog,
)


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local", site="e2esmoke.entx.app"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(
            site=site,
            request=None,
            response=SimpleNamespace(http_status_code=200, headers={}),
            form_dict={},
        )
        self.request = SimpleNamespace(json={})
        self.PermissionError = _Perm
        self.conf = {}
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=self._exists,
            table_exists=lambda *_: True,
            count=lambda *a, **k: 0,
            set_value=lambda *a, **k: None,
            get_default=lambda *_: "USD",
            get_all=lambda *a, **k: [],
            commit=lambda: None,
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://e2esmoke.entx.app", flt=lambda x: x)
        self._configs = []

    def _exists(self, dt, name=None, *a, **k):
        if dt == "DocType":
            return True
        if dt == "Integration Webhook Event":
            return False
        if dt == "Integration Config" and name:
            return False
        return False

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return list(self._configs)

    def get_doc(self, *a, **k):
        return SimpleNamespace(
            insert=lambda **kw: None,
            save=lambda **kw: None,
            db_set=lambda *a, **k: None,
            enabled=0,
            status="disconnected",
            last_error="",
            credentials="",
            settings="{}",
            meta=SimpleNamespace(has_field=lambda *_: True),
        )

    def get_request_header(self, name):
        return ""

    def parse_json(self, raw):
        import json

        return json.loads(raw or "{}")

    def enqueue(self, *a, **k):
        return None

    def whitelist(self, *a, **k):
        return lambda f: f

    def log_error(self, *a, **k):
        return None


def _patch_api(monkeypatch, fake):
    monkeypatch.setattr(integrations, "frappe", fake)
    monkeypatch.setattr(integrations, "require_roles", lambda *a, **k: None)


def test_guest_denied_connection_apis(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="Guest")
    _patch_api(monkeypatch, fake)
    with pytest.raises(_Perm):
        integrations.list_connections()
    with pytest.raises(_Perm):
        integrations.save_connection("mapbox", 1, {"token": "x"})
    with pytest.raises(_Perm):
        integrations.geocode("1 Main St")
    with pytest.raises(_Perm):
        integrations.rotate_ical_token()


def test_event_guest_denied_list(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    _patch_api(monkeypatch, fake)
    with pytest.raises(_Perm):
        integrations.list_connections()


def test_crew_cannot_save_connection(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(integrations, "frappe", fake)
    with pytest.raises(_Perm):
        integrations.save_connection("mapbox", 1, {"token": "secret"})


def test_list_connections_omits_secrets(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._configs = [
        {
            "provider": "mapbox",
            "enabled": 1,
            "status": "connected",
            "last_error": "",
            "credentials": "pk.secret",
        }
    ]
    _patch_api(monkeypatch, fake)
    rows = integrations.list_connections()
    assert rows
    for row in rows:
        blob = str(row)
        assert "credentials" not in row
        assert "pk.secret" not in blob
        assert "token" not in row
        assert "api_key" not in row
        assert set(row.keys()) <= {"provider", "label", "enabled", "status", "last_error"}


def test_save_connection_does_not_echo_secret(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    _patch_api(monkeypatch, fake)
    out = integrations.save_connection("mapbox", 1, {"token": "pk.live-secret"})
    assert "pk.live-secret" not in str(out)
    assert "credentials" not in out
    assert out["provider"] == "mapbox"


def test_no_tenant_or_site_args():
    for fn in (
        integrations.list_connections,
        integrations.save_connection,
        integrations.geocode,
        integrations.inbound_webhook,
        integrations.rotate_ical_token,
        calendar.sync_booking,
        calendar.on_booking_update,
        maps.geocode,
        maps.travel_minutes,
        accounting.sync_invoice,
        music.fetch_playlist_tracks,
    ):
        names = inspect.signature(fn).parameters
        assert "tenant" not in names
        assert "site" not in names


def test_webhook_duplicate_already_processed(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.get_request_header = lambda h: "hook-token"
    fake.request = SimpleNamespace(json={"id": "evt_1", "type": "ping"})
    fake.db.exists = lambda dt, name=None, *a, **k: True if dt == "Integration Webhook Event" else False
    _patch_api(monkeypatch, fake)
    monkeypatch.setenv("EE_INTEGRATION_WEBHOOK_TOKEN", "hook-token")
    monkeypatch.setattr(integrations, "read_secrets", lambda p: {})
    out = integrations.inbound_webhook("google_calendar")
    assert out == {"status": "already_processed"}


def test_webhook_unauthorized(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.get_request_header = lambda h: "wrong"
    fake.request = SimpleNamespace(json={"id": "evt_2"})
    _patch_api(monkeypatch, fake)
    monkeypatch.setenv("EE_INTEGRATION_WEBHOOK_TOKEN", "hook-token")
    monkeypatch.setattr(integrations, "read_secrets", lambda p: {})
    out = integrations.inbound_webhook("google_calendar")
    assert out == {"error": "unauthorized"}
    assert fake.local.response.http_status_code == 401


def test_geocode_empty_without_keys(monkeypatch):
    logs = []
    monkeypatch.setattr(maps, "secrets", lambda p: {})
    monkeypatch.setattr(maps.os, "environ", {})
    monkeypatch.setattr(maps.observe, "log_sync", lambda *a, **k: logs.append(a))
    out = maps.geocode("1 Main Street")
    assert out["geo"] == ""
    assert out["lat"] is None
    assert logs


def test_calendar_skips_when_disconnected(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.db.exists = lambda dt, name=None, *a, **k: dt == "Event Booking"
    fake.get_doc = lambda *a, **k: SimpleNamespace(
        name="BK-1",
        status="confirmed",
        is_template=0,
        event_name="Wedding",
        event_date="2026-09-10",
        start_time="18:00:00",
        end_time="22:00:00",
        venue_address="",
        timezone="America/New_York",
        calendar_sync_id=None,
        meta=SimpleNamespace(has_field=lambda *_: True),
        db_set=lambda *a, **k: None,
    )
    skipped = []
    monkeypatch.setattr(calendar, "frappe", fake)
    monkeypatch.setattr(calendar, "is_enabled", lambda p: False)
    monkeypatch.setattr(calendar.observe, "log_sync", lambda *a, **k: skipped.append(a[2] if len(a) > 2 else k.get("status")))
    calendar.sync_booking("BK-1")
    assert "skipped" in skipped


def test_accounting_skips_when_disconnected(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.db.exists = lambda dt, name=None, *a, **k: dt in ("Sales Invoice", "DocType")
    skipped = []
    monkeypatch.setattr(accounting, "frappe", fake)
    monkeypatch.setattr(accounting, "is_enabled", lambda p: False)
    monkeypatch.setattr(accounting.observe, "log_sync", lambda *a, **k: skipped.append(a))
    accounting.sync_invoice("INV-1")
    assert skipped
    assert all(row[2] == "skipped" for row in skipped)


def test_observe_run_swallows_and_scrubs(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    stored = []
    fake.get_doc = lambda *a, **k: SimpleNamespace(insert=lambda **kw: stored.append(a[0] if a else k))
    monkeypatch.setattr(observe, "frappe", fake)
    monkeypatch.setattr("entertainment_express.integrations.credentials.set_status", lambda *a, **k: stored.append(a))
    out = observe.run("mapbox", "geocode", lambda: (_ for _ in ()).throw(RuntimeError("Authorization: Bearer sk_live")))
    assert out is None
    blob = str(stored)
    assert "sk_live" not in blob
    assert "Bearer" not in blob


def test_http_errors_omit_query_and_never_log_authorization():
    src = inspect.getsource(http.request)
    assert "Authorization" not in src
    assert "url.split('?')[0]" in src


def test_sync_log_append_only():
    src = inspect.getsource(IntegrationSyncLog.before_save)
    assert "append-only" in src
    assert "is_new" in src


def test_apple_youtube_url_routing(monkeypatch):
    monkeypatch.setattr(music, "_apple_tracks", lambda url: [{"title": "Apple Song", "artist": "A"}])
    monkeypatch.setattr(music, "_youtube_tracks", lambda url: [{"title": "YT Song", "artist": "Y"}])
    monkeypatch.setattr(music, "_spotify_tracks", lambda url: [{"title": "Spot", "artist": "S"}])
    apple = music.fetch_playlist_tracks("https://music.apple.com/us/playlist/summer/pl.123")
    yt = music.fetch_playlist_tracks("https://www.youtube.com/playlist?list=PLabc")
    spot = music.fetch_playlist_tracks("https://open.spotify.com/playlist/xyz")
    assert apple[0]["title"] == "Apple Song"
    assert yt[0]["title"] == "YT Song"
    assert spot[0]["title"] == "Spot"


def test_no_cross_site_connect_in_providers():
    files = [
        Path(calendar.__file__),
        Path(maps.__file__),
        Path(accounting.__file__),
        Path(integrations.__file__),
        Path(observe.__file__),
        Path(http.__file__),
    ]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
