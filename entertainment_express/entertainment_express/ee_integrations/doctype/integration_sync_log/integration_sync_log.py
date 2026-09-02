# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document


class IntegrationSyncLog(Document):
    def before_save(self):
        if not self.is_new():
            import frappe

            frappe.throw("Sync logs are append-only and cannot be amended.")
