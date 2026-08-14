import inspect
from types import SimpleNamespace

import pytest

from entertainment_express.security import request_guards
from entertainment_express.api import portal_employee, portal_owner


class _FakeRedirect(Exception):
    pass


class _FakePermissionError(Exception):
    pass


class _FakeDB:
    def __init__(self):
        self.single = {"portal_mode": "enforce"}

    def get_single_value(self, doctype, field):
        if doctype == "EE Portal Settings" and field == "portal_mode":
            return self.single.get("portal_mode")
        return None

    def get_default(self, field):
        if field == "currency":
            return "USD"
        return None


class _FakeFrappeRG:
    Redirect = _FakeRedirect
    PermissionError = _FakePermissionError

    def __init__(self, roles=None, user="user@test.local", path="/app"):
        self._roles = roles or []
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(request=SimpleNamespace(path=path, environ={}), path=path.strip("/"), flags=SimpleNamespace())
        self.flags = SimpleNamespace()
        self.conf = {}
        self.db = _FakeDB()

    def get_roles(self, user):
        return self._roles

    def throw(self, message, exc):
        raise exc(message)


class _FakeFrappeApi:
    PermissionError = _FakePermissionError

    def __init__(self, roles=None, user="user@test.local"):
        self._roles = roles or []
        self.session = SimpleNamespace(user=user)
        self.db = SimpleNamespace(count=lambda *args, **kwargs: 1, get_default=lambda *_: "USD")

    def get_roles(self, user):
        return self._roles

    def throw(self, message, exc):
        raise exc(message)


