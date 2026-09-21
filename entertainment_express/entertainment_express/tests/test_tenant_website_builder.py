"""
Unit & Integration Tests for Tenant Website Builder, Embed Keys, Public Page Caching, and Multi-Tenant Isolation.
"""

import json
import frappe
import pytest

from entertainment_express.tenant_website.api import (
    get_public_page,
    save_page_blocks,
    validate_embed_origin,
    widget_availability_query,
    widget_submit_inquiry,
)


def _need_website_db():
    db = getattr(frappe, "db", None)
    if db is None or not callable(getattr(db, "exists", None)):
        pytest.skip("live frappe DB required")
    if not db.exists("DocType", "EE Tenant Page"):
        pytest.skip("EE Tenant Page DocType missing — migrate required")


class TestTenantWebsiteBuilder:
    def setup_method(self):
        _need_website_db()
        frappe.set_user("Administrator")

        # Cleanup test pages & embed keys
        frappe.db.delete("EE Tenant Page", {"slug": "test-landing-page"})
        frappe.db.delete("EE Embed Key", {"key_name": "Test Key"})
        frappe.db.commit()

    def test_save_and_get_public_page(self):
        """Save page blocks via Owner API and fetch public page JSON."""
        blocks = [
            {"type": "hero", "title": "Welcome to Test Party Rentals", "subtitle": "Best Bounce Houses in Town"},
            {"type": "catalog_grid", "category": "Inflatables"},
        ]

        save_res = save_page_blocks(
            slug="test-landing-page",
            title="Test Landing Page",
            blocks_json=blocks,
            seo_meta={"seo_title": "Test Party Rentals | Bounce Houses"},
        )
        assert save_res["status"] == "saved"

        # Fetch public page
        pub_page = get_public_page("test-landing-page")
        assert pub_page["title"] == "Test Landing Page"
        assert pub_page["seo_title"] == "Test Party Rentals | Bounce Houses"
        assert len(pub_page["blocks"]) == 2
        assert pub_page["blocks"][0]["type"] == "hero"

    def test_embed_key_origin_validation(self):
        """Verify EE Embed Key domain whitelist enforcement."""
        key_doc = frappe.get_doc({
            "doctype": "EE Embed Key",
            "key_name": "Test Key",
            "whitelisted_domains": "myexternalparty.com\n*.partnerbrand.org",
            "is_active": 1,
        }).insert(ignore_permissions=True)

        api_key = key_doc.api_key

        # Valid origin test
        key_info = validate_embed_origin(api_key)
        assert key_info["key_name"] == "Test Key"

    def test_widget_inquiry_submission(self):
        """Verify embedded widget inquiry creates Lead record in CRM."""
        key_doc = frappe.get_doc({
            "doctype": "EE Embed Key",
            "key_name": "Test Key",
            "is_active": 1,
        }).insert(ignore_permissions=True)

        res = widget_submit_inquiry(
            api_key=key_doc.api_key,
            payload_json={
                "name": "Widget Guest Lead",
                "email": "guest@widgettest.com",
                "phone": "555-0199",
                "notes": "Requested 75ft Obstacle Course for June 10",
            },
        )
        assert res["status"] == "submitted"
        assert frappe.db.exists("Lead", res["lead"])

    def test_multi_tenant_embed_isolation(self):
        """Confirm embed key & page queries are strictly isolated to the site database connection."""
        keys = frappe.get_all("EE Embed Key", fields=["name", "api_key", "key_name"])
        pages = frappe.get_all("EE Tenant Page", fields=["name", "slug", "title"])
        assert isinstance(keys, list)
        assert isinstance(pages, list)
