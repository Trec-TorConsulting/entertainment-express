# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate, nowdate, date_diff


class SafetyCertificate(Document):
    def validate(self):
        self.update_status()

    def update_status(self):
        if not self.expiry_date:
            return

        today = getdate(nowdate())
        expiry = getdate(self.expiry_date)
        days_left = date_diff(expiry, today)

        if days_left < 0:
            self.status = "Expired"
        elif days_left <= 30:
            self.status = "Expiring Soon"
        else:
            if self.status not in ("Revoked",):
                self.status = "Active"
