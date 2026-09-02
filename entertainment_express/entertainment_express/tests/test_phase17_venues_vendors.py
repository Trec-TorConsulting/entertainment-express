"""Phase 17 — venue snapshot, guest 403, hold money strings."""

from types import SimpleNamespace

import pytest

from entertainment_express.api import compliance, venues


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            get_default=lambda *_: "USD",
            set_value=lambda *a, **k: None,
        )
        self.local = SimpleNamespace(request_ip="127.0.0.1")

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace()


def test_guest_denied_waiver_and_hold(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(compliance, "frappe", fake)
    with pytest.raises(_Perm):
        compliance.sign_waiver("W-1", "Guest")
    with pytest.raises(_Perm):
        compliance.place_hold("BK-1", 100)
    with pytest.raises(_Perm):
        compliance.list_my_waivers()


def test_guest_denied_venue_list(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(venues, "frappe", fake)
    with pytest.raises(_Perm):
        venues.list_venues()


def test_venue_snapshot_copies_address():
    booking = SimpleNamespace(venue=None, venue_address="", venue_geo="", meta=SimpleNamespace(has_field=lambda *_: True), load_in_notes="", parking_notes="", power_notes="", noise_curfew="")
    venue = SimpleNamespace(
        name="VEN-1",
        address="1 Main St",
        geo="40, -75",
        load_in_notes="Dock B",
        parking_notes="Lot C",
        power_notes="20A",
        noise_curfew="10pm",
    )

    class Fake:
        def exists(self, dt, name):
            return True

        def get_doc(self, dt, name):
            return venue

    venues.frappe = SimpleNamespace(db=Fake())
    venues.apply_venue_to_booking(booking, "VEN-1")
    assert booking.venue_address == "1 Main St"
    assert booking.load_in_notes == "Dock B"
    assert booking.noise_curfew == "10pm"


def test_hold_amount_is_formatted_string(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(compliance, "frappe", fake)
    monkeypatch.setattr(compliance, "_money", lambda amount: "150.00")
    monkeypatch.setattr(
        "entertainment_express.api.billing.create_damage_hold",
        lambda booking, amount: {"invoice": "SINV-1"},
    )
    result = compliance.place_hold("BK-1", 150)
    assert result["status"] == "held"
    assert result["amount"] == "150.00"


def test_place_hold_does_not_use_float_math_in_source():
    import inspect

    src = inspect.getsource(compliance.place_hold)
    assert "fmt_money" in inspect.getsource(compliance._money)
    assert "round(" not in src
