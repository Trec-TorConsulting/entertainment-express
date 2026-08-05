"""
Static checks for phase-4 task 7.3 portal K8s reverse-proxy wiring.
"""

from pathlib import Path

REPO = Path(__file__).resolve().parents[3]


def test_www_spa_shells_exist():
    for portal in ("customer", "dispatch"):
        html = REPO / "entertainment_express" / "entertainment_express" / "www" / portal / "index.html"
        py = REPO / "entertainment_express" / "entertainment_express" / "www" / portal / "index.py"
        assert html.is_file(), html
        assert py.is_file(), py
        text = html.read_text()
        assert f'data-portal="{portal}"' in text
        assert "/assets/entertainment_express/" in text


def test_hooks_spa_routes_registered():
    hooks = (REPO / "entertainment_express" / "entertainment_express" / "hooks.py").read_text()
    assert '"/customer"' in hooks or "'/customer'" in hooks
    assert '"/dispatch"' in hooks or "'/dispatch'" in hooks
    assert "customer/<path:app_path>" in hooks
    assert "dispatch/<path:app_path>" in hooks


def test_k8s_portal_ingress_present():
    k8s = (REPO / "k8s-deployment.yaml").read_text()
    assert "customer.entertainment-express.app" in k8s
    assert "dispatch.entertainment-express.app" in k8s
    assert "customer-spa-rewrite" in k8s
    assert "dispatch-spa-rewrite" in k8s
    assert "frappe-python" in k8s
    # API / assets / socket.io must stay on Frappe without SPA rewrite exceptions missing
    assert "socket.io" in k8s
    assert "api(?:/|$)" in k8s or "/api" in k8s


def test_portal_bundles_present_for_shell():
    client = (
        REPO
        / "entertainment_express"
        / "entertainment_express"
        / "public"
        / "client"
        / "main.js"
    )
    dispatch = (
        REPO
        / "entertainment_express"
        / "entertainment_express"
        / "public"
        / "dispatch"
        / "main.js"
    )
    assert client.is_file() and client.stat().st_size > 1000
    assert dispatch.is_file() and dispatch.stat().st_size > 1000
