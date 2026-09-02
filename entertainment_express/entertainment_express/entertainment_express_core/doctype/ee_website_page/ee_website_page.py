# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document


class EEWebsitePage(Document):
    def validate(self):
        import re

        route = (self.route or "").strip().lower().strip("/")
        route = re.sub(r"[^a-z0-9\-_]+", "-", route).strip("-") or "page"
        self.route = route
