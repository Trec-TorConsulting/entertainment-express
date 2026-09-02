# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document
import re
import frappe
from frappe.utils import cint


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


class EEMeetingType(Document):
    def validate(self):
        if not (self.slug or "").strip():
            self.slug = _slug(self.type_name or "") or frappe.generate_hash(length=8)
        self.slug = _slug(self.slug)
        if cint(self.duration_minutes) < 5:
            frappe.throw("Meeting length must be at least 5 minutes.")
