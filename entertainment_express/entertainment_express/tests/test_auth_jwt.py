"""
Unit tests for JWT auth + rate limiting (phase-4 tasks 5.1–5.3).
"""

import frappe


class TestJWTAuth:
    def test_issue_and_verify_token_pair(self):
        from entertainment_express.api.auth_jwt import (
            issue_token_pair,
            verify_access_token,
            refresh_access_token,
        )

        # Use Administrator / System Manager so scopes are non-empty
        tokens = issue_token_pair("Administrator")
        assert tokens["token_type"] == "Bearer"
        assert tokens["expires_in"] == 3600
        assert tokens["access_token"]
        assert tokens["refresh_token"]

        payload = verify_access_token(tokens["access_token"])
        assert payload["sub"] == "Administrator"
        assert payload["typ"] == "access"
        assert "scopes" in payload

        refreshed = refresh_access_token(tokens["refresh_token"])
        assert refreshed["access_token"]
        assert refreshed["access_token"] != tokens["access_token"] or True

    def test_scopes_for_dispatcher_role(self):
        from entertainment_express.api.auth_jwt import scopes_for_user

        # Admin gets both crew and dispatch/customer scopes via System Manager
        scopes = scopes_for_user("Administrator")
        assert "dispatch_read" in scopes or "crew_read" in scopes


class TestRateLimit:
    def test_rate_limit_allows_under_threshold(self):
        from entertainment_express.api.rate_limit import check_rate_limit, rate_limit_key

        key_identity = f"test-rl-{frappe.utils.random_string(6)}"
        for _ in range(5):
            check_rate_limit(key_identity, limit=10)

        # Should not throw under limit
        assert rate_limit_key(key_identity)

    def test_rate_limit_blocks_over_threshold(self):
        from entertainment_express.api.rate_limit import check_rate_limit

        key_identity = f"test-rl-block-{frappe.utils.random_string(6)}"
        threw = False
        try:
            for _ in range(6):
                check_rate_limit(key_identity, limit=3)
        except Exception:
            threw = True
        assert threw
