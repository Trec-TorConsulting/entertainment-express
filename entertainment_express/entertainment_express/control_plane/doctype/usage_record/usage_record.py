# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document


class UsageRecord(Document):
    def before_save(self):
        if not self.is_new() and self.has_value_changed("quantity"):
            import frappe

            frappe.throw("Usage Records are append-only and cannot be amended.")

