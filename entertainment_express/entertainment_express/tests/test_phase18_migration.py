"""Phase 18 — CSV move-in, dry-run, guest 403, site-scoped export."""

from __future__ import annotations

import inspect
from types import SimpleNamespace

import pytest

from entertainment_express.api import migration
from entertainment_express.api.migration_presets import PRESETS


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

    def parse_json(self, raw):
        import json

        return json.loads(raw) if raw else {}


def test_guest_denied_import_export_onboarding(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(migration, "frappe", fake)
    with pytest.raises(_Perm):
        migration.start_import("customers", "name,email\nAda,ada@test.local")
    with pytest.raises(_Perm):
        migration.export_csv("customers")
    with pytest.raises(_Perm):
        migration.onboarding()
    with pytest.raises(_Perm):
        migration.list_presets()


def test_import_has_no_tenant_or_site_args():
    for fn in (migration.start_import, migration.export_csv, migration.run_import, migration.onboarding):
        params = inspect.signature(fn).parameters
        assert "tenant" not in params
        assert "site" not in params


def test_honeybook_preset_maps_email():
    assert PRESETS["honeybook"]["customers"]["email"] == "Email"
    assert "djeventplanner" in PRESETS
    assert "checkcherry" in PRESETS
    assert "booqable" in PRESETS


def test_dry_run_does_not_insert_customers(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])

    def boom(*a, **k):
        raise AssertionError("dry-run must not insert")

    fake.get_doc = boom
    monkeypatch.setattr(migration, "frappe", fake)
    reason = migration._import_row(
        "customers",
        {"Email": "ada@test.local", "Full Name": "Ada"},
        {"email": "Email", "name": "Full Name"},
        True,
    )
    assert reason is None


def test_rerun_skips_existing_email(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.db.exists = lambda dt, filters=None, **k: dt == "Customer" and (filters or {}).get("email_id") == "ada@test.local"
    monkeypatch.setattr(migration, "frappe", fake)
    reason = migration._import_row(
        "customers",
        {"email": "ada@test.local", "name": "Ada"},
        {"email": "email", "name": "name"},
        False,
    )
    assert reason == "skip"


def test_bad_row_is_an_error_not_skip(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(migration, "frappe", fake)
    reason = migration._import_row("customers", {"email": "", "name": ""}, {"email": "email", "name": "name"}, False)
    assert reason == "Name or email is required."


def test_export_queries_this_site_only(monkeypatch):
    seen = []
    fake = _Fake(["EE Tenant Admin"])

    def get_all(doctype, filters=None, **k):
        seen.append(dict(filters or {}))
        return [SimpleNamespace(customer_name="Ada", email_id="ada@test.local", mobile_no="")]

    class Exp:
        name = "EXP-1"

        def insert(self, ignore_permissions=True):
            return self

    fake.get_all = get_all
    fake.get_doc = lambda payload, *a, **k: Exp()
    monkeypatch.setattr(migration, "frappe", fake)
    result = migration.export_csv("customers")
    assert "ada@test.local" in result["content"]
    assert result["filename"] == "customers.csv"
    for filters in seen:
        assert "tenant" not in filters
        assert "site" not in filters


def test_onboarding_lists_missing_catalog(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake.db.count = lambda *a, **k: 0
    fake.db.exists = lambda *a, **k: False
    monkeypatch.setattr(migration, "frappe", fake)
    result = migration.onboarding()
    catalog = next(step for step in result["steps"] if step["key"] == "catalog")
    assert catalog["done"] is False
    assert result["complete"] is False


def test_run_import_stores_row_errors(monkeypatch):
    class Job:
        name = "IMP-1"
        target = "customers"
        mapping = '{"email": "email", "name": "name"}'
        source_csv = "name,email\n,\nAda,ada@test.local\n"
        dry_run = 1
        status = "pending"
        rows_total = 0
        rows_ok = 0
        rows_failed = 0
        errors = []

        def save(self, ignore_permissions=True):
            return self

        def set(self, key, value):
            setattr(self, key, value)

        def append(self, key, row):
            self.errors.append(SimpleNamespace(**row))

        def get(self, key, default=None):
            return getattr(self, key, default)

    job = Job()
    fake = _Fake(["EE Tenant Admin"])
    fake.get_doc = lambda *a, **k: job
    monkeypatch.setattr(migration, "frappe", fake)
    result = migration.run_import("IMP-1")
    assert result["rows_failed"] >= 1
    assert result["errors"]
    assert result["dry_run"] is True
    assert job.status == "completed"


def test_package_import_uses_flt():
    src = inspect.getsource(migration._import_row)
    assert "flt(" in src


def test_owner_move_is_not_desk():
    from pathlib import Path

    app = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    text = app.read_text(encoding="utf-8")
    assert 'path="/move"' in text
    assert "EE Import" not in text
    assert "/app" not in text.split("function MoveWorkspace")[1].split("function ")[0]
