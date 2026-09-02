"""Phase 6 surfaces — prefs by email, guests 403, crew cannot edit templates."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import portal_notifications
from entertainment_express import notifications


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site="e2esmoke.entx.app")
        self.PermissionError = _Perm
        self.form_dict = {}
        self._prefs = {}
        self._customers = {"client@test.local": "CUST-1"}
        self.db = SimpleNamespace(
            exists=self._exists,
            get_value=self._get_value,
            commit=lambda: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def whitelist(self, *a, **k):
        return lambda f: f

    def _exists(self, doctype, name=None):
        if doctype == "Notification Preference" and isinstance(name, dict):
            key = (name.get("party_type"), name.get("party"))
            return key in self._prefs
        if doctype == "User":
            return False
        return False

    def _get_value(self, doctype, filters=None, fieldname=None, as_dict=False, **k):
        if doctype == "Customer" and isinstance(filters, dict):
            return self._customers.get(filters.get("email_id"))
        if doctype == "User":
            return None
        if doctype == "Employee":
            return None
        if doctype == "Notification Preference" and isinstance(filters, dict):
            key = (filters.get("party_type"), filters.get("party"))
            row = self._prefs.get(key)
            if not row:
                return None
            if as_dict or isinstance(fieldname, (list, tuple)):
                return row
            return "NPREF-1"
        return None


def test_guest_denied_messages(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_notifications, "frappe", fake)
    with pytest.raises(_Perm):
        portal_notifications.list_templates()
    with pytest.raises(_Perm):
        portal_notifications.get_my_preferences()
    with pytest.raises(_Perm):
        portal_notifications.save_template("quote_sent", {"subject": "Hi"})


def test_crew_cannot_edit_templates(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_notifications, "frappe", fake)
    with pytest.raises(_Perm):
        portal_notifications.list_templates()
    with pytest.raises(_Perm):
        portal_notifications.save_template("quote_sent", {"subject": "Hi"})
    with pytest.raises(_Perm):
        portal_notifications.list_recent()


def test_opt_out_matches_customer_email(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    fake._prefs[("Customer", "CUST-1")] = {
        "email_opt_in": 1,
        "sms_opt_in": 0,
        "whatsapp_opt_in": 0,
        "push_opt_in": 0,
        "quiet_hours_start": None,
        "quiet_hours_end": None,
    }
    monkeypatch.setattr(notifications, "frappe", fake)
    prefs = notifications._prefs(None, None, "client@test.local")
    assert prefs["sms_opt_in"] == 0
    assert notifications._allowed("sms", prefs, "transactional") is False
    assert notifications._allowed("email", prefs, "transactional") is True


def test_no_cross_site_connect():
    src = Path(portal_notifications.__file__).read_text(encoding="utf-8")
    assert "frappe.connect" not in src
    assert "frappe.init" not in src


def test_message_ui_copy():
    owner = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    kit = Path(__file__).resolve().parents[3] / "frontend" / "portal-kit" / "src" / "components" / "AccountMenu.tsx"
    owner_src = owner.read_text(encoding="utf-8")
    kit_src = kit.read_text(encoding="utf-8")
    chunk = owner_src.split("function MessageTemplates")[1].split("function JobPlanningPanel")[0]
    assert "portal_notifications.save_template" in owner_src
    assert "portal_notifications.list_recent" in owner_src
    assert "/app" not in chunk
    assert "save_my_preferences" in kit_src
    assert "How we reach you" in kit_src
