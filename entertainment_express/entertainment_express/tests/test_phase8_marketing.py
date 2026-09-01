"""Phase 8 — campaigns, opt-out skip, guest 403, promo flt."""

from __future__ import annotations

import inspect
from types import SimpleNamespace

import pytest

from entertainment_express.api import engagement


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            get_default=lambda *_: "USD",
            get_single_value=lambda *a, **k: "",
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

    def parse_json(self, raw):
        import json

        return json.loads(raw) if raw else {}


def test_guest_denied_campaign_and_promo(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(engagement, "frappe", fake)
    with pytest.raises(_Perm):
        engagement.send_campaign("C-1")
    with pytest.raises(_Perm):
        engagement.save_promo({"code": "SAVE10", "value": 10})
    with pytest.raises(_Perm):
        engagement.apply_promo("SAVE10")


def test_apis_have_no_tenant_or_site_args():
    for fn in (engagement.send_campaign, engagement.apply_promo, engagement.run_lifecycle, engagement.track):
        params = inspect.signature(fn).parameters
        assert "tenant" not in params
        assert "site" not in params


def test_opt_out_skips_send(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    people = [{"email": "skip@test.local", "customer": "CUST-1"}]

    class Camp:
        name = "C-1"
        campaign_name = "Hello"
        channel = "email"
        segment = "SEG-1"
        subject = "Hi"
        body = "Body"
        sent_count = 0
        skipped_count = 0
        recipients = []

        def set(self, key, value):
            setattr(self, key, value)

        def append(self, key, row):
            self.recipients.append(SimpleNamespace(**row))

        def save(self, ignore_permissions=True):
            return self

        def get(self, key, default=None):
            return getattr(self, key, default)

    camp = Camp()
    fake.get_doc = lambda *a, **k: camp if a and a[0] == "EE Campaign" else SimpleNamespace(match="all_customers", days=365, event_type="")
    monkeypatch.setattr(engagement, "frappe", fake)
    monkeypatch.setattr(engagement, "_audience", lambda *_: people)
    monkeypatch.setattr(engagement, "_ensure_templates", lambda: None)
    monkeypatch.setattr(engagement, "_prefs", lambda *a, **k: {"email_opt_in": 0})
    monkeypatch.setattr(engagement, "_allowed", lambda *a, **k: False)
    sent = {"n": 0}
    monkeypatch.setattr(engagement, "send", lambda *a, **k: sent.__setitem__("n", sent["n"] + 1))
    result = engagement.send_campaign("C-1")
    assert result["skipped"] == 1
    assert result["sent"] == 0
    assert sent["n"] == 0


def test_promo_apply_uses_flt():
    src = inspect.getsource(engagement._apply_promo_doc)
    assert "flt(" in src


def test_owner_grow_is_not_desk():
    from pathlib import Path

    app = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    text = app.read_text(encoding="utf-8")
    assert 'path="/grow"' in text
    chunk = text.split("function GrowWorkspace")[1].split("function SettingsWorkspace")[0]
    assert "/app" not in chunk
    assert "EE Campaign" not in chunk
    assert "EE Segment" not in chunk
