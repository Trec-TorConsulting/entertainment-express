import unittest
from unittest.mock import MagicMock, patch
import frappe
from entertainment_express.api.auth_jwt import issue_token_pair, verify_access_token
from entertainment_express.api.mobile_api_v2 import _extract_bearer
from entertainment_express.security.request_guards import enforce_doc_ownership


class TestSecurityAuditFixes(unittest.TestCase):
    def test_jwt_cookie_extraction(self):
        """Test that _extract_bearer retrieves token from HttpOnly cookie when Authorization header is absent."""
        token_pair = issue_token_pair("test_user@example.com")
        jwt_token = token_pair["access_token"]

        class MockRequest:
            headers = {}
            cookies = {"ee_jwt_token": jwt_token}

        with patch.object(frappe, "request", MockRequest()):
            with patch.object(frappe.local, "request", MockRequest()):
                extracted = _extract_bearer()
                self.assertEqual(extracted, jwt_token)

    def test_idor_enforce_doc_ownership_denied(self):
        """Test that enforce_doc_ownership blocks non-owners from accessing document."""
        with patch.object(frappe, "get_roles", return_value=["EE Customer"]):
            with patch.object(frappe.db, "get_value", side_effect=lambda doctype, docname, field: "owner_user@example.com" if field == "owner" else None):
                with patch.object(frappe.db, "has_column", return_value=True):
                    with self.assertRaises(frappe.PermissionError):
                        enforce_doc_ownership("Quotation", "QTN-00001", user="attacker@example.com")

    def test_idor_enforce_doc_ownership_allowed(self):
        """Test that enforce_doc_ownership permits legitimate owner access."""
        with patch.object(frappe, "get_roles", return_value=["EE Customer"]):
            with patch.object(frappe.db, "get_value", side_effect=lambda doctype, docname, field: "owner_user@example.com" if field == "owner" else None):
                with patch.object(frappe.db, "has_column", return_value=True):
                    # Should not raise exception
                    enforce_doc_ownership("Quotation", "QTN-00001", user="owner_user@example.com")
