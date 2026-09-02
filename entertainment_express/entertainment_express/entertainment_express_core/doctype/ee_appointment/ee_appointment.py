# Copyright (c) 2026, Trec-Tor Consulting and contributors
from frappe.model.document import Document
import frappe


class EEAppointment(Document):
    def validate(self):
        if self.status in ("canceled", "no_show"):
            return
        clash = frappe.db.exists(
            "EE Appointment",
            {
                "staff": self.staff,
                "start": self.start,
                "status": ["in", ["scheduled", "rescheduled"]],
                "name": ["!=", self.name or ""],
            },
        )
        if clash:
            frappe.throw("That time is no longer open.")
