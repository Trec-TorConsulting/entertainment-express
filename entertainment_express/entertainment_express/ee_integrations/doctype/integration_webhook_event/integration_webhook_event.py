# Copyright (c) 2026, Trec-Tor Consulting and contributors
import hashlib

from frappe.model.document import Document


class IntegrationWebhookEvent(Document):
    def before_insert(self):
        self.dedupe_key = hashlib.sha256(f"{self.provider}:{self.event_id}".encode()).hexdigest()
