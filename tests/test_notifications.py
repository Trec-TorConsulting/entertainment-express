import unittest
import frappe
from entertainment_express.entertainment_express.notifications import _deliver_channel

class TestNotifications(unittest.TestCase):
    def test_system_email_routing(self):
        # Category 'system' should use 'Notifications' account
        ok, err, mid, provider = _deliver_channel(
            channel="email",
            recipient="test@example.com",
            subject="System Update",
            body="Test system email.",
            text="Test system email.",
            category="system"
        )
        self.assertTrue(ok)
        self.assertEqual(err, "")

    def test_client_operational_email_fallback(self):
        # Without custom account, client_operational should fail with tenant_smtp_not_configured
        # Assuming test DB has no active outgoing custom Email Account
        ok, err, mid, provider = _deliver_channel(
            channel="email",
            recipient="test@example.com",
            subject="Your Quote",
            body="Test quote.",
            text="Test quote.",
            category="client_operational"
        )
        # Should be false
        self.assertFalse(ok)
        self.assertEqual(err, "tenant_smtp_not_configured")

if __name__ == "__main__":
    unittest.main()
