import json
from pathlib import Path
from types import SimpleNamespace
import sys

def _ensure_frappe_stub():
    if "frappe" in sys.modules:
        return
    import types
    stub = types.ModuleType("frappe")
    stub.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    stub.PermissionError = type("PermissionError", (Exception,), {})
    stub.ValidationError = type("ValidationError", (Exception,), {})
    stub._ = lambda s: s
    stub.conf = {}
    stub.local = type("Local", (), {"site": "admin.entx.app"})()
    stub.session = type("Session", (), {"user": "Administrator"})()

    stub.db = type(
        "DB",
        (),
        {
            "get_single_value": lambda *a: None,
            "table_exists": lambda *a: True,
        },
    )()
    sys.modules["frappe"] = stub

_ensure_frappe_stub()

from entertainment_express.security import request_guards


WORKSPACE_JSON = (
    Path(__file__).parent.parent
    / "entertainment_express_core"
    / "workspace"
    / "entertainment_express"
    / "entertainment_express.json"
)


class _FakeDB:
    def __init__(self):
        self.single = {"portal_mode": "enforce"}

    def get_single_value(self, doctype, field):
        if doctype == "EE Portal Settings" and field == "portal_mode":
            return self.single.get("portal_mode")
        return None

    def get_default(self, field):
        return "USD"


class _FakeFrappeRG:
    def __init__(self, roles=None, user="admin@test.local", path="/app/entertainment-express"):
        self._roles = roles or []
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(request=SimpleNamespace(path=path, environ={}), path=path.strip("/"), flags=SimpleNamespace())
        self.flags = SimpleNamespace()
        self.conf = {}
        self.db = _FakeDB()

    def get_roles(self, user):
        return self._roles


def test_super_admin_workspace_json_structure():
    assert WORKSPACE_JSON.exists(), "entertainment_express.json workspace file missing"
    with open(WORKSPACE_JSON, "r") as f:
        data = json.load(f)

    assert data["name"] == "Entertainment Express"
    assert data["doctype"] == "Workspace"

    # Verify roles are restricted to Super Admin / System Manager
    roles = {r["role"] for r in data.get("roles", [])}
    assert "System Manager" in roles
    assert "SaaS Operator" in roles

    # Verify header contains Super Admin Command Center text
    content_str = data.get("content", "")
    assert "Super Admin Command Center" in content_str
    assert "Platform Control & Governance" in content_str

    # Extract all links (DocTypes, URLs, etc.)
    links = data.get("links", [])
    link_targets = {link.get("link_to") for link in links if "link_to" in link}

    expected_control_links = {
        "Tenant",
        "Signup Application",
        "Provisioning Job",
        "Tenant Domain",
        "Marketing Settings",
        "Subscription",
        "Plan",
        "SaaS Invoice",
        "Usage Record",
        "Stripe Processed Event",
        "User",
        "Role",
        "Employee",
        "Customer",
        "EE Crew Role",
        "EE Exchange Listing",
        "Notification Template",
        "EE Portal Settings",
        "/ops",
    }

    for expected in expected_control_links:
        assert expected in link_targets, f"Super Admin link missing from workspace: {expected}"


def test_super_admin_operator_home_route(monkeypatch):
    fake = _FakeFrappeRG(roles=["System Manager", "SaaS Operator"], user="superadmin@entx.app")
    monkeypatch.setattr(request_guards, "frappe", fake)

    assert request_guards.EE_OPERATOR_HOME in {"/app/workspace/entertainment-express", "/app/entertainment-express"}
    assert request_guards.resolve_home_portal("superadmin@entx.app") in {"/app/workspace/entertainment-express", "/app/entertainment-express"}


def test_super_admin_desk_sanitization(monkeypatch):
    fake = _FakeFrappeRG(roles=["System Manager"], path="/app/entertainment-express")
    fake.local.request.__dict__["path"] = "/app/entertainment-express"
    monkeypatch.setattr(request_guards, "frappe", fake)

    request_guards.sanitize_backend_urls()

    # Super Admin accessing /app/entertainment-express should stay on /app/entertainment-express
    assert getattr(fake.local.request, "path") == "/app/entertainment-express"
