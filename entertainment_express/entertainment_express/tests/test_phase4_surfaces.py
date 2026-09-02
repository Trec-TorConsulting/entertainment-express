"""Phase 4 surfaces — packing lookup, guests 403, crew cannot move stock, isolation."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import fleet_ops, portal_fleet


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
        self.db = SimpleNamespace(
            exists=self._exists,
            get_value=self._get_value,
            get_all=lambda *a, **k: [],
            commit=lambda: None,
            set_value=lambda *a, **k: None,
        )
        self._packing_by_booking = {"BK-1": "PL-99"}

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return self.db.get_all(*a, **k)

    def whitelist(self, *a, **k):
        return lambda f: f

    def _exists(self, doctype, name=None):
        return False

    def _get_value(self, doctype, filters=None, fieldname=None, **k):
        if doctype == "Packing List" and isinstance(filters, dict):
            return self._packing_by_booking.get(filters.get("booking"))
        return None


def test_guest_denied_fleet(monkeypatch):
    fake = _Fake([], user="Guest")
    monkeypatch.setattr(portal_fleet, "frappe", fake)
    with pytest.raises(_Perm):
        portal_fleet.list_vehicles()
    with pytest.raises(_Perm):
        portal_fleet.transfer_stock("A", "B", "GLOW", 1)
    with pytest.raises(_Perm):
        portal_fleet.packing_status("BK-1")
    with pytest.raises(_Perm):
        portal_fleet.checkout("BK-1", code="X")


def test_crew_cannot_transfer_or_subrent(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_fleet, "frappe", fake)
    with pytest.raises(_Perm):
        portal_fleet.transfer_stock("A", "B", "GLOW", 1)
    with pytest.raises(_Perm):
        portal_fleet.create_sub_rental("BK-1", "Booth", 1, "Partner", 10)
    with pytest.raises(_Perm):
        portal_fleet.save_vehicle(values={"vehicle_name": "Box"})


def test_packing_name_follows_booking(monkeypatch):
    fake = _Fake(["EE Crew"])
    monkeypatch.setattr(fleet_ops, "frappe", fake)
    assert fleet_ops.packing_name("BK-1") == "PL-99"
    assert fleet_ops.packing_name("BK-missing") is None


def test_packing_status_uses_booking_field(monkeypatch):
    items = [{"item_name": "Booth", "packed": 0}]

    class Doc:
        name = "PL-99"
        status = "ready"

        def as_dict(self):
            return {"items": items}

    fake = _Fake(["EE Crew"])
    fake.get_doc = lambda *a, **k: Doc()
    monkeypatch.setattr(fleet_ops, "frappe", fake)
    monkeypatch.setattr(fleet_ops, "_ops", lambda: None)
    status = fleet_ops.packing_status("BK-1")
    assert status["name"] == "PL-99"
    assert status["booking"] == "BK-1"
    assert status["missing"] == ["Booth"]


def test_no_cross_site_connect():
    files = [Path(fleet_ops.__file__), Path(portal_fleet.__file__)]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
    assert "tenant" not in inspect.getsource(portal_fleet.transfer_stock)


def test_gear_ui_has_fleet_copy():
    owner = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    employee = Path(__file__).resolve().parents[3] / "frontend" / "employee-portal" / "src" / "App.tsx"
    owner_src = owner.read_text(encoding="utf-8")
    emp_src = employee.read_text(encoding="utf-8")
    chunk = owner_src.split("function GearWorkspace")[1].split("function CrudEditor")[0]
    assert "portal_fleet.transfer_stock" in owner_src
    assert "portal_fleet.save_vehicle" in owner_src
    assert "portal_fleet.create_sub_rental" in owner_src
    assert "/app" not in chunk
    assert "portal_fleet.mark_packed" in emp_src
    assert "portal_fleet.checkout" in emp_src
    assert "portal_fleet.report_damage" in emp_src
    assert "fleet_ops.generate_packing_list" not in emp_src
