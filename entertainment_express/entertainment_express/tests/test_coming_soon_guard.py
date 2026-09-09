"""
Tests for Coming Soon landing page, security request guard gating, and bypass mechanisms.
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
REQUEST_GUARDS_FILE = ROOT / "security" / "request_guards.py"
HOOKS_FILE = ROOT / "hooks.py"
API_MARKETING_FILE = ROOT / "api" / "marketing.py"
COMING_SOON_PY = ROOT / "www" / "coming_soon.py"
COMING_SOON_HTML = ROOT / "www" / "coming_soon.html"
MARKETING_SETTINGS_JSON = ROOT / "control_plane" / "doctype" / "marketing_settings" / "marketing_settings.json"


def test_coming_soon_files_exist():
    assert COMING_SOON_PY.is_file(), "coming_soon.py must exist"
    assert COMING_SOON_HTML.is_file(), "coming_soon.html must exist"


def test_marketing_settings_schema_has_coming_soon_fields():
    data = json.loads(MARKETING_SETTINGS_JSON.read_text())
    fieldnames = {f.get("fieldname") for f in data.get("fields", [])}
    for expected in [
        "coming_soon_mode",
        "coming_soon_headline",
        "coming_soon_subhead",
        "coming_soon_launch_date",
        "beta_access_passcode",
    ]:
        assert expected in fieldnames, f"Field {expected} missing in Marketing Settings"


def test_request_guards_has_coming_soon_logic():
    text = REQUEST_GUARDS_FILE.read_text()
    assert "COMING_SOON_PATH" in text
    assert "BETA_COOKIE_NAME" in text
    assert "def is_coming_soon_enabled" in text
    assert "def get_beta_passcode" in text
    assert "def has_beta_access" in text
    assert "def enforce_coming_soon" in text


def test_hooks_registers_coming_soon_guard():
    hooks_text = HOOKS_FILE.read_text()
    assert "entertainment_express.security.request_guards.enforce_coming_soon" in hooks_text


def test_marketing_api_allows_waitlist_and_unlock_beta():
    api_text = API_MARKETING_FILE.read_text()
    assert '"waitlist"' in api_text
    assert "def unlock_beta_access" in api_text
    assert "@frappe.whitelist(allow_guest=True)" in api_text


def test_coming_soon_html_elements():
    html_text = COMING_SOON_HTML.read_text()
    assert 'data-lead-type="waitlist"' in html_text
    assert 'id="ee-waitlist-form"' in html_text
    assert 'id="ee-beta-modal"' in html_text
    assert 'id="ee-beta-code-form"' in html_text
    assert "beta_key" in html_text
