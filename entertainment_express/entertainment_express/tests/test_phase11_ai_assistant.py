"""Phase 11 — AI assistant: guests 403, no tenant args, degrade, no silent writes."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.ai import llm
from entertainment_express.api import ai


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.conf = {"ee_ai_assistant": 1, "ee_ollama_url": "http://ollama.entertainment-express.svc:11434"}
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            count=lambda *a, **k: 0,
            get_default=lambda *_: "USD",
            get_all=lambda *a, **k: [],
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://acme.test")
        self.whitelist = lambda *a, **k: (lambda f: f)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: None, save=lambda **kw: None, db_set=lambda *a, **k: None, meta=SimpleNamespace(has_field=lambda *_: True), email_id="a@b.c", mobile_no="", status="Open", source="Website", ee_spam_score=0, name="LEAD-1")

    def get_single(self, *a, **k):
        return SimpleNamespace(provider="ollama", model="llama3.2", enabled=1, save=lambda **kw: None)

    def get_meta(self, *a, **k):
        return SimpleNamespace(has_field=lambda *_: False)

    def enqueue(self, *a, **k):
        return None


def test_guest_denied_ask_and_quote(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    monkeypatch.setattr(ai, "frappe", fake)
    with pytest.raises(_Perm):
        ai.ask("who is free")
    with pytest.raises(_Perm):
        ai.suggest_quote(source="inquiry", name="L-1")
    with pytest.raises(_Perm):
        ai.confirm("apply_quote", {"source": "inquiry", "name": "L-1", "selected": []})


def test_crew_denied_ask(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(ai, "frappe", fake)
    with pytest.raises(_Perm):
        ai.ask("what events this weekend")


def test_flag_off_denies(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.conf = {"ee_ai_assistant": 0}
    monkeypatch.setattr(ai, "frappe", fake)
    with pytest.raises(_Perm):
        ai.ask("hello")


def test_no_tenant_or_site_args():
    for fn in (
        ai.status,
        ai.ask,
        ai.suggest_quote,
        ai.forecast,
        ai.suggest_dispatch,
        ai.draft_campaign,
        ai.score_lead,
        ai.confirm,
        ai.save_settings,
    ):
        names = inspect.signature(fn).parameters
        assert "tenant" not in names
        assert "site" not in names


def test_degrade_quote_without_llm(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(ai, "frappe", fake)
    monkeypatch.setattr(ai, "complete", lambda *a, **k: None)
    monkeypatch.setattr(ai, "_log", lambda *a, **k: None)
    result = ai.suggest_quote(source="job", name="BK-1")
    assert result["available"] is False
    assert "AI suggestion unavailable" in result["message"]
    assert "low" in result["range"]


def test_ask_does_not_write_quotes(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    writes = []

    def boom(*a, **k):
        writes.append(1)
        raise AssertionError("must not write")

    fake.get_doc = boom
    monkeypatch.setattr(ai, "frappe", fake)
    monkeypatch.setattr(ai, "complete", lambda *a, **k: None)
    monkeypatch.setattr(ai, "_log", lambda *a, **k: None)
    monkeypatch.setattr(ai, "_weekend_jobs", lambda: [])
    ai.ask("draft a quote")
    assert writes == []


def test_llm_complete_swallows_errors(monkeypatch):
    monkeypatch.setattr(llm, "_settings", lambda: (_ for _ in ()).throw(RuntimeError("down")))
    assert llm.complete("hi") is None


def test_no_cross_site_connect():
    src = Path(ai.__file__).read_text(encoding="utf-8") + Path(llm.__file__).read_text(encoding="utf-8")
    assert "frappe.connect" not in src
    assert "frappe.init" not in src


def test_owner_assistant_not_desk():
    app = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    chunk = app.read_text(encoding="utf-8").split("function AssistantWorkspace")[1].split("function ReportsWorkspace")[0]
    assert "/app" not in chunk
    assert "EE AI" not in chunk
    assert "Assistant" in chunk
    assert "AI suggestion unavailable" in chunk


def test_suggest_package_copy():
    app = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    text = app.read_text(encoding="utf-8")
    assert "Suggest a package" in text
    assert "Draft this campaign" in text


def test_ollama_targets_gpu_node():
    yaml = Path(__file__).resolve().parents[3] / "k8s-deployment.yaml"
    text = yaml.read_text(encoding="utf-8")
    assert "runtimeClassName: nvidia" in text
    assert "key: gpu-only" in text
    deploy = text.split("kind: Deployment\nmetadata:\n  name: ollama")[1].split("kind:")[0]
    assert "node05" in deploy
    assert "NotIn" in text
    assert "- node05" in text


def test_money_uses_flt():
    src = inspect.getsource(ai.suggest_quote) + inspect.getsource(ai._money)
    assert "flt(" in src
    assert "fmt_money" in src