def test_resolve_home_portal_routes_by_role(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Tenant Admin"])
    monkeypatch.setattr(request_guards, "frappe", fake)
    assert request_guards.EE_OWNER_PORTAL == "/owner"
    assert request_guards.resolve_home_portal("owner@test.local") == "/owner"

    fake = _FakeFrappeRG(roles=["EE Dispatcher"])
    monkeypatch.setattr(request_guards, "frappe", fake)
    assert request_guards.resolve_home_portal("staff@test.local") == request_guards.EE_EMPLOYEE_PORTAL

    fake = _FakeFrappeRG(roles=["System Manager"])
    monkeypatch.setattr(request_guards, "frappe", fake)
    assert request_guards.resolve_home_portal("admin@test.local") == request_guards.EE_OPERATOR_HOME


def test_sanitize_backend_urls_enforce_redirects_owner(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Tenant Admin"], path="/app")
    # Simulate Werkzeug cached_property already resolved to the original Desk path.
    fake.local.request.__dict__["path"] = "/app"
    monkeypatch.setattr(request_guards, "frappe", fake)

    request_guards.sanitize_backend_urls()

    assert fake.local.request.environ["PATH_INFO"] == request_guards.EE_OWNER_PORTAL
    assert getattr(fake.local.request, "path") == request_guards.EE_OWNER_PORTAL


def test_sanitize_app_home_rewrites_owner_to_owner_portal(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Tenant Admin"], path="/app/home")
    fake.local.request.__dict__["path"] = "/app/home"
    monkeypatch.setattr(request_guards, "frappe", fake)

    request_guards.sanitize_backend_urls()

    assert fake.local.request.environ["PATH_INFO"] == "/owner"
    assert getattr(fake.local.request, "path") == "/owner"


def test_rewrite_path_rehydrates_path_attribute(monkeypatch):
    """Popping Werkzeug caches must not leave Request without .path (HTTP 500)."""

    class _Req:
        def __init__(self):
            self.environ = {"PATH_INFO": "/app/home"}
            self.__dict__["path"] = "/app/home"

        @property
        def path(self):
            return self.environ.get("PATH_INFO", "/")

    req = _Req()

    class _Local:
        request = req
        path = "app/home"

    class _Fake:
        local = _Local()

    monkeypatch.setattr(request_guards, "frappe", _Fake())
    request_guards._rewrite_path("/owner")
    assert req.environ["PATH_INFO"] == "/owner"
    assert req.path == "/owner"


def test_sanitize_backend_urls_warn_keeps_owner_on_app(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Tenant Admin"], path="/app")
    fake.db.single["portal_mode"] = "warn"
    monkeypatch.setattr(request_guards, "frappe", fake)

    request_guards.sanitize_backend_urls()

    assert fake.local.request.environ.get("PATH_INFO") not in {request_guards.EE_OWNER_PORTAL, request_guards.EE_EMPLOYEE_PORTAL}


def test_enforce_backend_boundary_blocks_non_super_admin(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Dispatcher"], path="/api/method/frappe.desk.desktop.get_workspace")
    monkeypatch.setattr(request_guards, "frappe", fake)

    with pytest.raises(_FakePermissionError):
        request_guards.enforce_backend_boundary()


def test_require_employee_login_guest_redirects(monkeypatch):
    fake = _FakeFrappeRG(roles=[], user="Guest", path="/employee")
    monkeypatch.setattr(request_guards, "frappe", fake)

    with pytest.raises(_FakeRedirect):
        request_guards.require_employee_login()


def test_portal_employee_denies_non_employee(monkeypatch):
    fake = _FakeFrappeApi(roles=["EE Customer"])
    monkeypatch.setattr(portal_employee, "frappe", fake)

    with pytest.raises(_FakePermissionError):
        portal_employee.get_my_day()


def test_portal_owner_denies_non_owner(monkeypatch):
    fake = _FakeFrappeApi(roles=["EE Sales"])
    monkeypatch.setattr(portal_owner, "frappe", fake)

    with pytest.raises(_FakePermissionError):
        portal_owner.get_owner_dashboard()


def test_owner_cannot_escalate_restricted_roles(monkeypatch):
    fake = _FakeFrappeApi(roles=["EE Tenant Admin"])
    monkeypatch.setattr(portal_owner, "frappe", fake)

    with pytest.raises(_FakePermissionError):
        portal_owner.set_staff_roles("staff@test.local", ["SaaS Operator"])


def test_owner_approval_action_calls_audit(monkeypatch):
    fake = _FakeFrappeApi(roles=["EE Tenant Admin"])
    monkeypatch.setattr(portal_owner, "frappe", fake)

    called = {"seen": False}

    def _fake_audit(action, details):
        called["seen"] = True

    monkeypatch.setattr(portal_owner, "_audit", _fake_audit)

    result = portal_owner.act_on_approval("refund", "Sales Invoice", "SINV-0001", "approved", "ok")

    assert result["ok"] is True
    assert called["seen"] is True


def test_owner_dashboard_money_strings(monkeypatch):
    fake = _FakeFrappeApi(roles=["EE Tenant Admin"])

    fake.db = SimpleNamespace(
        count=lambda *args, **kwargs: 2,
        get_default=lambda *_: "USD",
    )

    monkeypatch.setattr(
        portal_owner,
        "frappe",
        SimpleNamespace(
            get_roles=lambda _u: ["EE Tenant Admin"],
            session=SimpleNamespace(user="owner@test.local"),
            db=fake.db,
            get_all=lambda *args, **kwargs: [{"outstanding_amount": 10, "currency": "USD"}],
            throw=lambda msg, exc: (_ for _ in ()).throw(exc(msg)),
        ),
    )

    payload = portal_owner.get_owner_dashboard()

    assert isinstance(payload["revenue"], str)
    assert isinstance(payload["pipeline_value"], str)
    assert isinstance(payload["outstanding_balance"], str)


def test_portal_api_signatures_no_cross_site_param():
    for fn in [portal_employee.get_my_day, portal_employee.search, portal_owner.get_owner_dashboard, portal_owner.get_financial_overview]:
        params = set(inspect.signature(fn).parameters.keys())
        assert "site" not in params
        assert "tenant" not in params


def test_require_owner_login_denies_employee(monkeypatch):
    fake = _FakeFrappeRG(roles=["EE Sales"], path="/owner")
    monkeypatch.setattr(request_guards, "frappe", fake)

    with pytest.raises(_FakeRedirect):
        request_guards.require_owner_login()

    assert fake.flags.redirect_location == "/employee"


def test_owner_canonical_route_is_owner_not_admin():
    from entertainment_express import hooks

    rules = {(r.get("from_route"), r.get("to_route")) for r in hooks.website_route_rules}
    assert ("/owner/<path:app_path>", "owner") in rules
    assert ("/admin", "owner") not in rules
    assert ("/admin/<path:app_path>", "owner") not in rules
