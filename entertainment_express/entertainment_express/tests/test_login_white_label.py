from pathlib import Path
from entertainment_express.www.branding import update_website_context

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = ROOT / "templates" / "pages"
INCLUDES_DIR = ROOT / "templates" / "includes" / "login"
PUBLIC_CSS = ROOT / "public" / "css"
PUBLIC_JS = ROOT / "public" / "js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_auth_and_system_templates_exist():
    expected_templates = [
        TEMPLATES_DIR / "login.html",
        INCLUDES_DIR / "login.html",
        TEMPLATES_DIR / "update_password.html",
        TEMPLATES_DIR / "404.html",
        TEMPLATES_DIR / "500.html",
        TEMPLATES_DIR / "403.html",
    ]
    for template in expected_templates:
        assert template.exists(), f"Template missing: {template}"


def test_auth_assets_exist():
    assert (PUBLIC_CSS / "ee-auth.css").exists()
    assert (PUBLIC_JS / "ee-auth.js").exists()


def test_frappe_login_dom_contract_preserved():
    login_html = _read(INCLUDES_DIR / "login.html")
    # Form selectors
    assert "form-signin" in login_html
    assert "form-login" in login_html
    assert "form-forgot" in login_html
    assert "form-signup" in login_html
    assert "form-verify" in login_html

    # Input IDs
    assert 'id="login_email"' in login_html
    assert 'id="login_password"' in login_html
    assert 'id="forgot_email"' in login_html
    assert 'id="signup_fullname"' in login_html
    assert 'id="signup_email"' in login_html
    assert 'id="login_token"' in login_html

    # Button classes
    assert "btn-login" in login_html
    assert "btn-forgot" in login_html
    assert "btn-signup" in login_html
    assert "btn-verify" in login_html

    # Password toggle enhancement
    assert "ee-password-toggle" in login_html


def test_update_password_contract_preserved():
    update_html = _read(TEMPLATES_DIR / "update_password.html")
    assert 'id="new_password"' in update_html
    assert 'id="confirm_password"' in update_html
    assert 'id="rule-length"' in update_html
    assert 'id="rule-letter"' in update_html
    assert 'id="rule-number"' in update_html
    assert "ee-password-toggle" in update_html


def test_system_error_pages_contain_recovery_navigation():
    for code, template_name in [("404", "404.html"), ("500", "500.html"), ("403", "403.html")]:
        content = _read(TEMPLATES_DIR / template_name)
        assert f'<div class="ee-system-code">{code}</div>' in content
        assert 'href="/"' in content or "window.location.reload" in content
        assert "ee-system-card" in content


def test_website_context_base_site():
    ctx = {"pathname": "login", "is_base_site": True}
    update_website_context(ctx)

    assert ctx.get("app_name") == "Entertainment Express"
    assert "ee-auth-page" in ctx.get("body_class", "")
    assert "/assets/entertainment_express/css/ee-auth.css" in ctx.get("head_html", "")
    assert "fonts.googleapis.com" in ctx.get("head_html", "")
    assert "--ee-brand:#6d28d9" in ctx.get("head_html", "")


def test_website_context_tenant_white_label(monkeypatch):
    from entertainment_express.white_label import kit as wl_kit

    monkeypatch.setattr(wl_kit, "skip_tenant_kit", lambda: False)
    monkeypatch.setattr(
        wl_kit,
        "effective_kit",
        lambda: {
            "brand_name": "Soundwave Elite DJs",
            "brand_color": "#2563eb",
            "brand_color_secondary": "#1d4ed8",
            "brand_color_bg": "#ffffff",
            "brand_color_text": "#111827",
            "white_label_mode": "full",
            "hide_product_chrome": 1,
            "footer_text": "© 2026 Soundwave Elite DJs",
        },
    )

    ctx = {"pathname": "login"}
    update_website_context(ctx)

    assert ctx.get("app_name") == "Soundwave Elite DJs"
    assert ctx.get("hide_product_chrome") == 1
    assert "ee-hide-product" in ctx.get("body_class", "")
    assert "--ee-brand:#2563eb" in ctx.get("head_html", "")
    assert ctx.get("footer_text") == "© 2026 Soundwave Elite DJs"


def test_auth_dark_mode_contrast_and_inputs():
    css_content = _read(PUBLIC_CSS / "ee-auth.css")
    js_content = _read(PUBLIC_JS / "ee-auth.js")
    login_html = _read(TEMPLATES_DIR / "login.html")
    update_html = _read(TEMPLATES_DIR / "update_password.html")

    # Tokens and high contrast input styling in CSS
    assert "--ee-auth-input-text:" in css_content
    assert "--ee-auth-input-placeholder:" in css_content
    assert "--ee-auth-input-bg: #1e293b;" in css_content
    assert "--ee-auth-input-text: #f8fafc;" in css_content
    assert "::placeholder" in css_content
    assert "-webkit-autofill" in css_content
    assert "ee-auth-theme-toggle" in css_content

    # JS theme persistence and sync
    assert "setupTheme" in js_content
    assert "ee-auth-theme-toggle" in js_content

    # Theme toggle presence in templates
    assert "ee-auth-theme-toggle" in login_html
    assert "ee-auth-theme-toggle" in update_html


def test_full_site_dark_mode_contrast():
    wl_css = _read(PUBLIC_CSS / "ee-white-label.css")
    tenant_home = _read(ROOT / "www" / "tenant_home.html")
    marketing_tokens = _read(ROOT / "public" / "marketing" / "marketing-tokens.css")
    marketing_css = _read(ROOT / "public" / "marketing" / "marketing.css")

    # 1. White-label CSS dark tokens and accessible inputs
    assert "--ee-bg: #0b0f17;" in wl_css
    assert "--ee-panel: #111827;" in wl_css
    assert "--ee-border: #334155;" in wl_css
    assert "--ee-text: #f8fafc;" in wl_css
    assert "--ee-input-bg: #1e293b;" in wl_css
    assert "--ee-input-border: #475569;" in wl_css
    assert ".form-control" in wl_css
    assert "prefers-color-scheme: dark" in wl_css
    assert '[data-theme="dark"]' in wl_css

    # 2. Tenant landing page dark mode
    assert ".ee-landing-wrapper" in tenant_home
    assert "[data-theme=\"dark\"] .ee-form-card" in tenant_home
    assert ".ee-prop-card" in tenant_home
    assert ".ee-package-card" in tenant_home
    assert "background-color: #0b0f17;" in tenant_home

    # 3. Marketing dark mode contrast & placeholder WCAG compliance
    assert "--ee-border: #334155;" in marketing_tokens
    assert ".ee-form input::placeholder" in marketing_css
    assert "color: var(--ee-muted);" in marketing_css

