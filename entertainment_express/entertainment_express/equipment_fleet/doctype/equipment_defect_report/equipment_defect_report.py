# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class EquipmentDefectReport(Document):
    def validate(self):
        if not self.reported_at:
            self.reported_at = now_datetime()
